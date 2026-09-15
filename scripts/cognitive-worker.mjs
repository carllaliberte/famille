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
import { assertMeasurementRecordSafe, assertRecordMatchesRanking, buildMeasurementRecord, loadMeasurementRecord, measurementRecordSummary } from "./measurement-record.mjs";
import { sealEvidence } from "./evidence-seal.mjs";

export const LIMIT = 20;
export const MAX_DISPATCH = 1;

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
    if (action === "MEASURE_MORE") return 1;
    if (action === "DEPRIORITIZE") return 3;
    return 2;
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

export function selectTargets(fronts, limit = MAX_DISPATCH) {
  const rows = Array.isArray(fronts) ? fronts.filter((f) => f && f.number && f.sha) : [];
  if (!rows.length) return [];
  const sorted = [...rows].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  return sorted.slice(0, Math.max(0, Number(limit) || 0));
}

export function parseCommentPayload(raw) {
  if (raw == null || raw === "") return null;
  try {
    const obj = typeof raw === "string" ? JSON.parse(String(raw).trim() || "null") : raw;
    if (obj && obj.id != null) return obj;
  } catch {
    return null;
  }
  return null;
}

export function executeDispatch(fronts, run = execFileSync, env = process.env) {
  const results = [];
  for (const front of fronts) {
    try {
      assertSystemMayProceed({ env, origin: "cognitive-worker", action: `dispatch PR #${front.number}` });
      const raw = run("gh", ["api", `repos/${env.GITHUB_REPOSITORY}/issues/${front.number}/comments`, "--method", "POST", "-f", "body=/swarm"], { stdio: "pipe", encoding: "utf8" });
      const created = parseCommentPayload(raw);
      if (!created?.id) {
        results.push({
          number: front.number,
          sha: front.sha,
          state: "DISPATCH_FAILED",
          phase: "ATTEMPTED",
          error: "no comment id in response",
        });
        continue;
      }
      const row = {
        number: front.number,
        sha: front.sha,
        state: "ACCEPTED",
        phase: "ACCEPTED",
        comment_id: created.id,
        url: created.html_url || created.url || null,
      };
      try {
        const read = run("gh", ["api", `repos/${env.GITHUB_REPOSITORY}/issues/comments/${created.id}`], { stdio: "pipe", encoding: "utf8" });
        const back = parseCommentPayload(read);
        if (back && String(back.id) === String(created.id)) {
          row.state = "VERIFIED";
          row.phase = "VERIFIED";
        }
      } catch {
        /* ACCEPTED stands; VERIFIED requires readback */
      }
      results.push(row);
    } catch (error) {
      results.push({
        number: front.number,
        sha: front.sha,
        state: error?.code === "GLOBAL_BREAKER_OFF" ? "BLOCKED_BREAKER" : "DISPATCH_FAILED",
        phase: error?.code === "GLOBAL_BREAKER_OFF" ? "BLOCKED_BREAKER" : "ATTEMPTED",
        error: String(error?.message || error),
      });
      if (error?.code === "GLOBAL_BREAKER_OFF") break;
    }
  }
  return results;
}

function normalizeEvidenceArgs(observation, plan, routing, dispatches) {
  if (Array.isArray(routing) && dispatches == null) {
    return { observation, plan, routing: null, dispatches: routing };
  }
  return { observation, plan, routing: routing ?? null, dispatches: dispatches || [] };
}

export function buildEvidence(observation, plan, routing, dispatches, state = controlState(), memory = null, memoryIndex = null, ranking = null, feedback = null, measurementRecord = null, previousMeasurementRecord = null) {
  const args = normalizeEvidenceArgs(observation, plan, routing, dispatches);
  const rows = args.dispatches;
  const ok = new Set(["DISPATCHED", "ACCEPTED", "VERIFIED"]);
  const succeeded = rows.filter((x) => ok.has(x.state)).length;
  const blocked = rows.filter((x) => x.state === "BLOCKED_BREAKER").length;
  const failed = rows.filter((x) => x.state === "DISPATCH_FAILED").length;
  const noAction = rows.filter((x) => x.state === "NO_ACTION_JUSTIFIED").length;
  const verified = rows.some((x) => x.state === "VERIFIED");
  const truth = {
    WORKER_STARTED: true,
    OBSERVATION_COMPLETED: Boolean(args.observation),
    DISCOVERY_COMPLETED: Array.isArray(plan?.fronts),
    COMPOSITION_COMPLETED: Boolean(plan),
    ROUTING_COMPLETED: args.routing != null,
    ACTION_ATTEMPTED: rows.length > 0,
    ACTION_ACCEPTED: rows.some((x) => x.state === "ACCEPTED" || x.state === "VERIFIED" || x.state === "DISPATCHED"),
    ACTION_VERIFIED: verified,
    MEASUREMENT_COMPLETED: Boolean(measurementRecord) || rows.length > 0,
    EVIDENCE_WRITTEN: true,
    CYCLE_COMPLETED: true,
  };
  return {
    v: "cognitive-worker.v14",
    executed: true,
    observed: true,
    verified,
    live: false,
    auto_merge: false,
    human_decision: "PENDING_HUMAN",
    authority: "carl",
    system_mode: state.mode,
    breaker_closed: state.breaker_closed,
    diagnostic: state.diagnostic,
    observation: args.observation,
    discovered: plan.fronts.length,
    routed: args.routing?.route_count || 0,
    synapses: args.routing?.synapse_count || 0,
    collective: Boolean(args.routing?.collective),
    dispatched: succeeded,
    dispatch_failed: failed,
    breaker_blocked: blocked,
    no_action: noAction,
    dispatches: rows,
    routing: args.routing,
    synaptic_memory: memory ? memorySummary(memory) : null,
    cognitive_memory_index: memoryIndex ? memoryIndexSummary(memoryIndex) : null,
    measured_ranking: ranking ? rankingSummary(ranking) : null,
    measurement_feedback: feedback ? feedbackSummary(feedback) : null,
    measurement_record: measurementRecord ? measurementRecordSummary(measurementRecord) : null,
    previous_measurement_record: previousMeasurementRecord ? measurementRecordSummary(previousMeasurementRecord) : null,
    truth,
    next: state.diagnostic ? "diagnostic-observe" : "observe",
  };
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
  const previousMeasurementRecord = opts.previousMeasurementRecord || loadMeasurementRecord(gh, env);
  assertMeasurementRecordSafe(previousMeasurementRecord);
  assertRecordMatchesRanking(previousMeasurementRecord, previousRanking);
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
  const targets = selectTargets(fronts);
  let dispatches;
  if (opts.dispatch === false) dispatches = [];
  else if (state.mode === "OFF") dispatches = targets.map((front) => ({ number: front.number, sha: front.sha, state: "BLOCKED_BREAKER" }));
  else if (!targets.length) dispatches = [{ number: null, sha: null, state: "NO_ACTION_JUSTIFIED" }];
  else dispatches = executeDispatch(targets, gh, env);
  const nextMemory = updateMemory(memory, routing, dispatches);
  const measurementRecord = buildMeasurementRecord({ env, observedAt: ranking.observed_at, observation, ranking, feedback, memoryIndex, dispatches, previousRecord: previousMeasurementRecord });
  assertMeasurementRecordSafe(measurementRecord);
  const evidence = buildEvidence(observation, plan, routing, dispatches, state, nextMemory, memoryIndex, ranking, feedback, measurementRecord, previousMeasurementRecord);
  if (opts.memoryPath) writeFileSync(opts.memoryPath, `${JSON.stringify(nextMemory, null, 2)}\n`);
  if (opts.memoryIndexPath) writeFileSync(opts.memoryIndexPath, `${JSON.stringify(memoryIndex, null, 2)}\n`);
  if (opts.rankingPath) writeFileSync(opts.rankingPath, `${JSON.stringify(ranking, null, 2)}\n`);
  if (opts.feedbackPath) writeFileSync(opts.feedbackPath, `${JSON.stringify(feedback, null, 2)}\n`);
  if (opts.measurementRecordPath) writeFileSync(opts.measurementRecordPath, `${JSON.stringify(measurementRecord, null, 2)}\n`);
  if (opts.evidencePath) writeFileSync(opts.evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  if (evidence.dispatch_failed > 0 && opts.failOnDispatchError !== false) throw new Error(`cognitive worker dispatch failed for ${evidence.dispatch_failed} front(s)`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evidence = runWorker({
    evidencePath: process.env.WORKER_EVIDENCE || "worker-evidence.json",
    memoryPath: process.env.SYNAPTIC_MEMORY || "synaptic-memory.json",
    memoryIndexPath: process.env.COGNITIVE_MEMORY_INDEX || "cognitive-memory-index.json",
    rankingPath: process.env.MEASURED_RANKING || "measured-intelligence-ranking.json",
    feedbackPath: process.env.MEASUREMENT_FEEDBACK || "measurement-feedback.json",
    measurementRecordPath: process.env.MEASUREMENT_RECORD || "measurement-record.json",
    failOnDispatchError: process.env.FAIL_ON_DISPATCH_ERROR !== "false",
  });
  console.log(JSON.stringify(evidence, null, 2));
}
