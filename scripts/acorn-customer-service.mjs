#!/usr/bin/env node
/**
 * ACORN — CUSTOMER AUTONOMOUS SERVICE KERNEL
 *
 * Customer-facing operational composition:
 * INTAKE → QUALIFY → OFFER → HUMAN AUTHORIZATION → PAYMENT → ONBOARDING
 * → EXECUTION → VERIFY → DELIVERY → ACCEPTANCE → SUPPORT → EXPANSION
 *
 * This module is deliberately provider/rail agnostic. External payment,
 * identity, storage and deployment systems are adapters; Acorn never invents
 * their state and never takes custody of secrets or funds.
 */

export const CUSTOMER_SERVICE_VERSION = "acorn.customer-service.v1";

export const CUSTOMER_SERVICE_POLICY = Object.freeze({
  customer_first: true,
  autonomous_customer_journey: true,
  turnkey: true,
  proof_before_claim: true,
  measured_value_only: true,
  tenant_isolation_required: true,
  explicit_usage_rights: true,
  human_authorization_required: true,
  human_authority: "carl",
  auto_contract: false,
  auto_payment_capture: false,
  auto_spend: false,
  auto_outreach: false,
  auto_merge: false,
  secret_custody: false,
  invented_live: false,
});

export const CUSTOMER_STAGES = Object.freeze([
  "INTAKE","QUALIFY","OFFER_READY","HOLD_HUMAN_AUTHORIZATION",
  "AUTHORIZED","PAYMENT_PENDING","ONBOARDING","READY_TO_BUILD",
  "BUILDING","VERIFYING","READY_TO_DELIVER","DELIVERED",
  "CUSTOMER_ACCEPTANCE","SUPPORT","EXPANSION","CLOSED",
  "BLOCKED","HOLD_HUMAN",
]);

const str = (v) => String(v ?? "").trim();
const arr = (v) => Array.isArray(v) ? v : [];
const unique = (v) => [...new Set(arr(v).map(str).filter(Boolean))];

function id(prefix, value = "") {
  const seed = str(value) || "request";
  return `${prefix}_${seed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}`;
}

export function createCustomer({ customer_id, name, contact, locale = "en", tenant_id = null } = {}) {
  const customer = str(customer_id) || id("customer", name);
  return {
    customer_id: customer,
    tenant_id: str(tenant_id) || customer,
    name: str(name),
    contact: str(contact),
    locale: str(locale || "en"),
    active: true,
  };
}

export function createCustomerRequest({
  customer,
  request,
  success_criteria = [],
  constraints = [],
  budget = null,
  deadline = null,
  attachments = [],
} = {}) {
  const valid = Boolean(customer?.customer_id && customer?.tenant_id && str(request));
  return {
    request_id: id("req", request),
    customer_id: customer?.customer_id || null,
    tenant_id: customer?.tenant_id || null,
    request: str(request),
    success_criteria: unique(success_criteria),
    constraints: unique(constraints),
    budget: budget == null ? null : Math.max(0, Number(budget) || 0),
    deadline: deadline ? str(deadline) : null,
    attachments: unique(attachments),
    stage: valid ? "INTAKE" : "BLOCKED",
    valid,
  };
}

export function qualifyRequest(request, {
  capabilities = [],
  required_information = [],
  risk_flags = [],
  estimated_complexity = "UNKNOWN",
} = {}) {
  const missing = unique(required_information);
  const risks = unique(risk_flags);
  const capable = arr(capabilities).length > 0;
  const qualified = Boolean(request?.valid && capable && missing.length === 0);
  return {
    request_id: request?.request_id || null,
    qualified,
    stage: qualified ? "OFFER_READY" : (request?.valid ? "HOLD_HUMAN" : "BLOCKED"),
    capabilities: unique(capabilities),
    missing_information: missing,
    risk_flags: risks,
    estimated_complexity: str(estimated_complexity || "UNKNOWN").toUpperCase(),
    requires_human_review: risks.length > 0,
  };
}

export function buildCustomerOffer({
  request,
  qualification,
  solution,
  deliverables = [],
  evidence_plan = [],
  value_metrics = [],
  usage_rights = [],
  price = null,
  currency = "USD",
  support = "STANDARD",
  estimated_days = null,
} = {}) {
  const ready = Boolean(
    request?.valid &&
    qualification?.qualified &&
    str(solution) &&
    arr(deliverables).length &&
    arr(evidence_plan).length &&
    arr(usage_rights).length
  );
  return {
    offer_id: id("offer", request?.request_id),
    request_id: request?.request_id || null,
    customer_id: request?.customer_id || null,
    tenant_id: request?.tenant_id || null,
    solution: str(solution),
    deliverables: unique(deliverables),
    evidence_plan: unique(evidence_plan),
    value_metrics: unique(value_metrics),
    usage_rights: unique(usage_rights),
    price: price == null ? null : Math.max(0, Number(price) || 0),
    currency: str(currency || "USD").toUpperCase(),
    support: str(support || "STANDARD").toUpperCase(),
    estimated_days: estimated_days == null ? null : Math.max(0, Number(estimated_days) || 0),
    stage: ready ? "OFFER_READY" : "HOLD_HUMAN",
    human_authorization_required: true,
    auto_contract: false,
  };
}

export function authorizeCustomerOrder({ offer, authorized = false, authorized_by = null } = {}) {
  const ok = authorized === true && offer?.stage === "OFFER_READY" && Boolean(str(authorized_by));
  return {
    offer_id: offer?.offer_id || null,
    authorized: ok,
    authorized_by: ok ? str(authorized_by) : null,
    stage: ok ? "AUTHORIZED" : "HOLD_HUMAN_AUTHORIZATION",
    authority: "carl",
  };
}

export function buildPaymentIntent({ offer, external_payment_id = null, status = "PENDING", verified = false } = {}) {
  const normalized = str(status || "PENDING").toUpperCase();
  const known = new Set(["PENDING","PAID","PARTIAL","FAILED","REFUNDED","CANCELLED"]);
  const safeStatus = known.has(normalized) ? normalized : "PENDING";
  return {
    payment_id: str(external_payment_id) || null,
    offer_id: offer?.offer_id || null,
    amount: offer?.price ?? null,
    currency: offer?.currency || "USD",
    status: safeStatus,
    verified: verified === true && safeStatus === "PAID",
    source: external_payment_id ? "EXTERNAL_RAIL" : "UNVERIFIED",
    auto_capture: false,
    custody: false,
  };
}

export function buildOnboarding({ customer, access = [], files = [], environment = [], objectives = [] } = {}) {
  return {
    customer_id: customer?.customer_id || null,
    tenant_id: customer?.tenant_id || null,
    access: unique(access),
    files: unique(files),
    environment: unique(environment),
    objectives: unique(objectives),
    ready: Boolean(customer?.customer_id && customer?.tenant_id),
    stage: "ONBOARDING",
  };
}

export function buildExecutionPlan({ offer, onboarding, tasks = [], resources = [], intelligence = [] } = {}) {
  const valid = Boolean(offer?.offer_id && onboarding?.ready && arr(tasks).length);
  return {
    offer_id: offer?.offer_id || null,
    customer_id: onboarding?.customer_id || null,
    tenant_id: onboarding?.tenant_id || null,
    tasks: unique(tasks),
    resources: unique(resources),
    intelligence: unique(intelligence),
    stage: valid ? "READY_TO_BUILD" : "BLOCKED",
    tenant_isolation_required: true,
  };
}

export function buildVerification({ execution, evidence = [], tests = [], value_measurements = [] } = {}) {
  const verifiedEvidence = arr(evidence).filter((e) => e?.verified === true || e?.proven === true);
  const passedTests = arr(tests).filter((t) => t?.passed === true);
  const verified = Boolean(execution?.stage === "READY_TO_BUILD" && verifiedEvidence.length && passedTests.length);
  return {
    offer_id: execution?.offer_id || null,
    tenant_id: execution?.tenant_id || null,
    evidence: verifiedEvidence,
    tests: passedTests,
    value_measurements: arr(value_measurements),
    verified,
    stage: verified ? "READY_TO_DELIVER" : "VERIFYING",
    live: false,
  };
}

export function buildDelivery({ offer, verification, access = [], documentation = [], training = [] } = {}) {
  const ready = Boolean(
    verification?.verified &&
    arr(access).length &&
    arr(documentation).length &&
    arr(training).length &&
    arr(offer?.usage_rights).length
  );
  return {
    offer_id: offer?.offer_id || null,
    customer_id: offer?.customer_id || null,
    tenant_id: offer?.tenant_id || null,
    deliverables: unique(offer?.deliverables),
    evidence_index: arr(verification?.evidence).map((e) => e.id || e.evidence_id).filter(Boolean),
    access: unique(access),
    documentation: unique(documentation),
    training: unique(training),
    usage_rights: unique(offer?.usage_rights),
    stage: ready ? "DELIVERED" : "VERIFYING",
    live: false,
  };
}

export function buildSupportCase({ customer, delivery, issue = "", priority = "NORMAL" } = {}) {
  return {
    case_id: id("support", issue),
    customer_id: customer?.customer_id || null,
    tenant_id: customer?.tenant_id || null,
    delivery_id: delivery?.offer_id || null,
    issue: str(issue),
    priority: str(priority || "NORMAL").toUpperCase(),
    stage: "SUPPORT",
    escalation: "HUMAN",
  };
}

export function isolateTenant(record, customer) {
  const tenant = str(customer?.tenant_id);
  const recordTenant = str(record?.tenant_id);
  return Boolean(tenant && recordTenant && tenant === recordTenant);
}

export function customerServiceCycle(input = {}) {
  const customer = createCustomer(input.customer || input);
  const request = createCustomerRequest({
    customer,
    request: input.request,
    success_criteria: input.success_criteria,
    constraints: input.constraints,
    budget: input.budget,
    deadline: input.deadline,
    attachments: input.attachments,
  });
  const qualification = qualifyRequest(request, {
    capabilities: input.capabilities,
    required_information: input.required_information,
    risk_flags: input.risk_flags,
    estimated_complexity: input.estimated_complexity,
  });
  const offer = buildCustomerOffer({
    request,
    qualification,
    solution: input.solution,
    deliverables: input.deliverables,
    evidence_plan: input.evidence_plan,
    value_metrics: input.value_metrics,
    usage_rights: input.usage_rights,
    price: input.price,
    currency: input.currency,
    support: input.support,
    estimated_days: input.estimated_days,
  });
  const authorization = authorizeCustomerOrder({
    offer,
    authorized: input.human_authorized,
    authorized_by: input.authorized_by,
  });
  const payment = buildPaymentIntent({
    offer,
    external_payment_id: input.external_payment_id,
    status: input.payment_status,
    verified: input.payment_verified,
  });
  const onboarding = buildOnboarding({
    customer,
    access: input.access,
    files: input.files,
    environment: input.environment,
    objectives: input.objectives || input.success_criteria,
  });
  const execution = buildExecutionPlan({
    offer,
    onboarding,
    tasks: input.tasks,
    resources: input.resources,
    intelligence: input.intelligence,
  });
  const verification = buildVerification({
    execution,
    evidence: input.evidence,
    tests: input.tests,
    value_measurements: input.value_measurements,
  });
  const delivery = buildDelivery({
    offer,
    verification,
    access: input.delivery_access || input.access,
    documentation: input.documentation,
    training: input.training,
  });

  let stage = "BLOCKED";
  if (!request.valid) stage = "BLOCKED";
  else if (!qualification.qualified) stage = qualification.stage;
  else if (!authorization.authorized) stage = authorization.stage;
  else if (payment.status !== "PAID" || !payment.verified) stage = "PAYMENT_PENDING";
  else if (!onboarding.ready) stage = "ONBOARDING";
  else if (execution.stage !== "READY_TO_BUILD") stage = execution.stage;
  else if (!verification.verified) stage = verification.stage;
  else if (delivery.stage !== "DELIVERED") stage = delivery.stage;
  else stage = input.customer_accepted === true ? "SUPPORT" : "CUSTOMER_ACCEPTANCE";

  return {
    version: CUSTOMER_SERVICE_VERSION,
    policy: CUSTOMER_SERVICE_POLICY,
    stage,
    customer,
    request,
    qualification,
    offer,
    authorization,
    payment,
    onboarding,
    execution,
    verification,
    delivery,
    support: buildSupportCase({ customer, delivery, issue: input.support_issue || "Post-delivery support" }),
    expansion: {
      eligible: stage === "SUPPORT",
      basis: verification.value_measurements,
      human_authorization_required: true,
    },
    live: false,
    tenant_isolation_ok: isolateTenant({ tenant_id: request.tenant_id }, customer),
  };
}

export function customerServicePolicy() {
  return CUSTOMER_SERVICE_POLICY;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(customerServicePolicy(), null, 2));
}
