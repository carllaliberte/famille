import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../scripts/codex-openrouter-budget-proxy.mjs", import.meta.url), "utf8");

test("OpenRouter proxy targets the API base, not the web root", () => {
  assert.match(source, /new URL\("https:\/\/openrouter\.ai\/api\/v1"\)/);
  assert.match(source, /pathname\.replace\(\/\^\\\\\/v1\(\?=\\\\\/\|\$\)\/, ""\)/);
  assert.match(source, /return `\$\{upstream\.pathname\.replace\(\/\\\\\/$\/, ""\)\}\$\{suffix \|\| "\\\/"\}\$\{incoming\.search\}`/);
});

test("OpenRouter proxy preserves the configured token clamp", () => {
  assert.match(source, /parsed\.max_output_tokens = maxOutputTokens/);
  assert.match(source, /parsed\.max_tokens = maxOutputTokens/);
});
