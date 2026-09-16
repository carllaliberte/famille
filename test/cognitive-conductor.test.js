import test from "node:test";
import assert from "node:assert/strict";
import { planConductor } from "../scripts/cognitive-conductor.mjs";

test("conductor keeps dependencies ordered while parallelizing independent cognition", () => {
  const plan = planConductor();
  assert.equal(plan.version, "cognitive-conductor.v1");
  assert.deepEqual(plan.waves[1].stages, ["cortex", "usage"]);
  assert.deepEqual(plan.waves[1].dependencies, ["worker"]);
  assert.deepEqual(plan.waves[2].dependencies, ["parallel-cognitive-wave"]);
  assert.equal(plan.rules.parallelize_independent, true);
  assert.equal(plan.rules.preserve_dependency_order, true);
  assert.equal(plan.rules.no_auto_merge, true);
  assert.equal(plan.rules.live, false);
});

test("conductor consumes a prior fluidity hint instead of ignoring it", () => {
  const plan = planConductor({ next_cycle: { mode: "PARALLEL_DISPATCH" }, mode: "PARALLEL_DISPATCH" });
  assert.equal(plan.fluidity.hint_consumed, true);
  assert.equal(plan.fluidity.hint, "PARALLEL_DISPATCH");
  assert.equal(plan.fluidity.parallelize, true);
});
