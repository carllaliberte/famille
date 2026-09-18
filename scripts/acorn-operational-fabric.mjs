/** ACORN — OPERATIONAL FABRIC
 * Integration of existing primitives. Not a second brain, mesh, runtime, or authority.
 *
 * CLIENT → PROBLEM → QUALIFICATION → PROJECT → TASK GRAPH
 *        → CAPABILITY SELECTION → INTELLIGENCE ROUTING → PLAN
 *        → (DRY_RUN | SIMULATION | EXECUTION) → EVIDENCE → MEASUREMENT
 *
 * CAPABILITY ≠ AUTHORITY. LEARNING ≠ AUTHORITY. SIMULATION ≠ EXECUTION.
 * HTTP never grants human_authorized. Missing evidence is not a positive proof.
 */
import { customerServiceCycle, qualifyRequest, createCustomerRequest, createCustomer } from "./acorn-customer-service.mjs";
import { createTask, buildExecutionPlan, runSyntheticExecution, executionSnapshot } from "./acorn-execution-fabric.mjs";
import { createIntelligence, routeIntelligence, measureIntelligence } from "./acorn-intelligence-fabric.mjs";
import { CONNECTOR_STATES } from "./acorn-connector-execution-fabric.mjs";
import { detectGaps } from "./acorn-self-build.mjs";
import { composeFromIntent } from "./acorn-capability-composition.mjs";

const ISO = () => new Date().toISOString();
const unique = (xs) => [...new Set((Array.isArray(xs) ? xs : []).map((x) => String(x || "").trim()).filter(Boolean))];

export const OPERATIONAL_VERSION = "acorn.operational-fabric.v1";

export const EPISTEMIC = Object.freeze([
  "OBSERVED", "MEASURED", "INFERRED", "PROPOSED", "EXECUTED", "VERIFIED", "EXPIRED"
]);

export const REALMS = Object.freeze(["REALITY", "SIMULATION", "EXPERIMENT", "PRODUCTION"]);

export const EXECUTION_MODES = Object.freeze([
  "PLAN", "DRY_RUN", "SIMULATION", "EXECUTION", "RESULT", "VERIFICATION"
]);

export const CAPABILITY_PHASES = Object.freeze({
  exists: "exists",
  available: "available",
  authorized: "authorized",
  executed: "executed",
  verified: "verified"
});

export const INTELLIGENCE_LIFECYCLE = Object.freeze([
  "DISCOVERED", "QUALIFIED", "READY", "SELECTABLE", "DEGRADED", "BLOCKED"
]);

export const CONNECTOR_LIFECYCLE = Object.freeze([
  "DISCOVERED", "CONFIGURED", "READY", "RUNNING", "SUCCEEDED", "FAILED", "BLOCKED", "DISCONNECTED"
]);

export const ECONOMIC_STATUSES = Object.freeze([
  "ESTIMATED", "RESERVED", "PENDING_HUMAN", "BLOCKED"
]);

export const FORBIDDEN_ECONOMIC = Object.freeze(["PAID", "BILLED", "LIVE", "SETTLED", "CHARGED"]);

const HINTS = [
  [/email|mail|inbox|courriel/i, "email"],
  [/calendar|agenda|r[eé]union|schedule/i, "calendar"],
  [/github|git\b|repo|pull request/i, "github"],
  [/file|document|fichier|storage/i, "files"],
  [/data|donn[eé]e|dataset|sql/i, "data"],
  [/api|saas|integrat|webhook/i, "api"],
  [/crm|sales|pipeline/i, "crm"]
];

export function proposeCapabilities(problem) {
  const text = String(problem || "");
  const found = [];
  for (const [re, cap] of HINTS) if (re.test(text)) found.push(cap);
  if (!found.length) found.push("general");
  found.push("analysis", "planning", "verification");
  return unique(found);
}

export function describeCapability({
  id,
  name,
  description = "",
  exists = false,
  available = false,
  authorized = false,
  executed = false,
  verified = false,
  version = "0",
  tenant_id = null,
  type = "CAPABILITY",
  input = {},
  output = {},
  constraints = [],
  cost = null,
  latency = null,
  availability = "UNKNOWN",
  provenance = "acorn",
  evidence = [],
  measurement = null,
  owner = null,
  authority_boundary = "HUMAN",
  valid_from = null,
  valid_until = null,
  execution_interface = null,
  economic_interface = null
} = {}) {
  const capName = String(name || id || "").trim();
  if (!capName) throw new Error("CAPABILITY_NAME_REQUIRED");
  const measured = ISO();
  return {
    id: id || ("cap_" + capName),
    name: capName,
    description: String(description || ""),
    exists: Boolean(exists),
    available: Boolean(available) && Boolean(exists),
    authorized: false,
    executed: false,
    verified: false,
    version: String(version || "0"),
    tenant_id,
    authority: false,
    state: authorized ? "BLOCKED_IMPLICIT_AUTHORITY" : (available ? "AVAILABLE" : (exists ? "EXISTS" : "ABSENT")),
    measured_at: measured,
    type: String(type || "CAPABILITY"),
    input: input && typeof input === "object" ? input : {},
    output: output && typeof output === "object" ? output : {},
    constraints: Array.isArray(constraints) ? constraints : [],
    cost: cost == null ? null : cost,
    latency: latency == null ? null : latency,
    availability: String(availability || "UNKNOWN"),
    provenance: String(provenance || "acorn"),
    evidence: Array.isArray(evidence) ? evidence : [],
    measurement: measurement == null ? null : measurement,
    owner,
    authority_boundary: String(authority_boundary || "HUMAN"),
    valid_from: valid_from || measured,
    valid_until: valid_until || null,
    execution_interface,
    economic_interface,
    providers: [],
    provider_independent: true,
    live: false
  };
}

export function capabilityPhases(capability) {
  return {
    exists: capability?.exists === true,
    available: capability?.available === true,
    authorized: capability?.authorized === true,
    executed: capability?.executed === true,
    verified: capability?.verified === true
  };
}

export function qualifyIntelligence(intelligence) {
  const identity = intelligence?.id && intelligence?.provider && intelligence?.model;
  const described = Array.isArray(intelligence?.capabilities);
  const next = { ...intelligence, authority: false, human_authorized: false };
  if (!identity) return { ...next, state: "BLOCKED", reason: "IDENTITY_REQUIRED" };
  if (!described) return { ...next, state: "DISCOVERED" };
  if (intelligence.state === "READY" || intelligence.state === "SELECTABLE") return { ...next, state: intelligence.state };
  return { ...next, state: "QUALIFIED", qualified_at: ISO() };
}

export function markIntelligenceSelectable(intelligence) {
  const q = qualifyIntelligence(intelligence);
  if (q.state === "READY" || q.state === "QUALIFIED") {
    return { ...q, state: "SELECTABLE", authority: false, selectable: true, authorized: false };
  }
  return { ...q, selectable: false, authorized: false, authority: false };
}

export function discoverUnknownIntelligence({ provider, model, capabilities = [], channel = null, metadata = {} } = {}) {
  if (!provider || !model) throw new Error("INTELLIGENCE_PROVIDER_MODEL_REQUIRED");
  const id = "intel_" + String(provider).replace(/[^a-z0-9]+/gi, "-") + "_" + String(model).replace(/[^a-z0-9]+/gi, "-");
  const created = createIntelligence({
    id,
    provider: String(provider),
    model: String(model),
    capabilities,
    channel,
    metadata: { ...metadata, allowlisted: false }
  });
  return qualifyIntelligence(created);
}

export function routeByCapability(task, { intelligences = [], connectors = [] } = {}) {
  const required = unique(task?.required_capabilities || task?.requiredCapabilities || []);
  const ranked = routeIntelligence(
    { id: task?.id, required_capabilities: required },
    { intelligences, connections: connectors }
  );
  return ranked.map((row) => ({
    ...row,
    authority: false,
    authorized: false,
    selectable: Number(row.score || 0) > 0,
    selected: false
  }));
}

export function providerFailureDoesNotHalt({ failedId, intelligences = [], connectors = [], required = [] } = {}) {
  const remaining = (intelligences || []).filter((i) => i.id !== failedId && i.state !== "BLOCKED");
  const routes = routeByCapability({ required_capabilities: required }, { intelligences: remaining, connectors });
  return {
    acorn_available: true,
    failed_id: failedId || null,
    remaining: remaining.length,
    routes,
    authority: false,
    live: false,
    measured_at: ISO()
  };
}

export function configuredIsNotConnected(connector) {
  const state = String(connector?.state || "DISCOVERED");
  const configured = state === "CONFIGURED" || connector?.configured === true || connector?.credentials_present === true;
  const connected = connector?.connected === true || state === "READY" || state === "RUNNING";
  return {
    id: connector?.id || null,
    state,
    configured,
    connected: configured && connected && connector?.reachable === true,
    secret_custody: false,
    authority: false,
    proof: { configured_equals_connected: false, live: false }
  };
}

export function assertConnectorLifecycle(state) {
  if (!CONNECTOR_LIFECYCLE.includes(state) && !CONNECTOR_STATES.includes(state)) {
    throw new Error("UNKNOWN_CONNECTOR_STATE");
  }
  return state;
}

export function economicRecord({
  id,
  tenant_id,
  kind = "ESTIMATE",
  amount = 0,
  currency = "CAD",
  status = "ESTIMATED",
  related_id = null,
  evidence = null
} = {}) {
  const requested = String(status || "ESTIMATED").toUpperCase();
  const forbidden = FORBIDDEN_ECONOMIC.includes(requested);
  const honest = forbidden ? "ESTIMATED" : (ECONOMIC_STATUSES.includes(requested) ? requested : "ESTIMATED");
  return {
    id: id || ("econ_" + (related_id || "none")),
    tenant_id: tenant_id || null,
    kind,
    amount: Math.max(0, Number(amount) || 0),
    currency,
    status: honest,
    billed: false,
    paid: false,
    live: false,
    related_id,
    internal_cost: Math.max(0, Number(amount) || 0),
    provider_cost: null,
    customer_price: null,
    margin: null,
    evidence: evidence || null,
    reason: forbidden ? "PAYMENT_LIVE_BILLED_REQUIRE_INDEPENDENT_EVIDENCE" : null,
    measured_at: ISO()
  };
}

export function temporalFact({
  tenant_id,
  entity_id,
  epistemic = "OBSERVED",
  at = ISO(),
  payload = {},
  valid_until = null
} = {}) {
  const kind = EPISTEMIC.includes(epistemic) ? epistemic : "OBSERVED";
  return {
    tenant_id,
    entity_id,
    epistemic: kind,
    measured_at: at,
    valid_until,
    payload,
    expired: false,
    false_because_expired: false
  };
}

export function asOf(records = [], at = Date.now()) {
  const t = typeof at === "number" ? at : Date.parse(at);
  return (records || []).map((row) => {
    const when = Date.parse(row.measured_at || row.created_at || 0);
    if (!Number.isFinite(when) || when > t) return null;
    const until = row.valid_until ? Date.parse(row.valid_until) : null;
    const expired = Number.isFinite(until) && until < t;
    if (expired) {
      return { ...row, epistemic: "EXPIRED", expired: true, false_because_expired: false };
    }
    return { ...row, expired: false, false_because_expired: false };
  }).filter(Boolean);
}

export function isolateRealm(record, realm = "REALITY") {
  const r = REALMS.includes(realm) ? realm : "REALITY";
  const simulation = r === "SIMULATION" || r === "EXPERIMENT";
  return {
    ...record,
    realm: r,
    contaminates_reality: false,
    live: false,
    external_effect: simulation ? false : record?.external_effect === true,
    authority: false
  };
}

export function recordLearningObservation({
  intelligence_id = null,
  capability = null,
  outcome = null,
  cost = null
} = {}) {
  return {
    experimental: true,
    authority: false,
    cannot_merge: true,
    cannot_grant_permission: true,
    cannot_modify_secrets: true,
    cannot_declare_definitive_proof: true,
    intelligence_id,
    capability,
    outcome,
    cost,
    learning_equals_authority: false,
    measured_at: ISO()
  };
}

export function runExecutionMode(mode, { projectId, authorized = false } = {}) {
  const m = EXECUTION_MODES.includes(mode) ? mode : "PLAN";
  if (m === "EXECUTION") {
    if (!authorized) {
      return isolateRealm({
        mode: m,
        state: "BLOCKED",
        reason: "HUMAN_AUTHORIZATION_REQUIRED",
        authorized: false,
        external_effect: false,
        snapshot: { completion: 0 },
        measured_at: ISO()
      }, "REALITY");
    }
    const syn = runSyntheticExecution({ projectId, authorized: true });
    return isolateRealm({ ...syn, mode: m, realm: "REALITY", external_effect: false }, "REALITY");
  }
  if (m === "DRY_RUN" || m === "SIMULATION") {
    const syn = runSyntheticExecution({ projectId, authorized: true });
    return isolateRealm({
      ...syn,
      mode: m,
      state: "SIMULATED",
      authorized: false,
      human_authorized: false,
      external_effect: false,
      contaminates_reality: false,
      simulated: true,
      snapshot: executionSnapshot(syn)
    }, "SIMULATION");
  }
  if (m === "PLAN") {
    const syn = runSyntheticExecution({ projectId, authorized: false });
    return isolateRealm({ ...syn, mode: "PLAN", state: syn.state, external_effect: false }, "REALITY");
  }
  return isolateRealm({ mode: m, state: "PLANNED", authorized: false, external_effect: false, measured_at: ISO() }, "REALITY");
}

export function operateProblem({
  tenantId,
  customerId,
  problem,
  requestId = null,
  intelligences = [],
  connectors = [],
  capabilities = []
} = {}) {
  const text = String(problem || "").trim();
  const customer = createCustomer({ customer_id: customerId, tenant_id: tenantId });
  const request = createCustomerRequest({ customer, request: text });
  const proposed = capabilities.length ? unique(capabilities) : proposeCapabilities(text);
  const qualification = qualifyRequest(request, {
    capabilities: proposed,
    estimated_complexity: text.length > 400 ? "HIGH" : (text.length > 80 ? "MEDIUM" : "LOW")
  });
  const cycle = customerServiceCycle({
    customer,
    request: text,
    capabilities: proposed,
    solution: "Acorn intake, qualification, and execution plan",
    deliverables: ["qualified request", "execution plan", "evidence"],
    evidence_plan: ["runtime evidence"],
    usage_rights: ["CUSTOMER_USE_PENDING_HUMAN_AUTHORIZATION"],
    tasks: ["qualify", "plan", "select_capabilities", "route_intelligence", "verify"],
    intelligence: intelligences.map((i) => i.id || i.model).filter(Boolean),
    human_authorized: false
  });
  const projectId = requestId || cycle.request?.request_id || ("req_" + tenantId);
  const qualifyTask = createTask({
    projectId,
    kind: "QUALIFY",
    title: "Qualify the problem",
    requiredCapabilities: ["analysis"]
  });
  const planTask = createTask({
    projectId,
    kind: "PLAN",
    title: "Build an execution plan",
    requiredCapabilities: proposed,
    dependsOn: [qualifyTask.id]
  });
  const verifyTask = createTask({
    projectId,
    kind: "VERIFY",
    title: "Verify deliverables against evidence",
    requiredCapabilities: ["verification"],
    dependsOn: [planTask.id]
  });
  const plan = buildExecutionPlan({
    projectId,
    tasks: [qualifyTask, planTask, verifyTask],
    authorized: false
  });
  const known = [
    { name: "analysis", exists: true, available: false, reason: "CODE_PRESENT", source: "acorn-operational-fabric" },
    { name: "planning", exists: true, available: false, reason: "CODE_PRESENT", source: "acorn-execution-fabric" },
    { name: "verification", exists: true, available: false, reason: "CODE_PRESENT", source: "acorn-evidence-registry" },
    { name: "general", exists: true, available: false, reason: "CODE_PRESENT", source: "acorn-operational-fabric" }
  ];
  const detection = detectGaps({
    task: text,
    required: proposed,
    known,
    connectors
  });
  const capRecords = proposed.map((name) => {
    const hit = [...detection.found, ...detection.gaps, ...detection.holds].find((row) => row.capability === name);
    return describeCapability({
      id: "cap_" + projectId + "_" + name,
      name,
      exists: hit?.exists === true,
      available: hit?.available === true,
      authorized: false,
      tenant_id: tenantId
    });
  });
  const qualifiedIntelligences = intelligences.map((i) => markIntelligenceSelectable(i));
  const routes = routeByCapability(
    { id: plan.id, required_capabilities: proposed },
    { intelligences: qualifiedIntelligences, connectors }
  );
  const composition = composeFromIntent({
    intent: text,
    tenantId,
    capabilities: capRecords,
    intelligences: qualifiedIntelligences,
    connectors
  });
  const economic = economicRecord({
    tenant_id: tenantId,
    related_id: projectId,
    kind: "ESTIMATE",
    amount: 0,
    status: "ESTIMATED"
  });
  const observed = temporalFact({
    tenant_id: tenantId,
    entity_id: projectId,
    epistemic: "OBSERVED",
    payload: { problem: text, stage: cycle.stage }
  });
  return {
    version: OPERATIONAL_VERSION,
    stage: cycle.stage,
    live: false,
    verified: false,
    delivered: false,
    customer,
    request,
    qualification: {
      ...qualification,
      proposed_capabilities: proposed,
      human_review: true
    },
    project: {
      id: projectId,
      stage: cycle.stage,
      delivered: false,
      live: false
    },
    capabilities: capRecords,
    gaps: detection.gaps,
    holds: detection.holds,
    intelligence_routes: routes,
    composition,
    connectors: connectors.map(configuredIsNotConnected),
    execution: { mode: "PLAN", ...plan, snapshot: executionSnapshot(plan) },
    economic,
    temporal: [observed],
    cycle,
    proof: {
      live: false,
      verified: false,
      delivered: false,
      billed: false,
      paid: false,
      human_authorization_required: true,
      capability_is_not_authority: true,
      simulation_is_not_execution: true,
      measured_at: ISO()
    }
  };
}

export const FUTURE_PROOF_KEYS = Object.freeze([
  "nouvelle intelligence",
  "nouveau modele",
  "nouveau fournisseur",
  "nouveau connecteur",
  "nouveau type de capacite",
  "nouveau workflow",
  "tache longue",
  "execution distribuee",
  "memoire temporelle",
  "apprentissage",
  "experimentation",
  "simulation",
  "digital twin",
  "multi-tenant",
  "entreprise",
  "API externe",
  "SDK",
  "marketplace",
  "produit reutilisable",
  "billing",
  "droits d'utilisation",
  "internationalisation",
  "resilience multi-provider",
  "nouvelles formes d'intelligence",
  "nouveaux types d'outils",
  "nouveaux modes d'interaction avec le monde reel"
]);

export function futureProofContract() {
  const reasons = {
    "nouvelle intelligence": "discoverUnknownIntelligence + generic adapter; no model allowlist",
    "nouveau modele": "identity is data (provider, model); createIntelligence has no closed set",
    "nouveau fournisseur": "provider is a string field; routeByCapability is capability-based",
    "nouveau connecteur": "generic connector contract; CONFIGURED ≠ READY; no closed integration list",
    "nouveau type de capacite": "describeCapability accepts any name; admitExtension on acorn-self-build registers a future kind without modifying the core; proposeCapabilities is heuristic not exclusive",
    "nouveau workflow": "task graph is data (kind, dependsOn); operateProblem composes existing cycle",
    "tache longue": "acorn_jobs + worker; task state machine allows RUNNING across processes",
    "execution distribuee": "execution ids, jobs, tenant-scoped workers; no single-process assumption in records",
    "memoire temporelle": "asOf(records, t); epistemic OBSERVED..EXPIRED; expired is not false",
    "apprentissage": "recordLearningObservation is experimental and cannot grant authority",
    "experimentation": "REALMS includes EXPERIMENT; isolateRealm contaminates_reality=false",
    "simulation": "runExecutionMode(SIMULATION) never becomes EXECUTION",
    "digital twin": "REALITY vs SIMULATION vs EXPERIMENT vs PRODUCTION; interfaces only until measured",
    "multi-tenant": "tenant_id on state/evidence/events/jobs; isolation at data-access boundary",
    "entreprise": "organization persisted as ORGANIZATION entity; customer ≠ org ≠ intelligence",
    "API externe": "versioned /api/v1, request ids, idempotency keys; unauthenticated surface stays auth-gated",
    "SDK": "package exports remain the contract; live HTTP is a consumer not a fork",
    "marketplace": "capability catalog records exist/available/authorized separately; no invented listings",
    "produit reutilisable": "ASSET/PRODUCT entities exist; rights stay explicit; no silent relicensing",
    "billing": "economicRecord refuses PAID/BILLED/LIVE without independent evidence",
    "droits d'utilisation": "usage_rights on customer cycle remain explicit and pending human authorization",
    "internationalisation": "locale is a customer field; copy is not a closed language enum",
    "resilience multi-provider": "providerFailureDoesNotHalt keeps Acorn available when one intelligence fails",
    "nouvelles formes d'intelligence": "intelligence contract is identity+capabilities+channel, not a model class enum",
    "nouveaux types d'outils": "connector kind is data; CONNECTOR_LIFECYCLE is open to new kinds as strings",
    "nouveaux modes d'interaction avec le monde reel": "real-world bridge is generic HTTP; no closed effect allowlist in the kernel"
  };
  const items = {};
  for (const key of FUTURE_PROOF_KEYS) {
    items[key] = { status: "NOT_BLOCKED", reason: reasons[key] };
  }
  return {
    version: OPERATIONAL_VERSION,
    items,
    blocked: Object.entries(items).filter(([, v]) => v.status === "BLOCKED").map(([k]) => k),
    live: false,
    measured_at: ISO()
  };
}

export function classifyCapability(name) {
  const now = new Set([
    "intake", "qualify", "plan", "persist", "tenant-isolation", "auth",
    "evidence", "health", "capability-lifecycle", "intelligence-discover",
    "simulation", "as-of", "economic-estimate", "rate-limit", "idempotency",
    "self-build", "capability-gap"
  ]);
  const foundation = new Set([
    "webhooks", "m2m-auth", "marketplace", "digital-twin-full", "i18n",
    "sdk-packaging", "learning-router", "billing-adapter"
  ]);
  const future = new Set(["payment-capture", "live-claim", "qkd", "quantum"]);
  const hold = new Set(["merge", "secret-custody", "authorized-external-effect", "render-receipt"]);
  if (now.has(name)) return "IMPLEMENT_NOW";
  if (foundation.has(name)) return "FOUNDATION_ONLY";
  if (future.has(name)) return "FUTURE";
  if (hold.has(name)) return "HUMAN_HOLD";
  return "NOT_APPLICABLE";
}
