import test from "node:test";
import assert from "node:assert/strict";
import { runUniversalComputeSweep } from "../scripts/acorn-universal-compute-sweep.mjs";

test("universal sweep executes all currently executable safe local compute", async () => {
  const r = await runUniversalComputeSweep({ env: {}, allowExec: false, human_authorization: false, nowAt: "2026-09-18T00:00:00.000Z" });
  assert.equal(r.status, "EXECUTED");
  assert.ok(r.executed_count >= 2, JSON.stringify(r));
  assert.ok(r.executed.some((x) => x.compute_type === "cpu"));
  assert.ok(r.executed.some((x) => x.compute_type === "simulator"));
  assert.equal(r.live, false);
  assert.equal(r.auto_spend, false);
  assert.equal(r.authority, "carl");
  assert.equal(r.proof.all_executed_resources_have_execution_records, true);
  assert.equal(r.proof.no_fake_execution, true);
});
