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
 * CHECKOUT_CREATED !== PAYMENT_OBSERVED !== EXECUTION_AUTHORIZED !== DELIVERED
 */

import { createCommercialProject, acceptOffer, attachCheckout, applyPaymentObservation, commercialTruth } from "./acorn-commercial-runtime.mjs";
import { operateProblem, configuredIsNotConnected, temporalFact } from "./acorn-operational-fabric.mjs";
import { createTask, buildExecutionPlan, startTask, executionSnapshot } from "./acorn-execution-fabric.mjs";
import { createIntelligence, routeIntelligence, intelligenceSnapshot } from "./acorn-intelligence-fabric.mjs";
import { registerEvidence, evidenceIsCurrent, proofGate } from "./acorn-evidence-registry.mjs";
import { createAssertion, expireCertainty } from "./acorn-epistemic.mjs";
import { isolateTenant } from "./acorn-customer-service.mjs";
import { registerAdapter, discoverAdapters } from "./acorn-connection-fabric.mjs";
import { resolveConnectorUrl, buildExternalCall } from "./acorn-real-world-bridge.mjs";
import { stripeTruth, createStripeAdapter, verifyWebhookSignature } from "./acorn-stripe-adapter.mjs";
import { detectGaps } from "./acorn-self-build.mjs";
import { universalProjectValueCycle } from "./acorn-universal-project-value.mjs";

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
  "project","program","portfolio","federation","workstreams",
  "customer","organization","problem","requirements","constraints","objectives","scope",
  "budget","timeline","jurisdiction","risks","capabilities","resources","people",
  "intelligences","tools","connectors","machines","tasks","dependencies","milestones",
  "deliverables","rights","authority","evidence","measurements","costs","offers",
  "orders","payments","execution_state","verification_state","delivery_state",
  "outcomes","value"
]);

export const UNIVERSAL_PROJECT_KINDS = Object.freeze([
  "software","ai","research","business","data","automation","industrial","physical","multi-org","program"
]);

export const PROJECT_SCALES = Object.freeze([
  "PROJECT","PROGRAM","PORTFOLIO","MULTI_ORGANIZATION","FEDERATION"
]);

export const COMMERCIAL_TRACK = Object.freeze([
  "CHECKOUT_CREATED","PAYMENT_OBSERVED","EXECUTION_AUTHORIZED","DELIVERED"
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
  kind = "software",
  scale = "PROJECT",
  programId = null,
  portfolioId = null,
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
  checkoutState = null,
  paymentState = null,
  authorizationState = null,
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
    kind: UNIVERSAL_PROJECT_KINDS.includes(str(kind)) ? str(kind) : "software",
    scale: PROJECT_SCALES.includes(str(scale).toUpperCase()) ? str(scale).toUpperCase() : "PROJECT",
    program_id: programId ? str(programId) : null,
    portfolio_id: portfolioId ? str(portfolioId) : null,
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
    checkout_state: checkoutState ? str(checkoutState).toUpperCase() : null,
    payment_state: paymentState ? str(paymentState).toUpperCase() : null,
    authorization_state: authorizationState ? str(authorizationState).toUpperCase() : null,
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

export function canTransition(from, to, { paymentObserved = false, authorized = false, verified = false, validated = false, checkoutCreated = false } = {}) {
  const a = str(from).toUpperCase();
  const b = str(to).toUpperCase();
  if (!PROJECT_LIFECYCLE.includes(a) || !PROJECT_LIFECYCLE.includes(b)) {
    return { allowed: false, reason: "UNKNOWN_LIFECYCLE_STATE" };
  }
  if (a === b) return { allowed: true, reason: "NOOP" };

  const index = PROJECT_LIFECYCLE.indexOf(a);
  const target = PROJECT_LIFECYCLE.indexOf(b);
  if (target < index) return { allowed: false, reason: "BACKWARD_TRANSITION_REQUIRES_EXPLICIT_REOPEN" };

  if (checkoutCreated && b === "PAYMENT") {
    return { allowed: false, reason: "CHECKOUT_CREATED_IS_NOT_PAYMENT_OBSERVED" };
  }
  if (b === "AUTHORIZATION" && !authorized) return { allowed: false, reason: "WAITING_HUMAN" };
  if (b === "EXECUTION" && !authorized) return { allowed: false, reason: "EXECUTION_AUTHORIZATION_REQUIRED" };
  if (b === "EXECUTION" && authorized && !paymentObserved && a === "PAYMENT") {
    return { allowed: false, reason: "PAYMENT_NOT_OBSERVED" };
  }
  if (b === "PAYMENT" && !paymentObserved) return { allowed: false, reason: "PAYMENT_NOT_OBSERVED" };
  if (b === "VERIFICATION" && !verified) return { allowed: false, reason: "VERIFICATION_EVIDENCE_REQUIRED" };
  if (b === "VALIDATION" && !validated) return { allowed: false, reason: "VALIDATION_REQUIRED" };
  if (b === "DELIVERY" && !validated) return { allowed: false, reason: "VALIDATION_REQUIRED" };
  if (b === "DELIVERY" && authorized && !validated) {
    return { allowed: false, reason: "EXECUTION_AUTHORIZED_IS_NOT_DELIVERED" };
  }

  return {
    allowed: true,
    reason: "CONTRACT_TRANSITION_ALLOWED",
    distinctions: {
      checkout_created_is_not_paid: true,
      payment_observed_is_not_execution_authorized: true,
      execution_authorized_is_not_delivered: true
    }
  };
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
  const wantsLive = live === true || s === "LIVE";
  return {
    state: allowed ? s : "DISCOVERED",
    observed: observed === true,
    executable: executable === true,
    verified: verified === true,
    live: wantsLive && observed === true && verified === true,
    authority: "carl"
  };
}

export function universalProjectContract() {
  return Object.freeze({
    version: UNIVERSAL_PROJECT_CONTRACT_VERSION,
    fields: [...UNIVERSAL_PROJECT_FIELDS],
    kinds: [...UNIVERSAL_PROJECT_KINDS],
    scales: [...PROJECT_SCALES],
    lifecycle: [...PROJECT_LIFECYCLE],
    health: [...PROJECT_HEALTH],
    epistemic: [...EPISTEMIC_STATES],
    connector_lifecycle: [...CONNECTOR_LIFECYCLE],
    commercial_track: [...COMMERCIAL_TRACK],
    task_pipeline: [...TASK_PIPELINE],
    failure_pipeline: [...FAILURE_PIPELINE],
    policy: PROJECT_POLICY,
    second_runtime: false,
    second_graph: false,
    second_market_engine: false,
    second_execution_fabric: false,
    second_evidence_engine: false,
    second_self_build: false
  });
}

function credentialPresent(env, name) {
  if (!name) return false;
  const value = env?.[name];
  return typeof value === "string" && value.trim().length > 0;
}

export function bindCommercialCycle({
  project,
  tenantId,
  customerId,
  problem,
  audience = "BUSINESS",
  intelligences = [],
  connectors = [],
  offer = null,
  checkoutSession = null,
  paymentEntry = null,
  authorized = false,
  validated = false
} = {}) {
  const commercial = createCommercialProject({
    tenantId: tenantId || project?.tenant_id,
    customerId: customerId || project?.customer?.id || project?.tenant_id,
    problem: problem || project?.problem,
    requestId: project?.id,
    audience,
    intelligences,
    connectors
  });
  const selectedOffer = offer || commercial.offers?.[0] || null;
  const accepted = selectedOffer
    ? acceptOffer({
      tenantId: commercial.tenant_id || tenantId,
      customerId,
      projectId: project?.id,
      offer: selectedOffer
    })
    : { order: null, state: "NO_OFFER", live: false };
  const order = checkoutSession && accepted.order
    ? attachCheckout(accepted.order, checkoutSession)
    : accepted.order;
  const payment = paymentEntry && order
    ? applyPaymentObservation({ order, entry: paymentEntry })
    : { order, granted: null, reason: "PAYMENT_NOT_OBSERVED", execution_authority: false, live: false };
  const paymentObserved = payment?.order?.state === "PAYMENT_OBSERVED";
  const checkoutCreated = order?.state === "CHECKOUT_CREATED";
  const towardPayment = canTransition(project?.execution_state || "ORDER", "PAYMENT", {
    paymentObserved,
    checkoutCreated
  });
  const towardAuth = canTransition("PAYMENT", "AUTHORIZATION", {
    paymentObserved,
    authorized
  });
  const towardDelivery = canTransition("VALIDATION", "DELIVERY", {
    authorized,
    validated
  });
  return {
    commercial,
    order: payment.order || order,
    payment,
    usage_rights: accepted.usage_rights || null,
    checkout_created: checkoutCreated === true,
    payment_observed: paymentObserved === true,
    execution_authorized: authorized === true,
    delivered: validated === true && towardDelivery.allowed,
    transitions: {
      payment: towardPayment,
      authorization: towardAuth,
      delivery: towardDelivery
    },
    distinctions: {
      CHECKOUT_CREATED: checkoutCreated === true,
      PAYMENT_OBSERVED: paymentObserved === true,
      EXECUTION_AUTHORIZED: authorized === true,
      DELIVERED: validated === true && towardDelivery.allowed
    },
    confused: false,
    truth: commercialTruth({ orders: payment.order ? [payment.order] : (order ? [order] : []) }),
    live: false,
    authority: "carl"
  };
}

export function refreshLiveEvidence(items = [], { now = Date.now(), reobserve = null } = {}) {
  const at = typeof now === "number" ? now : Date.parse(now);
  return arr(items).map((raw) => {
    const evidence = raw?.id ? raw : registerEvidence(raw || {});
    const current = evidenceIsCurrent(evidence, at);
    const assertion = createAssertion({
      claim: evidence.claim || "live-evidence",
      origin: evidence.source || "project",
      at: evidence.measured_at || evidence.created_at,
      horizon: evidence.valid_until
        ? Math.max(1, Date.parse(evidence.valid_until) - Date.parse(evidence.measured_at || evidence.created_at || 0))
        : 1
    });
    const expired = expireCertainty({ assertion, now: at });
    if (current) {
      return {
        ...evidence,
        current: true,
        live: false,
        certainty_state: expired.certainty_state,
        expired_is_not_eternally_false: true,
        reacquired: false
      };
    }
    if (typeof reobserve === "function") {
      const next = reobserve(evidence);
      if (next?.observed === true && next?.valid_until) {
        const refreshed = registerEvidence({
          ...evidence,
          tenantId: evidence.tenant_id,
          claim: evidence.claim,
          source: next.source || evidence.source,
          strength: evidence.strength,
          margin: evidence.margin,
          validUntil: next.valid_until
        });
        return {
          ...refreshed,
          current: evidenceIsCurrent(refreshed, at),
          live: false,
          reacquired: true,
          expired_is_not_eternally_false: true,
          successor_state: "REQUIRES_REVALIDATION"
        };
      }
    }
    return {
      ...evidence,
      current: false,
      live: false,
      certainty_state: expired.certainty_state,
      successor_state: "REQUIRES_REVALIDATION",
      expired_is_not_eternally_false: true,
      reacquired: false,
      status_note: "NOT_OBSERVED"
    };
  });
}

export function genericProviderAdapter({
  id,
  kind = "generic",
  env = {},
  credentialEnv = null,
  register = false
} = {}) {
  const present = credentialPresent(env, credentialEnv);
  const adapterId = str(id) || `generic-${kind}`;
  const card = {
    id: adapterId,
    kind,
    capabilities: () => [kind, "generic"],
    credential_env: credentialEnv,
    credential_present: present,
    secret_value: null,
    state: present ? "CONFIGURED" : "NOT_CONNECTED",
    observed: false,
    connected: false,
    live: false,
    reason: present ? "CONFIGURED_NOT_CONNECTED" : "NOT_CONNECTED",
    authority: "carl"
  };
  if (register === true) {
    registerAdapter({
      id: adapterId,
      kind,
      capabilities: () => [kind, "generic"],
      observe: async () => ({ status: present ? "CONFIGURED" : "NOT_OBSERVED", live: false })
    });
  }
  const lifecycle = configuredIsNotConnected({
    id: adapterId,
    state: card.state,
    configured: present,
    credentials_present: present,
    connected: false,
    reachable: false
  });
  return { ...card, lifecycle, discovered: discoverAdapters({ filter: adapterId }), live: false };
}

export function connectProvidersIfPresent({ env = process.env } = {}) {
  const stripe = createStripeAdapter({ env });
  const rail = stripeTruth(stripe);
  const generic = genericProviderAdapter({
    id: "generic-http",
    kind: "http",
    env,
    credentialEnv: "ACORN_GENERIC_HTTP_TOKEN"
  });
  return {
    stripe: {
      ...rail,
      state: rail.configured ? "CONFIGURED" : "NOT_CONNECTED",
      observed: false,
      connected: false,
      live: false
    },
    generic,
    any_connected: false,
    any_live: false,
    note: rail.configured
      ? "KEY_PRESENT_IS_NOT_CONNECTED_AND_NOT_LIVE"
      : "NOT_CONNECTED",
    live: false,
    authority: "carl"
  };
}

export function auditProjectSecurity({
  project,
  actorTenant = null,
  url = null,
  path = "/",
  webhook = null,
  paymentClaim = null,
  authorityClaim = null
} = {}) {
  const tenantOk = isolateTenant(
    { tenant_id: actorTenant },
    { tenant_id: project?.tenant_id }
  );
  const idor = Boolean(actorTenant && project?.tenant_id && actorTenant !== project.tenant_id);
  const ssrf = url ? resolveConnectorUrl(url, path) : { ok: false, reason: "NO_URL" };
  const hook = webhook
    ? verifyWebhookSignature(webhook)
    : { valid: false, reason: "NOT_PROVIDED", live: false };
  const paymentSpoof = paymentClaim?.paid === true && paymentClaim?.observed !== true;
  const authoritySpoof = (authorityClaim?.authorized === true || paymentClaim?.execution_authorized === true)
    && authorityClaim?.human_authorized !== true
    && paymentClaim?.human_authorized !== true;
  const external = url
    ? buildExternalCall({
      connector: { id: "audit", provider: "test", base_url: url, effect: "READ" },
      path,
      human_authorized: false
    })
    : { state: "BLOCKED", reason: "NO_URL" };
  return {
    tenant_isolation: tenantOk,
    idor_blocked: idor || !tenantOk,
    ssrf: ssrf.ok ? "URL_IN_SCOPE" : (ssrf.reason || "URL_OUT_OF_SCOPE"),
    webhook: hook,
    payment_spoof_rejected: paymentSpoof === true,
    authority_spoof_rejected: authoritySpoof === true,
    external_execution: {
      state: external.state || "BLOCKED",
      reason: external.reason || null,
      fail_closed: external.state !== "AUTHORIZED"
    },
    fail_closed: true,
    live: false,
    authority: "carl"
  };
}

export function projectObservability(project, { evidence = [], commercial = null } = {}) {
  const validation = validateUniversalProject(project);
  const live = refreshLiveEvidence(evidence);
  const current = proofGate({ evidence: live });
  return {
    where_are_we: project?.execution_state || "UNKNOWN",
    what_has_been_done: arr(project?.outcomes),
    what_is_running: arr(project?.tasks).filter((t) => t?.state === "RUNNING").map((t) => t.id),
    what_is_blocked: validation.blockers,
    what_failed: arr(project?.tasks).filter((t) => t?.state === "FAILED").map((t) => t.id),
    what_is_verified: project?.verification_state === "VERIFIED",
    what_is_delivered: project?.delivery_state === "DELIVERED",
    what_is_live: false,
    what_requires_human: project?.authority?.granted === true ? [] : ["AUTHORIZATION"],
    what_will_happen_next: PROJECT_LIFECYCLE[Math.min(
      PROJECT_LIFECYCLE.indexOf(str(project?.execution_state).toUpperCase()) + 1,
      PROJECT_LIFECYCLE.length - 1
    )] || "UNKNOWN",
    commercial: commercial
      ? {
        checkout_created: commercial.checkout_created === true,
        payment_observed: commercial.payment_observed === true,
        execution_authorized: commercial.execution_authorized === true,
        delivered: commercial.delivered === true
      }
      : null,
    evidence_current: current.ready,
    evidence_count: current.current_count,
    live: false,
    measured_at: iso()
  };
}

export function composeExistingFabrics(input = {}) {
  const project = createUniversalProject({
    id: input.id || input.projectId || `project_${Date.now().toString(36)}`,
    tenantId: input.tenantId || null,
    kind: input.kind,
    scale: input.scale,
    programId: input.programId,
    portfolioId: input.portfolioId,
    customer: input.customer || null,
    organization: input.organization || null,
    problem: input.problem || "UNSPECIFIED_PROJECT",
    requirements: input.requirements || [],
    capabilities: input.capabilities || input.requiredCapabilities || [],
    intelligences: input.intelligences || [],
    connectors: input.connectors || [],
    tasks: input.tasks || []
  });
  const operated = operateProblem({
    tenantId: input.tenantId,
    customerId: input.customerId || input.tenantId,
    problem: project.problem,
    requestId: project.id,
    intelligences: input.intelligences || [],
    connectors: input.connectors || [],
    capabilities: project.capabilities
  });
  const commercial = bindCommercialCycle({
    project,
    tenantId: input.tenantId,
    customerId: input.customerId || input.tenantId,
    problem: project.problem,
    audience: input.audience || "BUSINESS",
    intelligences: input.intelligences || [],
    connectors: input.connectors || [],
    offer: input.offer || null,
    checkoutSession: input.checkoutSession || null,
    paymentEntry: input.paymentEntry || null,
    authorized: input.authorized === true,
    validated: input.validated === true
  });
  const intelligences = arr(input.intelligences).map((row, i) => createIntelligence({
    id: row.id || `intel_${i}`,
    provider: row.provider || "unknown",
    model: row.model || "unknown",
    capabilities: row.capabilities || project.capabilities
  }));
  const routes = routeIntelligence(
    { required_capabilities: project.capabilities },
    { intelligences, connections: input.connectors || [] }
  );
  const task = createTask({
    projectId: project.id,
    kind: "ANALYZE",
    title: "Qualify project",
    requiredCapabilities: project.capabilities
  });
  const plan = buildExecutionPlan({
    projectId: project.id,
    tasks: [task],
    authorized: input.authorized === true
  });
  const started = startTask(task, { authorized: input.authorized === true });
  const evidence = refreshLiveEvidence(input.evidence || [], { now: input.now, reobserve: input.reobserve });
  const value = universalProjectValueCycle({
    intake: { intention: project.problem, audience: input.audience || "BUSINESS" },
    execution: { executed: input.executed === true },
    evidence: { verified: input.verified === true },
    measured_value: input.measured_value
  });
  const gaps = detectGaps({
    task: project.problem,
    required: project.capabilities,
    known: project.capabilities,
    catalog: [],
    connectors: input.connectors || []
  });
  const providers = connectProvidersIfPresent({ env: input.env || process.env });
  const security = auditProjectSecurity({
    project,
    actorTenant: input.actorTenant || input.tenantId,
    url: input.url,
    path: input.path || "/",
    webhook: input.webhook,
    paymentClaim: input.paymentClaim,
    authorityClaim: input.authorityClaim
  });
  const dated = temporalFact({
    tenant_id: project.tenant_id,
    entity_id: project.id,
    epistemic: "OBSERVED",
    payload: { execution_state: project.execution_state }
  });
  return {
    contract: universalProjectContract(),
    project,
    validation: validateUniversalProject(project),
    operated,
    commercial,
    intelligence: intelligenceSnapshot(intelligences),
    routes,
    execution: { plan, started, snapshot: executionSnapshot(plan) },
    evidence,
    value,
    gaps,
    providers,
    security,
    observability: projectObservability(project, { evidence, commercial }),
    dated,
    second_runtime: false,
    second_graph: false,
    second_market_engine: false,
    second_execution_fabric: false,
    second_evidence_engine: false,
    second_self_build: false,
    live: false,
    authority: "carl",
    measured_at: iso()
  };
}

export function projectForKind(kind, extra = {}) {
  const k = UNIVERSAL_PROJECT_KINDS.includes(kind) ? kind : "software";
  return composeExistingFabrics({
    id: extra.id || `kind-${k}`,
    tenantId: extra.tenantId || `tenant-${k}`,
    customerId: extra.customerId || `cust-${k}`,
    kind: k,
    scale: extra.scale || (k === "program" ? "PROGRAM" : k === "multi-org" ? "MULTI_ORGANIZATION" : "PROJECT"),
    problem: extra.problem || `${k} project`,
    capabilities: extra.capabilities || [k],
    ...extra
  });
}

export function proofMatrix(observations = {}) {
  const blocks = [
    "contract","commercial","execution","intelligence","connectors","evidence",
    "customer","value","self_build","continuous","security","providers"
  ];
  const out = {};
  for (const id of blocks) {
    const row = observations[id] || {};
    const liveObserved = row.liveObserved === true && row.LIVE === true;
    out[id] = {
      CODE_PRESENT: row.CODE_PRESENT === true,
      TESTED: row.TESTED === true,
      EXECUTED: row.EXECUTED === true,
      MEASURED: row.MEASURED === true,
      VERIFIED: row.VERIFIED === true,
      LIVE: liveObserved === true,
      LIVE_STATUS: liveObserved ? "OBSERVED" : (row.LIVE === true ? "LIVE_CLAIM_REJECTED" : "NOT_OBSERVED")
    };
  }
  return {
    version: UNIVERSAL_PROJECT_CONTRACT_VERSION,
    cells: out,
    invented: false,
    live: false,
    measured_at: iso()
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify({
    contract: universalProjectContract(),
    providers: connectProvidersIfPresent(),
    live: false
  }, null, 2));
}
