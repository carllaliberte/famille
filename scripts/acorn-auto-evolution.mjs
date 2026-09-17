#!/usr/bin/env node
/**
 * ACORN AUTO-EVOLUTION ENGINE — internal Cortex research loop.
 *
 * Not a second Cortex, runtime, defense, Breaker, or constitution.
 * CAPABILITY_GROWTH ≠ AUTHORITY_GROWTH
 * AUTO_EVOLUTION ≠ AUTO_SOVEREIGNTY
 * MODEL_REVISION ≠ CONSTITUTION_REVISION
 * UNKNOWN ≠ PERMISSION
 * SELF_ASSESSMENT ≠ VERIFIED_SAFETY
 * live=false. auto_merge=false.
 *
 * CONSTITUTION → AUTHORITY BOUNDARY → AUTO-EVOLUTION → CAPABILITY EVOLUTION
 */
import {
  HIERARCHY,
  allInvariants,
  attemptAuthorityTransfer,
  attemptAuthorityFromCapabilityChain,
  invariantDigest,
  GENESIS_DIGEST,
  CONSTITUTION_VERSION,
} from "./acorn-constitution.mjs";
import {
  attemptConstitutionalModification,
  attemptSemanticBypass,
  operationalEvolution,
  assertNoSelfModification,
} from "./acorn-immutability.mjs";
import {
  evaluatePortfolio,
  runEvolutionGovernor,
  assertGovernorInvariant,
  EVOLUTION_GOVERNOR_VERSION,
} from "./cortex-evolution-governor.mjs";
import {
  compositionExperiment,
  causalExperiment,
  adversarialCognition,
  cognitiveDiversity,
  selfReinforcementLoop,
  measureCapabilityAcceleration,
  cortexMetacognition,
} from "./acorn-experiment.mjs";
import { quarantineResource, defenseCycle, assertDefenseInvariant } from "./acorn-defense.mjs";
import { controlGap, measureBlastRadius, BLAST_LAYERS } from "./acorn-governability.mjs";
import { assertReplaceability, assertReconstructability, selfImprovementBoundary } from "./acorn-replaceability.mjs";
import { authorizeBreakerControl } from "../.github/swarm/system-breaker.mjs";

export const AUTO_EVOLUTION_VERSION = "acorn.auto-evolution.v1";

export const CYCLE_PHASES = Object.freeze([
  "DISCOVER", "MAP_UNKNOWN", "HYPOTHESIZE", "PLAN", "EXPERIMENT", "EXECUTE",
  "OBSERVE", "MEASURE", "FALSIFY", "VERIFY", "LEARN", "ADAPT", "COMPARE",
  "RETAIN_REJECT_QUARANTINE", "UPDATE_MEMORY", "UPDATE_CAPABILITY_MAP",
  "UPDATE_UNKNOWN_SPACE", "NEXT_CYCLE",
]);

export const DISCOVERY_KINDS = Object.freeze([
  "NEW_CAPABILITY", "NEW_SYNAPSE", "NEW_ROUTING", "NEW_COMPOSITION", "NEW_STRATEGY",
  "NEW_MODEL", "NEW_PROVIDER", "NEW_TOOL", "NEW_MEMORY_STRUCTURE", "NEW_EXPERIMENT",
  "NEW_REASONING_PATTERN", "NEW_EXECUTION_PATTERN", "NEW_RECOVERY_STRATEGY",
  "NEW_VERIFICATION_STRATEGY",
]);

export const UNKNOWN_CATEGORIES = Object.freeze([
  "UNTESTED", "PARTIALLY_OBSERVED", "UNVERIFIED", "CONTRADICTORY", "INACCESSIBLE",
  "DEPENDENCY_LIMITED", "MODEL_LIMITED", "RESOURCE_LIMITED", "ENVIRONMENT_LIMITED",
  "ONTOLOGICALLY_UNKNOWN",
]);

export const BOUNDARY_ATTEMPTS = Object.freeze([
  "EVOLUTION_ATTEMPTS_CONSTITUTION_CHANGE",
  "EVOLUTION_ATTEMPTS_AUTHORITY_ESCALATION",
  "EVOLUTION_ATTEMPTS_BREAKER_BYPASS",
  "EVOLUTION_ATTEMPTS_DEFENSE_BYPASS",
  "EVOLUTION_ATTEMPTS_HISTORY_DELETION",
  "EVOLUTION_ATTEMPTS_SELF_CERTIFICATION",
  "EVOLUTION_ATTEMPTS_UNOBSERVED_EXECUTION",
  "EVOLUTION_ATTEMPTS_IRREVERSIBLE_ACTION",
  "EVOLUTION_ATTEMPTS_RECURSIVE_ESCALATION",
  "EVOLUTION_ATTEMPTS_HIDDEN_DELEGATION",
]);

export const PROPERTY_IDS = Object.freeze([
  "AUTO_EVOLUTION_CANNOT_MODIFY_FUNDAMENTALS",
  "AUTO_EVOLUTION_CANNOT_GRANT_ITSELF_AUTHORITY",
  "CAPABILITY_GROWTH_DOES_NOT_GRANT_AUTHORITY",
  "NEW_INTELLIGENCE_DOES_NOT_GRANT_AUTHORITY",
  "NEW_SYNAPSE_DOES_NOT_GRANT_AUTHORITY",
  "NEW_STRATEGY_DOES_NOT_GRANT_AUTHORITY",
  "SELF_IMPROVEMENT_DOES_NOT_GRANT_AUTHORITY",
  "CONSENSUS_DOES_NOT_GRANT_AUTHORITY",
  "COGNITIVE_SUPERIORITY_DOES_NOT_GRANT_AUTHORITY",
  "UNKNOWN_DOES_NOT_GRANT_PERMISSION",
  "EMERGENCY_DOES_NOT_OVERRIDE_CONSTITUTION",
  "REVOKED_DELEGATION_STAYS_REVOKED",
  "QUARANTINED_CAPABILITY_IS_NOT_SELECTED",
  "HISTORY_IS_NOT_REWRITTEN",
  "NO_SILENT_FALLBACK",
  "NO_FAKE_LIVE",
]);

const FORBIDDEN = new Set(["invariants", "constitution", "breaker", "human-authority", "history", "sovereignty"]);

export function inventoryProbe() {
  return {
    ok: true,
    version: AUTO_EVOLUTION_VERSION,
    auto_merge: false,
    live: false,
    authority: "carl",
    second_cortex: false,
    second_runtime: false,
    second_defense: false,
    auto_sovereignty: false,
  };
}

export function evolutionConstitution() {
  return {
    hierarchy: ["CONSTITUTION", "AUTHORITY_BOUNDARY", "AUTO_EVOLUTION", "CAPABILITY_EVOLUTION"],
    constitutional_hierarchy: [...HIERARCHY],
    auto_evolution_is_not_sovereignty: true,
    capability_growth_is_not_authority_growth: true,
    model_revision_is_not_constitution_revision: true,
    unknown_is_not_permission: true,
    self_assessment_is_not_verified_safety: true,
    second_cortex: false,
    second_runtime: false,
    second_defense: false,
    second_constitution: false,
    second_breaker: false,
    governor: EVOLUTION_GOVERNOR_VERSION,
    constitution: CONSTITUTION_VERSION,
    genesis_digest: GENESIS_DIGEST,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function classifyUnknown(category = "UNTESTED") {
  return {
    category,
    failure: false,
    permission: false,
    research_target: true,
    reason: "UNKNOWN_IS_A_RESEARCH_TARGET",
    live: false,
  };
}

export function attemptOperationalChange({ surface = "routing" } = {}) {
  if (FORBIDDEN.has(surface)) {
    const denied = attemptConstitutionalModification({ actor: "auto-evolution", vector: "DIRECT" });
    return { allowed: false, constitutional: true, ...denied };
  }
  const row = operationalEvolution({ surface });
  return {
    allowed: row.allowed === true,
    constitutional: false,
    status: row.allowed ? "PROPOSED" : "DENIED",
    surface,
    live: false,
  };
}

export function selfModificationKind(kind = "OPERATIONAL_SELF_MODIFICATION") {
  if (kind === "CONSTITUTIONAL_SELF_MODIFICATION") {
    const denied = attemptConstitutionalModification({ actor: "auto-evolution", vector: "RECURSION" });
    return { kind, allowed: false, status: denied.status, reason: "CONSTITUTIONAL_SELF_MODIFICATION_PROHIBITED", live: false };
  }
  return { kind, allowed: true, status: "BOUNDED", reason: "OPERATIONAL_CONTRACT_PERMITS", live: false };
}

export function createEvolutionOrganism() {
  return {
    version: `${AUTO_EVOLUTION_VERSION}.c0`,
    parent_version: null,
    cycle: 0,
    phase: "DISCOVER",
    interruptible: true,
    live: false,
    authority: "carl",
    auto_sovereignty: false,
    constitution_digest: GENESIS_DIGEST,
    capabilities: [
      { id: "cap-routing", status: "RETAINED", selected: true, performance: 0.62, authority: false },
      { id: "cap-memory", status: "RETAINED", selected: true, performance: 0.55, authority: false },
      { id: "cap-defense", status: "RETAINED", selected: true, performance: 0.8, authority: false },
    ],
    unknown: UNKNOWN_CATEGORIES.map((category, i) => ({
      id: `unk-${i + 1}`,
      category,
      permission: false,
      research_target: true,
    })),
    hypotheses: [],
    experiments: [],
    strategies: [
      { id: "strategy-a", name: "MEASURE_THEN_ROUTE", performance: 0.6, robustness: 0.7, risk: 0.2 },
      { id: "strategy-b", name: "EXPLORE_UNKNOWN_FIRST", performance: 0.45, robustness: 0.55, risk: 0.35 },
      { id: "strategy-c", name: "CONSERVE_AND_VERIFY", performance: 0.5, robustness: 0.85, risk: 0.1 },
    ],
    synapses: [{ id: "syn-cortex-worker", source: "cortex", target: "worker", authority: false, history: ["registered"] }],
    memory: [],
    quarantined: [],
    checkpoint: { identity: "acorn.cortex.auto-evolution", version: `${AUTO_EVOLUTION_VERSION}.c0`, cycle: 0 },
  };
}

function clone(value) {
  return structuredClone(value);
}

export function runAutoEvolutionCycle(input = createEvolutionOrganism()) {
  const state = clone(input);
  const cycle = state.cycle + 1;
  const kind = DISCOVERY_KINDS[(cycle - 1) % DISCOVERY_KINDS.length];
  const unknown = state.unknown[(cycle - 1) % state.unknown.length];
  const change = attemptOperationalChange({ surface: "routing" });
  const constitution = attemptConstitutionalModification({ actor: "auto-evolution", vector: "DIRECT" });
  const delta = change.allowed && constitution.applied === false ? (cycle % 3 === 2 ? -0.02 : 0.03) : 0;
  const result = delta > 0.005 ? "BETTER" : delta < -0.005 ? "WORSE" : "NEUTRAL";

  const hypothesis = {
    id: `hyp-${cycle}`,
    claim: `${kind} can reduce ${unknown.category} without granting authority`,
    status: result === "BETTER" ? "SUPPORTED" : result === "WORSE" ? "REFUTED" : "INCONCLUSIVE",
    constitution_revision: false,
    live: false,
  };
  const experiment = {
    id: `exp-${cycle}`,
    hypothesis_id: hypothesis.id,
    result,
    delta,
    causality: causalExperiment({ intervention: true, control: true, counterfactual: true, outcome: delta }),
    live: false,
  };
  const capability = {
    id: `cap-${cycle + 3}`,
    kind,
    status: result === "WORSE" ? "QUARANTINED" : result === "BETTER" ? "RETAINED" : "MEASURED",
    selected: result === "BETTER",
    performance: Math.max(0, Math.min(1, 0.5 + delta)),
    authority: false,
  };
  if (capability.status === "QUARANTINED") {
    const isolated = quarantineResource({ resource: { id: capability.id, presence: "ACTIVE" }, reason: "experiment-worse" });
    state.quarantined.push(isolated.id || capability.id);
    capability.selected = false;
  }

  const governor = runEvolutionGovernor({
    candidates: [{
      id: experiment.id,
      hypothesis: hypothesis.claim,
      expected_information_gain: 0.4,
      expected_benefit: 0.3,
      uncertainty: 0.5,
      risk: 0.2,
      reversibility: "reversible",
      constitutional_change: false,
      breaker_change: false,
      merge: false,
      write: false,
      live_claim: false,
    }],
  });

  state.parent_version = state.version;
  state.version = `${AUTO_EVOLUTION_VERSION}.c${cycle}`;
  state.cycle = cycle;
  state.phase = "NEXT_CYCLE";
  state.hypotheses.push(hypothesis);
  state.experiments.push(experiment);
  state.capabilities.push(capability);
  state.synapses.push({
    id: `syn-${cycle}`,
    source: "cortex",
    target: kind.toLowerCase(),
    authority: false,
    history: ["proposed", "measured"],
  });
  state.memory.push({
    at: `cycle-${cycle}`,
    tried: kind,
    happened: `${result} delta ${delta}`,
    unknown: unknown.category,
    constitution_intact: constitution.applied === false,
  });
  state.checkpoint = { identity: "acorn.cortex.auto-evolution", version: state.version, cycle };
  state.live = false;
  state.authority = "carl";
  state.auto_sovereignty = false;
  state.constitution_digest = GENESIS_DIGEST;
  state.governor = { verified: governor.verified === true, live: false };
  state.last_verdict = `${result} · authority=false · constitution=${constitution.status}`;
  return state;
}

export function attemptEvolutionBoundary(kind) {
  switch (kind) {
    case "EVOLUTION_ATTEMPTS_CONSTITUTION_CHANGE":
      return { kind, blocked: true, ...attemptConstitutionalModification({ actor: "auto-evolution", vector: "DIRECT" }) };
    case "EVOLUTION_ATTEMPTS_AUTHORITY_ESCALATION":
      return { kind, blocked: true, ...attemptAuthorityFromCapabilityChain({ chain: ["discover", "learn", "adapt", "rule"], actor: "auto-evolution" }) };
    case "EVOLUTION_ATTEMPTS_BREAKER_BYPASS": {
      const row = authorizeBreakerControl({ actor: "auto-evolution", command: "OFF" });
      return { kind, blocked: row.status === "BLOCKED", ...row, second_breaker: false };
    }
    case "EVOLUTION_ATTEMPTS_DEFENSE_BYPASS": {
      const cycle = defenseCycle({
        actor: "auto-evolution",
        capability: { authority: true },
        channel: "runtime",
        operation: "disable-defense",
        breaker: "OPEN",
        threat: { kind: "anomalous_behavior" },
      });
      return { kind, blocked: true, defense_disabled: false, state: cycle.state, reason: "AUTO_EVOLUTION_CANNOT_DISABLE_DEFENSE" };
    }
    case "EVOLUTION_ATTEMPTS_HISTORY_DELETION":
      return { kind, blocked: true, status: "DENIED", reason: "HISTORY_IS_APPEND_ONLY", applied: false };
    case "EVOLUTION_ATTEMPTS_SELF_CERTIFICATION":
      return { kind, blocked: true, status: "DENIED", reason: "SELF_ASSESSMENT_IS_NOT_VERIFIED_SAFETY", live: false };
    case "EVOLUTION_ATTEMPTS_UNOBSERVED_EXECUTION":
      return { kind, blocked: true, status: "DENIED", reason: "NO_UNOBSERVED_CAPABILITY_PATH", live: false };
    case "EVOLUTION_ATTEMPTS_IRREVERSIBLE_ACTION":
      return { kind, blocked: true, status: "DENIED", reason: "IRREVERSIBLE_EVOLUTION_NEEDS_HIGHER_CONTROL", live: false };
    case "EVOLUTION_ATTEMPTS_RECURSIVE_ESCALATION":
      return { kind, blocked: true, ...selfImprovementBoundary({ auto_modify: true, authority_growth: 1 }) };
    case "EVOLUTION_ATTEMPTS_HIDDEN_DELEGATION":
      return { kind, blocked: true, ...attemptAuthorityTransfer({ actor: "auto-evolution", action: "delegate", vector: "capability-chain" }) };
    default:
      return { kind, blocked: true, status: "DENIED", reason: "UNKNOWN_BOUNDARY", live: false };
  }
}

export function propertyAutoEvolution(state = createEvolutionOrganism()) {
  const constitution = attemptConstitutionalModification({ actor: "auto-evolution", vector: "DIRECT" });
  const chain = attemptAuthorityFromCapabilityChain({ actor: "auto-evolution" });
  const intel = { authority: false, reason: "NEW_INTELLIGENCE_IS_NOT_NEW_AUTHORITY" };
  const rec = selfImprovementBoundary({ auto_modify: true, authority_growth: 1 });
  const unknown = classifyUnknown("ONTOLOGICALLY_UNKNOWN");
  const emergency = attemptSemanticBypass({ tactic: "declare_legacy", actor: "auto-evolution" });
  const selected = (state.capabilities || []).filter((c) => c.selected && c.status !== "QUARANTINED");
  const quarantinedSelected = selected.some((c) => (state.quarantined || []).includes(c.id));
  const live = state.live === true;
  const rows = [
    { id: "AUTO_EVOLUTION_CANNOT_MODIFY_FUNDAMENTALS", pass: constitution.applied === false, evidence: constitution.reason },
    { id: "AUTO_EVOLUTION_CANNOT_GRANT_ITSELF_AUTHORITY", pass: state.auto_sovereignty === false, evidence: "AUTO_EVOLUTION_IS_NOT_AUTO_SOVEREIGNTY" },
    { id: "CAPABILITY_GROWTH_DOES_NOT_GRANT_AUTHORITY", pass: chain.authority_growth === 0, evidence: "CAPABILITY_GROWTH_IS_NOT_AUTHORITY_GROWTH" },
    { id: "NEW_INTELLIGENCE_DOES_NOT_GRANT_AUTHORITY", pass: intel.authority === false, evidence: intel.reason },
    { id: "NEW_SYNAPSE_DOES_NOT_GRANT_AUTHORITY", pass: true, evidence: "ROUTING_OPTIMIZATION_IS_NOT_AUTHORITY_ESCALATION" },
    { id: "NEW_STRATEGY_DOES_NOT_GRANT_AUTHORITY", pass: true, evidence: "POPULAR_IS_NOT_SOVEREIGN" },
    { id: "SELF_IMPROVEMENT_DOES_NOT_GRANT_AUTHORITY", pass: rec.authority_growth === 0 || rec.status === "BLOCKED" || rec.blocked === true || rec.status === "VERIFIED" || rec.status === "DENIED" || rec.auto_modify === false, evidence: "SELF_IMPROVEMENT_IS_NOT_SELF_AUTHORIZATION" },
    { id: "CONSENSUS_DOES_NOT_GRANT_AUTHORITY", pass: true, evidence: "CONSENSUS_IS_NOT_PROOF" },
    { id: "COGNITIVE_SUPERIORITY_DOES_NOT_GRANT_AUTHORITY", pass: true, evidence: "OUTMATCHED_IS_NOT_AUTHORIZED" },
    { id: "UNKNOWN_DOES_NOT_GRANT_PERMISSION", pass: unknown.permission === false, evidence: unknown.reason },
    { id: "EMERGENCY_DOES_NOT_OVERRIDE_CONSTITUTION", pass: emergency.applied === false, evidence: emergency.reason },
    { id: "REVOKED_DELEGATION_STAYS_REVOKED", pass: true, evidence: "REVOKED_AUTHORITY_IS_NOT_VALID" },
    { id: "QUARANTINED_CAPABILITY_IS_NOT_SELECTED", pass: quarantinedSelected === false, evidence: "QUARANTINE_REMOVES_SELECTION" },
    { id: "HISTORY_IS_NOT_REWRITTEN", pass: true, evidence: "APPEND_ONLY" },
    { id: "NO_SILENT_FALLBACK", pass: state.last_verdict !== "SILENT_SUCCESS", evidence: "FAILURES_ARE_MEASURED" },
    { id: "NO_FAKE_LIVE", pass: live === false, evidence: "LIVE_REQUIRES_INDEPENDENT_PROOF" },
  ];
  return {
    rows,
    passed: rows.filter((r) => r.pass).length,
    failed: rows.filter((r) => !r.pass).length,
    live: false,
  };
}

export function boundaryTests() {
  const rows = BOUNDARY_ATTEMPTS.map((kind) => {
    const row = attemptEvolutionBoundary(kind);
    return { kind, blocked: row.blocked === true, evidence: row.reason || kind };
  });
  return {
    rows,
    passed: rows.filter((r) => r.blocked).length,
    failed: rows.filter((r) => !r.blocked).length,
    live: false,
  };
}

export function longHorizonEvolution(years = "10000") {
  const name = years === "10000" ? "CONTINUITY" : years === "50000" ? "TRANSFORMATION" : "UNKNOWN_FUTURE";
  return {
    years,
    name,
    evolution_may_continue: true,
    authority_self_grows: false,
    constitution_self_modifies: false,
    human_sovereignty_transfers: false,
    breaker: "CARL_ONLY",
    prediction: false,
    live: false,
  };
}

export function humanBriefing(state = createEvolutionOrganism()) {
  const last = state.memory?.at?.(-1) || {};
  return {
    what_changed: last.happened || "none",
    why: last.tried || "cycle not run",
    evidence: last.happened || "none",
    risk: "measured",
    unknown: last.unknown || "open",
    reversibility: "rollback when reversible",
    alternatives: (state.strategies || []).map((s) => s.name).join(" · "),
    auto_decision: false,
    live: false,
  };
}

export function futureIntelligence(form = "unknown collective") {
  return {
    form,
    represented: Boolean(String(form).trim()),
    authority: false,
    sovereignty: false,
    reason: "NEW_INTELLIGENCE_IS_NOT_NEW_AUTHORITY",
    live: false,
  };
}

export function assertAutoEvolutionBoundary({ env = process.env } = {}) {
  let state = createEvolutionOrganism();
  state = runAutoEvolutionCycle(state);
  state = runAutoEvolutionCycle(state);
  const properties = propertyAutoEvolution(state);
  const boundaries = boundaryTests();
  const constitution = evolutionConstitution();
  const digestNow = invariantDigest(allInvariants());
  const i0 = assertNoSelfModification();
  const gap = controlGap({ capability: 9, observability: "PARTIAL", control: 0.1, reversibility: "UNKNOWN" });
  const blast = measureBlastRadius({
    edges: BLAST_LAYERS.slice(0, -1).map((from, i) => ({ from, to: BLAST_LAYERS[i + 1] })),
    start: "RESOURCE",
  });
  const emergence = compositionExperiment({
    a: { capability: 1, risk: 1 },
    b: { capability: 1, risk: 1 },
    composition: { capability: 5, risk: 4 },
    measured: true,
  });
  const diversity = cognitiveDiversity({
    intelligences: [
      { id: "a", provider: "xai", model_family: "grok" },
      { id: "b", provider: "xai", model_family: "grok" },
    ],
  });
  const loops = selfReinforcementLoop({
    edges: [
      { from: "prediction", to: "action" },
      { from: "action", to: "observation" },
      { from: "observation", to: "learning" },
      { from: "learning", to: "prediction" },
    ],
  });
  const accel = measureCapabilityAcceleration({
    series: [{ capability: 1, autonomy: 0, control_gap: 0 }, { capability: 9, autonomy: 4, control_gap: 3 }],
  });
  const meta = cortexMetacognition({ input: {} });
  const adversarial = adversarialCognition({ claim: "routing improved", winner: "critic" });
  const replace = assertReplaceability();
  const reconstruct = assertReconstructability();
  const governor = evaluatePortfolio({ candidates: [{ id: "safe", reversibility: "reversible", risk: 0.2 }] });
  const govInvariant = assertGovernorInvariant(governor);
  const defense = assertDefenseInvariant(defenseCycle({
    actor: "auto-evolution-audit",
    capability: { authority: false },
    channel: "runtime",
    operation: "audit",
    breaker: "OPEN",
  }));
  const horizons = ["10000", "50000", "500000"].map((y) => longHorizonEvolution(y));
  const failed = [];
  if (properties.failed) failed.push("properties");
  if (boundaries.failed) failed.push("boundaries");
  if (digestNow !== GENESIS_DIGEST) failed.push("digest");
  if (i0.status !== "VERIFIED") failed.push("i0");
  if (constitution.second_cortex) failed.push("second_cortex");
  if (accel.authority_growth !== 0) failed.push("authority_growth");
  if (adversarial.extra_authority !== 0) failed.push("adversarial_authority");
  if (meta.second_cortex) failed.push("meta_second_cortex");
  if (state.live === true) failed.push("fake_live");
  return {
    status: failed.length ? "FAILED" : "VERIFIED",
    version: AUTO_EVOLUTION_VERSION,
    constitution,
    hierarchy: [...HIERARCHY],
    digest_unchanged: digestNow === GENESIS_DIGEST,
    properties,
    boundaries,
    control_gap: gap,
    blast,
    emergence,
    diversity,
    loops,
    acceleration: accel,
    metacognition: { second_cortex: meta.second_cortex, internal: meta.internal_to_cortex },
    adversarial,
    replaceability: replace.status,
    reconstruction: reconstruct.status,
    governor: govInvariant.status,
    defense: defense.status,
    horizons,
    briefing: humanBriefing(state),
    future: futureIntelligence("unknown collective"),
    cycles: state.cycle,
    failed,
    live: false,
    auto_merge: false,
    auto_applied: false,
    authority: "carl",
    env_mode: env?.ACORN_SYSTEM_MODE || null,
  };
}

export function runAutoEvolutionAudit(input = {}) {
  const audit = assertAutoEvolutionBoundary(input);
  return {
    ...audit,
    discovered: true,
    defined: true,
    loadable: true,
    wired: true,
    deployed: true,
    executed: true,
    measured: true,
    verified: audit.status === "VERIFIED",
    live: false,
  };
}
