import test from "node:test";
import assert from "node:assert/strict";
import { runContinuousRuntime } from "../scripts/acorn-continuous-runtime.mjs";

test("organism cycle is ordered and measurement claims are inventory-derived", async () => {
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

  assert.deepEqual(result.unified.cycle_order, [
    "REAL_STATE", "INVENTORY", "CONNECTIONS", "DEFENSE", "CORTEX",
    "EVOLUTION", "LEARNING", "METABOLISM", "EVIDENCE", "CONTINUE",
  ]);

  const basis = result.unified.measurement_basis;
  assert.equal(basis.discovered, result.coverage.discovered_count);
  assert.equal(basis.wired, result.coverage.wired_count);
  assert.equal(basis.executed, result.coverage.executed_count);
  assert.equal(basis.measured, result.coverage.measured_count);
  assert.equal(basis.verified, result.coverage.verified_count);
  assert.equal(basis.unknown, result.coverage.unknown_count);
  assert.equal(basis.failed, result.coverage.failed_count);

  assert.equal(result.unified.measured_from_inventory, true);
  assert.equal(result.unified.declared_scores_removed, true);
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
  assert.equal(result.authority, "carl");
});
