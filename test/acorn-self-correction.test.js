import test from "node:test";
import assert from "node:assert/strict";
import {
  SELF_CORRECTION_VERSION,
  classifyFailure,
  diagnoseFailure,
  findAlternatives,
  planRepair,
  applyRepair,
  verifyRepair,
  selfCorrect,
} from "../scripts/acorn-self-correction.mjs";

test("self-correction has stable identity and broad failure taxonomy", () => {
  assert.equal(SELF_CORRECTION_VERSION, "acorn.self-correction.v1");
  assert.equal(classifyFailure({ kind: "test", error: "assertion failed" }), "TEST");
  assert.equal(classifyFailure({ kind: "model", error: "429 capacity" }), "MODEL");
  assert.equal(classifyFailure({ humanRequired: true }), "HUMAN_AUTHORITY");
});

test("diagnosis remains evidence-aware and does not turn guesses into facts", () => {
  const d = diagnoseFailure({
    subject: "worker",
    kind: "connector",
    symptoms: ["channel unavailable"],
  });
  assert.equal(d.status, "DIAGNOSED");
  assert.equal(d.causal_status, "UNCONFIRMED");
  assert.equal(d.live, false);
});

test("alternative selection excludes authority, quarantine and current path", () => {
  const result = findAlternatives({
    diagnosis: { failure_class: "MODEL" },
    current: { id: "grok" },
    candidates: [
      { id: "grok", failure_classes: ["MODEL"], compatibility: 1, reliability: 1 },
      { id: "bad", failure_classes: ["MODEL"], compatibility: 1, reliability: 1, quarantined: true },
      { id: "authority", failure_classes: ["MODEL"], compatibility: 1, authority: true },
      { id: "other-model", failure_classes: ["MODEL"], compatibility: 0.9, reliability: 0.9, verified: true, cost: 1 },
    ],
  });
  assert.deepEqual(result.candidates.map((x) => x.id), ["other-model"]);
});

test("human and safety boundaries cannot be auto-applied", () => {
  const plan = planRepair({
    observation: { subject: "merge", operation: "merge" },
    diagnosis: { failure_class: "CODE" },
    alternatives: { candidates: [] },
  });
  assert.equal(plan.status, "WAITING_ON_HUMAN");
  assert.equal(plan.auto_apply, false);
});

test("repair application requires an explicit bounded handler", async () => {
  const blocked = await applyRepair({
    plan: { status: "REPAIR_PLANNED", failure_class: "CODE", auto_apply: true },
  });
  assert.equal(blocked.status, "BLOCKED");

  const applied = await applyRepair({
    plan: { status: "REPAIR_PLANNED", failure_class: "CODE", auto_apply: true },
    handlers: { CODE: async () => ({ applied: true, after: { fixed: true } }) },
  });
  assert.equal(applied.status, "APPLIED");
  assert.equal(applied.applied, true);
  assert.equal(applied.authority_changed, false);
});

test("verification requires tests, measurement and verified evidence", () => {
  const good = verifyRepair({
    before: { x: 1 },
    after: { x: 2 },
    tests: { passed: true, regression: false },
    measurements: { present: true },
    evidence: { verified: true },
  });
  assert.equal(good.status, "VERIFIED");
  assert.equal(good.retain, true);

  const weak = verifyRepair({
    before: { x: 1 },
    after: { x: 2 },
    tests: { passed: true },
    measurements: { present: false },
    evidence: { verified: true },
  });
  assert.equal(weak.status, "REJECTED");
});

test("full loop repairs, verifies, records state and continues", async () => {
  const result = await selfCorrect({
    observation: {
      subject: "worker",
      kind: "model",
      reason: "provider unavailable",
      current: { id: "primary" },
      before: { route: "primary" },
      constraints: { maxAttempts: 2 },
    },
    candidates: [
      { id: "fallback", failure_classes: ["MODEL"], compatibility: 1, reliability: 1, verified: true },
    ],
    handlers: {
      MODEL: async (plan) => ({ applied: true, after: { route: plan.target } }),
    },
    tests: { passed: true, regression: false },
    measurements: { present: true },
    evidence: { verified: true },
  });

  assert.equal(result.status, "RETAINED");
  assert.equal(result.verification.verified, true);
  assert.equal(result.checkpoint.history_preserved, true);
  assert.equal(result.continue, true);
  assert.equal(result.authority, "carl");
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
});
