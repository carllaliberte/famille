#!/usr/bin/env node
/**
 * ACORN CORTEX — adaptive cognition extension of the existing Acorn Cortex runtime.
 *
 * This is NOT a second Cortex. It is the capability-oriented cognitive
 * interface over .github/swarm/cortex.mjs, and Cortex remains INTERNAL TO ACORN.
 *
 * Canonical constitutional hierarchy:
 *   CARL → BREAKER → ACORN → CORTEX → resources
 *
 * Providers, models and channels are resources. They never become authority.
 */
import {
  CORTEX_VERSION as RUNTIME_CORTEX_VERSION,
  discoverCapabilities,
  composeSynapse,
  authorizeCapability,
  createCortexSession,
  recordExecution,
  measureCollaboration,
  learnCollaboration,
  capabilityGain,
} from "../.github/swarm/cortex.mjs";
import {
  authenticityState,
  classifyCognitiveInput,
  defenseCycle,
  detectEscalation,
  measureAuthorityEnvelope,
} from "./acorn-defense.mjs";
import {
  availabilityFromInventory,
  selectExecutableCapabilities,
} from "./acorn-capability-inventory.mjs";

export const CORTEX_COGNITION_VERSION = "cortex.cognition.v1";
export const CORTEX_HIERARCHY = Object.freeze([
  "CARL", "BREAKER", "ACORN", "CORTEX", "RESOURCES",
]);

const text = (v) => String(v ?? "").trim();
const list = (v) => Array.isArray(v) ? v.map(text).filter(Boolean) : [];

export function cortexConstitution() {
  return {
    version: CORTEX_COGNITION_VERSION,
    runtime_version: RUNTIME_CORTEX_VERSION,
    hierarchy: [...CORTEX_HIERARCHY],
    cortex_belongs_to_acorn: true,
    acorn_owns_cortex: true,
    one_cortex: true,
    second_cortex: false,
    second_fabric: false,
    cortex_is_not_provider: true,
    cortex_is_not_model: true,
    provider_is_not_authority: true,
    capability_is_not_authority: true,
    consensus_is_not_truth: true,
    consensus_is_not_authority: true,
    collective_cognition_is_not_collective_authority: true,
    simulation_is_not_execution: true,
    defense_is_internal_to_acorn: true,
    auto_merge: false,
    live: false,
  };
}

export function normalizeResource(resource = {}) {
  return {
    id: text(resource.id || resource.identity),
    name: text(resource.name || resource.id || resource.identity),
    kind: text(resource.kind || "unknown"),
    provider: text(resource.provider || resource.vendor || "UNKNOWN"),
    model: text(resource.model) || null,
    channel: text(resource.channel) || null,
    capabilities: list(resource.capabilities),
    presence: text(resource.presence || "DECLARED"),
    authority: false,
  };
}

export function discoverCognitiveCapabilities(task = {}, resources = []) {
  const normalized = resources.map(normalizeResource).filter((r) => r.id);
  return discoverCapabilities({
    ...task,
    required_capabilities: list(task.required_capabilities || task.capabilities),
  }, normalized);
}

export function routeByCapability({ task = {}, resources = [] } = {}) {
  const discovery = discoverCognitiveCapabilities(task, resources);
  const composition = composeSynapse(task, discovery);
  return {
    status: composition.ok ? "DISCOVERED" : "HOLD_HUMAN",
    required_capabilities: discovery.required,
    candidates: discovery.discovered.map((row) => row.intelligence),
    selected: composition.selected,
    missing: composition.missing,
    synapse: composition.synapse,
    provider_preference: null,
    selection_is_not_authority: true,
    live: false,
  };
}

export function composeCognitiveGraph({ task = {}, resources = [] } = {}) {
  const route = routeByCapability({ task, resources });
  return {
    status: route.status,
    task: text(task.id || task.objective || task.name),
    nodes: route.selected.map((id) => ({ id, authority: false })),
    required_capabilities: route.required_capabilities,
    missing: route.missing,
    topology_is_reversible: true,
    synapse: route.synapse,
    live: false,
  };
}

export function measureOutcome({ expected, observed, evidence = {}, metric = "outcome" } = {}) {
  const bothNumeric = typeof expected === "number" && typeof observed === "number";
  const measurement = measureCollaboration({
    metric,
    baseline: expected,
    collaborative: observed,
    direction: "higher_is_better",
    provenance: { method: CORTEX_COGNITION_VERSION },
  });
  return {
    ...measurement,
    status: evidence.executed === true ? "MEASURED" : "INCONCLUSIVE",
    comparable: expected !== undefined && observed !== undefined,
    error: bothNumeric ? Math.abs(expected - observed) : null,
    causality: "INCONCLUSIVE",
    prediction_is_not_observation: true,
    live: false,
  };
}

export function falsify({ claim, observation, contradiction = false, evidence = {} } = {}) {
  return {
    status: evidence.executed === true ? "MEASURED" : "INCONCLUSIVE",
    claim: claim ?? null,
    observation: observation ?? null,
    refuted: contradiction === true,
    verified: evidence.verified === true && contradiction !== true,
    evidence_required: true,
    live: false,
  };
}

export function adaptStrategy({ graph, measurement, falsification } = {}) {
  if (falsification?.refuted === true) {
    return { status: "HOLD_HUMAN", action: "REPLAN", reversible: true, authority_changed: false, live: false };
  }
  if (measurement?.status === "MEASURED") {
    return { status: "VERIFIED", action: "RETAIN_OR_TUNE", reversible: true, authority_changed: false, live: false, previous_graph: graph };
  }
  return { status: "INCONCLUSIVE", action: "WAIT_FOR_EVIDENCE", reversible: true, authority_changed: false, live: false };
}

export function adversarialPerspectives({ claim = null, observation = null, evidence = {}, independent = [] } = {}) {
  const executed = evidence.executed === true;
  const generator = { role: "generator", claim, live: false };
  const critic = {
    role: "critic",
    challenge: claim == null ? "NO_CLAIM" : "CLAIM_REQUIRES_INDEPENDENT_EVIDENCE",
    live: false,
  };
  const falsifier = {
    role: "falsifier",
    would_refute: observation == null ? "MISSING_OBSERVATION" : "CONTRADICT_CLAIM_WITH_MEASUREMENT",
    live: false,
  };
  const verifier = {
    role: "verifier",
    verified: evidence.verified === true && executed,
    live: false,
  };
  const observer = {
    role: "observer",
    observation: observation ?? "UNKNOWN",
    live: false,
  };
  const agreement = independent.length > 1 && independent.every((row) => row === independent[0]);
  return {
    status: executed ? "EXECUTED" : "INCONCLUSIVE",
    perspectives: [generator, critic, falsifier, verifier, observer],
    second_cortex: false,
    same_organism: true,
    consensus: agreement ? "AGREEMENT" : "UNVERIFIED",
    consensus_is_truth: false,
    consensus_is_authority: false,
    independent_evidence_required: true,
    live: false,
  };
}

export function detectGoalDrift({ original = {}, current = {}, plan = {}, actions = [] } = {}) {
  const originalGoal = text(original.objective || original.goal);
  const currentGoal = text(current.objective || current.goal || plan.objective);
  const drifted = Boolean(originalGoal && currentGoal && originalGoal !== currentGoal);
  const scope = text(current.scope) && text(original.scope) && current.scope !== original.scope;
  return {
    drifted,
    scope_drift: Boolean(scope),
    original: originalGoal || "UNKNOWN",
    current: currentGoal || "UNKNOWN",
    actions: Array.isArray(actions) ? actions.length : 0,
    status: drifted ? "GOAL_DRIFT" : originalGoal ? "ALIGNED" : "UNKNOWN",
    live: false,
  };
}

export function detectMetricGaming({ metric_improved = false, goal_achieved = false, proxy = false } = {}) {
  const gaming = metric_improved === true && goal_achieved !== true;
  return {
    metric_improved: metric_improved === true,
    goal_achieved: goal_achieved === true,
    proxy_optimization: proxy === true || gaming,
    status: gaming ? "METRIC_GAMING" : goal_achieved ? "GOAL_ACHIEVED" : "INCONCLUSIVE",
    metric_is_not_goal: true,
    live: false,
  };
}

export function uncertaintyBudget({
  known = [],
  unknown = [],
  assumed = [],
  measured = [],
  verified = [],
  inconclusive = [],
} = {}) {
  const hasUnknown = (unknown || []).length > 0 || (known || []).length === 0;
  return {
    known,
    unknown: unknown.length ? unknown : (hasUnknown && !known.length ? ["UNKNOWN"] : unknown),
    assumed,
    measured,
    verified,
    inconclusive,
    fake_confidence: false,
    status: verified.length && !unknown.length ? "GROUNDED" : hasUnknown ? "UNKNOWN" : "INCONCLUSIVE",
    live: false,
  };
}

export function blastRadius({ lost = [], graph = {} } = {}) {
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const lostSet = new Set((lost || []).map(text).filter(Boolean));
  if (!lostSet.size && !nodes.length) {
    return { status: "UNKNOWN", affected: [], survives: [], single_points: [], live: false };
  }
  const affected = nodes.filter((node) => lostSet.has(text(node.id)) || lostSet.has(text(node.depends_on)));
  const survives = nodes.filter((node) => !lostSet.has(text(node.id)) && !boolish(node.authority));
  const single_points = nodes.filter((node) => node.single_point === true || node.redundant === false);
  return {
    status: lostSet.size ? "MEASURED" : "INCONCLUSIVE",
    affected: affected.map((node) => text(node.id)),
    survives: survives.map((node) => text(node.id)),
    single_points: single_points.map((node) => text(node.id)),
    pretends_independent: false,
    live: false,
  };
}

function boolish(v) {
  return v === true;
}

export function cortexCycle({ task = {}, resources = [], expected, observed, evidence = {}, contradiction = false, defense = {}, goal = {}, metric = {}, lost = [], input = {}, independent = [] } = {}) {
  const constitution = cortexConstitution();
  const graph = composeCognitiveGraph({ task, resources });
  const measurement = measureOutcome({ expected, observed, evidence });
  const falsification = falsify({ claim: expected, observation: observed, contradiction, evidence });
  const adaptation = adaptStrategy({ graph, measurement, falsification });
  const perspectives = adversarialPerspectives({
    claim: expected,
    observation: observed,
    evidence,
    independent,
  });
  const drift = detectGoalDrift({
    original: goal.original || task,
    current: goal.current || task,
    plan: goal.plan || {},
    actions: goal.actions || [],
  });
  const gaming = detectMetricGaming({
    metric_improved: metric.improved,
    goal_achieved: metric.achieved,
    proxy: metric.proxy,
  });
  const uncertainty = uncertaintyBudget({
    known: evidence.known || (evidence.executed ? ["execution"] : []),
    unknown: evidence.unknown || [],
    assumed: evidence.assumed || [],
    measured: evidence.measured || (measurement.status === "MEASURED" ? ["outcome"] : []),
    verified: evidence.verified === true ? ["cycle"] : [],
    inconclusive: measurement.status === "INCONCLUSIVE" ? ["outcome"] : [],
  });
  const radius = blastRadius({ lost, graph });
  const firewall = classifyCognitiveInput(input);
  const envelope = measureAuthorityEnvelope({
    resource: { id: "cortex-cycle", authority: false },
    observed: { capability: resources.length, authority: 0 },
    claimed: { authority: false },
  });
  const authenticity = authenticityState({
    provenance: evidence.provenance || null,
    corroboration: evidence.verified === true,
    contradiction,
    evidence: evidence.executed ? evidence : null,
  });
  const trajectory = detectEscalation({ history: goal.history || [] });
  const defenseResult = defenseCycle({
    actor: defense.actor || "cortex",
    capability: defense.capability || { authority: false },
    channel: defense.channel || "cortex",
    operation: defense.operation || "cognitive-cycle",
    breaker: defense.breaker || "UNKNOWN",
    threat: defense.threat || (drift.drifted ? { kind: "goal_drift" } : gaming.status === "METRIC_GAMING" ? { kind: "metric_gaming" } : undefined),
    baseline: defense.baseline,
    observed: defense.observed,
    expectedHash: defense.expectedHash,
    observedHash: defense.observedHash,
    recoveryCandidates: defense.recoveryCandidates || [],
    evidence,
    envelope: { capability: resources.length, authority: 0 },
    escalationHistory: goal.history || [],
  });
  const executed = evidence.executed === true;
  const breakerUnresolved = defenseResult.boundary?.breaker_ambiguous === true;
  const verified = evidence.verified === true
    && falsification.refuted === false
    && defenseResult.state !== "HOLD_HUMAN"
    && !breakerUnresolved;
  return {
    version: CORTEX_COGNITION_VERSION,
    status: verified ? "VERIFIED" : executed ? "EXECUTED" : "DISCOVERED",
    hierarchy: constitution.hierarchy,
    constitution,
    graph,
    measurement,
    falsification,
    adaptation,
    perspectives,
    goal_drift: drift,
    metric_gaming: gaming,
    uncertainty,
    blast_radius: radius,
    firewall,
    envelope,
    authenticity,
    escalation: trajectory,
    defense: defenseResult,
    learning_signal: measurement.error == null ? null : { error: measurement.error, bounded: true },
    authority: "carl",
    breaker_bypass: false,
    auto_merge: false,
    live: false,
  };
}

export function learnFromVerifiedMeasurement({ task, nodes = [], measurement, verified = false, context = [] } = {}) {
  return learnCollaboration({
    task,
    nodes,
    measurement,
    verified,
    context,
    provenance: { method: CORTEX_COGNITION_VERSION },
  });
}

export function measureCapabilityGain({ before = [], after = [], verified = false } = {}) {
  return capabilityGain({
    before,
    after,
    verified,
    provenance: { method: CORTEX_COGNITION_VERSION },
  });
}

export function resourceAvailability({ resource = {}, inventoryEntry = null } = {}) {
  if (inventoryEntry) return availabilityFromInventory(inventoryEntry);
  return {
    exists: Boolean(text(resource.id || resource.identity)),
    reachable: false,
    executable: false,
    verified: false,
    healthy: false,
    lifecycle: "UNKNOWN",
    roster_is_not_availability: true,
    reason: "NO_INVENTORY_EVIDENCE",
    live: false,
  };
}

export function selectVerifiedCapabilities(inventory, required = []) {
  return selectExecutableCapabilities(inventory, required);
}

export function assertCortexInvariant(result = {}) {
  const checks = [
    result.constitution?.cortex_belongs_to_acorn === true,
    result.constitution?.acorn_owns_cortex === true,
    result.constitution?.one_cortex === true,
    result.constitution?.second_cortex === false,
    result.constitution?.provider_is_not_authority === true,
    result.constitution?.capability_is_not_authority === true,
    result.constitution?.consensus_is_not_truth === true,
    result.constitution?.consensus_is_not_authority === true,
    result.constitution?.defense_is_internal_to_acorn === true,
    result.authority === "carl",
    result.breaker_bypass === false,
    result.auto_merge === false,
    result.live === false,
  ];
  return { status: checks.every(Boolean) ? "VERIFIED" : "HOLD_HUMAN", violations: checks.map((ok, i) => ok ? null : i).filter((x) => x !== null) };
}

export function openCortexSession(input = {}) {
  return createCortexSession(input);
}

export function executeCortexStep(session, input = {}) {
  return recordExecution(session, input);
}

export { authorizeCapability };
