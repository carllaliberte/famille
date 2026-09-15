import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { executeDispatch, selectTargets, buildEvidence, composePlan } from "../scripts/cognitive-worker.mjs";

const workflow = fs.readFileSync(".github/workflows/acorn-autopilot.yml", "utf8");

test("autopilot is scheduled, dispatchable, never merges", () => {
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /cron: '\*\/30 \* \* \* \*'/);
  assert.match(workflow, /ACORN_AUTO_MERGE: 'false'/);
  assert.match(workflow, /ACORN_LIVE: 'false'/);
  assert.doesNotMatch(workflow, /gh pr merge/);
  assert.doesNotMatch(workflow, /git push/);
});

test("autopilot uploads worker evidence, not only control.json", () => {
  assert.match(workflow, /scripts\/cognitive-worker\.mjs/);
  assert.match(workflow, /evidence\/autopilot\//);
  assert.match(workflow, /worker-evidence\.json/);
  assert.match(workflow, /GH_TOKEN/);
});

test("selectTargets does not blindly take every open PR", () => {
  const fronts = [
    { number: 1, sha: "a", updatedAt: "2026-09-14T00:00:00Z" },
    { number: 2, sha: "b", updatedAt: "2026-09-15T00:00:00Z" },
    { number: 3, sha: "c", updatedAt: "2026-09-13T00:00:00Z" },
  ];
  const picked = selectTargets(fronts, 1);
  assert.deepEqual(picked.map((x) => x.number), [2]);
  assert.deepEqual(selectTargets([], 1), []);
});

test("breaker OFF blocks dispatch", () => {
  const results = executeDispatch(
    [{ number: 456, sha: "abc" }],
    () => { throw new Error("should not run"); },
    { ACORN_SYSTEM_MODE: "OFF" },
  );
  assert.equal(results[0].state, "BLOCKED_BREAKER");
});

test("ACTION_ACCEPTED is not ACTION_VERIFIED", () => {
  const evidence = buildEvidence({ cycle_id: "t" }, composePlan([]), [
    { number: 456, sha: "abc", state: "DISPATCHED" },
  ]);
  assert.equal(evidence.executed, true);
  assert.equal(evidence.verified, false);
  assert.equal(evidence.live, false);
  assert.equal(evidence.truth.ACTION_ACCEPTED, true);
  assert.equal(evidence.truth.ACTION_VERIFIED, false);
});
