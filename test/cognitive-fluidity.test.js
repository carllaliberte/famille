import test from "node:test";
import assert from "node:assert/strict";
import {
  applyFluidityHint,
  assertFluidity,
  FLUIDITY_STATES,
  FLUIDITY_VERSION,
  fluidityState,
  measureFluidity,
} from "../scripts/cognitive-fluidity.mjs";
import { planConductor } from "../scripts/cognitive-conductor.mjs";

test("fluidity measures the real critical path and emits bounded feedback", () => {
  const result = measureFluidity({
    timing: {
      observe: { duration_ms: 20 },
      dispatch: { duration_ms: 120 },
      cortex: { duration_ms: 40 },
      economic: { duration_ms: 15 },
    },
    workerEvidence: { verified: true, dispatched: 1, dispatch_failed: 0 },
    at: "2026-09-16T20:00:00.000Z",
  });
  assert.equal(result.version, FLUIDITY_VERSION);
  assert.equal(result.total_stage_ms, 195);
  assert.equal(result.bottleneck.name, "dispatch");
  assert.equal(result.mode, "PARALLEL_DISPATCH");
  assert.equal(result.state, "FLOWING");
  assert.equal(result.property.silent_stop, false);
  assert.equal(result.next_cycle.preserve_security, true);
  assert.equal(result.next_cycle.preserve_provenance, true);
  assert.equal(result.next_cycle.preserve_human_authority, true);
  assert.equal(result.next_cycle.auto_merge, false);
  assert.equal(result.next_cycle.live, false);
});

test("fluidity fails closed on dispatch anomalies", () => {
  const result = measureFluidity({
    timing: { dispatch: { duration_ms: 10 } },
    workerEvidence: { verified: false, dispatched: 1, dispatch_failed: 1 },
  });
  assert.equal(result.mode, "HOLD_HUMAN");
  assert.equal(result.state, "HOLD_HUMAN");
  assert.equal(result.property.flowing, true);
  assert.doesNotThrow(() => assertFluidity(result));
});

test("silent skip without diagnosis is STALLED, not a mode label", () => {
  assert.deepEqual(FLUIDITY_STATES, ["FLOWING", "FRICTION", "STALLED", "HOLD_HUMAN"]);
  const result = measureFluidity({
    continuation: { step: "skipped", diagnosis_executed: false, skipped_without_diagnosis: true },
  });
  assert.equal(result.state, "STALLED");
  assert.equal(result.property.silent_stop, true);
  assert.equal(result.verified, false);
  assert.throws(() => assertFluidity(result), /FLUIDITY_SILENT_STOP/);
});

test("prior hint is consumed by the conductor, otherwise FRICTION", () => {
  const prior = measureFluidity({
    timing: { dispatch: { duration_ms: 80 }, cortex: { duration_ms: 10 } },
    workerEvidence: { verified: true, dispatched: 1, dispatch_failed: 0 },
  });
  assert.equal(prior.mode, "PARALLEL_DISPATCH");
  const ignored = measureFluidity({ timing: { worker: { duration_ms: 5 } }, prior, applied: { hint_consumed: false } });
  assert.equal(ignored.state, "FRICTION");
  const applied = applyFluidityHint(prior);
  assert.equal(applied.hint_consumed, true);
  assert.equal(applied.parallelize, true);
  const consumed = measureFluidity({
    timing: { worker: { duration_ms: 5 }, cortex: { duration_ms: 5 } },
    prior,
    applied,
  });
  assert.equal(consumed.state, "FLOWING");
  assert.equal(consumed.property.hint_consumed, true);
  const plan = planConductor(prior);
  assert.equal(plan.fluidity.hint_consumed, true);
  assert.equal(plan.fluidity.hint, "PARALLEL_DISPATCH");
});

test("HOLD_HUMAN is a valid pause, not a stall", () => {
  assert.equal(fluidityState({ mode: "HOLD_HUMAN", continuation: { next: "HOLD_HUMAN" } }), "HOLD_HUMAN");
  const prior = { version: FLUIDITY_VERSION, mode: "HOLD_HUMAN", state: "HOLD_HUMAN", next_cycle: { mode: "HOLD_HUMAN" } };
  const hint = applyFluidityHint(prior);
  assert.equal(hint.hold, true);
  assert.equal(hint.hint_consumed, true);
});
