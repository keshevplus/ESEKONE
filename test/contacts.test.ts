import test from "node:test";
import assert from "node:assert/strict";
import {createContact,updateContact} from "../src/http/contacts.js";

test("contact creation requires a name and defaults to lead",()=>{
 const parsed=createContact.safeParse({fullName:"Jordan Lee"});
 assert.equal(parsed.success,true);
 if(parsed.success)assert.equal(parsed.data.status,"lead");
});
test("contact creation rejects malformed email",()=>{
 const parsed=createContact.safeParse({fullName:"Jordan Lee",email:"not-an-email"});
 assert.equal(parsed.success,false);
});
test("contact creation rejects unknown fields",()=>{
 const parsed=createContact.safeParse({fullName:"Jordan Lee",admin:true});
 assert.equal(parsed.success,false);
});
test("contact update requires at least one field",()=>{
 assert.equal(updateContact.safeParse({}).success,false);
 assert.equal(updateContact.safeParse({status:"customer"}).success,true);
});
