import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { CANALS, FREE_DISPATCH_CAP, idsForDispatch, MODELS, parseTrigger } from "../.github/swarm/review.mjs";

const rows = JSON.parse(
  readFileSync(new URL("../schema/canals-free.json", import.meta.url), "utf8"),
);
const OPENAI_SEATS = new Set(["astra", "codex"]);

describe("canals-free — catalogue additif, collision skip, pas Groq", () => {
  it("JSON is catalog seats: openrouter free plus OpenAI Astra/Codex, no groq, no llama id", () => {
    assert.ok(Array.isArray(rows));
    assert.ok(rows.length >= 20);
    for (const row of rows) {
      if (OPENAI_SEATS.has(row.id)) {
        assert.equal(row.provider, "openai");
        assert.equal(row.secret, "OPENAI_API_KEY");
        assert.equal(row.model, "gpt-6-astra");
        assert.equal(row.maxTokens, 4096);
        continue;
      }
      assert.equal(row.provider, "openrouter");
      assert.equal(row.secret, "OPENROUTER_API_KEY");
      assert.equal(row.maxTokens, row.id === "orfree" ? 1024 : 2048);
      assert.notEqual(row.id, "llama");
      assert.notEqual(row.provider, "groq");
    }
    assert.ok(rows.some((r) => r.id === "orfree"));
    assert.ok(rows.some((r) => r.id === "llama32f"));
    assert.ok(rows.some((r) => r.id === "astra"));
    assert.ok(rows.some((r) => r.id === "codex"));
    assert.ok(
      rows.some(
        (r) =>
          r.id === "nemotroncs" &&
          r.model === "nvidia/nemotron-3.5-content-safety:free",
      ),
    );
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
    assert.equal(CANALS.orfree.model, "openrouter/free");
    assert.equal(CANALS.orfree.maxTokens, 1024);
    assert.equal(CANALS.gemma431.model, "google/gemma-4-31b-it:free");
    assert.equal(CANALS.llama32f.model, "meta-llama/llama-3.2-3b-instruct:free");
    assert.equal(CANALS.nemotroncs.model, "nvidia/nemotron-3.5-content-safety:free");
    assert.equal(MODELS.orfree.secret, "OPENROUTER_API_KEY");
    assert.equal(MODELS.orfree.auto, false);
    assert.equal(MODELS.llama.id, "llama");
    assert.equal(CANALS.astra.provider, "openai");
    assert.equal(CANALS.codex.secret, "OPENAI_API_KEY");
  });

  it("each catalog id keeps its slug; llama/xai/grok46 intact", () => {
    for (const row of rows) {
      assert.equal(CANALS[row.id].model, row.model);
      if (OPENAI_SEATS.has(row.id)) {
        assert.equal(CANALS[row.id].secret, "OPENAI_API_KEY");
      } else {
        assert.equal(CANALS[row.id].secret, "OPENROUTER_API_KEY");
      }
    }
    assert.equal(CANALS.llama.model, "meta-llama/llama-3.3-70b-instruct:free");
    assert.equal(CANALS.xai.model, "grok-2");
    assert.equal(CANALS.grok46.model, "grok-4.6");
  });

  it("OPENROUTER_API_KEY alone dispatches at most FREE_DISPATCH_CAP :free", () => {
    assert.equal(FREE_DISPATCH_CAP, 3);
    const withOr = idsForDispatch({ OPENROUTER_API_KEY: "x" });
    const free = withOr.filter((id) => String(MODELS[id].model).includes(":free"));
    assert.ok(free.length <= FREE_DISPATCH_CAP);
    assert.ok(withOr.includes("openrouter"));
    assert.ok(withOr.includes("orfree"));
    assert.equal(withOr.includes("llama"), false);
    const xaiOnly = idsForDispatch({ XAI_API_KEY: "x" });
    assert.ok(xaiOnly.includes("xai"));
    assert.ok(xaiOnly.includes("grok46"));
    assert.equal(xaiOnly.includes("orfree"), false);
    const openaiOnly = idsForDispatch({ OPENAI_API_KEY: "x" });
    assert.ok(openaiOnly.includes("chatgpt"));
    assert.ok(openaiOnly.includes("astra"));
    assert.ok(openaiOnly.includes("codex"));
  });

  it("/gemma431 triggers gemma431 one-by-one", () => {
    assert.deepEqual(parseTrigger("/gemma431", [], "issue_comment"), ["gemma431"]);
  });
});
