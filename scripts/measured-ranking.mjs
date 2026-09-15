#!/usr/bin/env node
/**
 * ACORN MEASURED INTELLIGENCE RANKING
 * Ranks only from measured execution/collaboration/routing evidence.
 * The roster remains identity metadata; this artifact is a derived measurement.
 * It never grants authority, writes source, merges, or mints LIVE.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

export const MEASURED_RANKING_VERSION = "measured-ranking.v1";
export const MEASURED_RANKING_ARTIFACT = "measured-intelligence-ranking";

const COMPONENT_WEIGHTS = { execution: 0.5, routing: 0.3, collaboration: 0.2 };

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function evidenceWeight(attempts) {
  return clamp(finite(attempts) / 5);
}

function addEvidence(bucket, component, successes, attempts) {
  const a = Math.max(0, finite(attempts));
  if (!a) return;
  bucket[component] = { successes: Math.max(0, finite(successes)), attempts: a, rate: clamp(finite(successes) / a) };
}

function modelBucket() {
  return { execution: null, routing: null, collaboration: null };
}

export function emptyRanking() {
  return { v: MEASURED_RANKING_VERSION, observed_at: null, authority: "carl", auto_merge: false, live: false, measured: [], unmeasured: [], changes: [] };
}

export function loadMeasuredRanking(run = execFileSync, env = process.env) {
  const dir = ".acorn-measured-ranking";
  try {
    mkdirSync(dir, { recursive: true });
    const runs = run("gh", ["run", "list", "--repo", env.GITHUB_REPOSITORY, "--workflow", "cognitive-worker.yml", "--status", "success", "--limit", "5", "--json", "databaseId"], { encoding: "utf8", stdio: "pipe" });
    const prior = JSON.parse(runs || "[]")[0]?.databaseId;
    if (!prior) return emptyRanking();
    run("gh", ["run", "download", String(prior), "--repo", env.GITHUB_REPOSITORY, "--name", MEASURED_RANKING_ARTIFACT, "--dir", dir], { encoding: "utf8", stdio: "pipe" });
    const candidates = [join(dir, "measured-intelligence-ranking.json"), join(dir, MEASURED_RANKING_ARTIFACT, "measured-intelligence-ranking.json")];
    const file = candidates.find((path) => existsSync(path));
    return file ? JSON.parse(readFileSync(file, "utf8")) : emptyRanking();
  } catch {
    return emptyRanking();
  } finally {
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
  }
}

export function collectEvidence(memoryIndex = {}) {
  const byId = {};
  const ensure = (id) => {
    const key = String(id || "").trim();
    if (!key) return null;
    byId[key] ||= modelBucket();
    return byId[key];
  };
  for (const edge of memoryIndex.edges || []) {
    if (edge.type === "model-execution") {
      const bucket = ensure(edge.id);
      if (bucket) addEvidence(bucket, "execution", edge.succeeded, edge.attempts);
    }
    if (edge.type === "routing") {
      const bucket = ensure(edge.source);
      if (bucket) addEvidence(bucket, "routing", edge.successes, edge.attempts);
    }
    if (edge.type === "collaboration") {
      const sources = [...new Set((edge.sources || []).map(String))];
      for (const id of sources) {
        const bucket = ensure(id);
        if (bucket) addEvidence(bucket, "collaboration", edge.completed, edge.attempts);
      }
    }
  }
  return byId;
}

export function scoreEvidence(evidence = modelBucket()) {
  let numerator = 0;
  let denominator = 0;
  let attempts = 0;
  for (const [component, weight] of Object.entries(COMPONENT_WEIGHTS)) {
    const row = evidence[component];
    if (!row || row.attempts <= 0) continue;
    numerator += row.rate * weight;
    denominator += weight;
    attempts += row.attempts;
  }
  if (!denominator) return { score: null, confidence: 0, attempts: 0, components: {} };
  const raw = numerator / denominator;
  const confidence = evidenceWeight(attempts);
  const score = 0.5 + (raw - 0.5) * confidence;
  return { score: clamp(score), confidence, attempts, components: evidence };
}

export function rankAgents(agents = [], memoryIndex = {}, observedAt = null) {
  const evidenceById = collectEvidence(memoryIndex);
  const measured = [];
  const unmeasured = [];
  for (const agent of agents) {
    const id = String(agent?.id || "");
    if (!id) continue;
    const scored = scoreEvidence(evidenceById[id] || modelBucket());
    const row = {
      id,
      name: agent.name || id,
      kind: agent.kind || null,
      specialty: agent.specialty || null,
      capabilities: [...(agent.capabilities || [])].map(String).sort(),
      status: scored.score == null ? "UNMEASURED" : "MEASURED",
      score: scored.score,
      confidence: scored.confidence,
      attempts: scored.attempts,
      components: scored.components,
      provenance: "cognitive-memory-index",
    };
    if (scored.score == null) unmeasured.push(row);
    else measured.push(row);
  }
  measured.sort((a, b) => (b.score - a.score) || (b.confidence - a.confidence) || a.id.localeCompare(b.id));
  measured.forEach((row, index) => { row.rank = index + 1; });
  unmeasured.sort((a, b) => a.id.localeCompare(b.id));
  return {
    v: MEASURED_RANKING_VERSION,
    observed_at: observedAt || new Date().toISOString(),
    authority: "carl",
    auto_merge: false,
    live: false,
    method: { weights: { ...COMPONENT_WEIGHTS }, confidence_evidence_cap: 5, baseline: 0.5, note: "Measured performance can change rank; unmeasured identities never outrank measured identities." },
    measured,
    unmeasured,
    changes: [],
  };
}

export function compareRankings(previous = emptyRanking(), current = emptyRanking()) {
  const prior = new Map((previous.measured || []).map((row) => [String(row.id), row.rank]));
  const next = new Map((current.measured || []).map((row) => [String(row.id), row.rank]));
  const ids = [...new Set([...prior.keys(), ...next.keys()])].sort();
  return ids.map((id) => {
    const before = prior.get(id) ?? null;
    const after = next.get(id) ?? null;
    if (before == null && after != null) return { id, type: "MEASURED", from: null, to: after, delta: null };
    if (before != null && after == null) return { id, type: "UNMEASURED", from: before, to: null, delta: null };
    if (before === after) return { id, type: "UNCHANGED", from: before, to: after, delta: 0 };
    return { id, type: after < before ? "PROMOTED" : "DEMOTED", from: before, to: after, delta: before - after };
  }).filter((change) => change.type !== "UNCHANGED");
}

export function rankingSummary(ranking = {}) {
  return {
    version: ranking.v || MEASURED_RANKING_VERSION,
    observed_at: ranking.observed_at || null,
    measured: (ranking.measured || []).length,
    unmeasured: (ranking.unmeasured || []).length,
    changes: (ranking.changes || []).length,
    top: (ranking.measured || []).slice(0, 10).map(({ id, rank, score, confidence, attempts }) => ({ id, rank, score, confidence, attempts })),
    authority: ranking.authority || "carl",
    auto_merge: false,
    live: false,
  };
}

export function assertRankingSafe(ranking) {
  if (ranking?.live !== false) throw new Error("MEASURED_RANKING_LIVE_FORBIDDEN");
  if (ranking?.auto_merge !== false) throw new Error("MEASURED_RANKING_AUTO_MERGE_FORBIDDEN");
  if (ranking?.authority !== "carl") throw new Error("MEASURED_RANKING_AUTHORITY_INVALID");
  return true;
}
