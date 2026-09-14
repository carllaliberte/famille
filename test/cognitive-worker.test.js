import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const workflow = fs.readFileSync(".github/workflows/cognitive-worker.yml", "utf8");

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
});

test("worker dispatches exact PR head SHAs through the existing swarm", () => {
  assert.match(workflow, /gh workflow run swarm\.yml --ref main -f "ref=\$\{sha\}"/);
  assert.match(workflow, /headRefOid/);
  assert.match(workflow, /open-prs\.tsv/);
});

test("worker preserves machine evidence without changing source of record", () => {
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /worker-cycle\.json/);
  assert.match(workflow, /retention-days: 14/);
});

test("worker prevents overlapping cycles", () => {
  assert.match(workflow, /concurrency:/);
  assert.match(workflow, /group: cognitive-worker/);
  assert.match(workflow, /cancel-in-progress: false/);
});
