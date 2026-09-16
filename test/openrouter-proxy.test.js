import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  clampOpenRouterBudget,
  requestPath,
} from "../scripts/codex-openrouter-budget-proxy.mjs";

const source = fs.readFileSync(new URL("../scripts/codex-openrouter-budget-proxy.mjs", import.meta.url), "utf8");

test("OpenRouter proxy targets the API base, not the web root", () => {
  assert.ok(source.includes('new URL("https://openrouter.ai/api/v1")'));
  assert.equal(
    requestPath({ url: "/v1/responses" }),
    "/api/v1/responses"
  );
});

test("Codex Responses body with omitted budget injects 1024", () => {
  const input = {
    model: "google/gemini-2.5-flash",
    input: [{ role: "user", content: "task #560" }],
    stream: true,
  };
  const { body, clamped, hits } = clampOpenRouterBudget(structuredClone(input), 1024);
  assert.equal(body.model, "google/gemini-2.5-flash");
  assert.deepEqual(body.input, input.input);
  assert.equal(body.stream, true);
  assert.equal(body.max_output_tokens, 1024);
  assert.equal(clamped, true);
  assert.equal(hits.some((h) => h.key === "max_output_tokens" && h.from === null), true);
});

test("Codex wire 65535 max_output_tokens becomes 1024", () => {
  const input = {
    model: "google/gemini-2.5-flash",
    max_output_tokens: 65535,
    input: "keep",
  };
  const { body, clamped, hits } = clampOpenRouterBudget(structuredClone(input), 1024);
  assert.equal(body.max_output_tokens, 1024);
  assert.equal(body.model, "google/gemini-2.5-flash");
  assert.equal(body.input, "keep");
  assert.equal(clamped, true);
  assert.equal(hits[0].from, 65535);
  assert.equal(hits[0].to, 1024);
});

test("nested text.max_output_tokens 65535 is clamped", () => {
  const input = {
    model: "google/gemini-2.5-flash",
    text: { max_output_tokens: 65535, format: { type: "text" } },
  };
  const { body, clamped } = clampOpenRouterBudget(structuredClone(input), 1024);
  assert.equal(body.text.max_output_tokens, 1024);
  assert.equal(body.text.format.type, "text");
  assert.equal(body.max_output_tokens, 1024);
  assert.equal(clamped, true);
});

test("proxy source still records JSON vs HTML body_kind", () => {
  assert.match(source, /body_kind/);
  assert.match(source, /clamped=\$\{clamped\}/);
});
