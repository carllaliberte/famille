#!/usr/bin/env node
/**
 * ACORN COGNITIVE CONDUCTOR — bounded parallel execution.
 *
 * The conductor is deliberately not a second orchestrator: it only executes
 * already-authorized, dependency-free runtime stages together. Proof and
 * economic stages remain ordered behind their real evidence dependencies.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";

export const CONDUCTOR_VERSION = "cognitive-conductor.v1";

export const EXECUTION_WAVES = Object.freeze([
  Object.freeze({ name: "worker", dependencies: [] }),
  Object.freeze({ name: "parallel-cognitive-wave", stages: ["cortex", "usage"], dependencies: ["worker"] }),
  Object.freeze({ name: "economic", dependencies: ["parallel-cognitive-wave"] }),
  Object.freeze({ name: "fluidity-verification", dependencies: ["economic"] }),
]);

function readJson(path, fallback = {}) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function writeTiming(path, wave) {
  const current = readJson(path, {});
  current.parallel_wave = wave;
  writeFileSync(path, `${JSON.stringify(current, null, 2)}\n`);
}

function runNode(script) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script], { stdio: "inherit", env: process.env });
    const started = performance.now();
    child.on("error", (error) => resolve({ script, status: "ERROR", code: null, signal: null, error: error.message, duration_ms: performance.now() - started }));
    child.on("exit", (code, signal) => resolve({ script, status: code === 0 ? "SUCCESS" : "FAILED", code, signal, duration_ms: performance.now() - started }));
  });
}

export function planConductor() {
  return {
    version: CONDUCTOR_VERSION,
    waves: EXECUTION_WAVES,
    rules: {
      parallelize_independent: true,
      preserve_dependency_order: true,
      no_authority_escalation: true,
      no_auto_merge: true,
      live: false,
    },
  };
}

export async function runParallelCognitiveWave({ timingPath = process.env.FLUIDITY_TIMING || "cognitive-fluidity-timing.json" } = {}) {
  const startedAt = new Date().toISOString();
  const start = performance.now();
  const results = await Promise.all([
    runNode("scripts/cortex-runtime.mjs"),
    runNode("scripts/usage-commerce-cycle.mjs"),
  ]);
  const duration = performance.now() - start;
  const failed = results.filter((row) => row.status !== "SUCCESS");
  const wave = {
    name: "parallel-cognitive-wave",
    version: CONDUCTOR_VERSION,
    started_at: startedAt,
    duration_ms: Math.round(duration * 1000) / 1000,
    stages: results,
    status: failed.length ? "FAILED" : "VERIFIED",
    dependency_boundary: "worker evidence available before wave; economic reconciliation remains downstream",
    security: { auto_merge: false, live: false, authority: "carl" },
  };
  writeTiming(timingPath, wave);
  if (failed.length) process.exitCode = 1;
  return wave;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runParallelCognitiveWave();
  console.log(JSON.stringify({ plan: planConductor(), wave: result }, null, 2));
}
