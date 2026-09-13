import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const yml = readFileSync(new URL("../.github/workflows/swarm.yml", import.meta.url), "utf8");

test("existing PR and issue_comment triggers remain", () => {
  assert.match(yml, /pull_request:/);
  assert.match(yml, /issue_comment:/);
  assert.match(yml, /\/swarm/);
});

test("workflow_dispatch accepts ref default main", () => {
  assert.match(yml, /workflow_dispatch:/);
  assert.match(yml, /default: main/);
  assert.match(yml, /github\.event_name == 'workflow_dispatch'/);
});

test("six secrets stay mapped; no live claim", () => {
  for (const k of [
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "DEEPSEEK_API_KEY",
    "GEMINI_API_KEY",
    "OPENROUTER_API_KEY",
    "XAI_API_KEY",
  ]) {
    assert.ok(yml.includes(k + ": ${{ secrets." + k + " }}"), k);
  }
  assert.doesNotMatch(yml, /LIVE VERIFIED/);
  assert.doesNotMatch(yml, /auto_merge:\s*true/);
});
