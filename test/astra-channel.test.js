import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { CANALS, MODELS } from "../.github/swarm/review.mjs";

describe("Astra cognitive channel", () => {
  it("is registered as the GPT-6 Astra OpenAI channel", () => {
    const canals = JSON.parse(readFileSync("schema/canals-free.json", "utf8"));
    assert.equal(canals.some((row) => row.id === "astra"), false);
    assert.equal(CANALS.astra.provider, "openai");
    assert.equal(CANALS.astra.secret, "OPENAI_API_KEY");
    assert.equal(CANALS.astra.model, "gpt-6-astra");
    assert.equal(CANALS.astra.maxTokens, 4096);
    assert.equal(MODELS.astra.secret, "OPENAI_API_KEY");
    assert.equal(MODELS.astra.auto, false);
  });

  it("is a declared guest identity without claiming LIVE", () => {
    const roster = JSON.parse(readFileSync("schema/agents.json", "utf8"));
    const astra = roster.agents.find((row) => row.id === "astra");
    assert.equal(astra.kind, "guest");
    assert.equal(astra.status, "declared");
    assert.equal(astra.locked, false);
    assert.ok(astra.capabilities.includes("flux"));
    assert.ok(!astra.capabilities.includes("juge"));
    assert.notEqual(astra.presence, "live");
  });
});
