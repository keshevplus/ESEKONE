import test from "node:test";
import assert from "node:assert/strict";
import {completeAgentRequestInput,isWorkerTokenValid} from "../src/http/agent-worker.js";

test("agent worker token comparison accepts only the configured secret",()=>{
 const secret="a-long-random-worker-secret-with-at-least-32-characters";
 assert.equal(isWorkerTokenValid(secret,secret),true);
 assert.equal(isWorkerTokenValid("wrong-secret",secret),false);
 assert.equal(isWorkerTokenValid(secret,undefined),false);
 assert.equal(isWorkerTokenValid("short","short"),false);
});
test("agent completion requires evidence and a non-final suggested status",()=>{
 const valid={resultSummary:"Fixed the missing validation and added tests.",evidence:"CI run 123 passed all checks.",suggestedStatus:"review"};
 assert.equal(completeAgentRequestInput.safeParse(valid).success,true);
 assert.equal(completeAgentRequestInput.safeParse({...valid,evidence:""}).success,false);
 assert.equal(completeAgentRequestInput.safeParse({...valid,suggestedStatus:"done"}).success,false);
});
