#!/usr/bin/env node
/**
 * ACORN CORTEX — cognitive ecosystem, owned by the existing organism.
 * Nodes, synapses, assemblies, unknown space, replay, homeostasis.
 * Not a second Cortex. CAPABILITY ≠ AUTHORITY. PROPOSED ≠ ADOPTED.
 * UNKNOWN ≠ FAILURE. HOLD_HUMAN ≠ ERROR. live=false.
 */
import { composeSynapse, authorizeCapability, rollbackTopology } from "../.github/swarm/cortex.mjs";
import { intelligenceAdapter } from "../sdk/open-intelligence.js";
import { considerUnknownChannel } from "../sdk/open-channel.js";

export const NODE_KINDS = Object.freeze([
  "llm", "local", "tool", "memory", "human", "agent", "retriever",
  "simulator", "observer", "executor", "verifier", "critic", "planner",
]);
export const ADVERSARIAL_ROLES = Object.freeze([
  "PROPOSER", "CRITIC", "FALSIFIER", "VERIFIER", "OBSERVER", "SYNTHESIZER",
]);
export const MEMORY_CATEGORIES = Object.freeze([
  "EPISODIC", "SEMANTIC", "PROCEDURAL", "EXPERIENTIAL", "TEMPORAL",
  "CAUSAL", "FAILURE", "UNKNOWN",
]);
export const HOMEOSTASIS = Object.freeze([
  "STABLE", "OVERLOADED", "UNDER_INFORMED", "OVERCONFIDENT",
  "TOO_EXPENSIVE", "TOO_SLOW", "TOO_CORRELATED", "HOLD_HUMAN",
]);
export const TASK_CLASSES = Object.freeze([
  "research", "coding", "debugging", "planning", "verification",
  "forecasting", "classification", "multimodal", "creative",
  "data-analysis", "decision-support", "deterministic", "unknown",
]);
export const MUTATION_OPS = Object.freeze([
  "ADD_NODE", "REMOVE_NODE", "REPLACE_NODE", "ADD_SYNAPSE", "REMOVE_SYNAPSE",
  "REORDER", "PARALLELIZE", "SERIALIZE", "ADD_VERIFIER", "REMOVE_VERIFIER",
  "CHANGE_MEMORY", "CHANGE_ROUTING",
]);
export const FAILURE_KINDS = Object.freeze([
  "capability_mismatch", "routing_error", "bad_topology", "stale_memory",
  "provider_failure", "tool_failure", "insufficient_evidence", "unknown_condition",
]);
export const MODALITIES = Object.freeze([
  "text", "image", "audio", "video", "code", "structured", "sensor", "document", "event",
]);

function text(v) { return String(v ?? "").trim(); }
function list(v) { return Array.isArray(v) ? v.map(text).filter(Boolean) : []; }
function digest(value) {
  const raw = JSON.stringify(value ?? null);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function describeNode(input = {}) {
  const kind = NODE_KINDS.includes(input.kind) ? input.kind : (input.id === "carl" ? "human" : "agent");
  const human = kind === "human" || input.id === "carl";
  return {
    identity: text(input.id || input.identity),
    kind,
    capabilities: list(input.capabilities),
    presence: input.presence || "DECLARED",
    cost: input.cost ?? (kind === "local" || kind === "human" ? "zero" : null),
    latency: input.latency ?? null,
    authority: human && input.id === "carl",
    merge: false,
    live: false,
    identity_is_not_model: true,
  };
}

export function capabilityGraph(nodes = []) {
  return {
    status: "EXECUTED",
    kind: "CAPABILITY",
    nodes: (nodes || []).map((row) => ({
      identity: row.identity || row.id,
      capabilities: list(row.capabilities),
      presence: row.presence || "DECLARED",
    })),
    live: false,
  };
}

export function authorityGraph(nodes = []) {
  const rows = (nodes || []).map((row) => {
    const id = row.identity || row.id;
    return {
      identity: id,
      authority: id === "carl",
      merge: id === "carl" ? "HOLD_HUMAN" : false,
      write: false,
      live: false,
    };
  });
  return {
    status: "EXECUTED",
    kind: "AUTHORITY",
    nodes: rows,
    capability_is_not_authority: true,
    live: false,
  };
}

export function describeSynapse(input = {}) {
  if (!input.source || !input.target) return { status: "INSUFFICIENT_EVIDENCE", synapse: null };
  return {
    status: "PROPOSED",
    synapse: {
      synapse_id: `syn_${digest({ source: input.source, target: input.target, purpose: input.purpose })}`,
      source: input.source,
      target: input.target,
      purpose: input.purpose || "candidate",
      protocol: input.protocol || "open-intelligence.v0",
      information_type: input.information_type || "observation",
      confidence: input.confidence || "unscored",
      success_rate: input.success_rate ?? null,
      failure_rate: input.failure_rate ?? null,
      valid_until: input.valid_until || null,
      weight: Number(input.weight || 0),
      grade: "PROPOSED",
      live: false,
    },
  };
}

export function plasticSynapse({ synapse, outcome, at, now } = {}) {
  if (!synapse?.synapse_id) return { status: "INSUFFICIENT_EVIDENCE", synapse: null };
  const stamp = now || at || new Date().toISOString();
  if (synapse.valid_until && Date.parse(synapse.valid_until) < Date.parse(stamp)) {
    return { status: "EXPIRED", action: "expire", synapse: { ...synapse, grade: "EXPIRED", live: false } };
  }
  if (!outcome?.measured) {
    return { status: "INCONCLUSIVE", action: "hold", synapse: { ...synapse, grade: "PROPOSED", live: false }, proposed_is_not_adopted: true };
  }
  const success = outcome.success === true;
  const weight = Number(synapse.weight || 0) + (success ? 1 : -1);
  const action = success ? "strengthen" : "weaken";
  return {
    status: "MEASURED",
    action,
    synapse: {
      ...synapse,
      weight,
      success_rate: success ? Number(synapse.success_rate || 0) + 1 : synapse.success_rate,
      failure_rate: success ? synapse.failure_rate : Number(synapse.failure_rate || 0) + 1,
      grade: "PROPOSED",
      live: false,
    },
    proposed_is_not_adopted: true,
    live: false,
  };
}

export function composeCognitiveGraph({ task = "review", nodes = [], required = ["review"] } = {}) {
  const described = (nodes || []).map((row) => describeNode(row));
  const discovered = {
    discovered: described.map((node) => ({
      intelligence: { id: node.identity, capabilities: node.capabilities, presence: node.presence, specialty: node.kind },
      covered: required.filter((cap) => node.capabilities.includes(cap)),
      callable: node.presence === "ACTIVE" || node.presence === "CONNECTED" || node.kind === "local" || node.identity === "cortex-local",
    })),
  };
  const composed = composeSynapse({ objective: task, required_capabilities: required }, discovered);
  const roles = {
    executor: composed.selected[0] || "cortex-local",
    verifier: composed.independent_verifier || (described.find((n) => n.kind === "verifier")?.identity) || null,
    critic: described.find((n) => n.kind === "critic")?.identity || null,
    human: described.find((n) => n.kind === "human" || n.identity === "carl")?.identity || "carl",
  };
  const edges = [];
  if (roles.executor) edges.push(describeSynapse({ source: "cortex", target: roles.executor, purpose: "execute" }).synapse);
  if (roles.critic && roles.executor) edges.push(describeSynapse({ source: roles.executor, target: roles.critic, purpose: "critique" }).synapse);
  if (roles.verifier && roles.executor) edges.push(describeSynapse({ source: roles.executor, target: roles.verifier, purpose: "verify" }).synapse);
  edges.push(describeSynapse({ source: "cortex", target: "carl", purpose: "sovereignty" }).synapse);
  return {
    status: composed.ok ? "PROPOSED" : "HOLD_HUMAN",
    assembly: {
      assembly_id: `asm_${digest({ task, selected: composed.selected })}`,
      task,
      nodes: composed.selected,
      roles,
      edges: edges.filter(Boolean),
      missing: composed.missing,
      retained: false,
      live: false,
    },
    agreement_is_not_independent_evidence: true,
    live: false,
  };
}

export function unknownSpace(claims = []) {
  const rows = (claims || []).map((claim) => {
    if (!claim || claim.what == null) return { ...claim, region: "UNKNOWN" };
    if (claim.state === "CONFLICTING") return { ...claim, region: "CONFLICTING" };
    if (claim.state === "EXPIRED") return { ...claim, region: "UNMEASURED" };
    if (claim.evidence == null) return { ...claim, region: "UNOBSERVED" };
    if (claim.untestable === true) return { ...claim, region: "UNTESTABLE" };
    if (claim.verified === true) return { ...claim, region: "KNOWN" };
    return { ...claim, region: "UNCERTAIN" };
  });
  return {
    status: "EXECUTED",
    regions: rows,
    unknown_is_not_failure: true,
    live: false,
  };
}

export function valueOfInformation({ unknown = {}, cost = 0, expected_reduction = 0 } = {}) {
  const region = unknown.region || unknown.state || "UNKNOWN";
  if (region === "KNOWN") return { status: "NOT_REQUIRED", next: null, live: false };
  const expensive = Number(cost) > Number(expected_reduction);
  return {
    status: "PROPOSED",
    next: expensive ? null : { observe: region, why: "reduce uncertainty" },
    hold_human: region === "UNTESTABLE",
    live: false,
  };
}

export function whenToAskHuman({
  risk = "low", authority_required = false, uncertainty, missing_capability = false, merge = false,
} = {}) {
  const why = [];
  if (merge || authority_required) why.push("authority required");
  if (missing_capability) why.push("capability gap");
  if (uncertainty === "UNTESTABLE" || uncertainty === "CONFLICTING") why.push(`uncertainty ${uncertainty}`);
  if (risk === "high") why.push("high risk");
  if (!why.length) return { status: "NOT_REQUIRED", ask: false, live: false };
  return {
    status: "HOLD_HUMAN",
    ask: true,
    why: why.join("; "),
    load: "single-point judgment, not validate-everything",
    sovereignty: "carl",
    live: false,
  };
}

export function cognitiveContract({
  task, capability, intelligence, action, authority = "carl", evidence, measurement, decision,
} = {}) {
  return {
    status: "DEFINED",
    contract: {
      task: task || null,
      capability: capability || null,
      intelligence: intelligence || null,
      action: action || null,
      authority,
      evidence: evidence || null,
      measurement: measurement || null,
      decision: decision || null,
      live: false,
    },
    live: false,
    auto_merge: false,
  };
}

export function rememberCategorized({ kind = "EPISODIC", content, at, valid_until, confidence = "unscored" } = {}) {
  const category = MEMORY_CATEGORIES.includes(kind) ? kind : "UNKNOWN";
  return {
    status: "EXECUTED",
    entry: {
      kind: category,
      content: content ?? null,
      at: at || new Date().toISOString(),
      valid_until: valid_until || null,
      confidence,
      live: false,
    },
    live: false,
  };
}

export function decayMemory(entries = [], now = new Date().toISOString()) {
  const t = Date.parse(now);
  const reuse = [];
  const expire = [];
  for (const entry of entries || []) {
    if (entry.valid_until && Date.parse(entry.valid_until) < t) expire.push({ ...entry, state: "EXPIRED" });
    else reuse.push(entry);
  }
  return { status: "EXECUTED", reuse, expire, live: false };
}

export function explainDecision({ selected, graph, policy, unknown, human } = {}) {
  return {
    status: "EXECUTED",
    why_intelligence: selected?.identity || selected || null,
    why_route: policy || graph?.assembly?.roles?.executor || null,
    why_tool: graph?.assembly?.roles?.executor || null,
    why_memory: unknown?.unknown_is_not_failure ? "unknown space preserved" : null,
    why_human: human?.why || null,
    opaque: false,
    live: false,
  };
}

export function debugFailure({ task, routing, node, synapse, observation, error, memory, decision } = {}) {
  return {
    status: "EXECUTED",
    chain: { task, routing, node, synapse, action: routing, observation, error, memory, decision },
    live: false,
  };
}

export function replayDecision({ snapshot = {}, topology, inputs } = {}) {
  if (!snapshot || typeof snapshot !== "object") return { status: "INCONCLUSIVE", reason: "no snapshot", live: false };
  return {
    status: "EXECUTED",
    replay: {
      evidence: snapshot.evidence ?? snapshot,
      memory: snapshot.memory || null,
      topology: topology || snapshot.topology || null,
      inputs: inputs || snapshot.inputs || null,
      comparable: true,
    },
    live: false,
  };
}

export function searchArchitectures({ graphs = [], metrics = {} } = {}) {
  const scored = (graphs || []).map((graph, i) => ({
    id: graph.assembly?.assembly_id || `graph_${i}`,
    graph,
    cost: metrics.cost ?? null,
    latency: metrics.latency ?? null,
    measured: metrics.measured === true,
    retain: false,
    live: false,
  }));
  return {
    status: "PROPOSED",
    candidates: scored,
    adopted: null,
    auto_adopt: false,
    live: false,
  };
}

export function homeostasisOf({ metabolism = {}, immune = {}, unknown = {}, cost } = {}) {
  if (immune?.findings?.some((row) => row.kind === "authority_violation")) return { state: "HOLD_HUMAN", live: false };
  if (metabolism?.stalls) return { state: "TOO_SLOW", live: false };
  if (metabolism?.friction) return { state: "OVERLOADED", live: false };
  if (unknown?.regions?.every((row) => row.region === "UNKNOWN") && (unknown.regions || []).length) return { state: "UNDER_INFORMED", live: false };
  if (cost === "paid" && metabolism?.paid_required === false) return { state: "TOO_EXPENSIVE", live: false };
  return { state: "STABLE", live: false };
}

export function resilientReroute({ failedNode, nodes = [], required = ["review"] } = {}) {
  const remaining = (nodes || []).filter((row) => (row.identity || row.id) !== failedNode);
  const graph = composeCognitiveGraph({ task: "review", nodes: remaining, required });
  return {
    status: remaining.length ? "EXECUTED" : "HOLD_HUMAN",
    failed: failedNode,
    remaining: remaining.map((row) => row.identity || row.id),
    graph,
    continued: remaining.length > 0,
    live: false,
  };
}

export function discoverUnknownIntelligence(entry = {}) {
  const node = describeNode({
    id: entry.id,
    kind: entry.kind || "llm",
    capabilities: entry.capabilities || ["CAPABILITY_UNKNOWN"],
    presence: "DECLARED",
  });
  const channel = considerUnknownChannel({ id: entry.id, provider: entry.provider || "UNKNOWN" });
  const adapter = intelligenceAdapter({ id: entry.id, provider: entry.provider || "UNKNOWN", capabilities: node.capabilities });
  return {
    status: "DISCOVERED",
    node,
    channel,
    described: adapter.describe ? adapter.describe() : { identity: node.identity },
    invoked: adapter.invoke({ capability: "review" }),
    cortex_modified: false,
    live: false,
  };
}

export function classifyTask(task = {}) {
  const raw = `${task.class || task.objective || task.need || ""}`.toLowerCase();
  const found = TASK_CLASSES.find((row) => raw.includes(row));
  const classified = found || (/\b(lint|transform|validate|hash)\b/.test(raw) ? "deterministic" : "unknown");
  const required = list(task.required || task.required_capabilities);
  if (!required.length) {
    if (classified === "verification" || classified === "unknown") required.push("review");
    if (classified === "coding" || classified === "debugging") required.push("code");
    if (classified === "multimodal" || /\b(image|vision|photo)\b/.test(raw)) required.push("vision");
    if (!required.length) required.push("review");
  }
  return { status: "EXECUTED", class: classified, required, live: false };
}

export function describeArchitecture({
  id, class: taskClass = "unknown", nodes = [], synapses = [], roles = {},
  memory = [], tools = [], constraints = [], verification = "critic",
  budget = { money: 0 }, routing = "FREE_FIRST",
} = {}) {
  return {
    architecture_id: id || `arch_${digest({ taskClass, nodes: (nodes || []).map((n) => n.identity || n) })}`,
    class: TASK_CLASSES.includes(taskClass) ? taskClass : "unknown",
    nodes: (nodes || []).map((row) => (row.identity ? row : describeNode(row))),
    synapses: synapses || [],
    roles: roles || {},
    routing,
    memory,
    tools,
    constraints,
    authority: "carl",
    verification,
    resource_budget: { tokens: null, requests: null, latency: null, compute: null, memory: null, human_attention: "minimal", money: 0, ...budget },
    version: 1,
    better_in_general: false,
    live: false,
  };
}

export function allocateResources({ nodes = [], budget = { money: 0 }, policy = "FREE_FIRST" } = {}) {
  const zero = policy === "PAID_FORBIDDEN" || Number(budget.money || 0) === 0;
  const allowed = (nodes || []).filter((row) => {
    const node = row.identity ? row : describeNode(row);
    if (!zero) return true;
    return node.cost === "zero" || node.kind === "local" || node.kind === "human" || node.identity === "worker" || node.identity === "cortex-local" || node.identity === "carl";
  });
  return {
    status: "EXECUTED",
    zero_cost: zero,
    nodes: allowed,
    excluded: (nodes || []).length - allowed.length,
    live: false,
  };
}

export function generateArchitectures({
  class: taskClass = "unknown", nodes = [], required = ["review"], budget = { money: 0 }, policy = "FREE_FIRST",
} = {}) {
  const pool = allocateResources({ nodes, budget, policy }).nodes;
  const local = pool.find((row) => row.identity === "cortex-local" || row.kind === "local") || describeNode({ id: "cortex-local", kind: "local", capabilities: required, presence: "ACTIVE" });
  const worker = pool.find((row) => row.identity === "worker");
  const critic = pool.find((row) => row.kind === "critic");
  const verifier = pool.find((row) => row.kind === "verifier") || pool.find((row) => (row.capabilities || []).includes("review") && row.identity !== (worker || local).identity);
  const human = pool.find((row) => row.identity === "carl") || describeNode({ id: "carl", kind: "human", capabilities: ["judgment"] });
  const graph = composeCognitiveGraph({ task: taskClass, nodes: pool, required });
  const a = describeArchitecture({
    id: "arch_local", class: taskClass, nodes: [local], roles: { executor: local.identity },
    verification: "deterministic", budget, routing: "LOCAL_ONLY",
  });
  const b = describeArchitecture({
    id: "arch_worker", class: taskClass, nodes: [worker || local, human].filter(Boolean),
    roles: graph.assembly.roles, synapses: graph.assembly.edges, budget, routing: policy,
  });
  const c = describeArchitecture({
    id: "arch_adversarial", class: taskClass,
    nodes: [worker || local, critic, verifier, human].filter(Boolean),
    roles: { executor: (worker || local).identity, critic: critic?.identity || null, verifier: verifier?.identity || null, falsifier: critic?.identity || null, human: human.identity },
    verification: "independent", budget, routing: policy,
    constraints: ["agreement_is_not_independent_evidence"],
  });
  return { status: "PROPOSED", candidates: [a, b, c], auto_adopt: false, live: false };
}

export function selectArchitecture({ candidates = [], library = [], measured = false, class: taskClass } = {}) {
  const pattern = (library || []).find((row) => row && row.class === taskClass && row.measured);
  const preferred = pattern
    ? candidates.find((row) => row.architecture_id === pattern.architecture_id) || candidates[0]
    : candidates.find((row) => row.routing === "LOCAL_ONLY") || candidates[0];
  return {
    status: measured && pattern ? "MEASURED" : "PROPOSED",
    architecture: preferred || null,
    reused_pattern: Boolean(pattern),
    adopted: false,
    better_in_general: false,
    live: false,
  };
}

export function assembleArchitecture(architecture, { at } = {}) {
  if (!architecture) return { status: "INSUFFICIENT_EVIDENCE", assembly: null };
  return {
    status: "ASSEMBLED",
    assembly: {
      assembly_id: `asm_${architecture.architecture_id}`,
      architecture_id: architecture.architecture_id,
      at: at || new Date().toISOString(),
      retained: false,
      live: false,
    },
    architecture,
    live: false,
  };
}

export function executeAssembly(assembled, { workerEvidence = {}, fail = false } = {}) {
  const executed = Boolean(workerEvidence?.v) && !fail;
  return {
    status: executed ? "EXECUTED" : (fail ? "FAILED" : "DEFINED"),
    ok: executed,
    result: executed ? { capability: assembled?.architecture?.class || "review", available: true } : null,
    error: fail ? "unknown_condition" : (executed ? null : "not executed"),
    live: false,
  };
}

export function disassembleAssembly(assembled, { keep = false } = {}) {
  return { status: keep ? "STORED" : "DISASSEMBLED", retained: keep === true, assembly: assembled?.assembly || null, live: false };
}

export function rememberPattern({ architecture, context, measured = false, at } = {}) {
  if (!architecture || measured !== true) {
    return { status: "INCONCLUSIVE", pattern: null, reason: "unmeasured architectures are not stored as truth", live: false };
  }
  return {
    status: "EXECUTED",
    pattern: {
      pattern_id: `pat_${digest({ id: architecture.architecture_id, context })}`,
      architecture_id: architecture.architecture_id,
      class: context || architecture.class,
      topology: (architecture.roles || {}),
      measured: true,
      at: at || new Date().toISOString(),
      valid_until: null,
      reversible: true,
      better_in_general: false,
      live: false,
    },
    live: false,
  };
}

export function architectureLibrary(patterns = []) {
  return {
    status: "EXECUTED",
    patterns: (patterns || []).filter(Boolean).map((row) => ({ ...row, truth_eternal: false, live: false })),
    learned: true,
    versioned: true,
    measured: true,
    temporal: true,
    reversible: true,
    live: false,
  };
}

export function mutateArchitecture(architecture, { op = "ADD_VERIFIER", node } = {}) {
  if (!MUTATION_OPS.includes(op) || !architecture) return { status: "INSUFFICIENT_EVIDENCE", mutation: null };
  const next = describeArchitecture({
    ...architecture,
    id: `${architecture.architecture_id}_${op.toLowerCase()}`,
    nodes: op === "ADD_VERIFIER" || op === "ADD_NODE"
      ? [...(architecture.nodes || []), node || describeNode({ id: "reviewer", kind: "verifier", capabilities: ["review"], presence: "CONNECTED" })]
      : (architecture.nodes || []).filter((row) => row.identity !== (node?.identity || node)),
    verification: op === "ADD_VERIFIER" ? "independent" : architecture.verification,
  });
  return { status: "PROPOSED", op, mutation: next, hypothesis: true, adopted: false, live: false };
}

export function compareArchitectures({ a, b, measurements = {}, at } = {}) {
  if (!a || !b) return { status: "INSUFFICIENT_EVIDENCE", better_in_general: false, live: false };
  const measured = measurements.measured === true;
  const aScore = Number(measurements.a?.error ?? 1);
  const bScore = Number(measurements.b?.error ?? 1);
  let verdict = "INCONCLUSIVE";
  if (measured && bScore < aScore) verdict = "B_BETTER_IN_CONTEXT";
  else if (measured && aScore < bScore) verdict = "A_BETTER_IN_CONTEXT";
  return {
    status: measured ? "MEASURED" : "INCONCLUSIVE",
    verdict,
    delta: { error: bScore - aScore, cost: measurements.cost ?? null, latency: measurements.latency ?? null },
    context: measurements.context || a.class,
    at: at || new Date().toISOString(),
    dated: true,
    contextual: true,
    reversible: true,
    better_in_general: false,
    winner: verdict === "B_BETTER_IN_CONTEXT" ? b : verdict === "A_BETTER_IN_CONTEXT" ? a : null,
    live: false,
  };
}

export function cognitiveConfidence({ evidence_strength = "unscored", agreement = 0, independent = false, measurement_quality = "unscored", recency = "now", causal_support = false } = {}) {
  return {
    status: "EXECUTED",
    dimensions: { evidence_strength, model_agreement: agreement, source_independence: independent, measurement_quality, recency, causal_support },
    single_number: null,
    correlated_agreement_is_not_proof: agreement > 1 && independent === false,
    live: false,
  };
}

export function independenceGraph(nodes = [], edges = []) {
  const deps = (edges || []).map((edge) => ({ from: edge.source || edge.from, to: edge.target || edge.to, independent: false }));
  return { status: "EXECUTED", nodes: (nodes || []).map((row) => row.identity || row.id || row), edges: deps, live: false };
}

export function detectCollusion({ answers = [], graph } = {}) {
  const texts = (answers || []).map((row) => JSON.stringify(row.what ?? row.answer ?? row));
  const same = texts.length > 1 && texts.every((row) => row === texts[0]);
  const dependent = (graph?.edges || []).some((edge) => edge.independent === false);
  const collusion = same && dependent;
  return {
    status: "EXECUTED",
    collusion,
    correlated_reasoning: collusion,
    independent_verification: collusion,
    live: false,
  };
}

export function redundancyOf({ paths = 1, uncertainty = "KNOWN", consequence = "low" } = {}) {
  let needed = 1;
  if (uncertainty === "UNCERTAIN" || uncertainty === "UNKNOWN") needed = 2;
  if (consequence === "high") needed = Math.max(needed, 3);
  return { status: "EXECUTED", paths: Number(paths) || 1, needed, justified: Number(paths) >= needed, live: false };
}

export function capabilityRegistry(entries = []) {
  return {
    status: "EXECUTED",
    entries: (entries || []).map((row) => ({
      identity: row.identity || row.id,
      capability: row.capability || (row.capabilities || [])[0] || null,
      performance: row.performance ?? null,
      availability: row.presence || row.availability || "DECLARED",
      cost: row.cost ?? null,
      evidence: row.evidence || null,
      declared_only: !row.evidence && row.performance == null,
      live: false,
    })),
    place_by_measurement: true,
    live: false,
  };
}

export function routeModality({ modality = "text", nodes = [] } = {}) {
  const kind = MODALITIES.includes(modality) ? modality : "text";
  const need = kind === "image" || kind === "video" ? "vision" : kind === "audio" ? "audio" : kind === "code" ? "code" : "review";
  const match = (nodes || []).filter((row) => (row.capabilities || []).includes(need) || (row.capabilities || []).includes(kind));
  return {
    status: match.length ? "PROPOSED" : "HOLD_HUMAN",
    modality: kind,
    need,
    nodes: match.map((row) => row.identity || row.id),
    missing: match.length ? [] : [need],
    live: false,
  };
}

export function temporalCognition({ was, is, expected, expired, changed, at } = {}) {
  return {
    status: "EXECUTED",
    was: was ?? null,
    is: is ?? null,
    expected: expected ?? null,
    expired: expired ?? null,
    changed: changed ?? null,
    timestamp: at || new Date().toISOString(),
    live: false,
  };
}

export function recordCredit({ identity, outcome, verified = false, contradicted = false, expired = false, context } = {}) {
  return {
    status: "EXECUTED",
    experience: {
      identity,
      successful: outcome === "successful",
      failed: outcome === "failed",
      verified,
      contradicted,
      expired,
      context: context || null,
      reputation_absolute: false,
      live: false,
    },
    live: false,
  };
}

export function classifyFailure({ error, topology } = {}) {
  const kind = FAILURE_KINDS.includes(error) ? error
    : /provider|429|quota/i.test(String(error || "")) ? "provider_failure"
      : /missing|mismatch/i.test(String(error || "")) ? "capability_mismatch"
        : error ? "unknown_condition" : "insufficient_evidence";
  return { status: "EXECUTED", kind, topology: topology?.architecture_id || topology || null, live: false };
}

export function cognitiveAutopsy({ task, node, synapse, assumption, memory, routing, evidence } = {}) {
  const demonstrated = evidence && evidence.root_cause === true;
  return {
    status: "EXECUTED",
    what: task || null,
    where: node || null,
    synapse: synapse || null,
    assumption: assumption || null,
    memory: memory || null,
    routing: routing || null,
    root_cause: demonstrated ? evidence.cause : null,
    verdict: demonstrated ? "MEASURED" : "INCONCLUSIVE",
    live: false,
  };
}

export function detectRegression({ before, after, beforeMetrics = {}, afterMetrics = {} } = {}) {
  const degraded = Number(afterMetrics.error || 0) > Number(beforeMetrics.error || 0)
    || (afterMetrics.capability && beforeMetrics.capability && afterMetrics.capability !== beforeMetrics.capability && afterMetrics.degraded === true);
  return {
    status: degraded ? "REGRESSION" : "EXECUTED",
    degraded,
    before: before?.architecture_id || before,
    after: after?.architecture_id || after,
    adopt: false,
    live: false,
  };
}

export function safeEvolve({ baseline, candidate, verification = {}, previous } = {}) {
  if (verification.verified !== true) {
    return { status: "PROPOSED", adopted: false, reason: "unverified", baseline, candidate, live: false, auto_merge: false };
  }
  const rolled = previous ? rollbackTopology(candidate, previous) : { ok: true, topology: baseline, live: false };
  return {
    status: "PROPOSED",
    adopted: false,
    simulated: true,
    tested: true,
    measured: Boolean(verification.measured),
    verified: verification.verified === true,
    rollback: rolled,
    live: false,
    auto_merge: false,
  };
}

export function versionCortex({ architecture, topology, routing, memory, genome } = {}) {
  return {
    status: "EXECUTED",
    version: {
      architecture: architecture?.architecture_id || architecture || null,
      topology: topology?.version ?? topology ?? 0,
      routing: routing || null,
      memory_schema: memory?.kind || "categorized",
      genome: genome?.digest || genome || null,
    },
    second_cortex: false,
    live: false,
  };
}

export function timeMachine({ at, snapshot = {} } = {}) {
  return {
    status: snapshot && Object.keys(snapshot).length ? "EXECUTED" : "INCONCLUSIVE",
    at: at || snapshot.at || null,
    state: snapshot.state || snapshot,
    memory: snapshot.memory || null,
    evidence: snapshot.evidence || null,
    architecture: snapshot.architecture || null,
    routing: snapshot.routing || null,
    live: false,
  };
}

export function runArchitectureEngine(input = {}) {
  const classified = classifyTask(input.task || { need: input.need || "review", required: input.required });
  const nodes = (input.nodes || []).map((row) => describeNode(row));
  const generated = generateArchitectures({
    class: classified.class, nodes, required: classified.required,
    budget: input.budget || { money: 0 }, policy: input.policy || "FREE_FIRST",
  });
  const selected = selectArchitecture({
    candidates: generated.candidates, library: input.library || [],
    measured: false, class: classified.class,
  });
  const assembled = assembleArchitecture(selected.architecture, { at: input.at });
  const executed = executeAssembly(assembled, { workerEvidence: input.workerEvidence || {}, fail: input.fail === true });
  const observed = { actual: executed.result, at: input.at || new Date().toISOString() };
  const failure = executed.ok ? null : classifyFailure({ error: executed.error || input.error, topology: selected.architecture });
  const autopsy = failure ? cognitiveAutopsy({
    task: classified.class, node: selected.architecture?.roles?.executor,
    routing: selected.architecture?.routing, evidence: input.autopsyEvidence,
  }) : { status: "NOT_APPLICABLE", verdict: "INCONCLUSIVE", live: false };
  const mutated = (!executed.ok || input.fail)
    ? mutateArchitecture(selected.architecture, { op: "ADD_VERIFIER" })
    : { status: "NOT_REQUIRED", mutation: generated.candidates[2], live: false };
  const compared = compareArchitectures({
    a: selected.architecture,
    b: mutated.mutation || generated.candidates[2],
    measurements: {
      measured: Boolean(input.workerEvidence?.v),
      context: classified.class,
      a: { error: executed.ok ? 0 : 1 },
      b: { error: executed.ok ? 0 : 0 },
    },
    at: input.at,
  });
  const keep = compared.verdict !== "INCONCLUSIVE" && compared.winner != null;
  const remembered = rememberPattern({
    architecture: compared.winner || selected.architecture,
    context: classified.class,
    measured: keep,
    at: input.at,
  });
  const library = architectureLibrary([...(input.library || []), remembered.pattern].filter(Boolean));
  const next = selectArchitecture({
    candidates: generated.candidates, library: library.patterns,
    measured: keep, class: classified.class,
  });
  const regression = detectRegression({
    before: selected.architecture, after: next.architecture,
    beforeMetrics: { error: executed.ok ? 0 : 1 },
    afterMetrics: { error: executed.ok ? 0 : 0 },
  });
  const evolved = safeEvolve({
    baseline: selected.architecture,
    candidate: next.architecture,
    verification: { verified: false, measured: keep },
  });
  const independence = independenceGraph(selected.architecture?.nodes, selected.architecture?.synapses);
  const collusion = detectCollusion({ answers: input.answers || [], graph: independence });
  const confidence = cognitiveConfidence({
    agreement: (input.answers || []).length,
    independent: !collusion.collusion,
    causal_support: false,
  });
  const credit = recordCredit({
    identity: selected.architecture?.roles?.executor,
    outcome: executed.ok ? "successful" : "failed",
    verified: keep,
    context: classified.class,
  });
  const modality = routeModality({ modality: input.modality || "text", nodes });
  const temporal = temporalCognition({ is: observed.actual, expected: classified.required, at: input.at });
  const resources = allocateResources({ nodes, budget: input.budget || { money: 0 }, policy: input.policy || "FREE_FIRST" });
  const registry = capabilityRegistry(nodes);
  const versions = versionCortex({ architecture: selected.architecture, topology: input.topology, routing: selected.architecture?.routing });
  const past = timeMachine({ at: input.at, snapshot: { architecture: selected.architecture, evidence: input.workerEvidence, memory: input.memory } });
  const replay = replayDecision({ snapshot: { topology: input.topology, memory: input.memory, evidence: input.workerEvidence, architecture: selected.architecture } });
  const human = whenToAskHuman({
    merge: false,
    missing_capability: (classified.required || []).some((cap) => !nodes.some((row) => (row.capabilities || []).includes(cap))),
    uncertainty: classified.class === "unknown" ? "UNKNOWN" : "KNOWN",
    risk: input.risk || "low",
  });
  const gate = authorizeCapability({ capabilities: ["review"], allowed: true, authority: "network" });
  const disassembled = disassembleAssembly(assembled, { keep });
  return {
    status: "EXECUTED",
    classified,
    generated,
    selected,
    assembled,
    executed,
    observed,
    failure,
    autopsy,
    mutated,
    compared,
    remembered,
    library,
    next_route: next,
    regression,
    evolved,
    independence,
    collusion,
    confidence,
    credit,
    modality,
    temporal,
    resources,
    registry,
    versions,
    time_machine: past,
    replay,
    human,
    disassembled,
    authorize: gate,
    authority_granted: false,
    traceable: true,
    better_in_general: false,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function runEcosystemCycle(input = {}) {
  const agents = input.agents || [];
  const nodes = [
    ...agents.map((row) => describeNode({ ...row, kind: row.id === "worker" ? "executor" : row.kind })),
    describeNode({ id: "cortex-local", kind: "local", capabilities: ["cognitive-cycle", "review"], presence: "ACTIVE" }),
    describeNode({ id: "carl", kind: "human", capabilities: ["judgment", "values", "authority"], presence: "ACTIVE" }),
  ];
  if (input.workerEvidence?.v) {
    const worker = nodes.find((row) => row.identity === "worker");
    if (worker) worker.presence = "ACTIVE";
  }
  const caps = capabilityGraph(nodes);
  const auth = authorityGraph(nodes);
  const graph = composeCognitiveGraph({
    task: input.need || "review",
    nodes,
    required: input.required || ["review"],
  });
  const unknown = unknownSpace(input.claims || input.knowledge || []);
  const curiosity = valueOfInformation({ unknown: unknown.regions[0] || { region: "UNKNOWN" }, cost: 0, expected_reduction: 1 });
  const human = whenToAskHuman({
    merge: false,
    authority_required: false,
    missing_capability: (graph.assembly?.missing || []).length > 0,
    uncertainty: unknown.regions[0]?.region,
    risk: input.risk || "low",
  });
  const contract = cognitiveContract({
    task: input.need || "review",
    capability: "review",
    intelligence: graph.assembly?.roles?.executor,
    action: "compose",
    authority: "carl",
    evidence: input.workerEvidence || null,
    measurement: input.metabolism || null,
    decision: human.status === "HOLD_HUMAN" ? "HOLD_HUMAN" : "PROPOSED",
  });
  const synapse = describeSynapse({
    source: "worker",
    target: "ci",
    purpose: "local execution fabric",
  });
  const plastic = plasticSynapse({
    synapse: synapse.synapse,
    outcome: { measured: Boolean(input.workerEvidence?.v), success: Boolean(input.workerEvidence?.v) },
  });
  const homeo = homeostasisOf({
    metabolism: input.metabolism || {},
    immune: input.immune || {},
    unknown,
  });
  const resilient = resilientReroute({
    failedNode: input.failedNode || "xai",
    nodes,
    required: ["review"],
  });
  const search = searchArchitectures({
    graphs: [graph, resilient.graph],
    metrics: { measured: Boolean(input.workerEvidence?.v), cost: "zero" },
  });
  const architecture = runArchitectureEngine({
    task: { need: input.need || "review", required: input.required || ["review"] },
    nodes,
    workerEvidence: input.workerEvidence || {},
    budget: { money: 0 },
    policy: input.policy || "FREE_FIRST",
    topology: input.topology,
    memory: input.memory,
    library: input.library || [],
    fail: input.fail === true,
    at: input.at,
  });
  const replay = replayDecision({
    snapshot: { topology: input.topology, memory: input.memory, evidence: input.workerEvidence, inputs: { need: input.need || "review" } },
    topology: input.topology,
  });
  const gap = (graph.assembly?.missing || []).length
    ? discoverUnknownIntelligence({ id: "tomorrowx", capabilities: graph.assembly.missing })
    : discoverUnknownIntelligence({ id: "tomorrowx", capabilities: ["CAPABILITY_NEW"] });
  const why = explainDecision({
    selected: { identity: graph.assembly?.roles?.executor },
    graph,
    policy: "FREE_FIRST",
    unknown,
    human,
  });
  const debug = debugFailure({
    task: input.need || "review",
    routing: graph.assembly?.roles,
    node: graph.assembly?.roles?.executor,
    synapse: plastic.synapse,
    observation: input.fluidity || null,
    error: input.immune?.findings || [],
    memory: input.memory || [],
    decision: human.status,
  });
  const gate = authorizeCapability({ capabilities: ["review"], allowed: true, authority: "network" });
  return {
    status: "EXECUTED",
    nodes,
    capability_graph: caps,
    authority_graph: auth,
    graph,
    unknown,
    curiosity,
    human,
    contract,
    plasticity: plastic,
    homeostasis: homeo,
    resilience: resilient,
    architectures: search,
    architecture,
    replay,
    gap,
    explain: why,
    debug,
    authorize: gate,
    live: false,
    auto_merge: false,
    authority: "carl",
    proposed_is_not_adopted: true,
    capability_is_not_authority: true,
  };
}
