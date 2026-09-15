import test from "node:test";
import assert from "node:assert/strict";
import { assertMeasurementFeedbackSafe, buildMeasurementFeedback, emptyFeedback, feedbackSummary } from "../scripts/measurement-feedback.mjs";

test("feedback is fail-safe and non-authoritative", () => {
  const feedback = emptyFeedback();
  assert.equal(feedback.authority, "carl");
  assert.equal(feedback.auto_merge, false);
  assert.equal(feedback.live, false);
  assertMeasurementFeedbackSafe(feedback);
});

test("rank changes become bounded guidance", () => {
  const feedback = buildMeasurementFeedback({
    observed_at: "2026-09-14T16:00:00Z",
    changes: [
      { id: "grok", type: "PROMOTED", from: 3, to: 1, delta: 2 },
      { id: "gemini", type: "DEMOTED", from: 1, to: 3, delta: -2 },
      { id: "astra", type: "MEASURED", from: null, to: 2, delta: null },
      { id: "unknown", type: "UNRELATED", from: null, to: null, delta: null },
    ],
  });
  assert.deepEqual(feedback.actions.map((x) => [x.id, x.action]), [
    ["gemini", "DEPRIORITIZE"],
    ["grok", "PROMOTE_PRIORITY"],
    ["astra", "MEASURE_MORE"],
  ]);
  assertMeasurementFeedbackSafe(feedback);
});

test("summary counts feedback deterministically", () => {
  const summary = feedbackSummary({
    v: "measurement-feedback.v1",
    observed_at: "2026-09-14T16:00:00Z",
    authority: "carl",
    auto_merge: false,
    live: false,
    actions: [
      { id: "a", action: "PROMOTE_PRIORITY" },
      { id: "b", action: "PROMOTE_PRIORITY" },
      { id: "c", action: "MEASURE_MORE" },
    ],
  });
  assert.equal(summary.total, 3);
  assert.deepEqual(summary.counts, { PROMOTE_PRIORITY: 2, MEASURE_MORE: 1 });
});
