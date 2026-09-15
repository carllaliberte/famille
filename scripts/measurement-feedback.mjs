#!/usr/bin/env node
/**
 * ACORN MEASUREMENT FEEDBACK
 * Converts measured rank changes into bounded routing guidance.
 * Guidance is evidence, not authority: no promotion, merge, write, or LIVE.
 */

export const MEASUREMENT_FEEDBACK_VERSION = "measurement-feedback.v1";

const ACTIONS = new Set(["PROMOTE_PRIORITY", "DEPRIORITIZE", "MEASURE_MORE", "UNCHANGED"]);
const ACTION_ORDER = Object.freeze({ DEPRIORITIZE: 0, PROMOTE_PRIORITY: 1, MEASURE_MORE: 2 });

export function emptyFeedback() {
  return {
    v: MEASUREMENT_FEEDBACK_VERSION,
    observed_at: null,
    authority: "carl",
    auto_merge: false,
    live: false,
    actions: [],
  };
}

function actionFor(change) {
  if (change?.type === "PROMOTED") return "PROMOTE_PRIORITY";
  if (change?.type === "DEMOTED") return "DEPRIORITIZE";
  if (change?.type === "MEASURED" || change?.type === "UNMEASURED") return "MEASURE_MORE";
  return "UNCHANGED";
}

export function buildMeasurementFeedback(ranking = {}, observedAt = null) {
  const actions = [];
  for (const change of ranking.changes || []) {
    const id = String(change?.id || "").trim();
    if (!id) continue;
    const action = actionFor(change);
    if (!ACTIONS.has(action) || action === "UNCHANGED") continue;
    actions.push({
      id,
      action,
      from: change.from ?? null,
      to: change.to ?? null,
      delta: change.delta ?? null,
      basis: "measured-ranking",
    });
  }
  actions.sort((a, b) => ((ACTION_ORDER[a.action] ?? 9) - (ACTION_ORDER[b.action] ?? 9)) || a.id.localeCompare(b.id));
  return {
    v: MEASUREMENT_FEEDBACK_VERSION,
    observed_at: observedAt || ranking.observed_at || new Date().toISOString(),
    authority: "carl",
    auto_merge: false,
    live: false,
    actions,
  };
}

export function feedbackSummary(feedback = emptyFeedback()) {
  const counts = {};
  for (const row of feedback.actions || []) counts[row.action] = (counts[row.action] || 0) + 1;
  return {
    version: feedback.v || MEASUREMENT_FEEDBACK_VERSION,
    observed_at: feedback.observed_at || null,
    total: (feedback.actions || []).length,
    counts,
    authority: feedback.authority || "carl",
    auto_merge: false,
    live: false,
  };
}

export function assertMeasurementFeedbackSafe(feedback = emptyFeedback()) {
  if (feedback?.live !== false) throw new Error("MEASUREMENT_FEEDBACK_LIVE_FORBIDDEN");
  if (feedback?.auto_merge !== false) throw new Error("MEASUREMENT_FEEDBACK_AUTO_MERGE_FORBIDDEN");
  if (feedback?.authority !== "carl") throw new Error("MEASUREMENT_FEEDBACK_AUTHORITY_INVALID");
  for (const row of feedback.actions || []) {
    if (!ACTIONS.has(row.action)) throw new Error("MEASUREMENT_FEEDBACK_ACTION_INVALID");
  }
  return true;
}
