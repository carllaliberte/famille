/** ACORN — CORTEX INTELLIGENCE ADAPTER / CAPABILITY ROUTER */
export const CONTRACT = "acorn.cortex-intelligence-adapter.v1";

const A = v => Array.isArray(v) ? v : [];
const now = () => new Date().toISOString();
const norm = v => String(v ?? "").trim().toLowerCase();

export const ADAPTER_STATES = Object.freeze([
  "DISCOVERED","QUALIFIED","AVAILABLE","DEGRADED","EXPIRED","REVOKED"
]);

export function intelligenceAdapter({
  identity,
  provider = "UNKNOWN",
  kind = "INTELLIGENCE",
  capabilities = [],
  routes = [],
  evidence = [],
  metadata = {}
} = {}) {
  if (!identity) throw new Error("INTELLIGENCE_IDENTITY_REQUIRED");
  return {
    contract: CONTRACT,
    id: `intelligence:${norm(identity).replace(/[^a-z0-9._-]+/g, "-")}`,
    identity,
    provider,
    kind,
    capabilities: [...new Set(A(capabilities).map(norm).filter(Boolean))],
    routes: A(routes),
    evidence: A(evidence),
    metadata,
    state: "DISCOVERED",
    authority: false,
    breaker_touched: false,
    discovered_at: now()
  };
}

export function qualifyIntelligence(intelligence, {
  required_capabilities = [],
  min_evidence = 0,
  available = true
} = {}) {
  const caps = new Set(A(intelligence.capabilities).map(norm));
  const capable = A(required_capabilities).every(c => caps.has(norm(c)));
  const enoughEvidence = A(intelligence.evidence).length >= min_evidence;
  return {
    ...intelligence,
    state: available && capable && enoughEvidence ? "QUALIFIED" : "DEGRADED",
    authority: false,
    breaker_touched: false,
    qualified_at: now()
  };
}

export function routeByCapability({
  capability,
  intelligences = [],
  constraints = {},
  required_evidence = 0
} = {}) {
  if (!capability) throw new Error("CAPABILITY_REQUIRED");
  const wanted = norm(capability);
  const candidates = A(intelligences)
    .filter(i => ["QUALIFIED","AVAILABLE"].includes(i.state))
    .filter(i => A(i.capabilities).map(norm).includes(wanted))
    .filter(i => A(i.evidence).length >= required_evidence)
    .map(i => ({
      identity: i.identity,
      provider: i.provider,
      kind: i.kind,
      capability: wanted,
      routes: A(i.routes),
      evidence_count: A(i.evidence).length,
      metadata: i.metadata || {},
      authority: false,
      breaker_touched: false
    }));

  return {
    contract: "acorn.cortex-capability-route.v1",
    capability: wanted,
    constraints,
    candidates,
    state: candidates.length ? "ROUTABLE" : "NO_MATCH",
    selected: null,
    requires_authorization: true,
    authority: false,
    breaker_touched: false,
    created_at: now()
  };
}

export function selectRoute(route, {
  identity = null,
  selection_reason = "MEASURED_FIT"
} = {}) {
  const candidates = A(route.candidates);
  const selected = identity
    ? candidates.find(c => c.identity === identity) || null
    : candidates[0] || null;

  return {
    ...route,
    selected,
    selection_reason: selected ? selection_reason : "NO_MATCH",
    state: selected ? "SELECTED" : "NO_MATCH",
    requires_authorization: true,
    authority: false,
    breaker_touched: false,
    selected_at: now()
  };
}

export function buildAdaptiveIntelligenceGraph(intelligences = []) {
  const nodes = A(intelligences).map(i => ({
    identity: i.identity,
    provider: i.provider,
    kind: i.kind,
    state: i.state,
    capabilities: A(i.capabilities),
    authority: false
  }));
  const capabilities = [...new Set(nodes.flatMap(n => n.capabilities))].sort();
  return {
    contract: "acorn.cortex-intelligence-graph.v1",
    nodes,
    capabilities,
    provider_neutral: true,
    fixed_provider_allowlist: false,
    authority: false,
    breaker_touched: false,
    created_at: now()
  };
}

export function assertIntelligenceAdapterConstitution(snapshot = {}) {
  if (snapshot.authority) throw new Error("CAPABILITY_MUST_NOT_GRANT_AUTHORITY");
  if (snapshot.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
  if (snapshot.auto_authorize) throw new Error("AUTO_AUTHORIZATION_FORBIDDEN");
  if (snapshot.auto_execute) throw new Error("AUTO_EXECUTION_FORBIDDEN");
  if (snapshot.fixed_provider_allowlist) throw new Error("FIXED_PROVIDER_ALLOWLIST_FORBIDDEN");
  return true;
}
