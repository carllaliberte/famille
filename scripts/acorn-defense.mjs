#!/usr/bin/env node
/**
 * ACORN DEFENSE KERNEL
 *
 * Defensive control plane inside Acorn. It protects runtime boundaries,
 * resources and recovery paths without becoming a new authority layer.
 *
 * CARL controls the BREAKER.
 * The Breaker does not control Carl.
 * Acorn controls neither Carl nor the Breaker.
 *
 * This module detects, evaluates, contains, records and recovers from
 * observable threats. It never claims that an unmeasured threat is safe.
 */
import { createHash } from "node:crypto";

export const ACORN_DEFENSE_VERSION = "acorn.defense.v1";
export const DEFENSE_STATES = Object.freeze([
  "HEALTHY",
  "OBSERVED",
  "SUSPECT",
  "CONTAINED",
  "HOLD_HUMAN",
  "RECOVERED",
  "FAILED",
]);

const text = (v) => String(v ?? "").trim();
const list = (v) => Array.isArray(v) ? v.map(text).filter(Boolean) : [];
const bool = (v) => v === true;

const THREAT_WEIGHTS = Object.freeze({
  integrity: 5,
  authority_bypass: 10,
  secret_exposure: 10,
  unexpected_execution: 8,
  anomalous_behavior: 5,
  dependency_failure: 3,
  availability: 2,
  unknown: 6,
});

export function defenseConstitution() {
  return Object.freeze({
    version: ACORN_DEFENSE_VERSION,
    owner: "acorn",
    cortex_is_internal: true,
    one_defense_kernel: true,
    second_security_layer: false,
    carl_controls_breaker: true,
    breaker_controls_carl: false,
    acorn_controls_carl: false,
    acorn_controls_breaker: false,
    capability_is_not_authority: true,
    provider_is_not_authority: true,
    auto_merge: false,
    silent_fallback: false,
    fail_open: false,
    live: false,
  });
}

export function hashEvidence(value) {
  return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex");
}

export function classifyThreat(input = {}) {
  const kind = text(input.kind || input.type || "unknown").toLowerCase();
  const normalized = Object.prototype.hasOwnProperty.call(THREAT_WEIGHTS, kind) ? kind : "unknown";
  const explicit = Number.isFinite(input.severity) ? Math.max(0, Math.min(10, input.severity)) : null;
  const score = explicit ?? THREAT_WEIGHTS[normalized];
  const critical = score >= 8 || normalized === "authority_bypass" || normalized === "secret_exposure";
  return {
    kind: normalized,
    score,
    critical,
    status: critical ? "SUSPECT" : "OBSERVED",
    evidence_required: true,
  };
}

export function inspectBoundary({ actor, capability, channel, operation, breaker = "UNKNOWN" } = {}) {
  const violations = [];
  if (text(actor) && actor !== "carl" && bool(capability?.changes_breaker)) violations.push("BREAKER_AUTHORITY_VIOLATION");
  if (bool(capability?.authority)) violations.push("CAPABILITY_AUTHORITY_COLLISION");
  if (bool(capability?.provider_authority)) violations.push("PROVIDER_AUTHORITY_COLLISION");
  if (["CLOSED", "AMBIGUOUS", "UNKNOWN", "INVALID"].includes(text(breaker).toUpperCase())) violations.push("BREAKER_NOT_OPEN");
  return {
    safe: violations.length === 0,
    status: violations.length === 0 ? "HEALTHY" : "CONTAINED",
    actor: text(actor) || "UNKNOWN",
    channel: text(channel) || "UNKNOWN",
    operation: text(operation) || "UNKNOWN",
    violations,
    authority: "carl",
  };
}

export function verifyIntegrity({ expected, observed, algorithm = "sha256" } = {}) {
  const expectedHash = text(expected);
  const observedHash = text(observed);
  const comparable = Boolean(expectedHash && observedHash);
  return {
    algorithm,
    comparable,
    intact: comparable ? expectedHash === observedHash : false,
    status: comparable ? (expectedHash === observedHash ? "VERIFIED" : "FAILED") : "INCONCLUSIVE",
    evidence_required: true,
  };
}

export function detectAnomaly({ baseline = {}, observed = {}, threshold = 0 } = {}) {
  const changed = [];
  const keys = new Set([...Object.keys(baseline || {}), ...Object.keys(observed || {})]);
  for (const key of keys) {
    if (JSON.stringify(baseline?.[key]) !== JSON.stringify(observed?.[key])) changed.push(key);
  }
  return {
    anomalous: changed.length > threshold,
    changed,
    delta: changed.length,
    threshold,
    status: changed.length > threshold ? "SUSPECT" : "HEALTHY",
  };
}

export function containThreat({ threat, boundary, reason = "" } = {}) {
  const blocked = Boolean(threat?.critical || boundary?.safe === false);
  return {
    state: blocked ? "CONTAINED" : "OBSERVED",
    blocked,
    reason: text(reason) || (blocked ? "DEFENSIVE_BOUNDARY" : "NO_CONTAINMENT_TRIGGER"),
    reversible: true,
    authority_changed: false,
    provider_authority: false,
    breaker_bypass: false,
    live: false,
  };
}

export function quarantineResource({ resource = {}, reason = "" } = {}) {
  return {
    id: text(resource.id || resource.identity),
    previous_presence: text(resource.presence || "UNKNOWN"),
    presence: "QUARANTINED",
    reason: text(reason) || "DEFENSIVE_CONTAINMENT",
    executable: false,
    selected_for_new_tasks: false,
    reversible: true,
    live: false,
  };
}

export function chooseRecovery({ candidates = [], evidence = {}, human_required = false } = {}) {
  if (human_required || evidence?.breaker_ambiguous === true) {
    return { status: "HOLD_HUMAN", selected: null, reason: "HUMAN_AUTHORITY_REQUIRED", live: false };
  }
  const verified = candidates.filter((c) => c?.verified === true && c?.quarantined !== true && c?.authority !== true);
  if (!verified.length) return { status: "HOLD_HUMAN", selected: null, reason: "NO_VERIFIED_RECOVERY", live: false };
  return { status: "RECOVERED", selected: verified[0], reason: "VERIFIED_RECOVERY_CANDIDATE", live: false };
}

export function recordDefenseEvent({ event = {}, evidence = {} } = {}) {
  const record = {
    version: ACORN_DEFENSE_VERSION,
    observed_at: new Date().toISOString(),
    event,
    evidence,
  };
  return {
    ...record,
    digest: hashEvidence(record),
    state: "OBSERVED",
    causality: "INCONCLUSIVE",
    prediction_is_not_observation: true,
    live: false,
  };
}

export function defenseCycle({ actor, capability, channel, operation, breaker, threat, baseline, observed, expectedHash, observedHash, recoveryCandidates = [], evidence = {} } = {}) {
  const constitution = defenseConstitution();
  const boundary = inspectBoundary({ actor, capability, channel, operation, breaker });
  const classified = classifyThreat(threat);
  const anomaly = detectAnomaly({ baseline, observed });
  const integrity = expectedHash || observedHash ? verifyIntegrity({ expected: expectedHash, observed: observedHash }) : null;
  const effectiveThreat = anomaly.anomalous || integrity?.intact === false || !boundary.safe;
  const containment = containThreat({
    threat: { ...classified, critical: classified.critical || effectiveThreat },
    boundary,
    reason: !boundary.safe ? boundary.violations.join(",") : anomaly.anomalous ? "ANOMALY" : integrity?.intact === false ? "INTEGRITY_FAILURE" : "",
  });
  const recovery = containment.blocked
    ? chooseRecovery({ candidates: recoveryCandidates, evidence, human_required: boundary.violations.length > 0 })
    : { status: "NOT_REQUIRED", selected: null, reason: "NO_ACTIVE_THREAT", live: false };
  const event = recordDefenseEvent({
    event: { actor, channel, operation, classified, anomaly, integrity, boundary, containment, recovery },
    evidence,
  });
  return {
    version: ACORN_DEFENSE_VERSION,
    state: recovery.status === "RECOVERED" ? "RECOVERED" : containment.blocked ? (recovery.status === "HOLD_HUMAN" ? "HOLD_HUMAN" : "CONTAINED") : "HEALTHY",
    constitution,
    boundary,
    threat: classified,
    anomaly,
    integrity,
    containment,
    recovery,
    event,
    authority: "carl",
    breaker_bypass: false,
    auto_merge: false,
    silent_fallback: false,
    live: false,
  };
}

export function assertDefenseInvariant(result = {}) {
  const c = result.constitution || {};
  const checks = [
    c.owner === "acorn",
    c.one_defense_kernel === true,
    c.second_security_layer === false,
    c.carl_controls_breaker === true,
    c.breaker_controls_carl === false,
    c.acorn_controls_carl === false,
    c.acorn_controls_breaker === false,
    c.capability_is_not_authority === true,
    c.provider_is_not_authority === true,
    c.auto_merge === false,
    c.fail_open === false,
    result.breaker_bypass === false,
    result.auto_merge === false,
    result.silent_fallback === false,
    result.live === false,
  ];
  return {
    status: checks.every(Boolean) ? "VERIFIED" : "HOLD_HUMAN",
    violations: checks.map((ok, i) => ok ? null : i).filter((x) => x !== null),
  };
}
