import test from "node:test";
import assert from "node:assert/strict";
import { runAdaptiveEngine, createAdaptiveTask, executeCorrection } from "../.github/swarm/fabric-v3.mjs";
import { createTask, addObjection } from "../.github/swarm/fabric.mjs";

const AT = "2026-09-14T22:00:00.000Z";

test("disagreement becomes a new measured and verified task", () => {
  const result = runAdaptiveEngine({
    at: AT,
    objective: "compare two deterministic answers",
    workers: [
      { worker: "a", capability: "lu", output: { answer: "A" } },
      { worker: "b", capability: "lu", output: { answer: "B" } },
    ],
    correction_worker: "corr",
    correct_output: { resolved: true },
  });

  assert.equal(result.ok, true);
  assert.equal(result.work.adaptive.triggered, true);
  assert.equal(result.work.adaptive.corrections, 1);
  assert.equal(result.work.adaptive.child_verified, true);
  assert.equal(result.adaptive_task.adaptation.reason, "DISAGREEMENT");
  assert.equal(result.adaptive_task.measurements.some((m) => m.metric === "adaptive_correction" && m.measured), true);
  assert.equal(result.metrics.reexecutions, 1);
  assert.equal(result.work.decision.status, "PENDING_HUMAN");
  assert.equal(result.work.live, false);
  assert.equal(result.work.auto_merge, false);
});

test("agreement does not manufacture an adaptive task", () => {
  const result = runAdaptiveEngine({
    at: AT,
    workers: [
      { worker: "a", capability: "lu", output: { answer: "same" } },
      { worker: "b", capability: "lu", output: { answer: "same" } },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(result.work.adaptive.triggered, false);
  assert.equal(result.work.adaptive.child_task, null);
  assert.equal(result.metrics.corrections, 0);
  assert.equal(result.work.synthesis.summary, "AGREEMENT");
});

test("adaptive task requires an explicit disagreement objection", () => {
  const created = createTask({ objective: "source" });
  const noObjection = createAdaptiveTask(created.work, { at: AT });
  assert.equal(noObjection.ok, false);
  assert.equal(noObjection.code, "NO_OBJECTION");

  const objected = addObjection(created.work, {
    node: "test",
    reason: "DISAGREEMENT",
    severity: "NOTE",
    at: AT,
  });
  const adaptive = createAdaptiveTask(objected.work, { at: AT });
  assert.equal(adaptive.ok, true);
  assert.equal(adaptive.task.parent_task, created.work.task_id);
  assert.equal(adaptive.task.adaptation.source_objection, adaptive.task.adaptation.source_objection);
});

test("failed correction readback remains unverified and becomes blocking", () => {
  const created = createTask({ objective: "correct" });
  const adaptive = createAdaptiveTask(
    addObjection(created.work, { reason: "DISAGREEMENT", severity: "NOTE", at: AT }).work,
    { at: AT },
  );
  const result = executeCorrection(adaptive.task, {
    worker: "corr",
    capability: "lu",
    output: { got: "A" },
    expected: { got: "B" },
    at: AT,
  });

  assert.equal(result.ok, true);
  assert.equal(result.verified, false);
  assert.equal(result.readback.verification, "UNVERIFIED");
  assert.equal(result.readback.state, "CONFLICT");
  assert.equal(
    result.work.objections.some((o) => o.reason === "CORRECTION_READBACK_CONFLICT" && o.severity === "BLOCKING"),
    true,
  );
  assert.equal(result.work.state, "BLOCKED");
  assert.equal(result.work.live, false);
  assert.equal(result.work.auto_merge, false);
  assert.equal(
    result.work.measurements.some((m) => m.metric === "adaptive_correction" && m.method === "deterministic_test"),
    true,
  );
});

test("unverified adaptive cycle stays pending human", () => {
  const result = runAdaptiveEngine({
    at: AT,
    objective: "compare two deterministic answers",
    workers: [
      { worker: "a", capability: "lu", output: { answer: "A" } },
      { worker: "b", capability: "lu", output: { answer: "B" } },
    ],
    correction_worker: "corr",
    correct_output: { resolved: true },
    correct_expected: { resolved: false },
  });

  assert.equal(result.ok, true);
  assert.equal(result.work.adaptive.triggered, true);
  assert.equal(result.work.adaptive.child_verified, false);
  assert.equal(result.work.synthesis.summary, "ADAPTIVE_UNVERIFIED");
  assert.equal(result.metrics.adaptive_verified, false);
  assert.equal(result.work.decision.status, "PENDING_HUMAN");
  assert.equal(result.work.live, false);
  assert.equal(result.work.auto_merge, false);
});
