import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { CANALS, idsForDispatch, MODELS } from "../.github/swarm/review.mjs";

const rows = JSON.parse(
  readFileSync(new URL("../schema/canals-free.json", import.meta.url), "utf8"),
);

describe("canals-free — catalogue additif, collision skip, pas Groq", () => {
  it("JSON is catalog seats only: openrouter, no groq, no llama id", () => {
    assert.ok(Array.isArray(rows));
    assert.ok(rows.length >= 20);
    for (const row of rows) {
      assert.equal(row.provider, "openrouter");
      assert.equal(row.secret, "OPENROUTER_API_KEY");
      assert.equal(row.maxTokens, 2048);
      assert.notEqual(row.id, "llama");
      assert.notEqual(row.provider, "groq");
    }
    assert.ok(rows.some((r) => r.id === "orfree"));
    assert.ok(rows.some((r) => r.id === "llama32f"));
  });

  it("keeps frozen paid/local seats", () => {
    assert.equal(CANALS.xai.model, "grok-2");
    assert.equal(CANALS.grok46.model, "grok-4.6");
    assert.equal(CANALS.llama.model, "meta-llama/llama-3.3-70b-instruct:free");
    assert.equal(CANALS.llama.secret, "LLAMA_API_KEY");
    assert.equal(CANALS.local.model, "llama3.2");
    assert.equal(CANALS.gemini.secret, "GEMINI_API_KEY");
  });

  it("merges catalog ids into CANALS and MODELS", () => {
    assert.equal(CANALS.orfree.provider, "openrouter");
    assert.equal(CANALS.orfree.model, "openrouter/free");
    assert.equal(CANALS.gemma431.model, "google/gemma-4-31b-it:free");
    assert.equal(CANALS.llama32f.model, "meta-llama/llama-3.2-3b-instruct:free");
    assert.equal(MODELS.orfree.secret, "OPENROUTER_API_KEY");
    assert.equal(MODELS.orfree.auto, false);
    assert.equal(MODELS.llama.id, "llama");
  });

  it("idsForDispatch follows OPENROUTER_API_KEY for new seats", () => {
    assert.equal(idsForDispatch({}).includes("orfree"), false);
    const withOr = idsForDispatch({ OPENROUTER_API_KEY: "x" });
    assert.ok(withOr.includes("openrouter"));
    assert.ok(withOr.includes("orfree"));
    assert.ok(withOr.includes("gemma431"));
    assert.ok(withOr.includes("llama32f"));
    assert.equal(withOr.includes("llama"), false);
    const xaiOnly = idsForDispatch({ XAI_API_KEY: "x" });
    assert.ok(xaiOnly.includes("xai"));
    assert.ok(xaiOnly.includes("grok46"));
    assert.equal(xaiOnly.includes("orfree"), false);
  });
});
