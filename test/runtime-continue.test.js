import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyFailure, decideContinuation, diagnoseWorkerEvidence, selfHealDecision } from "../scripts/self-heal.mjs";

const yaml = readFileSync(".github/workflows/codex-autonomous-worker.yml", "utf8");

test("continuation is not gated on a case-sensitive Run variable", () => {
  assert.equal(yaml.includes("vars.ACORN_SYSTEM_MODE == 'Run'"), false);
  assert.match(yaml, /Diagnose continuation/);
  assert.match(yaml, /node scripts\/runtime-continue\.mjs/);
});

test("healthy MEASURED evidence is not a failure and may hand off once", () => {
  const evidence = { status: "MEASURED", mode: "self-test", worker: "codex-autonomous-worker", run_id: "1" };
  const d = diagnoseWorkerEvidence(evidence, { ACORN_SYSTEM_MODE: "RUN" });
  assert.equal(d.applicable, false);
  assert.equal(d.action, "NOT_APPLICABLE");
  const cont = decideContinuation({ evidence, env: { ACORN_SYSTEM_MODE: "Run" }, eventName: "workflow_dispatch", depth: 0, continueRuntime: true, runId: "1" });
  assert.equal(cont.continue, true);
  assert.equal(cont.next, "DISPATCH");
  assert.equal(cont.breaker, "RUN");
  assert.equal(cont.self_test, true);
});

test("depth 1 stops the chain", () => {
  const cont = decideContinuation({
    evidence: { status: "MEASURED", mode: "self-test" },
    env: { ACORN_SYSTEM_MODE: "RUN" },
    eventName: "workflow_dispatch",
    depth: 1,
    continueRuntime: true,
  });
  assert.equal(cont.continue, false);
  assert.equal(cont.next, "STOP");
  assert.equal(cont.reason, "CONTINUATION_DEPTH_BOUNDED");
});

test("HUMAN_REQUIRED pauses without pretending the step was skipped", () => {
  const evidence = {
    status: "HUMAN_REQUIRED",
    human_actions_required: [{ reason: "même erreur Codex × 3", evidence: ["NETWORK::openrouter_proxy_diag response status=429"], attempts: 3 }],
    codex: { executed: true, status: "CODEX_FAILED" },
  };
  const d = diagnoseWorkerEvidence(evidence, { ACORN_SYSTEM_MODE: "RUN" });
  assert.equal(d.action, "HOLD_HUMAN");
  const cont = decideContinuation({ evidence, env: { ACORN_SYSTEM_MODE: "RUN" }, eventName: "workflow_dispatch", depth: 0, continueRuntime: true });
  assert.equal(cont.continue, false);
  assert.equal(cont.next, "HOLD_HUMAN");
});

test("CODEX_FAILED 429 with no escalation yet requests self-heal retry", () => {
  const evidence = { status: "CODEX_FAILED", reason: "openrouter 429", codex: { executed: true, status: "CODEX_FAILED" } };
  const d = diagnoseWorkerEvidence(evidence, { ACORN_SYSTEM_MODE: "RUN" });
  assert.equal(d.failure_class, "TRANSIENT");
  assert.equal(d.action, "RETRY");
  const cont = decideContinuation({ evidence, env: { ACORN_SYSTEM_MODE: "RUN" }, eventName: "schedule", depth: 0 });
  assert.equal(cont.continue, true);
  assert.equal(cont.next, "SELF_HEAL");
});

test("breaker OFF stops continuation even if the YAML variable casing is Run", () => {
  const cont = decideContinuation({
    evidence: { status: "MEASURED" },
    env: { ACORN_SYSTEM_MODE: "OFF" },
    eventName: "schedule",
    depth: 0,
  });
  assert.equal(cont.continue, false);
  assert.equal(cont.next, "STOP");
});

test("missing tool is BUILD_TOOL not a hard stop", () => {
  assert.equal(classifyFailure({ reason: "outil manquant live-proof" }), "CAPABILITY_MISSING");
  assert.equal(selfHealDecision({ reason: "capability missing" }).action, "BUILD_TOOL");
});
