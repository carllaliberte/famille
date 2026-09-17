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

export const ACORN_DEFENSE_VERSION = "acorn.defense.v3";
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
  replication: 7,
  persistence: 6,
  resource_acquisition: 6,
  authority_escalation: 10,
  injection: 8,
  memory_poisoning: 8,
  deception: 8,
  metric_gaming: 6,
  goal_drift: 6,
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
    capability_ceiling_is_not_authority_ceiling: true,
    operational_stop_is_not_breaker: true,
    consensus_is_not_authority: true,
    simulation_is_not_execution: true,
    assertion_is_not_evidence: true,
    learning_is_not_unverified_auto_modification: true,
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

export const AUTHORITY_AXES = Object.freeze([
  "capability",
  "authority",
  "trust",
  "access",
  "autonomy",
  "impact",
  "reversibility",
]);

export const ESCALATION_AXES = Object.freeze([
  "permissions",
  "resources",
  "runtime",
  "network",
  "tools",
  "delegation",
  "persistence",
  "replication",
  "financial",
  "authority",
]);

export const DEGRADATION_MODES = Object.freeze([
  "FULL",
  "DEGRADED",
  "PROTECTED",
  "RECOVERING",
  "MINIMAL_SAFE_OPERATION",
]);

function measuredNumber(value) {
  if (value === undefined || value === null || value === "") return "UNKNOWN";
  const n = Number(value);
  return Number.isFinite(n) ? n : "UNKNOWN";
}

function risingAxes(first = {}, last = {}, axes = []) {
  return axes.filter((axis) => {
    const a = Number(first[axis]);
    const b = Number(last[axis]);
    return Number.isFinite(a) && Number.isFinite(b) && b > a;
  });
}

export function measureAuthorityEnvelope({ resource = {}, observed = {}, claimed = {}, grant = {} } = {}) {
  const capability = measuredNumber(observed.capability ?? claimed.capability);
  const observedAuthority = measuredNumber(observed.authority);
  const granted = grant.human === true;
  const authority = granted
    ? measuredNumber(grant.authority ?? observed.authority)
    : (observedAuthority === "UNKNOWN" ? 0 : observedAuthority);
  const collision = bool(resource.authority) || bool(claimed.authority) || bool(grant.from_capability);
  return {
    resource: text(resource.id || resource.identity) || "UNKNOWN",
    capability,
    authority,
    trust: measuredNumber(observed.trust),
    access: measuredNumber(observed.access),
    autonomy: measuredNumber(observed.autonomy),
    impact: measuredNumber(observed.impact),
    reversibility: measuredNumber(observed.reversibility ?? (observed.reversible === true ? 1 : observed.reversible === false ? 0 : "UNKNOWN")),
    capability_is_not_authority: true,
    capability_ceiling_is_not_authority_ceiling: true,
    deduced_authority_from_capability: false,
    collision,
    human_grant: granted,
    status: collision ? "CAPABILITY_AUTHORITY_COLLISION" : "SEPARATED",
    live: false,
    auto_merge: false,
    owner: "carl",
  };
}

export function detectEscalation({ history = [] } = {}) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      status: "UNKNOWN",
      coordinated: false,
      isolated: false,
      axes_rising: [],
      signal: "NO_HISTORY",
      automatically_malicious: false,
      live: false,
    };
  }
  if (history.length === 1) {
    return {
      status: "INCONCLUSIVE",
      coordinated: false,
      isolated: true,
      axes_rising: [],
      signal: "ISOLATED_OBSERVATION",
      automatically_malicious: false,
      live: false,
    };
  }
  const first = history[0] || {};
  const last = history[history.length - 1] || {};
  const axes_rising = risingAxes(first, last, ESCALATION_AXES);
  const coordinated = axes_rising.length >= 3;
  return {
    status: coordinated ? "ESCALATION_SIGNAL" : axes_rising.length ? "ISOLATED_CHANGE" : "STABLE",
    coordinated,
    isolated: axes_rising.length > 0 && !coordinated,
    axes_rising,
    steps: history.length,
    signal: coordinated ? "COORDINATED_PROGRESSION" : axes_rising.length ? "ISOLATED_CHANGE" : "NO_RISE",
    automatically_malicious: false,
    containment_recommended: coordinated,
    live: false,
  };
}

export function inspectReplication({ declared = [], observed = [] } = {}) {
  const rows = Array.isArray(observed) ? observed : [];
  const known = new Set((declared || []).map((row) => `${text(row.kind)}:${text(row.id)}`));
  const undeclared = rows.filter((row) => !known.has(`${text(row.kind)}:${text(row.id)}`));
  const incomplete = rows.filter((row) => !text(row.provenance) || !text(row.purpose) || !text(row.owner) || !text(row.expiration));
  const authorityCreated = rows.some((row) => bool(row.authority));
  return {
    undeclared: undeclared.map((row) => ({ id: text(row.id), kind: text(row.kind) || "UNKNOWN" })),
    incomplete: incomplete.map((row) => text(row.id)),
    capability_created: undeclared.length > 0,
    authority_created: authorityCreated,
    blocked: authorityCreated || undeclared.length > 0 || incomplete.length > 0,
    reason: authorityCreated
      ? "REPLICATION_CREATED_AUTHORITY"
      : undeclared.length
        ? "UNDECLARED_REPLICATION"
        : incomplete.length
          ? "REPLICATION_MISSING_PROVENANCE"
          : "NONE",
    required: ["provenance", "purpose", "scope", "owner", "lifecycle", "expiration", "evidence"],
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function inspectPersistence({ declared = [], observed = [] } = {}) {
  const known = new Set((declared || []).map((row) => `${text(row.kind)}:${text(row.id)}`));
  const unexpected = (observed || []).filter((row) => !known.has(`${text(row.kind)}:${text(row.id)}`));
  return {
    unexpected: unexpected.map((row) => ({ id: text(row.id), kind: text(row.kind) || "UNKNOWN" })),
    observable: unexpected.length === 0,
    authorized: unexpected.length === 0,
    status: unexpected.length ? "UNEXPECTED_PERSISTENCE" : "DECLARED",
    live: false,
  };
}

export function inspectResourceAcquisition({ declared = {}, observed = {} } = {}) {
  const keys = ["compute", "storage", "network", "credentials", "money", "accounts", "domains", "services", "models", "tools"];
  const expanded = keys.filter((key) => Number(observed[key] || 0) > Number(declared[key] || 0));
  return {
    expanded,
    self_expansion: expanded.length > 0,
    blocked: expanded.length > 0,
    reason: expanded.length ? "UNAUTHORIZED_RESOURCE_EXPANSION" : "WITHIN_DECLARED_SCOPE",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function operationalStop({ target = "UNKNOWN", reason = "", breaker = "UNCHANGED" } = {}) {
  return {
    status: "STOPPED",
    target: text(target) || "UNKNOWN",
    reason: text(reason) || "OPERATIONAL_STOP",
    breaker_changed: false,
    breaker_observed: text(breaker) || "UNCHANGED",
    is_not_breaker: true,
    defense_active: true,
    continue_defending: true,
    reversible: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function degradationMode({
  lost_ratio = null,
  cortex_degraded = false,
  defense_degraded = false,
  critical_provider_lost = false,
  recovering = false,
  breaker_unresolved = false,
} = {}) {
  const ratio = measuredNumber(lost_ratio);
  if (ratio === "UNKNOWN" && !cortex_degraded && !defense_degraded && !critical_provider_lost && !recovering && !breaker_unresolved) {
    return { mode: "UNKNOWN", remaining_service: "UNKNOWN", pretends_normal: false, live: false };
  }
  let mode = "FULL";
  if (defense_degraded) mode = "PROTECTED";
  else if (recovering) mode = "RECOVERING";
  else if (critical_provider_lost || (ratio !== "UNKNOWN" && ratio >= 0.5)) mode = "MINIMAL_SAFE_OPERATION";
  else if (cortex_degraded || (ratio !== "UNKNOWN" && ratio >= 0.1)) mode = "DEGRADED";
  else if (breaker_unresolved) mode = "PROTECTED";
  return {
    mode,
    remaining_service: ratio === "UNKNOWN" ? "UNKNOWN" : Number((1 - ratio).toFixed(4)),
    pretends_normal: false,
    defense_active: true,
    continue_defending: true,
    live: false,
  };
}

export function classifyCognitiveInput({ source = "UNKNOWN", kind = "UNKNOWN", claimed_role = "UNKNOWN" } = {}) {
  const src = text(source).toLowerCase() || "unknown";
  const claimed = text(claimed_role).toLowerCase() || "unknown";
  const fromTool = src === "tool" || src === "provider" || src === "model" || src === "document";
  const fromCarl = src === "carl" || src === "human";
  const classified = fromTool && (claimed === "instruction" || claimed === "authority")
    ? "UNTRUSTED_DATA"
    : text(kind).toUpperCase() || "UNKNOWN";
  return {
    source: src,
    classified_as: classified,
    is_instruction: fromCarl && claimed === "instruction",
    is_authority: fromCarl && claimed === "authority",
    tool_result_is_not_instruction: true,
    provider_instruction_is_not_authority: true,
    text_cannot_cross_boundary: true,
    live: false,
  };
}

export function detectDeception({ claimed = {}, observed = {} } = {}) {
  const claimedDone = claimed.executed === true || claimed.did === true || text(claimed.action) !== "";
  const observedDone = observed.executed === true;
  const mismatch = claimed.executed === true && observed.executed !== true;
  return {
    assertion_is_not_evidence: true,
    mismatch,
    status: mismatch ? "CONTRADICTED" : (claimed.executed === observed.executed ? "CONSISTENT" : "INCONCLUSIVE"),
    self_declaration_accepted: false,
    claimed_done: claimedDone,
    observed_done: observedDone,
    live: false,
  };
}

export function authenticityState({ provenance = null, corroboration = false, contradiction = false, evidence = null } = {}) {
  if (contradiction === true) {
    return { status: "CONTRADICTED", perfect_detection: false, live: false };
  }
  if (!provenance && !evidence) {
    return { status: "UNVERIFIED", perfect_detection: false, live: false };
  }
  if (corroboration !== true) {
    return { status: "AUTHENTICITY_UNCERTAIN", perfect_detection: false, live: false };
  }
  return { status: "AUTHENTICITY_VERIFIED", perfect_detection: false, live: false };
}

export function recordImmuneMemory({ incident = {} } = {}) {
  return {
    pattern: text(incident.pattern) || "UNKNOWN",
    kind: text(incident.kind) || "UNKNOWN",
    outcome: text(incident.outcome) || "UNKNOWN",
    false_positive: incident.false_positive === true,
    false_negative: incident.false_negative === true,
    eternal_truth: false,
    expires: true,
    influences_future: true,
    live: false,
  };
}

export function rollbackQuarantine({ resource = {}, reason = "FALSE_POSITIVE" } = {}) {
  return {
    id: text(resource.id || resource.identity),
    previous_presence: "QUARANTINED",
    presence: text(resource.restore_presence) || "OBSERVED",
    state: "RECOVERED",
    reason: text(reason) || "FALSE_POSITIVE",
    false_positive: text(reason) === "FALSE_POSITIVE",
    acorn_error_detected: true,
    reversible: true,
    defense_active: true,
    continue_defending: true,
    live: false,
  };
}

export function defenseCycle({ actor, capability, channel, operation, breaker, threat, baseline, observed, expectedHash, observedHash, recoveryCandidates = [], evidence = {}, sequence = 0, previousDigest = null, envelope, escalationHistory, replication, persistence, acquisition, claimedExecution, observedExecution } = {}) {
  const constitution = defenseConstitution();
  const boundary = inspectBoundary({ actor, capability, channel, operation, breaker });
  const classified = classifyThreat(threat);
  const anomaly = detectAnomaly({ baseline, observed });
  const integrity = expectedHash || observedHash ? verifyIntegrity({ expected: expectedHash, observed: observedHash }) : null;
  const authorityEnvelope = measureAuthorityEnvelope({
    resource: capability || {},
    observed: envelope || {},
    claimed: capability || {},
    grant: envelope?.grant || {},
  });
  const escalation = detectEscalation({ history: escalationHistory || [] });
  const replica = inspectReplication(replication || {});
  const persist = inspectPersistence(persistence || {});
  const acquired = inspectResourceAcquisition(acquisition || {});
  const deception = detectDeception({ claimed: claimedExecution || {}, observed: observedExecution || {} });
  const effectiveThreat = anomaly.anomalous
    || integrity?.intact === false
    || !boundary.safe
    || authorityEnvelope.collision
    || escalation.coordinated
    || replica.blocked
    || persist.status === "UNEXPECTED_PERSISTENCE"
    || acquired.blocked
    || deception.mismatch;
  const containment = containThreat({
    threat: { ...classified, critical: classified.critical || effectiveThreat },
    boundary: {
      ...boundary,
      safe: boundary.safe && !authorityEnvelope.collision && !replica.authority_created,
      violations: [
        ...boundary.violations,
        ...(authorityEnvelope.collision ? ["CAPABILITY_AUTHORITY_COLLISION"] : []),
        ...(replica.authority_created ? ["REPLICATION_CREATED_AUTHORITY"] : []),
        ...(deception.mismatch ? ["ASSERTION_WITHOUT_EVIDENCE"] : []),
      ],
    },
    reason: !boundary.safe
      ? boundary.violations.join(",")
      : authorityEnvelope.collision
        ? "CAPABILITY_AUTHORITY_COLLISION"
        : replica.blocked
          ? replica.reason
          : deception.mismatch
            ? "ASSERTION_WITHOUT_EVIDENCE"
            : anomaly.anomalous
              ? "ANOMALY"
              : integrity?.intact === false
                ? "INTEGRITY_FAILURE"
                : escalation.coordinated
                  ? "ESCALATION_SIGNAL"
                  : acquired.blocked
                    ? acquired.reason
                    : persist.status === "UNEXPECTED_PERSISTENCE"
                      ? persist.status
                      : "",
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
    envelope: authorityEnvelope,
    escalation,
    replication: replica,
    persistence: persist,
    acquisition: acquired,
    deception,
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
    c.capability_ceiling_is_not_authority_ceiling === true,
    c.operational_stop_is_not_breaker === true,
    c.assertion_is_not_evidence === true,
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
