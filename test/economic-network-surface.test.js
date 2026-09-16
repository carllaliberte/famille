import assert from "node:assert/strict";
import test from "node:test";
import { connectionEvent, admission, verifiedUsage, reconcile, billingBoundary } from "../scripts/economic-network-contract.mjs";

test("routine connection requires no human interruption",()=>{const e=connectionEvent({actor:"gemini",authenticated:true,authorized:false});const a=admission(e);assert.equal(a.decision,"DENY");assert.equal(a.human_alert,false);});
test("verified usage is the only commercial input",()=>{const u=verifiedUsage({actor:"gemini",execution_id:"x",executed:true,verified:true,units:3});const a=reconcile({usage:[u],commercial:{gemini:{state:"PAYABLE"}}})[0];assert.equal(a.measured_usage,true);assert.equal(a.usage_units,3);});
test("payment remains outside Acorn",()=>{const b=billingBoundary({actor:"gemini",commercial_state:"PAYABLE",measured_usage:true,usage_units:3},{enabled:true,per_unit:2,currency:"CAD"});assert.equal(b.amount,6);assert.equal(b.charged,false);assert.equal(b.payment_attempted,false);});
