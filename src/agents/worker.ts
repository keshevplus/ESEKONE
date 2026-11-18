import {
 agentReviewJsonSchema,agentReviewResultSchema,
 buildAgentReviewInput,buildAgentReviewInstructions,extractResponsesText
} from "./review.js";
import {config} from "../config.js";

type ClaimedJob={
 request:{id:string;workspaceId:string;workItemId:string;agentKey:string;prompt:string;createdAt:string;attemptCount:number;maxAttempts:number};
 workItem:{id:string;title:string;description:string|null;status:string;priority:string;acceptanceCriteria:string|null;latestEvidence:string|null;nextAction:string|null}|null;
};
type ClaimResponse={claimed:boolean;job:ClaimedJob|null};
const API_BASE=(config.AGENT_WORKER_API_URL??(config.NODE_ENV==="production"?"":`http://127.0.0.1:${config.PORT}`)).replace(/\/+$/,"");
let stopping=false;

function wait(ms:number){return new Promise(resolve=>setTimeout(resolve,ms));}
function safeError(error:unknown){
 if(error instanceof Error){
  if(error.message.startsWith("OpenAI request failed with HTTP "))return error.message.slice(0,160);
  if(error.message==="Model response did not complete")return "The AI provider did not complete the review.";
  if(error.message.includes("schema"))return "The AI provider returned a review that did not match the required output schema.";
 }
 return "The AI review worker encountered an unexpected provider or network error.";
}
async function apiRequest<T>(path:string,body?:unknown):Promise<T>{
 const response=await fetch(API_BASE+path,{
  method:body===undefined?"GET":"POST",
  headers:{Authorization:`Bearer ${config.AGENT_WORKER_TOKEN}`,"Content-Type":"application/json"},
  body:body===undefined?undefined:JSON.stringify(body),
  signal:AbortSignal.timeout(30000)
 });
 if(!response.ok)throw new Error(`Worker API request failed with HTTP ${response.status}`);
 return await response.json() as T;
}
async function requestOpenAI(job:ClaimedJob){
 if(!config.OPENAI_API_KEY||!config.OPENAI_MODEL)throw new Error("AI provider is not configured");
 const payload={
  model:config.OPENAI_MODEL,
  instructions:buildAgentReviewInstructions(job.request.agentKey),
  input:buildAgentReviewInput(job),
  max_output_tokens:1000,
  store:false,
  text:{
   format:{
    type:"json_schema",
    name:"esekone_agent_review",
    strict:true,
    schema:agentReviewJsonSchema
   }
  }
 };
 let lastError:unknown;
 for(let attempt=1;attempt<=3;attempt++){
  try{
   const response=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{Authorization:`Bearer ${config.OPENAI_API_KEY}`,"Content-Type":"application/json"},
    body:JSON.stringify(payload),
    signal:AbortSignal.timeout(45000)
   });
   if(response.status===429||response.status>=500){
    lastError=new Error(`OpenAI request failed with HTTP ${response.status}`);
    if(attempt<3){await wait(attempt*1000);continue;}
   }
   if(!response.ok)throw new Error(`OpenAI request failed with HTTP ${response.status}`);
   const json:unknown=await response.json();
   const text=extractResponsesText(json);
   const parsed=agentReviewResultSchema.safeParse(JSON.parse(text));
   if(!parsed.success)throw new Error("Model review output failed schema validation");
   return parsed.data;
  }catch(error){
   lastError=error;
   if(attempt<3&&!(error instanceof Error&&error.message.startsWith("OpenAI request failed with HTTP 4")&&!error.message.includes("429"))){
    await wait(attempt*1000);
    continue;
   }
   break;
  }
 }
 throw lastError instanceof Error?lastError:new Error("AI provider request failed");
}
async function handleJob(job:ClaimedJob){
 try{
  const review=await requestOpenAI(job);
  const evidence=[
   "AI-generated specialist review only.",
   "The worker had no business-action tools and did not change records, run tests, contact people or deploy software.",
   "Provider response schema validated successfully."
  ].join(" ");
  await apiRequest(`/internal/agent-requests/${encodeURIComponent(job.request.id)}/complete`,{
   resultSummary:review.resultSummary,
   evidence,
   nextAction:review.nextAction,
   suggestedStatus:review.suggestedStatus
  });
  process.stdout.write(`Reviewed request ${job.request.id} (attempt ${job.request.attemptCount}/${job.request.maxAttempts}).\n`);
 }catch(error){
  const reason=safeError(error);
  try{
   await apiRequest(`/internal/agent-requests/${encodeURIComponent(job.request.id)}/fail`,{reason});
  }catch{
   process.stderr.write(`Could not record failure for request ${job.request.id}; lease recovery will handle an abandoned running request.\n`);
  }
  process.stderr.write(`Request ${job.request.id} failed: ${reason}\n`);
 }
}

async function run(){
 if(!config.AGENT_WORKER_TOKEN||config.AGENT_WORKER_TOKEN.length<32)throw new Error("AGENT_WORKER_TOKEN must be configured with at least 32 characters");
 if(!config.OPENAI_API_KEY||!config.OPENAI_MODEL)throw new Error("OPENAI_API_KEY and OPENAI_MODEL must be configured before starting the review worker");
 if(!API_BASE)throw new Error("AGENT_WORKER_API_URL is required in production");
 process.stdout.write(`ESEKONE review worker listening to ${API_BASE}. Review-only mode is enabled.\n`);
 while(!stopping){
  try{
   const result=await apiRequest<ClaimResponse>("/internal/agent-requests/claim");
   if(result.claimed&&result.job){await handleJob(result.job);continue;}
  }catch(error){
   const message=error instanceof Error?error.message:"Unknown worker API error";
   process.stderr.write(`Worker poll failed: ${message}\n`);
  }
  await wait(config.AGENT_WORKER_POLL_INTERVAL_MS);
 }
 process.stdout.write("ESEKONE review worker stopped.\n");
}

process.on("SIGINT",()=>{stopping=true;});
process.on("SIGTERM",()=>{stopping=true;});
run().catch(error=>{
 process.stderr.write((error instanceof Error?error.message:"Worker startup failed")+"\n");
 process.exitCode=1;
});
