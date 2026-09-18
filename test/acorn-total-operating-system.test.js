import test from "node:test";
import assert from "node:assert/strict";
import {PYRAMIDS,TOTAL_POLICY,buildPyramidMap,validatePyramidMap,composeTotalRuntime,totalOperatingSnapshot,universalProjectRuntime} from "../scripts/acorn-total-operating-system.mjs";
test("all major pyramids exist",()=>{const m=buildPyramidMap();assert.equal(m.length,16);assert.equal(validatePyramidMap(m).ready,true);for(const p of m){assert.ok(p.levels.length>=3);assert.ok(p.foundation);assert.ok(p.summit);}});
test("human sovereignty remains explicit",()=>{assert.equal(TOTAL_POLICY.capability_is_not_authority,true);assert.equal(TOTAL_POLICY.human_final_authority,true);assert.equal(TOTAL_POLICY.no_auto_contract,true);assert.equal(TOTAL_POLICY.no_auto_merge,true);});
test("total runtime composes existing fabrics",()=>{const r=composeTotalRuntime({requestId:"test-1",problem:"build reusable enterprise solution",requiredCapabilities:["reasoning","code"]});assert.equal(r.state,"COMPOSED");assert.equal(r.plan.request_id,"test-1");assert.equal(r.plan.authority.human_required,true);assert.equal(r.pyramids.length,16);});
test("snapshot is honest about proof",()=>{const s=totalOperatingSnapshot();assert.equal(s.pyramid_validation.ready,true);assert.equal(s.system.economy,"EXTENSIBLE");assert.equal(s.system.future,"OPEN");assert.equal(s.policy.live_requires_external_measurement,true);});
test("universal project runtime composes existing fabrics without a second engine",()=>{
  const r=universalProjectRuntime({projectId:"tos-1",tenantId:"t1",problem:"compose existing fabrics",requiredCapabilities:["analysis"]});
  assert.equal(r.second_runtime,false);
  assert.equal(r.composed.second_self_build,false);
  assert.equal(r.composed.commercial.execution_authorized,false);
  assert.equal(r.composed.providers.any_live,false);
  assert.equal(r.proof.live,false);
  assert.equal(r.live,false);
});
