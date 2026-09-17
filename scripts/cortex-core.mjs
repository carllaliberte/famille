#!/usr/bin/env node
/**
 * ACORN CORTEX — provider-agnostic adaptive cognition core.
 *
 * Canonical architecture:
 *   CARL → BREAKER → CORTEX → ACORN → resources
 *
 * Cortex is cognition, not hosting, not a provider, not a model roster,
 * and never an authority source. Acorn supplies the constitutional/runtime
 * substrate around it.
 */

export const CORTEX_VERSION = "cortex.core.v1";
export const CORTEX_ORDER = Object.freeze([
  "CARL",
  "BREAKER",
  "CORTEX",
  "ACORN",
  "RESOURCES",
]);

const STATES = new Set([
  "DISCOVERED",
  "PLANNED",
  "EXECUTED",
  "MEASURED",
  "VERIFIED",
  "HOLD_HUMAN",
  "INCONCLUSIVE",
]);

const text = (v) => String(v ?? "").trim();
const list = (v) => Array.isArray(v) ? v.map(text).filter(Boolean) : [];

export function cortexConstitution() {
  return {
    version: CORTEX_VERSION,
    hierarchy: [...CORTEX_ORDER],
    cortex_is_not_provider: true,
    cortex_is_not_model: true,
    cortex_is_not_roster: true,
    provider_is_not_authority: true,
    capability_is_not_authority: true,
    one_cortex: true,
    second_cortex: false,
    second_fabric: false,
    auto_merge: false,
    live: false,
  };
}

export function normalizeResource(resource = {}) {
  return {
    identity: text(resource.identity || resource.id) || "unknown-resource",
    provider: text(resource.provider || resource.vendor) || "UNKNOWN",
    model: text(resource.model) || null,
    channel: text(resource.channel) || null,
    capabilities: list(resource.capabilities),
    state: text(resource.state) || "DISCOVERED",
    authority: false,
  };
}

export function discoverResources(resources = []) {
  return listObjects(resources).map(normalizeResource);
}

function listObjects(value) {
  return Array.isArray(value) ? value.filter((v) => v && typeof v === "object") : [];
}

export function requiredCapabilities(task = {}) {
  return list(task.required_capabilities || task.capabilities || task.needs);
}

export function capabilityMatch(resource, required) {
  const caps = new Set(list(resource.capabilities).map((x) => x.toLowerCase()));
  return list(required).every((x) => caps.has(x.toLowerCase()));
}

export function routeByCapability({ task = {}, resources = [], measurements = {} } = {}) {
  const required = requiredCapabilities(task);
  const candidates = discoverResources(resources).filter((resource) => capabilityMatch(resource, required));
  const measured = measurements && measurements.measured === true;
  return {
    status: candidates.length ? "DISCOVERED" : "INCONCLUSIVE",
    required_capabilities: required,
    candidates,
    selected: measured && candidates.length ? candidates[0] : null,
    selection_is_not_authority: true,
    provider_preference: null,
    live: false,
  };
}

export function composeCognitiveGraph({ task = {}, resources = [], strategy = "adaptive" } = {}) {
  const route = routeByCapability({ task, resources });
  return {
    status: route.candidates.length ? "DISCOVERED" : "INCONCLUSIVE",
    strategy,
    task: task.id || task.name || null,
    required_capabilities: route.required_capabilities,
    nodes: route.candidates.map((resource, index) => ({
      id: resource.identity,
      role: index === 0 ? "PRIMARY_CANDIDATE" : "ALTERNATE",
      provider: resource.provider,
      capabilities: resource.capabilities,
      authority: false,
    })),
    topology_is_reversible: true,
    live: false,
  };
}

export function measureOutcome({ expected, observed, metrics = {}, evidence = {} } = {}) {
  const comparable = expected !== undefined && observed !== undefined;
  const error = comparable && typeof expected === "number" && typeof observed === "number"
    ? Math.abs(expected - observed)
    : null;
  return {
    status: evidence.executed === true ? "MEASURED" : "INCONCLUSIVE",
    comparable,
    error,
    metrics: metrics && typeof metrics === "object" ? { ...metrics } : {},
    evidence_present: Boolean(evidence && Object.keys(evidence).length),
    causality: "INCONCLUSIVE",
    prediction_is_not_observation: true,
    live: false,
  };
}

export function falsify({ claim, observation, contradiction = false, evidence = {} } = {}) {
  const refuted = contradiction === true;
  return {
    status: evidence.executed === true ? "MEASURED" : "INCONCLUSIVE",
    claim: claim || null,
    observation: observation ?? null,
    refuted,
    verified: evidence.verified === true && !refuted,
    evidence_required: true,
    live: false,
  };
}

export function adaptStrategy({ graph, measurement, falsification } = {}) {
  const blocked = falsification?.refuted === true;
  const measured = measurement?.status === "MEASURED";
  return {
    status: blocked ? "HOLD_HUMAN" : measured ? "VERIFIED" : "INCONCLUSIVE",
    action: blocked ? "REPLAN" : measured ? "RETAIN_OR_TUNE" : "WAIT_FOR_EVIDENCE",
    previous_graph: graph || null,
    reversible: true,
    authority_changed: false,
    silent_authority_change: false,
    live: false,
  };
}

export function cortexCycle({ task = {}, resources = [], expected, observed, evidence = {}, contradiction = false } = {}) {
  const constitution = cortexConstitution();
  const discovered = discoverResources(resources);
  const graph = composeCognitiveGraph({ task, resources: discovered });
  const measurement = measureOutcome({ expected, observed, evidence });
  const falsification = falsify({ claim: expected, observation: observed, contradiction, evidence });
  const adaptation = adaptStrategy({ graph, measurement, falsification });
  const executed = evidence.executed === true;
  const verified = evidence.verified === true && !falsification.refuted;

  return {
    version: CORTEX_VERSION,
    status: verified ? "VERIFIED" : executed ? "EXECUTED" : "DISCOVERED",
    hierarchy: constitution.hierarchy,
    constitution,
    resources: discovered,
    graph,
    measurement,
    falsification,
    adaptation,
    learning_signal: measurement.error === null ? null : { error: measurement.error, bounded: true },
    authority: "carl",
    breaker_bypass: false,
    auto_merge: false,
    live: false,
  };
}

export function assertCortexInvariant(result = {}) {
  const required = [
    result.constitution?.one_cortex === true,
    result.constitution?.second_cortex === false,
    result.constitution?.capability_is_not_authority === true,
    result.constitution?.provider_is_not_authority === true,
    result.authority === "carl",
    result.breaker_bypass === false,
    result.auto_merge === false,
    result.live === false,
  ];
  return {
    status: required.every(Boolean) ? "VERIFIED" : "HOLD_HUMAN",
    violations: required.reduce((out, ok, i) => ok ? out : [...out, i], []),
  };
}

export function cortexStateMachine(state = "DISCOVERED") {
  const normalized = text(state).toUpperCase();
  return STATES.has(normalized) ? normalized : "INCONCLUSIVE";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = cortexCycle({
    task: { id: "self-check", required_capabilities: ["review"] },
    resources: [{ id: "cortex-local", provider: "acorn", capabilities: ["review"] }],
    evidence: { executed: true, verified: true },
  });
  console.log(JSON.stringify({ ...result, invariant: assertCortexInvariant(result) }, null, 2));
}
