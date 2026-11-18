import test from "node:test";
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {generateKeyPair,exportJWK,SignJWT} from "jose";

test("PostgreSQL RLS isolates workspace onboarding and contacts across tenants",async()=>{
 process.env.NODE_ENV="test";
 process.env.VERCEL="1";
 assert.ok(process.env.DATABASE_URL,"DATABASE_URL must point to the restricted integration-test role");
 assert.ok(process.env.DATABASE_MIGRATION_URL,"DATABASE_MIGRATION_URL must point to the schema-owner role");
 assert.equal(process.env.DATABASE_APP_ROLE,"esekone_app");
 const {privateKey,publicKey}=await generateKeyPair("RS256");
 const jwk=await exportJWK(publicKey);
 Object.assign(jwk,{kid:"esekone-integration-key",alg:"RS256",use:"sig"});
 const jwksServer=createServer((_req,res)=>{
  res.writeHead(200,{"content-type":"application/json","cache-control":"no-store"});
  res.end(JSON.stringify({keys:[jwk]}));
 });
 await new Promise<void>(resolve=>jwksServer.listen(0,"127.0.0.1",resolve));
 const jwksAddress=jwksServer.address();
 assert.ok(jwksAddress&&typeof jwksAddress!=="string");
 const issuer="http://127.0.0.1:"+jwksAddress.port+"/issuer";
 const audience="esekone-integration";
 process.env.OIDC_ISSUER=issuer;
 process.env.OIDC_AUDIENCE=audience;
 process.env.OIDC_JWKS_URL="http://127.0.0.1:"+jwksAddress.port+"/jwks";
 const {default:app}=await import("../src/server.js");
 const {closeDatabase}=await import("../src/db/client.js");
 const httpServer=app.listen(0);
 await new Promise<void>(resolve=>httpServer.once("listening",resolve));
 const address=httpServer.address();
 assert.ok(address&&typeof address!=="string");
 const base="http://127.0.0.1:"+address.port;
 async function token(subject:string,email:string){
  return new SignJWT({email,email_verified:true,name:email.split("@")[0]})
   .setProtectedHeader({alg:"RS256",kid:"esekone-integration-key"})
   .setIssuer(issuer).setAudience(audience).setSubject(subject)
   .setIssuedAt().setExpirationTime("5m").sign(privateKey);
 }
 async function request(path:string,bearer:string,method="GET",body?:unknown){
  return fetch(base+path,{method,headers:{
   Authorization:"Bearer "+bearer,
   ...(body?{"content-type":"application/json"}:{})
  },body:body?JSON.stringify(body):undefined});
 }
 try{
  const tokenA=await token("identity-user-a","user-a@example.test");
  const tokenB=await token("identity-user-b","user-b@example.test");
  const createA=await request("/v1/onboarding/workspaces",tokenA,"POST",{
   organizationName:"Tenant A",organizationSlug:"tenant-a",
   workspaceName:"Tenant A Workspace",workspaceSlug:"tenant-a"
  });
  assert.equal(createA.status,201,await createA.clone().text());
  const a=await createA.json() as {workspace:{id:string}};
  const createB=await request("/v1/onboarding/workspaces",tokenB,"POST",{
   organizationName:"Tenant B",organizationSlug:"tenant-b",
   workspaceName:"Tenant B Workspace",workspaceSlug:"tenant-b"
  });
  assert.equal(createB.status,201,await createB.clone().text());
  const b=await createB.json() as {workspace:{id:string}};
  const me=await request("/v1/me",tokenA);
  assert.equal(me.status,200);
  const meBody=await me.json() as {workspaces:Array<{workspaceId:string}>};
  assert.deepEqual(meBody.workspaces.map(w=>w.workspaceId),[a.workspace.id]);
  const createContact=await request("/v1/workspaces/"+a.workspace.id+"/contacts",tokenA,"POST",{fullName:"A Contact"});
  assert.equal(createContact.status,200,await createContact.clone().text());
  const listA=await request("/v1/workspaces/"+a.workspace.id+"/contacts",tokenA);
  assert.equal(listA.status,200);
  const listABody=await listA.json() as {items:Array<{fullName:string}>};
  assert.equal(listABody.items.length,1);
  assert.equal(listABody.items[0].fullName,"A Contact");
  const crossTenantRead=await request("/v1/workspaces/"+a.workspace.id+"/contacts",tokenB);
  assert.equal(crossTenantRead.status,403);
  const crossTenantWrite=await request("/v1/workspaces/"+a.workspace.id+"/contacts",tokenB,"POST",{fullName:"Intruder"});
  assert.equal(crossTenantWrite.status,403);
  const createTask=await request("/v1/workspaces/"+a.workspace.id+"/tasks",tokenA,"POST",{title:"Integration task"});
  assert.equal(createTask.status,200,await createTask.clone().text());
  const createProject=await request("/v1/workspaces/"+a.workspace.id+"/projects",tokenA,"POST",{name:"Integration project",status:"active"});
  assert.equal(createProject.status,200,await createProject.clone().text());
  const overview=await request("/v1/workspaces/"+a.workspace.id+"/overview",tokenA);
  assert.equal(overview.status,200,await overview.clone().text());
  const overviewBody=await overview.json() as {metrics:{contactsTotal:number;customersTotal:number;projectsTotal:number;activeProjects:number;openTasks:number}};
  assert.deepEqual(overviewBody.metrics,{contactsTotal:1,customersTotal:0,projectsTotal:1,activeProjects:1,openTasks:1,tasksDueToday:0});
  const crossTenantOverview=await request("/v1/workspaces/"+a.workspace.id+"/overview",tokenB);
  assert.equal(crossTenantOverview.status,403);
  const isolatedB=await request("/v1/workspaces/"+b.workspace.id+"/contacts",tokenB);
  assert.equal(isolatedB.status,200);
  const isolatedBody=await isolatedB.json() as {items:Array<unknown>};
  assert.equal(isolatedBody.items.length,0);
 }finally{
  await new Promise<void>((resolve,reject)=>httpServer.close(error=>error?reject(error):resolve()));
  await closeDatabase();
  await new Promise<void>(resolve=>jwksServer.close(()=>resolve()));
 }
});
