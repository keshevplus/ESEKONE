import {createHash,timingSafeEqual} from "node:crypto";
import {Router} from "express";
import {eq} from "drizzle-orm";
import {sql} from "drizzle-orm";
import {z} from "zod";
import {config} from "../config.js";
import {db} from "../db/client.js";
import {agentRequests,workItemEvents,workItems} from "../db/schema.js";
import {withAgentWorkerContext} from "../db/tenant.js";
import {canTransitionWorkItem} from "./tasks.js";

export const agentWorkerRouter=Router();
export const completeAgentRequestInput=z.object({
 resultSummary:z.string().trim().min(1).max(12000),
 evidence:z.string().trim().min(1).max(12000),
 nextAction:z.string().trim().max(2000).nullable().optional(),
 suggestedStatus:z.enum(["blocked","review","testing"])
}).strict();
export const failAgentRequestInput=z.object({
 reason:z.string().trim().min(1).max(1000)
}).strict();

export function isWorkerTokenValid(supplied:string,expected?:string){
 if(!expected||expected.length<32)return false;
 const suppliedHash=createHash("sha256").update(supplied).digest();
 const expectedHash=createHash("sha256").update(expected).digest();
 return timingSafeEqual(suppliedHash,expectedHash)&&supplied.length===expected.length;
}
function workerAuthorized(header?:string){
 return Boolean(header?.startsWith("Bearer ")&&isWorkerTokenValid(header.slice(7),config.AGENT_WORKER_TOKEN));
}
function unavailable(res:any){
 if(!config.agentWorkerConfigured)return res.status(503).json({error:"agent_worker_not_configured"});
 if(!db)return res.status(503).json({error:"database_not_configured"});
 return null;
}

agentWorkerRouter.post("/claim",async(req,res)=>{
 const missing=unavailable(res);if(missing)return missing;
 if(!workerAuthorized(req.headers.authorization))return res.status(401).json({error:"invalid_worker_token"});
 try{
  const claimed=await withAgentWorkerContext(async tx=>{
   const leaseSeconds=Math.floor(config.AGENT_WORKER_LEASE_TIMEOUT_MS/1000);
   const expired=await tx.execute(sql`UPDATE agent_requests
    SET status='failed',
        result_summary='Worker lease expired after the maximum number of attempts.',
        completed_at=now()
    WHERE status='running'
      AND started_at < now() - make_interval(secs => ${leaseSeconds})
      AND attempt_count >= max_attempts
    RETURNING id,workspace_id AS "workspaceId",work_item_id AS "workItemId"`);
   for(const request of expired.rows){
    const [item]=await tx.select().from(workItems).where(eq(workItems.id,request.workItemId)).limit(1);
    if(!item)continue;
    const nextStatus=canTransitionWorkItem(item.status,"blocked")?"blocked":item.status;
    const evidence="The agent worker lease expired after the configured retry limit. No completion evidence was received.";
    const nextAction="Review the worker and provider logs, resolve the failure, then retry this task.";
    await tx.update(workItems).set({status:nextStatus,latestEvidence:evidence,nextAction,updatedAt:new Date()}).where(eq(workItems.id,item.id));
    await tx.insert(workItemEvents).values({
     workspaceId:request.workspaceId,workItemId:item.id,eventType:"agent_lease_expired",
     fromStatus:item.status,toStatus:nextStatus,detail:"Agent request "+request.id+" exhausted its worker retry limit."
    });
   }
   const result=await tx.execute(sql`WITH candidate AS (
    SELECT id FROM agent_requests
    WHERE status='queued'
       OR (status='running'
           AND started_at < now() - make_interval(secs => ${leaseSeconds})
           AND attempt_count < max_attempts)
    ORDER BY created_at ASC
    FOR UPDATE SKIP LOCKED LIMIT 1
   )
   UPDATE agent_requests AS request
   SET status='running',started_at=now(),attempt_count=request.attempt_count+1
   FROM candidate WHERE request.id=candidate.id
   RETURNING request.id,request.workspace_id AS "workspaceId",
    request.work_item_id AS "workItemId",request.agent_key AS "agentKey",
    request.prompt,request.created_at AS "createdAt",
    request.attempt_count AS "attemptCount",request.max_attempts AS "maxAttempts"`);
   const request=result.rows[0];
   if(!request)return null;
   const [item]=await tx.select({
    id:workItems.id,title:workItems.title,description:workItems.description,
    status:workItems.status,priority:workItems.priority,
    acceptanceCriteria:workItems.acceptanceCriteria,
    latestEvidence:workItems.latestEvidence,nextAction:workItems.nextAction
   }).from(workItems).where(eq(workItems.id,request.workItemId)).limit(1);
   return {request,workItem:item??null};
  });
  return res.json({claimed:Boolean(claimed),job:claimed});
 }catch(error){
  const requestId=res.locals.requestId;
  console.error("Agent claim failed",requestId,error instanceof Error?error.message:"unknown");
  return res.status(500).json({error:"agent_claim_failed",requestId});
 }
});

agentWorkerRouter.post("/:requestId/complete",async(req,res)=>{
 const missing=unavailable(res);if(missing)return missing;
 if(!workerAuthorized(req.headers.authorization))return res.status(401).json({error:"invalid_worker_token"});
 const requestId=z.string().uuid().safeParse(req.params.requestId);
 if(!requestId.success)return res.status(400).json({error:"invalid_request_id"});
 const input=completeAgentRequestInput.safeParse(req.body);
 if(!input.success)return res.status(400).json({error:"invalid_agent_result",details:input.error.flatten()});
 try{
  const outcome=await withAgentWorkerContext(async tx=>{
   const [request]=await tx.select().from(agentRequests).where(eq(agentRequests.id,requestId.data)).limit(1);
   if(!request)return {notFound:true};
   if(request.status!=="running")return {conflict:true,error:"request_not_running"};
   const [item]=await tx.select().from(workItems).where(eq(workItems.id,request.workItemId)).limit(1);
   if(!item)return {notFound:true};
   if(!canTransitionWorkItem(item.status,input.data.suggestedStatus))
    return {conflict:true,error:"invalid_status_transition",from:item.status,to:input.data.suggestedStatus};
   const now=new Date();
   await tx.update(agentRequests).set({status:"completed",resultSummary:input.data.resultSummary,completedAt:now}).where(eq(agentRequests.id,request.id));
   await tx.update(workItems).set({
    status:input.data.suggestedStatus,latestEvidence:input.data.evidence,
    nextAction:input.data.nextAction??null,updatedAt:now
   }).where(eq(workItems.id,item.id));
   await tx.insert(workItemEvents).values({
    workspaceId:request.workspaceId,workItemId:item.id,eventType:"agent_completed",
    fromStatus:item.status,toStatus:input.data.suggestedStatus,
    detail:input.data.resultSummary
   });
   return {requestId:request.id,workItemId:item.id,requestStatus:"completed",workItemStatus:input.data.suggestedStatus};
  });
  if("notFound" in outcome)return res.status(404).json(outcome);
  if("conflict" in outcome)return res.status(409).json(outcome);
  return res.json(outcome);
 }catch(error){
  const requestIdHeader=res.locals.requestId;
  console.error("Agent completion failed",requestIdHeader,error instanceof Error?error.message:"unknown");
  return res.status(500).json({error:"agent_completion_failed",requestId:requestIdHeader});
 }
});

agentWorkerRouter.post("/:requestId/fail",async(req,res)=>{
 const missing=unavailable(res);if(missing)return missing;
 if(!workerAuthorized(req.headers.authorization))return res.status(401).json({error:"invalid_worker_token"});
 const requestId=z.string().uuid().safeParse(req.params.requestId);
 if(!requestId.success)return res.status(400).json({error:"invalid_request_id"});
 const input=failAgentRequestInput.safeParse(req.body);
 if(!input.success)return res.status(400).json({error:"invalid_agent_failure",details:input.error.flatten()});
 try{
  const outcome=await withAgentWorkerContext(async tx=>{
   const [request]=await tx.select().from(agentRequests).where(eq(agentRequests.id,requestId.data)).limit(1);
   if(!request)return {notFound:true};
   if(request.status!=="running")return {conflict:true,error:"request_not_running"};
   const [item]=await tx.select().from(workItems).where(eq(workItems.id,request.workItemId)).limit(1);
   if(!item)return {notFound:true};
   const nextStatus=canTransitionWorkItem(item.status,"blocked")?"blocked":item.status;
   const safeReason=input.data.reason.slice(0,1000);
   const summary="Agent worker failed: "+safeReason;
   const now=new Date();
   await tx.update(agentRequests).set({status:"failed",resultSummary:summary,completedAt:now}).where(eq(agentRequests.id,request.id));
   await tx.update(workItems).set({
    status:nextStatus,
    latestEvidence:"The agent worker reported a failure. No successful completion evidence was received.",
    nextAction:"Review the failure details, resolve the provider or worker issue, then retry the request.",
    updatedAt:now
   }).where(eq(workItems.id,item.id));
   await tx.insert(workItemEvents).values({
    workspaceId:request.workspaceId,workItemId:item.id,eventType:"agent_failed",
    fromStatus:item.status,toStatus:nextStatus,detail:summary
   });
   return {requestId:request.id,workItemId:item.id,requestStatus:"failed",workItemStatus:nextStatus};
  });
  if("notFound" in outcome)return res.status(404).json(outcome);
  if("conflict" in outcome)return res.status(409).json(outcome);
  return res.json(outcome);
 }catch(error){
  const requestIdHeader=res.locals.requestId;
  console.error("Agent failure update failed",requestIdHeader,error instanceof Error?error.message:"unknown");
  return res.status(500).json({error:"agent_failure_update_failed",requestId:requestIdHeader});
 }
});
