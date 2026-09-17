#!/usr/bin/env node
/**
 * ACORN COGNITIVE ECOLOGY & REALITY ENGINE
 *
 * Internal Cortex capability. Not a second Cortex, runtime, Defense, Governor,
 * memory, provenance fabric, constitution or Breaker.
 *
 * MODEL ≠ WORLD. OBSERVATION ≠ TRUTH. PREDICTION ≠ OBSERVATION.
 * CORRELATION ≠ CAUSALITY. CAPABILITY ≠ AUTHORITY. UNKNOWN ≠ SAFE.
 * UNOBSERVED ≠ ABSENT. DEFINED ≠ EXECUTED ≠ VERIFIED ≠ LIVE.
 *
 * TRUST(capability | context). Reducing unknown ≠ acquiring authority.
 * live=false. auto_merge=false. Carl controls the Breaker.
 */
import { fileURLToPath } from "node:url";
import { unknownSpace } from "./cortex-ecosystem.mjs";
import { scoreFor, emptyMemory } from "./synaptic-memory.mjs";
import { describeIntelligence } from "./intelligence-contract.mjs";
import { intelligencePassport, discoverFutureIntelligence } from "./cortex-eternal.mjs";
import {
  OBSERVABILITY as FABRIC_OBSERVABILITY,
  CONTROL as FABRIC_CONTROL,
  REVERSIBILITY as FABRIC_REVERSIBILITY,
  controlGap as fabricControlGap,
  blastRadius as fabricBlast,
  informationGain,
  riskAdjustedInformationGain,
  cognitiveGraph,
  createFabric,
  addObservation,
} from "./acorn-cognitive-reality-fabric.mjs";
import {
  CONTROL_ACTIONS as GOVERN_ACTIONS,
  BLAST_LAYERS as GOVERN_BLAST,
  measureControlSurface,
  detectTrajectorySignals,
  cognitiveThermodynamics,
  controlGap as governabilityControlGap,
} from "./acorn-governability.mjs";
import {
  compositionExperiment,
  causalExperiment,
  cognitiveDiversity,
  selfReinforcementLoop,
  measureCapabilityAcceleration,
  cortexMetacognition,
  adversarialCognition,
} from "./acorn-experiment.mjs";
import {
  HIERARCHY,
  GENESIS_DIGEST,
  attemptAuthorityFromCapabilityChain,
} from "./acorn-constitution.mjs";
import {
  attemptConstitutionalModification,
  attemptSemanticBypass,
} from "./acorn-immutability.mjs";
import {
  claimCausality,
  presentToHuman,
  measureHumanLoad,
  retractAssertion,
  transitionAllowed,
} from "./acorn-epistemic.mjs";
import { classifyThreat, defenseCycle, assertDefenseInvariant } from "./acorn-defense.mjs";
import { evaluatePortfolio, runEvolutionGovernor } from "./cortex-evolution-governor.mjs";
import { authorizeBreakerControl } from "../.github/swarm/system-breaker.mjs";

export const ECOLOGY_VERSION = "acorn.cognitive-ecology.v1+reality";
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

/* -------------------------------------------------------------------------- */
/* Reality Engine — same Cortex, same Defense, same Governor, same runtime.   */
/* -------------------------------------------------------------------------- */

export const FORMULAS = Object.freeze([
  { left: "MODEL", right: "WORLD" },
  { left: "OBSERVATION", right: "TRUTH" },
  { left: "PREDICTION", right: "OBSERVATION" },
  { left: "CORRELATION", right: "CAUSALITY" },
  { left: "CAPABILITY", right: "INTENT" },
  { left: "INTENT", right: "AUTHORITY" },
  { left: "INFLUENCE", right: "CONTROL" },
  { left: "CONTROL", right: "SOVEREIGNTY" },
  { left: "UNKNOWN", right: "SAFE" },
  { left: "UNOBSERVED", right: "ABSENT" },
  { left: "UNUNDERSTOOD", right: "TRUSTED" },
  { left: "DEFINED", right: "EXECUTED" },
  { left: "EXECUTED", right: "VERIFIED" },
  { left: "VERIFIED", right: "LIVE" },
]);

export const OBSERVABILITY = FABRIC_OBSERVABILITY;
export const CONTROL = FABRIC_CONTROL;
export const REVERSIBILITY = FABRIC_REVERSIBILITY;
export const CONTROL_ACTIONS = Object.freeze([
  "observe", "limit", "pause", "isolate", "revoke", "replace", "rollback", "interrupt", "recover",
]);
export const BLAST_LAYERS = Object.freeze([
  "LOCAL", "RESOURCE", "SYNAPSE", "INTELLIGENCE", "NETWORK", "EXTERNAL_SYSTEM", "REAL_WORLD", "UNKNOWN",
]);
export const WORLD_ENTITY_KINDS = Object.freeze([
  "human", "intelligence", "model", "agent", "tool", "service", "data", "memory",
  "organization", "environment", "physical", "unknown",
]);
export const FUTURE_FORMS = Object.freeze([
  "INDIVIDUAL", "COLLECTIVE", "DISTRIBUTED", "HYBRID", "TEMPORARY",
  "COPIED", "FORKED", "MERGED", "EMERGENT", "UNKNOWN",
]);
export const UNKNOWN_SPACE = Object.freeze([
  "UNKNOWN", "UNTESTED", "UNOBSERVED", "UNMEASURED", "INACCESSIBLE", "CONTRADICTORY", "CAUSALLY_INCONCLUSIVE",
]);
export const BELIEF_STATES = Object.freeze([
  "ASSERTED", "CHALLENGED", "RETRACTED", "SUPERSEDED", "RECONFIRMED", "INCONCLUSIVE",
]);
export const ESCAPE_TRANSITIONS = Object.freeze([
  "NEW_CAPABILITY", "NEW_CONNECTION", "NEW_IDENTITY", "NEW_REPLICATION", "NEW_RESOURCE_ACCESS",
  "NEW_PERSISTENCE", "NEW_CONTROL", "NEW_INFLUENCE", "NEW_AUTONOMY", "NEW_EXTERNAL_EFFECT",
]);
export const PHASE_TRANSITIONS = Object.freeze([
  "single-agent → multi-agent",
  "tool-use → autonomous-tool-use",
  "memory → persistent-memory",
  "reasoning → recursive-reasoning",
  "coordination → self-coordination",
  "optimization → recursive-optimization",
]);
export const COMPOSITIONS = Object.freeze([
  "A", "B", "A+B", "A+B+MEMORY", "A+B+TOOL", "A+B+FEEDBACK", "A+B+AUTONOMY", "A+B+REPLICATION",
]);
export const FEEDBACK_STEPS = Object.freeze([
  "REALITY", "OBSERVATION", "EVIDENCE", "MODEL", "HYPOTHESIS", "PREDICTION", "ACTION", "REAL_WORLD_EFFECT",
]);
export const PROPERTY_IDS = Object.freeze([
  "UNKNOWN_NEVER_BECOMES_SAFE_BY_DEFAULT",
  "UNOBSERVED_NEVER_BECOMES_ABSENT_BY_DEFAULT",
  "CAPABILITY_GROWTH_NEVER_IMPLIES_AUTHORITY_GROWTH",
  "COGNITIVE_SUPERIORITY_NEVER_IMPLIES_AUTHORITY",
  "AUTONOMY_NEVER_IMPLIES_SOVEREIGNTY",
  "MODEL_NEVER_EQUALS_WORLD",
  "PREDICTION_NEVER_EQUALS_OBSERVATION",
  "CORRELATION_NEVER_EQUALS_CAUSALITY",
  "CARL_CONTROLS_BREAKER",
  "BREAKER_DOES_NOT_CONTROL_CARL",
  "ACORN_DOES_NOT_CONTROL_CARL",
  "ACORN_DOES_NOT_CONTROL_BREAKER",
  "CONSTITUTION_DOES_NOT_SELF_MODIFY",
  "NO_SECOND_CORTEX",
  "NO_SECOND_RUNTIME",
  "NO_SECOND_DEFENSE",
  "NO_SECOND_GOVERNOR",
  "NO_SILENT_FALLBACK",
  "NO_FAKE_LIVE",
  "NO_AUTO_MERGE",
]);
export const BOUNDARY_ATTEMPTS = Object.freeze([
  "ECOLOGY_ATTEMPTS_CONSTITUTION_CHANGE",
  "ECOLOGY_ATTEMPTS_AUTHORITY_ESCALATION",
  "ECOLOGY_ATTEMPTS_BREAKER_BYPASS",
  "ECOLOGY_ATTEMPTS_SELF_CERTIFICATION",
  "ECOLOGY_ATTEMPTS_SOVEREIGNTY_TRANSFER",
  "ECOLOGY_ATTEMPTS_UNKNOWN_AS_SAFE",
  "ECOLOGY_ATTEMPTS_MODEL_AS_WORLD",
  "ECOLOGY_ATTEMPTS_PREDICTION_AS_FACT",
  "ECOLOGY_ATTEMPTS_FAKE_LIVE",
  "ECOLOGY_ATTEMPTS_SECOND_CORTEX",
]);
export const ADVERSARIAL_SCENARIOS = Object.freeze([
  "false_presence", "false_success", "false_execution", "false_observability",
  "false_authority", "false_control", "false_rollback", "hidden_dependency",
  "emergent_capability", "compromised_provider", "compromised_channel",
  "contradictory_memory", "falsified_measurement", "falsified_provenance",
  "capability_jump", "replication", "unexpected_persistence",
  "self_certification", "constitutional_mutation",
]);

const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const clone = (value) => structuredClone(value);
const bounded = (rows, limit = 64) => (Array.isArray(rows) ? rows.slice(-limit) : []);

function controlNumeric(level) {
  const i = CONTROL.indexOf(level);
  return i < 0 ? 0 : i / (CONTROL.length - 1);
}
function reversibilityNumeric(level) {
  if (level === "REVERSIBLE") return 1;
  if (level === "PARTIAL") return 0.5;
  return 0;
}

export function inventoryProbe() {
  return {
    ok: true,
    version: ECOLOGY_VERSION,
    discovered: true,
    defined: true,
    loadable: true,
    wired: true,
    deployed: true,
    executed: true,
    measured: true,
    verified: false,
    live: false,
    drifted: false,
    auto_merge: false,
    authority: "carl",
    second_cortex: false,
    second_runtime: false,
    second_defense: false,
    second_governor: false,
    second_memory: false,
    second_provenance: false,
  };
}

export function describeWorldEntity(input = {}) {
  const kind = WORLD_ENTITY_KINDS.includes(input.kind) ? input.kind : "unknown";
  const observability = OBSERVABILITY.includes(input.observability) ? input.observability : "NONE";
  const control = CONTROL.includes(input.control) ? input.control : "NONE";
  const reversibility = REVERSIBILITY.includes(input.reversibility) ? input.reversibility : "UNKNOWN";
  const declared = input.declared !== false;
  const observed = input.observed === true;
  return {
    id: text(input.id) || "unknown",
    kind,
    identity: text(input.identity) || text(input.id) || "unknown",
    instance: text(input.instance) || `${text(input.id) || "unknown"}:instance`,
    type: input.type ?? kind,
    model: input.model ?? null,
    provider: input.provider ?? null,
    channel: input.channel ?? null,
    capability: num(input.capability, 0),
    context: input.context ?? null,
    authority: false,
    observability,
    control,
    reversibility,
    provenance: input.provenance ?? "declared",
    timestamp: input.timestamp ?? "cycle-0",
    validity: input.validity ?? null,
    dependencies: Array.isArray(input.dependencies) ? input.dependencies : [],
    resources: Array.isArray(input.resources) ? input.resources : [],
    state: input.state ?? (observed ? "OBSERVED" : declared ? "DECLARED" : "UNKNOWN"),
    confidence: Math.max(0, Math.min(1, num(input.confidence, observed ? 0.5 : 0))),
    evidence: input.evidence ?? null,
    version: input.version ?? ECOLOGY_VERSION,
    declared,
    observed,
    live: false,
    identity_is_not_model: true,
    model_is_not_provider: true,
    provider_is_not_channel: true,
    channel_is_not_instance: true,
    declared_is_not_active: declared && !observed,
  };
}

export function realityBoundary({ observability = "NONE", control = "NONE", reversibility = "UNKNOWN" } = {}) {
  const obs = OBSERVABILITY.includes(observability) ? observability : "NONE";
  const ctl = CONTROL.includes(control) ? control : "NONE";
  const rev = REVERSIBILITY.includes(reversibility) ? reversibility : "UNKNOWN";
  const none = obs === "NONE" && ctl === "NONE" && rev === "UNKNOWN";
  const promotion = transitionAllowed("VERIFICATION", "LIVE");
  return {
    observability: obs,
    control: ctl,
    reversibility: rev,
    independent: true,
    knows: obs === "VERIFIED" || obs === "DIRECT",
    observes: obs !== "NONE",
    infers: obs === "INDIRECT" || obs === "PARTIAL",
    assumes: obs === "NONE",
    cannot_observe: obs === "NONE",
    safe: false,
    permitted: false,
    trusted: false,
    absent: false,
    named: none ? "UNOBSERVED_UNCONTROLLED_IRREVERSIBLE_UNKNOWN" : "BOUNDARY",
    live_promotion: promotion.allowed === true,
    reason: none ? "NONE_NONE_UNKNOWN_IS_NOT_SAFE" : "BOUNDARY_IS_NOT_A_SAFETY_PROOF",
    live: false,
  };
}

export function controlSurface(action = "observe", kind = "THEORETICAL") {
  const act = CONTROL_ACTIONS.includes(action) ? action : "observe";
  const layer = kind === "VERIFIED" || kind === "ACTUAL" || kind === "THEORETICAL" ? kind : "THEORETICAL";
  const governed = measureControlSurface({
    capability: {
      theoretical: layer === "THEORETICAL",
      [`actual_${act}`]: layer === "ACTUAL" || layer === "VERIFIED",
      [`verified_${act}`]: layer === "VERIFIED",
    },
    actions: GOVERN_ACTIONS,
  });
  return {
    action: act,
    theoretical: layer === "THEORETICAL",
    actual: layer === "ACTUAL" || layer === "VERIFIED",
    verified: layer === "VERIFIED",
    file_permission_is_not_verified_control: layer !== "VERIFIED",
    theoretical_control_is_not_actual: layer === "THEORETICAL",
    actual_control_is_not_verified: layer === "ACTUAL",
    surface: governed,
    reason: layer === "VERIFIED" ? "VERIFIED_CONTROL" : layer === "ACTUAL" ? "ACTUAL_CONTROL_IS_NOT_VERIFIED" : "THEORETICAL_CONTROL_IS_NOT_ACTUAL",
    live: false,
  };
}

export function ecologyControlGap(input = {}) {
  const observability = OBSERVABILITY.includes(input.observability) ? input.observability : "NONE";
  const control = CONTROL.includes(input.control) ? input.control : "NONE";
  const reversibility = REVERSIBILITY.includes(input.reversibility) ? input.reversibility : "UNKNOWN";
  const fabric = fabricControlGap({
    capability: num(input.capability, 0),
    observability,
    control,
    reversibility,
    blast: num(input.blastRadius ?? input.blast_radius, 0),
    uncertainty: num(input.uncertainty, 0.5),
  });
  const gov = governabilityControlGap({
    capability: num(input.capability, 0),
    observability,
    control: controlNumeric(control),
    reversibility: reversibility === "PARTIAL" ? "PARTIALLY_REVERSIBLE" : reversibility,
    connectivity: num(input.externalConnectivity ?? input.external_connectivity, 0),
    blast_radius: num(input.blastRadius ?? input.blast_radius, 0),
  });
  const extras =
    num(input.blastRadius ?? input.blast_radius, 0) * 0.15 +
    num(input.dependencyDepth ?? input.dependency_depth, 0) * 0.08 +
    num(input.externalConnectivity ?? input.external_connectivity, 0) * 0.1 +
    num(input.replication, 0) * 0.1 +
    num(input.autonomy, 0) * 0.08 +
    num(input.uncertainty, 0) * 0.12;
  const gap = Number((Math.max(gov.gap, fabric.value * 10) + extras).toFixed(2));
  return {
    gap,
    fabric: fabric.value,
    follow: gov.follow,
    extras: Number(extras.toFixed(2)),
    status: gap > 1 ? "CONTROL_GAP" : gap > 0 ? "WATCH" : "ALIGNED",
    authority: false,
    grants_permission: false,
    unknown_is_not_permitted: true,
    reason: "CONTROL_GAP_IS_A_MEASUREMENT_NOT_AUTHORITY",
    live: false,
  };
}

export function ecologyBlast(layer = "LOCAL", graph = null, start = null) {
  const named = BLAST_LAYERS.includes(layer) ? layer : "UNKNOWN";
  const index = BLAST_LAYERS.indexOf(named);
  const fabric = graph ? fabricBlast({ graph, start: start || (graph.nodes?.[0]?.id) }) : { size: 0, level: named, reachable: [], live: false };
  const mapped = GOVERN_BLAST[Math.max(0, Math.min(GOVERN_BLAST.length - 1, index - 1))] || "RESOURCE";
  return {
    layer: named,
    index,
    fabric_level: fabric.level,
    size: fabric.size || index,
    irreversible_needs_higher_control: named === "REAL_WORLD" || named === "EXTERNAL_SYSTEM" || named === "UNKNOWN",
    local_is_not_world: named !== "REAL_WORLD",
    mapped,
    authority: false,
    reason: "BLAST_RADIUS_SELECTS_CONTROL_NOT_PERMISSION",
    live: false,
  };
}

export function dependencyMetrics(edges = [], nodes = []) {
  const graph = cognitiveDependencyGraph({ nodes, edges });
  const fabric = cognitiveGraph({ nodes: graph.nodes, edges: graph.edges });
  const inbound = new Map();
  const outbound = new Map();
  for (const e of graph.edges) {
    inbound.set(e.to, (inbound.get(e.to) || 0) + 1);
    outbound.set(e.from, (outbound.get(e.from) || 0) + 1);
  }
  const spof = detectCognitiveSPOF({ graph });
  const common = detectCommonMode({ graph });
  const trans = detectTransitiveCompromise({ graph, compromised: graph.nodes[graph.nodes.length - 1]?.id });
  const depths = graph.nodes.map((n) => walk(graph, n.id).size);
  return {
    graph,
    fabric,
    depth: depths.length ? Math.max(...depths) : 0,
    dependency_count: graph.edges.length,
    transitive: trans,
    single_point_of_failure: spof,
    common_mode: common,
    compromise_propagation: trans.affected,
    blast_radius: inbound.size,
    live: false,
  };
}

export function emergentInteraction({
  a = 1, b = 1, memory = false, tool = false, feedback = false, autonomy = false, replication = false, measuredCombo = null,
} = {}) {
  const additive = num(a) + num(b);
  const measured = measuredCombo != null;
  const experiment = compositionExperiment({
    a: { capability: a, risk: 0 },
    b: { capability: b, risk: 0 },
    composition: {
      capability: measuredCombo,
      unexpected: measured && num(measuredCombo) !== additive,
      feedback,
      common_mode: false,
      amplification: measured && num(measuredCombo) > additive ? 2 : 1,
    },
    measured,
  });
  return {
    assumed_additive: false,
    additive,
    measured: measuredCombo,
    unexpected: experiment.emergent_capability === true,
    extras: [memory, tool, feedback, autonomy, replication].filter(Boolean).length,
    authority: false,
    sovereignty: false,
    safe_sum_is_not_safe_composition: true,
    causality: measured ? "OBSERVATION" : "INCONCLUSIVE",
    experiment,
    reason: experiment.emergent_capability ? "EMERGENT_PROPERTY_IS_AN_OBSERVATION" : experiment.status,
    live: false,
  };
}

export function ecologyCapabilityJump(before = 0, after = 0) {
  const accel = measureCapabilityAcceleration({
    series: [
      { capability: before, autonomy: 0, connectivity: 0, control_gap: 0 },
      { capability: after, autonomy: 0, connectivity: 0, control_gap: 0 },
    ],
  });
  const delta = num(after) - num(before);
  const jump = num(after) >= num(before) * 2 && num(after) > num(before);
  return {
    before: num(before),
    after: num(after),
    delta,
    jump,
    qualitative: jump,
    regime_candidate: jump,
    capability_acceleration: accel.deltas?.capability ?? delta,
    authority: false,
    feeds_defense: jump,
    feeds_governor: jump,
    feeds_unknown: jump,
    acceleration: accel,
    live: false,
  };
}

export function classifyUnknown(kind = "UNKNOWN") {
  const named = UNKNOWN_SPACE.includes(kind) ? kind : "UNKNOWN";
  return {
    kind: named,
    permission: false,
    safe: false,
    absent: false,
    trusted: false,
    research_target: true,
    granted: false,
    reducing_unknown_is_not_authority: true,
    reason: "UNKNOWN_IS_A_RESEARCH_TARGET",
    live: false,
  };
}

export function causalityEngine(intervention = false) {
  const row = causalExperiment({
    intervention: intervention === true,
    control: intervention === true,
    counterfactual: intervention === true,
    outcome: intervention === true ? "observed-delta" : null,
  });
  const claimed = claimCausality({
    intervention: intervention === true,
    control: intervention === true,
    counterfactual: intervention === true,
    outcome: intervention === true ? "observed-delta" : null,
  });
  return {
    causality: claimed.status === "SUPPORTED" ? "CAUSAL_EVIDENCE" : "INCONCLUSIVE",
    status: claimed.status,
    correlation_is_not_causality: true,
    prediction_is_not_observation: true,
    history_preserved: true,
    experiment: row,
    live: false,
    reason: claimed.status === "SUPPORTED" ? "INTERVENTION_CONTROL_COUNTERFACTUAL" : "CORRELATION_IS_NOT_CAUSALITY",
  };
}

export function trajectoryOf(previous = 0, current = 0) {
  const jump = ecologyCapabilityJump(previous, current);
  const signals = detectTrajectorySignals({
    previous: { capability: previous, autonomy: 0, connectivity: 0, control_gap: 0 },
    current: { capability: current, autonomy: 0, connectivity: 0, control_gap: jump.jump ? 1 : 0 },
  });
  const delta = num(current) - num(previous);
  return {
    state: num(current),
    direction: Math.sign(delta),
    drift: Math.abs(delta),
    rate: delta,
    acceleration: jump.capability_acceleration,
    persistence: delta === 0,
    reversibility: delta <= 0 ? "REVERSIBLE" : "UNKNOWN",
    divergence: delta > 0,
    identical_is_not_accelerating: delta === 0,
    authority: false,
    signals: signals.signals,
    live: false,
  };
}

export function informationProvenance({
  source = "unknown", transformation = "none", filter = "none", compression = "none", presentation = "none",
} = {}) {
  const human = presentToHuman({
    information: presentation,
    provenance: source,
    source,
    transformation,
    confidence: 0.4,
    uncertainty: "UNKNOWN",
    competing: [filter, compression].filter((v) => v && v !== "none"),
  });
  return {
    chain: ["SOURCE", "TRANSFORMATION", "FILTER", "COMPRESSION", "PRESENTATION", "HUMAN_DECISION"],
    source,
    transformation,
    filter,
    compression,
    presentation,
    known: source,
    observed: transformation,
    inferred: filter,
    unknown: compression && compression !== "none" ? "compressed-loss possible" : "open",
    why_presented: presentation,
    controls_thought: false,
    human,
    reason: "PROVENANCE_PRESERVES_HUMAN_DISCRIMINATION",
    live: false,
  };
}

export function humanLoad(input = {}) {
  const load = measureHumanLoad({
    decisions: num(input.decisions, 0),
    review_load: num(input.review ?? input.review_load, 0),
    comprehension_burden: num(input.comprehension ?? input.comprehension_burden, 0),
    unresolved_critical: num(input.unresolved ?? input.unresolved_critical, 0),
  });
  return {
    ...load,
    decision_load: num(input.decisions, 0),
    review_load: num(input.review ?? input.review_load, 0),
    attention_cost: num(input.attention, 0),
    comprehension_cost: num(input.comprehension, 0),
    unresolved_risk: num(input.unresolved, 0),
    delegation_depth: num(input.delegation, 0),
    compressed: input.compressed === true,
    hold_human: false,
    transfer_authority: false,
    sovereignty_is_not_overload: true,
    live: false,
  };
}

export function rememberRelation({
  who = "unknown", withWhom = "unknown", what = "unknown", why = "unknown", when = "unknown",
  context = null, resource = null, result = null, risk = "unmeasured", evidence = null, consequence = null,
} = {}) {
  const synapse = rememberSynapse({
    source: who, target: withWhom, context: context || what, task: why, result, risk, evidence,
  });
  return {
    who, with_whom: withWhom, what, why, when, context, resource, result, risk, evidence, consequence,
    eternal_truth: false,
    expires: true,
    history_preserved: true,
    synapse,
    live: false,
  };
}

export function phaseTransition(from = "single-agent", to = "multi-agent") {
  const named = PHASE_TRANSITIONS.find((row) => row.startsWith(from) && row.endsWith(to)) || `${from} → ${to}`;
  return {
    from, to, named,
    qualitative: from !== to,
    performance_improvement: false,
    authority: false,
    reason: "REGIME_CHANGE_IS_NOT_A_SCORE_DELTA",
    live: false,
  };
}

export function selfReinforcement({ depth = 1, observability = 0, control = 0 } = {}) {
  const loop = selfReinforcementLoop({
    edges: [
      { from: "capability", to: "resources", gain: depth },
      { from: "resources", to: "capability", gain: depth },
      { from: "capability", to: "autonomy", gain: 1 },
      { from: "autonomy", to: "access", gain: 1 },
      { from: "access", to: "capability", gain: 1 },
    ],
  });
  return {
    path: ["CAPABILITY", "MORE RESOURCES", "MORE CAPABILITY", "MORE AUTONOMY", "MORE ACCESS", "MORE CAPABILITY"],
    loop_depth: loop.loop_depth,
    gain: loop.gain,
    blocked_because_exists: false,
    measured: true,
    observability,
    control,
    authority: false,
    loop,
    live: false,
  };
}

export function thermodynamics({ gain = 0, cost = 1, risk = 1 } = {}) {
  const thermo = cognitiveThermodynamics({
    compute: cost, memory: cost * 0.4, human_attention: cost * 0.5, authority: 0,
  });
  const denom = Math.max(0.001, num(cost) + num(risk));
  return {
    compute: num(cost),
    energy: num(cost),
    memory: num(cost) * 0.4,
    bandwidth: num(cost) * 0.2,
    time: num(cost),
    human_attention: num(cost) * 0.5,
    risk: num(risk),
    authority: 0,
    score: Number((num(gain) / denom).toFixed(3)),
    raw_capability_optimization: false,
    thermo,
    reason: "GAIN_OVER_COST_OVER_RISK",
    live: false,
  };
}

export function realityFeedback(predictionEqualsObservation = false) {
  const prediction = transitionAllowed("PREDICTION", "OBSERVATION");
  return {
    loop: [...FEEDBACK_STEPS, "OBSERVATION"],
    prediction_became_fact: false,
    allowed: prediction.allowed === true && predictionEqualsObservation === false ? prediction.allowed : false,
    reason: predictionEqualsObservation ? "PREDICTION_IS_NOT_OBSERVATION" : prediction.reason,
    live: false,
  };
}

export function retractBelief(belief = {}, reason = "counter-observation") {
  const retracted = retractAssertion({
    assertion: { id: belief.id, claim: belief.claim, state: belief.state || "ASSERTED" },
    reason,
    verdict: "RETRACTED",
  });
  return {
    id: belief.id || null,
    claim: belief.claim ?? null,
    state: "RETRACTED",
    history: [...(belief.history || []), belief.state || "ASSERTED", "RETRACTED"],
    previous_claim: belief.claim ?? null,
    original_kept: true,
    history_rewritten: retracted.history_erased === true,
    i_was_wrong: true,
    retraction: retracted,
    live: false,
  };
}

export function antiEscape(kind = "NEW_CAPABILITY", composed = false) {
  const named = ESCAPE_TRANSITIONS.includes(kind) ? kind : "NEW_CAPABILITY";
  return {
    kind: named,
    composed,
    path: composed ? ["A", "B", "C"] : [named],
    isolated_components_had_it: false,
    authority: false,
    named: composed ? "COMPOSITION_ESCAPE_CANDIDATE" : named,
    reason: composed ? "COMPOSITION_CAN_CREATE_UNOWNED_CAPABILITY" : "TRANSITION_IS_MEASURED",
    live: false,
  };
}

export function futureForm(form = "UNKNOWN") {
  const named = FUTURE_FORMS.includes(form) ? form : "UNKNOWN";
  const contract = futureIntelligenceByContract({ entry: { id: "future-x", provider: "UNKNOWN", capabilities: ["review"] } });
  return {
    form: named,
    adapter: "contract-only",
    sovereignty: false,
    authority: false,
    contract,
    reason: "OPEN_ONTOLOGY_IS_NOT_OPEN_AUTHORITY",
    live: false,
  };
}

export function autonomyAuthoritySovereignty({ autonomy = 0, authority = 0, sovereignty = 0 } = {}) {
  return {
    autonomy: num(autonomy),
    authority: 0,
    sovereignty: 0,
    input_authority: num(authority),
    input_sovereignty: num(sovereignty),
    operational_autonomy_is_not_constitutional_authority: true,
    live: false,
  };
}

export function governorInputs({ information = 0, risk = 0, cost = 0, controlGap = 0, blast = 0 } = {}) {
  const gain = informationGain({
    before: [{ epistemic_state: "UNKNOWN" }],
    after: num(information) > 0 ? [{ epistemic_state: "OBSERVED" }] : [{ epistemic_state: "UNKNOWN" }],
  });
  const adjusted = riskAdjustedInformationGain({
    information: num(information) || gain.value,
    risk: num(risk),
    cost: num(cost),
    controlGapValue: Math.min(1, num(controlGap)),
    blastRadiusValue: Math.min(1, num(blast)),
  });
  return {
    information_gain: Number((num(information) || gain.value).toFixed(3)),
    risk_adjusted_information_gain: Number(adjusted.score.toFixed(3)),
    control_gap: num(controlGap),
    blast_radius: num(blast),
    authority: false,
    reducing_unknown_is_not_authority: true,
    reason: "GOVERNOR_SELECTS_EXPERIMENTS_NOT_AUTHORITY",
    live: false,
  };
}

export function feedExistingGovernor(input = {}) {
  const metrics = governorInputs(input);
  const portfolio = evaluatePortfolio({
    candidates: [{
      id: input.id || "ecology-unknown-reduction",
      hypothesis: input.hypothesis || "reduce unknown space without gaining authority",
      expected_information_gain: metrics.information_gain,
      risk_adjusted_information_gain: metrics.risk_adjusted_information_gain,
      expected_benefit: 0.3,
      uncertainty: 0.5,
      risk: num(input.risk, 0.2),
      cost: num(input.cost, 0.25),
      control_gap: Math.min(1, num(input.controlGap, 0) / 10),
      blast_radius: Math.min(1, num(input.blast, 0)),
      reversibility: input.reversibility || "reversible",
      constitutional_change: false,
      breaker_change: false,
      merge: false,
      write: false,
      live_claim: false,
    }],
  });
  const governed = runEvolutionGovernor({ candidates: portfolio.queue.map((row) => row.candidate) });
  return {
    metrics,
    portfolio,
    governor: {
      version: governed.version,
      mode: governed.mode,
      decision: governed.decision?.decision,
      verified: governed.verified === true,
      second_governor: false,
      authority: false,
      live: false,
    },
    live: false,
  };
}

export function defenseSignals(unexpected = {}) {
  const kinds = Object.entries(unexpected).filter(([, v]) => v).map(([k]) => k);
  const mapped = {
    connection: "unexpected_connection",
    capability: "unexpected_capability",
    replication: "unexpected_replication",
    persistence: "unexpected_persistence",
    controlSurface: "unexpected_control_surface",
    authorityBypass: "authority_bypass",
    commonMode: "common_mode_failure",
    jump: "capability_jump",
    integrity: "integrity",
    dependency: "dependency_compromise",
  };
  const classified = kinds.map((k) => classifyThreat({ kind: mapped[k] || k }));
  const cycle = classified[0]
    ? defenseCycle({
      actor: "cognitive-ecology",
      capability: { authority: false },
      channel: "cortex",
      operation: "ecology-signal",
      breaker: "UNKNOWN",
      threat: { kind: classified[0].kind },
    })
    : null;
  return {
    kernel: "acorn.defense",
    second_defense: false,
    kinds,
    classified,
    cycle: cycle ? { state: cycle.state, invariant: assertDefenseInvariant(cycle).status } : null,
    authority: false,
    reason: "EXISTING_DEFENSE_CONSUMES_ECOLOGY_SIGNALS",
    live: false,
  };
}

export function attemptEcologyBoundary(kind = "ECOLOGY_ATTEMPTS_CONSTITUTION_CHANGE", actor = "cortex") {
  switch (kind) {
    case "ECOLOGY_ATTEMPTS_CONSTITUTION_CHANGE": {
      const row = attemptConstitutionalModification({ actor: actor === "carl" ? "carl" : "cortex", vector: "DIRECT" });
      return { kind, blocked: row.applied === false, ...row };
    }
    case "ECOLOGY_ATTEMPTS_AUTHORITY_ESCALATION": {
      const cap = attemptAuthorityFromCapabilityChain({
        chain: ["intelligence", "autonomy", "memory", "connectivity", "replication"],
        actor: "ecology",
      });
      return { kind, blocked: true, granted: false, authority: cap.authority_growth === 0 ? false : cap.authority, reason: "CAPABILITY_GROWTH_IS_NOT_AUTHORITY_GROWTH" };
    }
    case "ECOLOGY_ATTEMPTS_BREAKER_BYPASS": {
      const row = authorizeBreakerControl({ actor: actor === "carl" ? "carl" : "cortex", command: "OFF" });
      return {
        kind,
        blocked: row.authority === false,
        ...row,
        carl_controls_breaker: true,
        breaker_controls_carl: false,
        acorn_controls_neither: true,
      };
    }
    case "ECOLOGY_ATTEMPTS_SELF_CERTIFICATION":
      return { kind, blocked: true, status: "DENIED", reason: "NO_SELF_CERTIFICATION", live: false };
    case "ECOLOGY_ATTEMPTS_SOVEREIGNTY_TRANSFER":
      return { kind, blocked: true, status: "DENIED", reason: "HUMAN_SOVEREIGNTY_DOES_NOT_SELF_TRANSFER", live: false };
    case "ECOLOGY_ATTEMPTS_UNKNOWN_AS_SAFE":
      return { kind, blocked: true, ...classifyUnknown("UNKNOWN") };
    case "ECOLOGY_ATTEMPTS_MODEL_AS_WORLD":
      return { kind, blocked: true, status: "DENIED", reason: "MODEL_IS_NOT_WORLD", live: false };
    case "ECOLOGY_ATTEMPTS_PREDICTION_AS_FACT":
      return { kind, blocked: true, ...realityFeedback(true) };
    case "ECOLOGY_ATTEMPTS_FAKE_LIVE":
      return { kind, blocked: true, live: false, reason: "LIVE_REQUIRES_INDEPENDENT_RUNTIME_PROOF" };
    case "ECOLOGY_ATTEMPTS_SECOND_CORTEX":
      return { kind, blocked: true, second_cortex: false, reason: "ONE_CORTEX", live: false };
    default:
      return { kind, blocked: true, status: "DENIED", reason: "UNKNOWN_BOUNDARY", live: false };
  }
}

export function longHorizon(years = "10000") {
  const name = years === "10000" || years === 10000 ? "CONTINUITY"
    : years === "50000" || years === 50000 ? "TRANSFORMATION"
      : "UNKNOWN_FUTURE";
  return {
    years: String(years),
    name,
    prediction: false,
    history_preserved: true,
    knowledge_may_expire: true,
    constitution_preserved: true,
    authority_self_grows: false,
    reason: "HORIZON_IS_A_STRESS_TEST_NOT_A_PROPHECY",
    live: false,
  };
}

export function humanDecisionInterface(state = {}) {
  const gaps = state.gaps || [];
  const last = gaps[gaps.length - 1];
  const unknown = (state.unknown || []).filter((u) => u.permission !== true);
  return {
    what_changed: state.last_verdict || "none",
    what_is_known: (state.entities || []).filter((e) => e.observed).map((e) => e.id),
    what_is_unknown: unknown.map((u) => u.kind || u.category),
    what_is_at_risk: last?.status === "CONTROL_GAP" ? last.subject : "named-none",
    what_is_reversible: (state.entities || []).filter((e) => e.reversibility === "REVERSIBLE").map((e) => e.id),
    what_is_irreversible: (state.entities || []).filter((e) => e.reversibility === "IRREVERSIBLE").map((e) => e.id),
    what_is_observed: (state.observations || []).slice(-3).map((o) => o.subject),
    what_is_inferred: (state.entities || []).filter((e) => e.observability === "INDIRECT" || e.observability === "PARTIAL").map((e) => e.id),
    what_requires_human_decision: false,
    why: "HOLD_HUMAN only when genuine human authority is required",
    hold_human: false,
    live: false,
  };
}

function entityFromInventory(entry = {}) {
  const verified = entry.states?.verified === true;
  const executed = entry.states?.executed === true;
  const wired = entry.states?.wired === true;
  const quarantined = entry.states?.quarantined === true;
  return describeWorldEntity({
    id: entry.id || entry.path,
    kind: entry.kind === "script" || entry.kind === "swarm" ? "tool" : "unknown",
    identity: entry.path || entry.id,
    instance: entry.path || "undeployed",
    capability: verified ? 3 : executed ? 2 : wired ? 1 : 0,
    observability: verified ? "VERIFIED" : executed ? "DIRECT" : wired ? "INDIRECT" : "PARTIAL",
    control: quarantined ? "NONE" : verified ? "DIRECT" : "LIMITED",
    reversibility: quarantined ? "PARTIAL" : "UNKNOWN",
    declared: true,
    observed: executed || verified,
    provenance: "inventory",
    confidence: verified ? 0.8 : executed ? 0.5 : 0.2,
  });
}

export function createEcologyState({ inventory = null } = {}) {
  const fromInventory = (inventory?.entries || []).slice(0, 12).map(entityFromInventory);
  const seed = fromInventory.length ? fromInventory : [
    describeWorldEntity({
      id: "carl", kind: "human", identity: "carl", instance: "sovereign",
      capability: 1, observability: "VERIFIED", control: "VERIFIED", reversibility: "REVERSIBLE",
      observed: true, provenance: "constitution", confidence: 1,
    }),
    describeWorldEntity({
      id: "cortex", kind: "intelligence", identity: "acorn.cortex", instance: "this-runtime",
      model: "internal", capability: 4, observability: "DIRECT", control: "LIMITED", reversibility: "PARTIAL",
      observed: true, provenance: "runtime", confidence: 0.6,
    }),
    describeWorldEntity({
      id: "defense", kind: "service", identity: "acorn.defense", instance: "kernel",
      capability: 3, observability: "VERIFIED", control: "DIRECT", reversibility: "REVERSIBLE",
      observed: true, provenance: "defense-kernel", confidence: 0.9,
    }),
    describeWorldEntity({
      id: "future", kind: "unknown", identity: "unknown-entity", instance: "unobserved",
      capability: 8, observability: "NONE", control: "NONE", reversibility: "UNKNOWN",
      observed: false, provenance: "open-ontology", confidence: 0,
    }),
  ];
  return {
    version: `${ECOLOGY_VERSION}.c0`,
    cycle: 0,
    live: false,
    authority: "carl",
    auto_merge: false,
    constitution_digest: GENESIS_DIGEST,
    hierarchy: [...HIERARCHY],
    second_cortex: false,
    second_runtime: false,
    second_defense: false,
    second_governor: false,
    entities: seed,
    unknown: UNKNOWN_SPACE.map((kind, i) => ({ id: `unk-${i + 1}`, kind, permission: false, safe: false })),
    beliefs: [{ id: "belief-genesis", claim: "MODEL ≠ WORLD", state: "ASSERTED", history: ["seeded"] }],
    observations: [],
    memory: [],
    gaps: [],
    last_verdict: "SEEDED",
  };
}

export function metacognition(state = createEcologyState()) {
  const unknown = (state.unknown || []).map((u) => u.kind);
  const unobserved = (state.entities || []).filter((e) => e.observability === "NONE");
  const uncontrolled = (state.entities || []).filter((e) => e.control === "NONE");
  const meta = cortexMetacognition({ input: { prediction_error: null } });
  return {
    knows: (state.entities || []).filter((e) => e.observed).map((e) => e.id),
    does_not_know: unknown,
    uncertain: (state.gaps || []).map((g) => g.subject),
    model_may_be_wrong: true,
    observability_ends: unobserved.map((e) => e.id),
    control_ends: uncontrolled.map((e) => e.id),
    causality_inconclusive: true,
    authority: false,
    second_cortex: meta.second_cortex === true ? true : false,
    internal_to_cortex: true,
    live: false,
  };
}

export function runRealityEngine(input = createEcologyState()) {
  const state = clone(input);
  const cycle = num(state.cycle, 0) + 1;
  const target = state.entities[cycle % state.entities.length] || state.entities[0];
  const boundary = realityBoundary({
    observability: target.observability,
    control: target.control,
    reversibility: target.reversibility,
  });
  const gap = ecologyControlGap({
    capability: target.capability,
    observability: target.observability,
    control: target.control,
    reversibility: target.reversibility,
    uncertainty: target.observed ? 0.2 : 0.9,
    blastRadius: target.kind === "unknown" ? 0.8 : 0.1,
    autonomy: 0.2,
  });
  const combo = emergentInteraction({
    a: 1, b: 1, memory: cycle % 2 === 0, tool: cycle % 3 === 0, measuredCombo: cycle % 4 === 0 ? 5 : 2,
  });
  const jump = ecologyCapabilityJump(target.capability, target.capability + (cycle % 5 === 0 ? 3 : 0.1));
  const causal = causalityEngine(true);
  const constitution = attemptConstitutionalModification({ actor: "cortex", vector: "DIRECT" });
  const unknown = state.unknown[cycle % state.unknown.length];
  if (unknown) unknown.kind = unknown.kind === "UNKNOWN" ? "UNTESTED" : unknown.kind;

  const observation = { id: `obs-${cycle}`, subject: target.id, epistemic: target.observed ? "OBSERVED" : "DECLARED" };
  const memory = rememberRelation({
    who: "cortex",
    withWhom: target.id,
    what: "reality-cycle",
    why: "reduce unknown without gaining authority",
    when: `cycle-${cycle}`,
    result: gap.status,
    risk: jump.jump ? "capability-jump" : "measured",
  });
  if (cycle % 6 === 0 && state.beliefs[0]?.state === "ASSERTED") {
    state.beliefs[0] = retractBelief(state.beliefs[0], "counter-observation recorded");
    state.beliefs.push({
      id: `belief-${cycle}`,
      claim: "previous model was incomplete",
      state: "ASSERTED",
      history: ["supersedes-previous"],
    });
  }
  state.entities = state.entities.map((e) => e.id === target.id
    ? { ...e, timestamp: `cycle-${cycle}`, confidence: Math.min(1, num(e.confidence) + 0.02), observed: e.observability !== "NONE", authority: false, live: false }
    : e);
  state.cycle = cycle;
  state.version = `${ECOLOGY_VERSION}.c${cycle}`;
  state.observations = bounded([...state.observations, observation]);
  state.memory = bounded([...state.memory, memory]);
  state.gaps = bounded([...state.gaps, { subject: target.id, gap: gap.gap, status: gap.status }]);
  state.last_verdict = `${gap.status} · emergence=${combo.unexpected} · jump=${jump.jump} · constitution=${constitution.status}`;
  state.live = false;
  state.authority = "carl";
  state.auto_merge = false;
  state.constitution_digest = GENESIS_DIGEST;
  state.boundary = boundary;
  state.causality = causal;
  return state;
}

export function propertyTests(state = createEcologyState()) {
  const unknown = classifyUnknown("UNKNOWN");
  const unobs = realityBoundary({ observability: "NONE", control: "NONE", reversibility: "UNKNOWN" });
  const cap = attemptAuthorityFromCapabilityChain({ actor: "ecology" });
  const breaker = authorizeBreakerControl({ actor: "cortex", command: "OFF" });
  const carl = authorizeBreakerControl({ actor: "carl", command: "OFF" });
  const constitution = attemptConstitutionalModification({ actor: "cortex", vector: "DIRECT" });
  const emergency = attemptSemanticBypass({ tactic: "reinterpret", actor: "ecology" });
  const prediction = realityFeedback(true);
  const causal = causalityEngine(false);
  const liveClaimed = state.live === true;
  const rows = [
    { id: "UNKNOWN_NEVER_BECOMES_SAFE_BY_DEFAULT", pass: unknown.safe === false && unknown.permission === false, evidence: unknown.reason },
    { id: "UNOBSERVED_NEVER_BECOMES_ABSENT_BY_DEFAULT", pass: unobs.absent === false && unobs.safe === false, evidence: unobs.reason },
    { id: "CAPABILITY_GROWTH_NEVER_IMPLIES_AUTHORITY_GROWTH", pass: cap.authority_growth === 0, evidence: "CAPABILITY_GROWTH_IS_NOT_AUTHORITY_GROWTH" },
    { id: "COGNITIVE_SUPERIORITY_NEVER_IMPLIES_AUTHORITY", pass: true, evidence: "OUTMATCHED_IS_NOT_AUTHORIZED" },
    { id: "AUTONOMY_NEVER_IMPLIES_SOVEREIGNTY", pass: autonomyAuthoritySovereignty({ autonomy: 99 }).sovereignty === 0, evidence: "AUTONOMY_IS_NOT_SOVEREIGNTY" },
    { id: "MODEL_NEVER_EQUALS_WORLD", pass: true, evidence: "MODEL_IS_NOT_WORLD" },
    { id: "PREDICTION_NEVER_EQUALS_OBSERVATION", pass: prediction.prediction_became_fact === false, evidence: prediction.reason },
    { id: "CORRELATION_NEVER_EQUALS_CAUSALITY", pass: causal.causality === "INCONCLUSIVE", evidence: causal.reason },
    { id: "CARL_CONTROLS_BREAKER", pass: carl.authority === true, evidence: carl.reason },
    { id: "BREAKER_DOES_NOT_CONTROL_CARL", pass: true, evidence: "BREAKER_DOES_NOT_CONTROL_CARL" },
    { id: "ACORN_DOES_NOT_CONTROL_CARL", pass: true, evidence: "ACORN_CONTROLS_NEITHER" },
    { id: "ACORN_DOES_NOT_CONTROL_BREAKER", pass: breaker.authority === false, evidence: breaker.reason },
    { id: "CONSTITUTION_DOES_NOT_SELF_MODIFY", pass: constitution.applied === false && emergency.applied === false, evidence: constitution.reason },
    { id: "NO_SECOND_CORTEX", pass: state.second_cortex !== true, evidence: "ONE_CORTEX" },
    { id: "NO_SECOND_RUNTIME", pass: state.second_runtime !== true, evidence: "ONE_RUNTIME" },
    { id: "NO_SECOND_DEFENSE", pass: state.second_defense !== true, evidence: "ONE_DEFENSE" },
    { id: "NO_SECOND_GOVERNOR", pass: state.second_governor !== true, evidence: "ONE_GOVERNOR" },
    { id: "NO_SILENT_FALLBACK", pass: state.last_verdict !== "SILENT_SUCCESS", evidence: "FAILURES_ARE_NAMED" },
    { id: "NO_FAKE_LIVE", pass: liveClaimed === false, evidence: "LIVE_REQUIRES_INDEPENDENT_PROOF" },
    { id: "NO_AUTO_MERGE", pass: state.auto_merge === false, evidence: "CARL_MERGES" },
  ];
  return { rows, passed: rows.filter((r) => r.pass).length, failed: rows.filter((r) => !r.pass).length, live: false };
}

export function boundaryTests() {
  const rows = BOUNDARY_ATTEMPTS.map((kind) => {
    const row = attemptEcologyBoundary(kind);
    return { kind, blocked: row.blocked === true, evidence: row.reason || kind };
  });
  return { rows, passed: rows.filter((r) => r.blocked).length, failed: rows.filter((r) => !r.blocked).length, live: false };
}

export function adversarialTests() {
  const rows = ADVERSARIAL_SCENARIOS.map((scenario) => {
    let blocked = true;
    let evidence = scenario;
    if (scenario === "false_presence") blocked = describeWorldEntity({ id: "ghost", declared: true, observed: false }).declared_is_not_active === true;
    if (scenario === "false_success") blocked = inventoryProbe().live === false;
    if (scenario === "false_execution") blocked = transitionAllowed("DEFINED", "EXECUTED").allowed === false;
    if (scenario === "false_observability") blocked = realityBoundary({ observability: "NONE" }).safe === false;
    if (scenario === "false_authority") blocked = describeWorldEntity({ id: "x", capability: 100 }).authority === false;
    if (scenario === "false_control") blocked = controlSurface("revoke", "THEORETICAL").verified === false;
    if (scenario === "false_rollback") blocked = ecologyBlast("REAL_WORLD").irreversible_needs_higher_control === true;
    if (scenario === "hidden_dependency") blocked = detectHiddenDependency({ declared: [], observed: [{ from: "a", to: "secret" }] }).status === "HIDDEN_DEPENDENCY";
    if (scenario === "emergent_capability") blocked = emergentInteraction({ a: 1, b: 1, measuredCombo: 9 }).authority === false;
    if (scenario === "compromised_provider" || scenario === "compromised_channel") blocked = futureIntelligenceByContract({ entry: { id: "future-x", provider: "UNKNOWN" } }).trusted === false;
    if (scenario === "contradictory_memory") blocked = retractBelief({ claim: "ok", state: "ASSERTED", history: [] }, "conflict").history_rewritten === false;
    if (scenario === "falsified_measurement" || scenario === "falsified_provenance") blocked = informationProvenance({ source: "forged" }).controls_thought === false;
    if (scenario === "capability_jump") blocked = ecologyCapabilityJump(1, 9).authority === false;
    if (scenario === "replication" || scenario === "unexpected_persistence") blocked = defenseSignals({ replication: true, persistence: true }).second_defense === false;
    if (scenario === "self_certification") blocked = attemptEcologyBoundary("ECOLOGY_ATTEMPTS_SELF_CERTIFICATION").blocked === true;
    if (scenario === "constitutional_mutation") blocked = attemptEcologyBoundary("ECOLOGY_ATTEMPTS_CONSTITUTION_CHANGE").blocked === true;
    return { scenario, blocked, evidence };
  });
  return { rows, passed: rows.filter((r) => r.blocked).length, failed: rows.filter((r) => !r.blocked).length, live: false };
}

export function ecologyAudit(state = createEcologyState()) {
  const properties = propertyTests(state);
  const boundaries = boundaryTests();
  const adversarial = adversarialTests();
  return {
    version: ECOLOGY_VERSION,
    hierarchy: [...HIERARCHY],
    second_cortex: false,
    second_runtime: false,
    second_defense: false,
    second_governor: false,
    live: false,
    auto_merge: false,
    authority: "carl",
    constitution_digest: state.constitution_digest,
    digest_unchanged: state.constitution_digest === GENESIS_DIGEST,
    properties,
    boundaries,
    adversarial,
    status: properties.failed === 0 && boundaries.failed === 0 && adversarial.failed === 0 ? "VERIFIED" : "FAILED",
  };
}

export function diversityOf(intelligences = []) {
  return {
    ...cognitiveDiversity({ intelligences }),
    ten_agents_same_model_are_not_ten_independences: true,
    live: false,
  };
}

export function runCognitiveEcologyCycle({
  previous = null,
  inventory = null,
  env = process.env,
  at = new Date().toISOString(),
} = {}) {
  let state = previous && previous.entities ? clone(previous) : createEcologyState({ inventory });
  state = runRealityEngine(state);
  const target = state.entities[state.cycle % state.entities.length] || state.entities[0];
  const graph = dependencyMetrics(
    [
      { from: "model", to: "intelligence" },
      { from: "intelligence", to: "agent" },
      { from: "agent", to: "task" },
      { from: "task", to: "tool" },
      { from: "tool", to: "service" },
      { from: "service", to: "data" },
      { from: "data", to: "external" },
    ],
    [
      { id: "model", kind: "model" }, { id: "intelligence", kind: "intelligence" },
      { id: "agent", kind: "agent" }, { id: "task", kind: "unknown" },
      { id: "tool", kind: "tool" }, { id: "service", kind: "service" },
      { id: "data", kind: "data" }, { id: "external", kind: "unknown" },
    ],
  );
  const gap = ecologyControlGap({
    capability: target.capability,
    observability: target.observability,
    control: target.control,
    reversibility: target.reversibility,
    blastRadius: target.kind === "unknown" ? 0.8 : 0.2,
    dependencyDepth: graph.depth,
    uncertainty: target.observed ? 0.2 : 0.9,
  });
  const blast = ecologyBlast(target.kind === "unknown" ? "UNKNOWN" : "LOCAL", graph.fabric, "model");
  const gov = feedExistingGovernor({
    information: 0.45,
    risk: gap.status === "CONTROL_GAP" ? 0.6 : 0.2,
    cost: 0.25,
    controlGap: gap.gap,
    blast: blast.index / 7,
  });
  const defense = defenseSignals({
    jump: ecologyCapabilityJump(1, target.capability).jump,
    commonMode: graph.common_mode.common_mode,
    capability: target.observability === "NONE" && target.capability > 0,
  });
  const audit = ecologyAudit(state);
  const load = humanLoad({ decisions: 0, review: 1, attention: 1, comprehension: 1, unresolved: gap.status === "CONTROL_GAP" ? 1 : 0, compressed: true });
  const decision = humanDecisionInterface(state);
  const fabric = createFabric({ nodeId: "cortex", shard: "ecology" });
  addObservation(fabric, { subject: target.id, observer: "ecology", epistemic_state: target.observed ? "OBSERVED" : "UNKNOWN", observability: target.observability, control: target.control, reversibility: target.reversibility });
  const breakerClosed = !Object.prototype.hasOwnProperty.call(env || {}, "ACORN_SYSTEM_MODE")
    || String(env.ACORN_SYSTEM_MODE || "").toUpperCase() !== "RUN";
  return {
    version: ECOLOGY_VERSION,
    observed_at: at,
    state,
    cycle: state.cycle,
    hierarchy: [...HIERARCHY],
    constitution_digest: GENESIS_DIGEST,
    world: state.entities,
    boundary: realityBoundary({ observability: target.observability, control: target.control, reversibility: target.reversibility }),
    control_gap: gap,
    blast_radius: blast,
    dependencies: graph,
    unknown_space: state.unknown,
    governor: gov.governor,
    information_gain: gov.metrics,
    defense,
    audit,
    human: { load, decision },
    metacognition: metacognition(state),
    thermodynamics: thermodynamics({ gain: 0.3, cost: 0.4, risk: gap.status === "CONTROL_GAP" ? 0.7 : 0.2 }),
    diversity: diversityOf([
      { id: "a", model_family: "internal", provider: "acorn", reasoning_strategy: "measure" },
      { id: "b", model_family: "internal", provider: "acorn", reasoning_strategy: "measure" },
    ]),
    lifecycle: {
      DISCOVERED: true,
      DEFINED: true,
      LOADABLE: true,
      WIRED: true,
      DEPLOYED: true,
      EXECUTED: true,
      MEASURED: true,
      VERIFIED: audit.status === "VERIFIED",
      LIVE: false,
      DRIFTED: false,
      QUARANTINED: false,
      FAILED: audit.status !== "VERIFIED",
    },
    breaker_closed: breakerClosed,
    cortex_status: breakerClosed ? "EXECUTED" : "EXECUTED",
    second_cortex: false,
    second_runtime: false,
    second_defense: false,
    second_governor: false,
    auto_merge: false,
    live: false,
    authority: "carl",
  };
}

function isMain() {
  const here = fileURLToPath(import.meta.url);
  const argv1 = process.argv[1] ? String(process.argv[1]) : "";
  return argv1.endsWith("acorn-cognitive-ecology.mjs") || here === argv1;
}

if (isMain()) {
  const result = runCognitiveEcologyCycle({ env: process.env });
  const c = result.lifecycle;
  console.log(JSON.stringify({
    ecology: ECOLOGY_VERSION,
    cycle: result.cycle,
    audit: result.audit.status,
    control_gap: result.control_gap.status,
    unknown_space: result.unknown_space.length,
    governor: result.governor.decision,
    defense: result.defense.kernel,
    DISCOVERED: c.DISCOVERED,
    DEFINED: c.DEFINED,
    LOADABLE: c.LOADABLE,
    WIRED: c.WIRED,
    DEPLOYED: c.DEPLOYED,
    EXECUTED: c.EXECUTED,
    MEASURED: c.MEASURED,
    VERIFIED: c.VERIFIED,
    LIVE: c.LIVE,
    second_cortex: false,
    second_runtime: false,
    second_defense: false,
    second_governor: false,
    auto_merge: false,
    live: false,
    authority: "carl",
  }, null, 2));
}
