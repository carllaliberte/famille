import test from "node:test";
import assert from "node:assert/strict";
import { learnCortexExperience } from "../scripts/cortex-learning-cycle.mjs";

test("Cortex converts runtime reality into a next prediction", () => {
  const result = learnCortexExperience({
    prediction: { hypothesis: "worker succeeds", expected: true, context: { route: "worker" } },
    observation: {
      actual: false,
      context: { route: "worker" },
      evidence: [{ source: "runtime" }],
      observed_at: "2026-09-16T20:10:00Z",
    },
    model: { version: 1 },
    verification: { verified: true },
  });

  assert.equal(result.status, "LEARNED");
  assert.equal(result.learning.error.absolute, 1);
  assert.equal(result.learning.memory.verified, true);
  assert.equal(result.next_prediction.learning_applied, true);
  assert.equal(result.live, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.authority, "carl");
});
