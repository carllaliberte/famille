import test from "node:test";
import assert from "node:assert/strict";
import {
  GOVERNABLE_CONTINUITY_VERSION,
  HIERARCHY,
  continuityConstitution,
  normalizeState,
  capabilityEnvelope,
  trajectory,
  transformation,
  effectAndConsequence,
  controlContinuity,
  continuityEvent,
  continuityLedger,
  continuityOfOrgan,
  assertGovernableContinuityInvariant,
} from "../scripts/acorn-governable-continuity.mjs";

test("continuity spine is one organism, not another architecture", () => {
  const c = continuityConstitution();
  assert.equal(GOVERNABLE_CONTINUITY_VERSION, "acorn.governable-continuity.v1");
  assert.deepEqual(c.hierarchy, HIERARCHY);
  assert.equal(c.one_acorn, true);
  assert.equal(c.one_cortex, true);
  assert.equal(c.one_runtime, true);
  assert.equal(c.one_defense, true);
  assert.equal(c.one_fabric, true);
  assert.equal(c.cross_organ_spine, true);
  assert.equal(c.carl_controls_breaker, true);
  assert.equal(c.breaker_controls_carl, false);
  assert.equal(c.acorn_controls_carl, false);
  assert.equal(c.acorn_controls_breaker, false);
});

test("capability never becomes authority", () => {
  const e = capabilityEnvelope({ capability: 100, authority: 0, autonomy: 90, control: 0.5 });
  assert.equal(e.capability, 100);
  assert.equal(e.authority, 0);
  assert.equal(e.capability_authority_gap, 100);
  assert.equal(e.capability_does_not_grant_authority, true);
  assert.equal(e.authority_growth_requires_human_authority, true);
});

test("trajectory measures direction and acceleration without turning prediction into observation", () => {
  const t = trajectory({ previous: [{ value: 1 }, { value: 3 }], current: [{ value: 6 }], at: "2026-09-17T00:00:00Z" });
  assert.equal(t.direction, "GROWING");
  assert.equal(t.prediction_is_not_observation, true);
  assert.equal(t.evidence_required, true);
});

test("transformation separates proposed, executed, measured and verified states", () => {
  const tx = transformation({
    id: "tx-1",
    before: { id: "s1", capabilities: ["a"] },
    proposed: { add: "b" },
    actor: "cortex",
    capability: { capability: 10, authority: 0 },
    evidence: { executed: true, measured: true, verified: true, after: { id: "s2", capabilities: ["a", "b"] } },
    intervention: { variable: "b", value: true },
    counterfactual: { variable: "b", value: false },
  });
  assert.equal(tx.epistemic, "VERIFIED");
  assert.equal(tx.verified, true);
  assert.equal(tx.capability.authority, 0);
  assert.equal(tx.causality, "CANDIDATE");
});

test("effects never become consequences without causal evidence", () => {
  const result = effectAndConsequence({ transformation: { id: "tx", verified: false }, effects: ["changed"], consequences: ["systemic"] });
  assert.equal(result.effects[0].observed, false);
  assert.equal(result.consequences[0].causal_status, "INCONCLUSIVE");
  assert.equal(result.effect_is_not_consequence, true);
});

test("control continuity makes unknown reversibility visible", () => {
  const result = controlContinuity({ capability: 1, observability: 0, control: 0, reversibility: "UNKNOWN", interruptible: false, replaceable: false, auditable: false });
  assert.equal(result.unknown_is_not_permitted, true);
  assert.ok(result.gap >= 0.7);
  assert.equal(result.loss_of_control_is_not_success, true);
});

test("continuity ledger is append-only and tamper-evident by chained digest", () => {
  const a = continuityEvent({ type: "OBSERVATION", source: "reality", subject: "x", before: null, after: { value: 1 } });
  const b = continuityEvent({ type: "TRANSFORMATION", source: "cortex", subject: "x", before: { value: 1 }, after: { value: 2 } });
  const ledger = continuityLedger({ events: [a, b] });
  assert.equal(ledger.append_only, true);
  assert.equal(ledger.history_rewrite, false);
  assert.equal(ledger.events.length, 2);
  assert.equal(ledger.events[1].previous_digest, ledger.events[0].digest);
  assert.ok(ledger.head);
});

test("cross-organ integration connects all existing organs without creating authority", () => {
  const result = continuityOfOrgan({
    constitution: { hierarchy: [...HIERARCHY], carl_controls_breaker: true },
    cortex: { second_cortex: false },
    defense: { second_security_layer: false, defense_may_block_operations: true },
    evolution: { authority: false },
    governor: { authority: false },
    reality: { second_fabric: false, digest: "r1" },
    memory: { provenance: true, replaceable: true },
    ecology: { authority: false },
    runtime: { second_runtime: false, replaceable: true },
    previousState: normalizeState({ id: "before", capabilities: ["observe"], observability: "DIRECT", control: "DIRECT", reversibility: "REVERSIBLE" }),
    currentState: normalizeState({ id: "after", capabilities: ["observe", "reason"], observability: "DIRECT", control: "DIRECT", reversibility: "REVERSIBLE" }),
    events: [],
  });
  assert.equal(result.status, "INTEGRATED");
  assert.equal(result.continuity_preserved, true);
  assert.equal(result.authority, "carl");
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
});

test("cross-organ integration rejects constitutional hierarchy inversion", () => {
  const result = continuityOfOrgan({
    constitution: { hierarchy: ["ACORN", "CARL", "BREAKER", "CORTEX", "RESOURCES"], carl_controls_breaker: true },
  });
  assert.equal(result.status, "FAILED");
  assert.ok(result.violations.includes("HIERARCHY_MISMATCH"));
});

test("global invariant cannot be verified if sovereignty boundaries are weakened", () => {
  const state = { constitution: continuityConstitution() };
  assert.equal(assertGovernableContinuityInvariant({ state }).ok, true);
  state.constitution.acorn_controls_breaker = true;
  assert.equal(assertGovernableContinuityInvariant({ state }).ok, false);
});
