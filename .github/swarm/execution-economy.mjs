#!/usr/bin/env node
/**
 * Deterministic work-value scoring for ACORN execution waves.
 * This module prioritizes verified system gain per unit of execution cost.
 * It does not grant authority, execute work, or merge changes.
 */
export const EXECUTION_ECONOMY_VERSION = "execution-economy.v1";

const clamp01 = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
};

const nonNegative = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, n) : fallback;
};

const weightedMean = (entries) => {
  let numerator = 0;
  let denominator = 0;
  for (const [value, weight] of entries) {
    const w = nonNegative(weight);
    numerator += clamp01(value) * w;
    denominator += w;
  }
  return denominator ? numerator / denominator : 0;
};

export function scoreExecutionValue({
  capabilityGain = 0,
  integrationGain = 0,
  reliabilityGain = 0,
  verificationGain = 0,
  securityGain = 0,
  performanceGain = 0,
  futureCompatibilityGain = 0,
  unlockingValue = 0,
  informationGain = 0,
  redundancy = 0,
  risk = 0,
  speculative = 0,
  executionCost = 1,
} = {}) {
  const benefit = weightedMean([
    [capabilityGain, 3],
    [integrationGain, 2],
    [reliabilityGain, 2],
    [verificationGain, 2],
    [securityGain, 2],
    [performanceGain, 1],
    [futureCompatibilityGain, 2],
    [unlockingValue, 3],
    [informationGain, 2],
  ]);

  const penalty = weightedMean([
    [redundancy, 3],
    [risk, 2],
    [speculative, 2],
  ]);

  const cost = Math.max(0.05, nonNegative(executionCost, 1));
  const raw = Math.max(0, benefit - penalty * 0.5) / cost;

  return Number(raw.toFixed(6));
}

export function rankExecutionWork(items = []) {
  return items
    .map((item, index) => ({
      ...item,
      execution_value: scoreExecutionValue(item),
      _index: index,
    }))
    .sort((a, b) => b.execution_value - a.execution_value || a._index - b._index)
    .map(({ _index, ...item }) => item);
}

export function classifyExecutionWork({ score = 0, blocked = false, humanRequired = false } = {}) {
  if (blocked) return "BLOCKED";
  if (humanRequired) return "WAITING_ON_HUMAN";
  const value = nonNegative(score);
  if (value >= 1) return "HIGH_VALUE";
  if (value >= 0.5) return "MEDIUM_VALUE";
  if (value > 0) return "LOW_VALUE";
  return "NOT_JUSTIFIED";
}

export function executionEconomy({ work = [], maxItems = 0 } = {}) {
  const ranked = rankExecutionWork(work);
  const limit = Math.max(0, Math.trunc(nonNegative(maxItems)));
  return {
    version: EXECUTION_ECONOMY_VERSION,
    ranked,
    selected: limit > 0 ? ranked.slice(0, limit) : ranked,
    policy: "MAX_VERIFIED_VALUE_PER_EXECUTION_COST",
    auto_merge: false,
    production_write_allowed: false,
    human_authority: "carl",
  };
}
