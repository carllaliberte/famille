import test from "node:test";
import assert from "node:assert/strict";
import { measureFluidity, FLUIDITY_VERSION } from "../scripts/cognitive-fluidity.mjs";

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
});
