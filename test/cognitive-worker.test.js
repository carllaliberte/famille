import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/cognitive-worker.yml", "utf8");
const runtime = fs.readFileSync("scripts/cognitive-worker.mjs", "utf8");

test("cognitive worker is scheduled and manually dispatchable", () => {
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /cron: "17 \* \* \* \*"/);
});

test("cognitive worker never merges or writes repository contents", () => {
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /pull-requests: read/);
  assert.match(workflow, /auto_merge=false/);
  assert.match(workflow, /live=false/);
  assert.doesNotMatch(workflow, /gh pr merge/);
  assert.doesNotMatch(workflow, /git push/);
  assert.doesNotMatch(runtime, /git push/);
});

test("worker dispatches each PR through the real /swarm comment path", () => {
  assert.match(workflow, /node scripts\/cognitive-worker\.mjs/);
  assert.match(runtime, /headRefOid/);
  assert.match(runtime, /gh", \[/);
  assert.match(runtime, /api/);
  assert.match(runtime, /issues\/\$\{front\.number\}\/comments/);
  assert.match(runtime, /body=\/swarm/);
  assert.doesNotMatch(runtime, /workflow.*run.*swarm\.yml/);
});

test("worker preserves machine evidence without changing source of record", () => {
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /worker-evidence\.json/);
  assert.match(runtime, /writeFileSync/);
  assert.match(workflow, /retention-days: 14/);
});

test("worker prevents overlapping cycles and remains bounded", () => {
  assert.match(workflow, /concurrency:/);
  assert.match(workflow, /group: cognitive-worker/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(runtime, /export const LIMIT = 20/);
});
