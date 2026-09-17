import test from "node:test";
import assert from "node:assert/strict";
import { classifyRun, notificationDecision, triageRun, RUN_CLASSES } from "../scripts/acorn-cognitive-run-triage.mjs";

test("successful automation is silent", () => {
  const r = triageRun({ exitCode: 0 });
  assert.equal(r.classification, RUN_CLASSES.SUCCESS);
  assert.equal(r.notify, false);
});

test("expected unavailable capability is recorded, not escalated", () => {
  const r = triageRun({ exitCode: 1, reason: "GPU_RUNTIME_NOT_PRESENT" });
  assert.equal(r.classification, RUN_CLASSES.EXPECTED_FAILURE);
  assert.equal(r.notify, false);
});

test("transient infrastructure failure is retryable and silent", () => {
  const r = triageRun({ exitCode: 1, reason: "ETIMEDOUT" });
  assert.equal(r.classification, RUN_CLASSES.TRANSIENT_FAILURE);
  assert.equal(r.notify, false);
});

test("human authority gate remains visible", () => {
  const r = triageRun({ exitCode: 1, reason: "HUMAN_AUTHORITY_REQUIRED" });
  assert.equal(r.classification, RUN_CLASSES.WAITING_HUMAN);
  assert.equal(r.notify, true);
});

test("security failure remains visible", () => {
  const r = triageRun({ exitCode: 1, reason: "INTEGRITY_FAILURE" });
  assert.equal(r.classification, RUN_CLASSES.SECURITY);
  assert.equal(r.notify, true);
});

test("real regression remains visible", () => {
  const r = triageRun({ exitCode: 1, reason: "assertion failed in canonical runtime" });
  assert.equal(r.classification, RUN_CLASSES.REAL_REGRESSION);
  assert.equal(r.notify, true);
  assert.equal(notificationDecision(RUN_CLASSES.REAL_REGRESSION).action, "escalate");
});

test("recovered transient failure stays silent", () => {
  const r = notificationDecision(RUN_CLASSES.TRANSIENT_FAILURE, { recovered: true });
  assert.equal(r.notify, false);
});
