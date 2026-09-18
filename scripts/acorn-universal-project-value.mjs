#!/usr/bin/env node
/**
 * ACORN — UNIVERSAL PROJECT & VALUE ENGINE
 *
 * Commercial control plane over existing Acorn fabrics.
 * It does not replace Cortex, Work, Market, Revenue, Connection or Evidence.
 *
 * Human authority remains Carl.
 * CAPABILITY != AUTHORITY.
 * No auto-contract, auto-spend, auto-merge or invented LIVE state.
 *
 * Core loop:
 * INTENTION -> PROJECT -> CAPABILITIES -> EXECUTION -> EVIDENCE -> DELIVERY
 *          -> VALUE -> REUSE -> PRODUCT -> REVENUE -> LEARNING
 */

import { buildAssetEconomics, buildEconomicProof, buildProjectValueLedger } from "./acorn-project-value-ledger.mjs";

export const UNIVERSAL_PROJECT_VALUE_VERSION = "acorn.universal-project-value.v1";

const str = (v) => String(v ?? "").trim();
const n = (v, d = 0) => Number.isFinite(Number(v)) ? Number(v) : d;
const pos = (v) => Math.max(0, n(v));
const clamp = (v) => Math.max(0, Math.min(1, n(v)));

export const PROJECT_STATES = Object.freeze([
  "INTAKE",
  "QUALIFYING",
  "PLANNED",
  "READY",
  "RUNNING",
  "VERIFYING",
  "DELIVERED",
  "REPEATABLE",
  "PRODUCTIZED",
  "BLOCKED",
  "HOLD_HUMAN",
]);

export const REVENUE_STREAMS = Object.freeze([
  "PROJECT",
  "LICENSE",
  "SUBSCRIPTION",
  "USAGE",
  "MARKETPLACE",
  "API",
  "WHITE_LABEL",
  "MAINTENANCE",
  "OPTIMIZATION",
  "ENTERPRISE",
  "PARTNER",
]);

export const GROWTH_CHANNELS = Object.freeze([
  "DIRECT",
  "SELF_SERVICE",
  "PARTNER",
  "MARKETPLACE",
  "API",
  "WHITE_LABEL",
  "REFERRAL",
]);

export const ENGINE_POLICY = Object.freeze({
  human_authority: "carl",
  capability_is_not_authority: true,
  sell_results_not_models: true,
  evidence_before_claim: true,
  measured_value_only: true,
  auto_contract: false,
  auto_spend: false,
  auto_merge: false,
  private_key_custody: false,
  invented_revenue: false,
  invented_live: false,
  reuse_before_rebuild: true,
  build_once_sell_many: true,
});

export function normalizeProjectIntake({
  id = null,
  intention = "",
  customer_id = null,
  audience = "DEVELOPER",
  constraints = [],
  deadline = null,
  budget = null,
  desired_value = null,
  evidence_level = "STANDARD",
} = {}) {
  const cleanIntention = str(intention);
  return {
    version: UNIVERSAL_PROJECT_VALUE_VERSION,
    id: id ? str(id) : null,
    intention: cleanIntention,
    customer_id: customer_id ? str(customer_id) : null,
    audience: str(audience || "DEVELOPER").toUpperCase(),
    constraints: Array.isArray(constraints) ? [...new Set(constraints.map(str).filter(Boolean))] : [],
    deadline: deadline ? str(deadline) : null,
    budget: budget == null ? null : pos(budget),
    desired_value: desired_value == null ? null : pos(desired_value),
    evidence_level: str(evidence_level || "STANDARD").toUpperCase(),
    state: cleanIntention ? "INTAKE" : "HOLD_HUMAN",
    valid: Boolean(cleanIntention),
    authority: "carl",
  };
}

export function classifyProjectComplexity({ constraints = [], capability_count = 0, integrations = 0, evidence_level = "STANDARD" } = {}) {
  const pressure = Math.min(
    1,
    0.35 * Math.min(1, Math.max(0, n(capability_count)) / 8) +
    0.25 * Math.min(1, Math.max(0, n(integrations)) / 6) +
    0.20 * Math.min(1, (Array.isArray(constraints) ? constraints.length : 0) / 10) +
    0.20 * (String(evidence_level).toUpperCase() === "HIGH" ? 1 : String(evidence_level).toUpperCase() === "STANDARD" ? .5 : .2)
  );
  const level = pressure >= .75 ? "COMPLEX" : pressure >= .45 ? "PROFESSIONAL" : "EXPRESS";
  return { score: Number(pressure.toFixed(6)), level };
}

export function buildProjectPlan({
  intake,
  capabilities = [],
  reusable_assets = [],
  required_integrations = [],
  delivery_steps = [],
} = {}) {
  const project = intake || normalizeProjectIntake({});
  const caps = Array.isArray(capabilities) ? capabilities : [];
  const assets = Array.isArray(reusable_assets) ? reusable_assets : [];
  const integrations = Array.isArray(required_integrations) ? required_integrations : [];
  const complexity = classifyProjectComplexity({
    constraints: project.constraints,
    capability_count: caps.length,
    integrations: integrations.length,
    evidence_level: project.evidence_level,
  });
  const reusable = assets.filter((x) => x?.verified === true || x?.proven === true);
  const missing = caps.filter((x) => x?.required !== false && x?.available !== true && x?.verified !== true);
  const steps = delivery_steps.length
    ? delivery_steps
    : ["QUALIFY", "MATCH_CAPABILITIES", "PLAN", "EXECUTE", "VERIFY", "DELIVER", "MEASURE_VALUE", "REUSE_OR_PRODUCTIZE"];
  const state = project.valid && missing.length === 0 ? "READY" : project.valid ? "PLANNED" : "HOLD_HUMAN";
  return {
    version: UNIVERSAL_PROJECT_VALUE_VERSION,
    project_id: project.id,
    state,
    complexity,
    steps: [...new Set(steps.map(str).filter(Boolean))],
    capabilities: caps.map((x) => ({
      id: str(x?.id || x?.name || "unknown"),
      required: x?.required !== false,
      available: x?.available === true,
      verified: x?.verified === true || x?.proven === true,
    })),
    reusable_assets: reusable.map((x) => str(x.id || x.name)).filter(Boolean),
    reuse_count: reusable.length,
    missing_capabilities: missing.map((x) => str(x.id || x.name)).filter(Boolean),
    integration_count: integrations.length,
    no_auto_contract: true,
    no_auto_spend: true,
    authority: "carl",
  };
}

export function evaluateDelivery({
  execution = {},
  evidence = {},
  verification = {},
  measured_value = 0,
} = {}) {
  const executed = execution?.executed === true;
  const verified = evidence?.verified === true || verification?.verified === true;
  const value = pos(measured_value);
  const delivered = executed && verified;
  return {
    state: delivered ? "DELIVERED" : executed ? "VERIFYING" : "RUNNING",
    executed,
    verified,
    measured_value: value,
    deliverable_ready: delivered,
    evidence_required: true,
    live: false,
  };
}

export function scoreReusePotential({
  reuse_count = 0,
  similar_projects = 0,
  measured_value = 0,
  delivery_cost = 0,
  verified = false,
} = {}) {
  const reuse = Math.min(1, pos(reuse_count) / 10);
  const demand = Math.min(1, pos(similar_projects) / 10);
  const value = pos(measured_value);
  const cost = pos(delivery_cost);
  const economics = value > 0 ? clamp(value / Math.max(1, value + cost)) : 0;
  return Number((
    .30 * reuse +
    .30 * demand +
    .25 * economics +
    .15 * (verified ? 1 : 0)
  ).toFixed(6));
}

export function productizeProject({
  project_id = null,
  reusable_components = [],
  similar_projects = 0,
  measured_value = 0,
  delivery_cost = 0,
  verified = false,
} = {}) {
  const score = scoreReusePotential({
    reuse_count: reusable_components.length,
    similar_projects,
    measured_value,
    delivery_cost,
    verified,
  });
  const eligible = verified === true && reusable_components.length > 0 && score >= .45;
  return {
    project_id: project_id ? str(project_id) : null,
    state: eligible ? "PRODUCTIZATION_CANDIDATE" : "KEEP_AS_PROJECT",
    reuse_score: score,
    reusable_components: [...new Set(reusable_components.map(str).filter(Boolean))],
    build_once_sell_many: true,
    license_options: ["PROJECT_USE", "COMMERCIAL_USE", "PERPETUAL_USE"],
    auto_license: false,
    auto_contract: false,
    authority: "carl",
  };
}

export function buildCommercialOffer({
  project,
  delivery = {},
  price = null,
  currency = "USD",
  revenue_streams = ["PROJECT"],
  license = null,
  subscription = null,
} = {}) {
  const validPrice = price == null ? null : pos(price);
  const delivered = delivery?.deliverable_ready === true || str(delivery?.state).toUpperCase() === "DELIVERED";
  const streams = [...new Set((Array.isArray(revenue_streams) ? revenue_streams : ["PROJECT"])
    .map(str).filter((x) => REVENUE_STREAMS.includes(x.toUpperCase()))
    .map((x) => x.toUpperCase()))];
  return {
    version: UNIVERSAL_PROJECT_VALUE_VERSION,
    project_id: project?.id || null,
    product_name: str(project?.intention || "Acorn Project"),
    audience: str(project?.audience || "DEVELOPER").toUpperCase(),
    currency: str(currency || "USD"),
    price: validPrice,
    price_state: validPrice == null ? "UNPRICED_UNTIL_MEASURED" : "MEASURED_OR_PUBLISHED",
    deliverable_ready: delivered,
    revenue_streams: streams.length ? streams : ["PROJECT"],
    license: license || null,
    subscription: subscription || null,
    billable: delivered && validPrice != null,
    automatic_collection_requested: delivered && validPrice != null,
    no_auto_contract: true,
    no_auto_spend: true,
    authority: "carl",
  };
}

export function buildGrowthPlan({
  existing_customers = 0,
  qualified_leads = 0,
  reusable_products = 0,
  partners = 0,
  api_clients = 0,
  enterprise_accounts = 0,
} = {}) {
  const metrics = {
    existing_customers: pos(existing_customers),
    qualified_leads: pos(qualified_leads),
    reusable_products: pos(reusable_products),
    partners: pos(partners),
    api_clients: pos(api_clients),
    enterprise_accounts: pos(enterprise_accounts),
  };
  const channels = [];
  if (metrics.qualified_leads > 0) channels.push("DIRECT");
  if (metrics.reusable_products > 0) channels.push("SELF_SERVICE", "MARKETPLACE");
  if (metrics.partners > 0) channels.push("PARTNER", "WHITE_LABEL");
  if (metrics.api_clients > 0) channels.push("API");
  if (metrics.existing_customers > 0) channels.push("REFERRAL");
  if (metrics.enterprise_accounts > 0) channels.push("DIRECT");
  return {
    version: UNIVERSAL_PROJECT_VALUE_VERSION,
    channels: [...new Set(channels)],
    all_channels: GROWTH_CHANNELS,
    metrics,
    recommendation_basis: "MEASURED_CHANNEL_ACTIVITY",
    auto_outreach: false,
    auto_contract: false,
    authority: "carl",
  };
}

export function buildOperatingDashboard({
  projects = [],
  customers = [],
  revenue = {},
  capabilities = [],
  evidence = [],
} = {}) {
  const rows = Array.isArray(projects) ? projects : [];
  const completed = rows.filter((x) => ["DELIVERED", "REPEATABLE", "PRODUCTIZED"].includes(str(x.state).toUpperCase())).length;
  const blocked = rows.filter((x) => ["BLOCKED", "HOLD_HUMAN"].includes(str(x.state).toUpperCase())).length;
  const recurring = pos(revenue.recurring_revenue);
  const gross = pos(revenue.gross_revenue);
  const verifiedEvidence = (Array.isArray(evidence) ? evidence : []).filter((x) => x?.verified === true || x?.proven === true).length;
  return {
    version: UNIVERSAL_PROJECT_VALUE_VERSION,
    project_count: rows.length,
    completed_projects: completed,
    blocked_projects: blocked,
    customer_count: Array.isArray(customers) ? customers.length : pos(customers),
    gross_revenue: gross,
    recurring_revenue: recurring,
    recurring_share: gross > 0 ? Number((recurring / gross).toFixed(6)) : 0,
    verified_evidence_count: verifiedEvidence,
    capability_count: Array.isArray(capabilities) ? capabilities.length : 0,
    conversion_ready: rows.length > 0 && completed > 0,
    measured: true,
    live: false,
    authority: "carl",
  };
}

export function launchReadiness({
  intake = null,
  plan = null,
  delivery = null,
  offer = null,
  payment_rail = null,
} = {}) {
  const checks = {
    valid_intake: intake?.valid === true,
    planned: ["PLANNED", "READY"].includes(str(plan?.state).toUpperCase()),
    delivered_or_explicitly_pending: ["DELIVERED", "VERIFYING", "RUNNING"].includes(str(delivery?.state).toUpperCase()),
    priced: offer?.price != null,
    payment_rail_verified: payment_rail?.verified === true,
    evidence_present: delivery?.verified === true,
  };
  const hardBlocks = [];
  if (!checks.valid_intake) hardBlocks.push("INVALID_INTAKE");
  if (!checks.planned) hardBlocks.push("NO_PLAN");
  if (!checks.delivered_or_explicitly_pending) hardBlocks.push("NO_EXECUTION");
  if (!checks.evidence_present) hardBlocks.push("NO_VERIFIED_EVIDENCE");
  if (offer?.billable === true && !checks.payment_rail_verified) hardBlocks.push("PAYMENT_RAIL_NOT_VERIFIED");
  return {
    version: UNIVERSAL_PROJECT_VALUE_VERSION,
    ready_for_commercial_delivery: hardBlocks.length === 0,
    checks,
    hard_blocks: hardBlocks,
    payment_required_for_collection: offer?.billable === true,
    no_auto_contract: true,
    no_auto_spend: true,
    authority: "carl",
  };
}

export function universalProjectValueCycle(input = {}) {
  const intake = normalizeProjectIntake(input.intake || input);
  const plan = buildProjectPlan({
    intake,
    capabilities: input.capabilities || [],
    reusable_assets: input.reusable_assets || [],
    required_integrations: input.required_integrations || [],
    delivery_steps: input.delivery_steps || [],
  });
  const delivery = evaluateDelivery({
    execution: input.execution || {},
    evidence: input.evidence || {},
    verification: input.verification || {},
    measured_value: input.measured_value || 0,
  });
  const product = productizeProject({
    project_id: intake.id,
    reusable_components: input.reusable_components || [],
    similar_projects: input.similar_projects || 0,
    measured_value: input.measured_value || 0,
    delivery_cost: input.delivery_cost || 0,
    verified: delivery.verified,
  });
  const offer = buildCommercialOffer({
    project: intake,
    delivery,
    price: input.price ?? null,
    currency: input.currency || "USD",
    revenue_streams: input.revenue_streams || ["PROJECT"],
    license: input.license || null,
    subscription: input.subscription || null,
  });
  const growth = buildGrowthPlan(input.growth || {});
  const economicLedger = buildProjectValueLedger({
    project_id: intake.id,
    records: input.value_records || [],
    projected_revenue: input.projected_revenue || 0,
    realized_revenue: input.realized_revenue || 0,
    delivery_cost: input.delivery_cost || 0,
    measured_value: input.measured_value || 0,
    evidence_verified: delivery.verified,
    currency: input.currency || "USD",
  });
  const assetEconomics = buildAssetEconomics({
    asset_id: input.asset_id || null,
    project_id: intake.id,
    verified: delivery.verified,
    reusable_uses: input.reusable_uses || input.similar_projects || 0,
    similar_demand: input.similar_projects || 0,
    measured_value: input.measured_value || 0,
    creation_cost: input.delivery_cost || 0,
    realized_revenue: input.realized_revenue || 0,
    currency: input.currency || "USD",
    usage_right: input.usage_right || "PERPETUAL_USE",
  });
  const economicProof = buildEconomicProof({
    ledger: economicLedger,
    asset: assetEconomics,
    evidence: input.evidence || {},
    payment_rail: input.payment_rail || null,
  });
  const readiness = launchReadiness({ intake, plan, delivery, offer, payment_rail: input.payment_rail || null });
  return {
    version: UNIVERSAL_PROJECT_VALUE_VERSION,
    cycle: ["INTENTION", "QUALIFY", "PLAN", "MATCH", "EXECUTE", "VERIFY", "DELIVER", "VALUE", "REUSE", "PRODUCTIZE", "MONETIZE", "GROW", "LEARN"],
    intake,
    plan,
    delivery,
    product,
    offer,
    growth,
    economic_ledger: economicLedger,
    asset_economics: assetEconomics,
    economic_proof: economicProof,
    readiness,
    policy: ENGINE_POLICY,
    live: false,
    authority: "carl",
  };
}

export function enginePolicy() {
  return ENGINE_POLICY;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(universalProjectValueCycle({
    intention: "Acorn commercial launch",
    audience: "BUSINESS",
  }), null, 2));
}
