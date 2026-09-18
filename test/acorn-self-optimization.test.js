import test from "node:test";
import assert from "node:assert/strict";
import {
  defineObjective,
  observePerformance,
  scoreOptimization,
  proposeOptimization,
  compareOutcomes,
  acceptOptimization,
  authorizeOptimization,
  applyOptimization,
  learnOptimization,
  reuseOptimization,
  assertSelfOptimizationConstitution
} from "../scripts/acorn-self-optimization.mjs";

test("Acorn can define what good means", () => {
  const o = defineObjective({ name: "RELIABILITY", weight: 2 });
  assert.equal(o.state, "DEFINED");
});

test("Acorn measures improvement", () => {
  const m = observePerformance({ objective: "QUALITY", baseline: 70, current: 85, evidence: ["test"] });
  assert.equal(m.delta, 15);
});

test("Acorn scores multi-objective improvement", () => {
  const o = [defineObjective({ name: "QUALITY", weight: 2 }), defineObjective({ name: "COST_EFFICIENCY" })];
  const s = scoreOptimization({
    objectives: o,
    measurements: [
      { objective: "QUALITY", delta: 10 },
      { objective: "COST_EFFICIENCY", delta: 5 }
    ]
  });
  assert.equal(s.score, 25);
  assert.equal(s.state, "MEASURED");
});

test("Acorn proposes before acting", () => {
  const p = proposeOptimization({
    current_state: "A",
    objectives: [defineObjective({ name: "QUALITY" })],
    candidate: "B",
    expected_gain: 10,
    expected_cost: 2
  });
  assert.equal(p.state, "PROPOSED");
  assert.equal(p.requires_human_authorization, true);
  assert.equal(p.live, false);
  assert.equal(assertSelfOptimizationConstitution(p), true);
});

test("Acorn learns from outcomes", () => {
  const x = acceptOptimization({
    proposal: proposeOptimization({ candidate: "B" }),
    measured_gain: 8,
    minimum_gain: 1
  });
  const l = learnOptimization({ history: [x] });
  assert.equal(l.successful_count, 1);
});

test("compareOutcomes writes delta so the score is not 0/NaN", () => {
  const objectives = [defineObjective({ name: "QUALITY", weight: 2 })];
  const compared = compareOutcomes({
    before: { QUALITY: 70 },
    after: { QUALITY: 85 },
    objectives
  });
  assert.equal(compared.score, 30);
  assert.equal(compared.state, "MEASURED");
  assert.equal(Number.isNaN(compared.score), false);
});

test("compareOutcomes stays DEFINED when a value is missing", () => {
  const compared = compareOutcomes({
    before: {},
    after: { QUALITY: 85 },
    objectives: [defineObjective({ name: "QUALITY" })]
  });
  assert.equal(compared.state, "DEFINED");
  assert.equal(compared.scored, 0);
  assert.equal(compared.score, 0);
  assert.equal(Number.isNaN(compared.score), false);
});

test("MIN direction inverts the delta", () => {
  const s = scoreOptimization({
    objectives: [defineObjective({ name: "LATENCY", direction: "MIN" })],
    measurements: [{ objective: "LATENCY", delta: -4 }]
  });
  assert.equal(s.score, 4);
});

test("authorize is read; apply does not execute live", () => {
  const proposal = proposeOptimization({ candidate: "B" });
  assert.throws(() => applyOptimization({ proposal }), /AUTHORIZATION_REQUIRED/);
  const held = authorizeOptimization({ proposal, human_authorized: false });
  assert.equal(held.state, "HOLD_HUMAN");
  assert.equal(held.authorized, false);
  const authorized = authorizeOptimization({ proposal, human_authorized: true });
  const applied = applyOptimization({ proposal: authorized });
  assert.equal(applied.state, "APPLIED_IN_MEMORY");
  assert.equal(applied.executed, false);
  assert.equal(applied.live, false);
});

test("reuse is a hypothesis, not a measured live change", () => {
  const accepted = acceptOptimization({
    proposal: proposeOptimization({ candidate: "B" }),
    measured_gain: 8,
    minimum_gain: 1
  });
  const learned = learnOptimization({ history: [accepted] });
  const reused = reuseOptimization({ learning: learned, candidate: "B" });
  assert.equal(reused.state, "REUSED_AS_HYPOTHESIS");
  assert.equal(reused.requires_measurement, true);
  assert.throws(() => reuseOptimization({ learning: learned, candidate: "Z" }), /PATTERN_NOT_MEASURED/);
});

test("Acorn never converts optimization into authority", () => {
  assert.throws(() => assertSelfOptimizationConstitution(), /CONSTITUTION_SNAPSHOT_REQUIRED/);
  assert.throws(() => assertSelfOptimizationConstitution({}), /CONSTITUTION_SNAPSHOT_REQUIRED/);
  const ok = proposeOptimization({ candidate: "rail" });
  assert.equal(assertSelfOptimizationConstitution(ok), true);
  assert.throws(() => assertSelfOptimizationConstitution({ ...ok, breaker_touched: true }), /BREAKER/);
  assert.throws(() => assertSelfOptimizationConstitution({ ...ok, auto_merge: true }), /MERGE/);
  assert.throws(() => assertSelfOptimizationConstitution({ ...ok, auto_spend: true }), /SPEND/);
  assert.throws(() => assertSelfOptimizationConstitution({ ...ok, auto_signature: true }), /SIGNATURE/);
  assert.throws(() => assertSelfOptimizationConstitution({ ...ok, authority_transfer: true }), /AUTHORITY/);
});
