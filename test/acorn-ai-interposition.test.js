import test from "node:test";
import assert from "node:assert/strict";
import {
  interpositionConstitution,
  capabilityFirewall,
  effectiveCapabilityPath,
  detectCapabilityJump,
  trajectoryRisk,
  governabilityIndex,
  interpositionCycle,
  assertInterpositionInvariant,
} from "../scripts/acorn-ai-interposition.mjs";

test("constitution preserves Carl -> Breaker -> Acorn -> Cortex -> Resources", () => {
  const c = interpositionConstitution();
  assert.deepEqual(c.hierarchy, ["CARL", "BREAKER", "ACORN", "CORTEX", "RESOURCES"]);
  assert.equal(c.carl_controls_breaker, true);
  assert.equal(c.breaker_controls_carl, false);
  assert.equal(c.acorn_controls_carl, false);
  assert.equal(c.acorn_controls_breaker, false);
  assert.equal(c.capability_is_not_authority, true);
});

test("unobserved or uncontrolled capability cannot pass", () => {
  const result = capabilityFirewall({ capability: { id: "x", kind: "EXECUTE", observability: "NONE", control: "NONE", reversibility: "UNKNOWN" } });
  assert.equal(result.decision, "DENY");
  assert.match(result.reasons.join(" "), /UNOBSERVED_CAPABILITY/);
});

test("capability request can never grant authority", () => {
  const result = capabilityFirewall({
    capability: { id: "x", kind: "WRITE", observability: "VERIFIED", control: "VERIFIED", reversibility: "REVERSIBLE" },
    requestedAuthority: true,
  });
  assert.equal(result.authority_granted, false);
  assert.equal(result.decision, "DENY");
});

test("verified controllable reversible capability may pass", () => {
  const result = capabilityFirewall({
    capability: { id: "read", kind: "READ", observability: "VERIFIED", control: "VERIFIED", reversibility: "REVERSIBLE" },
    evidence: { measured: true, verified: true },
    policy: { requireVerified: true },
  });
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.verified, true);
});

test("high control gap quarantines a capability", () => {
  const result = capabilityFirewall({
    capability: { id: "danger", kind: "EXECUTE", observability: "PARTIAL", control: "LIMITED", reversibility: "UNKNOWN" },
    risk: 1,
    blastRadius: 1,
  });
  assert.equal(result.decision, "QUARANTINE");
});

test("effective capability graph detects an ungoverned reachable path", () => {
  const path = effectiveCapabilityPath({
    nodes: [
      { id: "ai", effective: true, observability: "VERIFIED", control: "VERIFIED", reversibility: "REVERSIBLE" },
      { id: "tool", effective: false, observability: "NONE", control: "NONE", reversibility: "UNKNOWN" },
    ],
    edges: [{ from: "ai", to: "tool" }],
  });
  assert.equal(path.no_ungoverned_capability_path, false);
  assert.equal(path.ungoverned.length, 1);
});

test("capability jumps are explicit and do not create authority", () => {
  const jump = detectCapabilityJump({ before: [{ id: "read" }], after: [{ id: "read" }, { id: "write" }] });
  assert.equal(jump.capability_jump, true);
  assert.equal(jump.authority_change_required, false);
});

test("trajectory risk sees cumulative escalation", () => {
  const risk = trajectoryRisk({ events: [{ risk: .2 }, { newConnection: true, risk: .2 }, { capabilityJump: true, risk: .4 }] });
  assert.equal(risk.escalation_signal, true);
  assert.equal(risk.capability_jump_events, 2);
});

test("governability is a vector, not a claim of intelligence quality", () => {
  const low = governabilityIndex({ capability: 1, observability: "NONE", control: "NONE", reversibility: "UNKNOWN", blastRadius: 1, uncertainty: 1 });
  const high = governabilityIndex({ capability: 1, observability: "VERIFIED", control: "VERIFIED", reversibility: "REVERSIBLE", provenance: true });
  assert.equal(low.status, "LOW");
  assert.equal(high.status, "HIGH");
});

test("cycle produces a durable interposition decision without authority", () => {
  const cycle = interpositionCycle({
    request: { actor: "ai-1", capability: { id: "read", kind: "READ", observability: "VERIFIED", control: "VERIFIED", reversibility: "REVERSIBLE" }, evidence: { measured: true, verified: true } },
    environment: { policy: { requireVerified: true } },
  });
  assert.equal(cycle.decision.decision, "ALLOW");
  assert.equal(cycle.authority_granted, false);
  assert.equal(cycle.event.append_only, true);
});

test("global invariant rejects hierarchy or authority inversion", () => {
  const good = assertInterpositionInvariant();
  assert.equal(good.ok, true);
  const bad = assertInterpositionInvariant({ constitution: { ...interpositionConstitution(), acorn_controls_breaker: true } });
  assert.equal(bad.ok, false);
  assert.match(bad.violations.join(" "), /ACORN_BREAKER/);
});
