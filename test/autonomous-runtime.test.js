import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { controlState } from "../.github/swarm/system-breaker.mjs";
import { inventoryProbe, runAutonomousRuntime, measureAutonomy, autonomyBudget } from "../scripts/autonomous-runtime.mjs";

function runtimeEnv(extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), "acorn-runtime-"));
  return {
    ACORN_RUNTIME_EVIDENCE_DIR: join(dir, "evidence"),
    ACORN_RUNTIME_CHECKPOINT: join(dir, "checkpoint.json"),
    ACORN_RUNTIME_JOURNAL: join(dir, "journal.jsonl"),
    ...extra,
  };
}

const stubContinuity = async () => ({ state: "CONTINUOUS", defense: { active: true, state: "HEALTHY" }, coverage: {} });

const baseEnv = runtimeEnv({
  ACORN_SYSTEM_MODE: "RUN",
  ACORN_RUNTIME_MINUTES: "1",
  ACORN_RUNTIME_MAX_CYCLES: "2",
});

test("autonomous runtime probe never claims LIVE or auto-merge and never holds defense", () => {
  const probe = inventoryProbe();
  assert.equal(probe.auto_merge, false);
  assert.equal(probe.live, false);
  assert.equal(probe.hold_on_defense, false);
  assert.equal(probe.authority, "carl");
});

test("RUN keeps the breaker path open and permits controlled execution", () => {
  const state = controlState({ ACORN_SYSTEM_MODE: "RUN" });
  assert.equal(state.breaker_closed, false);
  assert.equal(state.normal, true);
  assert.equal(state.production_write_allowed, false);
  assert.equal(state.auto_merge, false);
  assert.equal(state.live, false);
});

test("OFF fail-closes the breaker and blocks execution", () => {
  const state = controlState({ ACORN_SYSTEM_MODE: "OFF" });
  assert.equal(state.breaker_closed, true);
  assert.equal(state.normal, false);
});

test("runtime performs bounded cycles and checkpoints them", async () => {
  const calls = [];
  const result = await runAutonomousRuntime({
    env: baseEnv,
    worker: (opts) => {
      calls.push(opts);
      return {
        verified: false,
        dispatches: [],
        measurement_record: { ok: true },
      };
    },
    continuity: stubContinuity,
    sleepFn: async () => {},
  });

  assert.equal(result.state, "TIME_SLICE_COMPLETE");
  assert.equal(result.completed, 2);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].dispatch, true);
  assert.equal(calls[1].dispatch, false);
});

test("runtime starts a fresh time slice when resumed from a completed checkpoint", async () => {
  const env = runtimeEnv({
    ACORN_SYSTEM_MODE: "RUN",
    ACORN_RUNTIME_MINUTES: "1",
    ACORN_RUNTIME_MAX_CYCLES: "1",
  });
  const first = await runAutonomousRuntime({
    env,
    worker: () => ({ verified: false, dispatches: [], measurement_record: { ok: true } }),
    continuity: stubContinuity,
    sleepFn: async () => {},
  });
  const second = await runAutonomousRuntime({
    env,
    worker: () => ({ verified: false, dispatches: [], measurement_record: { ok: true } }),
    continuity: stubContinuity,
    sleepFn: async () => {},
  });
  assert.equal(first.state, "TIME_SLICE_COMPLETE");
  assert.equal(second.state, "TIME_SLICE_COMPLETE");
  assert.equal(second.completed, 1);
  assert.equal(second.cycle, first.cycle + 1);
});

test("runtime keeps defense and continuity active when the breaker changes to OFF", async () => {
  const env = runtimeEnv({
    ACORN_SYSTEM_MODE: "RUN",
    ACORN_RUNTIME_MINUTES: "1",
    ACORN_RUNTIME_MAX_CYCLES: "3",
  });
  let calls = 0;
  const continuityCalls = [];
  const result = await runAutonomousRuntime({
    env,
    worker: () => {
      calls += 1;
      env.ACORN_SYSTEM_MODE = "OFF";
      return { verified: false, dispatches: [], measurement_record: { ok: true } };
    },
    continuity: async () => {
      continuityCalls.push(env.ACORN_SYSTEM_MODE);
      return { state: "CONTINUOUS", defense: { active: true, state: "HEALTHY" } };
    },
    sleepFn: async () => {},
  });
  assert.equal(result.state, "DEFENSIVE_CONTINUATION");
  assert.equal(calls, 1);
  assert.ok(continuityCalls.length >= 2);
  assert.equal(result.defense_active, true);
});

test("breaker OFF still runs continuity and never places defense on HOLD", async () => {
  let workerCalls = 0;
  let continuityCalls = 0;
  const result = await runAutonomousRuntime({
    env: runtimeEnv({ ACORN_SYSTEM_MODE: "OFF", ACORN_RUNTIME_MAX_CYCLES: "2" }),
    worker: () => { workerCalls += 1; throw new Error("must not execute"); },
    continuity: async () => {
      continuityCalls += 1;
      return { state: "DEFENSIVE_CONTINUATION", defense: { active: true, continue_defending: true, state: "HEALTHY" } };
    },
    sleepFn: async () => {},
  });
  assert.equal(result.state, "DEFENSIVE_CONTINUATION");
  assert.equal(workerCalls, 0);
  assert.equal(continuityCalls, 2);
  assert.equal(result.defense_active, true);
  assert.equal(result.continuity_active, true);
});

test("autonomy remains a measured vector and a budget, not a boolean", () => {
  const measured = measureAutonomy({ autonomous_steps: 2, duration_ms: 50 });
  assert.equal(measured.autonomous, "NOT_BOOLEAN");
  assert.equal(measured.autonomous_steps, 2);
  const budget = autonomyBudget({
    limits: { autonomous_steps: 4 },
    uncertainty: { unknown: true },
    breaker: "OFF",
  });
  assert.equal(budget.reduced, true);
  assert.equal(budget.breaker_changed, false);
  assert.equal(budget.is_not_breaker, true);
});
