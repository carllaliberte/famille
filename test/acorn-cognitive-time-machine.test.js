import test from "node:test";
import assert from "node:assert/strict";
import {
  COGNITIVE_TIME_MACHINE_VERSION,
  WORLD_STATES,
  UNKNOWN_STATES,
  createReality,
  createHypothesis,
  createWorld,
  realizeWorld,
  falsifyWorld,
  compareStates,
  measurePredictionError,
  measureCounterfactualError,
  measureDecisionRegret,
  classifyUnknown,
  informationGain,
  selectInformationSeekingExperiment,
  runCausalIntervention,
  buildWorldLineage,
  runCognitiveTimeMachineCycle,
  assertCognitiveTimeMachineInvariant,
} from "../scripts/acorn-cognitive-time-machine.mjs";

test("builds immutable possible worlds without confusing them with reality", () => {
  const reality = createReality({ state: { capacity: 10 }, at: "t0", source: "measured" });
  const hypothesis = createHypothesis({ question: "what next?", objective: "learn" });
  const world = createWorld({ reality, hypothesis, transition: { action: "grow", delta: { capacity: 3 } }, kind: "COUNTERFACTUAL" });
  assert.equal(world.kind, "COUNTERFACTUAL");
  assert.equal(world.prediction, true);
  assert.equal(world.observation, false);
  assert.equal(world.state.capacity, 13);
  assert.notEqual(world.id, reality.fingerprint);
  assert.ok(Object.isFrozen(world));
  assert.ok(WORLD_STATES.includes(world.kind));
});

test("realization creates an observation distinct from the prediction", () => {
  const reality = createReality({ state: { x: 1 }, at: "t0", source: "sensor" });
  const hypothesis = createHypothesis({ question: "x?" });
  const world = createWorld({ reality, hypothesis, transition: { action: "increase", delta: { x: 2 } } });
  const realized = realizeWorld(world, { state: { x: 2 }, at: "t1", source: "sensor" });
  assert.equal(world.kind, "PREDICTED");
  assert.equal(world.prediction, true);
  assert.equal(realized.kind, "REALIZED");
  assert.equal(realized.prediction, false);
  assert.equal(realized.observation, true);
  assert.deepEqual(realized.observed_state, { x: 2 });
});

test("prediction error is measured rather than rewritten", () => {
  const reality = createReality({ state: { x: 1 }, at: "t0", source: "sensor" });
  const hypothesis = createHypothesis({ question: "x?" });
  const world = createWorld({ reality, hypothesis, transition: { delta: { x: 4 } } });
  const error = measurePredictionError(world, { state: { x: 3 }, at: "t1", measured: true, verified: true });
  assert.equal(error.type, "PREDICTION_ERROR");
  assert.equal(error.absolute_error, 2);
  assert.equal(error.measured, true);
  assert.equal(error.verified, true);
  assert.equal(world.state.x, 5);
});

test("falsification and contradiction remain explicit historical states", () => {
  const reality = createReality({ state: { x: 0 }, at: "t0" });
  const hypothesis = createHypothesis({ question: "x?" });
  const world = createWorld({ reality, hypothesis, transition: { delta: { x: 10 } } });
  const falsified = falsifyWorld(world, { state: { x: 1 }, at: "t1", reason: "measured divergence" });
  assert.equal(falsified.kind, "FALSIFIED");
  assert.equal(falsified.prediction, true);
  assert.equal(falsified.observation, true);
  assert.equal(falsified.falsification.reason, "measured divergence");
});

test("counterfactual error and decision regret are separately measurable", () => {
  const actual = { id: "real", kind: "REALIZED", state: { utility: 5 }, observation: true };
  const alternative = { id: "alt", kind: "COUNTERFACTUAL", state: { utility: 8 } };
  const cf = measureCounterfactualError({ counterfactual: alternative, actual });
  const regret = measureDecisionRegret({ selectedUtility: 4, realizedUtility: 5, bestCounterfactualUtility: 8 });
  assert.equal(cf.type, "COUNTERFACTUAL_ERROR");
  assert.equal(cf.verified, true);
  assert.equal(regret.realized_regret, 3);
  assert.equal(regret.prediction_regret, 0);
});

test("unknown space is classified and information-seeking chooses the safer high-value probe", () => {
  assert.equal(classifyUnknown({ observable: false, testable: true }), "UNKNOWN-BUT-TESTABLE");
  assert.equal(classifyUnknown({ observable: false, testable: false }), "UNKNOWN-BUT-INACCESSIBLE");
  assert.equal(classifyUnknown({ critical: true }), "UNKNOWN-BUT-CRITICAL");
  assert.ok(UNKNOWN_STATES.includes(classifyUnknown({ risk: .95, observable: true, modelCoverage: .01 })));
  const gain = informationGain(["a", "b", "c"], ["b"]);
  assert.equal(gain.resolved, 2);
  assert.equal(gain.introduced, 0);
  const selected = selectInformationSeekingExperiment({
    unknownSpace: [{ id: "u", classification: "UNKNOWN-BUT-TESTABLE" }],
    candidates: [
      { id: "risky", expected_information_gain: 1, risk: 1, reversibility: 0, observability: 1 },
      { id: "probe", expected_information_gain: .8, risk: .1, reversibility: 1, observability: 1 },
    ],
  });
  assert.equal(selected.status, "SELECTED");
  assert.equal(selected.experiment.id, "probe");
});

test("causal claims require intervention evidence and verification", () => {
  const baseline = { state: { value: 10 } };
  const intervention = { id: "i1", delta: { value: 5 } };
  const inconclusive = runCausalIntervention({ baseline, intervention, outcome: { state: { value: 20 }, measured: true, verified: false } });
  const measured = runCausalIntervention({ baseline, intervention, outcome: { baseline_state: { value: 10 }, state: { value: 15 }, measured: true, verified: true } });
  assert.equal(inconclusive.status, "CAUSAL_INCONCLUSIVE");
  assert.equal(measured.status, "CAUSAL_MEASURED");
  assert.equal(measured.verified, true);
  assert.equal(measured.observation_is_not_causality, false);
});

test("world lineage is append-only and digest-bound", () => {
  const reality = createReality({ state: { x: 1 }, at: "t0" });
  const hypothesis = createHypothesis({ question: "x?" });
  const a = createWorld({ reality, hypothesis, transition: { action: "a", delta: { x: 1 } } });
  const b = createWorld({ reality, hypothesis, transition: { action: "b", delta: { x: 2 } } });
  const lineage = buildWorldLineage({ reality, worlds: [a, b] });
  assert.equal(lineage.append_only, true);
  assert.equal(lineage.nodes.length, 3);
  assert.equal(lineage.nodes[0].kind, "REALITY");
  assert.equal(typeof lineage.lineage, "string");
});

test("full time-machine cycle keeps reality, predictions, counterfactuals and unknowns separate", () => {
  const result = runCognitiveTimeMachineCycle({
    reality: { state: { capacity: 5 }, at: "t0", source: "measured" },
    hypothesis: { question: "which future?", objective: "learn", assumptions: { bounded: true } },
    futures: [
      { id: "a", action: "safe", delta: { capacity: 1 }, probability: .6, utility: 5 },
      { id: "b", action: "experimental", delta: { capacity: 4 }, probability: .4, utility: 9, kind: "COUNTERFACTUAL" },
    ],
    observation: { state: { capacity: 6 }, at: "t1", source: "measured" },
    unknown_space: [{ id: "u1", testable: true, observable: false }],
    experiments: [{ id: "probe", expected_information_gain: .9, risk: .1, reversibility: 1, observability: 1 }],
  });
  assert.equal(result.version, COGNITIVE_TIME_MACHINE_VERSION);
  assert.equal(result.status, "VERIFIED");
  assert.equal(result.realized.kind, "REALIZED");
  assert.equal(result.worlds.length, 2);
  assert.equal(result.memory.possible_worlds.length, 2);
  assert.equal(result.memory.unrealized_worlds.length, 2);
  assert.equal(result.information_seeking.experiment.id, "probe");
  assert.equal(result.authority_granted, false);
  assert.equal(result.breaker_bypass, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
  assert.equal(assertCognitiveTimeMachineInvariant(result).status, "VERIFIED");
});

test("no authority can be smuggled through a future-world object", () => {
  const reality = createReality({ state: { x: 1 }, at: "t0" });
  const hypothesis = createHypothesis({ question: "x?" });
  const world = createWorld({ reality, hypothesis, transition: { delta: { x: 1 } } });
  const compromised = { ...world, authority_granted: true };
  const result = assertCognitiveTimeMachineInvariant({
    reality, hypothesis, worlds: [compromised],
    lineage: buildWorldLineage({ reality, worlds: [compromised] }),
    authority: "carl", authority_granted: false, breaker_bypass: false, auto_merge: false, live: false,
  });
  assert.equal(result.status, "BLOCKED");
  assert.ok(result.violations.some((v) => v.endsWith(":AUTHORITY")));
});
