import test from "node:test";
import assert from "node:assert/strict";
import {
 agentReviewResultSchema,buildAgentReviewInput,buildAgentReviewInstructions,extractResponsesText
} from "../src/agents/review.js";

test("specialist review guidance is role-specific and remains review-only",()=>{
 const crm=buildAgentReviewInstructions("crm");
 const growth=buildAgentReviewInstructions("growth");
 assert.match(crm,/CRM specialist/);
 assert.match(growth,/growth specialist/i);
 assert.match(crm,/review-only mode/);
 assert.match(crm,/no tools/);
 assert.match(crm,/Do not claim/);
});

test("review input contains only the task fields needed for triage",()=>{
 const input=JSON.parse(buildAgentReviewInput({
  request:{agentKey:"crm",prompt:"Review the duplicate lead workflow."},
  workItem:{title:"Lead deduplication",description:"Identify possible duplicates.",status:"in_progress",priority:"high",acceptanceCriteria:"No records are changed.",latestEvidence:null,nextAction:"Review the rules."}
 }));
 assert.equal(input.requestedWork,"Review the duplicate lead workflow.");
 assert.equal(input.currentWorkItem.title,"Lead deduplication");
 assert.equal("workspaceId" in input,false);
 assert.equal("requestedByUserId" in input,false);
});

test("strict review output schema rejects extra fields and task completion",()=>{
 const valid={resultSummary:"The acceptance criteria need one clarifying detail.",nextAction:"Confirm the canonical duplicate matching rule.",suggestedStatus:"review"};
 assert.equal(agentReviewResultSchema.safeParse(valid).success,true);
 assert.equal(agentReviewResultSchema.safeParse({...valid,suggestedStatus:"done"}).success,false);
 assert.equal(agentReviewResultSchema.safeParse({...valid,secret:"not allowed"}).success,false);
});

test("Responses output parser accepts the API output_text field",()=>{
 assert.equal(extractResponsesText({status:"completed",output_text:"{\"suggestedStatus\":\"review\"}"}),"{\"suggestedStatus\":\"review\"}");
});

test("Responses output parser falls back to output message content",()=>{
 assert.equal(extractResponsesText({
  status:"completed",
  output:[{type:"message",content:[{type:"output_text",text:"result"}]}]
 }),"result");
});

test("Responses output parser rejects incomplete and missing text",()=>{
 assert.throws(()=>extractResponsesText({status:"incomplete",output_text:""}),/did not complete/);
 assert.throws(()=>extractResponsesText({status:"completed",output:[]}),/did not contain output text/);
});
