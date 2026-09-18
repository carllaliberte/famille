/** ACORN — CUSTOMER → VALUE
 * Closes the operational loop on existing primitives.
 * Not a second customer, commercial, or execution engine.
 *
 * CUSTOMER → DEMAND → QUALIFICATION → PROJECT → OFFER
 *          → PAYMENT → EXECUTION → DELIVERY → EVIDENCE → VALUE
 *
 * PAYMENT ≠ EXECUTION ≠ DELIVERY ≠ VERIFIED ≠ LIVE
 * Missing measurement is VALUE_NOT_MEASURED, never 0.
 */
import { createCustomer, createCustomerRequest, qualifyRequest } from "./acorn-customer-service.mjs";
import { createCommercialProject, measureProjectValue, proposeRenewal, proposeExpansion } from "./acorn-commercial-runtime.mjs";
import { proposeCapabilities } from "./acorn-operational-fabric.mjs";

export const CUSTOMER_VALUE_VERSION = "acorn.customer-value.v0";

export const PROJECT_CYCLE = Object.freeze([
  "INTAKE",
  "QUALIFYING",
  "WAITING_INFORMATION",
  "DESIGNING",
  "OFFERED",
  "AUTHORIZED",
  "PAYMENT_PENDING",
  "PAYMENT_OBSERVED",
  "EXECUTION_HOLD",
  "EXECUTING",
  "DELIVERING",
  "DELIVERED",
  "MEASURED",
  "RENEWABLE",
  "HOLD_HUMAN",
  "BLOCKED"
]);

const ISO = () => new Date().toISOString();
const str = (v) => String(v ?? "").trim();
const arr = (v) => (Array.isArray(v) ? v : []).map((x) => str(x)).filter(Boolean);

function uid(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function tooThin(intent) {
  const t = str(intent);
  if (t.length < 8) return true;
  return /^(hi|hello|hey|test|ok|oui|yes)$/i.test(t);
}

export function createDemand({
  id = null,
  tenantId,
  customerId,
  intent = "",
  objective = "",
  organization = null,
  constraints = [],
  deadline = null,
  budget = null,
  data = null,
  preferences = null,
  authorization_level = null,
  paid = false,
  human_authorized = false,
  live = false
} = {}) {
  const customer = createCustomer({ customer_id: customerId, tenant_id: tenantId, name: organization });
  const request = createCustomerRequest({
    customer,
    request: intent,
    constraints,
    budget,
    deadline
  });
  const demandId = id || request.request_id || uid("dem");
  return {
    id: demandId,
    tenant_id: customer.tenant_id,
    customer_id: customer.customer_id,
    organization: organization ? str(organization) : null,
    intent: str(intent),
    objective: str(objective),
    requirements: arr(constraints),
    constraints: arr(constraints),
    deadline: deadline ? str(deadline) : null,
    budget: budget == null ? null : Number(budget),
    data: data && typeof data === "object" ? data : null,
    preferences: preferences && typeof preferences === "object" ? preferences : null,
    authorization_level: str(authorization_level) || "NONE",
    client_paid_ignored: paid === true,
    client_authorization_ignored: human_authorized === true || live === true,
    authorized: false,
    paid: false,
    live: false,
    status: request.valid ? "INTAKE" : "BLOCKED",
    provenance: "acorn-customer-value",
    created_at: ISO()
  };
}

export function qualifyDemand(demand, { required_information = [], risk_flags = [] } = {}) {
  const missing = [...arr(required_information)];
  if (!demand?.intent || tooThin(demand.intent)) missing.unshift("problem");
  const capabilities = demand?.intent ? proposeCapabilities(demand.intent) : [];
  const request = {
    request_id: demand?.id,
    valid: Boolean(demand?.intent) && !tooThin(demand.intent),
    tenant_id: demand?.tenant_id
  };
  const base = qualifyRequest(request, {
    capabilities,
    required_information: missing,
    risk_flags,
    estimated_complexity: str(demand?.intent).length > 400 ? "HIGH" : (str(demand?.intent).length > 80 ? "MEDIUM" : "LOW")
  });
  const waiting = missing.length > 0;
  return {
    ...base,
    demand_id: demand?.id || null,
    qualified: !waiting && base.qualified,
    status: waiting ? "WAITING_INFORMATION" : (base.qualified ? "QUALIFIED" : "HOLD_HUMAN"),
    waiting_information: waiting,
    missing_information: [...new Set(missing)],
    invented_solution: false,
    authorized: false,
    live: false
  };
}

export function receiveDemand(input = {}) {
  const demand = createDemand(input);
  const qualification = qualifyDemand(demand, {
    required_information: input.required_information,
    risk_flags: input.risk_flags
  });
  if (qualification.waiting_information) {
    return {
      version: CUSTOMER_VALUE_VERSION,
      stage: "WAITING_INFORMATION",
      demand,
      qualification,
      commercial: null,
      offers: [],
      invented_solution: false,
      authorized: false,
      live: false,
      proof: { live: false, delivered: false, paid: false, payment_observed: false }
    };
  }
  const commercial = createCommercialProject({
    tenantId: demand.tenant_id,
    customerId: demand.customer_id,
    problem: demand.intent,
    requestId: demand.id,
    audience: input.audience || "BUSINESS",
    intelligences: input.intelligences || [],
    connectors: input.connectors || []
  });
  return {
    version: CUSTOMER_VALUE_VERSION,
    stage: "OFFERED",
    demand,
    qualification,
    commercial,
    offers: commercial.offers || [],
    invented_solution: false,
    authorized: false,
    live: false,
    proof: {
      live: false,
      delivered: false,
      paid: false,
      payment_observed: false,
      capability_is_not_authority: true
    }
  };
}

export function recordDelivery({
  projectId = null,
  order = null,
  execution = null,
  evidence = [],
  authorized = false,
  paid = false
} = {}) {
  const paymentObserved = order?.state === "PAYMENT_OBSERVED";
  const executionDone = execution?.state === "SUCCEEDED" || execution?.completed === true;
  const deliveryEvidence = (Array.isArray(evidence) ? evidence : []).filter((e) => {
    const claim = String(e?.claim || e?.kind || e?.status || "").toLowerCase();
    return /deliver|result|execution_completed|verified_output/.test(claim);
  });
  if (paid === true && !paymentObserved) {
    return {
      id: "del_" + (projectId || "unknown"),
      project_id: projectId,
      state: "NOT_DELIVERED",
      delivered: false,
      reason: "PAYMENT_SPOOF_IGNORED",
      live: false,
      verified: false
    };
  }
  if (!authorized) {
    return {
      id: "del_" + (projectId || "unknown"),
      project_id: projectId,
      state: "WAITING_HUMAN",
      delivered: false,
      reason: paymentObserved ? "PAYMENT_IS_NOT_DELIVERY" : "HUMAN_AUTHORIZATION_REQUIRED",
      payment_observed: paymentObserved,
      execution_done: executionDone,
      live: false,
      verified: false
    };
  }
  if (!executionDone && deliveryEvidence.length === 0) {
    return {
      id: "del_" + (projectId || "unknown"),
      project_id: projectId,
      state: "WAITING_HUMAN",
      delivered: false,
      reason: "EXECUTION_NOT_COMPLETE",
      live: false,
      verified: false
    };
  }
  return {
    id: "del_" + (projectId || "unknown"),
    project_id: projectId,
    order_id: order?.id || null,
    state: "DELIVERED",
    delivered: true,
    verified: false,
    live: false,
    evidence_ids: evidence.map((e) => e.id).filter(Boolean),
    reason: null,
    measured_at: ISO()
  };
}

export function recordOutcome({
  delivery = null,
  order = null,
  entry = null,
  measurements = null
} = {}) {
  if (!delivery?.delivered) {
    return {
      state: "VALUE_NOT_MEASURED",
      reason: "NOT_DELIVERED",
      revenue_cents: null,
      cost_cents: null,
      margin_cents: null,
      customer_value_cents: null,
      verified: false,
      live: false
    };
  }
  const m = measurements && typeof measurements === "object" ? measurements : {};
  const hasAny = m.result != null || m.cost_cents != null || m.customer_value_cents != null || m.quality != null;
  if (!hasAny && (entry?.gross_amount == null)) {
    return {
      state: "VALUE_NOT_MEASURED",
      reason: "NO_MEASUREMENT",
      revenue_cents: null,
      cost_cents: null,
      margin_cents: null,
      customer_value_cents: null,
      verified: false,
      live: false
    };
  }
  const value = measureProjectValue({
    order,
    entry,
    deliveryCostCents: m.cost_cents,
    customerValueCents: m.customer_value_cents
  });
  return {
    ...value,
    state: "OBSERVED",
    result: m.result || null,
    quality: m.quality == null ? null : m.quality,
    verified: false,
    live: false
  };
}

export function proposeNext({ outcome = null, gaps = [] } = {}) {
  return proposeExpansion({
    project: { id: outcome?.project_id || null },
    nextProblems: gaps
  });
}

export function projectCycleState({
  demand = null,
  qualification = null,
  project = null,
  offers = [],
  order = null,
  payment = null,
  execution = null,
  delivery = null,
  evidence = [],
  outcome = null,
  renewal = null
} = {}) {
  const paymentObserved = order?.state === "PAYMENT_OBSERVED" || payment?.state === "PAYMENT_OBSERVED";
  const offered = Array.isArray(offers) && offers.length > 0;
  let stage = "INTAKE";
  let blocked = null;
  if (!demand?.intent) {
    stage = "BLOCKED";
    blocked = "DEMAND_REQUIRED";
  } else if (qualification?.waiting_information) {
    stage = "WAITING_INFORMATION";
    blocked = "MISSING_INFORMATION";
  } else if (outcome?.state === "OBSERVED" && delivery?.delivered) {
    stage = renewal?.state === "PROPOSED" ? "RENEWABLE" : "MEASURED";
  } else if (delivery?.delivered) {
    stage = "DELIVERED";
  } else if (execution?.state === "RUNNING" || execution?.state === "SUCCEEDED") {
    stage = "EXECUTING";
  } else if (paymentObserved) {
    stage = "EXECUTION_HOLD";
    blocked = "PAYMENT_IS_NOT_EXECUTION";
  } else if (order?.state === "CHECKOUT_CREATED" || order?.state === "PAYMENT_PENDING") {
    stage = "PAYMENT_PENDING";
  } else if (order) {
    stage = "AUTHORIZED";
  } else if (offered) {
    stage = "OFFERED";
  } else if (qualification?.qualified) {
    stage = "DESIGNING";
  } else {
    stage = "QUALIFYING";
  }
  return {
    version: CUSTOMER_VALUE_VERSION,
    customer: {
      problem: demand?.intent || null,
      solution: offered,
      offer: offered,
      payment: paymentObserved,
      project: project?.id || demand?.id || null,
      result: delivery?.delivered === true,
      proof: Array.isArray(evidence) && evidence.length > 0,
      value: outcome?.state === "OBSERVED"
    },
    stage,
    blocked_reason: blocked,
    requires_human: stage === "EXECUTION_HOLD" || stage === "WAITING_INFORMATION" || stage === "HOLD_HUMAN",
    demand,
    qualification,
    project: project || { id: demand?.id || null, state: stage },
    offers,
    order: order ? { ...order, paid: false } : null,
    payment: {
      observed: paymentObserved,
      spoofed: false,
      live: false
    },
    execution: execution ? { ...execution, authorized: false } : null,
    delivery: delivery ? { ...delivery, delivered: delivery.delivered === true, live: false } : { delivered: false, state: "NOT_STARTED", live: false },
    evidence,
    outcome: outcome || { state: "VALUE_NOT_MEASURED", live: false },
    renewal: renewal || { state: "NOT_APPLICABLE", auto: false, live: false },
    live: false,
    verified: false,
    paid: false,
    billed: false,
    proof: {
      live: false,
      delivered: delivery?.delivered === true,
      payment_is_not_delivery: true,
      payment_is_not_execution: true,
      value_not_invented: outcome?.state !== "OBSERVED",
      human_authorization_required: true
    }
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const received = receiveDemand({ tenantId: "t", customerId: "c", intent: "Need a GitHub intake" });
  console.log(JSON.stringify({
    version: CUSTOMER_VALUE_VERSION,
    stage: received.stage,
    waiting: received.qualification.waiting_information,
    offers: (received.offers || []).length,
    live: false
  }));
}
