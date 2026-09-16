#!/usr/bin/env node
/**
 * ACORN CORTEX — REALITY LEARNING ENGINE
 *
 * Prediction is captured before execution and never rewritten.
 * Observation is distinct from causality. Learning never grants authority.
 * CAPABILITY !== AUTHORITY. SELF-EVOLUTION !== SELF-AUTHORIZATION.
 */

export const REALITY_LEARNING_VERSION = "reality-learning.v1";
export const LEARNING_STATES = Object.freeze([
  "DEFINED", "OBSERVED", "MEASURED", "LEARNED", "MEMORIZED",
  "MODEL_REVISED", "INCONCLUSIVE", "REJECTED", "HOLD_HUMAN",
]);

const text = (v) => String(v ?? "").trim();
const clone = (v) => JSON.parse(JSON.stringify(v ?? null));
const stable = (v) => {
  if (v === undefined) return "undefined";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(",")}]`;
  return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(",")}}`;
};
function digest(v) {
  const raw = stable(v); let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}
function iso(v) { return /^\d{4}-\d{2}-\d{2}T/.test(text(v)) ? text(v) : new Date().toISOString(); }

export function createPrediction({ hypothesis, expected, context = {}, modelVersion = 1, at } = {}) {
  if (hypothesis == null || expected === undefined) return { status: "DEFINED", ok: false, reason: "hypothesis and expected outcome are required" };
  return { status: "DEFINED", ok: true, prediction: {
    prediction_id: `rl_pred_${digest({ hypothesis, expected, context, modelVersion, at })}`,
    hypothesis: clone(hypothesis), expected: clone(expected), context: clone(context),
    model_version: Number(modelVersion) || 1, predicted_at: iso(at), rewritten: false, live: false,
  }};
}

export function observeReality({ prediction, actual, context = {}, evidence = [], at } = {}) {
  if (!prediction?.prediction_id) return { status: "OBSERVED", ok: false, reason: "prediction required" };
  return { status: "OBSERVED", ok: true, observation: {
    observation_id: `rl_obs_${digest({ prediction: prediction.prediction_id, actual, context, at })}`,
    prediction_id: prediction.prediction_id, actual: clone(actual), context: clone(context),
    evidence: clone(evidence), observed_at: iso(at), live: false,
  }};
}

export function measurePredictionError({ prediction, observation, metrics = {} } = {}) {
  if (!prediction?.prediction_id || !observation?.observation_id) return { status: "MEASURED", ok: false, reason: "prediction and observation are required" };
  const exact = stable(prediction.expected) === stable(observation.actual);
  const numeric = typeof prediction.expected === "number" && typeof observation.actual === "number";
  const absolute = numeric ? Math.abs(prediction.expected - observation.actual) : (exact ? 0 : 1);
  const relative = numeric && prediction.expected !== 0 ? absolute / Math.abs(prediction.expected) : (exact ? 0 : null);
  return { status: "MEASURED", ok: true, error: {
    prediction_id: prediction.prediction_id, observation_id: observation.observation_id,
    exact, absolute, relative, direction: numeric ? Math.sign(observation.actual - prediction.expected) : null,
    metrics: clone(metrics), prediction_rewritten: prediction.rewritten === true,
    measured_at: new Date().toISOString(), live: false,
  }};
}

export function classifyPredictionError(error = {}) {
  if (!error || error.absolute == null) return { status: "INCONCLUSIVE", class: "UNMEASURED" };
  if (error.absolute === 0) return { status: "MEASURED", class: "NO_ERROR" };
  if (error.relative != null && error.relative <= 0.05) return { status: "MEASURED", class: "SMALL_ERROR" };
  if (error.relative != null && error.relative <= 0.25) return { status: "MEASURED", class: "MODERATE_ERROR" };
  return { status: "MEASURED", class: "LARGE_ERROR" };
}

export function repeatedError(history = [], { predictionKey, minOccurrences = 2 } = {}) {
  const rows = (history || []).filter((r) => !predictionKey || r.prediction_key === predictionKey || r.error?.prediction_id === predictionKey);
  const failures = rows.filter((r) => Number(r.absolute ?? r.error?.absolute ?? 0) > 0);
  return { status: failures.length >= minOccurrences ? "MEASURED" : "INCONCLUSIVE", occurrences: failures.length,
    repeated: failures.length >= minOccurrences, direction: failures.map((r) => r.direction ?? r.error?.direction ?? null) };
}

export function proposeModelRevision({ model = {}, error, history = [], reason, at } = {}) {
  const recurrence = repeatedError(history, { predictionKey: error?.prediction_id });
  if (!error || (!recurrence.repeated && Number(error.absolute || 0) === 0)) return { status: "INCONCLUSIVE", revised: false, reason: "no measured error requiring revision" };
  const nextVersion = Number(model.version || 1) + 1;
  return { status: "PROPOSED", revised: false, recurrence, proposed_at: iso(at), revision: {
    revision_id: `rl_rev_${digest({ model, error, nextVersion, reason })}`,
    from_version: Number(model.version || 1), proposed_version: nextVersion,
    trigger: recurrence.repeated ? "REPEATED_ERROR" : "MEASURED_ERROR", error: clone(error),
    rationale: text(reason) || "revise model after measured prediction error", changes: [],
    requires_verification: true, live: false,
  }};
}

export function applyVerifiedRevision({ model = {}, revision, verification = {} } = {}) {
  if (!revision?.revision_id) return { status: "REJECTED", applied: false, reason: "revision required" };
  if (verification.verified !== true) return { status: "INCONCLUSIVE", applied: false, reason: "revision is not verified" };
  if (verification.regression === true) return { status: "REJECTED", applied: false, reason: "revision regressed measured behavior" };
  return { status: "MODEL_REVISED", applied: true, model: {
    ...clone(model), version: revision.proposed_version, parent_version: Number(model.version || 1),
    revision_id: revision.revision_id, last_learning_at: new Date().toISOString(), live: false,
  }};
}

export function rememberExperience({ prediction, observation, error, verification = {}, context = {}, at } = {}) {
  if (!prediction?.prediction_id || !observation?.observation_id || !error) return { status: "INCONCLUSIVE", ok: false, reason: "complete experience required" };
  return { status: "MEMORIZED", ok: true, memory: {
    memory_id: `rl_mem_${digest({ prediction: prediction.prediction_id, observation: observation.observation_id, error })}`,
    prediction_id: prediction.prediction_id, observation_id: observation.observation_id,
    expected: clone(prediction.expected), actual: clone(observation.actual), error: clone(error),
    verified: verification.verified === true, verification: clone(verification), context: clone(context),
    learning_value: error.absolute === 0 ? "CONFIRMATION" : "CORRECTION_SIGNAL", stored_at: iso(at), live: false,
  }};
}

export function nextPrediction({ model = {}, hypothesis, expected, memory = [], context = {}, at } = {}) {
  const relevant = memory.filter((r) => stable(r.context) === stable(context));
  const corrections = relevant.filter((r) => Number(r.error?.absolute || 0) > 0);
  const base = createPrediction({ hypothesis, expected, context, modelVersion: model.version || 1, at });
  return { status: base.status, prediction: { ...base.prediction, informed_by: relevant.map((r) => r.memory_id),
    correction_signals: corrections.length, learning_applied: corrections.length > 0, live: false } };
}

export function causalAssessment({ observation, intervention, controls = [], alternatives = [] } = {}) {
  if (!intervention) return { status: "INCONCLUSIVE", causal: false, reason: "observation without intervention" };
  if (!controls.length) return { status: "INCONCLUSIVE", causal: false, reason: "missing control" };
  if (alternatives.length) return { status: "INCONCLUSIVE", causal: false, reason: "alternative explanation remains" };
  return { status: "MEASURED", causal: true, evidence: { observation: clone(observation), intervention: clone(intervention), controls: clone(controls) }, live: false };
}

export function learnFromExperience(input = {}) {
  const p = createPrediction(input); if (!p.ok) return p;
  const o = observeReality({ prediction: p.prediction, actual: input.actual, context: input.context, evidence: input.evidence, at: input.observedAt });
  if (!o.ok) return o;
  const e = measurePredictionError({ prediction: p.prediction, observation: o.observation, metrics: input.metrics });
  const c = causalAssessment({ observation: o.observation, intervention: input.intervention, controls: input.controls, alternatives: input.alternatives });
  const m = rememberExperience({ prediction: p.prediction, observation: o.observation, error: e.error, verification: input.verification, context: input.context, at: input.observedAt });
  const r = proposeModelRevision({ model: input.model, error: e.error, history: input.history, reason: input.revisionReason, at: input.observedAt });
  return { status: "LEARNED", prediction: p.prediction, observation: o.observation, error: e.error,
    error_class: classifyPredictionError(e.error), causal: c, memory: m.memory, revision: r,
    learning: { error_to_information: true, repeated_error_to_model_revision: r.status === "PROPOSED",
      observation_to_causality: c.status === "MEASURED" && c.causal === true,
      verified_experience_to_memory: m.memory?.verified === true, live: false },
    live: false, authority: "carl", auto_merge: false };
}

export function assertLearningConstitution(record = {}) {
  if (record.auto_merge === true || record.merge === true) throw new Error("LEARNING_AUTO_MERGE_FORBIDDEN");
  if (record.self_authorization === true) throw new Error("LEARNING_SELF_AUTHORIZATION_FORBIDDEN");
  if (record.live === true) throw new Error("LEARNING_LIVE_FORBIDDEN");
  return { ok: true, capability_is_not_authority: true, self_evolution_is_not_self_authorization: true, predictions_are_immutable: true };
}
