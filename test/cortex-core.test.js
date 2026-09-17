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

test("Cortex hierarchy places cognition before Acorn substrate", () => {
  const c = cortexConstitution();
  assert.deepEqual(c.hierarchy, ["CARL", "BREAKER", "CORTEX", "ACORN", "RESOURCES"]);
  assert.equal(c.one_cortex, true);
  assert.equal(c.second_cortex, false);
  assert.equal(c.capability_is_not_authority, true);
  assert.equal(c.provider_is_not_authority, true);
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

test("full Cortex cycle preserves sovereignty and does not auto-merge", () => {
  const result = cortexCycle({
    task: { id: "integration", required_capabilities: ["review"] },
    resources: [{ id: "local-review", provider: "acorn", capabilities: ["review"], presence: "CONNECTED" }],
    expected: 10,
    observed: 9,
    evidence: { executed: true, verified: true },
  });
  assert.equal(result.status, "VERIFIED");
  assert.equal(result.authority, "carl");
  assert.equal(result.breaker_bypass, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
  assert.equal(assertCortexInvariant(result).status, "VERIFIED");
});
