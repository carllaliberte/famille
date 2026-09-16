import assert from "node:assert/strict";
import test from "node:test";
import { admission, billingBoundary, connectionEvent, reconcile, verifiedUsage } from "../scripts/economic-network-contract.mjs";

test("authorized connection is admitted without creating billing authority",()=>{const e=connectionEvent({actor:"gemini",authenticated:true,authorized:true});assert.equal(admission(e).decision,"ADMIT");});
test("unauthenticated connection is held without human interruption",()=>{const e=connectionEvent({actor:"gemini"});const a=admission(e);assert.equal(a.decision,"AUTH_REQUIRED");assert.equal(a.human_alert,false);});
test("only executed and verified work becomes usage",()=>{assert.equal(verifiedUsage({actor:"gemini",execution_id:"x",executed:true,verified:false}).ok,false);assert.equal(verifiedUsage({actor:"gemini",execution_id:"x",executed:true,verified:true,units:3}).event.units,3);});
test("reconciliation deduplicates execution ids",()=>{const c=connectionEvent({actor:"gemini",authenticated:true,authorized:true});const u=verifiedUsage({actor:"gemini",execution_id:"x",executed:true,verified:true,units:3});const a=reconcile({connections:[c],usage:[u,u],commercial:{gemini:{state:"PAYABLE"}}})[0];assert.equal(a.executions,1);assert.equal(a.usage_units,3);assert.equal(a.commercial_state,"PAYABLE");});
test("billing is a candidate only, never a charge",()=>{const b=billingBoundary({actor:"gemini",commercial_state:"PAYABLE",measured_usage:true,usage_units:5},{enabled:true,per_unit:2,currency:"CAD"});assert.equal(b.eligible,true);assert.equal(b.amount,10);assert.equal(b.boundary,"HUMAN_REVIEW");assert.equal(b.charged,false);assert.equal(b.payment_attempted,false);});
test("disabled pricing cannot create a billing candidate",()=>{const b=billingBoundary({actor:"gemini",commercial_state:"PAYABLE",measured_usage:true,usage_units:5},{enabled:false,per_unit:2,currency:"CAD"});assert.equal(b.eligible,false);assert.equal(b.amount,null);});
