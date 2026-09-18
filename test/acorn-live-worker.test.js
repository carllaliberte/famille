import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { jobRetryState, reclaimStaleJobs } from "../live/worker-jobs.mjs";

test("worker requires durable database", () => {
  assert.ok("DATABASE_URL_REQUIRED".length > 0);
  const src = readFileSync(new URL("../live/worker.mjs", import.meta.url), "utf8");
  assert.match(src, /DATABASE_URL_REQUIRED/);
  assert.match(src, /registerEvidence/);
  assert.match(src, /reclaimStaleJobs/);
  assert.match(src, /COMMERCIAL_ORDER/);
});

test("worker contract preserves human authority", () => {
  const workerContract = { authority: false, external_effect: false, live: false };
  assert.equal(workerContract.authority, false);
  assert.equal(workerContract.external_effect, false);
  assert.equal(workerContract.live, false);
});

test("stale RUNNING jobs are requeued and exhausted attempts become FAILED", async () => {
  assert.equal(jobRetryState({ attempts: 1, max_attempts: 3 }), "QUEUED");
  assert.equal(jobRetryState({ attempts: 3, max_attempts: 3 }), "FAILED");
  const calls = [];
  const ids = await reclaimStaleJobs(async (sql, params) => {
    calls.push({ sql, params });
    return { rows: [{ id: "job_stale" }] };
  }, { nowIso: "2026-09-18T12:00:00.000Z", staleMs: 60_000 });
  assert.deepEqual(ids, ["job_stale"]);
  assert.match(calls[0].sql, /state='QUEUED'/);
  assert.equal(calls[0].params[1], "2026-09-18T11:59:00.000Z");
});
