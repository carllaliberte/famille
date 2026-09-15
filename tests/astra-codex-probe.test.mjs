import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectKey, prepareRequest, probeOne } from "../scripts/astra-codex-probe.mjs";

describe("astra/codex probe", () => {
  it("detects a usable OpenAI key without exposing it", () => {
    assert.equal(detectKey({ OPENAI_API_KEY: "sk-test-12345678" }), true);
    assert.equal(detectKey({ OPENAI_API_KEY: "" }), false);
    assert.equal(detectKey({ OPENAI_API_KEY: "short" }), false);
  });

  it("prepares both channels from the shared OpenAI transport", () => {
    for (const id of ["astra", "codex"]) {
      const prepared = prepareRequest(id, { OPENAI_API_KEY: "sk-test-12345678" });
      assert.equal(prepared.ok, true);
      assert.equal(prepared.provider, "openai");
      assert.equal(prepared.secret_name, "OPENAI_API_KEY");
      assert.equal(prepared.key_detected, true);
      assert.equal(prepared.auto_merge, false);
      assert.equal(prepared.live, false);
    }
  });

  it("executes a successful mocked transport", async () => {
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

  it("does not call OpenAI when the breaker is OFF", async () => {
    let called = false;
    const fakeFetch = async () => {
      called = true;
      throw new Error("must not execute");
    };
    const result = await probeOne("codex", {
      OPENAI_API_KEY: "sk-test-12345678",
      ACORN_SYSTEM_MODE: "OFF",
    }, fakeFetch);
    assert.equal(called, false);
    assert.equal(result.api_call, "NOT_EXECUTED");
    assert.equal(result.result, "BLOCKED_BY_BREAKER");
  });
});
