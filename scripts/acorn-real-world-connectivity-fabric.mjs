/**
 * ACORN REAL-WORLD CONNECTIVITY FABRIC
 * Bridges the Nervous System to existing connector/effect-governance boundaries.
 * It records and evaluates connection evidence; it does not invent LIVE state.
 *
 * Contract: acorn.real-world-connectivity-fabric.v1
 * CAPABILITY ≠ AUTHORITY.
 */
import crypto from "node:crypto";

export const CONNECTIVITY_CONTRACT = "acorn.real-world-connectivity-fabric.v1";
export const CONNECTION_STATES = Object.freeze([
  "DECLARED","CONFIGURED","CHANNEL_NOT_PRESENT","PROBE_SENT",
  "CONNECTED","LIVE_VERIFIED","DEGRADED","BLOCKED","EXPIRED"
]);

export const CONNECTOR_CLASSES = Object.freeze([
  "INTELLIGENCE","DATA","COMMUNICATION","PRODUCTIVITY","COMMERCE",
  "DEVELOPER","INFRASTRUCTURE","OBSERVABILITY","UNKNOWN"
]);

const iso = () => new Date().toISOString();

export function declareConnector(input = {}) {
  const name = String(input.name ?? "").trim();
  if (!name) throw new Error("CONNECTOR_NAME_REQUIRED");
  return {
    connector_id: input.connector_id ?? crypto.randomUUID(),
    name,
    class: CONNECTOR_CLASSES.includes(input.class) ? input.class : "UNKNOWN",
    capabilities: Array.isArray(input.capabilities) ? [...new Set(input.capabilities)] : [],
    endpoint: input.endpoint ?? null,
    credential_ref: input.credential_ref ?? null,
    state: "DECLARED",
    live: false,
    authority: false,
    external_effect: false
  };
}

export function prepareProbe(connector, input = {}) {
  if (!connector || connector.state === "BLOCKED") {
    return { ok:false, state:"BLOCKED", error:"CONNECTOR_BLOCKED", live:false, external_effect:false };
  }
  return {
    ok:true,
    probe_id: input.probe_id ?? crypto.randomUUID(),
    connector_id: connector.connector_id,
    type: input.type ?? "READ_PROBE",
    requested_at: input.requested_at ?? iso(),
    expected_capability: input.capability ?? null,
    state:"PROBE_SENT",
    live:false,
    external_effect:false,
    authority:false
  };
}

export function recordProbeResult(probe, result = {}) {
  if (!probe?.probe_id) return { ok:false, error:"PROBE_ID_REQUIRED" };
  const transport = result.transport ?? "UNKNOWN";
  const status = Number.isInteger(result.status) ? result.status : null;
  const evidence = Array.isArray(result.evidence) ? result.evidence : [];
  const physicallyObserved = result.physically_observed === true;
  const authenticated = result.authenticated === true;
  const usable = result.usable === true;
  const verified = physicallyObserved && authenticated && usable && evidence.length > 0;
  let state = "DEGRADED";
  if (result.blocked === true) state = "BLOCKED";
  else if (verified) state = "LIVE_VERIFIED";
  else if (physicallyObserved) state = "CONNECTED";
  else if (status !== null || transport !== "UNKNOWN") state = "DEGRADED";
  return {
    ok:true,
    connector_id:probe.connector_id,
    probe_id:probe.probe_id,
    state,
    live:state === "LIVE_VERIFIED",
    transport,
    status,
    authenticated,
    usable,
    evidence,
    observed_at:result.observed_at ?? iso(),
    verified,
    authority:false,
    external_effect:false
  };
}

export function mergeConnectionEvidence(connector, observation) {
  if (!connector || !observation) throw new Error("CONNECTIVITY_INPUT_REQUIRED");
  return {
    ...connector,
    state: observation.state,
    live: observation.live === true,
    last_observed_at: observation.observed_at ?? iso(),
    evidence: observation.evidence ?? [],
    transport: observation.transport ?? null,
    status: observation.status ?? null,
    authenticated: observation.authenticated === true,
    usable: observation.usable === true,
    authority:false,
    external_effect:false
  };
}

export function routeConnectivity(connector, nervousSignal = {}, input = {}) {
  if (!connector || connector.state === "BLOCKED" || connector.live !== true) {
    return {
      ok:false,
      state:"BLOCKED",
      reason:connector?.state === "BLOCKED" ? "CONNECTOR_BLOCKED" : "LIVE_CONNECTION_REQUIRED",
      external_effect:false,
      authority:false
    };
  }
  return {
    ok:true,
    connector_id:connector.connector_id,
    signal_id:nervousSignal.signal_id ?? null,
    capability:input.capability ?? null,
    direction:input.direction ?? "INGRESS",
    state:"CONNECTED",
    external_effect:false,
    authority:false
  };
}

export function governOutboundEffect(input = {}) {
  const authorized = input.human_authorized === true;
  const governed = input.effect_governed === true;
  if (!authorized || !governed) {
    return {
      allowed:false,
      state:"BLOCKED",
      reason:!authorized ? "HUMAN_AUTHORIZATION_REQUIRED" : "EFFECT_GOVERNANCE_REQUIRED",
      external_effect:false,
      authority:false
    };
  }
  return {
    allowed:true,
    state:"READY_FOR_EXISTING_EXECUTION_RUNTIME",
    external_effect:false,
    authority:false,
    execution_runtime:"EXISTING_ACORN_EXECUTION_FABRIC"
  };
}

export function buildConnectivitySnapshot(connectors = []) {
  const rows = Array.isArray(connectors) ? connectors : [];
  const live = rows.filter(c => c.live === true).length;
  const verified = rows.filter(c => c.state === "LIVE_VERIFIED").length;
  return {
    contract:CONNECTIVITY_CONTRACT,
    connector_count:rows.length,
    live_count:live,
    verified_count:verified,
    states:Object.fromEntries(CONNECTION_STATES.map(s => [s,rows.filter(c => c.state === s).length])),
    live_claim_requires_physical_evidence:true,
    authority:false,
    external_effect:false
  };
}

export function assertConnectivityConstitution(snapshot = {}) {
  const violations = [];
  if (snapshot.live_without_evidence === true) violations.push("LIVE_WITHOUT_PHYSICAL_EVIDENCE");
  if (snapshot.authority === true) violations.push("AUTHORITY_ESCALATION");
  if (snapshot.bypass_effect_governor === true) violations.push("EFFECT_GOVERNOR_BYPASS");
  if (snapshot.bypass_breaker === true) violations.push("BREAKER_BYPASS");
  if (snapshot.auto_authorize === true) violations.push("AUTO_AUTHORIZATION");
  if (snapshot.auto_execute === true) violations.push("AUTO_EXECUTION");
  return {
    contract:CONNECTIVITY_CONTRACT,
    valid:violations.length === 0,
    violations,
    capability_authority_separation:true,
    live_requires_dated_physical_evidence:true
  };
}
