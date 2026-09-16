import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./codex-openrouter-budget-proxy.mjs", import.meta.url), "utf8");

test("OpenRouter budget proxy uses HTTPS transport", () => {
  assert.match(source, /import https from "node:https"/);
  assert.match(source, /https\.request\(/);
  assert.doesNotMatch(source, /http\.request\(/);
});

test("OpenRouter budget proxy clamps both supported token fields", () => {
  assert.match(source, /parsed\.max_output_tokens = maxOutputTokens/);
  assert.match(source, /parsed\.max_tokens = maxOutputTokens/);
});
