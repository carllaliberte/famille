#!/usr/bin/env node
/**
 * ACORN COLLABORATION MEMORY
 * Persists measured collaboration events only. It never turns synthesis into truth,
 * never ranks intelligence quality from a single pass, and never grants authority.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

export const MEMORY_VERSION = "collaboration-memory.v1";
export const MEMORY_ARTIFACT = "cognitive-collaboration-memory";

export function emptyCollaborationMemory() {
  return { v: MEMORY_VERSION, cycles: 0, updated_at: null, collaborations: {} };
}

export function collaborationKey(sourceIds = [], capability = "review") {
  return `${[...new Set(sourceIds.map(String))].sort().join("+")}:${capability}`;
}

export function loadCollaborationMemory(run = execFileSync, env = process.env) {
  const dir = ".acorn-collaboration-memory";
  try {
    mkdirSync(dir, { recursive: true });
    const runs = run("gh", ["run", "list", "--repo", env.GITHUB_REPOSITORY, "--workflow", "swarm-collaboration.yml", "--status", "success", "--limit", "5", "--json", "databaseId"], { encoding: "utf8", stdio: "pipe" });
    const prior = JSON.parse(runs || "[]")[0]?.databaseId;
    if (!prior) return emptyCollaborationMemory();
    run("gh", ["run", "download", String(prior), "--repo", env.GITHUB_REPOSITORY, "--name", MEMORY_ARTIFACT, "--dir", dir], { encoding: "utf8", stdio: "pipe" });
    const candidates = [join(dir, "collaboration-memory.json"), join(dir, MEMORY_ARTIFACT, "collaboration-memory.json")];
    const file = candidates.find((path) => existsSync(path));
    return file ? JSON.parse(readFileSync(file, "utf8")) : emptyCollaborationMemory();
  } catch {
    return emptyCollaborationMemory();
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}

export function updateCollaborationMemory(memory, event, now = new Date().toISOString()) {
  const next = structuredClone(memory || emptyCollaborationMemory());
  next.v = MEMORY_VERSION;
  next.cycles = Number(next.cycles || 0) + 1;
  next.updated_at = now;
  const ids = event?.sources || [];
  if (ids.length < 2) return next;
  const key = collaborationKey(ids, event.capability || "review");
  const current = next.collaborations[key] || {
    sources: [...new Set(ids.map(String))].sort(),
    capability: event.capability || "review",
    attempts: 0,
    completed: 0,
    disagreements: 0,
    corrections: 0,
    synthesis_received: 0,
    last_state: null,
    last_seen: null,
  };
  current.attempts += 1;
  if (event.completed) current.completed += 1;
  if (event.disagreement) current.disagreements += 1;
  if (event.correction) current.corrections += 1;
  if (event.synthesis_received) current.synthesis_received += 1;
  current.last_state = event.completed ? "MEASURED" : "INCOMPLETE";
  current.last_seen = now;
  next.collaborations[key] = current;
  return next;
}

export function collaborationSummary(memory = emptyCollaborationMemory()) {
  const rows = Object.values(memory.collaborations || {}).map((x) => ({
    sources: x.sources,
    capability: x.capability,
    attempts: x.attempts,
    completed: x.completed,
    disagreements: x.disagreements,
    corrections: x.corrections,
    synthesis_received: x.synthesis_received,
    completion_rate: x.attempts ? x.completed / x.attempts : 0,
    last_state: x.last_state,
  }));
  return { version: memory.v || MEMORY_VERSION, cycles: memory.cycles || 0, collaborations: rows.length, rows };
}
