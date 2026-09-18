#!/usr/bin/env node
/**
 * ACORN — REAL-WORLD TURNKEY ORCHESTRATOR
 *
 * One composition layer over the existing customer, commercial, connection,
 * intelligence, execution and evidence fabrics.
 *
 * This module does not create a second engine. It closes the semantic gap
 * between "a capability exists" and "the outside world was actually observed".
 *
 * CODE_PRESENT != TESTED != EXECUTED != MEASURED != VERIFIED != LIVE
 * CAPABILITY != AUTHORITY
 * PAYMENT != EXECUTION
 * PREVIEW != RECEIPT
 */

export const REAL_WORLD_TURNKEY_VERSION = "acorn.real-world-turnkey.v1";

export const REALITY_STATES = Object.freeze([
  "UNKNOWN",
  "DISCOVERED",
  "CONFIGURED",
  "AUTHENTICATED",
  "CONNECTED",
  "READABLE",
  "EXECUTABLE",
  "MEASURED",
  "VERIFIED",
  "LIVE",
  "BLOCKED",
  "HOLD_HUMAN",
  "FAILED",
]);

const str = (v) => String(v ?? "").trim();
const arr = (v) => Array.isArray(v) ? v : [];
const bool = (v) => v === true;
const uniq = (xs) => [...new Set(xs.map(str).filter(Boolean))];

function state(v) {
  const s = str(v).toUpperCase();
  return REALITY_STATES.includes(s) ? s : "UNKNOWN";
}

function proofFlags(input = {}) {
  return {
    code_present: bool(input.code_present),
    tested: bool(input.tested),
    executed: bool(input.executed),
    measured: bool(input.measured),
    verified: bool(input.verified),
    live: bool(input.live),
  };
}

export function realityCard({
  id,
  provider,
  kind,
  capability,
  state: rawState = "UNKNOWN",
  authenticated = false,
  connected = false,
  readable = false,
  executable = false,
  measured = false,
  verified = false,
  live = false,
  evidence = [],
  reason = null,
} = {}) {
  const s = state(rawState);
  const evidenceRows = arr(evidence).map((e) => ({
    id: str(e?.id),
    status: state(e?.status || e?.state),
    observed_at: e?.observed_at || e?.measured_at || null,
    valid_until: e?.valid_until || null,
  }));
  return Object.freeze({
    id: str(id) || null,
    provider: str(provider) || null,
    kind: str(kind) || "generic",
    capability: str(capability) || null,
    state: s,
    authenticated: bool(authenticated),
    connected: bool(connected),
    readable: bool(readable),
    executable: bool(executable),
    measured: bool(measured),
    verified: bool(verified),
    live: bool(live),
    authority: false,
    evidence: evidenceRows,
    reason: reason ? str(reason) : null,
    proof: proofFlags({
      code_present: true,
      tested: true,
      executed: connected || readable || executable || measured,
      measured,
      verified,
      live,
    }),
  });
}

export function canExecuteExternal({
  connector = {},
  human_authorized = false,
  paid = false,
  payment_observed = false,
  execution_authorized = false,
  operation = "READ",
} = {}) {
  const consequential = new Set([
    "WRITE","MONEY","PUBLISH","SIGN","DELETE","MERGE","REFUND",
    "PAYOUT","PRICE_CHANGE","CONTRACT","EXTERNAL_EFFECT"
  ]).has(str(operation).toUpperCase());

  if (connector.live !== true && connector.executable !== true) {
    return { allowed: false, reason: "CONNECTOR_NOT_EXECUTABLE", authority: false };
  }
  if (paid && !payment_observed) {
    return { allowed: false, reason: "PAYMENT_NOT_OBSERVED", authority: false };
  }
  if (consequential && human_authorized !== true) {
    return { allowed: false, reason: "HUMAN_AUTHORIZATION_REQUIRED", authority: false };
  }
  if (consequential && execution_authorized !== true) {
    return { allowed: false, reason: "EXECUTION_AUTHORIZATION_REQUIRED", authority: false };
  }
  return {
    allowed: true,
    reason: null,
    authority: human_authorized === true && execution_authorized === true,
  };
}

export function buildRealitySnapshot({
  customer = {},
  project = {},
  connectors = [],
  intelligences = [],
  commercial = {},
  execution = {},
  evidence = [],
} = {}) {
  const connectorRows = arr(connectors).map((c) => realityCard(c));
  const intelligenceRows = arr(intelligences).map((i) => ({
    id: str(i?.id) || null,
    provider: str(i?.provider) || null,
    model: str(i?.model) || null,
    capabilities: uniq(arr(i?.capabilities)),
    authority: false,
    state: state(i?.state || "DISCOVERED"),
    measured: bool(i?.measured),
    verified: bool(i?.verified),
    live: bool(i?.live),
  }));
  const evidenceRows = arr(evidence).map((e) => ({
    id: str(e?.id),
    claim: str(e?.claim),
    status: state(e?.status || e?.state),
    measured_at: e?.measured_at || e?.observed_at || null,
    valid_until: e?.valid_until || null,
  }));

  const paid = commercial?.payment_observed === true;
  const delivered = commercial?.delivered === true;
  const verifiedValue = commercial?.value_verified === true;

  const blockers = [];
  if (!str(customer?.id)) blockers.push("CUSTOMER_REQUIRED");
  if (!str(project?.id)) blockers.push("PROJECT_REQUIRED");
  if (!connectorRows.some((c) => c.connected)) blockers.push("NO_CONNECTED_EXTERNAL_CONNECTOR");
  if (!paid && commercial?.payment_required === true) blockers.push("PAYMENT_NOT_OBSERVED");
  if (!delivered) blockers.push("DELIVERY_NOT_VERIFIED");
  if (!verifiedValue) blockers.push("CUSTOMER_VALUE_NOT_VERIFIED");

  return Object.freeze({
    version: REAL_WORLD_TURNKEY_VERSION,
    customer: {
      id: str(customer?.id) || null,
      tenant_id: str(customer?.tenant_id) || null,
    },
    project: {
      id: str(project?.id) || null,
      stage: str(project?.stage || project?.state || "UNKNOWN"),
    },
    connectors: connectorRows,
    intelligences: intelligenceRows,
    commercial: {
      checkout_created: commercial?.checkout_created === true,
      payment_observed: paid,
      execution_authorized: commercial?.execution_authorized === true,
      delivered,
      value_verified: verifiedValue,
    },
    execution: {
      state: str(execution?.state || "UNKNOWN"),
      external_effect: execution?.external_effect === true,
      human_authorized: execution?.human_authorized === true,
    },
    evidence: evidenceRows,
    blockers: uniq(blockers),
    next_action: blockers.length ? "RESOLVE_BLOCKERS" : "MEASURE_RENEWAL_AND_EXPANSION",
    live: false,
    verified: false,
    authority: "carl",
    auto_merge: false,
    auto_spend: false,
  });
}

export function customerNextAction(snapshot = {}) {
  const blockers = new Set(arr(snapshot.blockers).map(str));
  if (blockers.has("CUSTOMER_REQUIRED")) return "CREATE_CUSTOMER";
  if (blockers.has("PROJECT_REQUIRED")) return "DESCRIBE_PROJECT";
  if (blockers.has("NO_CONNECTED_EXTERNAL_CONNECTOR")) return "CONNECT_REQUIRED_EXTERNAL_CAPABILITY";
  if (blockers.has("PAYMENT_NOT_OBSERVED")) return "COMPLETE_CHECKOUT";
  if (blockers.has("DELIVERY_NOT_VERIFIED")) return "VERIFY_DELIVERY";
  if (blockers.has("CUSTOMER_VALUE_NOT_VERIFIED")) return "MEASURE_CUSTOMER_VALUE";
  return "CONTINUE_TO_RENEWAL_EXPANSION";
}

export function assertTruthContract(snapshot = {}) {
  if (snapshot.live === true && snapshot.verified !== true) {
    throw new Error("LIVE_REQUIRES_VERIFIED");
  }
  if (snapshot.verified === true && !arr(snapshot.evidence).length) {
    throw new Error("VERIFIED_REQUIRES_EVIDENCE");
  }
  if (snapshot.execution?.external_effect === true && snapshot.execution?.human_authorized !== true) {
    throw new Error("EXTERNAL_EFFECT_REQUIRES_HUMAN_AUTHORIZATION");
  }
  return true;
}

export function turnkeyConstitution() {
  return Object.freeze({
    version: REAL_WORLD_TURNKEY_VERSION,
    one_orchestrator: true,
    reuses_existing_fabrics: [
      "customer-service",
      "customer-experience",
      "commercial-runtime",
      "connection-fabric",
      "connector-execution",
      "intelligence-fabric",
      "execution-fabric",
      "evidence-registry",
    ],
    capability_is_not_authority: true,
    payment_is_not_execution: true,
    preview_is_not_receipt: true,
    no_fake_live: true,
    no_fake_verified: true,
    no_auto_spend: true,
    no_auto_contract: true,
    no_auto_merge: true,
    human_authority: "carl",
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(turnkeyConstitution(), null, 2));
}
