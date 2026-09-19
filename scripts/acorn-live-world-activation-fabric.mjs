/**
 * ACORN LIVE-WORLD ACTIVATION FABRIC
 * Activates measured connector observations through the existing
 * Real-World Connectivity Fabric + Nervous System + World Model.
 * It does not create credentials, execute effects, or invent LIVE state.
 *
 * Contract: acorn.live-world-activation-fabric.v1
 * CAPABILITY ≠ AUTHORITY.
 */
import crypto from "node:crypto";

export const ACTIVATION_CONTRACT = "acorn.live-world-activation-fabric.v1";
export const ACTIVATION_STATES = Object.freeze([
  "UNOBSERVED","OBSERVED","CONNECTED","LIVE_VERIFIED","DEGRADED","BLOCKED","EXPIRED"
]);

const iso = () => new Date().toISOString();

export function createActivationRequest(input = {}) {
  const connector_id = String(input.connector_id ?? "").trim();
  if (!connector_id) throw new Error("CONNECTOR_ID_REQUIRED");
  return {
    activation_id: input.activation_id ?? crypto.randomUUID(),
    connector_id,
    capability: input.capability ?? null,
    direction: input.direction ?? "INGRESS",
    requested_at: input.requested_at ?? iso(),
    state: "UNOBSERVED",
    human_authorized: false,
    authority: false,
    external_effect: false
  };
}

export function recordActivationObservation(request, observation = {}) {
  if (!request?.activation_id) return { ok:false, error:"ACTIVATION_ID_REQUIRED" };
  const evidence = Array.isArray(observation.evidence) ? observation.evidence : [];
  const physically_observed = observation.physically_observed === true;
  const authenticated = observation.authenticated === true;
  const usable = observation.usable === true;
  const verified = physically_observed && authenticated && usable && evidence.length > 0;
  let state = "DEGRADED";
  if (observation.blocked === true) state = "BLOCKED";
  else if (verified) state = "LIVE_VERIFIED";
  else if (physically_observed) state = "CONNECTED";
  else if (observation.observed === true) state = "OBSERVED";
  return {
    ok:true,
    activation_id:request.activation_id,
    connector_id:request.connector_id,
    capability:request.capability,
    direction:request.direction,
    state,
    live:state === "LIVE_VERIFIED",
    verified,
    physically_observed,
    authenticated,
    usable,
    evidence,
    source: observation.source ?? null,
    observed_at: observation.observed_at ?? iso(),
    freshness_expires_at: observation.freshness_expires_at ?? null,
    authority:false,
    external_effect:false
  };
}

export function buildWorldSignal(observation, input = {}) {
  if (!observation?.activation_id) throw new Error("OBSERVATION_REQUIRED");
  return {
    signal_id: input.signal_id ?? crypto.randomUUID(),
    type: input.type ?? "CONNECTOR_OBSERVATION",
    connector_id: observation.connector_id,
    capability: observation.capability,
    source: observation.source,
    observed_at: observation.observed_at,
    freshness_expires_at: observation.freshness_expires_at,
    state: observation.state,
    live: observation.live === true,
    evidence: observation.evidence,
    provenance: {
      activation_id: observation.activation_id,
      physically_observed: observation.physically_observed,
      authenticated: observation.authenticated,
      usable: observation.usable
    },
    authority:false,
    external_effect:false
  };
}

export function routeActivation(observation, { connectivity = null, nervous = null } = {}) {
  if (!observation?.live) {
    return { ok:false, state:"BLOCKED", reason:"LIVE_VERIFICATION_REQUIRED", routed:false, authority:false, external_effect:false };
  }
  if (connectivity?.live !== true || connectivity?.state !== "LIVE_VERIFIED") {
    return { ok:false, state:"BLOCKED", reason:"CONNECTIVITY_FABRIC_NOT_LIVE_VERIFIED", routed:false, authority:false, external_effect:false };
  }
  return {
    ok:true,
    state:"CONNECTED",
    routed:true,
    connector_id:observation.connector_id,
    signal_id:nervous?.signal_id ?? null,
    authority:false,
    external_effect:false
  };
}

export function buildActivationSnapshot(observations = []) {
  const rows = Array.isArray(observations) ? observations : [];
  const live = rows.filter(x => x.state === "LIVE_VERIFIED" && x.live === true).length;
  const gaps = rows.filter(x => x.state !== "LIVE_VERIFIED").map(x => ({ connector_id:x.connector_id, state:x.state, capability:x.capability }));
  return {
    contract:ACTIVATION_CONTRACT,
    observation_count:rows.length,
    live_verified_count:live,
    gaps,
    reality_rule:"LIVE_VERIFIED requires physical observation + authentication + usability + dated evidence",
    authority:false,
    external_effect:false
  };
}

export function assertActivationConstitution(snapshot = {}) {
  const violations = [];
  if (snapshot.live_without_evidence === true) violations.push("LIVE_WITHOUT_EVIDENCE");
  if (snapshot.auto_authorize === true) violations.push("AUTO_AUTHORIZATION");
  if (snapshot.auto_execute === true) violations.push("AUTO_EXECUTION");
  if (snapshot.bypass_connectivity === true) violations.push("CONNECTIVITY_BYPASS");
  if (snapshot.bypass_nervous_system === true) violations.push("NERVOUS_SYSTEM_BYPASS");
  if (snapshot.authority === true) violations.push("AUTHORITY_ESCALATION");
  return { contract:ACTIVATION_CONTRACT, valid:violations.length === 0, violations, capability_authority_separation:true };
}
