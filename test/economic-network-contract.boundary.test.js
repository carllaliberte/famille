import assert from "node:assert/strict";
import test from "node:test";
import { admission, connectionEvent, verifiedUsage, billingBoundary } from "../scripts/economic-network-contract.mjs";

test("identity observation never infers identity from missing actor",()=>{assert.equal(connectionEvent({channel:"external"}).ok,false);});
test("authorization is separate from payment",()=>{const c=connectionEvent({actor:"gemini",authenticated:true,authorized:true});assert.equal(admission(c).decision,"ADMIT");const b=billingBoundary({actor:"gemini",commercial_state:"PAYABLE",measured_usage:true,usage_units:2},{enabled:true,per_unit:1,currency:"CAD"});assert.equal(b.charged,false);assert.equal(b.payment_attempted,false);});
test("verification is mandatory before usage enters the network",()=>{assert.equal(verifiedUsage({actor:"gemini",execution_id:"x",executed:false,verified:true}).ok,false);assert.equal(verifiedUsage({actor:"gemini",execution_id:"x",executed:true,verified:true}).ok,true);});
