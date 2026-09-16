import test from "node:test";
import assert from "node:assert/strict";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";

test("Cortex runtime bridge records the real worker lifecycle without inventing LIVE", () => {
  const result = runCortexRuntime({
    workerEvidence: {
      v: "cognitive-worker.v14",
      discovered: 3,
      routed: 2,
      verified: true,
      dispatches: [
        { number: 609, sha: "abc", state: "VERIFIED", comment_id: 42 },
      ],
      truth: { ACTION_VERIFIED: true },
    },
    agents: [
      { id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" },
      { id: "build", capabilities: ["build"], presence: "DECLARED", specialty: "implement" },
    ],
    at: "2026-09-16T20:00:00.000Z",
  });

  assert.equal(result.executed, true);
  assert.equal(result.live, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.authority, "carl");
  assert.equal(result.session.state, "DONE");
  assert.equal(result.session.executions.length, 1);
  assert.equal(result.measurement.ok, true);
  assert.equal(result.lesson.ok, true);
  assert.equal(result.composition.selected.includes("reviewer"), true);
});

test("evolution observes prior fluidity when current cycle has not measured yet", () => {
  const result = runCortexRuntime({
    workerEvidence: { v: "cognitive-worker.v14", verified: false, dispatches: [] },
    agents: [{ id: "reviewer", capabilities: ["review"], presence: "DECLARED" }],
    fluidity: {},
    at: "2026-09-16T21:20:00.000Z",
  });
  assert.equal(result.evolution.live, false);
  assert.equal(result.evolution.execution.status, "CAPABILITY_NOT_AVAILABLE");
  assert.equal(result.evolution.decision.decision, "REJECT");
  assert.equal(result.evolution.memory.entry.constraint, true);
});
