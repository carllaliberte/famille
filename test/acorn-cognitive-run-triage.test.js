import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  notificationDecision,
  triageRun,
  workflowExitCode,
  RUN_CLASSES,
} from "../scripts/acorn-cognitive-run-triage.mjs";

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

test("notify true fails the workflow for regression, human, and security", () => {
  assert.equal(workflowExitCode(triageRun({ exitCode: 1, reason: "assertion failed" })), 1);
  assert.equal(workflowExitCode(triageRun({ exitCode: 1, reason: "HUMAN_AUTHORITY_REQUIRED" })), 1);
  assert.equal(workflowExitCode(triageRun({ exitCode: 1, reason: "INTEGRITY_FAILURE" })), 1);
});

test("notify false keeps expected and transient steps green", () => {
  assert.equal(workflowExitCode(triageRun({ exitCode: 0 })), 0);
  assert.equal(workflowExitCode(triageRun({ exitCode: 1, reason: "GPU_RUNTIME_NOT_PRESENT" })), 0);
  assert.equal(workflowExitCode(triageRun({ exitCode: 1, reason: "ETIMEDOUT" })), 0);
});

test("bare HOLD is a human gate, not an expected failure", () => {
  const r = triageRun({ exitCode: 1, stderr: "Verdict : HOLD" });
  assert.equal(r.classification, RUN_CLASSES.WAITING_HUMAN);
  assert.equal(r.notify, true);
  assert.equal(workflowExitCode(r), 1);
});

test("HOLD_HUMAN stays a human gate", () => {
  const r = triageRun({ exitCode: 1, reason: "HOLD_HUMAN" });
  assert.equal(r.classification, RUN_CLASSES.WAITING_HUMAN);
  assert.equal(r.notify, true);
});

test("organism WAITING_HUMAN state stays visible even when the engine exits 0", () => {
  const r = triageRun({
    exitCode: 0,
    stderr: JSON.stringify({ state: "WAITING_HUMAN", blocked: 1 }),
  });
  assert.equal(r.classification, RUN_CLASSES.WAITING_HUMAN);
  assert.equal(r.notify, true);
  assert.equal(workflowExitCode(r), 1);
});

test("CLI exit code follows notify, not only REAL_REGRESSION", () => {
  const run = (env) => spawnSync(process.execPath, ["scripts/acorn-cognitive-run-triage.mjs"], {
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  assert.equal(run({ ACORN_RUN_EXIT_CODE: "1", ACORN_RUN_REASON: "INTEGRITY_FAILURE" }).status, 1);
  assert.equal(run({ ACORN_RUN_EXIT_CODE: "1", ACORN_RUN_REASON: "HOLD_HUMAN" }).status, 1);
  assert.equal(run({ ACORN_RUN_EXIT_CODE: "1", ACORN_RUN_STDERR: "HOLD" }).status, 1);
  assert.equal(run({ ACORN_RUN_EXIT_CODE: "1", ACORN_RUN_REASON: "assertion failed" }).status, 1);
  assert.equal(run({ ACORN_RUN_EXIT_CODE: "1", ACORN_RUN_REASON: "GPU_RUNTIME_NOT_PRESENT" }).status, 0);
  assert.equal(run({ ACORN_RUN_EXIT_CODE: "0" }).status, 0);
});
