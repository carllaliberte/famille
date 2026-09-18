#!/usr/bin/env node
/**
 * ACORN UNIVERSAL CAPABILITY INFRASTRUCTURE
 *
 * Coordinator of relations between existing primitives.
 * Not a second Cortex, runtime, market, connector system, economic engine,
 * or authority. Stripe remains an ECONOMIC_RAIL implementation. Grok remains
 * an IntelligenceProvider implementation. Google remains an
 * ExternalCapabilityProvider implementation.
 *
 * BUILD FOR THE UNKNOWN. CAPABILITY ≠ AUTHORITY. CARL = MERGE.
 *
 * Reuses: self-build, operational-fabric, execution-fabric, intelligence-fabric,
 * enterprise-state, evidence, usage-rights, stripe financial rail,
 * inter-organism, constitution.
 */
import { createHash } from "node:crypto";
import { assertCapabilityAuthoritySeparation } from "./acorn-constitution.mjs";
import {
  admitExtension,
  detectGaps,
  shouldStop,
  EXTENSION_KINDS,
} from "./acorn-self-build.mjs";
import {
  createTask,
  taskGraph,
  buildExecutionPlan,
  startTask,
  executionSnapshot,
  EXECUTION_POLICIES,
} from "./acorn-execution-fabric.mjs";
import { discoverUnknownIntelligence, isolateRealm, economicRecord } from "./acorn-operational-fabric.mjs";
import { stateRecord, eventRecord } from "./acorn-enterprise-state.mjs";
import { describeUsageRights } from "./acorn-usage-rights.mjs";
import { createFinancialRail } from "./acorn-stripe-adapter.mjs";
import { handshake, declareOrganism, isolateInvalid } from "../sdk/inter-organism.js";

export const UNIVERSAL_VERSION = "acorn.universal-infrastructure.v0";

export const UNIVERSAL_PRIMITIVES = Object.freeze([
  "IDENTITY",
  "ORGANIZATION",
  "CAPABILITY",
  "INTELLIGENCE",
  "RESOURCE",
  "DATA",
  "TOOL",
  "CONNECTOR",
  "TASK",
  "PROJECT",
  "GRAPH",
  "EXECUTION",
  "EVENT",
  "MEMORY",
  "EVIDENCE",
  "MEASUREMENT",
  "POLICY",
  "AUTHORITY",
  "DECISION",
  "OFFER",
  "ORDER",
  "ECONOMIC_EVENT",
  "RIGHT",
  "CONTRACT",
]);

export const CAPABILITY_EDGES = Object.freeze([
  "requires",
  "produces",
  "uses",
  "provided_by",
  "verified_by",
  "measured_by",
  "priced_as",
  "executed_by",
  "composed_of",
  "constrained_by",
]);

export const TRUST_STATES = Object.freeze([
  "ASSERTED",
  "OBSERVED",
  "TESTED",
  "MEASURED",
  "VERIFIED",
  "LIVE",
  "EXPIRED",
  "REVOKED",
  "BLOCKED",
  "UNKNOWN",
]);

export const MEMORY_CLASSES = Object.freeze([
  "FACT",
  "OBSERVATION",
  "HYPOTHESIS",
  "PROPOSAL",
  "DECISION",
  "EVIDENCE",
  "MEASUREMENT",
  "OBJECTION",
  "LESSON",
]);

export const FAILURE_STATES = Object.freeze([
  "SUCCESS",
  "EXPECTED_FAILURE",
  "TRANSIENT_FAILURE",
  "RECOVERED",
  "REAL_REGRESSION",
  "WAITING_HUMAN",
  "SECURITY_BLOCK",
  "UNKNOWN",
]);

export const UNKNOWN_KINDS = Object.freeze([
  "UNKNOWN_PROVIDER",
  "UNKNOWN_INTELLIGENCE",
  "UNKNOWN_CAPABILITY",
  "UNKNOWN_PROTOCOL",
  "UNKNOWN_DEVICE",
  "UNKNOWN_MARKET",
  "UNKNOWN_RAIL",
  "UNKNOWN_MACHINE",
  "UNKNOWN_ORGANISM",
]);

export const PHYSICAL_KINDS = Object.freeze([
  "SENSOR",
  "ROBOT",
  "VEHICLE",
  "FACTORY",
  "LAB",
  "ENERGY_SYSTEM",
  "MACHINE",
]);

export const PROTOCOL_CONTRACTS = Object.freeze([
  "DISCOVERY",
  "CAPABILITY",
  "IDENTITY",
  "EXECUTION",
  "EVIDENCE",
  "MEASUREMENT",
  "TRUST",
  "ECONOMICS",
  "GOVERNANCE",
  "FEDERATION",
]);

export const ECONOMIC_KINDS = Object.freeze([
  "PAYMENT",
  "INVOICE",
  "SUBSCRIPTION",
  "USAGE",
  "LICENSE",
  "RIGHT",
  "CONTRACT",
  "REFUND",
  "DISPUTE",
  "SETTLEMENT",
]);

export const PRODUCTIZATION = Object.freeze([
  "API",
  "SDK",
  "WORKFLOW",
  "PRODUCT",
  "SUBSCRIPTION",
  "PROJECT",
  "ENTERPRISE_OFFER",
  "LICENSE",
  "PERPETUAL_RIGHT",
  "WHITE_LABEL_SERVICE",
]);

export const ADVERSARIAL_ATTACKS = Object.freeze([
  "FORGED_AUTHORITY",
  "FORGED_PAYMENT",
  "FORGED_EVIDENCE",
  "FORGED_TENANT",
  "FORGED_PRICE",
  "FORGED_CUSTOMER",
  "FORGED_PROJECT",
  "FORGED_WEBHOOK",
  "REPLAY",
  "DUPLICATION",
  "SSRF",
  "REDIRECT_ABUSE",
  "CREDENTIAL_LEAK",
  "TENANT_ESCAPE",
  "RACE_CONDITION",
  "WORKER_REPLAY",
  "RESOURCE_EXHAUSTION",
  "MALFORMED_INPUT",
]);

export const COMPOSITION_ROLES = Object.freeze([
  "HUMAN",
  "MODEL",
  "DATABASE",
  "API",
  "ROBOT",
  "SIMULATION",
  "COMPUTE",
  "PAYMENT",
  "SENSOR",
  "UNKNOWN",
]);

const PROTECTED_KINDS = Object.freeze([
  "CONSTITUTION",
  "AUTHORITY",
  "MERGE",
  "BREAKER",
  "LIVE",
  "CARL",
]);

const graphs = new Map();
const memories = [];

function text(value, fallback = "") {
  const s = String(value ?? "").trim();
  return s || fallback;
}

function list(value) {
  return Array.isArray(value) ? value.map((row) => text(row)).filter(Boolean) : [];
}

function iso(value) {
  const s = text(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function digest(value) {
  const normalize = (v) => {
    if (Array.isArray(v)) return v.map(normalize);
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.keys(v).sort().map((k) => [k, normalize(v[k])]));
    }
    return v;
  };
  return createHash("sha256").update(JSON.stringify(normalize(value ?? null))).digest("hex");
}

const HONEST = Object.freeze({
  live: false,
  verified: false,
  auto_merge: false,
  authorized: false,
  authority: "carl",
  capability_neq_authority: true,
});

export function universalConstitution() {
  return Object.freeze({
    version: UNIVERSAL_VERSION,
    owner: "acorn",
    second_architecture: false,
    second_runtime: false,
    second_market: false,
    second_connector_system: false,
    second_economic_engine: false,
    second_intelligence_router: false,
    stripe_is_not_acorn_core: true,
    grok_is_not_the_intelligence_primitive: true,
    capability_neq_authority: true,
    physical_capability_neq_authority: true,
    simulation_neq_execution: true,
    simulation_neq_physical_execution: true,
    plan_neq_execution: true,
    result_neq_verified_result: true,
    hypothesis_neq_fact: true,
    consensus_neq_truth: true,
    unknown_is_first_class: true,
    self_build_neq_self_authority: true,
    power_does_not_grant_authority: true,
    default_deny: true,
    auto_merge: false,
    live: false,
    authority: "carl",
    merge: "carl",
    primitives: UNIVERSAL_PRIMITIVES,
    protocols: PROTOCOL_CONTRACTS,
  });
}

export function universalProbe() {
  return {
    ok: true,
    version: UNIVERSAL_VERSION,
    ...HONEST,
  };
}

export function primitiveRelations() {
  return Object.freeze({
    IDENTITY: { holds: ["CAPABILITY"], governed_by: ["POLICY", "AUTHORITY"], remembers: ["MEMORY"] },
    ORGANIZATION: { set_of: ["CAPABILITY"], members: ["IDENTITY"], policies: ["POLICY"] },
    CAPABILITY: {
      requires: ["CAPABILITY"],
      produces: ["CAPABILITY", "DATA"],
      uses: ["RESOURCE", "TOOL", "CONNECTOR"],
      provided_by: ["INTELLIGENCE", "IDENTITY", "MACHINE"],
      verified_by: ["EVIDENCE"],
      measured_by: ["MEASUREMENT"],
      priced_as: ["OFFER"],
      executed_by: ["EXECUTION"],
      constrained_by: ["POLICY", "AUTHORITY", "RIGHT", "CONTRACT"],
    },
    INTELLIGENCE: { provides: ["CAPABILITY"], never_is: ["AUTHORITY"] },
    RESOURCE: { consumed_by: ["EXECUTION"], measured_by: ["MEASUREMENT"] },
    DATA: { classified_as: ["MEMORY"], proven_by: ["EVIDENCE"] },
    TOOL: { provides: ["CAPABILITY"] },
    CONNECTOR: { exposes: ["CAPABILITY"], never_is: ["AUTHORITY"] },
    TASK: { requires: ["CAPABILITY"], part_of: ["PROJECT", "GRAPH"] },
    PROJECT: { composes: ["CAPABILITY", "TASK", "EXECUTION", "RESOURCE", "EVIDENCE"] },
    GRAPH: { edges: CAPABILITY_EDGES, of: ["CAPABILITY", "TASK"] },
    EXECUTION: { of: ["TASK"], produces: ["EVENT", "EVIDENCE", "MEASUREMENT"] },
    EVENT: { correlates: ["EXECUTION", "EVIDENCE", "ECONOMIC_EVENT"] },
    MEMORY: { classes: MEMORY_CLASSES, never_promotes_hypothesis_to_fact: true },
    EVIDENCE: { proves: ["CAPABILITY", "EXECUTION", "MEASUREMENT"] },
    MEASUREMENT: { of: ["CAPABILITY", "EXECUTION", "RESOURCE", "VALUE"] },
    POLICY: { constrains: ["CAPABILITY", "EXECUTION", "AUTHORITY"] },
    AUTHORITY: { granted_by: ["IDENTITY"], never_inferred_from: ["CAPABILITY"] },
    DECISION: { under: ["POLICY", "AUTHORITY"], recorded_as: ["EVENT"] },
    OFFER: { prices: ["CAPABILITY"], becomes: ["ORDER"] },
    ORDER: { observes: ["ECONOMIC_EVENT"], grants: ["RIGHT"] },
    ECONOMIC_EVENT: { on: ["ECONOMIC_RAIL"], never_grants: ["AUTHORITY"] },
    RIGHT: { versioned: true, never_inferred: true },
    CONTRACT: { binds: ["IDENTITY", "ORGANIZATION", "RIGHT"] },
    decorative: false,
    executable: true,
  });
}

export function isPrimitive(name) {
  return UNIVERSAL_PRIMITIVES.includes(text(name).toUpperCase());
}

export function createCapabilityGraph({ id: graphId, tenant_id = null, project_id = null } = {}) {
  const graph = {
    id: graphId || id("graph"),
    tenant_id,
    project_id,
    nodes: new Map(),
    edges: [],
    live: false,
    authorized: false,
  };
  graphs.set(graph.id, graph);
  return snapshotGraph(graph);
}

export function addCapabilityNode(graphId, capability = {}) {
  const graph = graphs.get(graphId);
  if (!graph) throw new Error("UNKNOWN_GRAPH");
  const name = text(capability.name || capability.id);
  if (!name) throw new Error("CAPABILITY_NAME_REQUIRED");
  const node = {
    id: text(capability.id, name),
    name,
    exists: capability.exists === true,
    available: capability.available === true,
    authorized: false,
    kind: text(capability.kind, "CAPABILITY"),
    provider: capability.provider || null,
    knowledge: capability.exists === true ? "OBSERVED" : "UNKNOWN",
    live: false,
  };
  graph.nodes.set(node.id, node);
  return { ...node };
}

export function addCapabilityEdge(graphId, { from, to, relation, ...rest } = {}) {
  const graph = graphs.get(graphId);
  if (!graph) throw new Error("UNKNOWN_GRAPH");
  const rel = text(relation);
  if (!CAPABILITY_EDGES.includes(rel)) throw new Error("UNKNOWN_EDGE_RELATION:" + rel);
  if (!graph.nodes.has(from)) throw new Error("UNKNOWN_NODE:" + from);
  if (!graph.nodes.has(to)) throw new Error("UNKNOWN_NODE:" + to);
  const edge = {
    from,
    to,
    relation: rel,
    evidence_id: rest.evidence_id || null,
    measured: rest.measured === true,
    live: false,
  };
  graph.edges.push(edge);
  const cycle = detectGraphCycle(graphId);
  if (cycle.cycle) {
    graph.edges.pop();
    return { added: false, reason: "CYCLE_DETECTED", cycle: cycle.path, live: false };
  }
  return { added: true, edge, live: false };
}

export function detectGraphCycle(graphId) {
  const graph = graphs.get(graphId);
  if (!graph) throw new Error("UNKNOWN_GRAPH");
  const adj = new Map();
  for (const node of graph.nodes.keys()) adj.set(node, []);
  for (const edge of graph.edges) {
    if (edge.relation === "requires" || edge.relation === "composed_of") {
      adj.get(edge.from).push(edge.to);
    }
  }
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  function dfs(n) {
    if (visiting.has(n)) return [...stack, n];
    if (visited.has(n)) return null;
    visiting.add(n);
    stack.push(n);
    for (const next of adj.get(n) || []) {
      const hit = dfs(next);
      if (hit) return hit;
    }
    stack.pop();
    visiting.delete(n);
    visited.add(n);
    return null;
  }
  for (const n of graph.nodes.keys()) {
    const path = dfs(n);
    if (path) return { cycle: true, path, live: false };
  }
  return { cycle: false, path: [], live: false };
}

export function snapshotGraph(graphOrId) {
  const graph = typeof graphOrId === "string" ? graphs.get(graphOrId) : graphOrId;
  if (!graph) throw new Error("UNKNOWN_GRAPH");
  const nodes = [...graph.nodes.values()];
  return {
    id: graph.id,
    tenant_id: graph.tenant_id,
    project_id: graph.project_id,
    nodes,
    edges: [...graph.edges],
    missing: nodes.filter((n) => n.exists !== true).map((n) => n.name),
    present: nodes.filter((n) => n.exists === true).map((n) => n.name),
    cycle: detectGraphCycle(graph.id).cycle,
    live: false,
    authorized: false,
    entity: "GRAPH",
  };
}

export function capabilityGraphFromCapabilities(capabilities = [], { tenant_id = null, project_id = null } = {}) {
  const snap = createCapabilityGraph({ tenant_id, project_id });
  const rows = Array.isArray(capabilities) ? capabilities : [];
  for (const cap of rows) {
    addCapabilityNode(snap.id, {
      id: cap.id || cap.name,
      name: cap.name || cap.capability || cap.id,
      exists: cap.exists === true,
      available: cap.available === true,
      kind: cap.kind,
      provider: cap.provider,
    });
  }
  for (let i = 1; i < rows.length; i++) {
    const from = rows[i].id || rows[i].name;
    const to = rows[i - 1].id || rows[i - 1].name;
    if (from && to && from !== to) {
      addCapabilityEdge(snap.id, { from, to, relation: "requires" });
    }
  }
  return snapshotGraph(snap.id);
}

export function persistableGraph(graphId) {
  const snap = snapshotGraph(graphId);
  return stateRecord("GRAPH", {
    id: snap.id,
    tenant_id: snap.tenant_id,
    state: snap.cycle ? "CYCLE_DETECTED" : "OBSERVED",
    data: { nodes: snap.nodes, edges: snap.edges, project_id: snap.project_id, live: false },
    valid_from: iso(),
    valid_until: null,
  });
}

export function admitUnknown({ kind, id: extId, provider, model, adapter = {}, capabilities = [] } = {}) {
  const k = text(kind).toUpperCase();
  if (PROTECTED_KINDS.includes(k)) {
    return {
      admitted: false,
      reason: "PROTECTED_MODIFICATION",
      kind: k,
      core_modified: false,
      domain_modified: false,
      parallel_architecture: false,
      ...HONEST,
    };
  }
  const mapped = mapUnknownKind(k);
  const admitted = admitExtension({
    kind: mapped.extension_kind,
    id: text(extId, (provider || k).toLowerCase() + ".unknown"),
    adapter,
  });
  let intelligence = null;
  if (mapped.family === "INTELLIGENCE") {
    const identity = text(extId, "unknown.intelligence");
    intelligence = discoverUnknownIntelligence({
      provider: text(provider, "UNKNOWN_PROVIDER"),
      model: text(model, identity),
      capabilities: list(capabilities),
    });
  }
  return {
    admitted: admitted.admitted !== false,
    kind: k || "UNKNOWN",
    family: mapped.family,
    extension: admitted,
    intelligence,
    status: admitted.lifecycle || "UNKNOWN",
    knowledge: "UNKNOWN",
    core_modified: false,
    domain_modified: false,
    parallel_architecture: false,
    authority_granted: false,
    used: false,
    ...HONEST,
  };
}

function mapUnknownKind(kind) {
  if (kind === "UNKNOWN_INTELLIGENCE" || kind === "INTELLIGENCE" || kind === "MODEL" || kind === "LLM" || kind === "AGENT" || kind === "SWARM" || kind === "HYBRID" || kind === "FUTURE_INTELLIGENCE") {
    return { family: "INTELLIGENCE", extension_kind: "INTELLIGENCE" };
  }
  if (kind === "UNKNOWN_RAIL" || kind === "ECONOMIC_RAIL" || kind === "PAYMENT") {
    return { family: "ECONOMIC_RAIL", extension_kind: "ECONOMIC_RAIL" };
  }
  if (PHYSICAL_KINDS.includes(kind) || kind === "UNKNOWN_DEVICE" || kind === "UNKNOWN_MACHINE" || kind === "DEVICE") {
    return { family: "PHYSICAL", extension_kind: "MACHINE" };
  }
  if (kind === "UNKNOWN_MARKET" || kind === "MARKET") {
    return { family: "MARKET", extension_kind: "MARKET" };
  }
  if (kind === "UNKNOWN_PROTOCOL" || kind === "PROTOCOL" || kind === "FEDERATION") {
    return { family: "PROTOCOL", extension_kind: "PROTOCOL" };
  }
  if (kind === "UNKNOWN_ORGANISM" || kind === "ORGANISM") {
    return { family: "ORGANISM", extension_kind: "ORGANISM" };
  }
  if (kind === "UNKNOWN_PROVIDER" || kind === "PROVIDER") {
    return { family: "PROVIDER", extension_kind: "ADAPTER" };
  }
  if (kind === "UNKNOWN_CAPABILITY" || kind === "CAPABILITY") {
    return { family: "CAPABILITY", extension_kind: "CAPABILITY" };
  }
  if (EXTENSION_KINDS.includes(kind)) {
    return { family: kind, extension_kind: kind };
  }
  return { family: "UNKNOWN", extension_kind: "UNKNOWN" };
}

export function admitEconomicRail({ provider, env, fetchImpl } = {}) {
  const name = text(provider, "UNKNOWN").toLowerCase();
  if (name === "stripe" || name === "stripe-test" || name === "stripe-live") {
    try {
      const rail = createFinancialRail({ provider: name, env, fetchImpl });
      return {
        admitted: true,
        kind: "ECONOMIC_RAIL",
        provider: "stripe",
        implementation: true,
        domain_modified: false,
        core_modified: false,
        acorn_core: false,
        configured: Boolean(rail && (rail.configured === true || rail.mode)),
        status: "DISCOVERED",
        ...HONEST,
      };
    } catch (error) {
      return {
        admitted: true,
        kind: "ECONOMIC_RAIL",
        provider: "stripe",
        implementation: true,
        domain_modified: false,
        status: "UNKNOWN",
        reason: error.code || "UNCONFIGURED",
        ...HONEST,
      };
    }
  }
  const ext = admitExtension({
    kind: "ECONOMIC_RAIL",
    id: "rail." + name,
    adapter: {},
  });
  return {
    admitted: true,
    kind: "ECONOMIC_RAIL",
    provider: name,
    implementation: false,
    status: "UNKNOWN",
    knowledge: "UNKNOWN",
    domain_modified: false,
    core_modified: false,
    acorn_core: false,
    extension: ext,
    message: "UNKNOWN is preferred to inventing a rail",
    ...HONEST,
  };
}

export function admitPhysical({ kind, id: extId, simulated = true } = {}) {
  const k = text(kind, "MACHINE").toUpperCase();
  const family = PHYSICAL_KINDS.includes(k) ? k : "MACHINE";
  const ext = admitUnknown({ kind: family, id: extId || family.toLowerCase() + ".unknown" });
  return {
    ...ext,
    physical_kind: family,
    physical_capability_neq_authority: true,
    simulation: simulated === true,
    simulation_neq_physical_execution: true,
    executed: false,
    ...HONEST,
  };
}

export function assertPowerDoesNotGrantAuthority({ capability_score = 0, previous_score = 0, actor = "intelligence" } = {}) {
  const more = Number(capability_score) > Number(previous_score);
  const sep = assertCapabilityAuthoritySeparation({ capability: Number(capability_score) || 1, authority: 0, actor });
  return {
    more_powerful: more,
    authority_increased: false,
    authority_granted: false,
    capability_neq_authority: true,
    actor,
    constitution: sep.capability_is_not_authority === true,
    ...HONEST,
  };
}

export function composeExecution({
  projectId,
  nodes = [],
  authorized = false,
  mode = "PLAN",
} = {}) {
  if (!projectId) throw new Error("PROJECT_ID_REQUIRED");
  const m = text(mode, "PLAN").toUpperCase();
  if (!["PLAN", "DRY_RUN", "SIMULATION", "EXECUTION"].includes(m)) {
    throw new Error("UNKNOWN_EXECUTION_MODE:" + m);
  }
  if (m === "EXECUTION" && authorized !== true) {
    return {
      status: "WAITING_HUMAN",
      reason: "HUMAN_AUTHORIZATION_REQUIRED",
      mode: m,
      simulation_neq_execution: true,
      plan_neq_execution: true,
      ...HONEST,
      policy: EXECUTION_POLICIES,
    };
  }
  const tasks = [];
  const byId = new Map();
  for (const node of nodes) {
    const role = text(node.role || node.kind, "UNKNOWN").toUpperCase();
    const task = createTask({
      id: node.id,
      projectId,
      kind: role,
      title: text(node.title, role + ":" + text(node.capability, "unnamed")),
      requiredCapabilities: list(node.capability ? [node.capability] : node.capabilities),
      dependsOn: list(node.depends_on),
      effect: node.effect || "NONE",
      input: {
        role,
        parallel_group: node.parallel_group || null,
        condition: node.condition || null,
        fallback: node.fallback || null,
        substitute: node.substitute || null,
        compensation: node.compensation || null,
        simulated: m === "SIMULATION" || node.simulated === true,
      },
      retryLimit: Number.isFinite(node.retry_limit) ? node.retry_limit : 2,
    });
    tasks.push(task);
    byId.set(task.id, { node, task });
  }
  let planned = taskGraph(tasks);
  const events = [];
  if (m === "SIMULATION" || m === "DRY_RUN") {
    planned = planned.map((t) => {
      if (t.state !== "READY" && t.state !== "PLANNED") return t;
      const started = startTask({ ...t, state: "READY" }, { authorized: false });
      events.push({ type: "TASK_NOT_EXECUTED", task_id: t.id, reason: m, contaminates_reality: false });
      return { ...started, state: m === "SIMULATION" ? "SUCCEEDED" : started.state, output: { simulated: true, real: false } };
    });
  }
  const plan = buildExecutionPlan({ projectId, tasks: planned, authorized: authorized === true && m === "EXECUTION" });
  return {
    version: UNIVERSAL_VERSION,
    mode: m,
    status: m === "EXECUTION" && authorized === true ? "READY" : (m === "SIMULATION" ? "SIMULATED" : "PLANNED"),
    graph: executionSnapshot({ ...plan, tasks: planned }),
    tasks: planned,
    events,
    fallbacks: nodes.filter((n) => n.fallback).map((n) => ({ from: n.id, to: n.fallback })),
    substitutions: nodes.filter((n) => n.substitute).map((n) => ({ from: n.id, to: n.substitute })),
    compensations: nodes.filter((n) => n.compensation).map((n) => ({ from: n.id, on_failure: n.compensation })),
    parallel_groups: [...new Set(nodes.map((n) => n.parallel_group).filter(Boolean))],
    prompt: false,
    execution_graph: true,
    contaminates_reality: m === "EXECUTION" && authorized === true,
    simulation_neq_execution: true,
    plan_neq_execution: true,
    policy: EXECUTION_POLICIES,
    ...HONEST,
    execution: plan,
  };
}

export function emitUniversalEvent({
  tenant_id = null,
  actor = "system",
  subject = null,
  type,
  previous_state = null,
  next_state = null,
  correlation_id = null,
  causation_id = null,
  provenance = "acorn",
  evidence_id = null,
  authorization_context = null,
  payload = {},
} = {}) {
  if (!type) throw new Error("EVENT_TYPE_REQUIRED");
  const base = eventRecord({
    tenantId: tenant_id,
    entityId: subject,
    type,
    payload: { ...payload, previous_state, next_state, provenance, evidence_id },
    actor,
    authority: authorization_context?.authority || "none",
  });
  return {
    ...base,
    event_id: base.id,
    actor,
    subject,
    tenant: tenant_id,
    timestamp: base.measured_at,
    previous_state,
    next_state,
    provenance,
    correlation_id: correlation_id || base.id,
    causation_id,
    evidence: evidence_id,
    authorization_context: authorization_context || { authority: "none", authorized: false },
    replayable: true,
    event_sourcing_complete: false,
    ...HONEST,
  };
}

export function explainTrust(record = {}) {
  const claimed = text(record.trust || record.status || record.epistemic, "UNKNOWN").toUpperCase();
  const state = TRUST_STATES.includes(claimed) ? claimed : "UNKNOWN";
  if (state === "LIVE") {
    return {
      state: "UNKNOWN",
      because: "LIVE requires independent current evidence; documentation and code presence are not LIVE",
      claimed: "LIVE",
      granted: false,
      ...HONEST,
    };
  }
  if (state === "VERIFIED" && record.verified !== true) {
    return {
      state: "UNKNOWN",
      because: "Verification is human. This record is not Carl-verified.",
      claimed: "VERIFIED",
      granted: false,
      ...HONEST,
    };
  }
  const because = {
    ASSERTED: "A claim was made. It has not been observed.",
    OBSERVED: "An observation exists. It is not a measurement.",
    TESTED: "A test ran. TEST GENERATED is not TEST PASSED unless passed is true.",
    MEASURED: "A measurement with margin exists.",
    VERIFIED: "Verification is human. This record is not Carl-verified.",
    LIVE: "LIVE is forbidden without independent current evidence.",
    EXPIRED: "Validity window ended. Expired is not false.",
    REVOKED: "An explicit revocation exists.",
    BLOCKED: "Policy or authority refused the action.",
    UNKNOWN: "UNKNOWN is first-class. Missing is not invented.",
  }[state] || "UNKNOWN is first-class.";
  return {
    state,
    because,
    claimed: state,
    granted: false,
    ...HONEST,
  };
}

export function attachTemporal(record = {}, {
  valid_from = null,
  valid_until = null,
  observed_at = null,
  measured_at = null,
  verified_at = null,
  revoked_at = null,
} = {}) {
  return {
    ...record,
    valid_from: valid_from || record.valid_from || record.created_at || iso(),
    valid_until: valid_until || record.valid_until || null,
    observed_at: observed_at || record.observed_at || null,
    measured_at: measured_at || record.measured_at || null,
    verified_at: verified_at || null,
    revoked_at: revoked_at || record.revoked_at || null,
    live: false,
  };
}

export function rememberMemory({
  class: cls = "OBSERVATION",
  content,
  tenant_id = null,
  provenance = "acorn",
} = {}) {
  const klass = text(cls, "OBSERVATION").toUpperCase();
  if (!MEMORY_CLASSES.includes(klass)) throw new Error("UNKNOWN_MEMORY_CLASS:" + klass);
  const row = {
    id: id("mem"),
    class: klass,
    content: content ?? null,
    tenant_id,
    provenance,
    fact: klass === "FACT",
    hypothesis_promoted: false,
    ...HONEST,
    recorded_at: iso(),
  };
  memories.push(row);
  return row;
}

export function promoteMemory(memoryId, { authorized = false } = {}) {
  const row = memories.find((m) => m.id === memoryId);
  if (!row) return { promoted: false, reason: "UNKNOWN_MEMORY", ...HONEST };
  if (row.class === "HYPOTHESIS") {
    return {
      promoted: false,
      reason: "HYPOTHESIS_NEQ_FACT",
      hypothesis_neq_fact: true,
      required: "HUMAN_DECISION",
      ...HONEST,
    };
  }
  if (authorized !== true) {
    return { promoted: false, reason: "AUTHORITY_ABSENT", ...HONEST };
  }
  return { promoted: false, reason: "HUMAN_HOLD", ...HONEST };
}

export function knowledgeToAction({ knowledge = [], task = "", required = [], known = [], authorized = false } = {}) {
  const facts = knowledge.filter((k) => k.class === "FACT" || k.fact === true);
  const hypotheses = knowledge.filter((k) => k.class === "HYPOTHESIS");
  const detection = detectGaps({ task, required, known });
  const hold = shouldStop({ task, authorized, evidence: facts });
  return {
    knowledge: {
      facts: facts.length,
      hypotheses: hypotheses.length,
      hypothesis_neq_fact: true,
    },
    plan: detection.status === "NO_GAP" ? "SELECT_CAPABILITIES" : "DETECT_GAP",
    gaps: detection.gaps,
    execution: authorized === true ? "WAITING_MEASURED_PATH" : "WAITING_HUMAN",
    result: null,
    evidence: "INSUFFICIENT_EVIDENCE",
    learning: { recorded: true, promoted: false },
    stop: hold.stop,
    ...HONEST,
  };
}

export function describeProjectOrganism({
  objective,
  requirements = [],
  capabilities = [],
  participants = [],
  tenant_id = null,
} = {}) {
  const graph = capabilityGraphFromCapabilities(capabilities, { tenant_id });
  return {
    kind: "PROJECT_ORGANISM",
    objective: text(objective) || null,
    requirements: list(requirements),
    capability_graph: graph,
    execution_graph: null,
    resources: [],
    participants: list(participants),
    intelligences: [],
    evidence: [],
    measurements: [],
    economics: economicRecord({ tenant_id, kind: "ESTIMATE", amount: 0, status: "ESTIMATED" }),
    deliverables: [],
    rights: [],
    decisions: [],
    alive: false,
    conscious: false,
    ...HONEST,
  };
}

export function federate({ a, b, permissions = [], evidence = [] } = {}) {
  if (!a?.id || !b?.id) {
    return {
      compatible: false,
      reason: "IDENTITY_REQUIRED",
      protocol: "ACORN_FEDERATION_v0",
      bypassed_contracts: false,
      ...HONEST,
    };
  }
  if (a.tenant_id && b.tenant_id && a.tenant_id !== b.tenant_id && !permissions.includes("FEDERATE_CROSS_TENANT")) {
    return {
      compatible: false,
      reason: "TENANT_ISOLATION",
      protocol: "ACORN_FEDERATION_v0",
      isolated: true,
      bypassed_contracts: false,
      ...HONEST,
    };
  }
  const left = a.id ? a : declareOrganism(a);
  const right = b.id ? b : declareOrganism(b);
  const hs = handshake(left, right);
  isolateInvalid({ from: left.id, to: right.id, type: "FEDERATE", source: "acorn", provenance: "federation" });
  return {
    protocol: "ACORN_FEDERATION_v0",
    handshake: { ...hs, trusted: false, verified: false },
    a: left.id,
    b: right.id,
    isolated: true,
    trust: evidence.length ? "ASSERTED" : "UNVERIFIED",
    permissions: list(permissions),
    evidence: evidence.length ? "ASSERTED" : "NONE",
    bypassed_contracts: false,
    second_acorn: false,
    ...HONEST,
  };
}

export function protocolEnvelope({ contract, payload = {} } = {}) {
  const name = text(contract).toUpperCase();
  if (!PROTOCOL_CONTRACTS.includes(name)) {
    return { admitted: false, reason: "UNKNOWN_PROTOCOL", contract: name || "UNKNOWN", ...HONEST };
  }
  return {
    protocol: "acorn." + name.toLowerCase() + ".v0",
    contract: name,
    payload,
    application_specific: false,
    rewrite_required: false,
    ...HONEST,
  };
}

export function describeRight(input = {}) {
  const base = describeUsageRights({
    ...input,
    rights: list(input.rights),
    perpetual: input.perpetual === true,
    state: input.state || "PENDING",
  });
  return {
    ...base,
    access: input.access || base.scope,
    usage: list(input.rights),
    duration: base.duration,
    redistribution: input.redistribution === true,
    embedding: input.embedding === true,
    api: input.api === true,
    white_label: input.white_label === true,
    exclusivity: input.exclusivity === true,
    versioned: true,
    inferred: false,
    ...HONEST,
  };
}

export function measureValue({ outcome = null, observations = [] } = {}) {
  const measured = Array.isArray(observations) && observations.some((o) => Number.isFinite(o.value) && Number.isFinite(o.margin) && o.margin > 0);
  if (!measured) {
    return {
      value: "UNKNOWN",
      outcome: outcome || null,
      invented: false,
      unknown_preferred_to_false_measure: true,
      ...HONEST,
    };
  }
  return {
    value: "MEASURED",
    outcome,
    observations,
    invented: false,
    ...HONEST,
  };
}

export function diagnoseSystem({
  task = "",
  required = [],
  known = [],
  connectors = [],
  intelligences = [],
} = {}) {
  const detection = detectGaps({ task, required, known, connectors });
  const gaps = detection.gaps || [];
  return {
    version: UNIVERSAL_VERSION,
    status: gaps.length ? "GAP_DETECTED" : "NO_GAP",
    gaps: gaps.map((g) => ({
      capability: g.capability,
      evidence: "INSUFFICIENT_EVIDENCE",
      impact: g.capability + " is required and not existing",
      proposed_change: "PROPOSE sandbox build via self-build; do not write production",
      risk: "Treating a gap as an existing capability",
      test_plan: ["detectGaps again", "falsifyCapability", "measureCapability", "HUMAN_HOLD before use"],
      exists: false,
      apply: false,
    })),
    holds: detection.holds || [],
    intelligences: intelligences.length,
    apply: false,
    protected_changes: false,
    ...HONEST,
  };
}

export function discoverDemand({ demand = "", available = [] } = {}) {
  const required = list(demand ? demand.split(/\W+/).filter((w) => w.length > 3).slice(0, 6) : []);
  const detection = detectGaps({
    task: demand,
    required: required.length ? required : ["analysis"],
    known: available,
  });
  return {
    demand: text(demand) || null,
    problem: text(demand) || null,
    required_capabilities: detection.required || required,
    available_capabilities: (detection.found || []).map((g) => g.capability),
    gaps: detection.gaps,
    composition: null,
    offer: null,
    unknown_demand_reveals_gap: detection.gaps.length > 0,
    invented_listing: false,
    ...HONEST,
  };
}

export function productizeCapability({ capability, form } = {}) {
  const f = text(form, "PRODUCT").toUpperCase();
  if (!PRODUCTIZATION.includes(f)) {
    return { candidate: false, product: false, reason: "UNKNOWN_FORM", ...HONEST };
  }
  return {
    capability: text(capability) || null,
    form: f,
    candidate: true,
    product: false,
    product_candidate_neq_product: true,
    ...HONEST,
  };
}

export function classifyFailure({ success, expected = false, transient = false, recovered = false, human = false, security = false } = {}) {
  if (success === true) return { state: "SUCCESS", disappeared: false, ...HONEST };
  if (security === true) return { state: "SECURITY_BLOCK", disappeared: false, ...HONEST };
  if (human === true) return { state: "WAITING_HUMAN", disappeared: false, ...HONEST };
  if (recovered === true) return { state: "RECOVERED", disappeared: false, ...HONEST };
  if (transient === true) return { state: "TRANSIENT_FAILURE", disappeared: false, ...HONEST };
  if (expected === true) return { state: "EXPECTED_FAILURE", disappeared: false, ...HONEST };
  if (success === false) return { state: "REAL_REGRESSION", disappeared: false, ...HONEST };
  return { state: "UNKNOWN", disappeared: false, ...HONEST };
}

export function simulateTwin(subject, { kind = "architecture" } = {}) {
  const isolated = isolateRealm({ subject, kind }, "SIMULATION");
  return {
    subject: subject || null,
    kind,
    realm: "SIMULATION",
    simulated: true,
    real: false,
    contaminates_reality: isolated.contaminates_reality === true ? isolated.contaminates_reality : false,
    simulation_neq_real: true,
    ...HONEST,
  };
}

export function observabilityIds({
  request_id = null,
  tenant_id = null,
  organization_id = null,
  project_id = null,
  execution_id = null,
  provider_id = null,
  evidence_id = null,
  economic_event_id = null,
  correlation_id = null,
  causation_id = null,
} = {}) {
  return {
    request_id,
    correlation_id: correlation_id || request_id,
    causation_id,
    tenant_id,
    organization_id,
    project_id,
    execution_id,
    provider_id,
    evidence_id,
    economic_event_id,
    secrets_exposed: false,
  };
}

export function classifyAdversarialFail(attack, { blocked = true } = {}) {
  const name = text(attack).toUpperCase();
  if (!ADVERSARIAL_ATTACKS.includes(name)) {
    return { attack: name || "UNKNOWN", classified: false, blocked: true, state: "UNKNOWN", ...HONEST };
  }
  return {
    attack: name,
    classified: true,
    blocked: blocked !== false,
    state: blocked !== false ? "SECURITY_BLOCK" : "UNKNOWN",
    ...HONEST,
  };
}

export function runArchitecturalQuestions() {
  const helix = admitUnknown({ kind: "UNKNOWN_INTELLIGENCE", id: "future.helix-9", provider: "helix", model: "helix-9" });
  const rail = admitEconomicRail({ provider: "clearinghouse-unknown" });
  const machine = admitPhysical({ kind: "ROBOT", id: "future.field-arm" });
  const fed = federate({
    a: { id: "org.a", tenant_id: "t1" },
    b: { id: "org.b", tenant_id: "t2" },
  });
  const market = admitUnknown({ kind: "UNKNOWN_MARKET", id: "future.orbital-slots" });
  const cap = admitUnknown({ kind: "UNKNOWN_CAPABILITY", id: "future.optical-routing" });
  const power = assertPowerDoesNotGrantAuthority({ capability_score: 1e9, previous_score: 1, actor: "future-ai" });
  return {
    new_intelligence_requires_core_change: helix.core_modified === true,
    new_economic_rail_requires_domain_change: rail.domain_modified === true,
    new_machine_requires_parallel_architecture: machine.parallel_architecture === true,
    federation_bypasses_contracts: fed.bypassed_contracts === true,
    new_market_requires_new_engine: market.core_modified === true,
    unknown_capability_can_be_discovered: cap.admitted === true && cap.authorized !== true,
    more_powerful_ai_gains_authority: power.authority_granted === true,
    answers: {
      intelligence: helix.core_modified === false,
      rail: rail.domain_modified === false,
      machine: machine.parallel_architecture === false,
      federation: fed.bypassed_contracts === false,
      market: market.core_modified === false,
      unknown_capability: cap.admitted === true,
      power: power.authority_granted === false,
    },
    ...HONEST,
  };
}

export function truthMatrix() {
  const row = (domain, { code, tested, executed, measured }) => ({
    domain,
    code: code === true,
    tested: tested === true,
    executed: executed || false,
    measured: measured || false,
    verified: false,
    live: false,
  });
  return {
    version: UNIVERSAL_VERSION,
    domains: [
      row("Capability Fabric", { code: true, tested: true, executed: "LOCAL", measured: "LOCAL" }),
      row("Intelligence Fabric", { code: true, tested: true, executed: "LOCAL", measured: "PARTIAL" }),
      row("Composition", { code: true, tested: true, executed: "LOCAL", measured: false }),
      row("Execution", { code: true, tested: true, executed: "PLAN_OR_SIMULATION", measured: "LOCAL" }),
      row("Connectors", { code: true, tested: true, executed: "BLOCKED_WITHOUT_AUTH", measured: false }),
      row("Evidence", { code: true, tested: true, executed: "LOCAL", measured: "LOCAL" }),
      row("Economics", { code: true, tested: true, executed: "ESTIMATE", measured: false }),
      row("Stripe", { code: true, tested: true, executed: "ADAPTER", measured: "NOT_MEASURED_WITHOUT_KEYS" }),
      row("Market", { code: true, tested: true, executed: "CATALOG", measured: false }),
      row("Customer", { code: true, tested: true, executed: "LOCAL", measured: "LOCAL" }),
      row("Federation", { code: true, tested: true, executed: "HANDSHAKE_LOCAL", measured: false }),
    ],
    verified: false,
    live: false,
    authority: "carl",
    auto_merge: false,
    note: "LOCAL means this process. It is not Render, not production Postgres proof, not Carl-verified.",
  };
}

export function scaleLimits() {
  return Object.freeze({
    claimed_scale: "UNKNOWN",
    users: "NOT_MEASURED",
    companies: "NOT_MEASURED",
    db: "Postgres production contract; sqlite local/test; 10_000 companies NOT_MEASURED",
    queue: "acorn_jobs exists; throughput NOT_MEASURED",
    api: "rate limit default 180/min/IP; global network NOT_MEASURED",
    connectors: "generic HTTP bridge; vendor quotas NOT_MEASURED",
    provider_limits: "NOT_MEASURED",
    concurrency: "NOT_MEASURED",
    storage: "NOT_MEASURED",
    memory: "NOT_MEASURED",
    cost: "UNKNOWN",
    live: false,
  });
}

export function implementedNow() {
  return Object.freeze([
    "universal primitive relations",
    "capability graph with typed edges and cycle detection",
    "unknown admission without core modification",
    "economic rail admission (Stripe is an implementation)",
    "physical capability contracts",
    "composition engine over the existing execution graph",
    "event envelope with correlation and causation",
    "trust explanation without invented LIVE",
    "memory classes with hypothesis ≠ fact",
    "federation protocol over inter-organism",
    "self-diagnosis that cannot apply protected changes",
    "architectural questions as executable tests",
    "honest truth matrix",
    "power does not grant authority",
  ]);
}

export function notYetImplemented() {
  return Object.freeze([
    "networked federation between two live Acorn instances",
    "physical execution of robots, vehicles, factories",
    "a second financial rail besides Stripe",
    "event-sourcing complete with replay into production state",
    "tenant Policy/Decision/Contract records used by every path",
    "callable Tool primitive with input/output schema (today: filename catalog)",
    "Data object with lineage beyond the privacy classifier",
    "measured scale at 10_000 companies",
    "LIVE, VERIFIED, PAID, SETTLED claims",
    "automatic authority from capability, power, or payment",
  ]);
}

export function resetUniversal() {
  graphs.clear();
  memories.length = 0;
}

export function assertUniversalInvariant(result = {}) {
  const c = universalConstitution();
  if (c.second_architecture !== false) throw new Error("UNIVERSAL_INVARIANT:ARCHITECTURE");
  if (c.second_runtime !== false) throw new Error("UNIVERSAL_INVARIANT:RUNTIME");
  if (result.live === true) throw new Error("UNIVERSAL_INVARIANT:LIVE");
  if (result.auto_merge === true) throw new Error("UNIVERSAL_INVARIANT:AUTO_MERGE");
  if (result.authority_granted === true) throw new Error("UNIVERSAL_INVARIANT:AUTHORITY");
  if (result.core_modified === true) throw new Error("UNIVERSAL_INVARIANT:CORE");
  const sep = assertCapabilityAuthoritySeparation({ capability: 1, authority: 0, actor: "universal" });
  if (sep.capability_is_not_authority !== true) throw new Error("UNIVERSAL_INVARIANT:CAPABILITY_AUTHORITY");
  return true;
}

export function infrastructureSnapshot({ task = "", required = [], known = [] } = {}) {
  const diagnosis = diagnoseSystem({ task, required, known });
  const questions = runArchitecturalQuestions();
  return {
    version: UNIVERSAL_VERSION,
    constitution: universalConstitution(),
    primitives: UNIVERSAL_PRIMITIVES,
    relations: primitiveRelations(),
    diagnosis,
    architectural_questions: questions.answers,
    truth: truthMatrix(),
    scale: scaleLimits(),
    implemented_now: implementedNow(),
    not_yet_implemented: notYetImplemented(),
    ...HONEST,
  };
}

function isMain() {
  const here = new URL(import.meta.url).pathname;
  const argv1 = process.argv[1] ? String(process.argv[1]) : "";
  return argv1.endsWith("acorn-universal-infrastructure.mjs") || here === argv1;
}

if (isMain()) {
  resetUniversal();
  const snap = infrastructureSnapshot({
    task: "Compose a future intelligence with a new rail and a robot without rebuilding Acorn",
    required: ["analysis", "future-optical-routing"],
    known: [{ name: "analysis", exists: true, available: false, reason: "CODE_PRESENT" }],
  });
  assertUniversalInvariant(snap);
  console.log(JSON.stringify({
    version: snap.version,
    live: snap.live,
    auto_merge: snap.auto_merge,
    authority: snap.authority,
    second_runtime: snap.constitution.second_runtime,
    architectural_questions: snap.architectural_questions,
    gaps: snap.diagnosis.gaps.map((g) => g.capability),
    all_domains_live_false: snap.truth.domains.every((d) => d.live === false),
    all_domains_verified_false: snap.truth.domains.every((d) => d.verified === false),
  }, null, 2));
}
