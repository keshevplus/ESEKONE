import test from "node:test";
import assert from "node:assert/strict";
import {createWorkItem,updateWorkItem,createAgentRequest} from "../src/http/tasks.js";

test("work item requires a title and applies safe defaults",()=>{
 const result=createWorkItem.safeParse({title:"Prepare monthly report"});
 assert.equal(result.success,true);
 if(result.success){assert.equal(result.data.status,"backlog");assert.equal(result.data.priority,"normal");}
});
test("work item rejects invalid lifecycle and priority values",()=>{
 assert.equal(createWorkItem.safeParse({title:"Task",status:"finished"}).success,false);
 assert.equal(createWorkItem.safeParse({title:"Task",priority:"critical"}).success,false);
});
test("work item rejects unknown properties",()=>{
 assert.equal(createWorkItem.safeParse({title:"Task",workspaceId:"attacker-controlled"}).success,false);
});
test("work item update cannot be empty",()=>{
 assert.equal(updateWorkItem.safeParse({}).success,false);
 assert.equal(updateWorkItem.safeParse({status:"review"}).success,true);
});
test("agent request requires a useful prompt and defaults to admin agent",()=>{
 const result=createAgentRequest.safeParse({prompt:"Please investigate and fix the failing task."});
 assert.equal(result.success,true);
 if(result.success)assert.equal(result.data.agentKey,"admin");
});
test("agent request rejects short or oversized prompts",()=>{
 assert.equal(createAgentRequest.safeParse({prompt:"fix"}).success,false);
 assert.equal(createAgentRequest.safeParse({prompt:"x".repeat(12001)}).success,false);
});
