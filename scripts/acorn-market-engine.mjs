#!/usr/bin/env node
/** ACORN — MARKET ENGINE / DEMAND → OFFER → MEASURE → REVENUE
 *
 * The market layer converts real demand into reproducible offers.
 * It does not manufacture demand, fake capability, sign contracts, or spend.
 * Revenue collection is measured and automatic for commercial usage.
 * CAPABILITY != AUTHORITY. Evidence > assertion.
 */
export const MARKET_ENGINE_VERSION = "acorn.market-engine.v1";

const str = (v) => String(v ?? "").trim();
const n = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const clamp = (v) => Math.max(0, Math.min(1, n(v)));

export const OFFER_CATALOG = Object.freeze([
  { id:"evidence", name:"Evidence & Verification", unit:"verified_operation", audience:["PUBLIC","DEVELOPER","BUSINESS","ENTERPRISE"] },
  { id:"cognition", name:"Collective Cognition", unit:"cognitive_operation", audience:["PUBLIC","DEVELOPER","RESEARCH","BUSINESS","ENTERPRISE"] },
  { id:"orchestration", name:"Capability Orchestration", unit:"orchestrated_operation", audience:["DEVELOPER","BUSINESS","ENTERPRISE"] },
  { id:"connectors", name:"Connector / Flux Integration", unit:"verified_connection", audience:["DEVELOPER","BUSINESS","ENTERPRISE"] },
  { id:"benchmark", name:"Capability Benchmarking", unit:"benchmark", audience:["DEVELOPER","RESEARCH","BUSINESS","ENTERPRISE"] },
  { id:"compute", name:"Measured Compute", unit:"compute_unit", audience:["DEVELOPER","RESEARCH","BUSINESS","ENTERPRISE"] },
  { id:"simulation", name:"Quantum / Advanced Simulation", unit:"simulation", audience:["PUBLIC","DEVELOPER","RESEARCH","BUSINESS","ENTERPRISE"] },
  { id:"privacy", name:"Privacy & Process Hardening", unit:"privacy_audit", audience:["DEVELOPER","BUSINESS","ENTERPRISE"] },
  { id:"research", name:"Research & Experimentation", unit:"experiment", audience:["PUBLIC","DEVELOPER","RESEARCH","BUSINESS","ENTERPRISE"] },
  { id:"automation", name:"Continuous Workflow Automation", unit:"completed_work_item", audience:["DEVELOPER","BUSINESS","ENTERPRISE"] },
  { id:"adaptive", name:"Adaptive Capability Discovery", unit:"discovery", audience:["DEVELOPER","RESEARCH","BUSINESS","ENTERPRISE"] },
  { id:"custom", name:"Demand-Driven Custom Capability", unit:"measured_delivery", audience:["BUSINESS","ENTERPRISE"] },
]);

export function discoverDemand({ signals = [] } = {}) {
  return signals.map((signal, index) => ({
    id: str(signal.id || `demand:${index + 1}`),
    problem: str(signal.problem || signal.use_case || "unknown"),
    audience: str(signal.audience || "DEVELOPER").toUpperCase(),
    evidence: Array.isArray(signal.evidence) ? signal.evidence : [],
    provenance: signal.provenance || null,
    observed: signal.observed === true,
    confidence: clamp(signal.confidence),
  })).filter((row) => row.problem);
}

function matchedIdsFor(row, capabilityIndex) {
  return capabilityIndex.filter((cap) => {
    const tags = Array.isArray(cap.tags) ? cap.tags.map(str) : [];
    return tags.some((tag) => row.problem.toLowerCase().includes(tag.toLowerCase()));
  }).map((cap) => str(cap.id || cap.name));
}

function matchedCapabilitiesHaveProof({ matchedCapabilities = [], matchedIds = [] } = {}) {
  const byId = new Map(matchedCapabilities.map((cap) => [str(cap.id || cap.name), cap]));
  return matchedIds.length > 0 && matchedIds.every((id) => {
    const cap = byId.get(id);
    const evidence = Array.isArray(cap?.evidence) ? cap.evidence : [];
    return cap?.verified === true || cap?.proven === true ||
      evidence.some((item) => item && (item.verified === true || item.proven === true || item.status === "VERIFIED" || item.status === "PROVEN"));
  });
}

function evidenceIsVerified(evidence = []) {
  return Array.isArray(evidence) && evidence.length > 0 && evidence.every((item) =>
    item && (item.verified === true || item.proven === true || item.status === "VERIFIED" || item.status === "PROVEN")
  );
}

export function qualifyDemand({ demand = [], capabilityIndex = [] } = {}) {
  const known = new Set(capabilityIndex.map((x) => str(x.id || x.name)));
  return demand.map((row) => ({
    ...row,
    matched_capabilities: matchedIdsFor(row, capabilityIndex),
    capability_proven: matchedCapabilitiesHaveProof({ matchedCapabilities: capabilityIndex, matchedIds: matchedIdsFor(row, capabilityIndex) }),
    qualification: row.observed && row.evidence.length > 0 ? "EVIDENCE_BACKED" : "EXPLORATORY",
  }));
}

export function buildOffer({ demand, offer, capabilityEvidence = [], usage = 0, price = null } = {}) {
  const template = OFFER_CATALOG.find((x) => x.id === offer) || OFFER_CATALOG.find((x) => x.id === "custom");
  const commercial = ["BUSINESS","ENTERPRISE"].includes(str(demand?.audience).toUpperCase());
  return {
    version: MARKET_ENGINE_VERSION,
    id: `offer:${template.id}:${str(demand?.id || "unknown")}`,
    demand_id: demand?.id || null,
    product: template.name,
    unit: template.unit,
    audience: str(demand?.audience || "DEVELOPER").toUpperCase(),
    access: commercial ? "COMMERCIAL" : "OPEN",
    capabilities: Array.isArray(capabilityEvidence) ? capabilityEvidence : [],
    usage: Math.max(0, n(usage)),
    price: price == null ? null : Math.max(0, n(price)),
    pricing_basis: price == null ? "UNPRICED_UNTIL_MEASURED" : "PUBLISHED_METER",
    billable: commercial && usage > 0 && price != null,
    automatic_collection: commercial && usage > 0 && price != null,
    capability_proven: demand?.capability_proven === true && evidenceIsVerified(capabilityEvidence),
    verified: demand?.capability_proven === true && evidenceIsVerified(capabilityEvidence),
    evidence_required: true,
    auto_contract: false,
    auto_spend: false,
    authority: "carl",
  };
}

export function diversifyOffer({ demand, capabilityIds = [], evidence = [] } = {}) {
  return OFFER_CATALOG
    .filter((template) => !template.audience.length || template.audience.includes(str(demand?.audience || "DEVELOPER").toUpperCase()))
    .map((template) => buildOffer({ demand, offer: template.id, capabilityEvidence: evidence }));
}

export function billingFromMeasuredUsage({ offer, units = 0, unit_price = null, currency = "USD", paymentRail = null } = {}) {
  const u = Math.max(0, n(units));
  const p = unit_price == null ? null : Math.max(0, n(unit_price));
  const billable = Boolean(offer?.billable && u > 0 && p != null);
  return {
    version: MARKET_ENGINE_VERSION,
    type: "MEASURED_BILLING_EVENT",
    offer_id: offer?.id || null,
    units: u,
    unit_price: p,
    amount_due: billable ? u * p : 0,
    currency: str(currency) || "USD",
    payment_rail: paymentRail || null,
    automatic_collection_requested: billable,
    settled: false,
    verified: false,
    no_custody: true,
    no_private_credentials: true,
    authority: "carl",
  };
}

export function runMarketCycle({ signals = [], capabilityIndex = [] } = {}) {
  const demand = discoverDemand({ signals });
  const qualified = qualifyDemand({ demand, capabilityIndex });
  const offers = qualified.flatMap((row) => diversifyOffer({
    demand: row,
    capabilityIds: row.matched_capabilities,
    evidence: row.evidence,
  }));
  return {
    version: MARKET_ENGINE_VERSION,
    cycle:["DETECT_DEMAND","QUALIFY","MATCH_CAPABILITY","PROTOTYPE","MEASURE","VERIFY","PACKAGE","OFFER","BILL","SETTLE","LEARN","RETIRE_OR_SCALE"],
    demand_count:demand.length,
    qualified_count:qualified.length,
    offer_count:offers.length,
    offers,
    public_access:true,
    developer_access:true,
    equal_access:true,
    strategic_partners:["OpenAI","Grok/xAI"],
    automatic_collection:true,
    crypto_rails:"DISCOVER_AND_VERIFY",
    no_fake_capability:true,
    no_auto_contract:true,
    no_auto_spend:true,
    authority:"carl",
    live:false,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runMarketCycle(), null, 2));
}
