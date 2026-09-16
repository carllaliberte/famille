#!/usr/bin/env node
/**
 * Thin integration boundary between the existing Cortex organism cycle and
 * the Reality Learning Engine. It records what Cortex predicted, compares it
 * with runtime reality, and returns a bounded learning record.
 *
 * No merge, secret, authority, or LIVE transition is possible here.
 */

import {
  learnFromExperience,
  nextPrediction,
} from "./reality-learning-engine.mjs";

export const CORTEX_LEARNING_BRIDGE_VERSION = "cortex-learning-bridge.v1";

export function learnCortexExperience({
  observation = {},
  prediction = {},
  model = {},
  memory = [],
  history = [],
  verification = {},
  intervention,
  controls = [],
  alternatives = [],
} = {}) {
  const result = learnFromExperience({
    hypothesis: prediction.hypothesis,
    expected: prediction.expected,
    actual: observation.actual,
    context: observation.context || prediction.context || {},
    evidence: observation.evidence || [],
    model,
    history,
    verification,
    intervention,
    controls,
    alternatives,
    observedAt: observation.observed_at,
  });

  const next = nextPrediction({
    model: result.revision?.revision?.proposed_version
      ? { ...model, version: result.revision.revision.proposed_version }
      : model,
    hypothesis: prediction.hypothesis,
    expected: prediction.expected,
    memory: result.memory ? [...memory, result.memory] : memory,
    context: observation.context || prediction.context || {},
  });

  return {
    status: result.status,
    bridge_version: CORTEX_LEARNING_BRIDGE_VERSION,
    learning: result,
    next_prediction: next.prediction,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}
