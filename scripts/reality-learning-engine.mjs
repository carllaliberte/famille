#!/usr/bin/env node
/**
 * ACORN CORTEX — REALITY LEARNING ENGINE
 *
 * Turns measured experience into bounded cognitive learning.
 * This module never grants authority, never mints LIVE, and never rewrites
 * predictions after observation. Learning is a measured state transition,
 * not a claim that the model became "smarter".
 *
 * CORE LOOP:
 * prediction -> action -> observation -> error -> learning -> memory
 * -> model revision -> next prediction
 *
 * CAPABILITY !== AUTHORITY
 * PREDICTION !== OBSERVATION
 * OBSERVATION !== CAUSALITY
 * SIMULATION !== REALITY
 */

export const REALITY_LEARNING_VERSION = "reality-learning.v1";

export const LEARNING_STATES = Object.freeze([
  "DEFINED",
  "OBSERVED",
  "MEASURED",
  "LEARNED",
  "MEMORIZED",
  "MODEL_REVISED",
  "INCONCLUSIVE",
  "REJECTED",
  "HOLD_HUMAN",
]);

const text = (value) => String(value ?? "").trim();

function iso(value) {
  const s = text(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function stable(value) {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",`)}}`;
}

function digest(value) {
  const raw = stable(value);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

const clone = (value) => JSON.parse(JSON.stringify(value ?? null));

export function createPrediction({ hypothesis, expected, context = {}, modelVersion = 1, at } = {}) {
  if (hypothesis == null || expected === undefined) {
    return { status: "DEFINED", ok: false, reason: "hypothesis and expected outcome are required" };
  }
  const prediction = {
    prediction_id: `rl_pred_${digest({ hypothesis, expected, context, modelVersion, at })}`,
    hypothesis: clone(hypothesis),
    expected: clone(expected),
    context: clone(context),
    model_version: Number(modelVersion) || 1,
    predicted_at: iso(at),
    rewritten: false,
    live: false,
  };
  return { status: "DEFINED", ok: true, prediction };
}

export function observeReality({ prediction, actual, context = {}, evidence = [], at } = {}) {
  if (!prediction?.prediction_id) {
    return { status: "OBSERVED", ok: false, reason: "prediction required" };
  }
  const observation = {
    observation_id: `rl_obs_${digest({ prediction: prediction.prediction_id, actual, context, at })}`,
    prediction_id: prediction.prediction_id,
    actual: clone(actual),
    context: clone(context),
    evidence: clone(evidence),
    observed_at: iso(at),
    live: false,
  };
  return { status: "OBSERVED", ok: true, observation };
}

export function measurePredictionError({ prediction, observation, metrics = {} } = {}) {
  if (!prediction?.prediction_id || !observation?.observation_id) {
    return { status: "MEASURED", ok: false, reason: "prediction and observation are required" };
  }
  const exact = stable(prediction.expected) === stable(observation.actual);
  const numeric = typeof prediction.expected === "number" && typeof observation.actual === "number";
  const absoluteError = numeric ? Math.abs(prediction.expected - observation.actual) : (exact ? 0 : 1);
  const relativeError = numeric && prediction.expected !== 0
    ? absoluteError / Math.abs(prediction.expected)
    : (exact ? 0 : null);
  return {
    status: "MEASURED",
    ok: true,
    error: {
      prediction_id: prediction.prediction_id,
      observation_id: observation.observation_id,
      exact,
      absolute: absoluteError,
      relative: relativeError,
      direction: numeric ? Math.sign(observation.actual - prediction.expected) : null,
      metrics: clone(metrics),
      prediction_rewritten: prediction.rewritten === true,
      measured_at: new Date().toISOString(),
      live: false,
    },
  };
}

export function classifyPredictionError(error = {}) {
  if (!error || error.absolute == null) return { status: "INCONCLUSIVE", class: "UNMEASURED" };
  if (error.exact === true || error.absolute === 0) return { status: "MEASURED", class: "NO_ERROR" };
  if (error.relative != null && error.relative <= 0.05) return { status: "MEASURED", class: "SMALL_ERROR" };
  if (error.relative != null && error.relative <= 0.25) return { status: "MEASURED", class: "MODERATE_ERROR" };
  return { status: "MEASURED", class: "LARGE_ERROR" };
}

export function repeatedError(history = [], { predictionKey, minOccurrences = 2 } = {}) {
  const rows = (history || []).filter((row) => !predictionKey || row.prediction_key === predictionKey);
  const failures = rows.filter((row) => Number(row.absolute ?? row.error?.absolute ?? 0) > 0);
  return {
    status: failures.length >= minOccurrences ? "MEASURED" : "INCONCLUSIVE",
    occurrences: failures.length,
    repeated: failures.length >= minOccurrences,
    direction: failures.map((row) => row.direction ?? row.error?.direction ?? null),
  };
}

export function proposeModelRevision({ model = {}, error, history = [], reason, at } = {}) {
  const recurrence = repeatedError(history, { predictionKey: error?.prediction_id, minOccurrences: 2 });
  const shouldRevise = recurrence.repeated || Number(error?.absolute || 0) > 0;
  if (!shouldRevise) {
    return { status: "INCONCLUSIVE", revised: false, reason: "no measured error requiring revision" };
  }
  const nextVersion = Number(model.version || 1) + 1;
  return {
    status: "PROPOSED",
    revised: false,
    revision: {
      revision_id: `rl_rev_${digest({ model, error, nextVersion, reason })}`,
      from_version: Number(model.version || 1),
      proposed_version: nextVersion,
      trigger: recurrence.repeated ? "REPEATED_ERROR" : "MEASURED_ERROR",
      error: clone(error),
      rationale: text(reason) || "revise model after measured prediction error",
      changes: [],
      requires_verification: true,
      live: false,
    },
    recurrence,
    proposed_at: iso(at),
  };
}

export function applyVerifiedRevision({ model = {}, revision, verification = {} } = {}) {
  if (!revision?.revision_id) return { status: "REJECTED", applied: false, reason: "revision required" };
  if (verification.verified !== true) {
    return { status: "INCONCLUSIVE", applied: false, reason: "revision is not verified" };
  }
  if (verification.regression === true) {
    return { status: "REJECTED", applied: false, reason: "revision regressed measured behavior" };
  }
  const next = {
    ...clone(model),
    version: revision.proposed_version,
    parent_version: Number(model.version || 1),
    revision_id: revision.revision_id,
    last_learning_at: new Date().toISOString(),
    live: false,
  };
  return { status: "MODEL_REVISED", applied: true, model: next, live: false };
}

export function rememberExperience({ prediction, observation, error, verification = {}, context = {}, at } = {}) {
  if (!prediction?.prediction_id || !observation?.observation_id || !error) {
    return { status: "INCONCLUSIVE", ok: false, reason: "complete experience required" };
  }
  const verified = verification.verified === true;
  return {
    status: "MEMORIZED",
    ok: true,
    memory: {
      memory_id: `rl_mem_${digest({ prediction: prediction.prediction_id, observation: observation.observation_id, error })}`,
      prediction_id: prediction.prediction_id,
      observation_id: observation.observation_id,
      expected: clone(prediction.expected),
      actual: clone(observation.actual),
      error: clone(error),
      verified,
      verification: clone(verification),
      context: clone(context),
      learning_value: error.absolute === 0 ? "CONFIRMATION" : "CORRECTION_SIGNAL",
      stored_at: iso(at),
      live: false,
    },
  };
}

export function nextPrediction({ model, hypothesis, expected, memory = [], context = {}, at } = {}) {
  const relevant = (memory || []).filter((row) => stable(row.context) === stable(context));
  const corrections = relevant.filter((row) => Number(row.error?.absolute || 0) > 0);
  return {
    status: "DEFINED",
    prediction: {
      ...createPrediction({ hypothesis, expected, context, modelVersion: model?.version || 1, at }).prediction,
      informed_by: relevant.map((row) => row.memory_id),
      correction_signals: corrections.length,
      learning_applied: corrections.length > 0,
      live: false,
    },
  };
}

export function causalAssessment({ observation, intervention, controls = [], alternatives = [] } = {}) {
  if (!intervention) {
    return { status: "INCONCLUSIVE", causal: false, reason: "observation without intervention" };
  }
  if (!controls.length || alternatives.length) {
    return {
      status: "INCONCLUSIVE",
      causal: false,
      reason: !controls.length ? "missing control" : "alternative explanation remains",
    };
  }
  return {
    status: "MEASURED",
    causal: true,
    evidence: { observation: clone(observation), intervention: clone(intervention), controls: clone(controls) },
    live: false,
  };
}

export function learnFromExperience(input = {}) {
  const predictionResult = createPrediction(input);
  if (!predictionResult.ok) return predictionResult;
  const observationResult = observeReality({
    prediction: predictionResult.prediction,
    actual: input.actual,
    context: input.context,
    evidence: input.evidence,
    at: input.observedAt,
  });
  if (!observationResult.ok) return observationResult;
  const errorResult = measurePredictionError({
    prediction: predictionResult.prediction,
    observation: observationResult.observation,
    metrics: input.metrics,
  });
  const errorClass = classifyPredictionError(errorResult.error);
  const causal = causalAssessment({
    observation: observationResult.observation,
    intervention: input.intervention,
    controls: input.controls,
    alternatives: input.alternatives,
  });
  const memoryResult = rememberExperience({
    prediction: predictionResult.prediction,
    observation: observationResult.observation,
    error: errorResult.error,
    verification: input.verification,
    context: input.context,
    at: input.observedAt,
  });
  const revision = proposeModelRevision({
    model: input.model,
    error: errorResult.error,
    history: input.history,
    reason: input.revisionReason,
    at: input.observedAt,
  });
  return {
    status: "LEARNED",
    prediction: predictionResult.prediction,
    observation: observationResult.observation,
    error: errorResult.error,
    error_class: errorClass,
    causal,
    memory: memoryResult.memory,
    revision,
    learning: {
      error_to_information: true,
      repeated_error_to_model_revision: revision.status === "PROPOSED",
      observation_to_causality: causal.status === "MEASURED" && causal.causal === true,
      verified_experience_to_memory: memoryResult.memory?.verified === true,
      live: false,
    },
    live: false,
    authority: "carl",
    auto_merge: false,
  };
}

export function assertLearningConstitution(record = {}) {
  if (record.auto_merge === true || record.merge === true) throw new Error("LEARNING_AUTO_MERGE_FORBIDDEN");
  if (record.self_authorization === true) throw new Error("LEARNING_SELF_AUTHORIZATION_FORBIDDEN");
  if (record.live === true) throw new Error("LEARNING_LIVE_FORBIDDEN");
  return {
    ok: true,
    capability_is_not_authority: true,
    self_evolution_is_not_self_authorization: true,
    predictions_are_immutable: true,
  };
}
