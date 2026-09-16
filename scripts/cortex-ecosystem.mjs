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
