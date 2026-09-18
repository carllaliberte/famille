/** ACORN — COMMERCIAL RUNTIME
 * Composes existing fabrics into the real commercial cycle:
 * PROSPECT → CUSTOMER → DEMAND → QUALIFY → PROJECT → MATCH → OFFER
 * → ORDER → CHECKOUT → PAYMENT_OBSERVED → EXECUTION HOLD → DELIVERY
 * → VALUE → RENEWAL → EXPANSION → LEARNING
 *
 * Not a second brain. Stripe is a rail. Payment is not execution authority.
 * Checkout created ≠ paid. Test Stripe ≠ Live Stripe.
 */
import crypto from "node:crypto";
import { operateProblem } from "./acorn-operational-fabric.mjs";
import { OFFER_CATALOG, discoverDemand, qualifyDemand, buildOffer, diversifyOffer } from "./acorn-market-engine.mjs";
import { priceMeasuredOffer, chooseRevenueOpportunities, rankRevenueOpportunity, DEFAULT_REVENUE_POLICY } from "./acorn-revenue-maximizer.mjs";
import { buildDeveloperConnectManifest, createUsageMeter, classifyDeveloperAccess } from "./acorn-developer-gateway.mjs";
import { applyStripeEventToLedger, reconcileAgainstOrder, moneyClaimFromLedger, ledgerSnapshot } from "./acorn-economic-ledger.mjs";
import { rightsFromOffer, grantUsageRights, expireUsageRights } from "./acorn-usage-rights.mjs";
import { stripeTruth } from "./acorn-stripe-adapter.mjs";

export const COMMERCIAL_VERSION = "acorn.commercial-runtime.v1";
export const PRICING_VERSION = "acorn.price.v1";

const ISO = () => new Date().toISOString();
const uid = (p) => `${p}_${crypto.randomUUID()}`;
const str = (v) => String(v ?? "").trim();

export const COMMERCIAL_STAGES = Object.freeze([
  "PROSPECT", "CUSTOMER", "DEMAND", "QUALIFICATION", "PROJECT",
  "CAPABILITY_MATCHING", "OFFER", "ORDER", "CHECKOUT", "PAYMENT_PENDING",
  "PAYMENT_OBSERVED", "EXECUTION_HOLD", "DELIVERY", "VALUE",
  "RENEWAL", "EXPANSION", "LEARNING", "HOLD_HUMAN", "BLOCKED"
]);

export const ORDER_STATES = Object.freeze([
  "OPEN", "CHECKOUT_CREATED", "PAYMENT_PENDING", "PAYMENT_OBSERVED",
  "PAYMENT_FAILED", "REFUNDED", "DISPUTED", "CANCELLED", "MISMATCH"
]);

export const PRICE_CATALOG = Object.freeze({
  version: PRICING_VERSION,
  currency: "cad",
  items: Object.freeze({
    turnkey_low: Object.freeze({
      id: "turnkey_low", model: "ONE_TIME", amount_cents: 50000, currency: "cad",
      name: "Turnkey project (focused)", usage_rights: ["PERPETUAL_VERSIONED", "CUSTOMER_USE"],
      category: "custom"
    }),
    turnkey_medium: Object.freeze({
      id: "turnkey_medium", model: "ONE_TIME", amount_cents: 250000, currency: "cad",
      name: "Turnkey project", usage_rights: ["PERPETUAL_VERSIONED", "CUSTOMER_USE"],
      category: "custom"
    }),
    turnkey_high: Object.freeze({
      id: "turnkey_high", model: "ONE_TIME", amount_cents: 750000, currency: "cad",
      name: "Turnkey project (complex)", usage_rights: ["PERPETUAL_VERSIONED", "CUSTOMER_USE"],
      category: "custom"
    }),
    capability_monthly: Object.freeze({
      id: "capability_monthly", model: "SUBSCRIPTION", amount_cents: 4900, currency: "cad",
      interval: "month", name: "Capability subscription",
      usage_rights: ["SUBSCRIPTION_TERM", "CUSTOMER_USE"], category: "orchestration"
    }),
    enterprise_quote: Object.freeze({
      id: "enterprise_quote", model: "ENTERPRISE", amount_cents: null, currency: "cad",
      name: "Enterprise quote", human_required: true,
      usage_rights: ["ENTERPRISE_CONTRACT", "CUSTOMER_USE"], category: "custom"
    }),
    usage_verified_operation: Object.freeze({
      id: "usage_verified_operation", model: "USAGE", amount_cents: null, currency: "cad",
      unit: "verified_operation", name: "Usage-based (metered, not activated)",
      usage_rights: ["CUSTOMER_USE"], category: "compute", metered_activated: false
    })
  })
});

export function catalogPublic() {
  return {
    version: PRICE_CATALOG.version,
    currency: PRICE_CATALOG.currency,
    items: Object.values(PRICE_CATALOG.items).map((item) => ({
      id: item.id,
      model: item.model,
      amount_cents: item.amount_cents,
      currency: item.currency,
      interval: item.interval || null,
      unit: item.unit || null,
      name: item.name,
      usage_rights: item.usage_rights,
      human_required: item.human_required === true,
      metered_activated: item.metered_activated === true,
      client_cannot_set_amount: true
    })),
    client_cannot_set_amount: true,
    live: false
  };
}

export function selectTurnkeyPrice(complexity) {
  const c = str(complexity).toUpperCase();
  if (c === "HIGH") return PRICE_CATALOG.items.turnkey_high;
  if (c === "MEDIUM") return PRICE_CATALOG.items.turnkey_medium;
  return PRICE_CATALOG.items.turnkey_low;
}

export function composeOffers({ project, demand, capabilities = [], audience = "BUSINESS" } = {}) {
  const signal = {
    id: project?.id || "demand",
    problem: demand || project?.problem || "",
    audience,
    observed: true,
    evidence: [],
    confidence: 0.4
  };
  const discovered = discoverDemand({ signals: [signal] });
  const capabilityIndex = capabilities.map((cap) => ({
    id: cap.id || cap.name,
    name: cap.name,
    tags: [cap.name],
    verified: false
  }));
  const qualified = qualifyDemand({ demand: discovered, capabilityIndex });
  const market = qualified.flatMap((row) => diversifyOffer({
    demand: row,
    capabilityIds: row.matched_capabilities,
    evidence: row.evidence
  }));
  const complexity = project?.qualification?.estimated_complexity || "LOW";
  const turnkey = selectTurnkeyPrice(complexity);
  const serverOffers = [
    {
      id: "offer_" + (project?.id || uid("p")) + "_" + turnkey.id,
      catalog_id: turnkey.id,
      project_id: project?.id || null,
      product: turnkey.name,
      model: turnkey.model,
      amount_cents: turnkey.amount_cents,
      currency: turnkey.currency,
      pricing_version: PRICING_VERSION,
      usage_rights: turnkey.usage_rights,
      audience,
      state: "OFFER_READY",
      human_authorization_required: true,
      client_amount_ignored: true,
      live: false,
      paid: false
    },
    {
      id: "offer_" + (project?.id || uid("p")) + "_" + PRICE_CATALOG.items.capability_monthly.id,
      catalog_id: PRICE_CATALOG.items.capability_monthly.id,
      project_id: project?.id || null,
      product: PRICE_CATALOG.items.capability_monthly.name,
      model: "SUBSCRIPTION",
      amount_cents: PRICE_CATALOG.items.capability_monthly.amount_cents,
      currency: "cad",
      interval: "month",
      pricing_version: PRICING_VERSION,
      usage_rights: PRICE_CATALOG.items.capability_monthly.usage_rights,
      audience,
      state: "OFFER_READY",
      human_authorization_required: true,
      live: false,
      paid: false
    }
  ];
  if (str(complexity).toUpperCase() === "HIGH" || str(audience).toUpperCase() === "ENTERPRISE") {
    const q = PRICE_CATALOG.items.enterprise_quote;
    serverOffers.push({
      id: "offer_" + (project?.id || uid("p")) + "_" + q.id,
      catalog_id: q.id,
      project_id: project?.id || null,
      product: q.name,
      model: q.model,
      amount_cents: null,
      currency: q.currency,
      pricing_version: PRICING_VERSION,
      usage_rights: q.usage_rights,
      audience: "ENTERPRISE",
      state: "HOLD_HUMAN",
      human_required: true,
      human_authorization_required: true,
      live: false,
      paid: false
    });
  }
  return {
    demand: discovered,
    qualified,
    market_offers: market.map((o) => ({ ...o, amount_cents: null, billed: false, settled: false, live: false })),
    offers: serverOffers,
    catalog: OFFER_CATALOG.map((c) => c.id)
  };
}

export function createCommercialProject({
  tenantId,
  customerId,
  problem,
  requestId = null,
  audience = "BUSINESS",
  intelligences = [],
  connectors = []
} = {}) {
  const operated = operateProblem({
    tenantId,
    customerId,
    problem,
    requestId,
    intelligences,
    connectors
  });
  const composed = composeOffers({
    project: { id: operated.project.id, problem, qualification: operated.qualification },
    demand: problem,
    capabilities: operated.capabilities,
    audience
  });
  return {
    ...operated,
    version: COMMERCIAL_VERSION,
    stage: "OFFER",
    live: false,
    verified: false,
    paid: false,
    billed: false,
    delivered: false,
    project: {
      ...operated.project,
      kind: "TURNKEY",
      audience,
      payment: false,
      commercial_stage: "OFFER"
    },
    offers: composed.offers,
    market: composed,
    proof: {
      ...operated.proof,
      checkout_created: false,
      payment_observed: false,
      stripe_live: false
    }
  };
}

export function acceptOffer({
  tenantId,
  customerId,
  projectId,
  offer,
  clientAmount = null,
  clientCurrency = null
} = {}) {
  if (!offer || offer.amount_cents == null || offer.amount_cents <= 0) {
    return {
      state: "HOLD_HUMAN",
      reason: offer?.model === "ENTERPRISE" ? "ENTERPRISE_QUOTE_REQUIRES_HUMAN" : "UNPRICED_OFFER",
      order: null,
      client_amount_ignored: clientAmount != null,
      live: false
    };
  }
  const amount = Number(offer.amount_cents);
  const currency = str(offer.currency || "cad").toLowerCase();
  const ignored = (clientAmount != null && Number(clientAmount) !== amount)
    || (clientCurrency && str(clientCurrency).toLowerCase() !== currency);
  const order = {
    id: uid("ord"),
    tenant_id: tenantId,
    customer_id: customerId,
    project_id: projectId,
    offer_id: offer.id,
    catalog_id: offer.catalog_id,
    product_name: offer.product,
    model: offer.model,
    amount_cents: amount,
    currency,
    interval: offer.interval || null,
    pricing_version: offer.pricing_version || PRICING_VERSION,
    state: "OPEN",
    stripe_checkout_id: null,
    stripe_payment_intent: null,
    stripe_customer_id: null,
    paid_at: null,
    client_amount_ignored: Boolean(ignored),
    paid: false,
    billed: false,
    live: false,
    created_at: ISO(),
    updated_at: ISO()
  };
  return {
    state: "ORDER",
    reason: null,
    order,
    usage_rights: rightsFromOffer(offer, {
      tenant_id: tenantId,
      customer_id: customerId,
      project_id: projectId,
      order_id: order.id
    }),
    client_amount_ignored: Boolean(ignored),
    live: false
  };
}

export function attachCheckout(order, session) {
  return {
    ...order,
    state: "CHECKOUT_CREATED",
    stripe_checkout_id: session?.id || null,
    checkout_url: session?.url || null,
    updated_at: ISO(),
    paid: false,
    billed: false,
    live: false,
    checkout_created_is_not_paid: true
  };
}

export function applyPaymentObservation({ order, entry }) {
  if (!order) return { order: null, granted: null, reason: "ORDER_REQUIRED" };
  if (entry?.reconciliation === "MISMATCH") {
    return {
      order: { ...order, state: "MISMATCH", updated_at: ISO(), paid: false, live: false },
      granted: null,
      reason: "AMOUNT_CURRENCY_MISMATCH",
      live: false
    };
  }
  if (entry?.kind === "PAYMENT_FAILED") {
    return {
      order: { ...order, state: "PAYMENT_FAILED", updated_at: ISO(), paid: false, live: false },
      granted: null,
      reason: "PAYMENT_FAILED",
      live: false
    };
  }
  if (entry?.kind === "REFUND") {
    return {
      order: { ...order, state: "REFUNDED", updated_at: ISO(), paid: false, live: false },
      granted: null,
      reason: "REFUND_OBSERVED",
      live: false
    };
  }
  if (entry?.kind === "DISPUTE") {
    return {
      order: { ...order, state: "DISPUTED", updated_at: ISO(), paid: false, live: false },
      granted: null,
      reason: "DISPUTE_OBSERVED",
      live: false
    };
  }
  const paymentObserved = entry?.kind === "PAYMENT" && (entry.epistemic === "OBSERVED" || entry.epistemic === "MEASURED");
  if (!paymentObserved && entry?.kind === "CHECKOUT" && entry.status === "CHECKOUT_COMPLETED") {
    return {
      order: {
        ...order,
        state: "PAYMENT_PENDING",
        stripe_customer_id: entry.stripe_customer_id || order.stripe_customer_id,
        stripe_payment_intent: entry.stripe_object_id || order.stripe_payment_intent,
        updated_at: ISO(),
        paid: false,
        live: false
      },
      granted: null,
      reason: "CHECKOUT_COMPLETED_NOT_YET_PAYMENT_OBSERVED",
      live: false
    };
  }
  if (!paymentObserved) {
    return { order, granted: null, reason: "NOT_A_PAYMENT_OBSERVATION", live: false };
  }
  const next = {
    ...order,
    state: "PAYMENT_OBSERVED",
    stripe_customer_id: entry.stripe_customer_id || order.stripe_customer_id,
    stripe_payment_intent: entry.stripe_object_id || order.stripe_payment_intent,
    paid_at: entry.measured_at,
    updated_at: ISO(),
    paid: false,
    billed: false,
    live: false,
    payment_observed: true
  };
  return {
    order: next,
    granted: true,
    reason: null,
    execution_authority: false,
    human_authorization_still_required: true,
    live: false
  };
}

export function confirmPaymentFromEvent({ event, order, tenantId }) {
  const entry = applyStripeEventToLedger(event, { order, tenant_id: tenantId });
  const reconciled = reconcileAgainstOrder(entry, order);
  const applied = applyPaymentObservation({ order, entry: reconciled });
  const rights = applied.granted
    ? grantUsageRights(rightsFromOffer({
      id: order.offer_id,
      model: order.model,
      pricing_version: order.pricing_version,
      usage_rights: order.model === "ONE_TIME" ? ["PERPETUAL_VERSIONED", "CUSTOMER_USE"] : ["SUBSCRIPTION_TERM", "CUSTOMER_USE"],
      interval: order.interval
    }, {
      tenant_id: order.tenant_id,
      customer_id: order.customer_id,
      project_id: order.project_id,
      order_id: order.id
    }), { paymentObserved: true, measuredAt: reconciled.measured_at })
    : null;
  return {
    entry: reconciled,
    order: applied.order,
    usage_rights: rights,
    money_claim: moneyClaimFromLedger(reconciled),
    execution_authorized: false,
    live: false,
    verified: false,
    stripe_livemode: event?.livemode === true,
    stripe_livemode_is_not_acorn_live: true
  };
}

export function measureProjectValue({ order, entry, deliveryCostCents = null, customerValueCents = null }) {
  const revenue = entry?.gross_amount == null ? null : Number(entry.gross_amount);
  const cost = deliveryCostCents == null ? null : Number(deliveryCostCents);
  const value = customerValueCents == null ? null : Number(customerValueCents);
  const margin = revenue != null && cost != null ? revenue - cost : null;
  return {
    project_id: order?.project_id || null,
    order_id: order?.id || null,
    revenue_cents: revenue,
    cost_cents: cost,
    margin_cents: margin,
    customer_value_cents: value,
    net_known: margin != null,
    epistemic: entry?.epistemic || "ASSERTED",
    live: false,
    verified: false
  };
}

export function proposeRenewal({ order, usage } = {}) {
  if (!order || order.model !== "SUBSCRIPTION") {
    return { state: "NOT_APPLICABLE", reason: "RENEWAL_FOR_SUBSCRIPTIONS", live: false, auto: false };
  }
  return {
    state: "PROPOSED",
    order_id: order.id,
    model: "SUBSCRIPTION",
    amount_cents: order.amount_cents,
    currency: order.currency,
    usage: usage || null,
    auto_renew_in_acorn: false,
    stripe_manages_billing_cycle: true,
    authority: "carl",
    live: false
  };
}

export function proposeExpansion({ project, assets = [], nextProblems = [] } = {}) {
  return {
    state: "RECOMMENDATION_ONLY",
    project_id: project?.id || null,
    assets: assets.map((a) => a.id || a),
    next_problems: nextProblems,
    outreach: false,
    auto_contract: false,
    auto_spend: false,
    authority: false,
    live: false
  };
}

export function revenueMaximizerBounded(opportunities = []) {
  const ranked = chooseRevenueOpportunities(opportunities, { max: 8 });
  return {
    version: DEFAULT_REVENUE_POLICY.objective,
    proposals: ranked.map((row) => ({
      ...row,
      revenue_score: row.revenue_score || rankRevenueOpportunity(row),
      can_change_constitution: false,
      can_spend: false,
      can_merge: false,
      can_sign: false,
      can_change_price_silently: false
    })),
    policy: {
      ...DEFAULT_REVENUE_POLICY,
      auto_spend: false,
      auto_contract: false,
      auto_merge: false
    },
    live: false
  };
}

export function developerSurface({ capabilities = [], endpoint = null } = {}) {
  return {
    gateway: buildDeveloperConnectManifest({
      capabilities,
      protocols: ["HTTPS", "JSON"],
      endpoint
    }),
    surfaces: ["WEB", "API", "SDK", "EMBED", "WHITE-LABEL", "ENTERPRISE"],
    access: classifyDeveloperAccess({ kind: "developer" }),
    usage: createUsageMeter({ audience: "DEVELOPER", units: 0 }),
    live: false
  };
}

export function commercialTruth({ adapter, orders = [], ledger = [] } = {}) {
  const snap = ledgerSnapshot(ledger);
  const observedPay = orders.some((o) => o.state === "PAYMENT_OBSERVED");
  return {
    version: COMMERCIAL_VERSION,
    rail: stripeTruth(adapter),
    catalog: { code_present: true, tested: true, live: false },
    checkout: { code_present: true, live: false, paid: false },
    payment_observed: observedPay,
    billed: false,
    paid: false,
    verified: false,
    live: false,
    ledger: snap,
    pricing_version: PRICING_VERSION,
    human_authority: "carl"
  };
}

export { expireUsageRights, priceMeasuredOffer, ledgerSnapshot };
