/** ACORN — OPPORTUNITY LOOP
 * Reverse direction: CAPABILITY → OPPORTUNITY → SOLUTION → PRODUCT.
 * Demand → capability already exists. This composes the other way.
 *
 * Not a CRM, marketplace, ERP, or second commercial engine.
 * OPPORTUNITY ≠ CUSTOMER. OFFER ≠ SALE. COST unknown ≠ 0.
 */
import { createOpportunity } from "./acorn-value-opportunity-fabric.mjs";
import { discoverOpportunity, marketplaceMatch } from "./acorn-commercial-growth-fabric.mjs";
import { composeOffers, proposeExpansion } from "./acorn-commercial-runtime.mjs";
import { productizeProject } from "./acorn-universal-project-value.mjs";

export const OPPORTUNITY_LOOP_VERSION = "acorn.opportunity-loop.v0";
export const COMMERCIAL_FORMS = Object.freeze([
  "ONE_TIME", "SUBSCRIPTION", "USAGE", "PROJECT", "LICENSE", "ENTERPRISE", "WHITE_LABEL", "API"
]);

const ISO = () => new Date().toISOString();
const str = (v) => String(v ?? "").trim();
const names = (caps = []) => caps.map((c) => str(c.name || c.id || c)).filter(Boolean);

function costOf(cap) {
  if (cap && cap.cost != null && Number.isFinite(Number(cap.cost))) return Number(cap.cost);
  return null;
}

export function discoverFromCapabilities({
  capabilities = [],
  gaps = [],
  projects = [],
  tenantId = null
} = {}) {
  const caps = Array.isArray(capabilities) ? capabilities : [];
  const present = caps.filter((c) => c && (c.exists === true || c.available === true || c.name || c.id));
  const out = [];
  for (const cap of present) {
    const label = str(cap.name || cap.id);
    if (!label) continue;
    const hypothesis = "Capability " + label + " may address an unformulated need";
    const discovered = discoverOpportunity({
      problem: hypothesis,
      capabilities: [label],
      gaps: names(gaps),
      evidence: []
    });
    const created = createOpportunity({
      id: discovered.id,
      source: "capability",
      use_case: hypothesis,
      requirements: [label],
      capability_gaps: names(gaps),
      confidence: 0,
      status: "PROPOSED"
    });
    out.push({
      ...created,
      ...discovered,
      kind: "UNDERUTILIZED_CAPABILITY",
      required_capabilities: [label],
      capability_ids: [cap.id || label],
      estimated_value: null,
      estimated_cost: costOf(cap),
      cost_state: costOf(cap) == null ? "COST_NOT_MEASURED" : "OBSERVED",
      is_demand: false,
      is_customer: false,
      is_sale: false,
      status: "PROPOSED",
      tenant_id: tenantId,
      valid_until: null,
      live: false
    });
  }
  if (present.length >= 2) {
    const combo = names(present).slice(0, 4);
    const hypothesis = "Combination of " + combo.join(" + ") + " may form a solution that is not yet a product";
    const discovered = discoverOpportunity({ problem: hypothesis, capabilities: combo, evidence: [] });
    const created = createOpportunity({
      id: discovered.id,
      source: "capability_combination",
      use_case: hypothesis,
      requirements: combo,
      status: "PROPOSED",
      confidence: 0
    });
    out.push({
      ...created,
      ...discovered,
      kind: "COMBINATION",
      required_capabilities: combo,
      estimated_value: null,
      estimated_cost: null,
      cost_state: "COST_NOT_MEASURED",
      is_demand: false,
      is_customer: false,
      status: "PROPOSED",
      tenant_id: tenantId,
      live: false
    });
  }
  const expansion = proposeExpansion({
    project: projects[0] || { id: tenantId },
    assets: present,
    nextProblems: names(gaps)
  });
  return {
    version: OPPORTUNITY_LOOP_VERSION,
    opportunities: out,
    expansion,
    proposed: true,
    customer: false,
    sale: false,
    live: false,
    measured_at: ISO()
  };
}

export function matchDemandCapability({ demands = [], capabilities = [] } = {}) {
  const demandRows = (Array.isArray(demands) ? demands : []).map((d) => ({
    id: d.id || d.demand_id || d.request_id,
    problem: str(d.intent || d.problem || d.request || d.use_case)
  })).filter((d) => d.problem);
  const capRows = (Array.isArray(capabilities) ? capabilities : []).map((c) => ({
    id: c.id || c.name,
    name: str(c.name || c.id),
    capabilities: c.capabilities || [c.name || c.id].filter(Boolean),
    cost: costOf(c),
    evidence: c.evidence || []
  }));
  const matches = [];
  for (const demand of demandRows) {
    const market = marketplaceMatch({
      problem: demand.problem,
      providers: capRows,
      requirements: names(capRows)
    });
    for (const cap of capRows) {
      const text = (demand.problem + " " + cap.name).toLowerCase();
      const fit = text.includes(String(cap.name || "").toLowerCase()) || (cap.capabilities || []).some((n) => demand.problem.toLowerCase().includes(String(n).toLowerCase()));
      matches.push({
        demand_id: demand.id,
        capability_id: cap.id,
        capability: cap.name,
        fit: fit ? "CANDIDATE" : "UNMATCHED",
        evidence: Array.isArray(cap.evidence) ? cap.evidence.length : 0,
        cost: cap.cost,
        cost_state: cap.cost == null ? "COST_NOT_MEASURED" : "OBSERVED",
        quality: null,
        latency: null,
        availability: "UNKNOWN",
        authority: false,
        risk: "UNMEASURED",
        market_rank: market.matches.find((m) => m.provider_id === cap.id)?.coverage ?? 0,
        live: false
      });
    }
  }
  return {
    version: OPPORTUNITY_LOOP_VERSION,
    matches,
    multiplicity: true,
    best: null,
    live: false
  };
}

export function composeSolutions({ opportunity, capabilities = [] } = {}) {
  const caps = names(capabilities.length ? capabilities : opportunity?.required_capabilities || []);
  const rows = [
    { id: "sol_economy", criterion: "cost", profile: "lower catalog price / unverified speed", human_assisted: false },
    { id: "sol_quality", criterion: "verification", profile: "higher verification / human review", human_assisted: true },
    { id: "sol_subscription", criterion: "continuity", profile: "subscription form of the same capabilities", human_assisted: false }
  ];
  return {
    opportunity_id: opportunity?.id || null,
    solutions: rows.map((row) => ({
      ...row,
      capabilities: caps,
      estimated_cost: null,
      cost_state: "COST_NOT_MEASURED",
      best: false,
      selected: false,
      authorized: false,
      live: false
    })),
    best: null,
    live: false
  };
}

export function productizeCapability({ capability, audience = "BUSINESS" } = {}) {
  const cap = capability && typeof capability === "object" ? capability : { name: capability };
  const name = str(cap.name || cap.id);
  const composed = composeOffers({
    project: { id: cap.id || name, problem: name, qualification: { estimated_complexity: "LOW" } },
    demand: name,
    capabilities: [cap],
    audience
  });
  const productized = productizeProject({
    project_id: cap.id || name,
    reusable_components: [name],
    verified: cap.verified === true
  });
  const forms = COMMERCIAL_FORMS.map((model) => {
    const offer = composed.offers.find((o) => o.model === model) || null;
    return {
      capability_id: cap.id || name,
      capability_name: name,
      model,
      offer_id: offer?.id || null,
      amount_cents: offer ? offer.amount_cents : null,
      state: "CANDIDATE",
      published: false,
      customer: false,
      sale: false,
      live: false
    };
  });
  return {
    capability_id: cap.id || name,
    capability_name: name,
    productization: productized,
    forms,
    offers: (composed.offers || []).map((o) => ({ ...o, capability_id: cap.id || name, published: false, live: false })),
    ownership: {
      usage_is_not_ownership: true,
      access_is_not_authority: true,
      perpetual_not_inferred: true
    },
    published: false,
    live: false
  };
}

export function valueNetwork({ capabilities = [], projects = [], customers = [], outcomes = [] } = {}) {
  const nodes = [
    ...capabilities.map((c) => ({ id: c.id || c.name, kind: "CAPABILITY" })),
    ...projects.map((p) => ({ id: p.id, kind: "PROJECT" })),
    ...customers.map((c) => ({ id: c.id || c.customer_id, kind: "CUSTOMER" })),
    ...outcomes.map((o) => ({ id: o.id || o.project_id, kind: "OUTCOME" }))
  ].filter((n) => n.id);
  const edges = [];
  for (const p of projects) {
    if (p.customer_id) edges.push({ from: p.customer_id, to: p.id, rel: "demands" });
    for (const cap of p.capabilities || []) edges.push({ from: p.id, to: cap.id || cap, rel: "uses" });
  }
  return {
    version: OPPORTUNITY_LOOP_VERSION,
    nodes,
    edges,
    revenue: null,
    cost_state: "COST_NOT_MEASURED",
    value_state: "VALUE_NOT_MEASURED",
    live: false
  };
}

export function learnFromOutcome({ outcome = null } = {}) {
  return {
    recorded: Boolean(outcome),
    promoted: false,
    productized: false,
    authorized: false,
    live: false,
    measured_at: ISO()
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const probe = discoverFromCapabilities({ capabilities: [{ name: "analysis", exists: true }] });
  console.log(JSON.stringify({
    version: OPPORTUNITY_LOOP_VERSION,
    opportunities: probe.opportunities.length,
    proposed: probe.proposed,
    live: false
  }));
}
