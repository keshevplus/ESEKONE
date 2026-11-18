import {Router} from "express";
import {eq} from "drizzle-orm";
import {z} from "zod";
import {db} from "../db/client.js";
import {organizations,memberships,users,workspaces} from "../db/schema.js";
import {withBootstrapContext,withIdentityContext} from "../db/tenant.js";
import {authenticateAuthorizationHeader,oidcConfigured} from "../auth/oidc.js";

export const onboardingRouter=Router();
const slug=z.string().trim().toLowerCase().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const createWorkspaceInput=z.object({
 organizationName:z.string().trim().min(2).max(120),
 organizationSlug:slug,
 workspaceName:z.string().trim().min(2).max(120).optional(),
 workspaceSlug:slug.optional()
}).strict().transform(v=>({
 ...v,
 workspaceName:v.workspaceName??v.organizationName,
 workspaceSlug:v.workspaceSlug??v.organizationSlug
}));

onboardingRouter.post("/workspaces",async(req,res)=>{
 if(!oidcConfigured)return res.status(503).json({error:"identity_provider_not_configured"});
 if(!db)return res.status(503).json({error:"database_not_configured"});
 let identity;
 try{identity=await authenticateAuthorizationHeader(req.headers.authorization);}catch{return res.status(401).json({error:"invalid_token"});}
 if(!identity)return res.status(401).json({error:"verified_identity_required"});
 const input=createWorkspaceInput.safeParse(req.body);
 if(!input.success)return res.status(400).json({error:"invalid_workspace",details:input.error.flatten()});
 try{
  let [user]=await withIdentityContext(identity.subject,tx=>tx.select().from(users).where(eq(users.identitySubject,identity.subject)).limit(1));
  if(!user){
   const email=identity.email.toLowerCase();
   [user]=await withIdentityContext(identity.subject,tx=>tx.insert(users).values({identitySubject:identity.subject,email,displayName:identity.name??null,active:true}).returning());
  }
  if(!user.active)return res.status(403).json({error:"account_disabled"});
  const result=await withBootstrapContext(user.id,async tx=>{
   const [organization]=await tx.insert(organizations).values({name:input.data.organizationName,slug:input.data.organizationSlug}).returning();
   const [workspace]=await tx.insert(workspaces).values({organizationId:organization.id,name:input.data.workspaceName,slug:input.data.workspaceSlug}).returning();
   const [membership]=await tx.insert(memberships).values({workspaceId:workspace.id,userId:user.id,role:"owner",status:"active"}).returning();
   return {organization,workspace,membership};
  });
  return res.status(201).json(result);
 }catch(error){
  const code=(error as {code?:string})?.code;
  if(code==="23505")return res.status(409).json({error:"identity_or_organization_or_workspace_conflict"});
  const requestId=res.locals.requestId;
  console.error("Workspace onboarding failed",requestId,error instanceof Error?error.message:"unknown");
  return res.status(500).json({error:"onboarding_failed",requestId});
 }
});
