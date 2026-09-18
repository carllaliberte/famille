import test from "node:test";
import assert from "node:assert/strict";
import {
  ACORN_QUALITY_FABRIC_VERSION,QUALITY_DIMENSIONS,QUALITY_LIFECYCLE,qualityStateFromEvidence,evidenceFreshness,
  createQualityPassport,validateQualityPassport,buildQualityLineage,assessCompositionQuality,
  createFalsificationPlan,evaluateFalsification,assessProviderQuality,assessCustomerOutcome,assessEconomicQuality,
  detectQualityDrift,proposeSelfRepair,createQualityEvent,createQualityAssessment
} from "../scripts/acorn-quality-fabric.mjs";

const validUntil="2099-01-01T00:00:00.000Z";
const evidence=[{id:"e1",status:"VERIFIED",measured_at:"2026-09-18T10:00:00.000Z",valid_until:validUntil}];

test("quality fabric is cross-cutting",()=>{assert.equal(ACORN_QUALITY_FABRIC_VERSION,"acorn.quality-fabric.v1");assert.ok(QUALITY_DIMENSIONS.length>=26);assert.ok(QUALITY_LIFECYCLE.includes("MEASURE_VALUE"));});
test("truth state never jumps",()=>{assert.equal(qualityStateFromEvidence({measured:true}),"MEASURED");assert.equal(qualityStateFromEvidence({verified:true}),"VERIFIED");assert.equal(qualityStateFromEvidence({live:true}),"LIVE");assert.equal(qualityStateFromEvidence({executed:true}),"TESTED");});
test("freshness is dated and expiring",()=>{assert.equal(evidenceFreshness(evidence,Date.parse("2026-09-18T12:00:00.000Z")).current,1);assert.equal(evidenceFreshness([{...evidence[0],valid_until:"2020-01-01T00:00:00.000Z"}],Date.parse("2026-09-18T12:00:00.000Z")).expired,1);});
test("passport requires revision expiry authority",()=>{const p=createQualityPassport({subject:{id:"p1",type:"project"},source_revision:"abc",valid_until:validUntil,evidence});assert.doesNotThrow(()=>validateQualityPassport(p,Date.parse("2026-09-18T12:00:00.000Z")));assert.throws(()=>validateQualityPassport({...p,valid_until:null}),/EXPIRY/);});
test("lineage rejects invalid endpoints",()=>{const l=buildQualityLineage({nodes:[{id:"a",type:"client"},{id:"b",type:"capability"}],edges:[{from:"a",to:"b"},{from:"missing",to:"b"}]});assert.equal(l.edges.length,1);assert.deepEqual(l.roots,["a"]);assert.deepEqual(l.leaves,["b"]);});
test("composition requires quality compatibility provenance evidence",()=>{const r=assessCompositionQuality({components:[{quality_state:"VERIFIED",provenance:{source:"x"}},{quality_state:"MEASURED",provenance:{source:"y"}}],compatibility:[{compatible:true}],evidence});assert.equal(r.quality_assured,true);});
test("falsification requires independent verifier and retest",()=>{const p=createFalsificationPlan({claim:"x",builder:"builder",verifier:"verifier"});assert.equal(p.separation_required,true);assert.equal(evaluateFalsification({tests:[{executed:true}],retests:[{passed:true}]}).verified,true);assert.equal(evaluateFalsification({tests:[{executed:true}],failures:[{resolved:false}],retests:[{passed:true}]}).verified,false);});
test("provider quality is observed",()=>{const r=assessProviderQuality({samples:[{success:true,latency_ms:10,cost:1,capability_match:true,measured_at:"2026-09-18T10:00:00.000Z",valid_until:validUntil},{success:false,latency_ms:20,cost:2,capability_match:false,measured_at:"2026-09-18T10:01:00.000Z",valid_until:validUntil}]});assert.equal(r.status,"MEASURED");assert.equal(r.success_rate,.5);});
test("customer outcome needs measured objectives and validation",()=>{const r=assessCustomerOutcome({objectives:[{id:"o1"},{id:"o2"}],measurements:[{objective_id:"o1",observed:true},{objective_id:"o2",observed:true}],validation:{validated:true}});assert.equal(r.status,"VERIFIED");});
test("economic quality separates estimate actual value",()=>{const r=assessEconomicQuality({estimate:{cost:100},actual:{cost:120},value:{realized:500}});assert.equal(r.value_minus_cost,380);});
test("drift produces a repair proposal, never authority",()=>{const p=createQualityPassport({subject:{id:"p1",type:"project"},source_revision:"old",valid_until:validUntil,evidence});const d=detectQualityDrift({passport:p,current_revision:"new",current_evidence:[{...evidence[0],valid_until:"2020-01-01T00:00:00.000Z"}],now:Date.parse("2026-09-18T12:00:00.000Z")});assert.equal(d.drift,true);assert.equal(proposeSelfRepair({drift:d,alternatives:[{id:"alt",compatible:true,quality_state:"VERIFIED"}],simulation:{passed:true}}).status,"REPAIR_PROPOSED");});
test("quality events are hashed",()=>{const e=createQualityEvent({subject_id:"p1",event:"DRIFT_DETECTED"});assert.match(e.event_hash,/^[a-f0-9]{64}$/);assert.equal(e.auto_merge,false);assert.equal(e.authority,"human");});
test("complete assessment creates dated trace",()=>{const dimensions=Object.fromEntries(QUALITY_DIMENSIONS.map(d=>[d,{status:"VERIFIED"}]));const a=createQualityAssessment({subject:{id:"p1",type:"project",name:"P",version:"1"},source_revision:"abc",valid_until:validUntil,evidence,dimensions,tests_passed:true,security_verified:true,authority:"human"});assert.equal(a.mark,"ACORN_ENGINEERED");assert.equal(a.trace.quality_assured,true);assert.equal(a.quality_assured,true);});
