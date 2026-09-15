#!/usr/bin/env node
/**
 * ACORN COGNITIVE WORKER
 * One bounded cycle: observe -> discover -> compose -> route -> dispatch -> measure.
 * Never writes source, never merges, never claims LIVE. Human authority remains Carl.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { cycle } from "./discover-cycle.mjs";
import { composeFabric } from "./cognitive-fabric.mjs";
import { assertSystemMayProceed, controlState } from "../.github/swarm/system-breaker.mjs";
import { loadMemory, rankSources, updateMemory, memorySummary } from "./synaptic-memory.mjs";
import { loadCollaborationMemory } from "./collaboration-memory.mjs";
import { loadModelExecutionMemory } from "./model-execution-memory.mjs";
import { assertMemoryIndexSafe, buildMemoryIndex, memoryIndexSummary } from "./cognitive-memory-index.mjs";
import { assertRankingSafe, compareRankings, loadMeasuredRanking, rankAgents, rankingSummary } from "./measured-ranking.mjs";
import { assertMeasurementFeedbackSafe, buildMeasurementFeedback, feedbackSummary } from "./measurement-feedback.mjs";
import { sealEvidence } from "./evidence-seal.mjs";

export const LIMIT = 20;

export function parseFronts(text, limit = LIMIT) {
  const seen = new Set();
  const fronts = [];
  for (const line of String(text || "").split("\n")) {
    if (!line.trim()) continue;
    const [number, sha, draft, updatedAt] = line.split("\t");
    if (!number || !sha || seen.has(sha)) continue;
    seen.add(sha);
    fronts.push({ number: Number(number), sha, draft: draft === "true", updatedAt: updatedAt || null });
    if (fronts.length >= limit) break;
  }
  return fronts;
}

export function composePlan(fronts, state = controlState()) {
  return {
    authority: "carl", auto_merge: false, live: false, system_mode: state.mode,
    fronts: fronts.map((front) => ({ ...front, stages: ["review", "collaboration", "measurement", "correction"], dispatch: "swarm", source: "open-pr-head-sha" })),
  };
}

export function orderByMeasuredRank(ids, ranking = null, feedback = null) {
  const rankById = new Map((ranking?.measured || []).map((row) => [String(row.id), row.rank]));
  const actionById = new Map((feedback?.actions || []).map((row) => [String(row.id), row.action]));
  const priority = (id) => {
    const action = actionById.get(id);
    if (action === "PROMOTE_PRIORITY") return 0;
    if (action === "DEPRIORITIZE") return 2;
    return 1;
  };
  return [...new Set(ids.map(String))].sort((a, b) => {
    const ap = priority(a), bp = priority(b);
    if (ap !== bp) return ap - bp;
    const ar = rankById.get(a) ?? Number.POSITIVE_INFINITY;
    const br = rankById.get(b) ?? Number.POSITIVE_INFINITY;
    return (ar - br) || a.localeCompare(b);
  });
}

export function composeRouting(observation, fronts, env = process.env, memory = null, ranking = null, feedback = null) {
  const ids = orderByMeasuredRank(observation.auto || [], ranking, feedback);
  const sources = rankSources(ids.map((id) => ({ id, channel: "model", capability: "review" })), memory || undefined);
  return composeFabric({ fronts, sources, env });
}

export function executeDispatch(fronts, run = execFileSync, env = process.env) {
  const results = [];
  for (const front of fronts) {
    try {
      assertSystemMayProceed({ env, origin: "cognitive-worker", action: `dispatch PR #${front.number}` });
      run("gh", ["api", `repos/${env.GITHUB_REPOSITORY}/issues/${front.number}/comments`, "--method", "POST", "-f", "body=/swarm"], { stdio: "pipe", encoding: "utf8" });
      results.push({ number: front.number, sha: front.sha, state: "DISPATCHED" });
    } catch (error) {
      results.push({ number: front.number, sha: front.sha, state: error?.code === "GLOBAL_BREAKER_OFF" ? "BLOCKED_BREAKER" : "DISPATCH_FAILED", error: String(error?.message || error) });
      if (error?.code === "GLOBAL_BREAKER_OFF") break;
    }
  }
  return results;
}

export function buildEvidence(observation, plan, routing, dispatches, state = controlState(), memory = null, memoryIndex = null, ranking = null, feedback = null) {
  const succeeded = dispatches.filter((x) => x.state === "DISPATCHED").length;
  const blocked = dispatches.filter((x) => x.state === "BLOCKED_BREAKER").length;
  const failed = dispatches.filter((x) => x.state === "DISPATCH_FAILED").length;
  return { v: "cognitive-worker.v11", executed: true, observed: true, verified: false, live: false, auto_merge: false, human_decision: "PENDING_HUMAN", authority: "carl", system_mode: state.mode, breaker_closed: state.breaker_closed, diagnostic: state.diagnostic, observation, discovered: plan.fronts.length, routed: routing?.route_count || 0, synapses: routing?.synapse_count || 0, collective: Boolean(routing?.collective), dispatched: succeeded, dispatch_failed: failed, breaker_blocked: blocked, dispatches, routing: routing || null, synaptic_memory: memory ? memorySummary(memory) : null, cognitive_memory_index: memoryIndex ? memoryIndexSummary(memoryIndex) : null, measured_ranking: ranking ? rankingSummary(ranking) : null, measurement_feedback: feedback ? feedbackSummary(feedback) : null, next: state.diagnostic ? "diagnostic-observe" : "observe" };
}

function loadAgentRoster(gh, env) {
  try {
    const raw = gh("gh", ["api", `repos/${env.GITHUB_REPOSITORY}/contents/schema/agents.json?ref=${env.GITHUB_SHA || "main"}`, "--jq", ".content"], { encoding: "utf8", stdio: "pipe" });
    return JSON.parse(Buffer.from(raw.trim(), "base64").toString("utf8")).agents || [];
  } catch {
    return [];
  }
}

export function runWorker(opts = {}) {
  const env = opts.env || process.env;
  const gh = opts.gh || execFileSync;
  const state = controlState(env);
  const observation = cycle({ env, trigger: "worker", sha: env.GITHUB_SHA || "unknown" });
  const memory = opts.memory || loadMemory(gh, env);
  const collaborationMemory = opts.collaborationMemory || loadCollaborationMemory(gh, env);
  const modelExecutionMemory = opts.modelExecutionMemory || loadModelExecutionMemory(gh, env);
  const memoryIndex = opts.memoryIndex || buildMemoryIndex({ synaptic: memory, collaboration: collaborationMemory, modelExecution: modelExecutionMemory, observedAt: new Date().toISOString() });
  assertMemoryIndexSafe(memoryIndex);
  const agents = opts.agents || loadAgentRoster(gh, env);
  const previousRanking = opts.previousRanking || loadMeasuredRanking(gh, env);
  let ranking = rankAgents(agents, memoryIndex, memoryIndex.observed_at);
  ranking.changes = compareRankings(previousRanking, ranking);
  ranking = sealEvidence(ranking);
  assertRankingSafe(ranking);
  const feedback = buildMeasurementFeedback(ranking, ranking.observed_at);
  assertMeasurementFeedbackSafe(feedback);
  let raw = "";
  if (opts.frontsText != null) raw = opts.frontsText;
  else raw = gh("gh", ["pr", "list", "--repo", env.GITHUB_REPOSITORY, "--state", "open", "--limit", String(LIMIT), "--json", "number,headRefOid,isDraft,updatedAt", "--jq", ".[] | [.number,.headRefOid,.isDraft,.updatedAt] | @tsv"], { encoding: "utf8", stdio: "pipe" });
  const fronts = parseFronts(raw);
  const plan = composePlan(fronts, state);
  const routing = state.mode === "OFF" ? null : composeRouting(observation, fronts, env, memory, ranking, feedback);
  const dispatches = opts.dispatch === false ? [] : state.mode === "OFF" ? fronts.map((front) => ({ number: front.number, sha: front.sha, state: "BLOCKED_BREAKER" })) : executeDispatch(fronts, gh, env);
  const nextMemory = updateMemory(memory, routing, dispatches);
  const evidence = buildEvidence(observation, plan, routing, dispatches, state, nextMemory, memoryIndex, ranking, feedback);
  if (opts.memoryPath) writeFileSync(opts.memoryPath, `${JSON.stringify(nextMemory, null, 2)}\n`);
  if (opts.memoryIndexPath) writeFileSync(opts.memoryIndexPath, `${JSON.stringify(memoryIndex, null, 2)}\n`);
  if (opts.rankingPath) writeFileSync(opts.rankingPath, `${JSON.stringify(ranking, null, 2)}\n`);
  if (opts.feedbackPath) writeFileSync(opts.feedbackPath, `${JSON.stringify(feedback, null, 2)}\n`);
  if (opts.evidencePath) writeFileSync(opts.evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  if (evidence.dispatch_failed > 0 && opts.failOnDispatchError !== false) throw new Error(`cognitive worker dispatch failed for ${evidence.dispatch_failed} front(s)`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evidence = runWorker({ evidencePath: process.env.WORKER_EVIDENCE || "worker-evidence.json", memoryPath: process.env.SYNAPTIC_MEMORY || "synaptic-memory.json", memoryIndexPath: process.env.COGNITIVE_MEMORY_INDEX || "cognitive-memory-index.json", rankingPath: process.env.MEASURED_RANKING || "measured-intelligence-ranking.json", feedbackPath: process.env.MEASUREMENT_FEEDBACK || "measurement-feedback.json" });
  console.log(JSON.stringify(evidence, null, 2));
}
