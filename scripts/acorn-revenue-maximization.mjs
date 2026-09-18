#!/usr/bin/env node
/**
 * ACORN REVENUE MAXIMIZATION ENGINE
 *
 * Commercial optimization across the existing Acorn capability fabric.
 *
 * Objective:
 *   maximize verified sustainable net revenue without changing Acorn's
 *   constitutional essence, human sovereignty, protection principles,
 *   equal public/developer access, or provider neutrality.
 *
 * This is an optimization/accounting layer, not an authority layer.
 * It never invents revenue, executes contracts, spends money, or handles
 * private keys.
 */

export const REVENUE_ENGINE_VERSION = "acorn.revenue-maximization.v1";

export const REVENUE_POLICY = Object.freeze({
  objective: "MAXIMIZE_VERIFIED_SUSTAINABLE_NET_REVENUE",
  paid_priority: ["MULTINATIONAL", "ENTERPRISE", "BUSINESS"],
  open_access: ["PUBLIC", "DEVELOPER", "COMMUNITY", "RESEARCH"],
  strategic_profiles: ["STRATEGIC_OPENAI", "STRATEGIC_GROK"],
  free_first: true,
  measured_pricing: true,
  recurring_revenue: true,
  cross_sell: true,
  capability_reuse: true,
  consolidated_billing: true,
  minimize_onchain_settlements: true,
  tax_ready_ledger: true,
  crypto_settlement: "VERIFIED_ONLY",
  auto_collection: "SUPPORTED_WHEN_CONFIGURED",
  auto_spend: false,
  auto_contract: false,
  auto_merge: false,
  private_key_custody: false,
  technical_authority_from_commercial_status: false,
  human_authority: "carl",
});

const n = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
const pos = v => Math.max(0, n(v));
const clamp = v => Math.max(0, Math.min(1, n(v)));
const arr = v => Array.isArray(v) ? v : [];

export const OFFER_FAMILIES = Object.freeze([
  "COGNITIVE_ORCHESTRATION",
  "RESEARCH_INTELLIGENCE",
  "AI_VERIFICATION",
  "AI_BENCHMARKING",
  "AUTOMATION",
  "CONNECTOR_INFRASTRUCTURE",
  "COMPUTE_OPTIMIZATION",
  "SIMULATION",
  "PRIVACY_GOVERNANCE",
  "CONTINUOUS_OPERATIONS",
  "ADAPTIVE_CAPABILITY",
  "CUSTOM_ENTERPRISE_PROGRAM",
]);

const SEGMENT_WEIGHT = Object.freeze({
  MULTINATIONAL: 1,
  ENTERPRISE: 0.9,
  BUSINESS: 0.72,
  RESEARCH: 0.3,
  DEVELOPER: 0.15,
  COMMUNITY: 0.08,
  PUBLIC: 0.04,
  STRATEGIC_OPENAI: 0.6,
  STRATEGIC_GROK: 0.6,
});

export function classifyCommercialSegment(input = {}) {
  const explicit = String(input.segment || input.audience || "").toUpperCase();
  if (SEGMENT_WEIGHT[explicit] !== undefined) return explicit;
  const employees = pos(input.employees);
  const revenue = pos(input.annual_revenue);
  if (employees >= 10000 || revenue >= 1e9) return "MULTINATIONAL";
  if (employees >= 1000 || revenue >= 1e8) return "ENTERPRISE";
  if (employees >= 50 || revenue >= 1e6) return "BUSINESS";
  return "PUBLIC";
}

export function discoverRevenueOpportunity({
  id,
  capability_ids = [],
  use_case = "unknown",
  segment,
  demand = 0,
  urgency = 0,
  measured_outcome = 0,
  customer_budget = 0,
  recurrence = 0,
  reuse_count = 1,
  reliability = 0,
  evidence_verified = false,
  acquisition_cost = 0,
  delivery_cost = 0,
  payment_friction = 0,
} = {}) {
  const audience = classifyCommercialSegment({ segment });
  return {
    version: REVENUE_ENGINE_VERSION,
    id: String(id || "revenue-opportunity"),
    capability_ids: arr(capability_ids).map(String),
    use_case: String(use_case),
    segment: audience,
    demand: clamp(demand),
    urgency: clamp(urgency),
    measured_outcome: pos(measured_outcome),
    customer_budget: pos(customer_budget),
    recurrence: clamp(recurrence),
    reuse_count: Math.max(1, Math.floor(pos(reuse_count))),
    reliability: clamp(reliability),
    evidence_verified: evidence_verified === true,
    acquisition_cost: pos(acquisition_cost),
    delivery_cost: pos(delivery_cost),
    payment_friction: clamp(payment_friction),
    commercial: !["PUBLIC", "DEVELOPER", "COMMUNITY", "RESEARCH"].includes(audience),
  };
}

export function revenueOpportunityScore(o = {}) {
  const segment = SEGMENT_WEIGHT[String(o.segment || "").toUpperCase()] ?? 0.04;
  const evidence = o.evidence_verified ? 1 : 0;
  const reuse = Math.min(1, pos(o.reuse_count) / 10);
  const economics = pos(o.measured_outcome) > 0
    ? Math.min(1, pos(o.measured_outcome) / Math.max(1, pos(o.delivery_cost) + pos(o.acquisition_cost)))
    : 0;
  const friction = 1 - clamp(o.payment_friction);
  return Number((
    0.20 * segment +
    0.18 * clamp(o.demand) +
    0.12 * clamp(o.urgency) +
    0.18 * economics +
    0.10 * clamp(o.recurrence) +
    0.08 * reuse +
    0.08 * clamp(o.reliability) +
    0.04 * evidence +
    0.02 * friction
  ).toFixed(6));
}

export function priceMeasuredOffer({
  measured_customer_value = 0,
  delivery_cost = 0,
  acquisition_cost = 0,
  contribution_reserve = 0,
  target_margin = 0.6,
  floor_margin = 0.2,
  strategic = false,
} = {}) {
  const value = pos(measured_customer_value);
  const costs = pos(delivery_cost) + pos(acquisition_cost) + pos(contribution_reserve);
  const margin = Math.max(clamp(floor_margin), clamp(target_margin));
  const costFloor = costs / Math.max(0.01, 1 - clamp(floor_margin));
  const valueCeiling = value > 0 ? value * 0.9 : 0;
  const target = costs / Math.max(0.01, 1 - margin);
  const price = valueCeiling > 0 ? Math.min(Math.max(costFloor, target), valueCeiling) : costFloor;
  return {
    measured_customer_value: value,
    measured_cost: costs,
    floor_price: Number(costFloor.toFixed(8)),
    target_price: Number(target.toFixed(8)),
    recommended_price: Number(Math.max(0, price).toFixed(8)),
    value_ceiling: Number(valueCeiling.toFixed(8)),
    margin_basis: margin,
    strategic: strategic === true,
    measured: value > 0,
    price_is_not_authority: true,
  };
}

export function diversifyOffer({
  base_offer,
  capabilities = [],
  use_cases = [],
  segments = ["BUSINESS", "ENTERPRISE", "MULTINATIONAL"],
} = {}) {
  const base = base_offer || {};
  const ids = arr(capabilities).map(String);
  const cases = arr(use_cases).map(String);
  return segments.flatMap(segment =>
    (cases.length ? cases : [String(base.use_case || "capability-service")]).map(use_case => ({
      ...base,
      id: `${String(base.id || "offer")}:${segment}:${use_case}`,
      segment,
      use_case,
      capability_ids: ids.length ? ids : arr(base.capability_ids),
      family: base.family || OFFER_FAMILIES[0],
      measured: base.measured === true,
      commercial: true,
    }))
  );
}

export function maximizeCapabilityReuse(opportunities = []) {
  const groups = new Map();
  for (const opportunity of opportunities) {
    for (const capability of arr(opportunity.capability_ids)) {
      const list = groups.get(capability) || [];
      list.push(opportunity.id);
      groups.set(capability, list);
    }
  }
  return [...groups.entries()].map(([capability_id, opportunity_ids]) => ({
    capability_id,
    opportunity_count: opportunity_ids.length,
    opportunity_ids,
    reuse_score: Math.min(1, opportunity_ids.length / 10),
  })).sort((a, b) => b.opportunity_count - a.opportunity_count);
}

export function rankRevenuePipeline(opportunities = []) {
  return [...opportunities]
    .filter(Boolean)
    .map(o => ({ ...o, revenue_score: revenueOpportunityScore(o) }))
    .sort((a, b) => b.revenue_score - a.revenue_score);
}

export function consolidatedBillingLedger({
  customer_id,
  period,
  events = [],
  currency = "USD",
  settlement_threshold = 0,
} = {}) {
  const valid = arr(events).filter(e => e && e.verified === true);
  const gross = valid.reduce((sum, e) => sum + pos(e.amount), 0);
  const costs = valid.reduce((sum, e) => sum + pos(e.cost), 0);
  const fees = valid.reduce((sum, e) => sum + pos(e.fees), 0);
  const net = gross - costs - fees;
  return {
    version: REVENUE_ENGINE_VERSION,
    customer_id: customer_id || null,
    period: period || null,
    currency,
    verified_event_count: valid.length,
    gross_revenue: Number(gross.toFixed(8)),
    operating_cost: Number(costs.toFixed(8)),
    payment_fees: Number(fees.toFixed(8)),
    net_revenue: Number(net.toFixed(8)),
    settlement_due: net > pos(settlement_threshold),
    settlement_threshold: pos(settlement_threshold),
    consolidate: true,
    minimize_onchain_transactions: true,
    tax_ready: true,
    settled: false,
  };
}

export function taxReadyLedger({
  invoices = [],
  settlements = [],
  costs = [],
  period,
} = {}) {
  const invoiceRows = arr(invoices).filter(x => x && x.verified === true);
  const settlementRows = arr(settlements).filter(x => x && x.verified === true);
  const costRows = arr(costs).filter(x => x && x.verified === true);
  return {
    version: REVENUE_ENGINE_VERSION,
    period: period || null,
    invoices: invoiceRows,
    settlements: settlementRows,
    costs: costRows,
    totals: {
      invoiced: Number(invoiceRows.reduce((s, x) => s + pos(x.amount), 0).toFixed(8)),
      settled: Number(settlementRows.reduce((s, x) => s + pos(x.amount), 0).toFixed(8)),
      costs: Number(costRows.reduce((s, x) => s + pos(x.amount), 0).toFixed(8)),
    },
    provenance_required: true,
    source_records_preserved: true,
    tax_ready: true,
    tax_advice_not_invented: true,
  };
}

export function commercialFunnel({ opportunities = [], active_customers = 0, recurring_customers = 0 } = {}) {
  const ranked = rankRevenuePipeline(opportunities);
  const commercial = ranked.filter(x => x.commercial);
  const expectedRecurringShare = commercial.length
    ? commercial.reduce((s, x) => s + clamp(x.recurrence), 0) / commercial.length
    : 0;
  return {
    version: REVENUE_ENGINE_VERSION,
    discovered: opportunities.length,
    qualified: commercial.filter(x => x.evidence_verified && x.reliability > 0).length,
    high_value: commercial.filter(x => x.revenue_score >= 0.65).length,
    active_customers: Math.max(0, Math.floor(pos(active_customers))),
    recurring_customers: Math.max(0, Math.floor(pos(recurring_customers))),
    recurring_share_signal: Number(expectedRecurringShare.toFixed(6)),
    pipeline: ranked,
    next_actions: [
      "QUALIFY_MEASURED_DEMAND",
      "PACKAGE_REUSABLE_CAPABILITIES",
      "OFFER_HIGH_VALUE_ENTERPRISE_USE_CASES",
      "CONSOLIDATE_BILLING",
      "VERIFY_SETTLEMENT",
      "MEASURE_RETENTION_AND_EXPANSION",
      "REINVEST_ONLY_WHEN_INCREMENTAL_NET_VALUE_IS_VERIFIED",
    ],
    no_auto_contract: true,
    no_auto_spend: true,
    authority: "carl",
  };
}

export function revenuePolicy(overrides = {}) {
  return { ...REVENUE_POLICY, ...overrides, version: REVENUE_ENGINE_VERSION };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(revenuePolicy(), null, 2));
}
