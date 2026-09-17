import test from "node:test";
import assert from "node:assert/strict";
import {
  cortexConstitution,
  routeByCapability,
  composeCognitiveGraph,
  measureOutcome,
  falsify,
  cortexCycle,
  assertCortexInvariant,
} from "../scripts/cortex-cognition.mjs";

test("Cortex is the adaptive cognitive component inside Acorn", () => {
  const c = cortexConstitution();
  assert.deepEqual(c.hierarchy, ["CARL", "BREAKER", "ACORN", "CORTEX", "RESOURCES"]);
  assert.equal(c.cortex_belongs_to_acorn, true);
  assert.equal(c.acorn_owns_cortex, true);
  assert.equal(c.one_cortex, true);
  assert.equal(c.second_cortex, false);
  assert.equal(c.capability_is_not_authority, true);
  assert.equal(c.provider_is_not_authority, true);
  assert.equal(c.defense_is_internal_to_acorn, true);
});

test("routing is capability-oriented and provider-neutral", () => {
  const result = routeByCapability({
    task: { required_capabilities: ["reasoning"] },
    resources: [
      { id: "provider-a-model", provider: "provider-a", capabilities: ["reasoning"], presence: "CONNECTED" },
      { id: "provider-b-model", provider: "provider-b", capabilities: ["vision"], presence: "CONNECTED" },
    ],
  });
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].id, "provider-a-model");
  assert.equal(result.selected.length, 1);
  assert.equal(result.provider_preference, null);
});

test("Cortex composes a reversible cognitive graph", () => {
  const graph = composeCognitiveGraph({
    task: { id: "review", required_capabilities: ["review"] },
    resources: [{ id: "reviewer", provider: "unknown", capabilities: ["review"], presence: "CONNECTED" }],
  });
  assert.equal(graph.status, "DISCOVERED");
  assert.equal(graph.topology_is_reversible, true);
  assert.equal(graph.nodes[0].authority, false);
});

test("measurement remains distinct from causality", () => {
  const result = measureOutcome({ expected: 10, observed: 7, evidence: { executed: true } });
  assert.equal(result.status, "MEASURED");
  assert.equal(result.error, 3);
  assert.equal(result.causality, "INCONCLUSIVE");
  assert.equal(result.prediction_is_not_observation, true);
});

test("falsification blocks an explicitly contradicted claim", () => {
  const result = falsify({ claim: "expected", observation: "contradiction", contradiction: true, evidence: { executed: true } });
  assert.equal(result.refuted, true);
  assert.equal(result.verified, false);
});

test("full Cortex cycle preserves Acorn containment, defense and sovereignty", () => {
  const result = cortexCycle({
    task: { id: "integration", required_capabilities: ["review"] },
    resources: [{ id: "local-review", provider: "acorn", capabilities: ["review"], presence: "CONNECTED" }],
    expected: 10,
    observed: 9,
    evidence: { executed: true, verified: true },
    defense: { breaker: "OPEN" },
  });
  assert.equal(result.status, "VERIFIED");
  assert.equal(result.constitution.cortex_belongs_to_acorn, true);
  assert.equal(result.constitution.acorn_owns_cortex, true);
  assert.equal(result.authority, "carl");
  assert.equal(result.breaker_bypass, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.defense.state, "HEALTHY");
  assert.equal(result.live, false);
  assert.equal(assertCortexInvariant(result).status, "VERIFIED");
});

test("Cortex refuses verification when the defensive boundary is ambiguous", () => {
  const result = cortexCycle({
    task: { id: "protected", required_capabilities: ["review"] },
    resources: [{ id: "reviewer", provider: "resource", capabilities: ["review"], presence: "CONNECTED" }],
    expected: 1,
    observed: 1,
    evidence: { executed: true, verified: true },
    defense: { breaker: "AMBIGUOUS" },
  });
  assert.equal(result.status, "EXECUTED");
  assert.notEqual(result.defense.state, "HOLD_HUMAN");
  assert.equal(result.defense.breaker_bypass, false);
});
