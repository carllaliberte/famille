import test from "node:test";
import assert from "node:assert/strict";

import {
  ingestMaterial,
  digestMaterial,
  assimilateMaterial,
  metabolicValue,
  homeostasis,
  allocateResources,
  recycleMaterial,
  metabolicCycle,
  assertCognitiveMetabolismInvariant,
} from "../scripts/acorn-cognitive-metabolism.mjs";

test("intake never becomes truth by ingestion alone", () => {
  const x = ingestMaterial({ id: "u", subject: "unknown" });
  assert.equal(x.state, "IDENTIFIED");
  assert.equal(x.live, false);
  assert.ok(x.confidence < 1);
});

test("digestion preserves contradictions and unknowns", () => {
  const x = digestMaterial({
    id: "d",
    subject: "contradictory claim",
    contradictions: ["e1", "e2"],
    unknowns: ["missing-observation"],
    provenance: { source: "test" },
  });
  assert.equal(x.contradictions.length, 2);
  assert.equal(x.unknowns.length, 1);
  assert.equal(x.live, false);
});

test("assimilation requires measurement, verification and provenance", () => {
  const good = assimilateMaterial({
    id: "good",
    subject: "verified",
    provenance: { source: "test" },
    measured: true,
    verified: true,
    admissibility: 1,
    integrity: 1,
    freshness: 1,
    novelty: 1,
  });
  const bad = assimilateMaterial({
    id: "bad",
    subject: "unproven",
    verified: true,
    measured: true,
  });
  assert.equal(good.state, "ASSIMILABLE");
  assert.equal(bad.state, "QUARANTINED");
});

test("metabolic value rewards information and capability while penalizing cost", () => {
  const high = metabolicValue({
    information_value: 1,
    capability_unlock: 1,
    reliability: 1,
    freshness: 1,
    reversibility: 1,
    cost: 0,
    risk: 0,
    redundancy: 0,
  });
  const low = metabolicValue({
    information_value: 0.1,
    capability_unlock: 0.1,
    reliability: 0.2,
    cost: 0.9,
    risk: 0.9,
    redundancy: 0.9,
  });
  assert.ok(high > low);
});

test("homeostasis detects escalating cognitive load", () => {
  const x = homeostasis({
    queue_pressure: 1,
    uncertainty: 1,
    contradiction: 1,
    stale_knowledge: 1,
    resource_pressure: 1,
    failure_pressure: 1,
  });
  assert.equal(x.state, "CRITICAL");
  assert.ok(x.responses.includes("ISOLATE_FAILING_PATHS"));
});

test("resource allocation is deterministic", () => {
  const rows = allocateResources([
    { id: "b", information_value: .8, capability_unlock: .8, cost: .2, time_cost: .2 },
    { id: "a", information_value: .8, capability_unlock: .8, cost: .2, time_cost: .2 },
  ]);
  assert.deepEqual(rows.map(x => x.id), ["a", "b"]);
});

test("failed material is recycled into explicit learning inputs", () => {
  const x = recycleMaterial({ id: "failure", state: "FAILED" });
  assert.deepEqual(x.outputs, ["ERROR", "QUESTION", "HYPOTHESIS"]);
  assert.equal(x.destructive_forgetting, false);
});

test("complete metabolism closes the loop", () => {
  const result = metabolicCycle({
    observations: [{
      id: "obs",
      subject: "cycle",
      provenance: { source: "test" },
      evidence: { score: 1 },
      measurement: { measured: true, confidence: 1 },
      verification: { verified: true },
    }],
    frontier: [{
      id: "frontier",
      subject: "unknown capability",
      uncertainty: .9,
      impact: .9,
      observability: .8,
      reversibility: .9,
    }],
    revalidation: [{ id: "stale", age: .95, state: "KNOWN" }],
  });

  assert.equal(result.continue, true);
  assert.ok(result.next);
  assert.ok(result.metabolism.frontier_count >= 1);
  assert.ok(result.metabolism.revalidation_count >= 1);
  assertCognitiveMetabolismInvariant(result);
});

test("human authority remains outside metabolic autonomy", () => {
  const result = metabolicCycle({
    observations: [{
      id: "blocked",
      subject: "protected operation",
      state: "BLOCKED",
    }],
  });
  assert.equal(result.authority, "carl");
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
  assert.equal(result.constitution.breaker_bypass, false);
});
