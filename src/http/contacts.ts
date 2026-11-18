import {Router,type Request,type Response} from "express";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {db} from "../db/client.js";
import {contacts,users} from "../db/schema.js";
import {withWorkspaceContext, WorkspaceAccessDeniedError} from "../db/tenant.js";
import {authenticateAuthorizationHeader,oidcConfigured} from "../auth/oidc.js";

export const contactsRouter=Router();
export const createContact=z.object({
 fullName:z.string().trim().min(1).max(160),
 email:z.string().trim().email().max(254).nullable().optional(),
 phone:z.string().trim().max(40).nullable().optional(),
 company:z.string().trim().max(160).nullable().optional(),
 status:z.enum(["lead","customer","inactive"]).default("lead")
}).strict();
export const updateContact=createContact.partial().refine(v=>Object.keys(v).length>0,"At least one field is required");

async function inWorkspace(req:Request,res:Response,action:(tx:any,userId:string,workspaceId:string)=>Promise<unknown>){
 if(!oidcConfigured)return res.status(503).json({error:"identity_provider_not_configured"});
 if(!db)return res.status(503).json({error:"database_not_configured"});
 let identity;
 try{identity=await authenticateAuthorizationHeader(req.headers.authorization);}catch{return res.status(401).json({error:"invalid_token"});}
 if(!identity)return res.status(401).json({error:"authentication_required"});
 const workspaceId=z.string().uuid().safeParse(req.params.workspaceId);
 if(!workspaceId.success)return res.status(400).json({error:"invalid_workspace_id"});
 try{
  const [user]=await db.select().from(users).where(and(eq(users.identitySubject,identity.subject),eq(users.active,true))).limit(1);
  if(!user)return res.status(403).json({error:"account_not_provisioned"});
  const result=await withWorkspaceContext(workspaceId.data,user.id,tx=>action(tx,user.id,workspaceId.data));
  if(result&&typeof result==="object"&&"notFound" in result)return res.status(404).json(result);
  if(result&&typeof result==="object"&&"conflict" in result)return res.status(409).json(result);
  return res.json(result);
 }catch(error){
  if(error instanceof WorkspaceAccessDeniedError)return res.status(403).json({error:error.code});
  const requestId=res.locals.requestId;
  console.error("Workspace request failed",requestId,error instanceof Error?error.message:"unknown");
  return res.status(500).json({error:"request_failed",requestId});
 }
}

contactsRouter.get("/:workspaceId/contacts",async(req,res)=>{
 const pagination=z.object({limit:z.coerce.number().int().min(1).max(100).default(50),offset:z.coerce.number().int().min(0).default(0)}).safeParse(req.query);
 if(!pagination.success)return res.status(400).json({error:"invalid_pagination"});
 return inWorkspace(req,res,async tx=>{
  const rows=await tx.select().from(contacts).where(eq(contacts.workspaceId,req.params.workspaceId)).orderBy(desc(contacts.createdAt)).limit(pagination.data.limit).offset(pagination.data.offset);
  return {items:rows,limit:pagination.data.limit,offset:pagination.data.offset};
 });
});

contactsRouter.post("/:workspaceId/contacts",async(req,res)=>{
 const input=createContact.safeParse(req.body);
 if(!input.success)return res.status(400).json({error:"invalid_contact",details:input.error.flatten()});
 return inWorkspace(req,res,async tx=>{
  const [created]=await tx.insert(contacts).values({workspaceId:req.params.workspaceId,...input.data}).returning();
  return {contact:created};
 });
});

contactsRouter.patch("/:workspaceId/contacts/:contactId",async(req,res)=>{
 const workspace=z.string().uuid().safeParse(req.params.workspaceId),contactId=z.string().uuid().safeParse(req.params.contactId);
 if(!workspace.success||!contactId.success)return res.status(400).json({error:"invalid_resource_id"});
 const input=updateContact.safeParse(req.body);
 if(!input.success)return res.status(400).json({error:"invalid_contact",details:input.error.flatten()});
 return inWorkspace(req,res,async tx=>{
  const [updated]=await tx.update(contacts).set({...input.data,updatedAt:new Date()})
   .where(and(eq(contacts.id,contactId.data),eq(contacts.workspaceId,workspace.data))).returning();
  if(!updated)return {notFound:true};
  return {contact:updated};
 });
});

contactsRouter.delete("/:workspaceId/contacts/:contactId",async(req,res)=>{
 const workspace=z.string().uuid().safeParse(req.params.workspaceId),contactId=z.string().uuid().safeParse(req.params.contactId);
 if(!workspace.success||!contactId.success)return res.status(400).json({error:"invalid_resource_id"});
 return inWorkspace(req,res,async tx=>{
  const [deleted]=await tx.delete(contacts).where(and(eq(contacts.id,contactId.data),eq(contacts.workspaceId,workspace.data))).returning({id:contacts.id});
  return {deleted:Boolean(deleted)};
 });
});
