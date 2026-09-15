#!/usr/bin/env node
/**
 * ACORN AUTONOMOUS RUNTIME
 *
 * Long-lived supervisor around the bounded cognitive worker.
 * It does not merge, write source, or declare LIVE. It checkpoints every
 * cycle so an execution can continue across process/workflow boundaries.
 *
 * A duration of 0 means "until externally stopped". GitHub Actions still
 * supplies the outer process timeout; the runtime itself remains portable.
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runWorker } from "./cognitive-worker.mjs";
import { controlState } from "../.github/swarm/system-breaker.mjs";

const root = resolve(process.env.ACORN_RUNTIME_ROOT || ".");

function now() { return new Date().toISOString(); }
function sleep(ms) { return new Promise((resolveSleep) => setTimeout(resolveSleep, ms)); }

export async function runAutonomousRuntime({ worker = runWorker, env = process.env, sleepFn = sleep } = {}) {
  const evidenceDir = resolve(root, env.ACORN_RUNTIME_EVIDENCE_DIR || "evidence/autopilot/runtime");
  const checkpointPath = resolve(root, env.ACORN_RUNTIME_CHECKPOINT || "evidence/autopilot/runtime/checkpoint.json");
  const journalPath = resolve(root, env.ACORN_RUNTIME_JOURNAL || "evidence/autopilot/runtime/journal.jsonl");
  const durationMinutes = Math.max(0, Number(env.ACORN_RUNTIME_MINUTES ?? 0));
  const intervalSeconds = Math.max(5, Number(env.ACORN_RUNTIME_INTERVAL_SECONDS ?? 60));
  const maxCycles = Math.max(0, Number(env.ACORN_RUNTIME_MAX_CYCLES ?? 0));
  const dispatchEvery = Math.max(1, Number(env.ACORN_RUNTIME_DISPATCH_EVERY ?? 6));
  const ensure = () => { mkdirSync(dirname(checkpointPath), { recursive: true }); mkdirSync(evidenceDir, { recursive: true }); };
  const loadCheckpoint = () => {
    try { return JSON.parse(readFileSync(checkpointPath, "utf8")); } catch { return { cycle: 0, started_at: null, last_completed_at: null }; }
  };
  const persistCheckpoint = (value) => { writeFileSync(checkpointPath, `${JSON.stringify(value, null, 2)}\n`); };
  const journal = (entry) => { appendFileSync(journalPath, `${JSON.stringify(entry)}\n`); };

  ensure();
  const checkpoint = loadCheckpoint();
  // Each process/workflow gets a fresh time slice. The checkpoint resumes the
  // cycle counter/evidence lineage, not the previous process deadline.
  const startedAt = now();
  const previousCycle = Number(checkpoint.cycle || 0);
  let cycle = previousCycle;
  let completed = 0;
  const deadline = durationMinutes > 0 ? Date.parse(startedAt) + durationMinutes * 60_000 : Number.POSITIVE_INFINITY;

  while (Date.now() < deadline && (maxCycles === 0 || completed < maxCycles)) {
    const state = controlState(env);
    if (state.mode !== "RUN" || state.breaker_closed || state.diagnostic) {
      const stopped = { state: "STOPPED_BREAKER", cycle, at: now(), mode: state.mode };
      journal(stopped);
      persistCheckpoint({ ...checkpoint, cycle, started_at: startedAt, last_completed_at: stopped.at, state: stopped.state });
      return stopped;
    }

    cycle += 1;
    const shouldDispatch = cycle === 1 || cycle % dispatchEvery === 0;
    const cycleDir = resolve(evidenceDir, `cycle-${String(cycle).padStart(6, "0")}`);
    mkdirSync(cycleDir, { recursive: true });
    const observedAt = now();

    try {
      const evidence = worker({
        env,
        dispatch: shouldDispatch,
        evidencePath: resolve(cycleDir, "worker-evidence.json"),
        memoryPath: resolve(cycleDir, "synaptic-memory.json"),
        memoryIndexPath: resolve(cycleDir, "cognitive-memory-index.json"),
        rankingPath: resolve(cycleDir, "measured-intelligence-ranking.json"),
        feedbackPath: resolve(cycleDir, "measurement-feedback.json"),
        measurementRecordPath: resolve(cycleDir, "measurement-record.json"),
        failOnDispatchError: false,
      });
      const record = {
        runtime: "autonomous-runtime.v1",
        cycle,
        started_at: startedAt,
        observed_at: observedAt,
        completed_at: now(),
        dispatch_requested: shouldDispatch,
        worker_executed: true,
        worker_verified: Boolean(evidence?.verified),
        live: false,
        auto_merge: false,
        human_decision: "PENDING_HUMAN",
        authority: "carl",
        evidence_path: cycleDir,
        dispatches: evidence?.dispatches || [],
        measurement: evidence?.measurement_record || null,
      };
      writeFileSync(resolve(cycleDir, "runtime.json"), `${JSON.stringify(record, null, 2)}\n`);
      journal(record);
      persistCheckpoint({ cycle, started_at: startedAt, last_completed_at: record.completed_at, state: "RUNNING", last_cycle: cycleDir });
      completed += 1;
    } catch (error) {
      const failure = {
        runtime: "autonomous-runtime.v1",
        cycle,
        observed_at: observedAt,
        completed_at: now(),
        state: "WORKER_FAILED",
        error: String(error?.stack || error),
        live: false,
        auto_merge: false,
        authority: "carl",
      };
      writeFileSync(resolve(cycleDir, "runtime-failure.json"), `${JSON.stringify(failure, null, 2)}\n`);
      journal(failure);
      persistCheckpoint({ cycle, started_at: startedAt, last_completed_at: failure.completed_at, state: failure.state, last_cycle: cycleDir });
      completed += 1;
    }

    if (Date.now() < deadline && (maxCycles === 0 || completed < maxCycles)) {
      await sleepFn(intervalSeconds * 1000);
    }
  }

  const finished = { runtime: "autonomous-runtime.v1", cycle, completed, state: "TIME_SLICE_COMPLETE", at: now(), duration_minutes: durationMinutes, live: false, auto_merge: false, authority: "carl" };
  journal(finished);
  persistCheckpoint({ cycle, started_at: startedAt, last_completed_at: finished.at, state: finished.state });
  return finished;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runAutonomousRuntime();
  console.log(JSON.stringify(result, null, 2));
}
