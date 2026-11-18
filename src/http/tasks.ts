import {Router,type Request,type Response} from "express";
import {and,desc,eq} from "drizzle-orm";
import {z} from "zod";
import {agentRequests,memberships,projects,workItemEvents,workItems} from "../db/schema.js";
import {withAuthorizedWorkspace,canWriteRole} from "./workspace-context.js";

export const tasksRouter=Router();
const statuses=["backlog","ready","in_progress","blocked","review","testing","done"] as const;
const priorities=["low","normal","high","urgent"] as const;
const workItemFields={
 title:z.string().trim().min(1).max(200),
 description:z.string().trim().max(10000).nullable().optional(),
 status:z.enum(statuses).default("backlog"),
 priority:z.enum(priorities).default("normal"),
 dueAt:z.string().datetime().nullable().optional(),
 assignedUserId:z.string().uuid().nullable().optional(),
 assignedAgent:z.string().trim().min(1).max(80).nullable().optional(),
 projectId:z.string().uuid().nullable().optional(),
 acceptanceCriteria:z.string().trim().max(10000).nullable().optional(),
 latestEvidence:z.string().trim().max(12000).nullable().optional(),
 nextAction:z.string().trim().max(2000).nullable().optional()
};
export const createWorkItem=z.object({...workItemFields,status:z.enum(["backlog","ready"]).default("backlog")}).strict();
export const updateWorkItem=z.object({...workItemFields,status:z.enum(statuses).optional()}).partial().strict().refine(v=>Object.keys(v).length>0,"At least one field is required");
export const createAgentRequest=z.object({
 prompt:z.string().trim().min(8).max(12000),
 agentKey:z.string().trim().min(1).max(80).default("admin")
}).strict();
export const allowedStatusTransitions:Record<string,string[]>={
 backlog:["ready","in_progress","blocked"],
 ready:["in_progress","blocked"],
 in_progress:["blocked","review","testing"],
 blocked:["ready","in_progress"],
 review:["in_progress","testing"],
 testing:["in_progress","done"],
 done:["in_progress"]
};

export function canTransitionWorkItem(from:string,to:string){return from===to||(allowedStatusTransitions[from]??[]).includes(to);}

tasksRouter.get("/:workspaceId/tasks",async(req,res)=>{
 const query=z.object({status:z.enum(statuses).optional(),assignedUserId:z.string().uuid().optional(),projectId:z.string().uuid().optional(),limit:z.coerce.number().int().min(1).max(100).default(50),offset:z.coerce.number().int().min(0).default(0)}).safeParse(req.query);
 if(!query.success)return res.status(400).json({error:"invalid_query"});
 return withAuthorizedWorkspace(req,res,async tx=>{
  const filters=[eq(workItems.workspaceId,req.params.workspaceId)];
  if(query.data.status)filters.push(eq(workItems.status,query.data.status));
  if(query.data.assignedUserId)filters.push(eq(workItems.assignedUserId,query.data.assignedUserId));
  if(query.data.projectId)filters.push(eq(workItems.projectId,query.data.projectId));
  const items=await tx.select().from(workItems).where(and(...filters)).orderBy(desc(workItems.updatedAt)).limit(query.data.limit).offset(query.data.offset);
  return {items,limit:query.data.limit,offset:query.data.offset};
 });
});

tasksRouter.post("/:workspaceId/tasks",async(req,res)=>{
 const input=createWorkItem.safeParse(req.body);
 if(!input.success)return res.status(400).json({error:"invalid_task",details:input.error.flatten()});
 return withAuthorizedWorkspace(req,res,async(tx,userId,workspaceId)=>{
  if(input.data.projectId){
   const [project]=await tx.select({id:projects.id}).from(projects).where(and(eq(projects.id,input.data.projectId),eq(projects.workspaceId,workspaceId))).limit(1);
   if(!project)return {conflict:true,error:"project_not_in_workspace"};
  }
  if(input.data.assignedUserId){
   const [assignee]=await tx.select({id:memberships.id}).from(memberships).where(and(eq(memberships.workspaceId,workspaceId),eq(memberships.userId,input.data.assignedUserId),eq(memberships.status,"active"))).limit(1);
   if(!assignee)return {conflict:true,error:"assignee_not_in_workspace"};
  }
  const [item]=await tx.insert(workItems).values({workspaceId,createdByUserId:userId,...input.data,dueAt:input.data.dueAt?new Date(input.data.dueAt):null}).returning();
  await tx.insert(workItemEvents).values({workspaceId,workItemId:item.id,actorUserId:userId,eventType:"created",toStatus:item.status,detail:"Work item created"});
  return {item};
 },true);
});

tasksRouter.get("/:workspaceId/tasks/:taskId",async(req,res)=>{
 const task=z.string().uuid().safeParse(req.params.taskId);
 if(!task.success)return res.status(400).json({error:"invalid_task_id"});
 return withAuthorizedWorkspace(req,res,async tx=>{
  const [item]=await tx.select().from(workItems).where(and(eq(workItems.id,task.data),eq(workItems.workspaceId,req.params.workspaceId))).limit(1);
  return item?{item}:{notFound:true};
 });
});

tasksRouter.patch("/:workspaceId/tasks/:taskId",async(req,res)=>{
 const workspace=z.string().uuid().safeParse(req.params.workspaceId),task=z.string().uuid().safeParse(req.params.taskId);
 if(!workspace.success||!task.success)return res.status(400).json({error:"invalid_resource_id"});
 const input=updateWorkItem.safeParse(req.body);
 if(!input.success)return res.status(400).json({error:"invalid_task",details:input.error.flatten()});
 return withAuthorizedWorkspace(req,res,async(tx,userId,workspaceId)=>{
  const [current]=await tx.select().from(workItems).where(and(eq(workItems.id,task.data),eq(workItems.workspaceId,workspaceId))).limit(1);
  if(!current)return {notFound:true};
  if(input.data.projectId){
   const [project]=await tx.select({id:projects.id}).from(projects).where(and(eq(projects.id,input.data.projectId),eq(projects.workspaceId,workspaceId))).limit(1);
   if(!project)return {conflict:true,error:"project_not_in_workspace"};
  }
  if(input.data.assignedUserId){
   const [assignee]=await tx.select({id:memberships.id}).from(memberships).where(and(eq(memberships.workspaceId,workspaceId),eq(memberships.userId,input.data.assignedUserId),eq(memberships.status,"active"))).limit(1);
   if(!assignee)return {conflict:true,error:"assignee_not_in_workspace"};
  }
  if(input.data.status&&input.data.status!==current.status&&!canTransitionWorkItem(current.status,input.data.status))
   return {conflict:true,error:"invalid_status_transition",from:current.status,to:input.data.status,allowed:allowedStatusTransitions[current.status]??[]};
  const changes:any={...input.data,updatedAt:new Date()};
  if(input.data.dueAt!==undefined)changes.dueAt=input.data.dueAt?new Date(input.data.dueAt):null;
  const [item]=await tx.update(workItems).set(changes).where(and(eq(workItems.id,task.data),eq(workItems.workspaceId,workspaceId))).returning();
  if(input.data.status&&input.data.status!==current.status)
   await tx.insert(workItemEvents).values({workspaceId,workItemId:item.id,actorUserId:userId,eventType:"status_changed",fromStatus:current.status,toStatus:item.status,detail:"Status changed"});
  return {item};
 },true);
});

tasksRouter.post("/:workspaceId/tasks/:taskId/agent-requests",async(req,res)=>{
 const workspace=z.string().uuid().safeParse(req.params.workspaceId),task=z.string().uuid().safeParse(req.params.taskId);
 if(!workspace.success||!task.success)return res.status(400).json({error:"invalid_resource_id"});
 const input=createAgentRequest.safeParse(req.body);
 if(!input.success)return res.status(400).json({error:"invalid_agent_request",details:input.error.flatten()});
 return withAuthorizedWorkspace(req,res,async(tx,userId,workspaceId)=>{
  const [item]=await tx.select({id:workItems.id}).from(workItems).where(and(eq(workItems.id,task.data),eq(workItems.workspaceId,workspaceId))).limit(1);
  if(!item)return {notFound:true};
  const [request]=await tx.insert(agentRequests).values({workspaceId,workItemId:item.id,requestedByUserId:userId,agentKey:input.data.agentKey,prompt:input.data.prompt,status:"queued"}).returning();
  await tx.insert(workItemEvents).values({workspaceId,workItemId:item.id,actorUserId:userId,eventType:"agent_request_queued",detail:"Request "+request.id+" queued for "+request.agentKey});
  return {request:{id:request.id,status:request.status,agentKey:request.agentKey,createdAt:request.createdAt},message:"Request queued. An agent worker must claim it before work begins."};
 },true);
});

tasksRouter.get("/:workspaceId/tasks/:taskId/agent-requests",async(req,res)=>{
 const task=z.string().uuid().safeParse(req.params.taskId);
 if(!task.success)return res.status(400).json({error:"invalid_task_id"});
 return withAuthorizedWorkspace(req,res,async tx=>{
  const [item]=await tx.select({id:workItems.id}).from(workItems).where(and(eq(workItems.id,task.data),eq(workItems.workspaceId,req.params.workspaceId))).limit(1);
  if(!item)return {notFound:true};
  const requests=await tx.select({id:agentRequests.id,agentKey:agentRequests.agentKey,status:agentRequests.status,prompt:agentRequests.prompt,resultSummary:agentRequests.resultSummary,createdAt:agentRequests.createdAt,startedAt:agentRequests.startedAt,completedAt:agentRequests.completedAt}).from(agentRequests).where(and(eq(agentRequests.workspaceId,req.params.workspaceId),eq(agentRequests.workItemId,task.data))).orderBy(desc(agentRequests.createdAt)).limit(50);
  return {requests};
 });
});

tasksRouter.get("/:workspaceId/tasks/:taskId/events",async(req,res)=>{
 const task=z.string().uuid().safeParse(req.params.taskId);
 if(!task.success)return res.status(400).json({error:"invalid_task_id"});
 return withAuthorizedWorkspace(req,res,async(tx,_userId,workspaceId)=>{
  const events=await tx.select().from(workItemEvents).where(and(eq(workItemEvents.workspaceId,workspaceId),eq(workItemEvents.workItemId,task.data))).orderBy(desc(workItemEvents.createdAt)).limit(100);
  return {events};
 });
});
