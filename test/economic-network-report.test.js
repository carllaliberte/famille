import assert from "node:assert/strict";
import test from "node:test";
import { connectionEvent, verifiedUsage, reconcile, billingBoundary } from "../scripts/economic-network-contract.mjs";

test("report primitives preserve measured truth and human billing boundary",()=>{const c=connectionEvent({actor:"gemini",authenticated:true,authorized:true});const u=verifiedUsage({actor:"gemini",execution_id:"r1",executed:true,verified:true,units:2});const a=reconcile({connections:[c],usage:[u],commercial:{gemini:{state:"PAYABLE"}}})[0];const b=billingBoundary(a,{enabled:true,per_unit:3,currency:"CAD"});assert.deepEqual({connected:a.connections,measured:a.measured_usage,amount:b.amount,charged:b.charged,boundary:b.boundary},{connected:1,measured:true,amount:6,charged:false,boundary:"HUMAN_REVIEW"});});
