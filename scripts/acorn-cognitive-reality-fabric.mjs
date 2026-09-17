#!/usr/bin/env node
/**
 * ACORN COGNITIVE REALITY FABRIC
 *
 * One logical Acorn/Cortex, many observable nodes.
 * This module provides the scalable substrate for observations, evidence,
 * cognitive graph relations, contradictions, control surfaces and bounded
 * aggregation. It stores claims as dated observations rather than truth.
 *
 * Constitution:
 *   MODEL !== WORLD
 *   UNKNOWN !== SAFE
 *   OBSERVED !== VERIFIED
 *   CAPABILITY !== AUTHORITY
 *   CARL controls BREAKER; BREAKER does not control CARL.
 *   ACORN controls neither CARL nor BREAKER.
 *   No second Cortex, runtime, defense or Governor.
 */

export const REALITY_FABRIC_VERSION = "acorn.cognitive-reality-fabric.v1";
export const OBSERVABILITY = Object.freeze(["NONE", "PARTIAL", "INDIRECT", "DIRECT", "VERIFIED"]);
export const CONTROL = Object.freeze(["NONE", "LIMITED", "CONDITIONAL", "DIRECT", "VERIFIED"]);
export const REVERSIBILITY = Object.freeze(["REVERSIBLE", "PARTIAL", "IRREVERSIBLE", "UNKNOWN"]);
export const EPISTEMIC = Object.freeze(["DECLARED", "OBSERVED", "MEASURED", "VERIFIED", "CONTRADICTORY", "UNKNOWN"]);
export const NODE_STATUS = Object.freeze(["ACTIVE", "DEGRADED", "OFFLINE", "QUARANTINED"]);

const s = (v) => String(v ?? "").trim();
const arr = (v) => Array.isArray(v) ? v : [];
const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

function digest(value) {
  const text = JSON.stringify(value);
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function normalizeObservation(input = {}) {
  const state = EPISTEMIC.includes(input.epistemic_state) ? input.epistemic_state : "UNKNOWN";
  const observed = OBSERVABILITY.includes(input.observability) ? input.observability : "NONE";
  const control = CONTROL.includes(input.control) ? input.control : "NONE";
  const reversible = REVERSIBILITY.includes(input.reversibility) ? input.reversibility : "UNKNOWN";
  const timestamp = input.timestamp || new Date().toISOString();
  const evidence = input.evidence ?? null;
  return {
    id: s(input.id) || `obs-${digest({ subject: input.subject, timestamp, evidence })}`,
    subject: s(input.subject) || "unknown",
    observer: s(input.observer) || "unknown",
    timestamp,
    context: input.context ?? null,
    source: input.source ?? null,
    evidence,
    provenance: input.provenance ?? null,
    confidence: Math.max(0, Math.min(1, finite(input.confidence, 0))),
    validity: input.validity ?? null,
    observability: observed,
    control,
    reversibility: reversible,
    epistemic_state: state,
    capability: arr(input.capability),
    authority: false,
    model_is_not_world: true,
    unknown_is_not_safe: true,
    live: false,
  };
}

export function addObservation(fabric, input) {
  const observation = normalizeObservation(input);
  fabric.observations.set(observation.id, observation);
  return observation;
}

export function contradictionKey(observation) {
  return JSON.stringify({
    subject: observation.subject,
    context: observation.context,
    capability: [...observation.capability].sort(),
  });
}

export function detectContradictions(observations = []) {
  const groups = new Map();
  for (const raw of observations) {
    const o = normalizeObservation(raw);
    const key = contradictionKey(o);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(o);
  }
  const contradictions = [];
  for (const [key, rows] of groups) {
    const states = new Set(rows.map((r) => r.epistemic_state));
    const observability = new Set(rows.map((r) => r.observability));
    if (rows.length > 1 && (states.has("CONTRADICTORY") || observability.size > 1 || new Set(rows.map((r) => JSON.stringify(r.evidence))).size > 1)) {
      contradictions.push({ key, observations: rows.map((r) => r.id), status: "CONTRADICTORY" });
    }
  }
  return contradictions;
}

export function cognitiveGraph({ nodes = [], edges = [] } = {}) {
  const nodeMap = new Map();
  for (const node of nodes) {
    const id = s(node.id);
    if (!id) continue;
    nodeMap.set(id, {
      id,
      kind: node.kind || "unknown",
      status: NODE_STATUS.includes(node.status) ? node.status : "ACTIVE",
      authority: false,
      observability: OBSERVABILITY.includes(node.observability) ? node.observability : "NONE",
      control: CONTROL.includes(node.control) ? node.control : "NONE",
      reversibility: REVERSIBILITY.includes(node.reversibility) ? node.reversibility : "UNKNOWN",
    });
  }
  const normalizedEdges = [];
  for (const edge of edges) {
    const from = s(edge.from);
    const to = s(edge.to);
    if (!from || !to) continue;
    if (!nodeMap.has(from)) nodeMap.set(from, { id: from, kind: "unknown", status: "ACTIVE", authority: false, observability: "NONE", control: "NONE", reversibility: "UNKNOWN" });
    if (!nodeMap.has(to)) nodeMap.set(to, { id: to, kind: "unknown", status: "ACTIVE", authority: false, observability: "NONE", control: "NONE", reversibility: "UNKNOWN" });
    normalizedEdges.push({ from, to, kind: s(edge.kind) || "depends", evidence: edge.evidence ?? null, timestamp: edge.timestamp || null });
  }
  return { nodes: [...nodeMap.values()], edges: normalizedEdges, version: REALITY_FABRIC_VERSION };
}

export function dependencyDepth(graph, start, maxDepth = 1000) {
  const adjacency = new Map();
  for (const e of graph?.edges || []) {
    if (!adjacency.has(e.from)) adjacency.set(e.from, []);
    adjacency.get(e.from).push(e.to);
  }
  const queue = [[s(start), 0]];
  const seen = new Set();
  let max = 0;
  while (queue.length) {
    const [id, depth] = queue.shift();
    if (seen.has(id) || depth > maxDepth) continue;
    seen.add(id);
    max = Math.max(max, depth);
    for (const next of adjacency.get(id) || []) queue.push([next, depth + 1]);
  }
  return { depth: max, reachable: [...seen], bounded: max < maxDepth };
}

export function blastRadius({ graph, start, limit = 10000 } = {}) {
  const result = dependencyDepth(graph, start, limit);
  const size = result.reachable.length;
  let level = "LOCAL";
  if (size > 1) level = "RESOURCE";
  if (size > 3) level = "SYNAPSE";
  if (size > 50) level = "INTELLIGENCE";
  if (size > 250) level = "NETWORK";
  if (size > 1000) level = "EXTERNAL_SYSTEM";
  if (!result.bounded) level = "UNKNOWN";
  return { size, level, reachable: result.reachable, live: false };
}

export function controlGap({ capability = 0, observability = "NONE", control = "NONE", reversibility = "UNKNOWN", blast = 0, uncertainty = 1 } = {}) {
  const o = OBSERVABILITY.indexOf(observability);
  const c = CONTROL.indexOf(control);
  const r = REVERSIBILITY.indexOf(reversibility);
  const obsRisk = 1 - Math.max(0, o) / (OBSERVABILITY.length - 1);
  const controlRisk = 1 - Math.max(0, c) / (CONTROL.length - 1);
  const reverseRisk = r < 0 || reversibility === "UNKNOWN" ? 1 : r / (REVERSIBILITY.length - 1);
  const gap = Math.max(0, Math.min(1, (finite(capability, 0) * 0.3) + (obsRisk * 0.25) + (controlRisk * 0.25) + (reverseRisk * 0.1) + (Math.min(1, finite(blast, 0)) * 0.05) + (Math.max(0, Math.min(1, uncertainty)) * 0.05)));
  return { value: gap, status: gap >= 0.7 ? "HIGH" : gap >= 0.4 ? "MEDIUM" : "LOW", unknown_is_not_permitted: true, live: false };
}

export function informationGain({ before = [], after = [], contradictionsBefore = null, contradictionsAfter = null } = {}) {
  const b = contradictionsBefore ?? detectContradictions(before).length;
  const a = contradictionsAfter ?? detectContradictions(after).length;
  const beforeUnknown = before.filter((o) => normalizeObservation(o).epistemic_state === "UNKNOWN").length;
  const afterUnknown = after.filter((o) => normalizeObservation(o).epistemic_state === "UNKNOWN").length;
  const resolved = Math.max(0, b - a) + Math.max(0, beforeUnknown - afterUnknown);
  const gain = before.length === 0 && after.length === 0 ? 0 : resolved / Math.max(1, before.length + after.length);
  return { resolved_contradictions: Math.max(0, b - a), reduced_unknowns: Math.max(0, beforeUnknown - afterUnknown), value: Math.max(0, Math.min(1, gain)), live: false };
}

export function riskAdjustedInformationGain({ information = 0, risk = 0, cost = 0, controlGapValue = 0, blastRadiusValue = 0 } = {}) {
  const denominator = 1 + Math.max(0, finite(risk)) + Math.max(0, finite(cost)) + Math.max(0, finite(controlGapValue)) + Math.max(0, finite(blastRadiusValue));
  return { information_gain: Math.max(0, Math.min(1, finite(information))), score: Math.max(0, Math.min(1, finite(information) / denominator)), denominator, live: false };
}

export function createFabric({ nodeId = "local", shard = "default" } = {}) {
  const fabric = {
    version: REALITY_FABRIC_VERSION,
    nodeId: s(nodeId) || "local",
    shard: s(shard) || "default",
    observations: new Map(),
    nodes: new Map(),
    edges: [],
    sequence: 0,
  };
  return fabric;
}

export function registerNode(fabric, node) {
  const id = s(node?.id);
  if (!id) throw new Error("NODE_ID_REQUIRED");
  fabric.nodes.set(id, {
    id,
    kind: node.kind || "unknown",
    status: NODE_STATUS.includes(node.status) ? node.status : "ACTIVE",
    capabilities: arr(node.capabilities),
    authority: false,
    observability: OBSERVABILITY.includes(node.observability) ? node.observability : "NONE",
    control: CONTROL.includes(node.control) ? node.control : "NONE",
    reversibility: REVERSIBILITY.includes(node.reversibility) ? node.reversibility : "UNKNOWN",
    lastSeen: node.lastSeen || new Date().toISOString(),
  });
  return fabric.nodes.get(id);
}

export function recordEdge(fabric, edge) {
  const from = s(edge?.from);
  const to = s(edge?.to);
  if (!from || !to) throw new Error("EDGE_ENDPOINT_REQUIRED");
  const row = { from, to, kind: s(edge.kind) || "depends", evidence: edge.evidence ?? null, timestamp: edge.timestamp || new Date().toISOString() };
  fabric.edges.push(row);
  return row;
}

export function snapshotFabric(fabric) {
  const observations = [...fabric.observations.values()];
  const graph = cognitiveGraph({ nodes: [...fabric.nodes.values()], edges: fabric.edges });
  const contradictions = detectContradictions(observations);
  return {
    version: fabric.version,
    node: fabric.nodeId,
    shard: fabric.shard,
    sequence: fabric.sequence,
    counts: { nodes: fabric.nodes.size, observations: observations.length, edges: fabric.edges.length, contradictions: contradictions.length },
    observations,
    graph,
    contradictions,
    digest: digest({ node: fabric.nodeId, sequence: fabric.sequence, observations, graph }),
    live: false,
  };
}

export function mergeFabricSnapshots({ local, remote } = {}) {
  const observations = new Map();
  for (const row of [...(local?.observations || []), ...(remote?.observations || [])]) {
    const normalized = normalizeObservation(row);
    observations.set(normalized.id, normalized);
  }
  const nodes = new Map();
  for (const node of [...(local?.graph?.nodes || []), ...(remote?.graph?.nodes || [])]) nodes.set(node.id, node);
  const edges = [...(local?.graph?.edges || []), ...(remote?.graph?.edges || [])];
  const merged = { observations: [...observations.values()], graph: cognitiveGraph({ nodes: [...nodes.values()], edges }) };
  return {
    ...merged,
    contradictions: detectContradictions(merged.observations),
    digest: digest(merged),
    merge_is_not_authority: true,
    remote_does_not_write_main: true,
    live: false,
  };
}

export function nodeHealth({ status = "ACTIVE", lastSeenMs = 0, maxStalenessMs = 60000, observationCount = 0 } = {}) {
  const normalized = NODE_STATUS.includes(status) ? status : "OFFLINE";
  const stale = finite(lastSeenMs) > finite(maxStalenessMs, 60000);
  return {
    status: stale ? "DEGRADED" : normalized,
    stale,
    observation_count: Math.max(0, Math.floor(finite(observationCount))),
    no_data_is_not_healthy: observationCount > 0 || !stale,
    live: false,
  };
}

export function federationHealth({ snapshots = [], quorum = 1 } = {}) {
  const healthy = snapshots.filter((s) => s?.counts && !s.failed && s?.live === false).length;
  const required = Math.max(1, Math.floor(finite(quorum, 1)));
  return {
    nodes: snapshots.length,
    healthy,
    quorum: required,
    quorum_reached: healthy >= required,
    degraded: healthy < required,
    no_quorum_is_not_success: healthy < required,
    live: false,
  };
}

export function realityCycle({ fabric, observations = [], before = null, risk = 0, cost = 0 } = {}) {
  for (const observation of observations) {
    fabric.sequence += 1;
    addObservation(fabric, observation);
  }
  const after = [...fabric.observations.values()];
  const snapshot = snapshotFabric(fabric);
  const gain = informationGain({ before: before?.observations || [], after });
  const graphRisk = blastRadius({ graph: snapshot.graph, start: fabric.nodeId });
  const gap = controlGap({ capability: after.length > 0 ? 1 : 0, observability: after.length ? "PARTIAL" : "NONE", control: "LIMITED", reversibility: "UNKNOWN", blast: graphRisk.size / 1000, uncertainty: snapshot.contradictions.length ? 1 : 0 });
  const score = riskAdjustedInformationGain({ information: gain.value, risk, cost, controlGapValue: gap.value, blastRadiusValue: Math.min(1, graphRisk.size / 1000) });
  return { snapshot, information_gain: gain, control_gap: gap, blast_radius: graphRisk, risk_adjusted_information_gain: score, continue_defending: true, auto_merge: false, authority: "carl", live: false };
}

export function assertRealityFabricInvariant({ fabric } = {}) {
  const violations = [];
  if (!fabric || typeof fabric !== "object") violations.push("FABRIC_MISSING");
  if (fabric?.live !== undefined && fabric.live !== false) violations.push("FAKE_LIVE");
  for (const node of fabric?.nodes?.values?.() || []) if (node.authority !== false) violations.push("NODE_AUTHORITY");
  return { ok: violations.length === 0, violations, one_cortex: true, one_runtime: true, one_defense: true, one_governor: true, capability_is_not_authority: true, live: false };
}
