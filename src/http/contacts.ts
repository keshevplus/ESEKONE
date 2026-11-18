import {Router,type Request,type Response} from "express";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {contacts} from "../db/schema.js";
import {withAuthorizedWorkspace} from "./workspace-context.js";

export const contactsRouter=Router();
export const createContact=z.object({
 fullName:z.string().trim().min(1).max(160),
 email:z.string().trim().email().max(254).nullable().optional(),
 phone:z.string().trim().max(40).nullable().optional(),
 company:z.string().trim().max(160).nullable().optional(),
 status:z.enum(["lead","customer","inactive"]).default("lead")
}).strict();
export const updateContact=createContact.partial().refine(v=>Object.keys(v).length>0,"At least one field is required");

contactsRouter.get("/:workspaceId/contacts",async(req,res)=>{
 const pagination=z.object({limit:z.coerce.number().int().min(1).max(100).default(50),offset:z.coerce.number().int().min(0).default(0)}).safeParse(req.query);
 if(!pagination.success)return res.status(400).json({error:"invalid_pagination"});
 return withAuthorizedWorkspace(req,res,async tx=>{
  const rows=await tx.select().from(contacts).where(eq(contacts.workspaceId,req.params.workspaceId)).orderBy(desc(contacts.createdAt)).limit(pagination.data.limit).offset(pagination.data.offset);
  return {items:rows,limit:pagination.data.limit,offset:pagination.data.offset};
 });
});

contactsRouter.post("/:workspaceId/contacts",async(req,res)=>{
 const input=createContact.safeParse(req.body);
 if(!input.success)return res.status(400).json({error:"invalid_contact",details:input.error.flatten()});
 return withAuthorizedWorkspace(req,res,async tx=>{
  const [created]=await tx.insert(contacts).values({workspaceId:req.params.workspaceId,...input.data}).returning();
  return {contact:created};
 },true);
});

contactsRouter.patch("/:workspaceId/contacts/:contactId",async(req,res)=>{
 const workspace=z.string().uuid().safeParse(req.params.workspaceId),contactId=z.string().uuid().safeParse(req.params.contactId);
 if(!workspace.success||!contactId.success)return res.status(400).json({error:"invalid_resource_id"});
 const input=updateContact.safeParse(req.body);
 if(!input.success)return res.status(400).json({error:"invalid_contact",details:input.error.flatten()});
 return withAuthorizedWorkspace(req,res,async tx=>{
  const [updated]=await tx.update(contacts).set({...input.data,updatedAt:new Date()})
   .where(and(eq(contacts.id,contactId.data),eq(contacts.workspaceId,workspace.data))).returning();
  if(!updated)return {notFound:true};
  return {contact:updated};
 },true).then(result=>{
  if(res.headersSent)return result;
  return result;
 });
});

contactsRouter.delete("/:workspaceId/contacts/:contactId",async(req,res)=>{
 const workspace=z.string().uuid().safeParse(req.params.workspaceId),contactId=z.string().uuid().safeParse(req.params.contactId);
 if(!workspace.success||!contactId.success)return res.status(400).json({error:"invalid_resource_id"});
 return withAuthorizedWorkspace(req,res,async tx=>{
  const [deleted]=await tx.delete(contacts).where(and(eq(contacts.id,contactId.data),eq(contacts.workspaceId,workspace.data))).returning({id:contacts.id});
  return {deleted:Boolean(deleted)};
 },true);
});
