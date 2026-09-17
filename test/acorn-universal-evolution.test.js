import test from "node:test";
import assert from "node:assert/strict";
import {
  adaptiveRoute,
  assertUniversalEvolutionInvariant,
  buildUniversalEvolutionCycle,
  classifyObservation,
  diagnoseObservation,
  planRepair,
  selectNextWork,
  summarizeHealth,
  verifyEvolution,
} from "../scripts/acorn-universal-evolution.mjs";

test("unknown remains explicit and never silently trusted", () => {
  const c = classifyObservation({ category: "UNKNOWN", unknown: true });
  assert.equal(c.category, "UNKNOWN");
  assert.equal(c.unknown, true);
  const d = diagnoseObservation({ category: "UNKNOWN", unknown: true }, c);
  assert.deepEqual(d.causes, ["UNKNOWN_STATE"]);
});

test("real regression is diagnosed and routed to reversible repair", () => {
  const c = classifyObservation({ category: "CODE", status: "REGRESSION", failed: true, regression: true });
  const d = diagnoseObservation({ category: "CODE", status: "REGRESSION", failed: true, regression: true }, c);
  assert.ok(d.causes.includes("REGRESSION"));
  const p = planRepair({ category: "CODE" }, d);
  assert.equal(p.reversible, true);
  assert.equal(p.bounded, true);
  assert.notEqual(p.status, "WAITING_ON_HUMAN");
});

test("verification requires execution, tests, measurement and evidence", () => {
  assert.equal(verifyEvolution({
    execution: { executed: true },
    tests: { passed: true },
    measurement: { measured: true, value: 1 },
    evidence: { verified: true },
  }).verified, true);
  assert.equal(verifyEvolution({
    execution: { executed: true },
    tests: { passed: true },
    measurement: { measured: true, value: 1 },
    evidence: { verified: false },
  }).verified, false);
});

test("human authority remains a hard boundary", () => {
  const result = buildUniversalEvolutionCycle({
    observation: { status: "OBSERVED", category: "CODE" },
    plan: { action: "MERGE", authority: "merge" },
  });
  assert.equal(result.state, "WAITING_ON_HUMAN");
  assert.equal(result.authority, "carl");
  assert.equal(result.auto_merge, false);
  assertUniversalEvolutionInvariant(result);
});

test("work selection continues around blocked work", () => {
  const rows = selectNextWork({
    observations: [{ id: "blocked", information_gain: 10 }, { id: "independent", information_gain: 2 }],
    blocked: ["blocked"],
  });
  assert.deepEqual(rows.map((r) => r.id), ["independent"]);
});

test("adaptive routing is capability-first and not provider-locked", () => {
  const result = adaptiveRoute({
    task: { objective: "review", required_capabilities: ["review"] },
    resources: [{ id: "future-system", provider: "unknown", capabilities: ["review"], presence: "ACTIVE" }],
  });
  assert.equal(result.fixed_provider_allowlist, false);
  assert.equal(result.capability_first, true);
  assert.ok(result.candidates.some((r) => r.id === "future-system"));
});

test("health summary exposes drift without claiming live", () => {
  const result = summarizeHealth({
    inventory: [{ id: "x", lifecycle: "FAILED", states: { failed: true } }],
    previous: [{ id: "x", lifecycle: "VERIFIED" }],
  });
  assert.equal(result.drift_count, 1);
  assert.equal(result.failed_count, 1);
  assert.equal(result.live, false);
});

test("constitutional flags survive the full cycle", () => {
  const result = buildUniversalEvolutionCycle({
    observation: { category: "CODE", status: "OBSERVED" },
    execution: { executed: true },
    tests: { passed: true },
    measurement: { measured: true, value: 1 },
    evidence: { verified: true },
  });
  assert.equal(result.state, "CHECKPOINT");
  assertUniversalEvolutionInvariant(result);
});
