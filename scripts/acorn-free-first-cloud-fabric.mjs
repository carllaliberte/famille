export const FREE_FIRST_CLOUD_FABRIC_VERSION = "acorn.free-first-cloud-fabric.v1";
export const RESOURCE_CLASSES = Object.freeze(["FREE_PERMANENT","FREE_QUOTA","SPONSORED","TRIAL","PAID","UNKNOWN"]);
export const RESOURCE_STATES = Object.freeze(["DISCOVERED","IDENTIFIED","AVAILABLE","MEASURED","VERIFIED","DEGRADED","EXPIRED","REVOKED","UNKNOWN"]);

const text = (value) => String(value ?? "").trim();
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value) => Math.max(0, Math.min(1, finite(value)));

export function classifyResourceClass({ permanent=false, quota=false, sponsored=false, trial=false, paid=false, evidence=null } = {}) {
  if (permanent && evidence?.verified === true) return "FREE_PERMANENT";
  if (quota && evidence?.verified === true) return "FREE_QUOTA";
  if (sponsored && evidence?.verified === true) return "SPONSORED";
  if (trial && evidence?.verified === true) return "TRIAL";
  if (paid && evidence?.verified === true) return "PAID";
  return "UNKNOWN";
}

export function createResource({ id, provider="unknown", name=id, resource_class="UNKNOWN", state="DISCOVERED", capabilities=[], region=null, limits={}, evidence=[], provenance=null, measured={}, cost={}, expires_at=null, metadata={} } = {}) {
  return {
    id: text(id) || "resource:unknown", provider: text(provider) || "unknown", name: text(name) || text(id) || "unknown",
    resource_class: RESOURCE_CLASSES.includes(resource_class) ? resource_class : "UNKNOWN",
    state: RESOURCE_STATES.includes(state) ? state : "UNKNOWN",
    capabilities: [...new Set((Array.isArray(capabilities) ? capabilities : []).map(text).filter(Boolean))],
    region, limits, evidence: Array.isArray(evidence) ? evidence : [], provenance, measured, cost, expires_at, metadata,
    authority: "carl", auto_spend: false, live: false
  };
}

export function scoreFreeFirstResource(resource={}, { required_capability=null }={}) {
  const classScore = {FREE_PERMANENT:1,FREE_QUOTA:.92,SPONSORED:.82,TRIAL:.55,PAID:.10,UNKNOWN:0}[resource.resource_class] ?? 0;
  const capabilityScore = required_capability ? ((resource.capabilities || []).includes(required_capability) ? 1 : 0) : 1;
  const verificationScore = resource.state === "VERIFIED" ? 1 : resource.state === "MEASURED" ? .75 : .25;
  return Number((.45*classScore + .25*capabilityScore + .15*verificationScore + .10*clamp(resource.measured?.availability ?? .5) + .05*clamp(resource.measured?.performance ?? .5)).toFixed(6));
}

export function allocateFreeFirst(resources=[], options={}) {
  return [...resources]
    .filter((resource) => resource && !["EXPIRED","REVOKED"].includes(resource.state))
    .filter((resource) => !options.required_capability || (resource.capabilities || []).includes(options.required_capability))
    .map((resource) => ({...resource, priority: scoreFreeFirstResource(resource, options)}))
    .sort((a,b) => b.priority - a.priority);
}

export function spendingDecision(resource={}, { measured_revenue=0, measured_cost=0, human_authorization=false }={}) {
  if (["FREE_PERMANENT","FREE_QUOTA"].includes(resource.resource_class)) return {decision:"ALLOW_FREE", reason:"WITHIN_DECLARED_FREE_CLASS", spend:0};
  if (resource.resource_class === "SPONSORED") return {decision:"ALLOW_SPONSORED", reason:"SPONSORSHIP_MUST_BE_VERIFIED", spend:0};
  if (resource.resource_class === "TRIAL") return {decision:"ALLOW_TRIAL", reason:"TEMPORARY_CREDIT_ONLY", spend:0};
  if (resource.resource_class === "PAID") {
    if (human_authorization !== true) return {decision:"HOLD_HUMAN", reason:"PAID_RESOURCE_REQUIRES_HUMAN_AUTHORIZATION", spend:0};
    if (finite(measured_revenue) <= finite(measured_cost)) return {decision:"HOLD_HUMAN", reason:"REVENUE_DOES_NOT_COVER_MEASURED_COST", spend:0};
    return {decision:"ALLOW_PAID", reason:"HUMAN_AUTHORIZED_AND_REVENUE_BACKED", spend:Math.max(0,finite(measured_cost))};
  }
  return {decision:"HOLD_HUMAN", reason:"RESOURCE_CLASS_UNKNOWN", spend:0};
}

export function buildFreeFirstPlan(resources=[], options={}) {
  const ranked = allocateFreeFirst(resources, options);
  const selected = ranked.find((resource) => ["VERIFIED","MEASURED","AVAILABLE"].includes(resource.state)) || null;
  return {
    version: FREE_FIRST_CLOUD_FABRIC_VERSION, policy:"FREE_FIRST", required_capability:options.required_capability || null,
    selected: selected ? {id:selected.id,provider:selected.provider,resource_class:selected.resource_class,priority:selected.priority} : null,
    candidates: ranked.map((r) => ({id:r.id,provider:r.provider,resource_class:r.resource_class,state:r.state,priority:r.priority})),
    paid_candidates: ranked.filter((r) => r.resource_class === "PAID").map((r) => r.id),
    unknown_candidates: ranked.filter((r) => r.resource_class === "UNKNOWN").map((r) => r.id),
    auto_spend:false, auto_contract:false, auto_merge:false, authority:"carl", live:false
  };
}

export function resourceEconomyPolicy() {
  return {
    version:FREE_FIRST_CLOUD_FABRIC_VERSION,
    order:["FREE_PERMANENT","FREE_QUOTA","SPONSORED","TRIAL","PAID","UNKNOWN"],
    verify_before_use:true, measure_before_promotion:true, paid_requires_human_authorization:true,
    paid_requires_measured_revenue:true, automatic_failover:true, automatic_spend:false,
    automatic_contract:false, automatic_merge:false, provider_lock_in:false, authority:"carl"
  };
}

export function snapshotFreeFirstCloud({resources=[]}={}) {
  const counts = Object.fromEntries(RESOURCE_CLASSES.map((key) => [key,0]));
  for (const resource of resources) counts[resource.resource_class] = (counts[resource.resource_class] || 0) + 1;
  return {version:FREE_FIRST_CLOUD_FABRIC_VERSION,resources,counts,policy:resourceEconomyPolicy(),live:false,authority:"carl"};
}
