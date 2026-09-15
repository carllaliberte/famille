import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MODELS } from "../.github/swarm/review.mjs";
import { detectKey, prepareRequest, probeOne } from "../scripts/astra-codex-probe.mjs";

describe("astra/codex probe", () => {
  it("detects usable provider keys without exposing them", () => {
    assert.equal(detectKey({ OPENAI_API_KEY: "sk-test-12345678" }, "OPENAI_API_KEY"), true);
    assert.equal(detectKey({ OPENROUTER_API_KEY: "or-test-12345678" }, "OPENROUTER_API_KEY"), true);
    assert.equal(detectKey({ OPENAI_API_KEY: "" }, "OPENAI_API_KEY"), false);
    assert.equal(detectKey({ OPENROUTER_API_KEY: "short" }, "OPENROUTER_API_KEY"), false);
  });

  it("keeps Astra paid OpenAI and routes Codex to the free coding model", () => {
    assert.equal(MODELS.astra.model, "gpt-5.6-terra");
    assert.equal(MODELS.astra.provider, "openai");
    assert.equal(MODELS.astra.secret, "OPENAI_API_KEY");
    assert.equal(MODELS.codex.model, "qwen/qwen3-coder:free");
    assert.equal(MODELS.codex.provider, "openrouter");
    assert.equal(MODELS.codex.secret, "OPENROUTER_API_KEY");
  });

  it("prepares each channel with its own provider and endpoint", () => {
    const astra = prepareRequest("astra", { OPENAI_API_KEY: "sk-test-12345678" });
    assert.equal(astra.ok, true);
    assert.equal(astra.provider, "openai");
    assert.equal(astra.secret_name, "OPENAI_API_KEY");
    assert.equal(astra.endpoint, "https://api.openai.com/v1/chat/completions");
    assert.equal(astra.key_detected, true);

    const codex = prepareRequest("codex", { OPENROUTER_API_KEY: "or-test-12345678" });
    assert.equal(codex.ok, true);
    assert.equal(codex.provider, "openrouter");
    assert.equal(codex.secret_name, "OPENROUTER_API_KEY");
    assert.equal(codex.endpoint, "https://openrouter.ai/api/v1/chat/completions");
    assert.equal(codex.key_detected, true);
    assert.equal(codex.auto_merge, false);
    assert.equal(codex.live, false);
  });

  it("executes a successful mocked Astra transport", async () => {
    const fakeFetch = async (_url, options) => {
      assert.equal(options.method, "POST");
      assert.match(options.headers.authorization, /^Bearer sk-test/);
      return new Response(JSON.stringify({ choices: [{ message: { content: "pong" } }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    const result = await probeOne("astra", {
      OPENAI_API_KEY: "sk-test-12345678",
      ACORN_SYSTEM_MODE: "RUN",
      GITHUB_SHA: "test-sha",
    }, fakeFetch);
    assert.equal(result.api_call, "EXECUTED");
    assert.equal(result.result, "SUCCEEDED");
    assert.equal(result.http_status, 200);
    assert.equal(result.text_present, true);
    assert.equal(result.live, false);
    assert.equal(result.auto_merge, false);
  });

  it("executes a successful mocked free Codex transport", async () => {
    const fakeFetch = async (url, options) => {
      assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
      assert.equal(options.method, "POST");
      assert.match(options.headers.authorization, /^Bearer or-test/);
      assert.equal(options.headers["X-Title"], "Acorn swarm");
      return new Response(JSON.stringify({ choices: [{ message: { content: "pong" } }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    const result = await probeOne("codex", {
      OPENROUTER_API_KEY: "or-test-12345678",
      ACORN_SYSTEM_MODE: "RUN",
      GITHUB_SHA: "test-sha",
    }, fakeFetch);
    assert.equal(result.api_call, "EXECUTED");
    assert.equal(result.result, "SUCCEEDED");
    assert.equal(result.http_status, 200);
    assert.equal(result.text_present, true);
    assert.equal(result.live, false);
    assert.equal(result.auto_merge, false);
  });

  it("does not call either provider when the breaker is OFF", async () => {
    let called = false;
    const fakeFetch = async () => {
      called = true;
      throw new Error("must not execute");
    };
    const result = await probeOne("codex", {
      OPENROUTER_API_KEY: "or-test-12345678",
      ACORN_SYSTEM_MODE: "OFF",
    }, fakeFetch);
    assert.equal(called, false);
    assert.equal(result.api_call, "NOT_EXECUTED");
    assert.equal(result.result, "BLOCKED_BY_BREAKER");
  });
});
