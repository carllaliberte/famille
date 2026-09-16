import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { taskPrompt as workerTaskPrompt } from "../scripts/codex-autonomous-worker.mjs";
import { taskPrompt as moduleTaskPrompt } from "../scripts/codex-task-prompt.mjs";

const workerSrc = fs.readFileSync(new URL("../scripts/codex-autonomous-worker.mjs", import.meta.url), "utf8");

test("worker imports compact prompt module and has no local constructor", () => {
  assert.match(workerSrc, /from "\.\/codex-task-prompt\.mjs"/);
  assert.doesNotMatch(workerSrc, /function taskPrompt\s*\(/);
  assert.doesNotMatch(workerSrc, /function continuityBrief\s*\(/);
  assert.doesNotMatch(workerSrc, /\$\{task\.body/);
});

test("worker taskPrompt is the compact module implementation", () => {
  const task = {
    number: 560,
    title: "x",
    url: "https://github.com/carllaliberte/famille/issues/560",
    body: "Z".repeat(5000),
  };
  const a = workerTaskPrompt(task);
  const b = moduleTaskPrompt(task);
  assert.equal(a, b);
  assert.match(a, /truncated/);
  assert.ok(a.length < 2500);
});
