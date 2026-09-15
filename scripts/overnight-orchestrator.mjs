#!/usr/bin/env node
/**
 * ACORN OVERNIGHT ORCHESTRATOR
 * Long-run controller built from bounded cognitive-worker cycles.
 * It never changes authority: Global Breaker remains the execution gate, Acorn owns tasks,
 * Carl owns decisions/merge, and every cycle leaves dated evidence.
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { buildExecutionPlan, selectWork, nextCadenceDelayMs } from "./adaptive-execution.mjs";
import { runWorker } from "./cognitive-worker.mjs";
import { assertSystemMayProceed, controlState } from "../.github/swarm/system-breaker.mjs";

const MAX_SLOT_MINUTES = 60;
const DEFAULT_SLOT_MINUTES = 60;
const DEFAULT_BASE_DELAY_MS = 5 * 60_000;

function listFronts(env, gh = execFileSync) {
  const raw = gh("gh", ["pr", "list", "--repo", env.GITHUB_REPOSITORY, "--state", "open", "--limit", "20", "--json", "number,headRefOid,isDraft,updatedAt", "--jq", ".[] | [.number,.headRefOid,.isDraft,.updatedAt] | @tsv"], { encoding: "utf8", stdio: "pipe" });
  return String(raw).split("\n").filter(Boolean).map((line) => {
    const [number, sha, draft, updatedAt] = line.split("\t");
    return { number: Number(number), sha, draft: draft === "true", updatedAt: updatedAt || null };
  }).filter((x) => x.number && x.sha);
}

export function runOvernightSlot({ env = process.env, gh = execFileSync, now = () => Date.now(), run = runWorker, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), slotMinutes = Number(env.OVERNIGHT_SLOT_MINUTES || DEFAULT_SLOT_MINUTES) } = {}) {
  const boundedMinutes = Math.max(1, Math.min(MAX_SLOT_MINUTES, Number.isFinite(slotMinutes) ? slotMinutes : DEFAULT_SLOT_MINUTES));
  return (async () => {
    assertSystemMayProceed({ env, origin: "overnight-orchestrator", action: "start bounded overnight slot" });
    const started = now();
    const deadline = started + boundedMinutes * 60_000;
    const dispatched = new Set();
    const cycles = [];
    let currentCadence = 0.25;
    let cycleNumber = 0;

    while (now() < deadline) {
      cycleNumber += 1;
      const state = controlState(env);
      if (state.mode !== "RUN") break;
      const fronts = listFronts(env, gh);
      const plan = buildExecutionPlan({
        pendingTasks: fronts.length,
        activeTasks: cycles.length,
        queuePressure: Math.min(1, fronts.length / 20),
        latency: 0,
        anomalyScore: 0,
        errorRate: cycles.length ? cycles.filter((x) => x.dispatch_failed > 0).length / cycles.length : 0,
        breakerMode: state.mode,
        currentCadence,
      });
      currentCadence = plan.cadence;
      const candidates = fronts.filter((front) => !dispatched.has(`${front.number}:${front.sha}`));
      const selected = plan.cadence_allows_work ? selectWork(candidates, plan.cadence) : [];
      selected.forEach((front) => dispatched.add(`${front.number}:${front.sha}`));
      const frontsText = selected.map((front) => [front.number, front.sha, front.draft, front.updatedAt].join("\t")).join("\n");
      let evidence;
      try {
        evidence = run({ env, gh, frontsText, failOnDispatchError: false });
      } catch (error) {
        evidence = { executed: false, verified: false, live: false, error: String(error?.message || error), dispatch_failed: 1 };
      }
      cycles.push({ cycle: cycleNumber, at: new Date(now()).toISOString(), cadence: plan, selected: selected.length, evidence });
      if (now() >= deadline) break;
      const delay = Math.min(nextCadenceDelayMs(currentCadence, Number(env.OVERNIGHT_BASE_DELAY_MS || DEFAULT_BASE_DELAY_MS)), Math.max(1_000, deadline - now()));
      await sleep(delay);
    }

    const result = {
      version: "overnight-orchestrator.v2",
      started_at: new Date(started).toISOString(),
      ended_at: new Date(now()).toISOString(),
      slot_minutes: boundedMinutes,
      cycles,
      unique_fronts_dispatched: dispatched.size,
      authority: "carl",
      global_breaker_required: true,
      production_write_allowed: false,
      auto_merge: false,
      live: false,
      status: controlState(env).mode === "RUN" ? "COMPLETED_SLOT" : "STOPPED_BY_BREAKER",
    };
    if (env.OVERNIGHT_EVIDENCE) writeFileSync(env.OVERNIGHT_EVIDENCE, `${JSON.stringify(result, null, 2)}\n`);
    return result;
  })();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runOvernightSlot({});
  console.log(JSON.stringify(result, null, 2));
}
