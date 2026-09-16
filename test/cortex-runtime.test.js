import test from "node:test";
import assert from "node:assert/strict";
import { createCognitiveTask, taskPrompt } from "../.github/swarm/cognitive-task.mjs";

test("canonical cognitive task invokes Cortex without granting authority", () => {
  const task = createCognitiveTask({
    intent: "implement and verify a runtime change",
    source: "chatgpt",
    channel: "cognitive",
    ref: "main",
    capabilities: ["build", "review"],
    context: ["Acorn Cortex", "continuous runtime"],
    env: { ACORN_SYSTEM_MODE: "RUN" },
  });

  assert.equal(task.task, "cognitive-task.v1");
  assert.equal(task.cortex.version, "cortex.v0");
  assert.equal(task.cortex.invoked, true);
  assert.equal(task.cortex.session.state, "OBSERVE");
  assert.equal(task.cortex.session.task.objective, task.intent);
  assert.deepEqual(task.cortex.session.task.required_capabilities, ["build", "review"]);
  assert.equal(task.governance.human_authority, "carl");
  assert.equal(task.governance.production_write_allowed, false);
  assert.equal(task.governance.auto_merge, false);
  assert.equal(task.governance.live, false);
});

test("task prompt exposes Cortex state without inventing execution", () => {
  const task = createCognitiveTask({ intent: "inspect runtime" });
  const prompt = taskPrompt(task);
  assert.match(prompt, /Cortex: invoked/);
  assert.match(prompt, /auto_merge=false/);
  assert.match(prompt, /live=false/);
});
