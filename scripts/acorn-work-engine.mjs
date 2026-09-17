#!/usr/bin/env node
/**
 * ACORN CONTINUOUS WORK ENGINE
 *
 * One persistent work graph over all Acorn fronts.
 *
 * It discovers work from the canonical organism runtime, ranks it by
 * information/capability/risk value, applies a resource budget, executes
 * only bounded deterministic actions by default, and emits a durable state
 * artifact. AI/model dispatch is opt-in and budgeted; default model budget is 0.
 *
 * HUMAN AUTHORITY: Carl.
 * EXECUTOR: replaceable.
 * CAPABILITY != AUTHORITY.
 * NO AUTO-MERGE.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { runContinuousRuntime } from "./acorn-continuous-runtime.mjs";
import {
  RESOURCE_GOVERNOR_VERSION,
  limitsFromEnv,
  governorSnapshot,
  reserve,
} from "./acorn-resource-governor.mjs";

export const CONTINUOUS_WORK_ENGINE_VERSION = "acorn.continuous-work-engine.v1";

const TERMINAL = new Set(["COMPLETED", "REJECTED", "QUARANTINED"]);
const ACTIVE = new Set(["READY", "RUNNING", "VERIFYING", "BLOCKED_BUDGET", "WAITING_HUMAN"]);

function text(value) {
  return String(value ?? "").trim();
}

function readJson(path, fallback) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function clamp(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

function workId(row, prefix = "work") {
  const raw = text(row.id || row.subject || row.path || prefix).replace(/[^a-zA-Z0-9._:-]+/g, "-");
  return `${prefix}:${raw}`;
}

export function canonicalWorkFromRuntime(runtime) {
  const rows = [];
  const push = (row, source) => {
    if (!row) return;
    rows.push({
      id: workId(row),
      source,
      subject: text(row.subject || row.id || "unknown-work"),
      state: text(row.state || "READY") || "READY",
      information_gain: clamp(row.information_gain),
      capability_gain: clamp(row.capability_gain),
      risk_reduction: clamp(row.risk_reduction),
      cost: clamp(row.cost),
      uncertainty: clamp(row.uncertainty ?? row.unknown ?? 0),
      reversibility: clamp(row.reversibility ?? 1),
      dependencies: Array.isArray(row.dependencies) ? row.dependencies : [],
      human_required: row.human_required === true,
      capability: text(row.capability || ""),
    });
  });

  for (const row of runtime?.unified?.evolution?.next_work || []) push(row, "evolution");
  for (const row of runtime?.unified?.learning?.next || []) push(row, "learning");
  for (const row of runtime?.unified?.metabolism?.next || []) push(row, "metabolism");

  if (!rows.length) {
    const coverage = runtime?.coverage || {};
    push({
      id: "inventory-revalidation",
      subject: "revalidate capability inventory",
      information_gain: 1 - clamp(coverage.verified_count / Math.max(1, coverage.discovered_count)),
      capability_gain: 1 - clamp(coverage.measured_count / Math.max(1, coverage.discovered_count)),
      risk_reduction: clamp(coverage.verified_count / Math.max(1, coverage.discovered_count)),
      cost: 0.1,
      reversibility: 1,
    }, "fallback");
  }

  return deduplicateWork(rows);
}

export function deduplicateWork(rows = []) {
  const map = new Map();
  for (const row of rows) {
    const existing = map.get(row.id);
    if (!existing || scoreWork(row) > scoreWork(existing)) map.set(row.id, row);
  }
  return [...map.values()];
}

export function scoreWork(row = {}) {
  const gain = (
    0.30 * clamp(row.information_gain) +
    0.25 * clamp(row.capability_gain) +
    0.25 * clamp(row.risk_reduction) +
    0.10 * clamp(row.uncertainty) +
    0.10 * clamp(row.reversibility)
  );
  const cost = 0.05 + 0.95 * clamp(row.cost);
  return Number((gain / cost).toFixed(6));
}

export function rankWork(rows = []) {
  return [...rows]
    .filter((row) => !TERMINAL.has(row.state))
    .map((row) => ({ ...row, priority: scoreWork(row) }))
    .sort((a, b) => b.priority - a.priority);
}

export function workState({ previous = {}, discovered = [] } = {}) {
  const old = new Map((previous.queue || []).map((row) => [row.id, row]));
  const queue = discovered.map((row) => {
    const prior = old.get(row.id);
    return {
      ...row,
      state: prior?.state || row.state,
      attempts: Number(prior?.attempts || 0),
      last_error: prior?.last_error || null,
      last_completed_at: prior?.last_completed_at || null,
      priority: scoreWork(row),
    };
  });
  return { queue: rankWork(queue), updated_at: new Date().toISOString() };
}

function executeDeterministic({ root, task, env }) {
  const command = task.command || env.ACORN_WORK_DETERMINISTIC_COMMAND || "node --check scripts/acorn-continuous-runtime.mjs";
  const [bin, ...args] = command.split(/\s+/).filter(Boolean);
  const started = Date.now();
  const result = spawnSync(bin, args, {
    cwd: root,
    env: { ...env, CI: "true" },
    encoding: "utf8",
    timeout: Math.max(5_000, Number(env.ACORN_WORK_TASK_TIMEOUT_MS || 90_000)),
    maxBuffer: 2 * 1024 * 1024,
  });
  return {
    status: result.status === 0 ? "COMPLETED" : "FAILED",
    exit_code: result.status,
    signal: result.signal || null,
    duration_ms: Date.now() - started,
    stdout_tail: text(result.stdout).slice(-4000),
    stderr_tail: text(result.stderr).slice(-4000),
  };
}

export function executorPolicy({ env = process.env } = {}) {
  const allowModels = text(env.ACORN_ALLOW_MODEL_DISPATCH).toLowerCase() === "true";
  const modelCalls = Number(env.ACORN_BUDGET_MODEL_CALLS || 0);
  const tokens = Number(env.ACORN_BUDGET_MODEL_TOKENS || 0);
  return {
    deterministic: true,
    model_dispatch: allowModels && modelCalls > 0 && tokens > 0,
    model_calls_budget: Number.isFinite(modelCalls) ? modelCalls : 0,
    model_tokens_budget: Number.isFinite(tokens) ? tokens : 0,
    auto_merge: false,
    auto_spend: false,
    authority: "carl",
  };
}

function defaultTaskFor(row, env = process.env) {
  if (row.subject.includes("inventory") || row.source === "fallback") {
    return { ...row, command: env.ACORN_WORK_DETERMINISTIC_COMMAND || "node --check scripts/acorn-continuous-runtime.mjs", resource_cost: { actions: 1, cpu_ms: 30_000 } };
  }
  return { ...row, command: env.ACORN_WORK_DETERMINISTIC_COMMAND || "node --check scripts/acorn-continuous-runtime.mjs", resource_cost: { actions: 1, cpu_ms: 30_000 } };
}

export async function runContinuousWorkEngine({
  root = resolve("."),
  env = process.env,
  statePath = resolve(root, "evidence/autopilot/continuous-work-state.json"),
  at = new Date().toISOString(),
  runtime = null,
  previous = null,
} = {}) {
  const prior = previous || readJson(statePath, { queue: [], usage: {}, history: [] });
  const organism = runtime || await runContinuousRuntime({
    root,
    env,
    at,
    previous: prior.runtime_entries || [],
    evidencePath: resolve(root, "evidence/autopilot/continuous-runtime.json"),
    operation: "inventory",
  });

  const discovered = canonicalWorkFromRuntime(organism);
  const graph = workState({ previous: prior, discovered });
  const limits = limitsFromEnv(env);
  const usage = prior.usage || {};
  const policy = executorPolicy({ env });

  let currentUsage = { ...usage };
  const completed = [];
  const blocked = [];
  const history = Array.isArray(prior.history) ? prior.history.slice(-100) : [];

  for (const candidate of graph.queue) {
    if (candidate.human_required) {
      blocked.push({ ...candidate, state: "WAITING_HUMAN", reason: "HUMAN_AUTHORITY_REQUIRED" });
      continue;
    }
    const task = defaultTaskFor(candidate, env);
    const reservation = reserve({
      limits,
      usage: currentUsage,
      cost: task.resource_cost,
      label: candidate.id,
    });
    if (reservation.status !== "RESERVED") {
      blocked.push({ ...candidate, state: "BLOCKED_BUDGET", reason: reservation.decision.insufficient });
      continue;
    }
    currentUsage = reservation.usage;

    const execution = executeDeterministic({ root, task, env });
    const next = {
      ...candidate,
      state: execution.status === "COMPLETED" ? "COMPLETED" : "VERIFYING",
      attempts: candidate.attempts + 1,
      last_error: execution.status === "COMPLETED" ? null : execution.stderr_tail,
      last_completed_at: execution.status === "COMPLETED" ? new Date().toISOString() : null,
      execution,
      executor: "deterministic-ci",
      model_dispatched: false,
    };
    if (execution.status === "COMPLETED") completed.push(next);
    else blocked.push({ ...next, state: "VERIFYING", reason: "DETERMINISTIC_EXECUTION_FAILED" });
    history.push({
      at: new Date().toISOString(),
      work_id: candidate.id,
      state: next.state,
      executor: next.executor,
      duration_ms: execution.duration_ms,
      model_dispatched: false,
    });
    if (completed.length >= Number(env.ACORN_WORK_MAX_TASKS || 3)) break;
  }

  const queue = graph.queue.map((row) => {
    const hit = [...completed, ...blocked].find((x) => x.id === row.id);
    return hit || row;
  });

  const snapshot = {
    version: CONTINUOUS_WORK_ENGINE_VERSION,
    resource_governor: RESOURCE_GOVERNOR_VERSION,
    observed_at: at,
    state: blocked.some((row) => row.state === "WAITING_HUMAN") ? "WAITING_HUMAN"
      : blocked.some((row) => row.state === "BLOCKED_BUDGET") ? "BUDGET_PAUSED"
      : "CONTINUING",
    queue: rankWork(queue),
    completed_count: completed.length,
    blocked_count: blocked.length,
    usage: currentUsage,
    governor: governorSnapshot({ env, limits, usage: currentUsage }),\n    budget_window: { minutes: windowMinutes, started_at: budgetWindowStartedAt, reset: windowExpired },
    executor_policy: policy,
    runtime: {
      state: organism.state,
      coverage: organism.coverage,
      cycle_order: organism.unified?.cycle_order || [],
    },
    next_action: rankWork(queue.filter((row) => !TERMINAL.has(row.state)))[0] || null,
    history,
    auto_merge: false,
    auto_spend: false,
    live: false,
    authority: "carl",
  };

  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(snapshot, null, 2)}\n`);
  return snapshot;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runContinuousWorkEngine();
  console.log(JSON.stringify(result, null, 2));
}
