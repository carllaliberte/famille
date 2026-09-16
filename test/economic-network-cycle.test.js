import assert from "node:assert/strict";
import test from "node:test";
import { connectionEvent, verifiedUsage, reconcile, billingBoundary } from "../scripts/economic-network-contract.mjs";

test("network reconciliation keeps connection and verified usage distinct",()=>{const c=connectionEvent({actor:"gemini",authenticated:true,authorized:true});const u=verifiedUsage({actor:"gemini",execution_id:"run-1",executed:true,verified:true,units:4});const a=reconcile({connections:[c],usage:[u,u],commercial:{gemini:{state:"PAYABLE"}}})[0];assert.equal(a.connections,1);assert.equal(a.executions,1);assert.equal(a.usage_units,4);assert.equal(a.measured_usage,true);});
test("economic boundary never charges automatically",()=>{const b=billingBoundary({actor:"gemini",commercial_state:"PAYABLE",measured_usage:true,usage_units:4},{enabled:true,per_unit:2,currency:"CAD"});assert.equal(b.eligible,true);assert.equal(b.amount,8);assert.equal(b.boundary,"HUMAN_REVIEW");assert.equal(b.charged,false);});
