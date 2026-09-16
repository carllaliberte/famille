import assert from "node:assert/strict";
import test from "node:test";
import { admission, billingBoundary, connectionEvent, reconcile, verifiedUsage } from "../scripts/economic-network-contract.mjs";

test("economic network v2 preserves human payment boundary",()=>{const c=connectionEvent({actor:"gemini",authenticated:true,authorized:true});assert.equal(admission(c).decision,"ADMIT");const u=verifiedUsage({actor:"gemini",execution_id:"v2-1",executed:true,verified:true,units:2});const a=reconcile({connections:[c],usage:[u,u],commercial:{gemini:{state:"PAYABLE"}}})[0];const b=billingBoundary(a,{enabled:true,per_unit:4,currency:"CAD"});assert.equal(a.executions,1);assert.equal(b.amount,8);assert.equal(b.boundary,"HUMAN_REVIEW");assert.equal(b.charged,false);assert.equal(b.payment_attempted,false);});
