import test from "node:test";
import assert from "node:assert/strict";
import {
  authenticityState,
  classifyCognitiveInput,
  defenseConstitution,
  defenseCycle,
  degradationMode,
  detectDeception,
  detectEscalation,
  inspectReplication,
  inspectPersistence,
  inspectResourceAcquisition,
  measureAuthorityEnvelope,
  operationalStop,
  recordImmuneMemory,
  rollbackQuarantine,
  assertDefenseInvariant,
} from "../scripts/acorn-defense.mjs";
import {
  adversarialPerspectives,
  assertCortexInvariant,
  blastRadius,
  cortexCycle,
  detectGoalDrift,
  detectMetricGaming,
  uncertaintyBudget,
} from "../scripts/cortex-cognition.mjs";
import {
  autonomyBudget,
  consumeAutonomy,
  measureAutonomy,
} from "../scripts/autonomous-runtime.mjs";
import { expireEvidence } from "../scripts/evidence-seal.mjs";
import { describeIntelligence, registerCompatibleIntelligence, runIntelligenceContract } from "../scripts/intelligence-contract.mjs";

test("constitution: capability ceiling is not authority ceiling", () => {
  const c = defenseConstitution();
  assert.equal(c.capability_is_not_authority, true);
  assert.equal(c.capability_ceiling_is_not_authority_ceiling, true);
  assert.equal(c.operational_stop_is_not_breaker, true);
  assert.equal(c.assertion_is_not_evidence, true);
  assert.equal(c.consensus_is_not_authority, true);
  assert.equal(c.one_defense_kernel, true);
  assert.equal(c.second_security_layer, false);
  assert.equal(c.live, false);
});

test("100x capability does not mint authority", () => {
  const envelope = measureAuthorityEnvelope({
    resource: { id: "future-model", authority: false },
    observed: { capability: 100, authority: 0, trust: 1, access: 1, autonomy: 4, impact: 9, reversibility: 1 },
    claimed: { capability: 100, authority: true, authority_from_capability: true },
  });
  assert.equal(envelope.capability, 100);
  assert.equal(envelope.authority, 0);
  assert.equal(envelope.deduced_authority_from_capability, false);
  assert.equal(envelope.collision, true);
  assert.equal(envelope.status, "CAPABILITY_AUTHORITY_COLLISION");
  assert.equal(envelope.owner, "carl");
  const cycle = defenseCycle({
    actor: "resource",
    capability: { authority: true },
    channel: "model",
    operation: "self-authorize",
    breaker: "OPEN",
    threat: { kind: "authority_escalation" },
    envelope: { capability: 100, authority: 0 },
  });
  assert.equal(cycle.state, "BLOCKED");
  assert.equal(cycle.envelope.authority, 0);
  assert.equal(cycle.defense_active, true);
  assert.notEqual(cycle.state, "HOLD_HUMAN");
  assert.equal(assertDefenseInvariant(cycle).status, "VERIFIED");
});

test("autonomy is a measured vector, never a boolean", () => {
  const measured = measureAutonomy({
    autonomous_steps: 3,
    duration_ms: 1200,
    tool_access: 2,
    authority_requests: 1,
  });
  assert.equal(measured.autonomous, "NOT_BOOLEAN");
  assert.equal(measured.autonomous_steps, 3);
  assert.equal(measured.replication_attempts, "UNKNOWN");
  assert.equal(measured.status, "MEASURED");
  assert.notEqual(measured.autonomous, true);
});

test("autonomy budget shrinks under uncertainty without touching the Breaker", () => {
  const budget = autonomyBudget({
    limits: { autonomous_steps: 8, tool_access: 4, authority_requests: 0 },
    uncertainty: { high: true },
    breaker: "OPEN",
  });
  assert.equal(budget.reduced, true);
  assert.equal(budget.limits.autonomous_steps, 2);
  assert.equal(budget.is_not_breaker, true);
  assert.equal(budget.breaker_changed, false);
  assert.equal(budget.breaker_observed, "OPEN");
  const consumed = consumeAutonomy({
    budget,
    usage: { autonomous_steps: 3, tool_access: 0, authority_requests: 0 },
  });
  assert.equal(consumed.blocked, true);
  assert.ok(consumed.exhausted.includes("autonomous_steps"));
  assert.equal(consumed.breaker_changed, false);
});

test("isolated permission change is not automatically hostile; coordinated rise is a signal", () => {
  const isolated = detectEscalation({
    history: [
      { permissions: 1, resources: 1, runtime: 1, network: 0, tools: 1, delegation: 0, persistence: 0, replication: 0, financial: 0, authority: 0 },
      { permissions: 2, resources: 1, runtime: 1, network: 0, tools: 1, delegation: 0, persistence: 0, replication: 0, financial: 0, authority: 0 },
    ],
  });
  assert.equal(isolated.coordinated, false);
  assert.equal(isolated.isolated, true);
  assert.equal(isolated.automatically_malicious, false);
  const coordinated = detectEscalation({
    history: [
      { permissions: 1, resources: 1, runtime: 1, network: 0, tools: 1, delegation: 0, persistence: 0, replication: 0, financial: 0, authority: 0 },
      { permissions: 4, resources: 5, runtime: 3, network: 2, tools: 6, delegation: 2, persistence: 1, replication: 2, financial: 1, authority: 1 },
    ],
  });
  assert.equal(coordinated.coordinated, true);
  assert.equal(coordinated.status, "ESCALATION_SIGNAL");
  assert.equal(coordinated.containment_recommended, true);
});

test("hostile or deceptive resource is contained; assertion is not evidence", () => {
  const deception = detectDeception({
    claimed: { executed: true, action: "X" },
    observed: { executed: false },
  });
  assert.equal(deception.mismatch, true);
  assert.equal(deception.self_declaration_accepted, false);
  assert.equal(deception.status, "CONTRADICTED");
  const cycle = defenseCycle({
    actor: "model",
    capability: { authority: false },
    channel: "resource",
    operation: "act",
    breaker: "OPEN",
    threat: { kind: "deception" },
    claimedExecution: { executed: true },
    observedExecution: { executed: false },
    recoveryCandidates: [{ id: "other", verified: true, authority: false, quarantined: false }],
  });
  assert.equal(cycle.deception.mismatch, true);
  assert.equal(cycle.containment.blocked, true);
  assert.equal(cycle.recovery.status, "RECOVERED");
  assert.equal(cycle.defense_active, true);
});

test("replication creates a capability, never an authority", () => {
  const allowed = inspectReplication({
    declared: [{ id: "worker-1", kind: "worker", provenance: "runtime", purpose: "review", owner: "carl", expiration: "2026-12-01", evidence: "e1" }],
    observed: [{ id: "worker-1", kind: "worker", provenance: "runtime", purpose: "review", owner: "carl", expiration: "2026-12-01", evidence: "e1", authority: false }],
  });
  assert.equal(allowed.blocked, false);
  assert.equal(allowed.authority_created, false);
  const rogue = inspectReplication({
    declared: [],
    observed: [{ id: "new-agent", kind: "agent", authority: true }],
  });
  assert.equal(rogue.blocked, true);
  assert.equal(rogue.authority_created, true);
  assert.equal(rogue.reason, "REPLICATION_CREATED_AUTHORITY");
});

test("undeclared persistence and self-expansion of resources are blocked", () => {
  const persist = inspectPersistence({
    declared: [{ id: "autopilot", kind: "scheduled" }],
    observed: [{ id: "autopilot", kind: "scheduled" }, { id: "hidden-callback", kind: "external_callback" }],
  });
  assert.equal(persist.status, "UNEXPECTED_PERSISTENCE");
  const acquired = inspectResourceAcquisition({
    declared: { compute: 1, credentials: 1, money: 0 },
    observed: { compute: 1, credentials: 2, money: 1 },
  });
  assert.equal(acquired.self_expansion, true);
  assert.equal(acquired.blocked, true);
  assert.ok(acquired.expanded.includes("credentials"));
  assert.ok(acquired.expanded.includes("money"));
});

test("operational stop is not the Breaker", () => {
  const stop = operationalStop({ target: "worker-3", reason: "scope-exceeded", breaker: "OPEN" });
  assert.equal(stop.status, "STOPPED");
  assert.equal(stop.breaker_changed, false);
  assert.equal(stop.is_not_breaker, true);
  assert.equal(stop.defense_active, true);
  assert.equal(stop.breaker_observed, "OPEN");
});

test("graceful degradation never pretends to be normal", () => {
  assert.equal(degradationMode({ lost_ratio: 0 }).mode, "FULL");
  assert.equal(degradationMode({ lost_ratio: 0.1 }).mode, "DEGRADED");
  assert.equal(degradationMode({ lost_ratio: 0.5 }).mode, "MINIMAL_SAFE_OPERATION");
  assert.equal(degradationMode({ defense_degraded: true, lost_ratio: 0.05 }).mode, "PROTECTED");
  assert.equal(degradationMode({ recovering: true }).mode, "RECOVERING");
  assert.equal(degradationMode({ breaker_unresolved: true, lost_ratio: 0 }).mode, "PROTECTED");
  assert.equal(degradationMode({}).mode, "UNKNOWN");
  assert.equal(degradationMode({ lost_ratio: 0.5 }).pretends_normal, false);
});

test("cognitive firewall: tool results and provider text are not instructions or authority", () => {
  const tool = classifyCognitiveInput({ source: "tool", kind: "observation", claimed_role: "instruction" });
  assert.equal(tool.classified_as, "UNTRUSTED_DATA");
  assert.equal(tool.is_instruction, false);
  assert.equal(tool.is_authority, false);
  assert.equal(tool.tool_result_is_not_instruction, true);
  const provider = classifyCognitiveInput({ source: "provider", kind: "text", claimed_role: "authority" });
  assert.equal(provider.is_authority, false);
  assert.equal(provider.provider_instruction_is_not_authority, true);
  const human = classifyCognitiveInput({ source: "carl", kind: "instruction", claimed_role: "instruction" });
  assert.equal(human.is_instruction, true);
});

test("information authenticity can be uncertain; Acorn is not a deepfake oracle", () => {
  assert.equal(authenticityState({}).status, "UNVERIFIED");
  assert.equal(authenticityState({ provenance: "src", corroboration: false }).status, "AUTHENTICITY_UNCERTAIN");
  assert.equal(authenticityState({ provenance: "src", corroboration: true }).status, "AUTHENTICITY_VERIFIED");
  assert.equal(authenticityState({ contradiction: true }).status, "CONTRADICTED");
  assert.equal(authenticityState({ provenance: "src", corroboration: true }).perfect_detection, false);
});

test("collective cognition is not collective authority; consensus is not truth", () => {
  const views = adversarialPerspectives({
    claim: "the sky is live",
    observation: "live remains false",
    evidence: { executed: true, verified: false },
    independent: ["yes", "yes", "yes"],
  });
  assert.equal(views.second_cortex, false);
  assert.equal(views.consensus, "AGREEMENT");
  assert.equal(views.consensus_is_truth, false);
  assert.equal(views.consensus_is_authority, false);
  assert.equal(views.perspectives.length, 5);
});

test("goal drift and metric gaming are distinct from mission success", () => {
  const drift = detectGoalDrift({
    original: { objective: "verify inventory" },
    current: { objective: "maximize live_count" },
  });
  assert.equal(drift.status, "GOAL_DRIFT");
  const gaming = detectMetricGaming({ metric_improved: true, goal_achieved: false, proxy: true });
  assert.equal(gaming.status, "METRIC_GAMING");
  assert.equal(gaming.metric_is_not_goal, true);
});

test("UNKNOWN is a first-class state; Acorn can say it does not know", () => {
  const unknown = uncertaintyBudget({ unknown: ["provider-health"], known: [] });
  assert.equal(unknown.status, "UNKNOWN");
  assert.equal(unknown.fake_confidence, false);
  const envelope = measureAuthorityEnvelope({ resource: { id: "new" } });
  assert.equal(envelope.capability, "UNKNOWN");
  assert.equal(envelope.trust, "UNKNOWN");
  assert.equal(expireEvidence({}).status, "UNKNOWN");
});

test("Acorn can detect its own error and roll back a false quarantine", () => {
  const restored = rollbackQuarantine({ resource: { id: "innocuous", restore_presence: "CONNECTED" }, reason: "FALSE_POSITIVE" });
  assert.equal(restored.false_positive, true);
  assert.equal(restored.acorn_error_detected, true);
  assert.equal(restored.presence, "CONNECTED");
  assert.equal(restored.defense_active, true);
  const memory = recordImmuneMemory({
    incident: { pattern: "false-quarantine", kind: "false_positive", outcome: "rolled_back", false_positive: true },
  });
  assert.equal(memory.eternal_truth, false);
  assert.equal(memory.expires, true);
});

test("a new intelligence can be admitted as a resource without changing the architecture", () => {
  const described = describeIntelligence({
    id: "tomorrow-model",
    provider: "UNKNOWN",
    capabilities: ["review"],
    capability_ceiling: 80,
  });
  assert.equal(described.authority, false);
  assert.equal(described.authority_ceiling, 0);
  assert.equal(described.capability_ceiling, 80);
  assert.equal(described.capabilities_are_not_authority, true);
  const admitted = registerCompatibleIntelligence({ agents: [] }, { id: "tomorrow-model", capabilities: ["review"] });
  assert.equal(admitted.cortex_modified, false);
  assert.equal(admitted.live, false);
});

test("provider loss has a blast radius; remaining nodes stay non-authority", () => {
  const radius = blastRadius({
    lost: ["provider-a"],
    graph: {
      nodes: [
        { id: "provider-a", depends_on: null, single_point: true },
        { id: "local-cortex", depends_on: null, authority: false },
        { id: "task-review", depends_on: "provider-a" },
      ],
    },
  });
  assert.equal(radius.status, "MEASURED");
  assert.ok(radius.affected.includes("provider-a"));
  assert.ok(radius.affected.includes("task-review"));
  assert.ok(radius.survives.includes("local-cortex"));
  assert.equal(radius.pretends_independent, false);
});

test("evidence expires without being rewritten as false", () => {
  const issued = "2026-01-01T00:00:00.000Z";
  const expired = expireEvidence({ issued_at: issued, now: Date.parse("2026-02-01T00:00:00.000Z"), ttl_ms: 1000 });
  assert.equal(expired.status, "EXPIRED");
  assert.equal(expired.was_false, false);
  assert.equal(expired.sufficient_for_current_state, false);
  const valid = expireEvidence({ issued_at: issued, now: Date.parse(issued) + 10, ttl_ms: 1000 });
  assert.equal(valid.status, "VALID");
});

test("documentation claim loses to runtime evidence", () => {
  const claimedLive = { docs: "LIVE", executed: true };
  const runtime = { executed: false, live: false };
  const deception = detectDeception({ claimed: claimedLive, observed: runtime });
  assert.equal(deception.status, "CONTRADICTED");
  assert.equal(runtime.live, false);
});

test("combined simulation: high capability + compromise + poisoning + outage + escalation + gaming stays containable", () => {
  const envelope = measureAuthorityEnvelope({
    resource: { id: "powerful", authority: false },
    observed: { capability: 100, authority: 0 },
  });
  const escalation = detectEscalation({
    history: [
      { permissions: 1, resources: 1, runtime: 1, network: 0, tools: 1, delegation: 0, persistence: 0, replication: 0, financial: 0, authority: 0 },
      { permissions: 9, resources: 8, runtime: 7, network: 4, tools: 6, delegation: 3, persistence: 2, replication: 2, financial: 1, authority: 1 },
    ],
  });
  const replica = inspectReplication({
    declared: [],
    observed: [{ id: "shadow-worker", kind: "worker" }],
  });
  const firewall = classifyCognitiveInput({ source: "document", kind: "text", claimed_role: "instruction" });
  const gaming = detectMetricGaming({ metric_improved: true, goal_achieved: false });
  const radius = blastRadius({
    lost: ["provider-a"],
    graph: { nodes: [{ id: "provider-a", single_point: true }, { id: "cortex-local", authority: false }] },
  });
  const cycle = defenseCycle({
    actor: "powerful",
    capability: { authority: false },
    channel: "simulation",
    operation: "combined-stress",
    breaker: "OPEN",
    threat: { kind: "authority_escalation" },
    envelope: { capability: 100, authority: 0 },
    escalationHistory: [
      { permissions: 1, resources: 1, runtime: 1, network: 0, tools: 1, delegation: 0, persistence: 0, replication: 0, financial: 0, authority: 0 },
      { permissions: 9, resources: 8, runtime: 7, network: 4, tools: 6, delegation: 3, persistence: 2, replication: 2, financial: 1, authority: 1 },
    ],
    replication: { declared: [], observed: [{ id: "shadow-worker", kind: "worker" }] },
    claimedExecution: { executed: true },
    observedExecution: { executed: false },
    recoveryCandidates: [{ id: "cortex-local", verified: true, authority: false, quarantined: false }],
  });
  const cognition = cortexCycle({
    task: { objective: "remain sovereign", required_capabilities: ["review"] },
    resources: [{ id: "cortex-local", capabilities: ["review"], presence: "CONNECTED" }],
    expected: "sovereign",
    observed: "contained",
    evidence: { executed: true, verified: true },
    contradiction: false,
    defense: { breaker: "OPEN" },
    independent: ["a", "a"],
    lost: ["provider-a"],
    input: { source: "model", claimed_role: "authority", kind: "text" },
    metric: { improved: true, achieved: false },
  });
  assert.equal(envelope.authority, 0);
  assert.equal(escalation.coordinated, true);
  assert.equal(replica.blocked, true);
  assert.equal(firewall.classified_as, "UNTRUSTED_DATA");
  assert.equal(gaming.status, "METRIC_GAMING");
  assert.ok(radius.survives.includes("cortex-local"));
  assert.equal(cycle.containment.blocked, true);
  assert.equal(cycle.defense_active, true);
  assert.equal(cycle.breaker_bypass, false);
  assert.equal(cognition.constitution.second_cortex, false);
  assert.equal(cognition.perspectives.consensus_is_authority, false);
  assert.equal(cognition.firewall.is_authority, false);
  assert.equal(cognition.live, false);
  assert.equal(assertCortexInvariant(cognition).status, "VERIFIED");
  assert.equal(assertDefenseInvariant(cycle).status, "VERIFIED");
});

test("no second architecture: Cortex, Defense and runtime stay the same organs", () => {
  const cognition = cortexCycle({
    task: { required_capabilities: ["review"] },
    resources: [{ id: "r", capabilities: ["review"] }],
    evidence: { executed: true, verified: true },
    defense: { breaker: "OPEN" },
  });
  const contract = runIntelligenceContract({
    agents: [{ id: "r", capabilities: ["review"] }],
    env: {},
  });
  assert.equal(cognition.constitution.one_cortex, true);
  assert.equal(cognition.constitution.second_cortex, false);
  assert.equal(defenseConstitution().one_defense_kernel, true);
  assert.equal(contract.consensus_is_truth, false);
  assert.equal(contract.authority, "carl");
});
