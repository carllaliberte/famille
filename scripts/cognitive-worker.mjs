#!/usr/bin/env node
/**
 * ACORN COGNITIVE WORKER
 * One bounded cycle: observe -> discover -> compose -> dispatch -> measure.
 * Never writes source, never merges, never claims LIVE. Human authority remains Carl.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { cycle } from "./discover-cycle.mjs";
import { assertSystemMayProceed, controlState } from "../.github/swarm/system-breaker.mjs";

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

export function buildEvidence(observation, plan, dispatches, state = controlState()) {
  const succeeded = dispatches.filter((x) => x.state === "DISPATCHED").length;
  const blocked = dispatches.filter((x) => x.state === "BLOCKED_BREAKER").length;
  const failed = dispatches.filter((x) => x.state === "DISPATCH_FAILED").length;
  return { v: "cognitive-worker.v2", executed: true, observed: true, verified: false, live: false, auto_merge: false, human_decision: "PENDING_HUMAN", authority: "carl", system_mode: state.mode, breaker_closed: state.breaker_closed, diagnostic: state.diagnostic, observation, discovered: plan.fronts.length, dispatched: succeeded, dispatch_failed: failed, breaker_blocked: blocked, dispatches, next: state.diagnostic ? "diagnostic-observe" : "observe" };
}

export function runWorker(opts = {}) {
  const env = opts.env || process.env;
  const gh = opts.gh || execFileSync;
  const state = controlState(env);
  const observation = cycle({ env, trigger: "worker", sha: env.GITHUB_SHA || "unknown" });
  let raw = "";
  if (opts.frontsText != null) raw = opts.frontsText;
  else raw = gh("gh", ["pr", "list", "--repo", env.GITHUB_REPOSITORY, "--state", "open", "--limit", String(LIMIT), "--json", "number,headRefOid,isDraft,updatedAt", "--jq", ".[] | [.number,.headRefOid,.isDraft,.updatedAt] | @tsv"], { encoding: "utf8", stdio: "pipe" });
  const fronts = parseFronts(raw);
  const plan = composePlan(fronts, state);
  const dispatches = opts.dispatch === false ? [] : state.mode === "OFF" ? fronts.map((front) => ({ number: front.number, sha: front.sha, state: "BLOCKED_BREAKER" })) : executeDispatch(fronts, gh, env);
  const evidence = buildEvidence(observation, plan, dispatches, state);
  if (opts.evidencePath) writeFileSync(opts.evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  if (evidence.dispatch_failed > 0 && opts.failOnDispatchError !== false) throw new Error(`cognitive worker dispatch failed for ${evidence.dispatch_failed} front(s)`);
  return evidence;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const evidence = runWorker({ evidencePath: process.env.WORKER_EVIDENCE || "worker-evidence.json" });
  console.log(JSON.stringify(evidence, null, 2));
}
