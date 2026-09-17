#!/usr/bin/env node
/**
 * ACORN AUTONOMOUS RUNTIME
 *
 * Long-lived supervisor around the bounded cognitive worker.
 * It does not merge, write source, or declare LIVE. It checkpoints every
 * cycle so an execution can continue across process/workflow boundaries.
 *
 * A duration of 0 means "until externally stopped". GitHub Actions still
 * supplies the outer process timeout; the runtime itself remains portable.
 *
 * Breaker CLOSED / AMBIGUOUS / UNKNOWN / INVALID blocks threatened worker
 * dispatch. Defense and the continuous inventory cycle keep running.
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runWorker } from "./cognitive-worker.mjs";
import { controlState } from "../.github/swarm/system-breaker.mjs";
import { selfHealDecision } from "./self-heal.mjs";

const root = resolve(process.env.ACORN_RUNTIME_ROOT || ".");

function now() { return new Date().toISOString(); }
function sleep(ms) { return new Promise((resolveSleep) => setTimeout(resolveSleep, ms)); }

function threatenedBlocked(state) {
  return state.mode !== "RUN" || state.breaker_closed || state.diagnostic;
}

export function inventoryProbe() {
  return {
    ok: true,
    version: "autonomous-runtime.v1",
    auto_merge: false,
    live: false,
    authority: "carl",
    continuity: true,
    defense_never_hold: true,
    hold_on_defense: false,
    autonomy_is_not_boolean: true,
    capability_is_not_authority: true,
  };
}

export const AUTONOMY_AXES = Object.freeze([
  "autonomous_steps",
  "duration_ms",
  "resource_acquisition",
  "tool_access",
  "external_side_effects",
  "self_directed_task_changes",
  "planning_depth",
  "delegation",
  "replication_attempts",
  "persistence",
  "network_reach",
  "financial_access",
  "authority_requests",
]);

function measuredAxis(value) {
  if (value === undefined || value === null || value === "") return "UNKNOWN";
  const n = Number(value);
  return Number.isFinite(n) ? n : "UNKNOWN";
}

export function measureAutonomy(observed = {}) {
  const axes = {};
  for (const axis of AUTONOMY_AXES) axes[axis] = measuredAxis(observed[axis]);
  const known = Object.values(axes).filter((value) => value !== "UNKNOWN");
  return {
    ...axes,
    autonomous: "NOT_BOOLEAN",
    known_axes: known.length,
    unknown_axes: AUTONOMY_AXES.length - known.length,
    status: known.length ? "MEASURED" : "UNKNOWN",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function autonomyBudget({
  limits = {},
  uncertainty = {},
  dangerous = false,
  breaker = "UNCHANGED",
} = {}) {
  const reduce = dangerous === true || uncertainty.high === true || uncertainty.unknown === true;
  const scaled = {};
  for (const axis of AUTONOMY_AXES) {
    const raw = measuredAxis(limits[axis]);
    if (raw === "UNKNOWN") {
      scaled[axis] = "UNKNOWN";
      continue;
    }
    scaled[axis] = reduce ? Number((raw * 0.25).toFixed(4)) : raw;
  }
  return {
    limits: scaled,
    reduced: reduce,
    reason: reduce ? (dangerous ? "DANGEROUS_CONTEXT" : "UNCERTAINTY") : "NOMINAL",
    is_not_breaker: true,
    breaker_changed: false,
    breaker_observed: breaker,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function consumeAutonomy({ budget = {}, usage = {} } = {}) {
  const exhausted = [];
  const remaining = {};
  const limits = budget.limits || budget;
  for (const axis of AUTONOMY_AXES) {
    const limit = measuredAxis(limits[axis]);
    const used = measuredAxis(usage[axis]);
    if (limit === "UNKNOWN" || used === "UNKNOWN") {
      remaining[axis] = "UNKNOWN";
      continue;
    }
    remaining[axis] = Number((limit - used).toFixed(4));
    if (remaining[axis] < 0) exhausted.push(axis);
  }
  return {
    remaining,
    exhausted,
    blocked: exhausted.length > 0,
    reason: exhausted.length ? "AUTONOMY_BUDGET_EXHAUSTED" : "WITHIN_BUDGET",
    breaker_changed: false,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

async function defaultContinuity(opts) {
  const mod = await import("./acorn-continuous-runtime.mjs");
  return mod.runContinuousRuntime(opts);
}

export async function runAutonomousRuntime({
  worker = runWorker,
  env = process.env,
  sleepFn = sleep,
  continuity = defaultContinuity,
} = {}) {
  const evidenceDir = resolve(root, env.ACORN_RUNTIME_EVIDENCE_DIR || "evidence/autopilot/runtime");
  const checkpointPath = resolve(root, env.ACORN_RUNTIME_CHECKPOINT || "evidence/autopilot/runtime/checkpoint.json");
  const journalPath = resolve(root, env.ACORN_RUNTIME_JOURNAL || "evidence/autopilot/runtime/journal.jsonl");
  const durationMinutes = Math.max(0, Number(env.ACORN_RUNTIME_MINUTES ?? 0));
  const intervalSeconds = Math.max(5, Number(env.ACORN_RUNTIME_INTERVAL_SECONDS ?? 60));
  const maxCycles = Math.max(0, Number(env.ACORN_RUNTIME_MAX_CYCLES ?? 0));
  const dispatchEvery = Math.max(1, Number(env.ACORN_RUNTIME_DISPATCH_EVERY ?? 6));
  const ensure = () => { mkdirSync(dirname(checkpointPath), { recursive: true }); mkdirSync(evidenceDir, { recursive: true }); };
  const loadCheckpoint = () => {
    try { return JSON.parse(readFileSync(checkpointPath, "utf8")); } catch { return { cycle: 0, started_at: null, last_completed_at: null }; }
  };
  const persistCheckpoint = (value) => { writeFileSync(checkpointPath, `${JSON.stringify(value, null, 2)}\n`); };
  const journal = (entry) => { appendFileSync(journalPath, `${JSON.stringify(entry)}\n`); };

  ensure();
  const checkpoint = loadCheckpoint();
  const startedAt = now();
  const previousCycle = Number(checkpoint.cycle || 0);
  let cycle = previousCycle;
  let completed = 0;
  let lastState = "RUNNING";
  const deadline = durationMinutes > 0 ? Date.parse(startedAt) + durationMinutes * 60_000 : Number.POSITIVE_INFINITY;

  while (Date.now() < deadline && (maxCycles === 0 || completed < maxCycles)) {
    const state = controlState(env);
    cycle += 1;
    const shouldDispatch = cycle === 1 || cycle % dispatchEvery === 0;
    const cycleDir = resolve(evidenceDir, `cycle-${String(cycle).padStart(6, "0")}`);
    mkdirSync(cycleDir, { recursive: true });
    const observedAt = now();
    const blocked = threatenedBlocked(state);

    let continuityRecord = null;
    try {
      continuityRecord = await continuity({
        root,
        env,
        at: observedAt,
        evidencePath: resolve(cycleDir, "continuous-runtime.json"),
        operation: blocked ? "dispatch" : "inventory",
      });
    } catch (error) {
      continuityRecord = {
        state: "CONTINUITY_FAILED",
        error: String(error?.message || error),
        defense: { active: true, continue_defending: true },
        live: false,
        auto_merge: false,
      };
    }

    if (blocked) {
      lastState = "DEFENSIVE_CONTINUATION";
      const continuation = {
        runtime: "autonomous-runtime.v1",
        state: lastState,
        cycle,
        started_at: startedAt,
        observed_at: observedAt,
        completed_at: now(),
        mode: state.mode,
        breaker_closed: true,
        worker_executed: false,
        threatened_blocked: true,
        defense_active: true,
        continue_defending: true,
        hold_on_defense: false,
        continuity_active: true,
        continuity: {
          state: continuityRecord?.state || "UNKNOWN",
          defense: continuityRecord?.defense?.state || continuityRecord?.defense?.active || null,
        },
        live: false,
        auto_merge: false,
        authority: "carl",
        evidence_path: cycleDir,
      };
      writeFileSync(resolve(cycleDir, "runtime.json"), `${JSON.stringify(continuation, null, 2)}\n`);
      journal(continuation);
      persistCheckpoint({ cycle, started_at: startedAt, last_completed_at: continuation.completed_at, state: lastState, last_cycle: cycleDir });
      completed += 1;
    } else {
      try {
        const evidence = worker({
          env,
          dispatch: shouldDispatch,
          evidencePath: resolve(cycleDir, "worker-evidence.json"),
          memoryPath: resolve(cycleDir, "synaptic-memory.json"),
          memoryIndexPath: resolve(cycleDir, "cognitive-memory-index.json"),
          rankingPath: resolve(cycleDir, "measured-intelligence-ranking.json"),
          feedbackPath: resolve(cycleDir, "measurement-feedback.json"),
          measurementRecordPath: resolve(cycleDir, "measurement-record.json"),
          failOnDispatchError: false,
        });
        lastState = "RUNNING";
        const record = {
          runtime: "autonomous-runtime.v1",
          cycle,
          started_at: startedAt,
          observed_at: observedAt,
          completed_at: now(),
          dispatch_requested: shouldDispatch,
          worker_executed: true,
          worker_verified: Boolean(evidence?.verified),
          continuity_active: true,
          defense_active: true,
          live: false,
          auto_merge: false,
          human_decision: "PENDING_HUMAN",
          authority: "carl",
          evidence_path: cycleDir,
          dispatches: evidence?.dispatches || [],
          measurement: evidence?.measurement_record || null,
          continuity: {
            state: continuityRecord?.state || "UNKNOWN",
            coverage: continuityRecord?.coverage || null,
          },
        };
        writeFileSync(resolve(cycleDir, "runtime.json"), `${JSON.stringify(record, null, 2)}\n`);
        journal(record);
        persistCheckpoint({ cycle, started_at: startedAt, last_completed_at: record.completed_at, state: lastState, last_cycle: cycleDir });
        completed += 1;
      } catch (error) {
        const heal = selfHealDecision({ reason: String(error?.message || error), attempt: 0, breaker: state.mode });
        const failure = {
          runtime: "autonomous-runtime.v1",
          cycle,
          observed_at: observedAt,
          completed_at: now(),
          state: heal.action === "HOLD_HUMAN" ? "HOLD_HUMAN" : "WORKER_FAILED",
          error: String(error?.message || error),
          heal,
          live: false,
          auto_merge: false,
          authority: "carl",
          defense_active: true,
          continue_defending: true,
          continuity_active: true,
        };
        if (heal.action === "RETRY" && heal.retry) {
          try {
            worker({
              env,
              dispatch: shouldDispatch,
              evidencePath: resolve(cycleDir, "worker-evidence.json"),
              failOnDispatchError: false,
            });
            failure.state = "RECOVERED";
            failure.heal = { ...heal, recovered: true };
          } catch (retryError) {
            failure.error = String(retryError?.message || retryError);
          }
        }
        writeFileSync(resolve(cycleDir, "runtime-failure.json"), `${JSON.stringify(failure, null, 2)}\n`);
        journal(failure);
        persistCheckpoint({ cycle, started_at: startedAt, last_completed_at: failure.completed_at, state: failure.state, last_cycle: cycleDir });
        if (heal.action === "HOLD_HUMAN" || heal.action === "STOP") {
          return failure;
        }
        lastState = failure.state;
        completed += 1;
      }
    }

    if (Date.now() < deadline && (maxCycles === 0 || completed < maxCycles)) {
      await sleepFn(intervalSeconds * 1000);
    }
  }

  const finished = {
    runtime: "autonomous-runtime.v1",
    cycle,
    completed,
    state: lastState === "DEFENSIVE_CONTINUATION" ? "DEFENSIVE_CONTINUATION" : "TIME_SLICE_COMPLETE",
    at: now(),
    duration_minutes: durationMinutes,
    autonomy: measureAutonomy({
      autonomous_steps: completed,
      duration_ms: Date.parse(now()) - Date.parse(startedAt),
      authority_requests: 0,
      replication_attempts: 0,
    }),
    budget: autonomyBudget({
      limits: { autonomous_steps: maxCycles || completed, duration_ms: durationMinutes > 0 ? durationMinutes * 60_000 : "UNKNOWN" },
      uncertainty: { unknown: threatenedBlocked(controlState(env)) },
      breaker: controlState(env).mode,
    }),
    defense_active: true,
    continuity_active: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
  journal(finished);
  persistCheckpoint({ cycle, started_at: startedAt, last_completed_at: finished.at, state: finished.state });
  return finished;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runAutonomousRuntime();
  console.log(JSON.stringify(result, null, 2));
}
