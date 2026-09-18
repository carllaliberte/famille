#!/usr/bin/env node
/**
 * ACORN — CLIENT READY OPERATING SYSTEM
 *
 * Final operational control plane between a customer request and a
 * human-authorized turnkey delivery. It composes existing engines rather
 * than replacing them.
 *
 * INTAKE → QUALIFY → OFFER → AUTHORIZE → BUILD → VERIFY → DELIVER
 * → HANDOFF → SUPPORT → EXPAND
 */
export const CLIENT_READY_VERSION = "acorn.client-ready.v1";

const str = (v) => String(v ?? "").trim();
const arr = (v) => Array.isArray(v) ? v : [];
const yes = (v) => v === true;

export const CLIENT_READY_POLICY = Object.freeze({
  customer_first: true,
  turnkey: true,
  proof_before_claim: true,
  measured_value_only: true,
  explicit_rights: true,
  human_authorization_required: true,
  human_authority: "carl",
  auto_contract: false,
  auto_payment_capture: false,
  auto_spend: false,
  auto_outreach: false,
  auto_merge: false,
  no_fake_live: true,
});

export const CLIENT_STAGES = Object.freeze([
  "INTAKE",
  "QUALIFY",
  "OFFER_READY",
  "HOLD_HUMAN_AUTHORIZATION",
  "AUTHORIZED",
  "BUILDING",
  "VERIFYING",
  "READY_TO_DELIVER",
  "DELIVERED",
  "HANDOFF",
  "SUPPORT",
  "EXPANSION",
  "CLOSED",
]);

export function buildClientOrder({
  order_id = null,
  customer_id = null,
  request = "",
  success_criteria = [],
  constraints = [],
  budget = null,
  deadline = null,
  contact = null,
} = {}) {
  const clean = str(request);
  return {
    version: CLIENT_READY_VERSION,
    order_id: order_id ? str(order_id) : null,
    customer_id: customer_id ? str(customer_id) : null,
    request: clean,
    success_criteria: [...new Set(arr(success_criteria).map(str).filter(Boolean))],
    constraints: [...new Set(arr(constraints).map(str).filter(Boolean))],
    budget: budget == null ? null : Math.max(0, Number(budget) || 0),
    deadline: deadline ? str(deadline) : null,
    contact: contact ? str(contact) : null,
    stage: clean ? "INTAKE" : "HOLD_HUMAN_AUTHORIZATION",
    valid: Boolean(clean),
  };
}

export function buildOfferReady({
  order = null,
  solution_summary = "",
  deliverables = [],
  evidence_plan = [],
  measured_value_plan = [],
  usage_rights = [],
  price = null,
  currency = "USD",
  support = null,
} = {}) {
  const evidencePlan = arr(evidence_plan).map(str).filter(Boolean);
  const rights = [...new Set(arr(usage_rights).map(str).filter(Boolean))];
  const deliver = [...new Set(arr(deliverables).map(str).filter(Boolean))];
  const ready = Boolean(order?.valid && str(solution_summary) && deliver.length && evidencePlan.length && rights.length);
  return {
    version: CLIENT_READY_VERSION,
    order_id: order?.order_id || null,
    solution_summary: str(solution_summary),
    deliverables: deliver,
    evidence_plan: evidencePlan,
    measured_value_plan: arr(measured_value_plan).map(str).filter(Boolean),
    usage_rights: rights,
    price: price == null ? null : Math.max(0, Number(price) || 0),
    currency: str(currency || "USD").toUpperCase(),
    support: support ? str(support) : null,
    stage: ready ? "OFFER_READY" : "HOLD_HUMAN_AUTHORIZATION",
    human_authorization_required: true,
    auto_contract: false,
  };
}

export function authorizeOrder({ order = null, offer = null, human_authorized = false, authorized_by = null } = {}) {
  const authorized = Boolean(yes(human_authorized) && Boolean(order?.valid) && offer?.stage === "OFFER_READY" && str(authorized_by));
  return {
    order_id: order?.order_id || null,
    authorized,
    stage: authorized ? "AUTHORIZED" : "HOLD_HUMAN_AUTHORIZATION",
    authorized_by: authorized ? str(authorized_by) : null,
    auto_contract: false,
    authority: "carl",
  };
}

export function buildDeliveryChecklist({
  deliverables = [],
  evidence = [],
  access = [],
  documentation = [],
  training = [],
  usage_rights = [],
  support = [],
  payment_verified = false,
} = {}) {
  const verifiedEvidence = arr(evidence).filter((x) => yes(x?.verified) || yes(x?.proven));
  const items = [
    ["DELIVERABLES", arr(deliverables).length > 0],
    ["VERIFIED_EVIDENCE", verifiedEvidence.length > 0],
    ["ACCESS", arr(access).length > 0],
    ["DOCUMENTATION", arr(documentation).length > 0],
    ["TRAINING_OR_GUIDANCE", arr(training).length > 0],
    ["USAGE_RIGHTS", arr(usage_rights).length > 0],
    ["SUPPORT_PATH", arr(support).length > 0],
    ["PAYMENT_STATUS", yes(payment_verified)],
  ];
  const missing = items.filter(([, ok]) => !ok).map(([name]) => name);
  return {
    ready: missing.length === 0,
    missing,
    verified_evidence_count: verifiedEvidence.length,
    payment_verified: yes(payment_verified),
    no_auto_payment_capture: true,
  };
}

export function buildHandoff({
  customer = null,
  access = [],
  documentation = [],
  training = [],
  rights = [],
  support = [],
  evidence = [],
} = {}) {
  const verifiedEvidence = arr(evidence).filter((x) => yes(x?.verified) || yes(x?.proven));
  return {
    customer: customer ? str(customer) : null,
    access: arr(access).map(str).filter(Boolean),
    documentation: arr(documentation).map(str).filter(Boolean),
    training: arr(training).map(str).filter(Boolean),
    usage_rights: [...new Set(arr(rights).map(str).filter(Boolean))],
    support: arr(support).map(str).filter(Boolean),
    proof_index: verifiedEvidence.map((x) => x?.id || x?.evidence_id || null).filter(Boolean),
    stage: verifiedEvidence.length ? "HANDOFF" : "HOLD_HUMAN_AUTHORIZATION",
    live: false,
  };
}

export function buildSupportPlan({ support_level = "STANDARD", sla = null, owner = "ACORN" } = {}) {
  return {
    level: str(support_level || "STANDARD").toUpperCase(),
    sla: sla ? str(sla) : null,
    owner: str(owner || "ACORN"),
    intake_path: "CUSTOMER_SUPPORT",
    escalation: "HUMAN",
    autonomous_contract_change: false,
  };
}

export function clientReadyCycle(input = {}) {
  const order = buildClientOrder(input.order || input);
  const offer = buildOfferReady({
    order,
    solution_summary: input.solution_summary,
    deliverables: input.deliverables,
    evidence_plan: input.evidence_plan,
    measured_value_plan: input.measured_value_plan,
    usage_rights: input.usage_rights,
    price: input.price,
    currency: input.currency,
    support: input.support_summary,
  });
  const authorization = authorizeOrder({
    order,
    offer,
    human_authorized: input.human_authorized,
    authorized_by: input.authorized_by,
  });
  const checklist = buildDeliveryChecklist({
    deliverables: input.deliverables,
    evidence: input.evidence,
    access: input.access,
    documentation: input.documentation,
    training: input.training,
    usage_rights: input.usage_rights,
    support: input.support,
    payment_verified: input.payment_verified,
  });
  const handoff = buildHandoff({
    customer: input.customer_id,
    access: input.access,
    documentation: input.documentation,
    training: input.training,
    rights: input.usage_rights,
    support: input.support,
    evidence: input.evidence,
  });
  const stage = !order.valid ? "INTAKE"
    : !authorization.authorized ? "HOLD_HUMAN_AUTHORIZATION"
    : !checklist.ready ? "BUILDING"
    : handoff.stage === "HANDOFF" ? "HANDOFF"
    : "READY_TO_DELIVER";
  return {
    version: CLIENT_READY_VERSION,
    flow: ["INTAKE","QUALIFY","OFFER","AUTHORIZE","BUILD","VERIFY","DELIVER","HANDOFF","SUPPORT","EXPANSION"],
    stage,
    order,
    offer,
    authorization,
    checklist,
    handoff,
    support_plan: buildSupportPlan({
      support_level: input.support_level,
      sla: input.sla,
      owner: input.support_owner,
    }),
    policy: CLIENT_READY_POLICY,
    live: false,
    authority: "carl",
  };
}

export function clientReadyPolicy() {
  return CLIENT_READY_POLICY;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(clientReadyPolicy(), null, 2));
}
