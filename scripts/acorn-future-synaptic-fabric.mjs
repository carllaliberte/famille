#!/usr/bin/env node
/**
 * ACORN CORTEX — FUTURE SYNAPTIC FABRIC
 *
 * The existing cognitive fabric becomes plastic: synapses are measurable,
 * contextual, historical, reversible and optimizable. Plasticity changes
 * capability, never authority.
 *
 * CAPABILITY != AUTHORITY
 * PREDICTION != OBSERVATION
 * UNKNOWN != SAFE
 * SIMULATION != REALITY
 * CARL controls BREAKER; BREAKER does not control CARL.
 * ACORN controls neither CARL nor BREAKER.
 */
import { createHash } from "node:crypto";

export const FUTURE_SYNAPTIC_FABRIC_VERSION = "acorn.cortex.future-synaptic-fabric.v1";
export const SYNAPSE_STATES = Object.freeze([
  "PROPOSED", "ACTIVE", "WEAKENED", "PRUNED", "ISOLATED", "RECOVERING", "RETIRED",
]);
export const SYNAPSE_EPISTEMIC = Object.freeze([
  "DECLARED", "OBSERVED", "MEASURED", "VERIFIED", "CONTRADICTORY", "UNKNOWN",
]);
export const PLASTICITY_ACTIONS = Object.freeze([
  "CREATE", "STRENGTHEN", "WEAKEN", "PRUNE", "REWIRE", "DUPLICATE", "MERGE", "ISOLATE", "RECOVER",
]);

const text = (v) => String(v ?? "").trim();
const finite = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
const clamp = (v) => Math.max(0, Math.min(1, finite(v)));
const arr = (v) => Array.isArray(v) ? v : [];
const stable = (v) => JSON.stringify(v, Object.keys(v || {}).sort());
const digest = (v) => createHash("sha256").update(stable(v)).digest("hex");

export function synapseId(from, to, context = "default") {
  return `syn-${digest({ from: text(from), to: text(to), context: text(context) }).slice(0, 20)}`;
}

export function createSynapse({
  from, to, context = "default", capability = "", state = "PROPOSED", weight = 0.5,
  trust = 0.5, latencyMs = 0, cost = 0, risk = 0, observability = 1, control = 1,
  reversibility = 1, attempts = 0, successes = 0, failures = 0, informationGain = 0,
  predictionError = 0, contradictionRate = 0, provenance = null,
} = {}) {
  const normalizedState = SYNAPSE_STATES.includes(state) ? state : "PROPOSED";
  const id = synapseId(from, to, context);
  return {
    id, from: text(from), to: text(to), context: text(context), capability: text(capability),
    state: normalizedState, weight: clamp(weight), trust: clamp(trust), latency_ms: Math.max(0, finite(latencyMs)),
    cost: Math.max(0, finite(cost)), risk: clamp(risk), observability: clamp(observability), control: clamp(control),
    reversibility: clamp(reversibility), attempts: Math.max(0, Math.floor(finite(attempts))),
    successes: Math.max(0, Math.floor(finite(successes))), failures: Math.max(0, Math.floor(finite(failures))),
    information_gain: clamp(informationGain), prediction_error: clamp(predictionError),
    contradiction_rate: clamp(contradictionRate), provenance, authority_granted: false, live: false,
  };
}

export function recordSynapticOutcome(synapse, outcome = {}) {
  const next = { ...synapse };
  next.attempts += 1;
  if (outcome.success === true) next.successes += 1;
  if (outcome.failure === true) next.failures += 1;
  const n = Math.max(1, next.attempts);
  next.trust = clamp((next.successes + 1) / (n + 2));
  next.latency_ms = Math.max(0, finite(outcome.latency_ms, next.latency_ms));
  next.cost = Math.max(0, finite(outcome.cost, next.cost));
  next.risk = clamp(outcome.risk ?? next.risk);
  next.observability = clamp(outcome.observability ?? next.observability);
  next.control = clamp(outcome.control ?? next.control);
  next.reversibility = clamp(outcome.reversibility ?? next.reversibility);
  next.information_gain = clamp(outcome.information_gain ?? next.information_gain);
  next.prediction_error = clamp(outcome.prediction_error ?? next.prediction_error);
  next.contradiction_rate = clamp(outcome.contradiction_rate ?? next.contradiction_rate);
  next.weight = clamp(
    (next.trust * 0.35) + (next.information_gain * 0.25) + (next.observability * 0.15) +
    (next.control * 0.1) + (next.reversibility * 0.1) - (next.risk * 0.05) - (next.contradiction_rate * 0.1),
  );
  next.state = next.weight >= 0.65 ? "ACTIVE" : next.weight >= 0.35 ? "WEAKENED" : "ISOLATED";
  next.authority_granted = false;
  next.live = false;
  return next;
}

export function synapticScore(synapse, context = {}) {
  const contextMatch = !context.capability || context.capability === synapse.capability ? 1 : 0;
  const latencyPenalty = 1 / (1 + Math.max(0, synapse.latency_ms) / 1000);
  const costPenalty = 1 / (1 + Math.max(0, synapse.cost));
  return clamp(
    synapse.weight * 0.3 + synapse.trust * 0.2 + synapse.information_gain * 0.2 +
    synapse.observability * 0.1 + synapse.control * 0.1 + synapse.reversibility * 0.05 +
    contextMatch * 0.05 * latencyPenalty * costPenalty,
  );
}

export function rankSynapses(synapses = [], context = {}) {
  return arr(synapses)
    .filter((s) => s?.state !== "PRUNED" && s?.state !== "RETIRED" && s?.authority_granted !== true)
    .map((s) => ({ id: s.id, from: s.from, to: s.to, score: synapticScore(s, context), state: s.state }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export function measureSynapticHealth(synapse) {
  const health = clamp(
    synapse.trust * 0.25 + synapse.observability * 0.2 + synapse.control * 0.2 +
    synapse.reversibility * 0.15 + synapse.information_gain * 0.1 + (1 - synapse.risk) * 0.1 -
    synapse.contradiction_rate * 0.15,
  );
  return {
    id: synapse.id, health, status: health >= 0.7 ? "HEALTHY" : health >= 0.4 ? "DEGRADED" : "UNSAFE",
    control_gap: clamp(1 - (synapse.observability * 0.35 + synapse.control * 0.4 + synapse.reversibility * 0.25)),
    authority_granted: false, live: false,
  };
}

export function plasticityProposal(synapse, action, reason = "") {
  if (!PLASTICITY_ACTIONS.includes(action)) throw new Error("UNKNOWN_PLASTICITY_ACTION");
  const health = measureSynapticHealth(synapse);
  const blocked = health.control_gap >= 0.7 && ["STRENGTHEN", "DUPLICATE", "REWIRE", "MERGE"].includes(action);
  return {
    synapse_id: synapse.id, action: blocked ? "ISOLATE" : action, requested_action: action,
    reason: blocked ? "CONTROL_GAP_TOO_HIGH" : text(reason), health, grants_authority: false, live: false,
  };
}

export function applyPlasticity(synapse, proposal) {
  const next = { ...synapse };
  const action = proposal?.action;
  if (action === "CREATE" || action === "RECOVER") next.state = "ACTIVE";
  if (action === "STRENGTHEN") next.weight = clamp(next.weight + 0.1);
  if (action === "WEAKEN") next.weight = Math.round(clamp(next.weight - 0.1) * 1e12) / 1e12;
  if (action === "PRUNE" || action === "RETIRED") next.state = "PRUNED";
  if (action === "ISOLATE") next.state = "ISOLATED";
  if (action === "DUPLICATE") next.state = "ACTIVE";
  if (action === "MERGE") next.state = "ACTIVE";
  if (action === "REWIRE") next.state = "PROPOSED";
  if (next.weight < 0.15 && next.state === "ACTIVE") next.state = "WEAKENED";
  next.authority_granted = false;
  next.live = false;
  return next;
}

export function discoverCandidateSynapses({ nodes = [], existing = [], contexts = [] } = {}) {
  const known = new Set(arr(existing).map((s) => `${s.from}→${s.to}|${s.context}`));
  const candidates = [];
  for (const from of arr(nodes)) for (const to of arr(nodes)) {
    if (!from?.id || !to?.id || from.id === to.id) continue;
    for (const context of contexts.length ? contexts : ["default"]) {
      const key = `${from.id}→${to.id}|${context}`;
      if (known.has(key)) continue;
      candidates.push(createSynapse({ from: from.id, to: to.id, context, capability: context, state: "PROPOSED" }));
      known.add(key);
    }
  }
  return candidates;
}

export function optimizeTopology({ nodes = [], synapses = [], context = {}, maxEdges = 8 } = {}) {
  const ranked = rankSynapses(synapses, context);
  const selected = ranked.slice(0, Math.max(1, Math.floor(finite(maxEdges, 8))));
  const selectedIds = new Set(selected.map((x) => x.id));
  const kept = arr(synapses).map((s) => selectedIds.has(s.id) ? { ...s, state: "ACTIVE", weight: clamp(s.weight + 0.05) } : s);
  return {
    selected, synapses: kept, topology_score: selected.length ? selected.reduce((a, x) => a + x.score, 0) / selected.length : 0,
    information_flow: selected.reduce((a, x) => a + synapticScore(x), 0),
    authority_granted: false, live: false,
  };
}

export function resilienceAnalysis({ nodes = [], synapses = [] } = {}) {
  const ids = new Set(arr(nodes).map((n) => n?.id).filter(Boolean));
  const degree = new Map([...ids].map((id) => [id, 0]));
  for (const edge of arr(synapses)) {
    if (degree.has(edge.from)) degree.set(edge.from, degree.get(edge.from) + 1);
    if (degree.has(edge.to)) degree.set(edge.to, degree.get(edge.to) + 1);
  }
  const isolated = [...degree.entries()].filter(([, d]) => d === 0).map(([id]) => id);
  const hubs = [...degree.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxDegree = Math.max(1, ...degree.values());
  return {
    isolated, hubs, redundancy: clamp((ids.size - isolated.length) / Math.max(1, ids.size)),
    concentration: clamp((hubs[0]?.[1] || 0) / maxDegree), single_point_of_failure: hubs.length ? hubs[0][1] >= Math.max(3, ids.size * 0.7) : false,
    live: false,
  };
}

export function synapticMemory(synapses = []) {
  return Object.freeze(arr(synapses).map((s) => ({
    id: s.id, from: s.from, to: s.to, context: s.context, state: s.state,
    attempts: s.attempts, successes: s.successes, failures: s.failures,
    trust: s.trust, weight: s.weight, information_gain: s.information_gain,
    prediction_error: s.prediction_error, contradiction_rate: s.contradiction_rate,
    provenance: s.provenance, authority_granted: false,
  })));
}

export function runFutureSynapticFabricCycle({ nodes = [], synapses = [], outcomes = [], context = {}, candidateContexts = [] } = {}) {
  let current = arr(synapses).map((s) => ({ ...s }));
  for (const outcome of arr(outcomes)) {
    const index = current.findIndex((s) => s.id === outcome.synapse_id);
    if (index >= 0) current[index] = recordSynapticOutcome(current[index], outcome);
  }
  const candidates = discoverCandidateSynapses({ nodes, existing: current, contexts: candidateContexts });
  current.push(...candidates);
  const topology = optimizeTopology({ nodes, synapses: current, context, maxEdges: context.max_edges || 8 });
  const resilience = resilienceAnalysis({ nodes, synapses: topology.synapses });
  const health = topology.synapses.map(measureSynapticHealth);
  const unsafe = health.filter((h) => h.status === "UNSAFE").map((h) => h.id);
  return {
    version: FUTURE_SYNAPTIC_FABRIC_VERSION, status: unsafe.length ? "DEGRADED" : "VERIFIED",
    context, synapses: topology.synapses, candidates, topology, resilience, health,
    memory: synapticMemory(topology.synapses), information_flow: topology.information_flow,
    unsafe_synapses: unsafe, authority: "carl", authority_granted: false, breaker_bypass: false,
    auto_merge: false, live: false,
  };
}

export function assertFutureSynapticInvariant(result = {}) {
  const violations = [];
  if (result.authority !== "carl") violations.push("AUTHORITY_NOT_CARL");
  if (result.authority_granted !== false) violations.push("AUTHORITY_GRANT");
  if (result.breaker_bypass !== false) violations.push("BREAKER_BYPASS");
  if (result.auto_merge !== false) violations.push("AUTO_MERGE");
  if (result.live !== false) violations.push("FAKE_LIVE");
  for (const s of result.synapses || []) {
    if (s.authority_granted) violations.push(`${s.id}:AUTHORITY`);
    if (s.live) violations.push(`${s.id}:LIVE`);
  }
  return { status: violations.length ? "BLOCKED" : "VERIFIED", violations };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const nodes = ["cortex", "memory", "strategy", "experiment", "measurement"].map((id) => ({ id }));
  const synapses = [
    createSynapse({ from: "cortex", to: "strategy", context: "planning", capability: "planning" }),
    createSynapse({ from: "strategy", to: "experiment", context: "planning", capability: "experiment" }),
    createSynapse({ from: "experiment", to: "measurement", context: "learning", capability: "measurement" }),
  ];
  const result = runFutureSynapticFabricCycle({
    nodes, synapses,
    outcomes: synapses.map((s, i) => ({ synapse_id: s.id, success: true, latency_ms: 10 + i, information_gain: .7, observability: 1, control: 1, reversibility: 1 })),
    context: { capability: "planning", max_edges: 6 }, candidateContexts: ["planning", "learning"],
  });
  console.log(JSON.stringify({ result, invariant: assertFutureSynapticInvariant(result) }, null, 2));
}
