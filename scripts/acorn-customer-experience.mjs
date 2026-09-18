#!/usr/bin/env node
/**
 * ACORN — TURNKEY CUSTOMER EXPERIENCE
 *
 * Converts the measured Project-to-Value cycle into one coherent customer
 * delivery package. This is a customer-facing state model, not a legal
 * contract and not an autonomous sales/contracting authority.
 *
 * Customer promise:
 * UNDERSTAND -> DESIGN -> BUILD -> PROVE -> DELIVER -> TRANSFER -> EXPAND
 *
 * CAPABILITY != AUTHORITY. Evidence > assertion.
 */

export const CUSTOMER_EXPERIENCE_VERSION = "acorn.customer-experience.v1";

const str = (v) => String(v ?? "").trim();
const arr = (v) => Array.isArray(v) ? v : [];
const pos = (v) => Math.max(0, Number.isFinite(Number(v)) ? Number(v) : 0);

export const CUSTOMER_EXPERIENCE_POLICY = Object.freeze({
  customer_first: true,
  turnkey: true,
  one_coherent_delivery: true,
  proof_before_claim: true,
  measured_value_only: true,
  usage_rights_explicit: true,
  legal_contract_required_for_contract: true,
  auto_contract: false,
  auto_spend: false,
  auto_outreach: false,
  no_fake_live: true,
  human_authority: "carl",
});

export const CUSTOMER_STAGES = Object.freeze([
  "INTAKE",
  "UNDERSTOOD",
  "DESIGNED",
  "BUILDING",
  "VERIFYING",
  "READY_TO_DELIVER",
  "DELIVERED",
  "HANDOFF",
  "SUPPORT",
  "EXPANSION",
  "HOLD_HUMAN",
]);

export function buildCustomerBrief({
  customer_id = null,
  project_id = null,
  customer_name = null,
  intention = "",
  desired_outcome = "",
  constraints = [],
  deadline = null,
  budget = null,
  audience = "BUSINESS",
} = {}) {
  const cleanIntention = str(intention);
  return Object.freeze({
    version: CUSTOMER_EXPERIENCE_VERSION,
    customer_id: customer_id ? str(customer_id) : null,
    project_id: project_id ? str(project_id) : null,
    customer_name: customer_name ? str(customer_name) : null,
    audience: str(audience || "BUSINESS").toUpperCase(),
    what_we_understood: cleanIntention,
    desired_outcome: str(desired_outcome),
    constraints: [...new Set(arr(constraints).map(str).filter(Boolean))],
    deadline: deadline ? str(deadline) : null,
    budget: budget == null ? null : pos(budget),
    state: cleanIntention ? "UNDERSTOOD" : "INTAKE",
    customer_confirmation_required: true,
    authority: "carl",
  });
}

export function buildDeliveryPackage({
  project = {},
  solution = {},
  evidence = [],
  deliverables = [],
  usage_rights = [],
  handoff = {},
  support = {},
  measured_value = 0,
  currency = "USD",
} = {}) {
  const verifiedEvidence = arr(evidence).filter((x) =>
    x?.verified === true || x?.proven === true || x?.status === "VERIFIED" || x?.status === "PROVEN"
  );
  const items = arr(deliverables).map((x) => ({
    id: str(x?.id || x?.name || "deliverable"),
    name: str(x?.name || x?.id || "Deliverable"),
    state: str(x?.state || "READY").toUpperCase(),
    verified: x?.verified === true,
  }));
  const rights = [...new Set(arr(usage_rights).map(str).filter(Boolean))];
  const value = verifiedEvidence.length > 0 ? pos(measured_value) : 0;

  return Object.freeze({
    version: CUSTOMER_EXPERIENCE_VERSION,
    project_id: project?.id || null,
    solution: {
      name: str(solution?.name || project?.intention || "Acorn Solution"),
      description: str(solution?.description),
    },
    deliverables: items,
    evidence: verifiedEvidence.map((x) => ({
      id: x?.id || x?.evidence_id || null,
      status: "VERIFIED",
      source: x?.source || null,
      observed_at: x?.observed_at || null,
    })),
    measured_value: value,
    currency: str(currency || "USD").toUpperCase(),
    usage_rights: rights,
    handoff: {
      included: true,
      owner: handoff?.owner || null,
      documentation: handoff?.documentation === true,
      access_transferred: handoff?.access_transferred === true,
      training: handoff?.training === true,
    },
    support: {
      included: support?.included === true,
      period: support?.period || null,
      channel: support?.channel || null,
    },
    proof_state: verifiedEvidence.length > 0 ? "EVIDENCED" : "UNVERIFIED",
    delivery_state: items.length > 0 && items.every((x) => x.verified || x.state === "READY")
      ? "READY_TO_DELIVER" : "BUILDING",
    live: false,
    authority: "carl",
  });
}

export function buildCustomerJourney({
  brief = null,
  delivery = null,
  customer_confirmation = false,
  contract = null,
  payment = null,
} = {}) {
  const confirmed = customer_confirmation === true;
  const contractValid = contract?.signed === true;
  const paymentVerified = payment?.verified === true;
  const hasBrief = brief?.state === "UNDERSTOOD";
  const hasProof = delivery?.proof_state === "EVIDENCED";
  const hasDelivery = delivery?.delivery_state === "READY_TO_DELIVER" || delivery?.delivery_state === "DELIVERED";

  let stage = "INTAKE";
  if (hasBrief) stage = "UNDERSTOOD";
  if (hasBrief && confirmed) stage = "DESIGNED";
  if (hasBrief && confirmed && delivery?.delivery_state === "BUILDING") stage = "BUILDING";
  if (hasProof && hasDelivery) stage = "READY_TO_DELIVER";
  if (hasProof && hasDelivery && contractValid && paymentVerified) stage = "DELIVERED";
  if (hasProof && hasDelivery && (!contractValid || !paymentVerified)) stage = "HOLD_HUMAN";

  const blockers = [];
  if (!hasBrief) blockers.push("CUSTOMER_BRIEF_INCOMPLETE");
  if (hasBrief && !confirmed) blockers.push("CUSTOMER_CONFIRMATION_REQUIRED");
  if (hasProof === false) blockers.push("VERIFIED_EVIDENCE_REQUIRED");
  if (hasDelivery === false) blockers.push("DELIVERABLES_NOT_READY");
  if (stage === "DELIVERED" && !contractValid) blockers.push("SIGNED_CONTRACT_REQUIRED");
  if (stage === "DELIVERED" && !paymentVerified) blockers.push("PAYMENT_VERIFICATION_REQUIRED");

  return Object.freeze({
    version: CUSTOMER_EXPERIENCE_VERSION,
    stage,
    stages: CUSTOMER_STAGES,
    blockers: [...new Set(blockers)],
    customer_can_see: {
      understanding: hasBrief,
      solution: Boolean(delivery?.solution?.name),
      proof: hasProof,
      value: hasProof && pos(delivery?.measured_value) > 0,
      deliverables: hasDelivery,
      usage_rights: arr(delivery?.usage_rights).length > 0,
      handoff: delivery?.handoff?.included === true,
      support: delivery?.support?.included === true,
    },
    commercial_state: contractValid && paymentVerified ? "HUMAN_VERIFIED" : "HUMAN_ACTION_REQUIRED",
    auto_contract: false,
    auto_spend: false,
    live: false,
    authority: "carl",
  });
}

export function buildExpansionPlan({
  delivered = false,
  verified_value = 0,
  reusable_asset = false,
  repeat_demand = 0,
  support_needed = false,
} = {}) {
  const value = pos(verified_value);
  const demand = pos(repeat_demand);
  const actions = [];
  if (delivered && value > 0) actions.push("MEASURE_EXPANSION_VALUE");
  if (delivered && reusable_asset) actions.push("PACKAGE_REUSABLE_ASSET");
  if (delivered && demand > 0) actions.push("OFFER_REPEATABLE_SOLUTION");
  if (support_needed) actions.push("MAINTENANCE_OR_OPTIMIZATION");
  return Object.freeze({
    version: CUSTOMER_EXPERIENCE_VERSION,
    actions,
    delivered,
    verified_value: value,
    repeat_demand: demand,
    no_auto_outreach: true,
    requires_human_authorization: true,
    authority: "carl",
  });
}

export function customerExperiencePolicy() {
  return CUSTOMER_EXPERIENCE_POLICY;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(customerExperiencePolicy(), null, 2));
}
