import assert from "node:assert/strict";
import test from "node:test";
import { CADENCE_LEVELS, SAFETY_STATES, classifySafety, demandScore, planAdaptiveCadence } from "../.github/swarm/adaptive-cadence.mjs";

test("low demand stays at the minimum cadence", () => {
  const plan = planAdaptiveCadence({ demand: { pendingTasks: 0, activeTasks: 0 }, currentCadence: 0.5, breaker: "RUN" });
  assert.equal(plan.next_cadence, 0.25);
  assert.equal(plan.reason, "MEASURED_DEMAND_DECREASE");
});

test("measured demand increases cadence progressively", () => {
  const half = planAdaptiveCadence({ demand: { pendingTasks: 8 }, currentCadence: 0.25, breaker: "RUN" });
  const high = planAdaptiveCadence({ demand: { pendingTasks: 16 }, currentCadence: 0.5, breaker: "RUN" });
  assert.equal(half.next_cadence, 0.5);
  assert.equal(high.next_cadence, 0.75);
});

test("unstable conditions cap cadence", () => {
  const plan = planAdaptiveCadence({ demand: { pendingTasks: 20 }, safety: { errorRate: 0.2 }, currentCadence: 0.75, breaker: "RUN" });
  assert.equal(plan.safety_state, SAFETY_STATES.UNSTABLE);
  assert.equal(plan.next_cadence, 0.5);
});

test("critical conditions fall back to minimum cadence", () => {
  const plan = planAdaptiveCadence({ demand: { pendingTasks: 20 }, safety: { anomalyScore: 0.9 }, currentCadence: 1, breaker: "RUN" });
  assert.equal(plan.safety_state, SAFETY_STATES.CRITICAL);
  assert.equal(plan.next_cadence, 0.25);
  assert.equal(plan.execution_authorized, false);
});

test("breaker OFF is fail-closed and cannot authorize execution", () => {
  assert.equal(classifySafety({ breakerMode: "OFF" }), SAFETY_STATES.CRITICAL);
  const plan = planAdaptiveCadence({ demand: { pendingTasks: 20 }, currentCadence: 1, breaker: "OFF" });
  assert.equal(plan.next_cadence, 0.25);
  assert.equal(plan.execution_authorized, false);
  assert.equal(plan.global_breaker_required, true);
});

test("breaker DEBUG remains diagnostic and never raises cadence above 50 percent", () => {
  const plan = planAdaptiveCadence({ demand: { pendingTasks: 20 }, currentCadence: 0.75, breaker: "DEBUG" });
  assert.equal(plan.safety_state, SAFETY_STATES.UNSTABLE);
  assert.equal(plan.next_cadence, 0.5);
  assert.equal(plan.execution_authorized, false);
});

test("demand score is bounded and deterministic", () => {
  assert.equal(demandScore({ pendingTasks: 100, activeTasks: 100, queuePressure: 1, latency: 100000 }), 1);
  assert.deepEqual(CADENCE_LEVELS, [0.25, 0.5, 0.75, 1]);
});

test("safety takes precedence over efficiency", () => {
  const plan = planAdaptiveCadence({ demand: { pendingTasks: 20 }, safety: { errorRate: 0.5 }, currentCadence: 1, breaker: "RUN" });
  assert.equal(plan.next_cadence, 0.25);
  assert.equal(plan.energy_policy, "MINIMIZE_WITHOUT_SAFETY_LOSS");
});
