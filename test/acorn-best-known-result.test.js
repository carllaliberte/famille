import test from "node:test";
import assert from "node:assert/strict";
import {
  BEST_KNOWN_RESULT_VERSION, createResultCandidate, comparableCandidates,
  selectBestKnownResult, buildAdaptationPlan, registerCapabilityFromOutcome,
  bestKnownVerdict, assertBestKnownContract
} from "../scripts/acorn-best-known-result.mjs";

const fresh = "2099-01-01T00:00:00.000Z";
const candidate = (id, score, extra = {}) => createResultCandidate({
  id, problem: "complex problem", provider: extra.provider || id,
  method: extra.method || "measured-method",
  measured_at: "2026-09-18T12:00:00.000Z", valid_until: fresh,
  metrics: { quality: score, latency_ms: extra.latency_ms || 10 },
  evidence: ["evidence:" + id], constraints: ["budget", "security"], ...extra
});

test("candidate contract is temporal and human-governed", () => {
  const c = candidate("a", 91);
  assert.equal(c.authority, "human"); assert.equal(c.auto_merge, false); assert.equal(c.valid_until, fresh);
});

test("comparable candidates exclude stale, unconstrained and unmeasured options", () => {
  const rows = comparableCandidates([
    candidate("good", 90),
    candidate("stale", 100, { valid_until: "2020-01-01T00:00:00.000Z" }),
    candidate("unsafe", 999, { satisfies_constraints: false }),
    candidate("unknown", "not-a-number")
  ], { metric: "quality", requiredConstraints: ["budget", "security"] });
  assert.deepEqual(rows.map((x) => x.id), ["good"]);
});

test("selects the best measured result in the declared scope", () => {
  const selection = selectBestKnownResult(
    [candidate("a", 91), candidate("b", 97), candidate("c", 94)],
    { metric: "quality", direction: "max", scope: "customer-problem:42", coverage: "KNOWN_CANDIDATE_SET" }
  );
  assert.equal(selection.state, "BEST_KNOWN_IN_SCOPE");
  assert.equal(selection.selected.id, "b");
  assert.equal(selection.selected.metric_value, 97);
  assert.equal(selection.coverage_is_global, false);
  assert.equal(bestKnownVerdict(selection), "BEST_KNOWN_RESULT · MEASURED_SCOPE");
  assertBestKnownContract(selection);
});

test("no evidence means no best-known claim", () => {
  const selection = selectBestKnownResult([candidate("a", 91, { evidence: [] })], { metric: "quality" });
  assert.equal(selection.state, "NOT_MEASURED");
  assert.equal(bestKnownVerdict(selection), "BEST_KNOWN_RESULT_UNAVAILABLE");
});

test("adaptation plan absorbs present and future signals without granting authority", () => {
  const plan = buildAdaptationPlan({
    current: { market: "current" },
    marketSignals: [{ id: "m1", observed_at: fresh, evidence: ["market:e1"], action: "PROPOSE" }],
    capabilitySignals: [{ id: "c1", observed_at: fresh, evidence: ["cap:e1"], action: "PROPOSE" }],
    futureSignals: [{ id: "f1", observed_at: fresh, evidence: ["future:e1"], action: "PROPOSE" }]
  });
  assert.equal(plan.state, "ADAPTABLE"); assert.equal(plan.changes.length, 3);
  assert.equal(plan.human_gate_required, false); assert.equal(plan.auto_merge, false);
});

test("capability is derived from measured outcome with provenance and expiry", () => {
  const record = registerCapabilityFromOutcome({
    outcome: { id: "out-1", measured: true, measured_at: "2026-09-18T12:00:00.000Z" },
    capability: { id: "cap-1", version: "7", rights: "CUSTOMER_LICENSE" },
    evidence: ["proof-1"], valid_until: fresh
  });
  assert.equal(record.reusable, true); assert.equal(record.capability_id, "cap-1");
  assert.equal(record.derived_from_outcome, "out-1"); assert.equal(record.rights, "CUSTOMER_LICENSE");
  assert.equal(record.authority, "human");
});

test("commercial and consequential actions remain human-gated", () => {
  const plan = buildAdaptationPlan({
    marketSignals: [{ id: "price", observed_at: fresh, evidence: ["market:e1"], action: "PRICE_CHANGE" }]
  });
  assert.equal(plan.human_gate_required, true);
});

test("contract version is stable", () => assert.equal(BEST_KNOWN_RESULT_VERSION, "acorn.best-known-result.v1"));
