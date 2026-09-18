#!/usr/bin/env node
/**
 * ACORN — UNIVERSAL PROJECT CONTRACT
 *
 * Canonical project lifecycle and typed state for the existing Acorn runtime.
 * This is a contract/composition layer, not a second runtime, graph, evidence
 * engine, execution engine, market engine, or authority system.
 *
 * POINT A → EXECUTION → VALIDATION → DELIVERY → VALUE → LEARNING
 *
 * Truth:
 * PLANNED !== EXECUTED !== VERIFIED !== DELIVERED !== LIVE
 * CAPABILITY !== AUTHORITY
 * PAYMENT_OBSERVED !== EXECUTION_AUTHORIZED
 */

export const UNIVERSAL_PROJECT_CONTRACT_VERSION = "acorn.universal-project-contract.v1";

export const PROJECT_LIFECYCLE = Object.freeze([
  "INTAKE","QUALIFICATION","DECOMPOSITION","CAPABILITY_DISCOVERY","GAP_DISCOVERY",
  "ARCHITECTURE","COMPOSITION","SIMULATION","ESTIMATION","OFFER","ORDER","PAYMENT",
  "AUTHORIZATION","EXECUTION","OBSERVATION","VERIFICATION","VALIDATION","DELIVERY",
  "VALUE_MEASUREMENT","RENEWAL_EXPANSION","LEARNING"
]);

export const PROJECT_HEALTH = Object.freeze([
  "ALIVE","HEALTHY","DEGRADED","BLOCKED","UNKNOWN","UNREACHABLE"
]);

export const EPISTEMIC_STATES = Object.freeze([
  "CODE_PRESENT","TESTED","EXECUTED","MEASURED","VERIFIED","LIVE"
]);

export const CONNECTOR_LIFECYCLE = Object.freeze([
  "DISCOVERED","CONFIGURED","AUTHENTICATED","CONNECTED","READABLE",
  "EXECUTABLE","MEASURED","VERIFIED","LIVE"
]);

export const TASK_PIPELINE = Object.freeze([
  "DISCOVER","SELECT_CAPABILITY","RESOLVE_PROVIDER","CHECK_RIGHTS",
  "CHECK_AUTHORITY","CHECK_RESOURCES","EXECUTE","CAPTURE_RESULT",
  "CAPTURE_EVIDENCE","MEASURE","VERIFY","ADVANCE"
]);

export const FAILURE_PIPELINE = Object.freeze([
  "DIAGNOSE","RETRY","SUBSTITUTE","RECOMPOSE","ESCALATE_HUMAN"
]);

export const UNIVERSAL_PROJECT_FIELDS = Object.freeze([
  "customer","organization","problem","requirements","constraints","objectives","scope",
  "budget","timeline","jurisdiction","risks","capabilities","resources","people",
  "intelligences","tools","connectors","machines","tasks","dependencies","milestones",
  "deliverables","rights","authority","evidence","measurements","costs","offers",
  "orders","payments","execution_state","verification_state","delivery_state",
  "outcomes","value"
]);

export const PROJECT_POLICY = Object.freeze({
  capability_is_not_authority: true,
  payment_observed_is_not_execution_authorized: true,
  planned_is_not_executed: true,
  executed_is_not_verified: true,
  verified_is_not_delivered: true,
  simulated_is_not_executed: true,
  live_requires_fresh_observation: true,
  expired_evidence_is_not_permanent_falsehood: true,
  no_auto_merge: true,
  no_auto_contract: true,
  no_auto_spend: true,
  no_auto_sign: true,
  human_authority: "carl"
});

const str = (v) => String(v ?? "").trim();
const arr = (v) => Array.isArray(v) ? v : [];
const iso = (v) => {
  const d = v ? new Date(v) : new Date();
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

export function createUniversalProject({
  id,
  tenantId = null,
  customer = null,
  organization = null,
  problem = "",
  requirements = [],
  constraints = [],
  objectives = [],
  scope = null,
  budget = null,
  timeline = null,
  jurisdiction = null,
  risks = [],
  capabilities = [],
  resources = [],
  people = [],
  intelligences = [],
  tools = [],
  connectors = [],
  machines = [],
  tasks = [],
  dependencies = [],
  milestones = [],
  deliverables = [],
  rights = [],
  authority = { required: true, granted: false },
  evidence = [],
  measurements = [],
  costs = [],
  offers = [],
  orders = [],
  payments = [],
  executionState = "INTAKE",
  verificationState = "UNVERIFIED",
  deliveryState = "NOT_DELIVERED",
  outcomes = [],
  value = null,
  version = 1
} = {}) {
  if (!str(id)) throw new Error("PROJECT_ID_REQUIRED");
  if (!str(problem)) throw new Error("PROJECT_PROBLEM_REQUIRED");
  const now = iso();
  return {
    version: UNIVERSAL_PROJECT_CONTRACT_VERSION,
    id: str(id),
    tenant_id: tenantId ? str(tenantId) : null,
    customer, organization,
    problem: str(problem),
    requirements: [...arr(requirements)],
    constraints: [...arr(constraints)],
    objectives: [...arr(objectives)],
    scope,
    budget,
    timeline,
    jurisdiction,
    risks: [...arr(risks)],
    capabilities: [...arr(capabilities)],
    resources: [...arr(resources)],
    people: [...arr(people)],
    intelligences: [...arr(intelligences)],
    tools: [...arr(tools)],
    connectors: [...arr(connectors)],
    machines: [...arr(machines)],
    tasks: [...arr(tasks)],
    dependencies: [...arr(dependencies)],
    milestones: [...arr(milestones)],
    deliverables: [...arr(deliverables)],
    rights: [...arr(rights)],
    authority: { required: true, granted: authority?.granted === true, ...authority },
    evidence: [...arr(evidence)],
    measurements: [...arr(measurements)],
    costs: [...arr(costs)],
    offers: [...arr(offers)],
    orders: [...arr(orders)],
    payments: [...arr(payments)],
    execution_state: str(executionState).toUpperCase(),
    verification_state: str(verificationState).toUpperCase(),
    delivery_state: str(deliveryState).toUpperCase(),
    outcomes: [...arr(outcomes)],
    value,
    created_at: now,
    updated_at: now,
    live: false
  };
}

export function validateUniversalProject(project) {
  const blockers = [];
  if (!project || typeof project !== "object") blockers.push("PROJECT_REQUIRED");
  if (!str(project?.id)) blockers.push("PROJECT_ID_REQUIRED");
  if (!str(project?.problem)) blockers.push("PROJECT_PROBLEM_REQUIRED");
  if (!PROJECT_LIFECYCLE.includes(str(project?.execution_state).toUpperCase())) {
    blockers.push("UNKNOWN_PROJECT_LIFECYCLE");
  }
  if (!["VERIFIED","UNVERIFIED","INSUFFICIENT"].includes(str(project?.verification_state).toUpperCase())) {
    blockers.push("UNKNOWN_VERIFICATION_STATE");
  }
  if (!["NOT_DELIVERED","READY","DELIVERED"].includes(str(project?.delivery_state).toUpperCase())) {
    blockers.push("UNKNOWN_DELIVERY_STATE");
  }
  if (project?.live === true) blockers.push("LIVE_REQUIRES_OBSERVATION");
  return { valid: blockers.length === 0, blockers, measured_at: iso() };
}

export function canTransition(from, to, { paymentObserved = false, authorized = false, verified = false, validated = false } = {}) {
  const a = str(from).toUpperCase();
  const b = str(to).toUpperCase();
  if (!PROJECT_LIFECYCLE.includes(a) || !PROJECT_LIFECYCLE.includes(b)) {
    return { allowed: false, reason: "UNKNOWN_LIFECYCLE_STATE" };
  }
  if (a === b) return { allowed: true, reason: "NOOP" };

  const index = PROJECT_LIFECYCLE.indexOf(a);
  const target = PROJECT_LIFECYCLE.indexOf(b);
  if (target < index) return { allowed: false, reason: "BACKWARD_TRANSITION_REQUIRES_EXPLICIT_REOPEN" };

  if (b === "AUTHORIZATION" && !authorized) return { allowed: false, reason: "WAITING_HUMAN" };
  if (b === "EXECUTION" && !authorized) return { allowed: false, reason: "EXECUTION_AUTHORIZATION_REQUIRED" };
  if (b === "PAYMENT" && !paymentObserved) return { allowed: false, reason: "PAYMENT_NOT_OBSERVED" };
  if (b === "VERIFICATION" && !verified) return { allowed: false, reason: "VERIFICATION_EVIDENCE_REQUIRED" };
  if (b === "VALIDATION" && !validated) return { allowed: false, reason: "VALIDATION_REQUIRED" };
  if (b === "DELIVERY" && !validated) return { allowed: false, reason: "VALIDATION_REQUIRED" };

  return { allowed: true, reason: "CONTRACT_TRANSITION_ALLOWED" };
}

export function advanceProject(project, to, context = {}) {
  const check = canTransition(project?.execution_state, to, context);
  if (!check.allowed) {
    return { ...project, transition: check, updated_at: iso(), live: false };
  }
  return {
    ...project,
    execution_state: str(to).toUpperCase(),
    transition: check,
    updated_at: iso(),
    live: false
  };
}

export function projectTruth(project, {
  codePresent = false,
  tested = false,
  executed = false,
  measured = false,
  verified = false,
  liveObserved = false
} = {}) {
  const epistemic = {
    CODE_PRESENT: codePresent === true,
    TESTED: tested === true,
    EXECUTED: executed === true,
    MEASURED: measured === true,
    VERIFIED: verified === true,
    LIVE: liveObserved === true
  };
  const blockers = [];
  if (epistemic.LIVE && !epistemic.VERIFIED) blockers.push("LIVE_REQUIRES_VERIFICATION");
  if (epistemic.VERIFIED && !epistemic.MEASURED) blockers.push("VERIFIED_REQUIRES_MEASUREMENT");
  if (epistemic.MEASURED && !epistemic.EXECUTED) blockers.push("MEASURED_EXECUTION_REQUIRED");
  return { epistemic, blockers, status: blockers.length ? "INSUFFICIENT" : "MEASURED", measured_at: iso() };
}

export function connectorState({ state = "DISCOVERED", observed = false, executable = false, verified = false, live = false } = {}) {
  const s = str(state).toUpperCase();
  const allowed = CONNECTOR_LIFECYCLE.includes(s);
  return {
    state: allowed ? s : "DISCOVERED",
    observed: observed === true,
    executable: executable === true,
    verified: verified === true,
    live: live === true && observed === true && verified === true,
    authority: "carl"
  };
}

export function universalProjectContract() {
  return Object.freeze({
    version: UNIVERSAL_PROJECT_CONTRACT_VERSION,
    fields: [...UNIVERSAL_PROJECT_FIELDS],
    lifecycle: [...PROJECT_LIFECYCLE],
    health: [...PROJECT_HEALTH],
    epistemic: [...EPISTEMIC_STATES],
    connector_lifecycle: [...CONNECTOR_LIFECYCLE],
    task_pipeline: [...TASK_PIPELINE],
    failure_pipeline: [...FAILURE_PIPELINE],
    policy: PROJECT_POLICY
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(universalProjectContract(), null, 2));
}
