import test from "node:test";
import assert from "node:assert/strict";
import { controlState } from "../.github/swarm/system-breaker.mjs";
import { runAutonomousRuntime } from "../scripts/autonomous-runtime.mjs";

const baseEnv = {
  ACORN_SYSTEM_MODE: "RUN",
  ACORN_RUNTIME_MINUTES: "1",
  ACORN_RUNTIME_MAX_CYCLES: "2",
};

test("RUN closes the breaker path and permits controlled execution", () => {
  const state = controlState({ ACORN_SYSTEM_MODE: "RUN" });
  assert.equal(state.breaker_closed, true);
  assert.equal(state.normal, true);
  assert.equal(state.production_write_allowed, false);
  assert.equal(state.auto_merge, false);
  assert.equal(state.live, false);
});

test("OFF opens the breaker and blocks execution", () => {
  const state = controlState({ ACORN_SYSTEM_MODE: "OFF" });
  assert.equal(state.breaker_closed, false);
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
    sleepFn: async () => {},
  });

  assert.equal(result.state, "TIME_SLICE_COMPLETE");
  assert.equal(result.completed, 2);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].dispatch, true);
  assert.equal(calls[1].dispatch, false);
});

test("runtime stops immediately on OFF", async () => {
  const result = await runAutonomousRuntime({
    env: { ACORN_SYSTEM_MODE: "OFF", ACORN_RUNTIME_MAX_CYCLES: "2" },
    worker: () => { throw new Error("must not execute"); },
    sleepFn: async () => {},
  });
  assert.equal(result.state, "STOPPED_BREAKER");
});
