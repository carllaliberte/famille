import test from "node:test";
import assert from "node:assert/strict";
import { buildOfferCatalog, operationsSnapshot, HARD_BOUNDARIES } from "../scripts/acorn-production-control.mjs";

test("production control keeps publication and commercial authority human",()=>{
 const catalog=buildOfferCatalog({assets:[{id:"a",name:"Reusable solution",validated:true,usage_rights:["PERPETUAL_USE"],evidence:["e1"]}]});
 assert.equal(catalog[0].publishable,false);
 assert.equal(catalog[0].requires_human_publish,true);
 assert.equal(HARD_BOUNDARIES.auto_contract,false);
 assert.equal(HARD_BOUNDARIES.auto_spend,false);
});
test("operations snapshot measures current state",()=>{
 const s=operationsSnapshot({requests:[{status:"BUILDING"},{status:"BUILDING"},{status:"DELIVERED"}],jobs:[{state:"SUCCEEDED"}],evidence:[{valid_until:null}]});
 assert.equal(s.requests.BUILDING,2); assert.equal(s.requests.DELIVERED,1); assert.equal(s.evidence_current,1);
});
