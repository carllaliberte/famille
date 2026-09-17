import test from "node:test";
import assert from "node:assert/strict";
import {
  defenseConstitution,
  classifyThreat,
  inspectBoundary,
  verifyIntegrity,
  detectAnomaly,
  quarantineResource,
  chooseRecovery,
  defenseCycle,
  assertDefenseInvariant,
} from "../scripts/acorn-defense.mjs";

test("Acorn defense is internal, active, and never becomes a second authority", () => {
  const c = defenseConstitution();
  assert.equal(c.owner, "acorn");
  assert.equal(c.one_defense_kernel, true);
  assert.equal(c.second_security_layer, false);
  assert.equal(c.defense_always_active, true);
  assert.equal(c.carl_controls_breaker, true);
  assert.equal(c.breaker_controls_carl, false);
  assert.equal(c.acorn_controls_carl, false);
  assert.equal(c.acorn_controls_breaker, false);
  assert.equal(c.fail_open, false);
});

test("critical threats are classified before execution is trusted", () => {
  const result = classifyThreat({ kind: "secret_exposure" });
  assert.equal(result.critical, true);
  assert.equal(result.status, "SUSPECT");
  assert.equal(result.evidence_required, true);
});

test("ecology signals reuse the same defense kernel", () => {
  const jump = classifyThreat({ kind: "capability_jump" });
  const common = classifyThreat({ kind: "common_mode_failure" });
  const bypass = classifyThreat({ kind: "authority_bypass" });
  assert.equal(jump.kind, "capability_jump");
  assert.equal(common.kind, "common_mode_failure");
  assert.equal(bypass.critical, true);
  assert.equal(defenseConstitution().one_defense_kernel, true);
  assert.equal(defenseConstitution().second_security_layer, false);
});

test("authority boundary blocks non-Carl Breaker mutation", () => {
  const result = inspectBoundary({
    actor: "grok",
    capability: { changes_breaker: true },
    channel: "worker",
    operation: "close-breaker",
    breaker: "OPEN",
  });
  assert.equal(result.safe, false);
  assert.ok(result.violations.includes("BREAKER_AUTHORITY_VIOLATION"));
});

test("integrity mismatch is never treated as healthy", () => {
  const result = verifyIntegrity({ expected: "aaa", observed: "bbb" });
  assert.equal(result.intact, false);
  assert.equal(result.status, "FAILED");
});

test("anomaly detection produces an explicit measurable delta", () => {
  const result = detectAnomaly({ baseline: { mode: "RUN", version: 1 }, observed: { mode: "RUN", version: 2 } });
  assert.equal(result.anomalous, true);
  assert.equal(result.delta, 1);
});

test("quarantine is reversible and disables selection while defense remains active", () => {
  const result = quarantineResource({ resource: { id: "node-a", presence: "CONNECTED" }, reason: "integrity-failure" });
  assert.equal(result.presence, "QUARANTINED");
  assert.equal(result.executable, false);
  assert.equal(result.selected_for_new_tasks, false);
  assert.equal(result.reversible, true);
  assert.equal(result.defense_active, true);
});

test("recovery uses verified non-authority candidates without requiring a defense hold", () => {
  const result = chooseRecovery({
    candidates: [
      { id: "bad", verified: false },
      { id: "good", verified: true, authority: false, quarantined: false },
    ],
  });
  assert.equal(result.status, "RECOVERED");
  assert.equal(result.selected.id, "good");
  assert.equal(result.defense_active, true);
});

test("ambiguous Breaker blocks the operation but the defense stays active", () => {
  const result = defenseCycle({
    actor: "worker",
    capability: { changes_breaker: true },
    channel: "worker",
    operation: "execute",
    breaker: "AMBIGUOUS",
    threat: { kind: "authority_bypass" },
    evidence: {},
  });
  assert.equal(result.state, "BLOCKED");
  assert.equal(result.recovery.status, "BLOCKED");
  assert.equal(result.recovery.authority_decision, "UNRESOLVED");
  assert.equal(result.defense_active, true);
  assert.equal(result.continue_defending, true);
  assert.notEqual(result.state, "HOLD_HUMAN");
  assert.notEqual(result.recovery.status, "HOLD_HUMAN");
  assert.equal(result.breaker_bypass, false);
  assert.equal(result.constitution.fail_open, false);
  assert.equal(assertDefenseInvariant(result).status, "VERIFIED");
});

test("no verified recovery keeps defense active instead of stopping it", () => {
  const result = chooseRecovery({ candidates: [], evidence: { breaker_ambiguous: true }, human_required: true });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.defense_active, true);
  assert.equal(result.continue_defending, true);
  assert.equal(result.authority_decision, "UNRESOLVED");
});

test("integrity attack is contained and recovery is evidence-gated", () => {
  const result = defenseCycle({
    actor: "cortex",
    capability: { authority: false },
    channel: "resource",
    operation: "load",
    breaker: "OPEN",
    threat: { kind: "integrity" },
    expectedHash: "expected",
    observedHash: "tampered",
    recoveryCandidates: [{ id: "clean", verified: true, authority: false, quarantined: false }],
    evidence: { verified: true },
    sequence: 7,
    previousDigest: "prior-digest",
  });
  assert.equal(result.state, "RECOVERED");
  assert.equal(result.integrity.status, "FAILED");
  assert.equal(result.containment.blocked, true);
  assert.equal(result.recovery.status, "RECOVERED");
  assert.equal(result.event.sequence, 7);
  assert.equal(result.event.previous_digest, "prior-digest");
  assert.ok(result.event.digest);
  assert.equal(result.defense_active, true);
  assert.equal(result.live, false);
});
