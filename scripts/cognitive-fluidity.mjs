#!/usr/bin/env node
/**
 * ACORN COGNITIVE FLUIDITY — runtime property, not a sidecar function.
 *
 * Fluidity is the constraint that work must flow:
 * trigger → execute → diagnose → continue/heal/hold → next
 * A silent skip is STALLED. A human boundary is HOLD_HUMAN (valid pause).
 * The next-cycle hint is consumed by the conductor and continuation, or the
 * property is FRICTION (measured, not LIVE).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const FLUIDITY_VERSION = "cognitive-fluidity.v1";
export const FLUIDITY_MODES = Object.freeze([
  "SEQUENTIAL_SAFE",
  "PARALLEL_PREP",
  "PARALLEL_DISPATCH",
  "FAST_PATH",
  "HOLD_HUMAN",
]);
export const FLUIDITY_STATES = Object.freeze(["FLOWING", "FRICTION", "STALLED", "HOLD_HUMAN"]);
export const FLUIDITY_ARTIFACT = "acorn-cognitive-fluidity";

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function readJson(path, fallback = {}) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function stages(timing = {}) {
  return Object.entries(timing)
    .filter(([name]) => name !== "parallel_wave")
    .map(([name, row]) => ({
      name,
      start_ms: num(row?.start_ms),
      end_ms: num(row?.end_ms),
      duration_ms: num(row?.duration_ms),
    }))
    .filter((row) => row.duration_ms != null && row.duration_ms >= 0);
}

export function applyFluidityHint(prior = {}) {
  const mode = prior?.next_cycle?.mode || prior?.mode || null;
  const state = prior?.state || null;
  if (!mode && !state) {
    return { hint_consumed: false, hint: null, parallelize: false, hold: false, sequential: false, fast_path: false };
  }
  return {
    hint_consumed: true,
    hint: mode,
    prior_state: state,
    parallelize: mode === "PARALLEL_PREP" || mode === "PARALLEL_DISPATCH",
    hold: mode === "HOLD_HUMAN" || state === "HOLD_HUMAN",
    sequential: mode === "SEQUENTIAL_SAFE",
    fast_path: mode === "FAST_PATH",
  };
}

export function fluidityState({ mode, continuation = {}, applied = {}, tools = {}, prior = {} } = {}) {
  const silentStop = continuation.skipped_without_diagnosis === true
    || (continuation.step === "skipped" && continuation.diagnosis_executed !== true);
  if (silentStop) return "STALLED";
  if (mode === "HOLD_HUMAN" || continuation.next === "HOLD_HUMAN") return "HOLD_HUMAN";
  if (prior?.next_cycle?.mode && applied.hint_consumed !== true) return "FRICTION";
  if (tools.decision === "BUILD_TOOL" && tools.existing) return "FRICTION";
  if (applied.hint_consumed && applied.hold) return "HOLD_HUMAN";
  return "FLOWING";
}

export function measureFluidity({
  timing = {},
  workerEvidence = {},
  continuation = {},
  tools = {},
  prior = {},
  applied = {},
  at = new Date().toISOString(),
} = {}) {
  const rows = stages(timing);
  const total = rows.reduce((sum, row) => sum + row.duration_ms, 0);
  const bottleneck = rows.slice().sort((a, b) => b.duration_ms - a.duration_ms)[0] || null;
  const verified = workerEvidence?.verified === true || workerEvidence?.truth?.ACTION_VERIFIED === true;
  const failed = Number(workerEvidence?.dispatch_failed || 0);
  const dispatched = Number(workerEvidence?.dispatched || 0);

  let mode = "SEQUENTIAL_SAFE";
  if (failed > 0) mode = "HOLD_HUMAN";
  else if (continuation.next === "HOLD_HUMAN") mode = "HOLD_HUMAN";
  else if (bottleneck?.name === "dispatch" && dispatched > 0) mode = "PARALLEL_DISPATCH";
  else if (rows.some((row) => row.name === "cortex" || row.name === "economic") && total > 0) mode = "PARALLEL_PREP";
  else if (verified && total > 0) mode = "FAST_PATH";

  const hint = applied.hint_consumed != null ? applied : applyFluidityHint(prior);
  const state = fluidityState({ mode, continuation, applied: hint, tools, prior });
  const silentStop = state === "STALLED";

  return {
    version: FLUIDITY_VERSION,
    observed_at: at,
    mode,
    state,
    measured: rows.length > 0 || Boolean(continuation.next) || Boolean(workerEvidence.status) || Boolean(prior?.mode),
    executed: continuation.diagnosis_executed === true || rows.length > 0 || hint.hint_consumed === true,
    verified: !silentStop,
    total_stage_ms: total,
    bottleneck,
    stages: rows,
    evidence: {
      verified,
      dispatched,
      dispatch_failed: failed,
    },
    property: {
      name: "fluidity",
      measured: rows.length > 0 || Boolean(continuation.next) || Boolean(workerEvidence.status) || Boolean(prior?.mode),
      executed: continuation.diagnosis_executed === true || continuation.v === "runtime-continue.v1" || rows.length > 0 || hint.hint_consumed === true,
      verified: !silentStop,
      silent_stop: silentStop,
      hint_consumed: hint.hint_consumed === true,
      flowing: state === "FLOWING" || state === "HOLD_HUMAN",
    },
    prior_mode: prior?.next_cycle?.mode || prior?.mode || null,
    next_cycle: {
      principle: "parallelize independent work; keep dependent proof sequential; never silent-stop",
      mode,
      preserve_security: true,
      preserve_provenance: true,
      preserve_human_authority: true,
      auto_merge: false,
      live: false,
    },
    auto_merge: false,
    live: false,
    authority: "carl",
  };
}

export function assertFluidity(result = {}) {
  if (result.live === true) throw new Error("FLUIDITY_LIVE_FORBIDDEN");
  if (result.auto_merge === true) throw new Error("FLUIDITY_AUTO_MERGE_FORBIDDEN");
  if (result.property?.silent_stop === true || result.state === "STALLED") throw new Error("FLUIDITY_SILENT_STOP");
  return true;
}

export function writeFluidity(outputPath = "cognitive-fluidity.json", input = {}) {
  const result = measureFluidity(input);
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

export function loadPriorFluidity({ env = process.env, run = execFileSync } = {}) {
  const local = env.FLUIDITY_PRIOR || "cognitive-fluidity-prior.json";
  if (existsSync(local)) {
    const prior = readJson(local, null);
    return prior && prior.version ? prior : null;
  }
  const repo = env.GITHUB_REPOSITORY;
  if (!repo) return null;
  try {
    const runs = JSON.parse(run("gh", [
      "run", "list", "--repo", repo, "--workflow", "cognitive-worker.yml",
      "--status", "success", "--limit", "6", "--json", "databaseId",
    ], { encoding: "utf8", stdio: "pipe" }) || "[]");
    for (const row of runs) {
      if (String(row.databaseId) === String(env.GITHUB_RUN_ID || "")) continue;
      const dir = join(".acorn-prior-fluidity", String(row.databaseId));
      rmSync(dir, { recursive: true, force: true });
      mkdirSync(dir, { recursive: true });
      try {
        run("gh", ["run", "download", String(row.databaseId), "--repo", repo, "--name", `${FLUIDITY_ARTIFACT}-${row.databaseId}`, "--dir", dir], { encoding: "utf8", stdio: "pipe" });
      } catch { continue; }
      const file = [join(dir, "cognitive-fluidity.json"), join(dir, FLUIDITY_ARTIFACT, "cognitive-fluidity.json")]
        .find((path) => existsSync(path));
      if (!file) continue;
      const prior = readJson(file, null);
      if (prior?.version) return prior;
    }
  } catch {
    return null;
  }
  return null;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const timing = readJson(process.env.FLUIDITY_TIMING || "cognitive-fluidity-timing.json", {});
  const workerEvidence = readJson(process.env.WORKER_EVIDENCE || "worker-evidence.json", {});
  const continuation = readJson(process.env.RUNTIME_DIAGNOSIS || "runtime-diagnosis.json", {});
  const prior = loadPriorFluidity();
  const applied = applyFluidityHint(prior || {});
  const result = writeFluidity(process.env.FLUIDITY_OUTPUT || "cognitive-fluidity.json", {
    timing,
    workerEvidence,
    continuation,
    prior: prior || {},
    applied,
  });
  console.log(JSON.stringify({ ...result, applied }, null, 2));
}
