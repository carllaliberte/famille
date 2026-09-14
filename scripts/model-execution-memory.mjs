#!/usr/bin/env node
/**
 * ACORN MODEL EXECUTION MEMORY
 * Records actual provider attempts and outcomes across proof cycles.
 * Configured is not attempted; attempted is not succeeded; succeeded is not LIVE.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

export const MEMORY_VERSION = "model-execution-memory.v1";
export const MEMORY_ARTIFACT = "model-execution-memory";

export function emptyModelExecutionMemory() {
  return { v: MEMORY_VERSION, cycles: 0, updated_at: null, models: {} };
}

export function loadModelExecutionMemory(run = execFileSync, env = process.env) {
  const dir = ".acorn-model-execution-memory";
  try {
    mkdirSync(dir, { recursive: true });
    const runs = run("gh", ["run", "list", "--repo", env.GITHUB_REPOSITORY, "--workflow", "prove-all-models.yml", "--status", "success", "--limit", "5", "--json", "databaseId"], { encoding: "utf8", stdio: "pipe" });
    const prior = JSON.parse(runs || "[]")[0]?.databaseId;
    if (!prior) return emptyModelExecutionMemory();
    run("gh", ["run", "download", String(prior), "--repo", env.GITHUB_REPOSITORY, "--name", MEMORY_ARTIFACT, "--dir", dir], { encoding: "utf8", stdio: "pipe" });
    const candidates = [join(dir, "model-execution-memory.json"), join(dir, MEMORY_ARTIFACT, "model-execution-memory.json")];
    const file = candidates.find((path) => existsSync(path));
    return file ? JSON.parse(readFileSync(file, "utf8")) : emptyModelExecutionMemory();
  } catch {
    return emptyModelExecutionMemory();
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}

export function updateModelExecutionMemory(memory, results = [], now = new Date().toISOString()) {
  const next = structuredClone(memory || emptyModelExecutionMemory());
  next.v = MEMORY_VERSION;
  next.cycles = Number(next.cycles || 0) + 1;
  next.updated_at = now;
  for (const result of results) {
    const id = String(result.id || "unknown");
    const model = next.models[id] || { id, attempts: 0, succeeded: 0, errors: 0, skipped: 0, empty: 0, last_status: null, last_reason: null, last_seen: null };
    model.attempts += 1;
    if (result.status === "SUCCEEDED") model.succeeded += 1;
    else if (result.status === "ERROR") model.errors += 1;
    else if (result.status === "SKIPPED") model.skipped += 1;
    else if (result.status === "EMPTY") model.empty += 1;
    model.last_status = result.status || null;
    model.last_reason = result.reason || null;
    model.last_seen = now;
    next.models[id] = model;
  }
  return next;
}

export function modelExecutionSummary(memory = emptyModelExecutionMemory()) {
  const models = Object.values(memory.models || {}).map((m) => ({
    id: m.id,
    attempts: m.attempts,
    succeeded: m.succeeded,
    errors: m.errors,
    skipped: m.skipped,
    empty: m.empty,
    success_rate: m.attempts ? m.succeeded / m.attempts : 0,
    last_status: m.last_status,
  }));
  return { version: memory.v || MEMORY_VERSION, cycles: memory.cycles || 0, models };
}
