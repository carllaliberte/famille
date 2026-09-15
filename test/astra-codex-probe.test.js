import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectKey, prepareRequest, probeOne } from "../scripts/astra-codex-probe.mjs";
import { MODELS } from "../.github/swarm/review.mjs";

describe("Astra Codex probe", () => {
  it("registers openai transport on astra and codex", () => {
    assert.equal(MODELS.astra.provider, "openai");
    assert.equal(MODELS.astra.secret, "OPENAI_API_KEY");
    assert.equal(MODELS.astra.model, "gpt-6-astra");
    assert.equal(MODELS.codex.provider, "openai");
    assert.equal(MODELS.codex.secret, "OPENAI_API_KEY");
    assert.equal(MODELS.codex.model, "gpt-6-astra");
    assert.equal(MODELS.astra.auto, false);
    assert.equal(MODELS.codex.auto, false);
  });

  it("detects key presence without exposing value", () => {
    assert.equal(detectKey({}), false);
    assert.equal(detectKey({ OPENAI_API_KEY: "short" }), false);
    assert.equal(detectKey({ OPENAI_API_KEY: "sk-test-present-xxxx" }), true);
    const prep = prepareRequest("astra", { OPENAI_API_KEY: "sk-test-present-xxxx" });
    const dumped = JSON.stringify(prep);
    assert.equal(dumped.includes("sk-test-present-xxxx"), false);
    assert.equal(prep.key_detected, true);
  });

  it("blocks API call when breaker is OFF", async () => {
    const row = await probeOne("astra", { ACORN_SYSTEM_MODE: "OFF", OPENAI_API_KEY: "sk-test-present-xxxx" }, async () => {
      throw new Error("fetch must not run");
    });
    assert.equal(row.result, "BLOCKED_BY_BREAKER");
    assert.equal(row.api_call, "NOT_EXECUTED");
    assert.equal(row.live, false);
    assert.equal(row.auto_merge, false);
  });

  it("reports CONFIGURATION_ERROR when key missing", async () => {
    const row = await probeOne("astra", { ACORN_SYSTEM_MODE: "RUN" }, async () => {
      throw new Error("fetch must not run");
    });
    assert.equal(row.result, "CONFIGURATION_ERROR");
    assert.equal(row.api_call, "NOT_EXECUTED");
    assert.equal(row.key_detected, false);
  });

  it("classifies model 404 as MODEL_ERROR after a real fetch", async () => {
    const row = await probeOne(
      "astra",
      { ACORN_SYSTEM_MODE: "RUN", OPENAI_API_KEY: "sk-test-present-xxxx" },
      async () => ({
        ok: false,
        status: 404,
        json: async () => ({ error: { message: "model_not_found" } }),
      }),
    );
    assert.equal(row.api_call, "EXECUTED");
    assert.equal(row.result, "MODEL_ERROR");
    assert.equal(row.http_status, 404);
  });

  it("marks SUCCEEDED only when HTTP ok and body text exist", async () => {
    const row = await probeOne(
      "codex",
      { ACORN_SYSTEM_MODE: "RUN", OPENAI_API_KEY: "sk-test-present-xxxx" },
      async () => ({
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: "pong" } }] }),
      }),
    );
    assert.equal(row.result, "SUCCEEDED");
    assert.equal(row.text_present, true);
    assert.equal(row.verified === true, false);
  });
});
