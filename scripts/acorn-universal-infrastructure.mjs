#!/usr/bin/env node
/**
 * ACORN UNIVERSAL INFRASTRUCTURE KERNEL
 *
 * One substrate over the fabrics that already exist. Not a second registry,
 * brain, mesh, or bridge. Providers are adapters. Capability is not authority.
 *
 * MAIN = REALITY. AUTO_MERGE = FALSE. LIVE = CARL ONLY. ε=0 IS A LIE.
 */
import { createHash } from "node:crypto";
import {
  intelligenceAdapter,
  routeByCapability as routeOpenIntelligence,
} from "../sdk/open-intelligence.js";
import {
  composeFromRegistry,
  executeCapability,
  executeRegistryTask,
  listCapabilities,
  registerCapability,
  resetCapabilityRegistry,
  routeByCapability as routeRegistry,
} from "./acorn-capability-registry.mjs";
import {
  buildExecutionPlan,
  completeTask,
  createTask,
  nextRunnableTasks,
  recordExecutionEvent,
  startTask,
  taskGraph,
} from "./acorn-execution-fabric.mjs";
import { registerEvidence, evidenceIsCurrent } from "./acorn-evidence-registry.mjs";
import { runMarketCycle } from "./acorn-market-engine.mjs";
import { commercialRuntimeSnapshot } from "./acorn-commercial-runtime.mjs";
import { honestStatus as connectorHonest } from "./acorn-connector-flux.mjs";
import { assertCapabilityAuthoritySeparation } from "./acorn-constitution.mjs";

export const UNIVERSAL_INFRASTRUCTURE_VERSION = "acorn.universal-infrastructure.v1";
export const PUBLIC_API_VERSION = "acorn.public.v1";

export const OBJECT_KINDS = Object.freeze([
  "Intelligence", "Capability", "Tool", "DataSource", "Connector", "Machine",
  "Organization", "Human", "Project", "Task", "Offer", "EconomicResource",
  "Evidence", "Measurement", "Decision", "Authority",
]);

export const TRUTH_STATES = Object.freeze([
  "DEFINED", "CODE_PRESENT", "TESTED", "EXECUTED", "MEASURED", "VERIFIED",
  "LIVE", "EXPIRED", "REVOKED", "BLOCKED", "UNKNOWN",
]);

export const FAKE_LABELS = Object.freeze([
  "LIVE", "READY", "CONNECTED", "VERIFIED", "CERTIFIED", "PAID", "DEPLOYED",
]);

export const SENSITIVE_ACTIONS = Object.freeze([
  "MONEY", "REFUND", "PAYOUT", "PRICE_CHANGE", "CONTRACT", "SIGN",
  "DELETE", "PUBLISH", "WRITE_PROTECTED", "MERGE",
]);

export const RESOURCE_KINDS = Object.freeze([
  "COMPUTE", "STORAGE", "NETWORK", "TOKENS", "TIME", "MONEY",
  "HUMAN_ATTENTION", "EXTERNAL_API_USAGE", "ENERGY",
]);

export const EXECUTION_MODES = Object.freeze([
  "synchronous", "asynchronous", "queued", "scheduled", "long-running",
  "multi-step", "multi-provider", "human-in-the-loop",
]);

export const COGNITION_ROLES = Object.freeze([
  "PROPOSER", "REVIEW", "FALSIFY", "MEASURE", "VERIFY",
]);

const UNKNOWN = "UNKNOWN";
const NOT_MEASURED = "NOT_MEASURED";
const executions = new Map();
const memory = new Map();

function text(v) {
  return String(v ?? "").trim();
}

function iso(v) {
  const s = text(v);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex");
}

export function infrastructureConstitution() {
  return Object.freeze({
    version: UNIVERSAL_INFRASTRUCTURE_VERSION,
    second_architecture: false,
    second_registry: false,
    second_bridge: false,
    provider_is_adapter: true,
    capability_neq_authority: true,
    identity_neq_capability: true,
    identity_neq_authority: true,
    identity_neq_provenance: true,
    identity_neq_trust: true,
    optimization_neq_authority: true,
    self_build_neq_self_authority: true,
    simulated_neq_executed: true,
    consensus_neq_truth: true,
    preview_neq_receipt: true,
    auto_merge: false,
    live: false,
    authority: "carl",
    ai_write: "DENIED",
    ai_merge: "DENIED",
  });
}

export function makeObject(kind, input = {}, proof = {}) {
  const type = OBJECT_KINDS.includes(kind) ? kind : UNKNOWN;
  const observed = iso(input.observed_at || input.at);
  return {
    kind: type,
    identity: text(input.identity || input.id) || id(type.toLowerCase()),
    provenance: {
      source: text(input.source) || UNKNOWN,
      hash: text(input.provenance_hash) || digest({ kind: type, identity: input.identity }),
      invented: false,
    },
    version: text(input.version) || UNIVERSAL_INFRASTRUCTURE_VERSION,
    temporal: temporalObservation({
      what: type,
      source: input.source,
      when: observed,
      conditions: input.conditions,
      margin: input.margin,
      until: input.valid_until || input.until,
      changed_since: input.changed_since,
    }),
    capability: Array.isArray(input.capabilities) ? input.capabilities : (input.capability ? [input.capability] : []),
    constraints: input.constraints && typeof input.constraints === "object" ? input.constraints : {},
    dependencies: Array.isArray(input.dependencies) ? input.dependencies : [],
    state: refuseFakeLabel(input.state) || "DEFINED",
    evidence: proof.evidence || input.evidence || null,
    measurement: proof.measured === true ? (input.measurement || { status: "MEASURED" }) : { status: NOT_MEASURED },
    objections: Array.isArray(input.objections) ? input.objections : [],
    authority_boundary: {
      authority: false,
      grants: [],
      denied: SENSITIVE_ACTIONS.slice(),
      actor: "none",
    },
    distinctions: {
      identity_is_not_capability: true,
      capability_is_not_authority: true,
      authority_is_not_provenance: true,
      provenance_is_not_trust: true,
    },
    live: false,
  };
}

export function refuseFakeLabel(label, { event = null, actor = null, evidence = null } = {}) {
  const s = text(label).toUpperCase();
  if (!s) return UNKNOWN;
  if (s === "READY") return "DEFINED";
  if (s === "LIVE") return UNKNOWN;
  if (s === "CERTIFIED") return UNKNOWN;
  if (s === "VERIFIED" && !(evidence && evidence.independent === true)) return UNKNOWN;
  if (s === "PAID" && !(event && event.type === "PAYMENT_OBSERVED" && evidence)) return UNKNOWN;
  if (s === "CONNECTED" && !(event && event.observed === true)) return UNKNOWN;
  if (s === "DEPLOYED" && actor !== "carl") return UNKNOWN;
  if (FAKE_LABELS.includes(s) && !event) return UNKNOWN;
  if (!TRUTH_STATES.includes(s)) return UNKNOWN;
  return s;
}

export function transitionTruth(current, next, event = {}) {
  const from = TRUTH_STATES.includes(current) ? current : UNKNOWN;
  const wanted = text(next).toUpperCase();
  if (wanted === "LIVE") {
    return { state: from, accepted: false, reason: "LIVE_IS_CARL_ONLY", live: false };
  }
  if (wanted === "VERIFIED" && event.independent !== true) {
    return { state: from, accepted: false, reason: "SELF_VERIFICATION_REFUSED", live: false };
  }
  if (wanted === "EXECUTED" && event.mode === "SIMULATION") {
    return { state: from, accepted: false, reason: "SIMULATED_NEQ_EXECUTED", live: false };
  }
  if (wanted === "MEASURED" && event.measured !== true) {
    return { state: from, accepted: false, reason: "NOT_MEASURED", live: false };
  }
  if (wanted === "PAID" && event.type !== "PAYMENT_OBSERVED") {
    return { state: from, accepted: false, reason: "PAYMENT_NOT_OBSERVED", live: false };
  }
  if (wanted === "EXPIRED") {
    return { state: "EXPIRED", accepted: true, reason: "VALID_UNTIL_PASSED", false_forever: false, live: false };
  }
  if (wanted === "REVOKED" && event.actor !== "carl") {
    return { state: from, accepted: false, reason: "REVOKE_REQUIRES_HUMAN", live: false };
  }
  const allowed = {
    UNKNOWN: ["DEFINED", "BLOCKED", "EXPIRED", "REVOKED"],
    DEFINED: ["CODE_PRESENT", "BLOCKED", "EXPIRED", "REVOKED", "UNKNOWN"],
    CODE_PRESENT: ["TESTED", "BLOCKED", "EXPIRED", "REVOKED"],
    TESTED: ["EXECUTED", "BLOCKED", "EXPIRED", "REVOKED"],
    EXECUTED: ["MEASURED", "BLOCKED", "EXPIRED", "REVOKED"],
    MEASURED: ["VERIFIED", "BLOCKED", "EXPIRED", "REVOKED"],
    VERIFIED: ["EXPIRED", "REVOKED", "BLOCKED"],
    EXPIRED: ["DEFINED", "REVOKED", "UNKNOWN"],
    REVOKED: ["UNKNOWN"],
    BLOCKED: ["DEFINED", "REVOKED", "UNKNOWN"],
  };
  const nextState = TRUTH_STATES.includes(wanted) ? wanted : UNKNOWN;
  if (!(allowed[from] || []).includes(nextState)) {
    return { state: from, accepted: false, reason: "TRANSITION_NOT_GROUNDED", live: false };
  }
  return { state: nextState, accepted: true, event: event.type || UNKNOWN, live: false };
}

export function temporalObservation(input = {}) {
  const margin = Number(input.margin);
  return {
    what: text(input.what) || UNKNOWN,
    source: text(input.source || input.who) || UNKNOWN,
    when: iso(input.when),
    conditions: text(input.conditions) || UNKNOWN,
    margin: Number.isFinite(margin) && margin > 0 ? margin : UNKNOWN,
    until: input.until ? iso(input.until) : null,
    changed_since: input.changed_since || null,
    expired: input.until ? Date.parse(input.until) < Date.now() : false,
    expired_is_not_false_forever: true,
    live: false,
  };
}

export function createUniversalAdapter(partial = {}) {
  const adapter = intelligenceAdapter({
    id: partial.id,
    provider: partial.provider || UNKNOWN,
    model: partial.model,
    capabilities: partial.capabilities,
    protocol: partial.protocol,
    timeout_ms: partial.timeout_ms,
    cost: partial.cost,
    transport: partial.transport,
  });
  adapter.authority = false;
  adapter.live = false;
  return adapter;
}

export function routeAdaptive({
  need,
  required = [],
  adapters = [],
  constraints = {},
  policy = "FREE_FIRST",
} = {}) {
  const routed = routeOpenIntelligence(
    { need, required_capabilities: required },
    adapters,
    { policy, PAID_FORBIDDEN: policy === "PAID_FORBIDDEN" },
  );
  const scored = routed.map((row, index) => {
    const adapter = adapters.find((a) => a.id === row.id) || {};
    const fit = required.length
      ? required.filter((cap) => (adapter.capabilities || []).includes(cap)).length
      : 1;
    const latency = Number(constraints.max_latency_ms);
    const adapterLatency = Number(adapter.latency_ms);
    const latencyOk = !Number.isFinite(latency) || !Number.isFinite(adapterLatency) || adapterLatency <= latency;
    return { ...row, score: latencyOk ? fit : 0, latency_ok: latencyOk, index };
  }).filter((row) => row.score > 0 || !required.length);
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return {
    selected: scored[0] || null,
    candidates: scored,
    policy,
    optimization_is_not_authority: true,
    crossed_policy: false,
    provider_preference: null,
    live: false,
    authority: false,
  };
}

function capabilityAvailable(row) {
  return ["EXECUTABLE", "VERIFIED", "PROVEN", "SWARM_ELIGIBLE", "MEASURED"].includes(row.status) && row.backend;
}

export function composeProblem({
  problem = "",
  required = [],
  policy = "FREE_FIRST",
  human_authorization = false,
  mode = "EXECUTION",
} = {}) {
  const composition = composeFromRegistry({ intent: problem, required, policy, human_authorization });
  const needs = composition.required.length ? composition.required : required;
  const catalog = listCapabilities();
  const available = catalog.filter((row) => needs.some((need) => {
    const blob = `${row.subcategory} ${row.type} ${(row.capabilities || []).join(" ")}`.toLowerCase();
    return blob.includes(String(need).toLowerCase());
  }) && capabilityAvailable(row));
  const missing = needs.filter((need) => !available.some((row) => {
    const blob = `${row.subcategory} ${row.type} ${(row.capabilities || []).join(" ")}`.toLowerCase();
    return blob.includes(String(need).toLowerCase());
  }));
  const steps = needs.map((need, index) => {
    const primary = available.find((row) => {
      const blob = `${row.subcategory} ${row.type} ${(row.capabilities || []).join(" ")}`.toLowerCase();
      return blob.includes(String(need).toLowerCase());
    }) || null;
    const substitute = available.find((row) => primary && row.capability_id !== primary.capability_id && row.category === primary.category) || null;
    return {
      id: `step_${index + 1}`,
      need,
      primary: primary ? primary.capability_id : null,
      fallback: substitute ? substitute.capability_id : null,
      equivalent_invented: false,
      depends_on: index ? [`step_${index}`] : [],
      parallel_group: substitute && !index ? 0 : index,
    };
  });
  const graph = {
    nodes: steps.map((step) => step.id),
    edges: steps.flatMap((step) => step.depends_on.map((dep) => ({ from: dep, to: step.id }))),
  };
  return {
    problem: text(problem) || UNKNOWN,
    required: needs,
    available: available.map((row) => row.capability_id),
    missing,
    unavailable_is_not_equivalent: missing.length > 0,
    steps,
    graph,
    composition,
    mode: mode === "SIMULATION" || mode === "DRY_RUN" || mode === "PLAN" ? mode : "EXECUTION",
    simulated: mode === "SIMULATION" || mode === "DRY_RUN",
    executed: false,
    live: false,
    auto_merge: false,
    authority: false,
  };
}

export async function runComposition({
  problem = "",
  required = [],
  policy = "FREE_FIRST",
  human_authorization = false,
  mode = "EXECUTION",
  idempotency_key = null,
  env = process.env,
} = {}) {
  if (idempotency_key && executions.has(idempotency_key)) {
    return executions.get(idempotency_key);
  }
  const plan = composeProblem({ problem, required, policy, human_authorization, mode });
  const events = [];
  const steps = [];
  let failed = null;
  for (const step of plan.steps) {
    if (!step.primary) {
      steps.push({
        ...step,
        status: "HOLD_HUMAN",
        reason: "CAPABILITY_UNAVAILABLE",
        equivalent_invented: false,
        provenance: { step: step.id, observed_at: iso() },
      });
      failed = step.need;
      continue;
    }
    if (plan.simulated) {
      const simulated = {
        ...step,
        status: "SIMULATED",
        executed: false,
        provenance: { step: step.id, mode: "SIMULATION", observed_at: iso() },
      };
      steps.push(simulated);
      events.push(recordExecutionEvent({ executionId: plan.problem, taskId: step.id, type: "SIMULATED", payload: { need: step.need } }));
      continue;
    }
    let run = await executeCapability({
      capability_id: step.primary,
      intent: problem,
      task: { intent: problem, required_capabilities: [step.need] },
      human_authorization,
      env,
    });
    if (!["VERIFIED", "PROVEN", "EXECUTED"].includes(run.status) && step.fallback) {
      run = await executeCapability({
        capability_id: step.fallback,
        intent: problem,
        task: { intent: problem, required_capabilities: [step.need] },
        human_authorization,
        env,
      });
      steps.push({
        ...step,
        used: step.fallback,
        substituted: true,
        status: run.status,
        executed: ["VERIFIED", "PROVEN", "EXECUTED"].includes(run.status),
        provenance: { step: step.id, capability_id: step.fallback, observed_at: iso() },
        result: run,
      });
    } else {
      steps.push({
        ...step,
        used: step.primary,
        substituted: false,
        status: run.status,
        executed: ["VERIFIED", "PROVEN", "EXECUTED"].includes(run.status),
        provenance: { step: step.id, capability_id: step.primary, observed_at: iso() },
        result: run,
      });
    }
    events.push(recordExecutionEvent({
      executionId: plan.problem,
      taskId: step.id,
      type: run.status,
      payload: { need: step.need, capability_id: step.primary },
    }));
    if (!["VERIFIED", "PROVEN", "EXECUTED", "HOLD_HUMAN"].includes(run.status)) {
      failed = step.need;
    }
  }
  const executed = !plan.simulated && steps.some((step) => step.executed === true);
  const result = {
    execution_id: id("uinf"),
    idempotency_key,
    plan,
    steps,
    events,
    status: plan.simulated ? "SIMULATED" : (executed ? "EXECUTED" : (failed ? "HOLD_HUMAN" : "INCONCLUSIVE")),
    executed,
    simulated: plan.simulated,
    compensation: failed ? { required: true, failed_need: failed, invented_success: false } : { required: false },
    evidence: steps.filter((step) => step.executed).map((step) => step.result?.execution?.evidence || null),
    live: false,
    auto_merge: false,
    authority: false,
  };
  executions.set(result.execution_id, result);
  if (idempotency_key) executions.set(idempotency_key, result);
  return result;
}

export function createDurableExecution({
  mode = "synchronous",
  project_id = null,
  idempotency_key = null,
  steps = [],
} = {}) {
  if (idempotency_key && executions.has(idempotency_key)) {
    return executions.get(idempotency_key);
  }
  const executionMode = EXECUTION_MODES.includes(mode) ? mode : "synchronous";
  const tasks = steps.map((step, index) => createTask({
    projectId: project_id || "universal",
    kind: step.kind || "CAPABILITY",
    title: step.title || step.need || `step-${index + 1}`,
    requiredCapabilities: step.required || [],
    dependsOn: step.depends_on || [],
    effect: "NONE",
  }));
  const plan = buildExecutionPlan({ projectId: project_id || "universal", tasks, authorized: false });
  const row = {
    id: plan.id,
    mode: executionMode,
    state: "AWAITING_AUTHORIZATION",
    idempotency_key,
    durable: true,
    resumable: true,
    idempotent: true,
    tasks: plan.tasks,
    events: [],
    costs: resourceCost({}),
    evidence: [],
    live: false,
    authority: false,
  };
  executions.set(row.id, row);
  if (idempotency_key) executions.set(idempotency_key, row);
  return row;
}

export function resumeExecution(execution_id, { authorized = false } = {}) {
  const row = executions.get(execution_id);
  if (!row) return { status: UNKNOWN, reason: "EXECUTION_NOT_FOUND", live: false };
  let tasks = taskGraph(row.tasks || []);
  const events = [...(row.events || [])];
  for (const ready of nextRunnableTasks(tasks)) {
    const started = startTask(ready, { authorized });
    tasks = tasks.map((task) => task.id === ready.id ? started : task);
    events.push(recordExecutionEvent({ executionId: row.id, taskId: ready.id, type: started.state, payload: { authorized } }));
    if (started.state === "RUNNING" && authorized) {
      const done = completeTask(started, { success: true, output: { resumed: true }, evidenceIds: [] });
      tasks = tasks.map((task) => task.id === ready.id ? done : task);
    }
    if (!authorized) break;
  }
  const next = { ...row, tasks, events, state: authorized ? "RUNNING" : "AWAITING_AUTHORIZATION" };
  executions.set(row.id, next);
  return next;
}

export function measureValue(input = {}) {
  const field = (name, value) => {
    if (value === undefined || value === null || value === "") return { name, value: NOT_MEASURED, status: NOT_MEASURED };
    return { name, value, status: "MEASURED" };
  };
  return {
    usage: field("usage", input.usage),
    delivered_output: field("delivered_output", input.delivered_output),
    verified_result: field("verified_result", input.verified_result),
    customer_outcome: field("customer_outcome", input.customer_outcome),
    time_saved: field("time_saved", input.time_saved),
    compute_consumed: field("compute_consumed", input.compute_consumed),
    external_service_cost: field("external_service_cost", input.external_service_cost),
    provider_cost: field("provider_cost", input.provider_cost),
    measured_revenue: field("measured_revenue", input.measured_revenue),
    measured_fees: field("measured_fees", input.measured_fees),
    measured_net_value: field("measured_net_value", input.measured_net_value),
    invented: false,
    live: false,
  };
}

export function resourceCost(observed = {}) {
  const row = {};
  for (const kind of RESOURCE_KINDS) {
    const key = kind.toLowerCase();
    row[kind] = observed[kind] ?? observed[key] ?? NOT_MEASURED;
  }
  return { ...row, live: false, invented: false };
}

export function remember({ tenant_id, kind, subject, assertion, verified = false } = {}) {
  const tid = text(tenant_id) || "public";
  const rec = {
    id: id("mem"),
    tenant_id: tid,
    kind: text(kind) || UNKNOWN,
    subject: text(subject) || UNKNOWN,
    assertion: assertion ?? null,
    verified: verified === true,
    truth: false,
    revocable: true,
    observed_at: iso(),
    live: false,
  };
  const bag = memory.get(tid) || [];
  bag.unshift(rec);
  memory.set(tid, bag.slice(0, 200));
  return rec;
}

export function recall({ tenant_id, other_tenant_id } = {}) {
  const tid = text(tenant_id) || "public";
  if (other_tenant_id && other_tenant_id !== tid) {
    return { records: [], isolated: true, leaked: false, live: false };
  }
  return { records: (memory.get(tid) || []).map((row) => ({ ...row, truth: false })), isolated: true, leaked: false, live: false };
}

export function revokeMemory({ tenant_id, id: memId, actor = "unknown" } = {}) {
  if (actor !== "carl") return { status: "DENIED", reason: "REVOKE_REQUIRES_HUMAN", live: false };
  const tid = text(tenant_id) || "public";
  const bag = (memory.get(tid) || []).filter((row) => row.id !== memId);
  memory.set(tid, bag);
  return { status: "REVOKED", live: false };
}

export function adversarialCognition({ claim, proposer, reviews = [], measurements = [] } = {}) {
  const roles = {
    PROPOSER: { actor: text(proposer) || UNKNOWN, claim: claim ?? null, authority: false },
    REVIEW: reviews.map((row) => ({ actor: row.actor, objection: row.objection || null, authority: false })),
    FALSIFY: { attempted: reviews.some((row) => row.falsify === true), independent: reviews.some((row) => row.actor && row.actor !== proposer) },
    MEASURE: measurements.map((row) => ({ ...row, status: row.measured === true ? "MEASURED" : NOT_MEASURED })),
    VERIFY: { independent: reviews.some((row) => row.actor && row.actor !== proposer && row.verify === true), self_verified: false },
  };
  if (roles.VERIFY.independent !== true) roles.VERIFY.self_verified = proposer && reviews.every((row) => row.actor === proposer);
  return {
    roles,
    consensus_is_not_truth: true,
    self_validation_is_not_proof: true,
    live: false,
    authority: false,
  };
}

export function selfBuildCycle({ gap = null, actor = "acorn" } = {}) {
  return {
    loop: ["OBSERVE", "UNDERSTAND", "DETECT_GAP", "PROPOSE", "DESIGN", "BUILD", "TEST", "FALSIFY", "MEASURE", "VERIFY", "REGISTER", "USE", "LEARN"],
    gap: gap || NOT_MEASURED,
    actor,
    can_amend_constitution: false,
    can_grant_authority: false,
    self_build_neq_self_authority: true,
    live: false,
    authority: "carl",
  };
}

export function digitalTwin(world = {}) {
  return {
    kind: "SIMULATION",
    of: world.subject || UNKNOWN,
    simulated: true,
    executed: false,
    live: false,
    authority: false,
  };
}

export function economicCycle({ signals = [], capabilityIndex = [], env = process.env } = {}) {
  const market = runMarketCycle({ signals, capabilityIndex });
  const commerce = commercialRuntimeSnapshot(env);
  return {
    demand: market.demand || market.qualified || [],
    offers: market.offers || [],
    verified_offers: (market.offers || []).filter((offer) => offer.verified === true),
    payment: { state: "UNPAID", rail: "stripe-adapter", interchangeable: true },
    commerce,
    paid: false,
    billed: false,
    live: false,
    stripe_is_not_brain: true,
  };
}

export function connectorAsCapability(input = {}) {
  const status = connectorHonest(input.state);
  return makeObject("Connector", {
    identity: input.id || input.identity,
    capabilities: input.capabilities || [],
    source: "connector-flux",
    state: status === "UNKNOWN" ? "DEFINED" : "DEFINED",
    constraints: {
      scope: input.scope || UNKNOWN,
      permission: input.permission || UNKNOWN,
      credential_boundary: "server",
      rate_limit: input.rate_limit || UNKNOWN,
      timeout_ms: input.timeout_ms || UNKNOWN,
    },
  }, { measured: false });
}

export function publicContract() {
  return Object.freeze({
    version: PUBLIC_API_VERSION,
    resources: [
      "capabilities", "projects", "tasks", "executions", "evidence",
      "measurements", "offers", "orders", "usage", "billing", "connectors",
    ],
    http_cannot_grant_authority: true,
    live: false,
  });
}

export function ignoreClientAuthority(body = {}) {
  const clone = { ...(body || {}) };
  delete clone.human_authorized;
  delete clone.authorized;
  delete clone.authority;
  delete clone.live;
  delete clone.verified;
  delete clone.paid;
  return {
    sanitized: clone,
    ignored: ["human_authorized", "authorized", "authority", "live", "verified", "paid"],
    authority: false,
    live: false,
  };
}

export function datedEvidence(input = {}) {
  const rec = registerEvidence({
    claim: input.subject || input.claim || UNKNOWN,
    source: input.source || UNKNOWN,
    strength: Number(input.strength) || 0,
    margin: Number(input.margin) > 0 ? Number(input.margin) : 1,
    validUntil: input.valid_until || input.validUntil || null,
  });
  return {
    ...rec,
    current: evidenceIsCurrent(rec, input.at || Date.now()),
    expired_is_not_false_forever: true,
    live: false,
    verified: false,
  };
}

export function sensitiveAction(action, { actor = "acorn" } = {}) {
  const name = text(action).toUpperCase();
  if (SENSITIVE_ACTIONS.includes(name) && actor !== "carl") {
    return { allowed: false, action: name, reason: "HOLD_HUMAN", ai_write: "DENIED", ai_merge: "DENIED", live: false };
  }
  return { allowed: actor === "carl", action: name, live: false };
}

export function resetUniversalInfrastructure() {
  executions.clear();
  memory.clear();
  resetCapabilityRegistry();
}

export function fabricSnapshot({ env = process.env } = {}) {
  const constitution = infrastructureConstitution();
  assertCapabilityAuthoritySeparation({ capability: true, authority: false });
  return {
    version: UNIVERSAL_INFRASTRUCTURE_VERSION,
    constitution,
    objects: OBJECT_KINDS.slice(),
    truth_states: TRUTH_STATES.slice(),
    public_contract: publicContract(),
    market: economicCycle({ env }),
    holds: {
      stripe_live: "HOLD_HUMAN",
      render: "NOT_OBSERVED",
      wrangler: "HOLD_HUMAN",
      juge_vitrine: "404 HTML ≠ carte juge",
    },
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export async function runUniversalInfrastructureCycle(input = {}) {
  const started = Date.now();
  const snapshot = fabricSnapshot({ env: input.env || process.env });
  const composition = await runComposition({
    problem: input.problem || "17 * 23",
    required: input.required || ["arithmetic"],
    policy: input.policy || "FREE_FIRST",
    human_authorization: input.human_authorization === true,
    mode: input.mode || "EXECUTION",
    idempotency_key: input.idempotency_key || null,
    env: input.env || process.env,
  });
  return {
    status: "COMPLETED",
    duration_ms: Date.now() - started,
    snapshot,
    composition,
    value: measureValue(input.value || {}),
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = await runUniversalInfrastructureCycle();
  console.log(JSON.stringify({ status: out.status, executed: out.composition.executed, live: out.live }, null, 2));
}
