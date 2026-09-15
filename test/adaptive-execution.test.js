import test from "node:test";
import assert from "node:assert/strict";
import { buildExecutionPlan, selectWork, nextCadenceDelayMs } from "../scripts/adaptive-execution.mjs";

test("adaptive execution remains fail-closed under critical safety", () => {
  const plan = buildExecutionPlan({ pendingTasks: 20, anomalyScore: 0.9, breakerMode: "RUN" });
  assert.equal(plan.safety_state, "CRITICAL");
  assert.equal(plan.cadence, 0.25);
  assert.equal(plan.cadence_allows_work, false);
  assert.equal(plan.auto_merge, false);
  assert.equal(plan.live, false);
});

test("adaptive execution selects a deterministic bounded prefix", () => {
  const rows = [1, 2, 3, 4, 5, 6, 7, 8];
  assert.deepEqual(selectWork(rows, 0.25), [1, 2]);
  assert.deepEqual(selectWork(rows, 0.5), [1, 2, 3, 4]);
  assert.deepEqual(selectWork(rows, 1), rows);
});

test("cadence delay grows when energy is reduced", () => {
  assert.equal(nextCadenceDelayMs(0.25, 60_000), 240_000);
  assert.equal(nextCadenceDelayMs(1, 60_000), 60_000);
});
