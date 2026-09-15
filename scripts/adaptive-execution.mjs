#!/usr/bin/env node
/**
 * ACORN ADAPTIVE EXECUTION FABRIC
 * Applies measured cadence to work selection without changing authority.
 * Breaker authorizes protected execution; cadence only bounds how much work is attempted.
 */
import { CADENCE_LEVELS, SAFETY_STATES, classifySafety, demandScore, chooseCadence } from "../.github/swarm/adaptive-cadence.mjs";

export const ADAPTIVE_EXECUTION_VERSION = "adaptive-execution.v1";

export function buildExecutionPlan({ pendingTasks = 0, activeTasks = 0, queuePressure = 0, latency = 0, anomalyScore = 0, errorRate = 0, breakerMode = "RUN", currentCadence = 0.25 } = {}) {
  const demand = demandScore({ pendingTasks, activeTasks, queuePressure, latency });
  const safety = classifySafety({ anomalyScore, errorRate, breakerMode });
  const cadence = chooseCadence({ demand, stability: safety, current: currentCadence });
  return Object.freeze({
    version: ADAPTIVE_EXECUTION_VERSION,
    demand_score: demand,
    safety_state: safety,
    cadence,
    cadence_percent: Math.round(cadence * 100),
    cadence_allows_work: safety !== SAFETY_STATES.CRITICAL && String(breakerMode).toUpperCase() === "RUN",
    energy_policy: "MINIMIZE_WITHOUT_SAFETY_LOSS",
    global_breaker_required: true,
    production_write_allowed: false,
    auto_merge: false,
    live: false,
    human_authority: "carl",
  });
}

export function selectWork(items = [], cadence = 0.25) {
  const rows = Array.isArray(items) ? items : [];
  if (!rows.length) return [];
  const level = CADENCE_LEVELS.includes(Number(cadence)) ? Number(cadence) : 0.25;
  if (level >= 1) return [...rows];
  return rows.slice(0, Math.max(1, Math.ceil(rows.length * level)));
}

export function nextCadenceDelayMs(cadence, baseMs = 60_000) {
  const level = CADENCE_LEVELS.includes(Number(cadence)) ? Number(cadence) : 0.25;
  return Math.max(1_000, Math.round(Number(baseMs) / level));
}
