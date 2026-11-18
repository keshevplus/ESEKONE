import test from "node:test";
import assert from "node:assert/strict";
import {createWorkspaceInput} from "../src/http/onboarding.js";

test("workspace onboarding defaults the first workspace to the organization",()=>{
 const result=createWorkspaceInput.safeParse({organizationName:"Northstar Studio",organizationSlug:"northstar-studio"});
 assert.equal(result.success,true);
 if(result.success){assert.equal(result.data.workspaceName,"Northstar Studio");assert.equal(result.data.workspaceSlug,"northstar-studio");}
});
test("workspace onboarding normalizes slugs",()=>{
 const result=createWorkspaceInput.safeParse({organizationName:"Northstar Studio",organizationSlug:"Northstar-Studio"});
 assert.equal(result.success,true);
 if(result.success)assert.equal(result.data.organizationSlug,"northstar-studio");
});
test("workspace onboarding rejects malformed slugs and unknown properties",()=>{
 assert.equal(createWorkspaceInput.safeParse({organizationName:"Northstar",organizationSlug:"bad slug"}).success,false);
 assert.equal(createWorkspaceInput.safeParse({organizationName:"Northstar",organizationSlug:"northstar",ownerRole:"admin"}).success,false);
});
