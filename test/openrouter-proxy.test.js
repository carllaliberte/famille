import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/codex-openrouter-budget-proxy.mjs", import.meta.url), "utf8");

test("OpenRouter proxy targets the API base, not the web root", () => {
  assert.ok(source.includes('new URL("https://openrouter.ai/api/v1")'));
  assert.ok(source.includes('const suffix = incoming.pathname.replace(/^\\/v1(?=\\/|$)/, "");'));
  assert.ok(source.includes('return `${upstream.pathname.replace(/\\/$/, "")}${suffix || "/"}${incoming.search}`;'));
});

test("OpenRouter proxy preserves the configured token clamp", () => {
  assert.ok(source.includes('parsed.max_output_tokens = maxOutputTokens;'));
  assert.ok(source.includes('parsed.max_tokens = maxOutputTokens;'));
});
