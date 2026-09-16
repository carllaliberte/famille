import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { reviewOne, MODELS } from "../.github/swarm/review.mjs";

const workerWorkflow = readFileSync(".github/workflows/cognitive-worker.yml", "utf8");
const swarmWorkflow = readFileSync(".github/workflows/swarm.yml", "utf8");

test("GitHub Models Actions permission is explicit on every execution workflow", () => {
  assert.match(workerWorkflow, /models:\s*read/);
  assert.match(swarmWorkflow, /models:\s*read/);
});

test("GH_TOKEN is routed to GitHub Models and never OpenRouter", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), options });
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ choices: [{ message: { content: "REAL_GH_MODELS_RESPONSE" } }] }),
    };
  };
  try {
    const result = await reviewOne(
      MODELS.ghmodels,
      "system",
      "prove the channel",
      { GH_TOKEN: "ghs_test" },
    );
    assert.equal(result.text, "REAL_GH_MODELS_RESPONSE");
    assert.equal(result.via, "github-models");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://models.github.ai/inference/chat/completions");
    assert.match(calls[0].options.headers.authorization, /^Bearer ghs_test$/);
    assert.equal(calls[0].options.body.includes("openrouter"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("missing GitHub Models credential is not execution", async () => {
  const result = await reviewOne(MODELS.ghmodels, "system", "probe", {});
  assert.equal(result.skipped, true);
  assert.match(result.reason, /missing GITHUB_TOKEN/);
});
