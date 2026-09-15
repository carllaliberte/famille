import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { CANALS, MODELS } from "../.github/swarm/review.mjs";

describe("Astra cognitive channel", () => {
  it("is registered as the GPT-6 Astra OpenAI channel", () => {
    const canals = JSON.parse(readFileSync("schema/canals-free.json", "utf8"));
    const astra = canals.find((row) => row.id === "astra");
    assert.deepEqual(astra, {
      id: "astra",
      provider: "openai",
      secret: "OPENAI_API_KEY",
      model: "gpt-6-astra",
      maxTokens: 4096,
    });
    assert.equal(CANALS.astra.provider, "openai");
    assert.equal(MODELS.astra.secret, "OPENAI_API_KEY");
  });

  it("is an automatic model in the roster without claiming LIVE", () => {
    const roster = JSON.parse(readFileSync("schema/agents.json", "utf8"));
    const astra = roster.agents.find((row) => row.id === "astra");
    assert.equal(astra.kind, "model");
    assert.equal(astra.status, "auto");
    assert.equal(astra.locked, true);
    assert.ok(astra.capabilities.includes("review"));
    assert.ok(astra.capabilities.includes("build"));
    assert.notEqual(astra.presence, "live");
  });
});
