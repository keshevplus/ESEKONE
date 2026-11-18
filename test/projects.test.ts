import test from "node:test";
import assert from "node:assert/strict";
import {createProjectInput,updateProjectInput} from "../src/http/projects.js";

test("project creation defaults to planned",()=>{
 const result=createProjectInput.safeParse({name:"Website relaunch"});
 assert.equal(result.success,true);
 if(result.success)assert.equal(result.data.status,"planned");
});
test("project creation rejects final states and unknown fields",()=>{
 assert.equal(createProjectInput.safeParse({name:"Project",status:"completed"}).success,false);
 assert.equal(createProjectInput.safeParse({name:"Project",workspaceId:"other-tenant"}).success,false);
});
test("project update requires at least one valid field",()=>{
 assert.equal(updateProjectInput.safeParse({}).success,false);
 assert.equal(updateProjectInput.safeParse({status:"active"}).success,true);
 assert.equal(updateProjectInput.safeParse({status:"finished"}).success,false);
});
