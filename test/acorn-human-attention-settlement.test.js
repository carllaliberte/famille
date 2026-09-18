import test from "node:test";
import assert from "node:assert/strict";
import {classifyAttention,humanAttentionBudget,personalBoundary} from "../scripts/acorn-human-attention-fabric.mjs";
import {normalizeDestination,verifyDestination,createSettlementRequest,recordSettlementProof,settlementPolicy} from "../scripts/acorn-settlement-fabric.mjs";

test("routine work is automatic while authority stays human",()=>{assert.equal(classifyAttention({risk:"low"}),"AUTOMATIC");assert.equal(classifyAttention({financial_irreversible:true}),"APPROVAL_CARL");});
test("attention budget exposes only actionable work",()=>{const r=humanAttentionBudget({items:[{id:"a"},{id:"b",security:true},{id:"c",authority_required:true}],budget:2});assert.equal(r.automatic_count,1);assert.equal(r.urgent_count,2);assert.equal(r.authority,"carl");});
test("personal life is not an operational dependency",()=>{const r=personalBoundary({private_data:[]});assert.equal(r.personal_life_is_operational_dependency,false);assert.equal(r.contact_personal_identity_required,false);});
test("private credentials can never become payment destinations",()=>{assert.equal(normalizeDestination({address:"private-key-secret"}).reason,"PRIVATE_CREDENTIAL_FORBIDDEN");});
test("unknown crypto rail stays unverified",()=>{const d=normalizeDestination({provider:"crypto-rail",chain:"unknown",asset:"USDC",address:"public-address"});assert.equal(d.verified,false);});
test("verified public destination can produce a settlement request",()=>{const d=verifyDestination(normalizeDestination({provider:"crypto-rail",chain:"testnet",asset:"USDC",address:"public-address"}),{evidence:{verified:true}});const r=createSettlementRequest({billing_event:{opportunity_id:"opp:1",amount_due:25,currency:"USD"},destination:d});assert.equal(r.status,"REQUESTED");assert.equal(r.auto_spend,false);});
test("settlement becomes reconciled only from transaction evidence",()=>{const d=verifyDestination(normalizeDestination({provider:"crypto-rail",chain:"testnet",asset:"USDC",address:"public-address"}),{evidence:{verified:true}});const r=createSettlementRequest({billing_event:{opportunity_id:"opp:1",amount_due:25},destination:d});const p=recordSettlementProof({request:r,transaction:{tx_id:"tx123",confirmed:true}});assert.equal(p.status,"RECONCILED");assert.equal(p.verified,true);});
test("policy keeps money and authority separate",()=>{const p=settlementPolicy();assert.equal(p.no_private_keys,true);assert.equal(p.no_custody,true);assert.equal(p.no_auto_spend,true);assert.equal(p.authority,"carl");});
