#!/usr/bin/env node
/**
 * ACORN SYNAPTIC MEMORY
 * Persistent routing memory carried by workflow artifacts, never source-of-record.
 * Learns measured dispatch outcomes only; it never invents provider success.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

export const MEMORY_VERSION = "synaptic-memory.v1";
export const MEMORY_ARTIFACT = "cognitive-synaptic-memory";

export function emptyMemory() {
  return { v: MEMORY_VERSION, cycles: 0, updated_at: null, edges: {} };
}

export function loadMemory(run = execFileSync, env = process.env) {
  const dir = ".acorn-synaptic-memory";
  try {
    mkdirSync(dir, { recursive: true });
    const runs = run("gh", ["run", "list", "--repo", env.GITHUB_REPOSITORY, "--workflow", "cognitive-worker.yml", "--status", "success", "--limit", "5", "--json", "databaseId"], { encoding: "utf8", stdio: "pipe" });
    const prior = JSON.parse(runs || "[]")[0]?.databaseId;
    if (!prior) return emptyMemory();
    run("gh", ["run", "download", String(prior), "--repo", env.GITHUB_REPOSITORY, "--name", MEMORY_ARTIFACT, "--dir", dir], { encoding: "utf8", stdio: "pipe" });
    const candidates = [join(dir, "synaptic-memory.json"), join(dir, MEMORY_ARTIFACT, "synaptic-memory.json")];
    const file = candidates.find((path) => existsSync(path));
    return file ? JSON.parse(readFileSync(file, "utf8")) : emptyMemory();
  } catch {
    return emptyMemory();
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}

export function rankSources(sources = [], memory = emptyMemory()) {
  return [...sources].sort((a, b) => scoreFor(memory, b.id, b.capability || "review") - scoreFor(memory, a.id, a.capability || "review") || String(a.id).localeCompare(String(b.id)));
}

export function scoreFor(memory, source, capability = "review") {
  const edge = memory?.edges?.[`${source}:${capability}`];
  if (!edge || !edge.attempts) return 0.5;
  return edge.successes / edge.attempts;
}

export function updateMemory(memory, routing, dispatches, now = new Date().toISOString()) {
  const next = structuredClone(memory || emptyMemory());
  next.v = MEMORY_VERSION;
  next.cycles = Number(next.cycles || 0) + 1;
  next.updated_at = now;
  const byFront = new Map((dispatches || []).map((item) => [String(item.sha), item]));
  for (const route of routing?.routes || []) {
    const key = `${route.route.source}:${route.route.capability}`;
    const edge = next.edges[key] || { source: route.route.source, capability: route.route.capability, attempts: 0, successes: 0, failures: 0, last_state: null, last_seen: null };
    const result = byFront.get(String(route.context?.front_sha));
    const state = result?.state || "PROPOSED";
    edge.attempts += 1;
    if (state === "DISPATCHED" || state === "ACCEPTED" || state === "VERIFIED") edge.successes += 1;
    else if (state === "DISPATCH_FAILED" || state === "BLOCKED_BREAKER") edge.failures += 1;
    edge.last_state = state;
    edge.last_seen = now;
    next.edges[key] = edge;
  }
  return next;
}

export function memorySummary(memory) {
  const edges = Object.values(memory?.edges || {});
  return { version: memory?.v || MEMORY_VERSION, cycles: memory?.cycles || 0, edges: edges.length, ranked: edges.map((e) => ({ source: e.source, capability: e.capability, attempts: e.attempts, successes: e.successes, failures: e.failures, score: scoreFor(memory, e.source, e.capability) })).sort((a, b) => b.score - a.score || a.source.localeCompare(b.source)) };
}
