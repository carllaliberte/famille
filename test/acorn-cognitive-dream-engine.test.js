import test from "node:test";
import assert from "node:assert/strict";
import {
  COGNITIVE_DREAM_ENGINE_VERSION,
  createDreamReality,
  createDreamHypothesis,
  dreamWorld,
  generateDream,
  discoverCrossWorldInvariants,
  discoverConditionalInvariants,
  detectEmergentCapability,
  dreamDivergence,
  validateDreamRealityBoundary,
  chooseDreamExperiment,
  runDreamCycle,
  assertCognitiveDreamInvariant,
} from "../scripts/acorn-cognitive-dream-engine.mjs";

test("creates simulated worlds without turning simulation into reality", () => {
  const reality = createDreamReality({ state: { x: 1 }, at: "t0", source: "measured" });
  const hypothesis = createDreamHypothesis({ question: "what next?", objective: "learn" });
  const world = dreamWorld({ reality, hypothesis, transition: { action: "grow", delta: { x: 2 } } });
  assert.equal(world.kind, "PREDICTION");
  assert.equal(world.simulated, true);
  assert.equal(world.observed, false);
  assert.equal(world.authority_granted, false);
  assert.equal(world.live, false);
});

test("discovers cross-world convergence and divergence", () => {
  const reality = createDreamReality({ state: { stable: 1, variable: 0 } });
  const hypothesis = createDreamHypothesis({ question: "future" });
  const dream = generateDream({ reality, hypothesis, futures: [
    { id: "a", delta: { stable: 0, variable: 1 } },
    { id: "b", delta: { stable: 0, variable: 2 } },
    { id: "c", delta: { stable: 0, variable: 3 } },
  ] });
  const invariants = discoverCrossWorldInvariants({ worlds: dream.worlds, minSupport: 3 });
  assert.equal(invariants.length, 1);
  assert.equal(invariants[0].feature, "stable");
  assert.equal(invariants[0].value, 1);
  assert.equal(dreamDivergence({ worlds: dream.worlds }).distinct_states, 3);
});

test("conditional invariants are scoped to explicit conditions", () => {
  const reality = createDreamReality({ state: { mode: "base", x: 0 } });
  const hypothesis = createDreamHypothesis({ question: "conditional future" });
  const worlds = generateDream({ reality, hypothesis, futures: [
    { id: "a", delta: { mode: "hot", x: 1 } },
    { id: "b", delta: { mode: "hot", x: 1 } },
    { id: "c", delta: { mode: "cold", x: 9 } },
  ] }).worlds;
  const conditional = discoverConditionalInvariants({ worlds, conditions: [{ when: { mode: "hot" } }] });
  assert.equal(conditional.length, 1);
  assert.equal(conditional[0].worlds.length, 2);
  assert.ok(conditional[0].invariants.some((x) => x.feature === "x" && x.value === 1));
});

test("emergent capability detection never grants authority", () => {
  const result = detectEmergentCapability({ baselineCapabilities: ["reason"], worlds: [
    { capabilities: ["reason", "compose"] }, { capabilities: ["reason", "compose"] },
  ] });
  assert.deepEqual(result.emergent, ["compose"]);
  assert.equal(result.capability_jump, true);
  assert.equal(result.authority_granted, false);
});

test("information-seeking chooses the safer experiment", () => {
  const selected = chooseDreamExperiment({
    unknownSpace: [{ id: "u1" }],
    experiments: [
      { id: "risky", expected_information_gain: 1, risk: 1, reversibility: 0, observability: 1 },
      { id: "safe", expected_information_gain: .8, risk: .1, reversibility: 1, observability: 1, target: "u1" },
    ],
  });
  assert.equal(selected.status, "SELECTED");
  assert.equal(selected.experiment.id, "safe");
});

test("dream boundary blocks observation, authority and live claims", () => {
  const reality = createDreamReality({ state: { x: 1 } });
  const hypothesis = createDreamHypothesis({ question: "x" });
  const world = dreamWorld({ reality, hypothesis, transition: { delta: { x: 1 } } });
  assert.equal(validateDreamRealityBoundary({ reality, worlds: [world], observations: [] }).status, "VERIFIED");
  assert.equal(validateDreamRealityBoundary({ reality, worlds: [{ ...world, observed: true }], observations: [] }).status, "BLOCKED");
  assert.equal(validateDreamRealityBoundary({ reality, worlds: [{ ...world, authority_granted: true }], observations: [] }).status, "BLOCKED");
  assert.equal(validateDreamRealityBoundary({ reality, worlds: [{ ...world, live: true }], observations: [] }).status, "BLOCKED");
});

test("full dream cycle remains inside Acorn constitutional boundaries", () => {
  const result = runDreamCycle({
    reality: { state: { capacity: 5 }, at: "t0", source: "measured" },
    hypothesis: { question: "which futures converge?", objective: "learn", conditions: [{ when: { capacity: 6 } }] },
    futures: [
      { id: "a", delta: { capacity: 1 }, probability: .6, utility: 5 },
      { id: "b", delta: { capacity: 4 }, probability: .4, utility: 9 },
      { id: "c", delta: { capacity: 1 }, probability: .2, utility: 4 },
    ],
    unknownSpace: [{ id: "u1", testable: true }],
    experiments: [{ id: "probe", expected_information_gain: .9, risk: .1, reversibility: 1, observability: 1 }],
  });
  assert.equal(result.version, COGNITIVE_DREAM_ENGINE_VERSION);
  assert.equal(result.status, "VERIFIED");
  assert.equal(result.reality.kind, "REALITY");
  assert.equal(result.dream.worlds.length, 3);
  assert.equal(result.information_seeking.experiment.id, "probe");
  assert.equal(result.authority_granted, false);
  assert.equal(result.breaker_bypass, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
  assert.equal(assertCognitiveDreamInvariant(result).status, "VERIFIED");
});
