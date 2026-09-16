import test from "node:test";
import assert from "node:assert/strict";
import {
  applyVerifiedRevision,
  assertLearningConstitution,
  causalAssessment,
  classifyPredictionError,
  createPrediction,
  learnFromExperience,
  measurePredictionError,
  nextPrediction,
  observeReality,
  proposeModelRevision,
  rememberExperience,
} from "../scripts/reality-learning-engine.mjs";

test("prediction is stored before observation and never rewritten", () => {
  const p = createPrediction({ hypothesis: "worker succeeds", expected: true, context: { path: "worker" }, at: "2026-09-16T20:00:00Z" });
  const o = observeReality({ prediction: p.prediction, actual: false, context: { path: "worker" }, at: "2026-09-16T20:01:00Z" });
  const m = measurePredictionError({ prediction: p.prediction, observation: o.observation });
  assert.equal(p.prediction.rewritten, false);
  assert.equal(m.error.absolute, 1);
  assert.equal(m.error.prediction_rewritten, false);
});

test("prediction error becomes measurable information", () => {
  const p = createPrediction({ hypothesis: "latency", expected: 100, context: { path: "a" } });
  const o = observeReality({ prediction: p.prediction, actual: 140, context: { path: "a" } });
  const m = measurePredictionError({ prediction: p.prediction, observation: o.observation });
  assert.equal(m.error.absolute, 40);
  assert.equal(m.error.relative, 0.4);
  assert.equal(classifyPredictionError(m.error).class, "LARGE_ERROR");
});

test("observation does not become causality without intervention and control", () => {
  assert.equal(causalAssessment({ observation: { actual: 1 } }).status, "INCONCLUSIVE");
  assert.equal(causalAssessment({ observation: { actual: 1 }, intervention: { action: "x" } }).status, "INCONCLUSIVE");
  assert.equal(causalAssessment({ observation: { actual: 1 }, intervention: { action: "x" }, controls: [{ id: "c" }] }).status, "MEASURED");
});

test("measured error proposes a model revision but does not apply it", () => {
  const p = createPrediction({ hypothesis: "x", expected: 10 });
  const o = observeReality({ prediction: p.prediction, actual: 15 });
  const m = measurePredictionError({ prediction: p.prediction, observation: o.observation });
  const r = proposeModelRevision({ model: { version: 1 }, error: m.error });
  assert.equal(r.status, "PROPOSED");
  assert.equal(r.revision.proposed_version, 2);
  assert.equal(r.revised, false);
  assert.equal(applyVerifiedRevision({ model: { version: 1 }, revision: r.revision }).status, "INCONCLUSIVE");
  assert.equal(applyVerifiedRevision({ model: { version: 1 }, revision: r.revision, verification: { verified: true } }).status, "MODEL_REVISED");
});

test("verified experience becomes memory and informs the next prediction", () => {
  const p = createPrediction({ hypothesis: "x", expected: 1, context: { route: "r" } });
  const o = observeReality({ prediction: p.prediction, actual: 2, context: { route: "r" } });
  const m = measurePredictionError({ prediction: p.prediction, observation: o.observation });
  const memory = rememberExperience({ prediction: p.prediction, observation: o.observation, error: m.error, verification: { verified: true }, context: { route: "r" } });
  const next = nextPrediction({ model: { version: 1 }, hypothesis: "x", expected: 2, memory: [memory.memory], context: { route: "r" } });
  assert.equal(memory.memory.verified, true);
  assert.equal(next.prediction.learning_applied, true);
  assert.equal(next.prediction.correction_signals, 1);
});

test("integrated loop exposes the complete learning chain", () => {
  const result = learnFromExperience({
    hypothesis: "worker completes task",
    expected: true,
    actual: false,
    context: { capability: "execute" },
    model: { version: 1 },
    verification: { verified: true },
  });
  assert.equal(result.status, "LEARNED");
  assert.equal(result.learning.error_to_information, true);
  assert.equal(result.memory.verified, true);
  assert.equal(result.revision.status, "PROPOSED");
  assert.equal(result.live, false);
  assert.equal(result.auto_merge, false);
});

test("constitution blocks authority escalation", () => {
  assert.throws(() => assertLearningConstitution({ auto_merge: true }), /LEARNING_AUTO_MERGE_FORBIDDEN/);
  assert.throws(() => assertLearningConstitution({ merge: true }), /LEARNING_AUTO_MERGE_FORBIDDEN/);
  assert.throws(() => assertLearningConstitution({ self_authorization: true }), /LEARNING_SELF_AUTHORIZATION_FORBIDDEN/);
  assert.deepEqual(assertLearningConstitution({}), {
    ok: true,
    capability_is_not_authority: true,
    self_evolution_is_not_self_authorization: true,
    predictions_are_immutable: true,
  });
});
