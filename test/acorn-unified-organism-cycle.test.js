import test from "node:test";
import assert from "node:assert/strict";
import { runContinuousRuntime } from "../scripts/acorn-continuous-runtime.mjs";

test("canonical Acorn organism cycle composes evolution, learning and metabolism", async () => {
  const result = await runContinuousRuntime({
    root: ".",
    env: { ACORN_SYSTEM_MODE: "RUN" },
    previous: [],
    quarantined: [],
    executions: {},
    importer: (url) => import(url),
    at: "2026-09-17T00:00:00.000Z",
    sequence: 1,
    operation: "inventory",
  });
  assert.equal(result.continuity_active ?? true, true);
  assert.ok(result.unified);
  assert.equal(result.unified.one_organism_cycle, true);
  assert.ok(result.unified.evolution);
  assert.ok(result.unified.learning);
  assert.ok(result.unified.metabolism);
  assert.equal(result.unified.second_runtime, false);
  assert.equal(result.unified.second_cortex, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
  assert.equal(result.authority, "carl");
});
