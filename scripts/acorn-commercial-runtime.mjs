#!/usr/bin/env node
/**
 * ACORN — STRIPE × COMMERCIAL RUNTIME
 *
 * Persistent customer/business journey composed over the existing
 * customer-service, market-engine and project-value ledger kernels.
 * Stripe is an adapter. This module owns Acorn commercial state.
 *
 * PROSPECT → CUSTOMER → DEMAND → QUALIFICATION → PROJECT → OFFER →
 * ORDER → PAYMENT → EXECUTION → DELIVERY → VALUE → RENEWAL/EXPANSION
 *
 * DEFINED ≠ CODE_PRESENT ≠ TESTED ≠ EXECUTED ≠ MEASURED ≠ VERIFIED ≠ LIVE.
 * Test Stripe ≠ Live Stripe. Checkout ≠ payment. Webhook ≠ receipt.
 */

import { OFFER_CATALOG, qualifyDemand, discoverDemand, billingFromMeasuredUsage } from "./acorn-market-engine.mjs";
import {
  createCustomer,
  createCustomerRequest,
  qualifyRequest,
  buildCustomerOffer,
  authorizeCustomerOrder,
  buildPaymentIntent,
  CUSTOMER_SERVICE_POLICY,
} from "./acorn-customer-service.mjs";
import { normalizeValueRecord } from "./acorn-project-value-ledger.mjs";
import {
  STRIPE_ADAPTER_VERSION,
  STRIPE_POLICY,
  classifyStripeEvent,
  observeStripeMoney,
  observedNumber,
  rejectClientPrice,
  requireMoneyAuthority,
  loadStripeConfig,
  publicStripeConfig,
} from "./acorn-stripe-adapter.mjs";

export const COMMERCIAL_RUNTIME_VERSION = "acorn.commercial-runtime.v1";

export const COMMERCIAL_STAGES = Object.freeze([
  "PROSPECT",
  "CUSTOMER",
  "DEMAND",
  "QUALIFICATION",
  "PROJECT",
  "OFFER",
  "ORDER",
  "PAYMENT",
  "EXECUTION",
  "DELIVERY",
  "VALUE",
  "RENEWAL",
  "EXPANSION",
  "HOLD_HUMAN",
  "BLOCKED",
]);

export const PAYMENT_STATES = Object.freeze([
  "UNPAID",
  "CHECKOUT_OPEN",
  "CHECKOUT_COMPLETED",
  "PAYMENT_PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIAL_REFUND",
  "DISPUTED",
  "CANCELLED",
  "INVOICE_OPEN",
  "INVOICE_PAID",
  "INVOICE_FAILED",
  "SUBSCRIPTION_ACTIVE",
  "SUBSCRIPTION_PAST_DUE",
  "SUBSCRIPTION_CANCELLED",
]);

export const RECONCILIATION_STATES = Object.freeze([
  "UNRECONCILED",
  "MATCHED",
  "HOLD",
  "MISSING_AMOUNT",
]);

export const COMMERCIAL_POLICY = Object.freeze({
  ...CUSTOMER_SERVICE_POLICY,
  ...STRIPE_POLICY,
  journey: COMMERCIAL_STAGES.slice(),
  client_price_rejected: true,
  checkout_is_not_payment: true,
  webhook_is_not_receipt: true,
  unsigned_webhook_ignored: true,
  absence_is_not_zero: true,
  live: false,
});

export const SERVER_OFFER_CATALOG = Object.freeze(OFFER_CATALOG.map((row) => ({
  id: row.id,
  name: row.name,
  unit: row.unit,
  audience: row.audience.slice(),
  currency: "CAD",
  unit_amount: null,
  price_source: "SERVER_CATALOG",
  terms: "Human authorization required. Preview is not a receipt.",
  usage_rights: ["CUSTOMER_USE_PENDING_HUMAN_AUTHORIZATION"],
})));

const str = (v) => String(v ?? "").trim();
const arr = (v) => Array.isArray(v) ? v : [];
const ISO = () => new Date().toISOString();

function id(prefix, seed = "") {
  const base = str(seed) || prefix;
  return `${prefix}_${base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}`;
}

export function serverPriceTable(env = process.env) {
  const raw = str(env.STRIPE_CATALOG_PRICES);
  const table = {};
  if (raw) {
    for (const part of raw.split(",")) {
      const [id, amount, currency] = part.split(":").map((x) => str(x));
      if (!id) continue;
      table[id] = { unit_amount: observedNumber(amount), currency: (currency || "CAD").toUpperCase(), source: "SERVER_CATALOG" };
    }
  }
  return table;
}

export function publicCatalog(env = process.env) {
  const prices = serverPriceTable(env);
  return SERVER_OFFER_CATALOG.map((row) => ({
    ...row,
    ...(prices[row.id] || {}),
    client_may_set_price: false,
    live: false,
  }));
}

export function createProspect({ prospect_id, name, contact, locale = "en", tenant_id = null } = {}) {
  return {
    prospect_id: str(prospect_id) || id("prospect", name || contact),
    name: str(name),
    contact: str(contact),
    locale: str(locale || "en"),
    tenant_id: str(tenant_id) || null,
    stage: "PROSPECT",
  };
}

export function becomeCustomer(prospect = {}, extras = {}) {
  const customer = createCustomer({
    customer_id: extras.customer_id || prospect.prospect_id,
    name: extras.name || prospect.name,
    contact: extras.contact || prospect.contact,
    locale: extras.locale || prospect.locale,
    tenant_id: extras.tenant_id || prospect.tenant_id,
  });
  return { ...customer, stage: "CUSTOMER", from_prospect: prospect.prospect_id || null };
}

export function createDemand({ customer, problem, audience = "BUSINESS", evidence = [], observed = true } = {}) {
  const [demand] = discoverDemand({
    signals: [{ id: id("demand", problem), problem, audience, evidence, observed, confidence: evidence.length ? 0.8 : 0.2 }],
  });
  return {
    ...demand,
    customer_id: customer?.customer_id || null,
    tenant_id: customer?.tenant_id || null,
    stage: demand ? "DEMAND" : "BLOCKED",
  };
}

export function qualifyCommercialDemand({ demand, capabilities = [] } = {}) {
  const request = createCustomerRequest({
    customer: { customer_id: demand?.customer_id, tenant_id: demand?.tenant_id },
    request: demand?.problem,
  });
  const qualification = qualifyRequest(request, { capabilities });
  const market = qualifyDemand({
    demand: [demand],
    capabilityIndex: capabilities.map((cap) => typeof cap === "string" ? { id: cap, tags: [cap], verified: true, evidence: [{ verified: true }] } : cap),
  })[0];
  const ok = qualification.qualified && market?.qualification === "EVIDENCE_BACKED";
  return {
    request,
    customer_service: qualification,
    market,
    qualified: ok,
    stage: ok ? "QUALIFICATION" : (request.valid ? "HOLD_HUMAN" : "BLOCKED"),
  };
}

export function createProject({ customer, demand, qualification } = {}) {
  const valid = Boolean(customer?.customer_id && demand?.id && qualification?.qualified);
  return {
    project_id: id("project", demand?.id || customer?.customer_id),
    customer_id: customer?.customer_id || null,
    tenant_id: customer?.tenant_id || null,
    demand_id: demand?.id || null,
    request_id: qualification?.request?.request_id || null,
    stage: valid ? "PROJECT" : "HOLD_HUMAN",
    live: false,
  };
}

export function createVersionedOffer({
  catalog_id = "custom",
  customer,
  project,
  qualification,
  currency = "CAD",
  unit_amount = null,
  terms = "Human authorization required. Preview is not a receipt.",
  usage_rights = ["CUSTOMER_USE_PENDING_HUMAN_AUTHORIZATION"],
  version = 1,
  interval = null,
  client = {},
} = {}) {
  const rejected = rejectClientPrice(client);
  if (!rejected.ok) {
    return { ok: false, stage: "BLOCKED", ...rejected, live: false };
  }
  const template = SERVER_OFFER_CATALOG.find((row) => row.id === catalog_id) || SERVER_OFFER_CATALOG.find((row) => row.id === "custom");
  const amount = observedNumber(unit_amount);
  const kernel = buildCustomerOffer({
    request: qualification?.request,
    qualification: qualification?.customer_service,
    solution: template.name,
    deliverables: [template.unit],
    evidence_plan: ["stripe observation", "runtime evidence"],
    usage_rights,
    price: amount == null ? null : amount / 100,
    currency,
  });
  return {
    ok: Boolean(template && customer?.customer_id && project?.project_id && amount != null && amount > 0 && str(currency)),
    offer_id: kernel.offer_id || id("offer", `${template.id}-${project?.project_id || "none"}`),
    catalog_id: template.id,
    name: template.name,
    unit: template.unit,
    version: Math.max(1, Number(version) || 1),
    currency: str(currency || "CAD").toUpperCase(),
    unit_amount: amount,
    price_source: "SERVER_CATALOG",
    terms: str(terms),
    usage_rights: arr(usage_rights),
    interval: interval ? str(interval) : null,
    customer_id: customer?.customer_id || null,
    tenant_id: customer?.tenant_id || project?.tenant_id || null,
    project_id: project?.project_id || null,
    kernel,
    client_price_rejected: true,
    stage: amount != null && amount > 0 ? "OFFER" : "HOLD_HUMAN",
    live: false,
  };
}

export function createOrder({ offer, authorization, customer } = {}) {
  const auth = authorization || authorizeCustomerOrder({ offer: offer?.kernel, authorized: false });
  const ready = Boolean(offer?.ok && offer.offer_id && auth.authorized === true);
  return {
    order_id: id("order", offer?.offer_id),
    offer_id: offer?.offer_id || null,
    offer_version: offer?.version || null,
    project_id: offer?.project_id || null,
    customer_id: customer?.customer_id || offer?.customer_id || null,
    tenant_id: customer?.tenant_id || offer?.tenant_id || null,
    currency: offer?.currency || null,
    unit_amount: offer?.unit_amount ?? null,
    price_source: "SERVER_CATALOG",
    authorized: ready,
    authorized_by: auth.authorized_by || null,
    stage: ready ? "ORDER" : "HOLD_HUMAN",
    payment_state: "UNPAID",
    live: false,
  };
}

export function paymentStateFromClass(eventClass, current = "UNPAID") {
  const map = {
    CHECKOUT_COMPLETED: "CHECKOUT_COMPLETED",
    CHECKOUT_EXPIRED: "CANCELLED",
    PAYMENT_SUCCEEDED: "PAID",
    PAYMENT_FAILED: "FAILED",
    INVOICE_PAID: "INVOICE_PAID",
    INVOICE_FAILED: "INVOICE_FAILED",
    INVOICE_OPEN: "INVOICE_OPEN",
    SUBSCRIPTION_CREATED: "SUBSCRIPTION_ACTIVE",
    SUBSCRIPTION_UPDATED: "SUBSCRIPTION_ACTIVE",
    SUBSCRIPTION_CANCELLED: "SUBSCRIPTION_CANCELLED",
    REFUND_OBSERVED: current === "PAID" || current === "INVOICE_PAID" ? "REFUNDED" : "REFUNDED",
    DISPUTE_OBSERVED: "DISPUTED",
    DISPUTE_CLOSED: current,
  };
  return map[eventClass] || current;
}

export function applyStripeObservation({
  order,
  event,
  signature,
  currentPaymentState = "UNPAID",
} = {}) {
  const classified = classifyStripeEvent(event);
  if (signature?.verified !== true) {
    return {
      accepted: false,
      reason: signature?.reason || "SIGNATURE_UNVERIFIED",
      payment_state: currentPaymentState,
      stage: order?.stage || "ORDER",
      classified,
      checkout_is_not_payment: true,
      webhook_is_not_receipt: true,
      live: false,
    };
  }
  if (classified.livemode === true) {
    return {
      accepted: false,
      reason: "LIVE_STRIPE_EVENT_HOLD",
      state: "HOLD_HUMAN",
      payment_state: currentPaymentState,
      classified,
      live: false,
    };
  }
  const next = paymentStateFromClass(classified.class, currentPaymentState);
  const money = observeStripeMoney(event.data?.object || {});
  const paid = next === "PAID" || next === "INVOICE_PAID";
  return {
    accepted: true,
    classified,
    money,
    payment_state: next,
    checkout_is_not_payment: classified.class === "CHECKOUT_COMPLETED",
    webhook_is_not_receipt: true,
    payment: buildPaymentIntent({
      offer: { offer_id: order?.offer_id, price: money.gross == null ? null : money.gross / 100, currency: money.currency || order?.currency },
      external_payment_id: classified.object_id,
      status: paid ? "PAID" : (next === "FAILED" || next === "INVOICE_FAILED" ? "FAILED" : next === "REFUNDED" ? "REFUNDED" : "PENDING"),
      verified: paid,
    }),
    stage: paid ? "PAYMENT" : (order?.stage || "ORDER"),
    live: false,
  };
}

export function buildCommercialLedgerEntry({
  observation,
  order,
  event,
  classified,
} = {}) {
  const money = observation || observeStripeMoney(event?.data?.object || {});
  const status = money.gross == null ? "OBSERVED_INCOMPLETE" : "OBSERVED";
  return {
    ...normalizeValueRecord({
      id: classified?.event_id || null,
      project_id: order?.project_id || null,
      offer_id: order?.offer_id || null,
      kind: classified?.class === "REFUND_OBSERVED" ? "REFUND" : "REVENUE",
      status,
      currency: money.currency || order?.currency || "CAD",
      amount: money.gross == null ? 0 : money.gross / 100,
      source: "stripe",
      evidence_id: classified?.event_id || null,
      observed_at: event?.created ? new Date(event.created * 1000).toISOString() : ISO(),
    }),
    gross: money.gross,
    fee: money.fee,
    net: money.net,
    tax: money.tax,
    stripe_event_id: classified?.event_id || event?.id || null,
    stripe_object_id: classified?.object_id || null,
    tenant_id: order?.tenant_id || null,
    customer_id: order?.customer_id || null,
    order_id: order?.order_id || null,
    reconciliation: money.gross == null ? "MISSING_AMOUNT" : "UNRECONCILED",
    invented_zero: false,
    live: false,
  };
}

export function reconcileEconomicRecords({ internal = [], stripe = [] } = {}) {
  const byEvent = new Map(stripe.map((row) => [str(row.stripe_event_id || row.id), row]));
  const rows = internal.map((row) => {
    const match = byEvent.get(str(row.stripe_event_id || row.id));
    if (!match) return { ...row, reconciliation: "HOLD", reason: "STRIPE_OBSERVATION_MISSING" };
    if (row.gross == null || match.gross == null) {
      return { ...row, reconciliation: "MISSING_AMOUNT", reason: "AMOUNT_NOT_OBSERVED" };
    }
    if (row.gross !== match.gross || str(row.currency) !== str(match.currency)) {
      return { ...row, reconciliation: "HOLD", reason: "AMOUNT_MISMATCH" };
    }
    return { ...row, reconciliation: "MATCHED" };
  });
  return {
    version: COMMERCIAL_RUNTIME_VERSION,
    rows,
    matched: rows.filter((r) => r.reconciliation === "MATCHED").length,
    hold: rows.filter((r) => r.reconciliation === "HOLD").length,
    missing_amount: rows.filter((r) => r.reconciliation === "MISSING_AMOUNT").length,
    invented: false,
    live: false,
  };
}

export function advanceStage({ current, signal } = {}) {
  const order = COMMERCIAL_STAGES;
  const from = str(current || "PROSPECT").toUpperCase();
  const to = str(signal || from).toUpperCase();
  if (!order.includes(from) || !order.includes(to)) return "HOLD_HUMAN";
  if (to === "HOLD_HUMAN" || to === "BLOCKED") return to;
  const fi = order.indexOf(from);
  const ti = order.indexOf(to);
  if (ti < fi) return from;
  if (ti > fi + 1 && !["RENEWAL", "EXPANSION", "VALUE", "DELIVERY"].includes(to)) return from;
  return to;
}

export function commercialJourney(input = {}) {
  const prospect = createProspect(input.prospect || input);
  const customer = becomeCustomer(prospect, input.customer || input);
  const demand = createDemand({
    customer,
    problem: input.request || input.problem,
    audience: input.audience || "BUSINESS",
    evidence: input.evidence || [{ verified: true }],
    observed: input.observed !== false,
  });
  const qualification = qualifyCommercialDemand({
    demand,
    capabilities: input.capabilities || ["general"],
  });
  const project = createProject({ customer, demand, qualification });
  const offer = createVersionedOffer({
    catalog_id: input.catalog_id || "custom",
    customer,
    project,
    qualification,
    currency: input.currency || "CAD",
    unit_amount: input.unit_amount,
    terms: input.terms,
    usage_rights: input.usage_rights,
    version: input.offer_version || 1,
    interval: input.interval,
    client: input.client || {},
  });
  const authorization = authorizeCustomerOrder({
    offer: offer.kernel,
    authorized: input.human_authorized === true,
    authorized_by: input.authorized_by,
  });
  const order = createOrder({ offer, authorization, customer });
  const stripeEvent = input.stripe_event || null;
  const observation = stripeEvent
    ? applyStripeObservation({
      order,
      event: stripeEvent,
      signature: input.signature,
      currentPaymentState: order.payment_state,
    })
    : { accepted: false, payment_state: order.payment_state, checkout_is_not_payment: true, webhook_is_not_receipt: true, live: false };
  let stage = "PROSPECT";
  if (customer.customer_id) stage = "CUSTOMER";
  if (demand.stage === "DEMAND") stage = "DEMAND";
  if (qualification.qualified) stage = "QUALIFICATION";
  if (project.stage === "PROJECT") stage = "PROJECT";
  if (offer.ok) stage = "OFFER";
  if (order.authorized) stage = "ORDER";
  if (observation.payment_state === "CHECKOUT_OPEN" || observation.payment_state === "CHECKOUT_COMPLETED") {
    stage = "ORDER";
  }
  if (observation.payment?.verified) stage = "PAYMENT";
  if (stage === "PAYMENT" && input.execution_started === true) stage = "EXECUTION";
  if (stage === "EXECUTION" && input.delivered === true) stage = "DELIVERY";
  if (stage === "DELIVERY" && input.value_measured === true) stage = "VALUE";
  if (stage === "VALUE" && input.renewal === true) stage = "RENEWAL";
  if (stage === "VALUE" && input.expansion === true) stage = "EXPANSION";
  if (offer.ok === false && offer.reason === "CLIENT_PRICE_REJECTED") stage = "BLOCKED";
  if (!authorization.authorized && offer.ok) stage = "HOLD_HUMAN";

  const ledger = observation.accepted
    ? buildCommercialLedgerEntry({ observation: observation.money, order, event: stripeEvent, classified: observation.classified })
    : null;

  return {
    version: COMMERCIAL_RUNTIME_VERSION,
    policy: COMMERCIAL_POLICY,
    stage,
    prospect,
    customer,
    demand,
    qualification,
    project,
    offer,
    authorization,
    order: { ...order, payment_state: observation.payment_state || order.payment_state },
    observation,
    payment: observation.payment || buildPaymentIntent({ offer: offer.kernel, status: "PENDING", verified: false }),
    ledger,
    usage: billingFromMeasuredUsage({
      offer: { id: offer.offer_id, billable: false },
      units: input.units,
      unit_price: null,
      currency: offer.currency,
      paymentRail: "stripe",
    }),
    stripe: publicStripeConfig(loadStripeConfig(input.env || {})),
    truth: {
      defined: true,
      code_present: true,
      tested: false,
      executed: observation.accepted === true,
      measured: ledger != null,
      verified: observation.payment?.verified === true,
      live: false,
    },
    live: false,
  };
}

export function commercialAuthorityGate(action, authority) {
  return requireMoneyAuthority({ action, authority });
}

export function commercialRuntimeSnapshot(env = process.env) {
  return {
    version: COMMERCIAL_RUNTIME_VERSION,
    adapter: STRIPE_ADAPTER_VERSION,
    policy: COMMERCIAL_POLICY,
    stages: COMMERCIAL_STAGES.slice(),
    payment_states: PAYMENT_STATES.slice(),
    catalog: publicCatalog(),
    stripe: publicStripeConfig(loadStripeConfig(env)),
    live: false,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(commercialRuntimeSnapshot(), null, 2));
}
