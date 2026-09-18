#!/usr/bin/env node
/** ACORN — DEVELOPER GATEWAY / UNIVERSAL ONBOARDING
 *
 * One provider-neutral contract for public/developer access.
 * DISCOVERED != CONNECTED != VERIFIED != LIVE.
 * External traffic enters through Connector/Flux; credentials never belong here.
 * CAPABILITY != AUTHORITY. CARL remains the authority.
 */
export const DEVELOPER_GATEWAY_VERSION = "acorn.developer-gateway.v1";

export const ACCESS = Object.freeze({
  PUBLIC: { access: "OPEN", billing: "FREE", human_equal: true },
  DEVELOPER: { access: "OPEN", billing: "FREE", human_equal: true },
  COMMUNITY: { access: "OPEN", billing: "FREE", human_equal: true },
  RESEARCH: { access: "OPEN", billing: "FREE_OR_SPONSORED", human_equal: true },
  BUSINESS: { access: "COMMERCIAL", billing: "MEASURED_USAGE", human_equal: true },
  ENTERPRISE: { access: "COMMERCIAL", billing: "MEASURED_USAGE_OR_CONTRACT", human_equal: true },
  STRATEGIC_OPENAI: { access: "STRATEGIC", billing: "PARTNERSHIP", human_equal: true },
  STRATEGIC_GROK: { access: "STRATEGIC", billing: "PARTNERSHIP", human_equal: true },
});

const str = (v) => String(v ?? "").trim();
const list = (v) => Array.isArray(v) ? [...new Set(v.map(str).filter(Boolean))] : [];

export function classifyDeveloperAccess({ kind = "developer", organization = "", provider = "" } = {}) {
  const k = str(kind).toLowerCase();
  const p = str(provider).toLowerCase();
  if (p.includes("openai") || p.includes("chatgpt")) return "STRATEGIC_OPENAI";
  if (p.includes("grok") || p.includes("xai")) return "STRATEGIC_GROK";
  if (k === "enterprise") return "ENTERPRISE";
  if (k === "business" || k === "company") return "BUSINESS";
  if (k === "research") return "RESEARCH";
  if (["public", "developer", "community"].includes(k)) return k.toUpperCase();
  return organization ? "BUSINESS" : "DEVELOPER";
}

export function buildDeveloperConnectManifest({ capabilities = [], protocols = [], endpoint = null } = {}) {
  return {
    version: DEVELOPER_GATEWAY_VERSION,
    service: "ACORN",
    access: "OPEN",
    capability_discovery: true,
    provider_neutral: true,
    automatic_onboarding: true,
    automatic_connection: true,
    connector_flux_required: true,
    capabilities: list(capabilities),
    protocols: list(protocols),
    endpoint: endpoint ? str(endpoint) : null,
    credentials_in_acorn: false,
    private_keys_in_acorn: false,
    telemetry_default: "OFF",
    tracking: false,
    cookies: ["session", "security", "language"],
    human_equal: true,
    capability_is_not_authority: true,
    live: false,
    verified: false,
    authority: "carl",
  };
}

export function negotiateDeveloperSession({ identity = {}, capabilities = [], proof = null, access = "DEVELOPER" } = {}) {
  const profile = ACCESS[access] || ACCESS.DEVELOPER;
  const offered = list(capabilities);
  const authenticated = Boolean(proof && proof.verified === true);
  return {
    version: DEVELOPER_GATEWAY_VERSION,
    state: authenticated ? "CONNECTED" : "DISCOVERED",
    identity: {
      mode: identity.pseudonymous === false ? "EXPLICIT" : "PSEUDONYMOUS",
      subject: identity.subject ? str(identity.subject) : null,
    },
    capabilities: offered.map((name) => ({
      name,
      state: authenticated ? "AVAILABLE_PENDING_MEASUREMENT" : "DISCOVERED",
    })),
    access: profile,
    measurement_required: true,
    verification_required: true,
    external_boundary: "CONNECTOR_FLUX",
    no_authority_transfer: true,
    no_private_credentials: true,
    live: false,
    authority: "carl",
  };
}

export function createUsageMeter({ session_id = null, audience = "DEVELOPER", units = 0, unit = "request" } = {}) {
  const profile = ACCESS[audience] || ACCESS.DEVELOPER;
  const n = Number(units);
  return {
    version: DEVELOPER_GATEWAY_VERSION,
    type: "USAGE_MEASUREMENT",
    session_id: session_id ? str(session_id) : null,
    audience,
    unit: str(unit) || "request",
    units: Number.isFinite(n) && n >= 0 ? n : 0,
    billable: ["BUSINESS", "ENTERPRISE"].includes(audience) && n > 0,
    collection: profile.billing === "MEASURED_USAGE" || profile.billing === "MEASURED_USAGE_OR_CONTRACT",
    automatic_collection_requested: ["BUSINESS", "ENTERPRISE"].includes(audience),
    measured: true,
    verified: false,
    authority: "carl",
  };
}

export function gatewayPolicy() {
  return Object.freeze({
    equal_access: true,
    public_access: true,
    developer_access: true,
    specialist_only: false,
    self_service: true,
    automatic_onboarding: true,
    automatic_connection: true,
    measured_billing: true,
    automatic_collection: true,
    crypto_capability_discovery: true,
    no_private_key_custody: true,
    no_secret_logging: true,
    no_tracking: true,
    connector_flux_required: true,
    auto_merge: false,
    auto_spend: false,
    auto_contract: false,
    authority: "carl",
    live: false,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify({ version: DEVELOPER_GATEWAY_VERSION, policy: gatewayPolicy() }, null, 2));
}
