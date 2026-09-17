import test from "node:test";
import assert from "node:assert/strict";
import {
  contextFingerprint,
  createStrategy,
  learnStrategy,
  selectStrategy,
  runCognitiveStrategyLearningCycle,
  assertCognitiveStrategyInvariant,
} from "../scripts/acorn-cognitive-strategy.mjs";

test("verified outcome teaches Cortex a context-specific composition", () => {
  const result = runCognitiveStrategyLearningCycle({
    context: { task_kind: "reasoning", objective: "x", capabilities: ["reasoning"] },
    composition: ["cortex", "verifier"],
    outcome: { verified: true, error: 0, information_gain: 0.9, capability_gain: 0.4, control_gap: 0, reversibility: 1 },
    now: "2026-09-17T00:00:00Z",
  });
  assert.equal(result.status, "VERIFIED");
  assert.equal(result.strategy.state, "LEARNED");
  assert.equal(result.strategy.verified_count, 1);
  assert.equal(result.selection.status, "SELECTED");
  assert.equal(result.authority_granted, false);
});

test("contradiction is learned as a negative signal and is never promoted", () => {
  const strategy = createStrategy({ context: { task_kind: "x" }, composition: ["bad"] });
  const next = learnStrategy(strategy, { verified: false, contradiction: true, error: 1 }, "t1");
  assert.equal(next.state, "CONTRADICTED");
  assert.equal(next.verified_count, 0);
  assert.equal(selectStrategy({ context: { task_kind: "x" }, strategies: [next], now: "t2" }).status, "NO_LEARNED_STRATEGY");
});

test("selection is context-specific, deterministic, and provider-neutral", () => {
  const context = { task_kind: "research", objective: "y", capabilities: ["search", "reasoning"] };
  const a = learnStrategy(createStrategy({ context, composition: ["alpha", "beta"] }), { verified: true, information_gain: .5, reversibility: 1 }, "1");
  const b = learnStrategy(createStrategy({ context, composition: ["gamma"] }), { verified: true, information_gain: .5, reversibility: 1 }, "1");
  const one = selectStrategy({ context, strategies: [b, a], now: "2" });
  const two = selectStrategy({ context, strategies: [a, b], now: "2" });
  assert.equal(one.status, "SELECTED");
  assert.equal(one.strategy.id, two.strategy.id);
  assert.equal(contextFingerprint(context), one.context_fingerprint);
});

test("strategy memory never grants authority or live status", () => {
  const result = runCognitiveStrategyLearningCycle({
    context: { task_kind: "safe" }, composition: ["x"],
    outcome: { verified: true }, now: "1",
  });
  assert.equal(assertCognitiveStrategyInvariant(result.memory).status, "VERIFIED");
  for (const strategy of result.memory) {
    assert.equal(strategy.authority_granted, false);
    assert.equal(strategy.live, false);
  }
});

test("unverified outcomes cannot become learned", () => {
  const result = runCognitiveStrategyLearningCycle({
    context: { task_kind: "unknown" }, composition: ["x"],
    outcome: { verified: false, error: .8 }, now: "1",
  });
  assert.equal(result.strategy.state, "CANDIDATE");
  assert.equal(result.selection.status, "NO_LEARNED_STRATEGY");
});
