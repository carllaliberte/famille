import assert from "node:assert/strict";
import test from "node:test";
import { admission, billingBoundary, connectionEvent, reconcile, verifiedUsage } from "../scripts/economic-network-contract.mjs";

test("v2 keeps connection, execution, verification and billing distinct",()=>{const c=connectionEvent({actor:"gemini",authenticated:true,authorized:true});assert.equal(admission(c).decision,"ADMIT");const u=verifiedUsage({actor:"gemini",execution_id:"e1",executed:true,verified:true,units:2});const a=reconcile({connections:[c],usage:[u,u],commercial:{gemini:{state:"PAYABLE"}}})[0];assert.equal(a.connections,1);assert.equal(a.executions,1);assert.equal(a.usage_units,2);const b=billingBoundary(a,{enabled:true,per_unit:5,currency:"CAD"});assert.equal(b.amount,10);assert.equal(b.boundary,"HUMAN_REVIEW");assert.equal(b.charged,false);assert.equal(b.payment_attempted,false);});
