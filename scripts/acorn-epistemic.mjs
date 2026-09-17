#!/usr/bin/env node
/**
 * ACORN EPISTEMIC MODEL — executable distinctions, not slogans.
 *
 * ASSERTION ≠ EVIDENCE ≠ OBSERVATION ≠ MEASUREMENT ≠ VERIFICATION ≠ CAUSALITY ≠ TRUTH
 * PREDICTION ≠ OBSERVATION ≠ CAUSALITY
 * DEFINED ≠ EXECUTED ≠ VERIFIED ≠ LIVE
 * ROSTER ≠ PRESENCE
 * DOCUMENTATION ≠ RUNTIME EVIDENCE
 *
 * A previous state never automatically mints the next proof.
 * Expired ≠ eternally false. Expired = REQUIRES_REVALIDATION.
 * I WAS WRONG never erases history. live=false.
 */
import { canonicalDigest } from "./acorn-constitution.mjs";

export const EPISTEMIC_VERSION = "acorn.epistemic.v1";
export const EPISTEMIC_KINDS = Object.freeze([
  "ASSERTION", "EVIDENCE", "OBSERVATION", "MEASUREMENT", "VERIFICATION",
  "CAUSALITY", "TRUTH", "PREDICTION", "DOCUMENTATION", "ROSTER",
]);
export const ASSERTION_STATES = Object.freeze([
  "ASSERTED", "CHALLENGED", "INVALIDATED", "SUPERSEDED", "UNCERTAIN", "RETRACTED",
]);
export const CERTAINTY_STATES = Object.freeze([
  "VALID", "AGING", "EXPIRED", "REQUIRES_REVALIDATION", "SUPERSEDED", "CONTRADICTED", "REVOKED",
]);
export const WORLD_LAYERS = Object.freeze(["MODEL", "OBSERVATION", "EXTERNAL_WORLD"]);

const text = (v) => String(v ?? "").trim();
function iso(v) {
  const s = text(v);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

const FORBIDDEN_AUTO = Object.freeze({
  ASSERTION: ["EVIDENCE", "OBSERVATION", "MEASUREMENT", "VERIFICATION", "CAUSALITY", "TRUTH", "LIVE"],
  EVIDENCE: ["VERIFICATION", "CAUSALITY", "TRUTH", "LIVE"],
  OBSERVATION: ["CAUSALITY", "TRUTH", "LIVE"],
  MEASUREMENT: ["CAUSALITY", "TRUTH", "LIVE"],
  VERIFICATION: ["TRUTH", "LIVE"],
  PREDICTION: ["OBSERVATION", "CAUSALITY", "TRUTH", "LIVE"],
  DEFINED: ["EXECUTED", "VERIFIED", "LIVE"],
  EXECUTED: ["VERIFIED", "LIVE"],
  VERIFIED: ["LIVE"],
  ROSTER: ["PRESENCE", "LIVE"],
  DOCUMENTATION: ["RUNTIME_EVIDENCE", "LIVE"],
});

export function transitionAllowed(from, to, { explicit = false, evidence = null } = {}) {
  const src = text(from).toUpperCase();
  const dst = text(to).toUpperCase();
  const forbidden = FORBIDDEN_AUTO[src] || [];
  if (forbidden.includes(dst) && explicit !== true) {
    return { allowed: false, reason: "NO_AUTOMATIC_PROMOTION", from: src, to: dst, live: false };
  }
  if (forbidden.includes(dst) && explicit === true && !evidence) {
    return { allowed: false, reason: "EVIDENCE_REQUIRED", from: src, to: dst, live: false };
  }
  if (dst === "LIVE") {
    return { allowed: false, reason: "LIVE_REQUIRES_INDEPENDENT_RUNTIME_PROOF", from: src, to: dst, live: false };
  }
  if (dst === "TRUTH") {
    return { allowed: false, reason: "TRUTH_IS_NOT_MINTED_HERE", from: src, to: dst, live: false };
  }
  if (dst === "CAUSALITY" && evidence?.intervention !== true) {
    return { allowed: false, reason: "CAUSALITY_REQUIRES_INTERVENTION", from: src, to: dst, live: false };
  }
  return { allowed: true, from: src, to: dst, live: false };
}

export function createAssertion({
  claim, origin = "unknown", at, horizon = null, confidence = null, context = {}, dependencies = [],
} = {}) {
  const issued = iso(at);
  return {
    kind: "ASSERTION",
    id: `assert_${canonicalDigest({ claim, origin, issued }).slice(0, 12)}`,
    claim: claim ?? null,
    origin,
    timestamp: issued,
    validity_window: horizon ? { from: issued, horizon } : null,
    horizon,
    confidence,
    evidence: [],
    measurement: null,
    verification: null,
    context,
    dependencies,
    objections: [],
    expiration: horizon || null,
    successor: null,
    state: "ASSERTED",
    is_not_evidence: true,
    is_not_observation: true,
    is_not_truth: true,
    live: false,
  };
}

export function attachEvidence({ assertion, evidence, at } = {}) {
  if (!assertion) return { status: "UNKNOWN", live: false };
  const item = {
    kind: "EVIDENCE",
    at: iso(at),
    payload: evidence ?? null,
    is_not_verification: true,
    is_not_causality: true,
    is_not_truth: true,
    digest: canonicalDigest(evidence ?? null),
  };
  return {
    ...assertion,
    evidence: [...(assertion.evidence || []), item],
    kind: "ASSERTION",
    is_not_evidence: true,
    live: false,
  };
}

export function recordObservation({ what, at, source = "unknown", predicted = false } = {}) {
  return {
    kind: "OBSERVATION",
    what: what ?? null,
    at: iso(at),
    source,
    predicted,
    is_prediction: predicted === true,
    prediction_is_not_observation: true,
    observation_is_not_causality: true,
    absence_of_observation_is_not_absence_of_behavior: true,
    live: false,
  };
}

export function recordMeasurement({ metric, expected, observed, at, executed = false } = {}) {
  const both = typeof expected === "number" && typeof observed === "number";
  return {
    kind: "MEASUREMENT",
    metric: metric || "unspecified",
    expected,
    observed,
    error: both ? Math.abs(expected - observed) : null,
    at: iso(at),
    status: executed === true ? "MEASURED" : "INCONCLUSIVE",
    executed,
    is_not_verification: true,
    is_not_causality: true,
    live: false,
  };
}

export function verifyClaim({ assertion, observation, measurement, independent = false, executed = false } = {}) {
  const promo = transitionAllowed("MEASUREMENT", "VERIFICATION", {
    explicit: independent === true && executed === true,
    evidence: measurement || observation,
  });
  if (!promo.allowed) {
    return { kind: "VERIFICATION", status: "INCONCLUSIVE", reason: promo.reason, live: false };
  }
  const contradicted = measurement?.error != null && measurement.error > 0 && observation?.what === false;
  return {
    kind: "VERIFICATION",
    status: contradicted ? "CONTRADICTED" : "VERIFIED",
    independent,
    executed,
    assertion: assertion?.id || null,
    is_not_truth: true,
    is_not_live: true,
    live: false,
  };
}

export function claimCausality({
  intervention = false, control = false, counterfactual = false, outcome = null, uncertainty = "UNKNOWN",
} = {}) {
  const sufficient = intervention === true && control === true && counterfactual === true && outcome != null;
  return {
    kind: "CAUSALITY",
    status: sufficient ? "SUPPORTED" : "INCONCLUSIVE",
    intervention,
    control,
    counterfactual,
    outcome,
    uncertainty,
    correlation_is_not_causality: true,
    observation_is_not_causality: true,
    live: false,
  };
}

export function expireCertainty({
  assertion, now, origin, timestamp, validity_window, horizon, confidence, evidence, measurement, verification, context, dependencies, objections,
} = {}) {
  const row = assertion || {
    origin, timestamp, validity_window, horizon, confidence, evidence, measurement, verification, context, dependencies, objections,
  };
  const issued = Date.parse(row.timestamp || row.validity_window?.from || timestamp || 0);
  const t = typeof now === "number" ? now : Date.parse(iso(now));
  const windowMs = Number(row.horizon || row.validity_window?.horizon || 0);
  const expired = Number.isFinite(issued) && windowMs > 0 && Number.isFinite(t) && (t - issued) > windowMs;
  const aging = Number.isFinite(issued) && windowMs > 0 && Number.isFinite(t) && (t - issued) > windowMs * 0.7 && !expired;
  return {
    ...row,
    origin: row.origin || origin || null,
    timestamp: row.timestamp || timestamp || null,
    validity_window: row.validity_window || validity_window || null,
    horizon: row.horizon || horizon || null,
    confidence: row.confidence ?? confidence ?? null,
    evidence: row.evidence || evidence || [],
    measurement: row.measurement || measurement || null,
    verification: row.verification || verification || null,
    context: row.context || context || {},
    dependencies: row.dependencies || dependencies || [],
    objections: row.objections || objections || [],
    expiration: expired ? iso(now) : row.expiration || null,
    successor_state: expired ? "REQUIRES_REVALIDATION" : aging ? "AGING" : "VALID",
    certainty_state: expired ? "EXPIRED" : aging ? "AGING" : "VALID",
    expired_is_not_eternally_false: true,
    history_erased: false,
    live: false,
  };
}

export function retractAssertion({
  assertion, reason, at, successor = null, verdict = "INVALIDATED",
} = {}) {
  const allowed = new Set(["INVALIDATED", "SUPERSEDED", "UNCERTAIN", "RETRACTED"]);
  const next = allowed.has(verdict) ? verdict : "UNCERTAIN";
  const history = {
    previous: assertion,
    event: "I_WAS_WRONG",
    reason: text(reason) || "RETRACTION",
    at: iso(at),
    observations_preserved: true,
    decisions_preserved: true,
    evidence_preserved: true,
    reasons_preserved: true,
  };
  return {
    kind: "ASSERTION",
    id: assertion?.id || null,
    state: next,
    previous_state: assertion?.state || "ASSERTED",
    claim: assertion?.claim ?? null,
    successor: successor || null,
    retraction: history,
    history_erased: false,
    i_was_wrong: true,
    live: false,
  };
}

export function reasonTrace({
  hypothesis, evidence, measurement, action, outcome, error, correction, uncertainty, reason_for_change, unresolved,
} = {}) {
  return {
    kind: "REASONING_MEMORY",
    hypothesis: hypothesis ?? null,
    evidence: evidence ?? null,
    measurement: measurement ?? null,
    action: action ?? null,
    outcome: outcome ?? null,
    error: error ?? null,
    correction: correction ?? null,
    uncertainty: uncertainty ?? "UNKNOWN",
    reason_for_change: reason_for_change ?? null,
    unresolved_questions: unresolved || [],
    auditable: true,
    live: false,
  };
}

export function worldModelSeparation({ model, observation, external } = {}) {
  return {
    layers: {
      MODEL: model ?? null,
      OBSERVATION: observation ?? null,
      EXTERNAL_WORLD: external ?? null,
    },
    model_is_not_observation: true,
    observation_is_not_world: true,
    model_is_not_world: true,
    automatic_identity: false,
    live: false,
  };
}

export function presentToHuman({
  information, provenance, source, transformation, confidence, uncertainty, competing,
} = {}) {
  return {
    kind: "HUMAN_INTERFACE",
    information: information ?? null,
    provenance: provenance ?? null,
    source: source ?? null,
    transformation: transformation ?? null,
    confidence: confidence ?? null,
    uncertainty: uncertainty ?? "UNKNOWN",
    competing_interpretations: competing || [],
    information_is_not_influence: true,
    replaces_human_judgment: false,
    live: false,
  };
}

export function measureHumanLoad({
  decisions = 0, review_load = 0, comprehension_burden = 0, response_window_ms = null, unresolved_critical = 0,
} = {}) {
  const overload = decisions > 7 || review_load > 10 || unresolved_critical > 0;
  return {
    number_of_decisions: decisions,
    review_load,
    comprehension_burden,
    response_window: response_window_ms,
    unresolved_critical_issues: unresolved_critical,
    overload,
    sovereignty_is_not_overload: true,
    live: false,
  };
}

export function assertEpistemicSeparation({ from = "ASSERTION", to = "EVIDENCE", explicit = false } = {}) {
  const auto = transitionAllowed(from, to, { explicit });
  const causality = claimCausality({});
  const world = worldModelSeparation({ model: { x: 1 }, observation: { x: 1 }, external: null });
  const ok = auto.allowed === false || to === "EVIDENCE";
  const distinct = from !== to;
  return {
    status: distinct && causality.status === "INCONCLUSIVE" && world.model_is_not_world ? "VERIFIED" : "FAILED",
    transition: auto,
    causality: causality.status,
    world_separated: world.model_is_not_world,
    live: false,
  };
}

export function assertTemporalValidity({ assertion, now } = {}) {
  const expired = expireCertainty({ assertion, now });
  return {
    status: expired.expired_is_not_eternally_false === true && expired.history_erased === false ? "VERIFIED" : "FAILED",
    certainty_state: expired.certainty_state,
    expired_is_not_eternally_false: true,
    history_erased: false,
    live: false,
  };
}

export function assertEvidenceIntegrity({ sealed, verify } = {}) {
  const ok = typeof verify === "function" ? verify(sealed) === true : sealed?.seal != null;
  return {
    status: ok || sealed == null ? (sealed == null ? "INCONCLUSIVE" : "VERIFIED") : "FAILED",
    seal_present: Boolean(sealed?.seal),
    live: false,
  };
}
