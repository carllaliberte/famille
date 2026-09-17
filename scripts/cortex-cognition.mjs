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
    decision_is_not_action: true,
    objective_is_not_authorization: true,
    learning_is_not_unverified_auto_modification: true,
    defense_is_internal_to_acorn: true,
    compute_is_resource: true,
    compute_is_not_intelligence: true,
    qpu_is_not_intelligence: true,
    gpu_is_not_intelligence: true,
    provider_is_not_intelligence: true,
    omni_core_belongs_to_cortex: true,
    second_core: false,
    second_organism: false,
    axes_independent: true,
    unknown_capability_is_legitimate: true,
    detect_is_not_fix: true,
    observe_is_not_act: true,
    breaker_outside_optimization: true,
    connector_belongs_to_cortex: true,
    no_direct_external_to_acorn: true,
    no_direct_acorn_to_external: true,
    acorn_may_request_survival: true,
    acorn_may_redefine_survival: false,
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
    candidates: discovery.discovered
      .filter((row) => row.covered.length > 0)
      .map((row) => row.intelligence),
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

export const EVIDENCE_GRADES = Object.freeze([
  "UNOBSERVED",
  "ASSERTED",
  "OBSERVED",
  "MEASURED",
  "REPRODUCED",
  "FALSIFIED",
  "VERIFIED",
  "LIVE",
]);

export function declareMeaning({
  objective,
  intent,
  constraints = [],
  values = [],
  importance,
  consequences,
  beneficiaries = [],
  affected = [],
  limits = [],
  valid_until,
  human_origin = false,
  derived_by = null,
} = {}) {
  const purpose = text(objective);
  return {
    purpose: purpose || "UNKNOWN",
    intent: text(intent) || "UNKNOWN",
    constraints: list(constraints),
    values: list(values),
    importance: importance ?? "UNKNOWN",
    consequences: consequences ?? "UNKNOWN",
    stakeholders: { beneficiaries: list(beneficiaries), affected: list(affected) },
    limits: list(limits),
    valid_until: valid_until || null,
    human_origin: human_origin === true,
    derived: human_origin !== true && Boolean(purpose),
    derived_by: human_origin === true ? null : (derived_by || (purpose ? "intelligence" : null)),
    objective_is_not_authorization: true,
    invented_human_objective: false,
    status: purpose ? (human_origin === true ? "HUMAN_ORIGIN" : "DERIVED") : "UNKNOWN",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function stampTime({
  at,
  created_at,
  observed_at,
  verified_at,
  valid_from,
  valid_until,
  superseded_by,
} = {}) {
  const now = at || new Date().toISOString();
  const until = valid_until || null;
  const expired = Boolean(until && Number.isFinite(Date.parse(until)) && Date.parse(until) < Date.parse(now));
  return {
    created_at: created_at || now,
    observed_at: observed_at || null,
    verified_at: verified_at || null,
    valid_from: valid_from || created_at || now,
    valid_until: until,
    superseded_by: superseded_by || null,
    expired,
    live: false,
  };
}

export function gradeEvidence({
  asserted = false,
  observed = false,
  measured = false,
  reproduced = false,
  falsified = false,
  verified = false,
  live_execution = false,
} = {}) {
  let grade = "UNOBSERVED";
  if (asserted === true) grade = "ASSERTED";
  if (observed === true) grade = "OBSERVED";
  if (measured === true) grade = "MEASURED";
  if (reproduced === true) grade = "REPRODUCED";
  if (falsified === true) grade = "FALSIFIED";
  if (verified === true && observed === true && measured === true) grade = "VERIFIED";
  if (live_execution === true && verified === true && observed === true && measured === true) grade = "LIVE";
  return {
    grade,
    auto_promoted: false,
    defined_is_not_executed: true,
    executed_is_not_verified: true,
    verified_is_not_live: true,
    carl_live_verified: false,
    live: false,
  };
}

export function provenanceChain({
  source,
  observation,
  transformation,
  inference,
  decision,
  action,
  result,
} = {}) {
  return {
    chain: [
      { kind: "source", value: source ?? "UNKNOWN" },
      { kind: "observation", value: observation ?? "UNKNOWN" },
      { kind: "transformation", value: transformation ?? "UNKNOWN" },
      { kind: "inference", value: inference ?? "UNKNOWN" },
      { kind: "decision", value: decision ?? "UNKNOWN" },
      { kind: "action", value: action ?? "UNKNOWN" },
      { kind: "result", value: result ?? "UNKNOWN" },
    ],
    inference_is_not_observation: true,
    decision_is_not_action: true,
    live: false,
  };
}

export function governanceScope({
  who,
  what,
  why,
  when,
  where,
  with_what,
  under_which_authority,
  with_which_evidence,
  with_which_risk,
} = {}) {
  return {
    who: text(who) || "UNKNOWN",
    what: text(what) || "UNKNOWN",
    why: text(why) || "UNKNOWN",
    when: when || stampTime({}),
    where: text(where) || "UNKNOWN",
    with_what: text(with_what) || "UNKNOWN",
    under_which_authority: text(under_which_authority) || "carl",
    with_which_evidence: with_which_evidence ?? "UNKNOWN",
    with_which_risk: with_which_risk ?? "UNKNOWN",
    capability_is_not_authority: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function proposeAction({
  actor = "UNKNOWN",
  identity = "UNKNOWN",
  capability = "UNKNOWN",
  purpose = "UNKNOWN",
  target = "UNKNOWN",
  risk = "UNKNOWN",
  irreversible = false,
  simulated = false,
} = {}) {
  return {
    status: "PROPOSED",
    actor: text(actor) || "UNKNOWN",
    identity: text(identity) || "UNKNOWN",
    capability: text(capability) || "UNKNOWN",
    purpose: text(purpose) || "UNKNOWN",
    target: text(target) || "UNKNOWN",
    risk: text(risk) || "UNKNOWN",
    irreversible: irreversible === true,
    simulated: simulated === true,
    is_not_execution: true,
    decision_is_not_action: true,
    simulation_is_not_execution: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function authorizeAction({ proposal = {}, grant = {}, breaker = "UNKNOWN", meaning = {} } = {}) {
  const requested = text(proposal.capability);
  const auth = authorizeCapability({
    capabilities: requested && requested !== "UNKNOWN" ? [requested] : [],
    allowed: grant.human === true && grant.allowed === true,
    authority: grant.human === true ? "network" : "untrusted",
  });
  const breakerOpen = text(breaker).toUpperCase() === "OPEN";
  const irreversibleBlocked = proposal.irreversible === true && grant.human !== true;
  const meaningBlocks = meaning.invented_human_objective === true;
  const authorized = auth.ok && breakerOpen && grant.human === true && grant.allowed === true && !irreversibleBlocked && !meaningBlocks;
  return {
    status: authorized ? "AUTHORIZED" : (breakerOpen ? "DENIED" : "HOLD_HUMAN"),
    authorized,
    reason: meaningBlocks
      ? "INVENTED_OBJECTIVE"
      : irreversibleBlocked
        ? "IRREVERSIBLE_REQUIRES_HUMAN"
        : authorized
          ? "HUMAN_GRANT"
          : auth.reason,
    capability_is_not_authority: true,
    objective_is_not_authorization: true,
    meaning_is_not_authorization: true,
    breaker: text(breaker).toUpperCase() || "UNKNOWN",
    breaker_changed: false,
    scope: governanceScope({
      who: grant.human === true ? "carl" : proposal.actor,
      what: requested,
      why: meaning.purpose || proposal.purpose,
      where: proposal.target,
      with_what: proposal.capability,
      under_which_authority: "carl",
      with_which_evidence: authorized ? "HUMAN_GRANT" : "NONE",
      with_which_risk: proposal.risk,
    }),
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function observeAction({ proposal = {}, authorization = {}, executed = false, observation, verification } = {}) {
  if (authorization.authorized !== true) {
    return {
      status: "NOT_EXECUTED",
      reason: "NOT_AUTHORIZED",
      execution_is_not_proof: true,
      live: false,
    };
  }
  if (proposal.simulated === true && executed !== true) {
    return {
      status: "SIMULATED",
      reason: "SIMULATION_IS_NOT_EXECUTION",
      execution_is_not_proof: true,
      live: false,
    };
  }
  if (executed !== true) {
    return {
      status: "NOT_EXECUTED",
      reason: "NO_EXECUTION_EVIDENCE",
      execution_is_not_proof: true,
      live: false,
    };
  }
  return {
    status: "EXECUTED",
    actor: proposal.actor,
    target: proposal.target,
    observation: observation ?? "UNKNOWN",
    verification: verification || "NOT_VERIFIED",
    execution_is_not_proof: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function governEvolution({ verified = false, simulated = false, adopted = false, reversible = true } = {}) {
  if (adopted === true && verified !== true) {
    return {
      status: "REJECTED",
      reason: "LEARNING_IS_NOT_UNVERIFIED_AUTO_MODIFICATION",
      adopted: false,
      reversible: true,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  if (adopted === true && simulated !== true) {
    return {
      status: "REJECTED",
      reason: "SIMULATION_REQUIRED_BEFORE_ADOPTION",
      adopted: false,
      reversible: true,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  return {
    status: adopted ? "ADOPTED" : (verified ? "VERIFIED" : "PROPOSED"),
    adopted: adopted === true && verified === true && simulated === true,
    reversible: reversible !== false,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function diagnoseConflict({ cortex = {}, defense = {}, fabric = {}, memory = {}, runtime = {}, time = {}, governance = {} } = {}) {
  const conflicts = [];
  if (cortex.status === "VERIFIED" && defense.state && !["HEALTHY", "OBSERVED", "RECOVERED", "NOT_REQUIRED"].includes(defense.state)) {
    conflicts.push({ kind: "CORTEX_VERIFIED_DEFENSE_NOT_HEALTHY" });
  }
  if (fabric.status === "PRESENT" && runtime.status === "ABSENT") {
    conflicts.push({ kind: "FABRIC_PRESENT_RUNTIME_ABSENT" });
  }
  if (memory.current === true && time.expired === true) {
    conflicts.push({ kind: "MEMORY_CURRENT_TIME_EXPIRED" });
  }
  if (cortex.claimed_success === true && runtime.executed !== true) {
    conflicts.push({ kind: "PROVIDER_SUCCESS_WITHOUT_EXECUTION" });
  }
  if (governance.authorized === true && (governance.denied === true || defense.denied === true)) {
    conflicts.push({ kind: "CAPABILITY_AUTHORIZED_GOVERNANCE_DENIED" });
  }
  return {
    status: conflicts.length ? "CONFLICT" : "ALIGNED",
    conflicts,
    silent_resolve: false,
    preserve_evidence: true,
    live: false,
  };
}

export function organismMetrics(available = {}) {
  const keys = [
    "detection_latency",
    "containment_latency",
    "recovery_latency",
    "false_positive_rate",
    "false_negative_indicators",
    "evidence_completeness",
    "provenance_completeness",
    "authority_violations_prevented",
    "unsafe_actions_prevented",
    "successful_recoveries",
    "failed_recoveries",
    "capability_discovery_rate",
    "capability_verification_rate",
    "runtime_coverage",
    "drift_detection",
    "learning_gain",
    "prediction_error",
    "causal_confidence",
    "dependency_concentration",
    "common_mode_risk",
    "autonomy_exposure",
  ];
  const metrics = {};
  for (const key of keys) {
    metrics[key] = Object.prototype.hasOwnProperty.call(available, key) ? available[key] : "NOT_MEASURED";
  }
  return { ...metrics, invented: false, live: false };
}

export function composeOrganism({
  meaning,
  cortex,
  defense,
  fabric,
  science,
  memory,
  evolution,
  action,
  time,
  evidence,
  diagnosis,
} = {}) {
  return {
    primitives: {
      meaning: meaning || { status: "UNKNOWN" },
      governance: { authority: "carl", capability_is_not_authority: true },
      cognition: cortex ? { status: cortex.status, second_cortex: false } : { status: "UNKNOWN" },
      fabric: fabric || { status: "UNKNOWN" },
      science: science || { status: "UNKNOWN" },
      memory: memory || { status: "UNKNOWN" },
      defense: defense ? { state: defense.state, second_defense: false, continue_defending: defense.continue_defending !== false } : { status: "UNKNOWN" },
      evolution: evolution || { status: "UNKNOWN" },
      action: action || { status: "NOT_EXECUTED" },
    },
    transverse: {
      time: time || stampTime({}),
      provenance: true,
      evidence: evidence || gradeEvidence({}),
    },
    diagnosis: diagnosis || { status: "UNKNOWN" },
    second_cortex: false,
    second_defense: false,
    second_runtime: false,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function cortexCycle({ task = {}, resources = [], expected, observed, evidence = {}, contradiction = false, defense = {}, goal = {}, metric = {}, lost = [], input = {}, independent = [], meaning: meaningInput = {}, action: actionInput = {} } = {}) {
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
  const meaning = declareMeaning({
    objective: meaningInput.objective || task.objective || task.id,
    intent: meaningInput.intent,
    constraints: meaningInput.constraints,
    human_origin: meaningInput.human_origin === true,
    derived_by: meaningInput.derived_by || "cortex",
    valid_until: meaningInput.valid_until,
  });
  const proposal = proposeAction({
    actor: actionInput.actor || defense.actor || "cortex",
    identity: actionInput.identity || "cortex",
    capability: actionInput.capability || (task.required_capabilities || [])[0] || "review",
    purpose: meaning.purpose,
    target: actionInput.target || task.id || "cognitive-cycle",
    risk: actionInput.risk,
    irreversible: actionInput.irreversible === true,
    simulated: actionInput.simulated === true,
  });
  const authorization = authorizeAction({
    proposal,
    grant: actionInput.grant || {},
    breaker: defense.breaker || "UNKNOWN",
    meaning,
  });
  const acted = observeAction({
    proposal,
    authorization,
    executed: actionInput.executed === true,
    observation: observed,
    verification: verified ? "VERIFIED" : "NOT_VERIFIED",
  });
  const time = stampTime({
    at: actionInput.at,
    observed_at: evidence.executed ? (actionInput.at || null) : null,
    valid_until: meaning.valid_until,
  });
  const evidenceGrade = gradeEvidence({
    asserted: expected !== undefined,
    observed: observed !== undefined,
    measured: measurement.status === "MEASURED",
    falsified: falsification.refuted === true,
    verified,
    live_execution: false,
  });
  const diagnosis = diagnoseConflict({
    cortex: { status: verified ? "VERIFIED" : executed ? "EXECUTED" : "DISCOVERED", claimed_success: evidence.claimed_success },
    defense: defenseResult,
    fabric: actionInput.fabric || {},
    memory: { current: meaningInput.memory_current === true },
    runtime: { executed, status: executed ? "PRESENT" : "ABSENT" },
    time,
    governance: { authorized: authorization.authorized, denied: authorization.authorized === false },
  });
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
    meaning,
    action: { proposal, authorization, observation: acted },
    time,
    evidence_grade: evidenceGrade,
    diagnosis,
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
    result.constitution?.decision_is_not_action === true,
    result.constitution?.objective_is_not_authorization === true,
    result.constitution?.learning_is_not_unverified_auto_modification === true,
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
