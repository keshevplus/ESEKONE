import {Router} from "express";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {memberships,projects} from "../db/schema.js";
import {withAuthorizedWorkspace} from "./workspace-context.js";

export const projectsRouter=Router();
const projectFields={
 name:z.string().trim().min(2).max(160),
 description:z.string().trim().max(10000).nullable().optional(),
 status:z.enum(["planned","active","on_hold","completed","archived"]),
 ownerUserId:z.string().uuid().nullable().optional(),
 startAt:z.string().datetime().nullable().optional(),
 dueAt:z.string().datetime().nullable().optional()
};
export const createProjectInput=z.object({...projectFields,status:z.enum(["planned","active"]).default("planned")}).strict();
export const updateProjectInput=z.object({...projectFields}).partial().strict().refine(v=>Object.keys(v).length>0,"At least one field is required");

projectsRouter.get("/:workspaceId/projects",async(req,res)=>{
 const query=z.object({status:z.enum(["planned","active","on_hold","completed","archived"]).optional(),limit:z.coerce.number().int().min(1).max(100).default(50),offset:z.coerce.number().int().min(0).default(0)}).safeParse(req.query);
 if(!query.success)return res.status(400).json({error:"invalid_query"});
 return withAuthorizedWorkspace(req,res,async tx=>{
  const filters=[eq(projects.workspaceId,req.params.workspaceId)];
  if(query.data.status)filters.push(eq(projects.status,query.data.status));
  const items=await tx.select().from(projects).where(and(...filters)).orderBy(desc(projects.updatedAt)).limit(query.data.limit).offset(query.data.offset);
  return {items,limit:query.data.limit,offset:query.data.offset};
 });
});

projectsRouter.post("/:workspaceId/projects",async(req,res)=>{
 const input=createProjectInput.safeParse(req.body);
 if(!input.success)return res.status(400).json({error:"invalid_project",details:input.error.flatten()});
 return withAuthorizedWorkspace(req,res,async(tx,userId,workspaceId)=>{
  if(input.data.ownerUserId){
   const [owner]=await tx.select({id:memberships.id}).from(memberships).where(and(eq(memberships.workspaceId,workspaceId),eq(memberships.userId,input.data.ownerUserId),eq(memberships.status,"active"))).limit(1);
   if(!owner)return {conflict:true,error:"owner_not_in_workspace"};
  }
  const [project]=await tx.insert(projects).values({
   workspaceId,createdByUserId:userId,...input.data,
   startAt:input.data.startAt?new Date(input.data.startAt):null,
   dueAt:input.data.dueAt?new Date(input.data.dueAt):null
  }).returning();
  return {project};
 },true);
});

projectsRouter.get("/:workspaceId/projects/:projectId",async(req,res)=>{
 const projectId=z.string().uuid().safeParse(req.params.projectId);
 if(!projectId.success)return res.status(400).json({error:"invalid_project_id"});
 return withAuthorizedWorkspace(req,res,async tx=>{
  const [project]=await tx.select().from(projects).where(and(eq(projects.id,projectId.data),eq(projects.workspaceId,req.params.workspaceId))).limit(1);
  return project?{project}:{notFound:true};
 });
});

projectsRouter.patch("/:workspaceId/projects/:projectId",async(req,res)=>{
 const projectId=z.string().uuid().safeParse(req.params.projectId);
 if(!projectId.success)return res.status(400).json({error:"invalid_project_id"});
 const input=updateProjectInput.safeParse(req.body);
 if(!input.success)return res.status(400).json({error:"invalid_project",details:input.error.flatten()});
 return withAuthorizedWorkspace(req,res,async(tx,_userId,workspaceId)=>{
  if(input.data.ownerUserId){
   const [owner]=await tx.select({id:memberships.id}).from(memberships).where(and(eq(memberships.workspaceId,workspaceId),eq(memberships.userId,input.data.ownerUserId),eq(memberships.status,"active"))).limit(1);
   if(!owner)return {conflict:true,error:"owner_not_in_workspace"};
  }
  const changes:any={...input.data,updatedAt:new Date()};
  if(input.data.startAt!==undefined)changes.startAt=input.data.startAt?new Date(input.data.startAt):null;
  if(input.data.dueAt!==undefined)changes.dueAt=input.data.dueAt?new Date(input.data.dueAt):null;
  const [project]=await tx.update(projects).set(changes).where(and(eq(projects.id,projectId.data),eq(projects.workspaceId,workspaceId))).returning();
  return project?{project}:{notFound:true};
 },true);
});
