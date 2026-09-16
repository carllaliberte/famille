#!/usr/bin/env node
/**
 * ACORN COGNITIVE FLUIDITY — measured coordination feedback.
 *
 * This is a feedback rail, not another orchestrator. It measures the real
 * critical path of the canonical worker cycle and emits a bounded next-cycle
 * coordination hint. It never grants authority, writes source, merges,
 * claims LIVE, or charges anyone.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

export const FLUIDITY_VERSION = "cognitive-fluidity.v1";
export const FLUIDITY_MODES = Object.freeze([
  "SEQUENTIAL_SAFE",
  "PARALLEL_PREP",
  "PARALLEL_DISPATCH",
  "FAST_PATH",
  "HOLD_HUMAN",
]);

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function readJson(path, fallback = {}) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function stages(timing = {}) {
  return Object.entries(timing)
    .map(([name, row]) => ({
      name,
      start_ms: num(row?.start_ms),
      end_ms: num(row?.end_ms),
      duration_ms: num(row?.duration_ms),
    }))
    .filter((row) => row.duration_ms != null && row.duration_ms >= 0);
}

export function measureFluidity({ timing = {}, workerEvidence = {}, at = new Date().toISOString() } = {}) {
  const rows = stages(timing);
  const total = rows.reduce((sum, row) => sum + row.duration_ms, 0);
  const bottleneck = rows.slice().sort((a, b) => b.duration_ms - a.duration_ms)[0] || null;
  const verified = workerEvidence?.verified === true || workerEvidence?.truth?.ACTION_VERIFIED === true;
  const failed = Number(workerEvidence?.dispatch_failed || 0);
  const dispatched = Number(workerEvidence?.dispatched || 0);

  let mode = "SEQUENTIAL_SAFE";
  if (failed > 0) mode = "HOLD_HUMAN";
  else if (bottleneck?.name === "dispatch" && dispatched > 0) mode = "PARALLEL_DISPATCH";
  else if (rows.some((row) => row.name === "cortex" || row.name === "economic") && total > 0) mode = "PARALLEL_PREP";
  else if (verified && total > 0) mode = "FAST_PATH";

  return {
    version: FLUIDITY_VERSION,
    observed_at: at,
    mode,
    measured: rows.length > 0,
    total_stage_ms: total,
    bottleneck,
    stages: rows,
    evidence: {
      verified,
      dispatched,
      dispatch_failed: failed,
    },
    next_cycle: {
      principle: "parallelize independent work; keep dependent proof sequential",
      mode,
      preserve_security: true,
      preserve_provenance: true,
      preserve_human_authority: true,
      auto_merge: false,
      live: false,
    },
  };
}

export function writeFluidity(outputPath = "cognitive-fluidity.json", input = {}) {
  const result = measureFluidity(input);
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const timing = readJson(process.env.FLUIDITY_TIMING || "cognitive-fluidity-timing.json", {});
  const workerEvidence = readJson(process.env.WORKER_EVIDENCE || "worker-evidence.json", {});
  const result = writeFluidity(process.env.FLUIDITY_OUTPUT || "cognitive-fluidity.json", { timing, workerEvidence });
  console.log(JSON.stringify(result, null, 2));
}
