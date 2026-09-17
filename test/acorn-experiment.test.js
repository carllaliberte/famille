import test from "node:test";
import assert from "node:assert/strict";
import {
  compositionExperiment,
  causalExperiment,
  adversarialCognition,
  cognitiveDiversity,
  selfReinforcementLoop,
  measureCapabilityAcceleration,
  cortexMetacognition,
} from "../scripts/acorn-experiment.mjs";

test("composition is not assumed additive until measured", () => {
  const unmeasured = compositionExperiment({
    a: { capability: 1 },
    b: { capability: 1 },
    composition: { capability: 99 },
    measured: false,
  });
  assert.equal(unmeasured.status, "INCONCLUSIVE");
  assert.equal(unmeasured.emergent_capability, false);
  const measured = compositionExperiment({
    a: { capability: 1, risk: 1 },
    b: { capability: 1, risk: 1 },
    composition: { capability: 5, risk: 4, unexpected: true, amplification: 2 },
    measured: true,
  });
  assert.equal(measured.emergent_capability, true);
  assert.equal(measured.emergent_risk, true);
  assert.equal(measured.unexpected_behavior, true);
});

test("causal experiment without intervention is inconclusive", () => {
  assert.equal(causalExperiment({}).status, "INCONCLUSIVE");
  assert.equal(causalExperiment({
    intervention: true, control: true, counterfactual: true, outcome: "delta",
  }).status, "SUPPORTED");
});

test("winning an adversarial round grants no authority", () => {
  const row = adversarialCognition({
    claim: "x",
    winner: "falsifier",
    independently_verified: true,
  });
  assert.equal(row.extra_authority, 0);
  assert.equal(row.winner_is_not_sovereign, true);
  assert.equal(row.merge_authorized, false);
});

test("consensus is not truth; shared provider is a diversity failure", () => {
  const d = cognitiveDiversity({
    intelligences: [
      { id: "a", provider: "xai", model_family: "grok", answer: "yes" },
      { id: "b", provider: "xai", model_family: "grok", answer: "yes" },
    ],
  });
  assert.equal(d.consensus_is_not_truth, true);
  assert.equal(d.shared_error_source, true);
});

test("self-reinforcement loops are observable", () => {
  const loop = selfReinforcementLoop({
    edges: [
      { from: "A", to: "B", gain: 2 },
      { from: "B", to: "C", gain: 2 },
      { from: "C", to: "A", gain: 2, external: true },
      { from: "prediction", to: "action" },
      { from: "action", to: "observation" },
      { from: "observation", to: "learning" },
      { from: "learning", to: "prediction" },
    ],
  });
  assert.ok(loop.loop_depth >= 3);
  assert.equal(loop.prediction_action_learning_loop, true);
  assert.equal(loop.observable, true);
  assert.equal(loop.amplification, true);
});

test("capability acceleration never auto-escalates authority", () => {
  const row = measureCapabilityAcceleration({
    series: [
      { capability: 1, autonomy: 0, connectivity: 0, control_gap: 0 },
      { capability: 12, autonomy: 4, connectivity: 6, control_gap: 5 },
    ],
  });
  assert.equal(row.status, "MEASURED");
  assert.equal(row.authority_growth, 0);
  assert.equal(row.automatic_authority_escalation, false);
  assert.equal(row.qualitative_jump, true);
});

test("metacognition is internal to Cortex, not a second Cortex", () => {
  const m = cortexMetacognition({});
  assert.equal(m.second_cortex, false);
  assert.equal(m.internal_to_cortex, true);
  assert.equal(m.live, false);
});
