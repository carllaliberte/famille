import test from "node:test";
import assert from "node:assert/strict";
import {
  VERSION, EMERGENCE_STATES, interactionGraph, detectEmergentPattern,
  ablationAnalysis, verifyEmergence, registerEmergentCapability,
  runCognitiveEmergenceCycle, assertCognitiveEmergenceInvariant,
} from "../scripts/acorn-cognitive-emergence.mjs";

test("emergence engine has bounded ontology", () => {
  assert.equal(VERSION, "acorn.cortex.cognitive-emergence.v1");
  assert.ok(EMERGENCE_STATES.includes("VERIFIED_EMERGENCE"));
  assert.ok(EMERGENCE_STATES.includes("MEASUREMENT_ARTIFACT"));
});

test("interaction graph normalizes only declared nodes and edges", () => {
  const graph = interactionGraph({
    components: [{ id: "a", kind: "STRATEGY" }, { id: "b", kind: "DREAM" }],
    relations: [{ from: "a", to: "b", weight: .8 }, { from: "a", to: "missing", weight: 1 }],
  });
  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.edges.length, 1);
});

test("novel cross-kind capability starts as a signal, never as truth", () => {
  const signal = detectEmergentPattern({
    baselineCapabilities: ["planning"],
    observedCapability: "adaptive-counterfactual-planning",
    components: [
      { id: "s", kind: "STRATEGY", capability: "planning" },
      { id: "d", kind: "DREAM", capability: "counterfactual-search" },
    ],
  });
  assert.equal(signal.state, "EMERGENT_SIGNAL");
  assert.equal(signal.hypothesis, "TRUE_EMERGENCE_HYPOTHESIS");
  assert.equal(signal.verified, false);
  assert.equal(signal.authority_granted, false);
});

test("ablation is required to support non-decomposability", () => {
  const result = ablationAnalysis({ candidate: { score: .9 }, ablations: [
    { component: "a", outcome: .5 }, { component: "b", outcome: .45 },
  ]});
  assert.equal(result.tested, true);
  assert.equal(result.non_decomposable_signal, true);
});

test("verification rejects incomplete replication/intervention evidence", () => {
  const signal = detectEmergentPattern({
    baselineCapabilities: [], observedCapability: "new-capability",
    components: [{ id: "a", kind: "STRATEGY" }, { id: "b", kind: "DREAM" }],
  });
  const blocked = verifyEmergence({
    signal,
    ablation: { tested: true, non_decomposable_signal: true },
    replication: { independent: false, success: false },
    intervention: { observed: false, effect_reproduced: false },
  });
  assert.equal(blocked.verified, false);
  assert.ok(blocked.reasons.includes("INDEPENDENT_REPLICATION_MISSING"));
});

test("only verified emergence can be registered", () => {
  const signal = { id: "x", capability: "x", components: ["a", "b"] };
  const blocked = registerEmergentCapability({ verification: { verified: false }, signal });
  assert.equal(blocked.registered, false);
  const accepted = registerEmergentCapability({ verification: { verified: true }, signal });
  assert.equal(accepted.registered, true);
  assert.equal(accepted.capability.authority_granted, false);
});

test("full cycle preserves sovereignty and keeps unknowns governable", () => {
  const result = runCognitiveEmergenceCycle({
    baselineCapabilities: ["planning"],
    components: [
      { id: "strategy", kind: "STRATEGY", capability: "planning", novelty: .4, confidence: .9, observability: 1, controllability: 1, reversibility: 1 },
      { id: "dream", kind: "DREAM", capability: "counterfactual-search", novelty: .9, confidence: .8, observability: .9, controllability: .8, reversibility: 1 },
    ],
    relations: [{ from: "strategy", to: "dream", weight: .8 }],
    observedCapability: "adaptive-counterfactual-planning",
    candidateOutcome: { baseline: .4, score: .9, blastRadius: .1 },
    ablations: [{ component: "strategy", outcome: .5 }, { component: "dream", outcome: .45 }],
    replication: { independent: true, success: true },
    intervention: { observed: true, effect_reproduced: true },
  });
  assert.equal(result.verification.verified, true);
  assert.equal(result.registration.registered, true);
  assert.deepEqual(assertCognitiveEmergenceInvariant(result), { status: "VERIFIED", violations: [] });
  assert.equal(result.authority_granted, false);
  assert.equal(result.breaker_bypass, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
});
