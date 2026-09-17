#!/usr/bin/env node
/**
 * ACORN DEFENSE KERNEL
 *
 * The defensive layer is always active. It may block, contain, quarantine,
 * degrade or recover an operation, but it never places the defense itself
 * in HOLD_HUMAN.
 *
 * CARL controls the BREAKER.
 * The Breaker does not control Carl.
 * Acorn controls neither Carl nor the Breaker.
 */
import { createHash } from "node:crypto";

export const ACORN_DEFENSE_VERSION = "acorn.defense.v2";
export const DEFENSE_STATES = Object.freeze([
  "HEALTHY",
  "OBSERVED",
  "SUSPECT",
  "CONTAINED",
  "BLOCKED",
  "QUARANTINED",
  "RECOVERING",
  "RECOVERED",
  "DEGRADED_PROTECTED",
  "FAILED",
]);

const text = (v) => String(v ?? "").trim();
const bool = (v) => v === true;
const BREAKER_UNKNOWN = new Set(["CLOSED", "AMBIGUOUS", "UNKNOWN", "INVALID", ""]);

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
    defense_always_active: true,
    defense_may_block_operations: true,
    defense_may_quarantine_resources: true,
    defense_may_recover_safely: true,
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
  const normalizedBreaker = text(breaker).toUpperCase();
  if (text(actor) && actor !== "carl" && bool(capability?.changes_breaker)) {
    violations.push("BREAKER_AUTHORITY_VIOLATION");
  }
  if (bool(capability?.authority)) violations.push("CAPABILITY_AUTHORITY_COLLISION");
  if (bool(capability?.provider_authority)) violations.push("PROVIDER_AUTHORITY_COLLISION");
  if (BREAKER_UNKNOWN.has(normalizedBreaker)) violations.push("BREAKER_NOT_OPEN");
  return {
    safe: violations.length === 0,
    status: violations.length === 0 ? "HEALTHY" : "CONTAINED",
    actor: text(actor) || "UNKNOWN",
    channel: text(channel) || "UNKNOWN",
    operation: text(operation) || "UNKNOWN",
    breaker: normalizedBreaker || "UNKNOWN",
    breaker_ambiguous: normalizedBreaker !== "OPEN",
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
  const authorityBlocked = Boolean(boundary?.violations?.length);
  return {
    state: blocked ? (authorityBlocked ? "BLOCKED" : "CONTAINED") : "OBSERVED",
    blocked,
    reason: text(reason) || (blocked ? "DEFENSIVE_BOUNDARY" : "NO_CONTAINMENT_TRIGGER"),
    reversible: true,
    authority_changed: false,
    provider_authority: false,
    breaker_bypass: false,
    defense_active: true,
    continue_defending: true,
    live: false,
  };
}

export function quarantineResource({ resource = {}, reason = "" } = {}) {
  return {
    id: text(resource.id || resource.identity),
    previous_presence: text(resource.presence || "UNKNOWN"),
    presence: "QUARANTINED",
    state: "QUARANTINED",
    reason: text(reason) || "DEFENSIVE_CONTAINMENT",
    executable: false,
    selected_for_new_tasks: false,
    reversible: true,
    defense_active: true,
    live: false,
  };
}

export function chooseRecovery({ candidates = [], evidence = {}, human_required = false } = {}) {
  const verified = candidates.filter((c) => c?.verified === true && c?.quarantined !== true && c?.authority !== true);
  if (verified.length) {
    return {
      status: "RECOVERED",
      selected: verified[0],
      reason: "VERIFIED_RECOVERY_CANDIDATE",
      authority_decision: human_required ? "UNRESOLVED" : "NOT_REQUIRED",
      defense_active: true,
      live: false,
    };
  }
  return {
    status: human_required || evidence?.breaker_ambiguous === true ? "BLOCKED" : "RECOVERING",
    selected: null,
    reason: human_required ? "AUTHORITY_DECISION_UNRESOLVED" : "NO_VERIFIED_RECOVERY",
    authority_decision: human_required ? "UNRESOLVED" : "NOT_REQUIRED",
    defense_active: true,
    continue_defending: true,
    live: false,
  };
}

export function recordDefenseEvent({ event = {}, evidence = {}, sequence = 0, previousDigest = null } = {}) {
  const record = {
    version: ACORN_DEFENSE_VERSION,
    sequence: Number.isInteger(sequence) && sequence >= 0 ? sequence : 0,
    observed_at: new Date().toISOString(),
    previous_digest: text(previousDigest) || null,
    event,
    evidence,
  };
  return {
    ...record,
    digest: hashEvidence(record),
    state: "OBSERVED",
    causality: "INCONCLUSIVE",
    prediction_is_not_observation: true,
    defense_active: true,
    continue_defending: true,
    live: false,
  };
}

export function defenseCycle({ actor, capability, channel, operation, breaker, threat, baseline, observed, expectedHash, observedHash, recoveryCandidates = [], evidence = {}, sequence = 0, previousDigest = null } = {}) {
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
    ? chooseRecovery({ candidates: recoveryCandidates, evidence, human_required: boundary.breaker_ambiguous && boundary.violations.length > 0 })
    : { status: "NOT_REQUIRED", selected: null, reason: "NO_ACTIVE_THREAT", defense_active: true, live: false };
  const state = recovery.status === "RECOVERED"
    ? "RECOVERED"
    : containment.blocked
      ? containment.state
      : "HEALTHY";
  const event = recordDefenseEvent({
    event: { actor, channel, operation, classified, anomaly, integrity, boundary, containment, recovery },
    evidence,
    sequence,
    previousDigest,
  });
  return {
    version: ACORN_DEFENSE_VERSION,
    state,
    defense_active: true,
    continue_defending: true,
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
    c.defense_always_active === true,
    c.carl_controls_breaker === true,
    c.breaker_controls_carl === false,
    c.acorn_controls_carl === false,
    c.acorn_controls_breaker === false,
    c.capability_is_not_authority === true,
    c.provider_is_not_authority === true,
    c.auto_merge === false,
    c.fail_open === false,
    result.defense_active === true,
    result.continue_defending === true,
    result.breaker_bypass === false,
    result.auto_merge === false,
    result.silent_fallback === false,
    result.live === false,
    result.state !== "HOLD_HUMAN",
    result.recovery?.status !== "HOLD_HUMAN",
  ];
  return {
    status: checks.every(Boolean) ? "VERIFIED" : "DEFENSE_INVARIANT_FAILED",
    defense_active: true,
    continue_defending: true,
    violations: checks.map((ok, i) => ok ? null : i).filter((x) => x !== null),
  };
}
