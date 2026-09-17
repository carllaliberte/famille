import test from "node:test";
import assert from "node:assert/strict";
import {
  EXECUTION_ECONOMY_VERSION,
  scoreExecutionValue,
  rankExecutionWork,
  classifyExecutionWork,
  executionEconomy,
} from "../.github/swarm/execution-economy.mjs";

test("execution economy exposes a stable version", () => {
  assert.equal(EXECUTION_ECONOMY_VERSION, "execution-economy.v1");
});

test("high-value unlocking work can outrank isolated work", () => {
  const ranked = rankExecutionWork([
    { id: "isolated", capabilityGain: 0.8, executionCost: 2 },
    { id: "unlocker", unlockingValue: 1, integrationGain: 0.8, executionCost: 1 },
  ]);
  assert.equal(ranked[0].id, "unlocker");
});

test("redundancy and cost reduce execution value", () => {
  const clean = scoreExecutionValue({ capabilityGain: 1, executionCost: 1 });
  const costly = scoreExecutionValue({ capabilityGain: 1, executionCost: 4 });
  const redundant = scoreExecutionValue({ capabilityGain: 1, redundancy: 1, executionCost: 1 });
  assert.ok(clean > costly);
  assert.ok(clean > redundant);
});

test("classification preserves blockers and human gates", () => {
  assert.equal(classifyExecutionWork({ score: 2, blocked: true }), "BLOCKED");
  assert.equal(classifyExecutionWork({ score: 2, humanRequired: true }), "WAITING_ON_HUMAN");
  assert.equal(classifyExecutionWork({ score: 1 }), "HIGH_VALUE");
  assert.equal(classifyExecutionWork({ score: 0 }), "NOT_JUSTIFIED");
});

test("executionEconomy ranks and selects without granting authority", () => {
  const result = executionEconomy({
    work: [
      { id: "a", capabilityGain: 0.9, executionCost: 2 },
      { id: "b", unlockingValue: 1, executionCost: 1 },
    ],
    maxItems: 1,
  });
  assert.equal(result.version, EXECUTION_ECONOMY_VERSION);
  assert.equal(result.selected.length, 1);
  assert.equal(result.auto_merge, false);
  assert.equal(result.production_write_allowed, false);
  assert.equal(result.human_authority, "carl");
});
