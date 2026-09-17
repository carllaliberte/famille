#!/usr/bin/env node
/**
 * ACORN SELF-CORRECTION LOOP
 *
 * One bounded corrective loop for the existing ACORN organism.
 *
 * OBSERVE -> CLASSIFY -> DIAGNOSE -> FIND_ALTERNATIVES -> PLAN_REPAIR
 * -> GATE -> APPLY (only through an explicitly supplied safe handler)
 * -> TEST -> MEASURE -> VERIFY -> RETAIN / REJECT / QUARANTINE
 * -> CHECKPOINT -> CONTINUE
 *
 * This module does not create authority, merge code, alter the constitution,
 * bypass the Breaker, erase history, or claim LIVE from internal state.
 *
 * The important invariant is continuity: a local failure is a state transition,
 * not a reason to abandon the whole execution graph.
 */
export const SELF_CORRECTION_VERSION = "acorn.self-correction.v1";

export const CORRECTION_STATES = Object.freeze([
  "OBSERVED",
  "CLASSIFIED",
  "DIAGNOSED",
  "ALTERNATIVES_FOUND",
  "REPAIR_PLANNED",
  "BLOCKED",
  "APPLIED",
  "TESTED",
  "MEASURED",
  "VERIFIED",
  "RETAINED",
  "REJECTED",
  "QUARANTINED",
  "WAITING_ON_HUMAN",
  "CONTINUE",
]);

export const FAILURE_CLASSES = Object.freeze([
  "CODE",
  "TEST",
  "DEPENDENCY",
  "CONNECTOR",
  "MODEL",
  "RESOURCE",
  "CONFIGURATION",
  "DRIFT",
  "INTEGRATION",
  "PERFORMANCE",
  "EVIDENCE",
  "UNKNOWN",
  "HUMAN_AUTHORITY",
  "BREAKER",
]);

const HUMAN_GATED = new Set(["HUMAN_AUTHORITY", "BREAKER"]);
const DESTRUCTIVE_OPERATIONS = new Set([
  "merge",
  "production_write",
  "constitutional_change",
  "authority_change",
  "breaker_bypass",
  "history_delete",
  "secret_change",
  "irreversible_action",
]);

const text = (value, fallback = "") => {
  const v = String(value ?? "").trim();
  return v || fallback;
};

const list = (value) => Array.isArray(value) ? value.filter(Boolean) : [];

const finite = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

function stable(value) {
  return JSON.stringify(value, Object.keys(value || {}).sort());
}

export function classifyFailure(observation = {}) {
  if (observation.humanRequired === true) return "HUMAN_AUTHORITY";
  if (observation.breakerBlocked === true) return "BREAKER";
  const explicit = text(observation.class).toUpperCase();
  if (FAILURE_CLASSES.includes(explicit)) return explicit;

  const signal = `${text(observation.kind)} ${text(observation.reason)} ${text(observation.error)}`.toLowerCase();
  if (/test|assert|fixture|spec/.test(signal)) return "TEST";
  if (/depend|module|package|import|api/.test(signal)) return "DEPENDENCY";
  if (/connect|channel|network|timeout/.test(signal)) return "CONNECTOR";
  if (/model|provider|429|503|inference/.test(signal)) return "MODEL";
  if (/gpu|cpu|memory|quota|capacity|resource/.test(signal)) return "RESOURCE";
  if (/config|env|setting/.test(signal)) return "CONFIGURATION";
  if (/drift|stale|expired/.test(signal)) return "DRIFT";
  if (/integrat|wiring|route/.test(signal)) return "INTEGRATION";
  if (/latency|slow|performance|throughput/.test(signal)) return "PERFORMANCE";
  if (/evidence|proof|verify|verification/.test(signal)) return "EVIDENCE";
  if (/code|syntax|exception|runtime|throw/.test(signal)) return "CODE";
  return "UNKNOWN";
}

export function diagnoseFailure(observation = {}, context = {}) {
  const classification = classifyFailure(observation);
  const evidence = list(observation.evidence);
  const symptoms = list(observation.symptoms);
  const causes = list(observation.possibleCauses);

  const defaultCauses = {
    CODE: ["implementation defect", "contract mismatch"],
    TEST: ["assertion mismatch", "test fixture or contract drift"],
    DEPENDENCY: ["dependency unavailable", "version/interface mismatch"],
    CONNECTOR: ["channel unavailable", "transport or authentication failure"],
    MODEL: ["model unavailable", "provider capacity or compatibility failure"],
    RESOURCE: ["capacity/quota limitation", "resource allocation mismatch"],
    CONFIGURATION: ["invalid or missing configuration", "environment drift"],
    DRIFT: ["state diverged from verified baseline", "stale evidence"],
    INTEGRATION: ["component exists but is not correctly wired", "interface mismatch"],
    PERFORMANCE: ["execution cost too high", "resource contention or inefficient path"],
    EVIDENCE: ["observation is insufficient", "verification chain incomplete"],
    UNKNOWN: ["cause not yet established"],
    HUMAN_AUTHORITY: ["operation requires human authorization"],
    BREAKER: ["safety boundary is closed or ambiguous"],
  };

  return {
    status: "DIAGNOSED",
    failure_class: classification,
    subject: text(observation.subject, "UNKNOWN"),
    symptoms,
    causes: causes.length ? causes : defaultCauses[classification],
    evidence_count: evidence.length,
    context_keys: Object.keys(context || {}).sort(),
    confidence: evidence.length ? Math.min(1, 0.25 + evidence.length * 0.15) : 0,
    causal_status: causes.length && evidence.length ? "CANDIDATE_CAUSE" : "UNCONFIRMED",
    authority_changed: false,
    live: false,
  };
}

function compatible(candidate, diagnosis) {
  if (!candidate || candidate.quarantined === true || candidate.revoked === true) return false;
  if (candidate.authority === true) return false;
  const classes = list(candidate.failure_classes || candidate.handles).map((x) => text(x).toUpperCase());
  return !classes.length || classes.includes(diagnosis.failure_class) || classes.includes("ANY");
}

export function findAlternatives({ diagnosis, candidates = [], current = null } = {}) {
  const rows = candidates
    .filter((candidate) => candidate.id && candidate.id !== current?.id)
    .filter((candidate) => compatible(candidate, diagnosis))
    .map((candidate, index) => ({
      id: text(candidate.id),
      kind: text(candidate.kind, "UNKNOWN"),
      compatibility: finite(candidate.compatibility, 0),
      reliability: finite(candidate.reliability, 0),
      cost: Math.max(0.05, finite(candidate.cost, 1)),
      reversible: candidate.reversible !== false,
      verified: candidate.verified === true,
      quarantined: candidate.quarantined === true,
      authority: false,
      rank: index,
    }));

  rows.sort((a, b) => {
    const av = (a.compatibility * 3 + a.reliability * 2 + (a.verified ? 1 : 0) + (a.reversible ? 1 : 0)) / a.cost;
    const bv = (b.compatibility * 3 + b.reliability * 2 + (b.verified ? 1 : 0) + (b.reversible ? 1 : 0)) / b.cost;
    return bv - av || a.rank - b.rank;
  });

  return {
    status: rows.length ? "ALTERNATIVES_FOUND" : "NO_ALTERNATIVE",
    candidates: rows,
    count: rows.length,
    no_silent_fallback: true,
    live: false,
  };
}

export function planRepair({ observation = {}, diagnosis = {}, alternatives = {}, constraints = {} } = {}) {
  const cls = diagnosis.failure_class || classifyFailure(observation);
  const subject = text(observation.subject, "UNKNOWN");
  const destructive = text(observation.operation).toLowerCase();
  const human = HUMAN_GATED.has(cls) || DESTRUCTIVE_OPERATIONS.has(destructive) || constraints.humanRequired === true;
  const alternative = alternatives.candidates?.[0] || null;

  if (human) {
    return {
      status: "WAITING_ON_HUMAN",
      subject,
      failure_class: cls,
      action: "REQUEST_HUMAN_AUTHORITY",
      reversible: false,
      alternative,
      authority_required: true,
      auto_apply: false,
      reason: "HUMAN_OR_SAFETY_AUTHORITY_REQUIRED",
      live: false,
    };
  }

  if (!alternative && constraints.requireAlternative === true) {
    return {
      status: "BLOCKED",
      subject,
      failure_class: cls,
      action: "DISCOVER_MORE_CAPABILITIES",
      reversible: true,
      authority_required: false,
      auto_apply: false,
      reason: "NO_VERIFIED_ALTERNATIVE",
      live: false,
    };
  }

  return {
    status: "REPAIR_PLANNED",
    subject,
    failure_class: cls,
    action: alternative ? "SWITCH_OR_REPAIR_BOUNDED_PATH" : "RETRY_BOUNDED_PATH",
    target: alternative?.id || subject,
    alternative,
    reversible: true,
    authority_required: false,
    auto_apply: true,
    max_attempts: Math.max(1, Math.min(3, Math.trunc(finite(constraints.maxAttempts, 1)))),
    reason: alternative ? "ALTERNATIVE_SELECTED" : "BOUNDED_RETRY_ALLOWED",
    live: false,
  };
}

/**
 * Apply is deliberately inert unless the caller supplies an explicit handler.
 * This prevents the correction engine from becoming an arbitrary code executor.
 */
export async function applyRepair({ plan, handlers = {} } = {}) {
  if (!plan || plan.status !== "REPAIR_PLANNED" || plan.auto_apply !== true) {
    return { status: plan?.status || "BLOCKED", applied: false, authority_changed: false, live: false };
  }
  const handler = handlers[plan.failure_class] || handlers.DEFAULT;
  if (typeof handler !== "function") {
    return {
      status: "BLOCKED",
      applied: false,
      reason: "NO_EXPLICIT_SAFE_HANDLER",
      authority_changed: false,
      live: false,
    };
  }
  const result = await handler(plan);
  return {
    ...result,
    status: result?.applied === true ? "APPLIED" : "REJECTED",
    applied: result?.applied === true,
    authority_changed: false,
    live: false,
  };
}

export function verifyRepair({ before = {}, after = {}, tests = {}, measurements = {}, evidence = {} } = {}) {
  const testsPassed = tests.passed === true;
  const measurementPresent = measurements.present === true;
  const evidenceVerified = evidence.verified === true;
  const changed = stable(before) !== stable(after);
  const verified = testsPassed && measurementPresent && evidenceVerified;

  return {
    status: verified ? "VERIFIED" : "REJECTED",
    verified,
    changed,
    tests_passed: testsPassed,
    measurement_present: measurementPresent,
    evidence_verified: evidenceVerified,
    regression: tests.regression === true,
    retain: verified && tests.regression !== true,
    quarantine: tests.regression === true || (testsPassed && evidenceVerified && !measurementPresent),
    authority_changed: false,
    live: false,
  };
}

export function checkpoint({ state = {}, transition = {}, evidence = {} } = {}) {
  const next = {
    version: SELF_CORRECTION_VERSION,
    sequence: Math.max(0, Math.trunc(finite(state.sequence, 0))) + 1,
    subject: text(state.subject || transition.subject, "UNKNOWN"),
    previous_state: text(state.status, "UNKNOWN"),
    status: text(transition.status, "UNKNOWN"),
    history_preserved: true,
    evidence_attached: Object.keys(evidence || {}).length > 0,
    authority: "carl",
    auto_merge: false,
    live: false,
  };
  return {
    ...next,
    digest: stable(next),
  };
}

export async function selfCorrect({ observation = {}, context = {}, candidates = [], handlers = {}, tests = {}, measurements = {}, evidence = {}, state = {} } = {}) {
  const classified = classifyFailure(observation);
  const diagnosis = diagnoseFailure(observation, context);
  const alternatives = findAlternatives({
    diagnosis,
    candidates,
    current: observation.current,
  });
  const plan = planRepair({ observation, diagnosis, alternatives, constraints: observation.constraints || {} });
  const applied = await applyRepair({ plan, handlers });
  const verification = applied.applied
    ? verifyRepair({ before: observation.before, after: applied.after, tests, measurements, evidence })
    : { status: "NOT_APPLIED", verified: false, authority_changed: false, live: false };

  let finalStatus = verification.verified ? "RETAINED" : applied.applied ? "REJECTED" : plan.status;
  if (verification.quarantine) finalStatus = "QUARANTINED";

  const next = checkpoint({
    state: { ...state, subject: observation.subject },
    transition: { ...plan, status: finalStatus },
    evidence: {
      observation: classified,
      diagnosis,
      alternatives,
      applied,
      verification,
    },
  });

  return {
    version: SELF_CORRECTION_VERSION,
    status: finalStatus,
    observation: classified,
    diagnosis,
    alternatives,
    plan,
    applied,
    verification,
    checkpoint: next,
    continue: finalStatus !== "WAITING_ON_HUMAN" && finalStatus !== "BLOCKED",
    authority: "carl",
    auto_merge: false,
    live: false,
  };
}
