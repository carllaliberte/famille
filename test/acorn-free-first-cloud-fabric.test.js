import test from "node:test";
import assert from "node:assert/strict";
import { allocateFreeFirst, buildFreeFirstPlan, classifyResourceClass, createResource, spendingDecision } from "../scripts/acorn-free-first-cloud-fabric.mjs";

test("free-first classification requires evidence", () => {
  assert.equal(classifyResourceClass({permanent:true,evidence:{verified:false}}), "UNKNOWN");
  assert.equal(classifyResourceClass({permanent:true,evidence:{verified:true}}), "FREE_PERMANENT");
});
test("free permanent resource ranks ahead of paid", () => {
  const free = createResource({id:"free",resource_class:"FREE_PERMANENT",state:"VERIFIED",capabilities:["compute"]});
  const paid = createResource({id:"paid",resource_class:"PAID",state:"VERIFIED",capabilities:["compute"]});
  assert.equal(allocateFreeFirst([paid,free],{required_capability:"compute"})[0].id, "free");
});
test("paid infrastructure stays human-gated", () => {
  const paid = createResource({id:"paid",resource_class:"PAID",state:"VERIFIED",capabilities:["compute"]});
  assert.equal(spendingDecision(paid,{measured_revenue:100,measured_cost:10}).decision, "HOLD_HUMAN");
  assert.equal(spendingDecision(paid,{measured_revenue:100,measured_cost:10,human_authorization:true}).decision, "ALLOW_PAID");
});
test("unknown infrastructure is not silently usable", () => {
  const unknown = createResource({id:"unknown",resource_class:"UNKNOWN",state:"UNKNOWN",capabilities:["compute"]});
  const plan = buildFreeFirstPlan([unknown],{required_capability:"compute"});
  assert.equal(plan.selected, null);
  assert.deepEqual(plan.unknown_candidates, ["unknown"]);
});
