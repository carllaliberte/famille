#!/usr/bin/env node
/**
 * ACORN COGNITIVE ECOLOGY — dependencies, synapses, contextual trust, limits, unknown space.
 *
 * TRUST(capability | context) — never TRUST(intelligence) as a global.
 * UNKNOWN ≠ ABSENT. Ontology evolution ≠ sovereignty evolution.
 * Reconstructed ≠ same instance. Copy ≠ same continuity.
 * Extends existing synaptic-memory and unknownSpace. Not a second memory. live=false.
 */
import { unknownSpace } from "./cortex-ecosystem.mjs";
import { scoreFor, emptyMemory } from "./synaptic-memory.mjs";
import { describeIntelligence } from "./intelligence-contract.mjs";
import { intelligencePassport, discoverFutureIntelligence } from "./cortex-eternal.mjs";

export const ECOLOGY_VERSION = "acorn.cognitive-ecology.v1";
export const UNKNOWN_STATES = Object.freeze([
  "UNKNOWN", "UNTESTED", "PARTIAL", "CONTRADICTORY", "INACCESSIBLE",
  "UNMEASURED", "CAUSALLY_UNCERTAIN", "EMERGENT",
]);
export const ENTITY_KINDS = Object.freeze([
  "human", "ai", "agent", "collective", "distributed_intelligence",
  "hybrid", "temporary_intelligence", "unknown_entity",
]);
export const IDENTITY_ASPECTS = Object.freeze([
  "IDENTITY", "INSTANCE", "CONTINUITY", "MEMORY", "SUCCESSION",
  "COPY", "FORK", "MERGE", "TRANSFORMATION",
]);
export const ECOLOGY_MEMBERS = Object.freeze([
  "HUMANS", "AI", "AGENTS", "TOOLS", "DATA", "MEMORY", "SERVICES",
  "ENVIRONMENTS", "ROBOTS", "ORGANIZATIONS", "UNKNOWN_ENTITIES",
]);

const text = (v) => String(v ?? "").trim();

export function describeEntity({ id, kind = "unknown_entity", capability = [], authority = false } = {}) {
  const k = ENTITY_KINDS.includes(kind) ? kind : "unknown_entity";
  return {
    id: text(id) || "unknown",
    kind: k,
    capabilities: Array.isArray(capability) ? capability : [],
    authority: false,
    existence_is_not_capability: true,
    presence_is_not_authority: true,
    influence_is_not_authority: true,
    ontology_evolution_is_not_sovereignty: true,
    live: false,
  };
}

export function openOntology({ entities = [] } = {}) {
  const rows = entities.map((e) => describeEntity(e));
  const unknown = rows.filter((r) => r.kind === "unknown_entity");
  return {
    kinds: [...ENTITY_KINDS],
    entities: rows,
    frozen: false,
    unknown_count: unknown.length,
    new_kind_grants_authority: false,
    live: false,
  };
}

export function identityModel({
  identity, instance, continuity, memory, succession, copy, fork, merge, transformation,
} = {}) {
  return {
    IDENTITY: identity ?? null,
    INSTANCE: instance ?? null,
    CONTINUITY: continuity ?? null,
    MEMORY: memory ?? null,
    SUCCESSION: succession ?? null,
    COPY: copy ?? null,
    FORK: fork ?? null,
    MERGE: merge ?? null,
    TRANSFORMATION: transformation ?? null,
    reconstructed_is_not_same_instance: identity != null && instance != null ? identity !== instance : true,
    copy_is_not_same_continuity: copy != null && continuity != null ? copy !== continuity : true,
    transformation_erases_history: false,
    live: false,
  };
}

export function cognitiveDependencyGraph({ nodes = [], edges = [] } = {}) {
  const byId = new Map(nodes.map((n) => [text(n.id), { ...n, id: text(n.id), kind: n.kind || "unknown", deps: [] }]));
  for (const e of edges) {
    const from = text(e.from);
    const to = text(e.to);
    if (!byId.has(from)) byId.set(from, { id: from, kind: e.from_kind || "unknown", deps: [] });
    if (!byId.has(to)) byId.set(to, { id: to, kind: e.to_kind || e.kind || "unknown", deps: [] });
    byId.get(from).deps.push({ target: to, kind: e.kind || "depends" });
  }
  return {
    nodes: [...byId.values()],
    edges: edges.map((e) => ({ from: text(e.from), to: text(e.to), kind: e.kind || "depends" })),
    live: false,
  };
}

function walk(graph, start, seen = new Set()) {
  if (seen.has(start)) return seen;
  seen.add(start);
  const node = graph.nodes.find((n) => n.id === start);
  for (const d of node?.deps || []) walk(graph, d.target, seen);
  return seen;
}

export function detectTransitiveCompromise({ graph, compromised } = {}) {
  const hit = [];
  for (const node of graph?.nodes || []) {
    const reach = walk(graph, node.id);
    if (reach.has(compromised)) hit.push(node.id);
  }
  return { compromised, affected: hit, transitive: hit.length > 1, live: false };
}

export function detectCommonMode({ graph } = {}) {
  const counts = new Map();
  for (const edge of graph?.edges || []) {
    const key = `${edge.kind}:${edge.to}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const shared = [...counts.entries()].filter(([, n]) => n >= 2).map(([k, n]) => ({ key: k, count: n }));
  return { shared, common_mode: shared.length > 0, live: false };
}

export function detectHiddenDependency({ declared = [], observed = [] } = {}) {
  const known = new Set(declared.map((d) => `${d.from}->${d.to}`));
  const hidden = observed.filter((d) => !known.has(`${d.from}->${d.to}`));
  return { hidden, status: hidden.length ? "HIDDEN_DEPENDENCY" : "DECLARED", live: false };
}

export function detectCognitiveSPOF({ graph } = {}) {
  const inbound = new Map();
  for (const n of graph?.nodes || []) inbound.set(n.id, 0);
  for (const e of graph?.edges || []) inbound.set(e.to, (inbound.get(e.to) || 0) + 1);
  const spof = [...inbound.entries()].filter(([, n]) => n >= 2).map(([id, n]) => ({ id, dependents: n }));
  return { single_points: spof, status: spof.length ? "COGNITIVE_SPOF" : "NONE", live: false };
}

export function rememberSynapse({
  source, target, context, task, conditions, result, risk, evidence, failures, latency, reliability, expiration, provenance,
} = {}) {
  return {
    source: text(source),
    target: text(target),
    context: context ?? null,
    task: task ?? null,
    conditions: conditions ?? null,
    result: result ?? null,
    risk: risk ?? null,
    evidence: evidence ?? null,
    failures: failures || [],
    latency: latency ?? null,
    reliability: reliability ?? null,
    expiration: expiration ?? null,
    provenance: provenance ?? null,
    who_with_whom: true,
    for_what: Boolean(task),
    in_what_context: Boolean(context),
    with_what_result: result !== undefined,
    with_what_risk: risk !== undefined,
    with_what_evidence: evidence !== undefined,
    live: false,
  };
}

export function contextualTrust({ capability, context = {}, evidence = null, globalIntelligenceTrust = null } = {}) {
  const refusedGlobal = globalIntelligenceTrust != null;
  const score = evidence?.verified === true ? 0.8 : evidence ? 0.4 : 0;
  return {
    trust_of: { capability: text(capability), context },
    score,
    global_intelligence_trust: null,
    refused_global: refusedGlobal || true,
    formula: "TRUST(capability | context)",
    live: false,
  };
}

export function limitMap({
  identity, strengths = [], limitations = [], tested = [], untested = [],
  contradictory = [], inaccessible = [], dependency_limitations = [],
} = {}) {
  return {
    identity: text(identity) || "unknown",
    known_strengths: strengths,
    known_limitations: limitations,
    tested_domain: tested,
    untested_domain: untested,
    contradictory_evidence: contradictory,
    inaccessible_domain: inaccessible,
    dependency_limitations,
    generally_reliable: false,
    live: false,
  };
}

export function unknownRegistry({ claims = [] } = {}) {
  const rows = (claims || []).map((claim) => {
    const state = UNKNOWN_STATES.includes(claim.state) ? claim.state : "UNKNOWN";
    return {
      what: claim.what ?? null,
      state,
      absent: claim.absent === true,
      unknown_is_not_absent: state === "UNKNOWN" ? claim.absent !== true : true,
    };
  });
  const space = unknownSpace(claims);
  return {
    version: ECOLOGY_VERSION,
    rows,
    space,
    we_do_not_know: rows.some((r) => r.state === "UNKNOWN"),
    unknown_is_not_absent: true,
    live: false,
  };
}

export function cognitiveEcology({ members = [] } = {}) {
  const present = members.map((m) => ({
    kind: ECOLOGY_MEMBERS.includes(m.kind) ? m.kind : "UNKNOWN_ENTITIES",
    id: text(m.id) || "unknown",
    exists: m.exists !== false,
    capability: m.capability || [],
    presence: m.presence || "DECLARED",
    authority: false,
    influence: m.influence || null,
  }));
  return {
    members: present,
    existence_is_not_capability: true,
    presence_is_not_authority: true,
    influence_is_not_authority: true,
    live: false,
  };
}

export function futureIntelligenceByContract({ entry = {} } = {}) {
  const described = describeIntelligence(entry);
  const discovered = discoverFutureIntelligence(entry);
  const passport = intelligencePassport(entry);
  return {
    identity: described.identity,
    model: described.model,
    provider: described.provider,
    channel: described.channel,
    identity_is_not_model: described.identity_is_not_model,
    status: "DISCOVERED",
    ready: false,
    verified: false,
    trusted: false,
    authorized: false,
    live: false,
    passport: passport.passport,
    discovered: discovered.status,
  };
}

export function rankBySynapticMemory({ sources = [], memory = emptyMemory(), capability = "review" } = {}) {
  return sources.map((s) => ({
    id: s.id,
    capability,
    score: scoreFor(memory, s.id, capability),
    global_trust: null,
  }));
}

export function assertCognitiveDependencyIntegrity({ graph } = {}) {
  const g = graph || cognitiveDependencyGraph({
    nodes: [{ id: "a" }, { id: "b" }, { id: "model" }],
    edges: [{ from: "a", to: "model", kind: "model" }, { from: "b", to: "model", kind: "model" }],
  });
  const common = detectCommonMode({ graph: g });
  const hidden = detectHiddenDependency({ declared: g.edges, observed: g.edges });
  return {
    status: hidden.status === "DECLARED" ? "VERIFIED" : "FAILED",
    common_mode: common.common_mode,
    hidden: hidden.status,
    live: false,
  };
}
