import test from "node:test";
import assert from "node:assert/strict";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";

test("canonical Cortex runtime contains cognitive metabolism without creating a second runtime", () => {
  const result = runCortexRuntime({
    workerEvidence: {
      v: "test-worker",
      discovered: 2,
      routed: 2,
      verified: true,
      dispatches: [{ state: "VERIFIED", number: 1, sha: "abc" }],
    },
    agents: [],
    fluidity: { state: "FLOWING" },
    memory: [],
    topology: { version: 0, paths: [], synapses: [] },
    contributions: [],
    timing: {},
    env: { ACORN_SYSTEM_MODE: "RUN" },
    at: "2026-09-17T00:00:00.000Z",
  });

  assert.equal(result.executed, true);
  assert.ok(result.metabolism);
  assert.equal(result.metabolism.continue, true);
  assert.equal(result.metabolism.authority, "carl");
  assert.equal(result.metabolism.auto_merge, false);
  assert.equal(result.metabolism.live, false);
  assert.equal(result.metabolism.constitution.second_runtime, false);
  assert.equal(result.metabolism.constitution.breaker_bypass, false);
  assert.ok(result.metabolism.metabolism.frontier_count >= 1);
});
