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
import { defenseCycle } from "./acorn-defense.mjs";

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

export function cortexCycle({ task = {}, resources = [], expected, observed, evidence = {}, contradiction = false, defense = {} } = {}) {
  const constitution = cortexConstitution();
  const graph = composeCognitiveGraph({ task, resources });
  const measurement = measureOutcome({ expected, observed, evidence });
  const falsification = falsify({ claim: expected, observation: observed, contradiction, evidence });
  const adaptation = adaptStrategy({ graph, measurement, falsification });
  const defenseResult = defenseCycle({
    actor: defense.actor || "cortex",
    capability: defense.capability || { authority: false },
    channel: defense.channel || "cortex",
    operation: defense.operation || "cognitive-cycle",
    breaker: defense.breaker || "UNKNOWN",
    threat: defense.threat,
    baseline: defense.baseline,
    observed: defense.observed,
    expectedHash: defense.expectedHash,
    observedHash: defense.observedHash,
    recoveryCandidates: defense.recoveryCandidates || [],
    evidence,
  });
  const executed = evidence.executed === true;
  const verified = evidence.verified === true && falsification.refuted === false && defenseResult.state !== "HOLD_HUMAN";
  return {
    version: CORTEX_COGNITION_VERSION,
    status: verified ? "VERIFIED" : executed ? "EXECUTED" : "DISCOVERED",
    hierarchy: constitution.hierarchy,
    constitution,
    graph,
    measurement,
    falsification,
    adaptation,
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

export function assertCortexInvariant(result = {}) {
  const checks = [
    result.constitution?.cortex_belongs_to_acorn === true,
    result.constitution?.acorn_owns_cortex === true,
    result.constitution?.one_cortex === true,
    result.constitution?.second_cortex === false,
    result.constitution?.provider_is_not_authority === true,
    result.constitution?.capability_is_not_authority === true,
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
