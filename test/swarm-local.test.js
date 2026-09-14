import { test } from "node:test";
import assert from "node:assert/strict";
import { CANALS, idsForDispatch, parseTrigger } from "../.github/swarm/review.mjs";

test("cloud canals stay grok-2 and grok-4.6", () => {
  assert.equal(CANALS.xai.model, "grok-2");
  assert.equal(CANALS.grok46.model, "grok-4.6");
  assert.equal(CANALS.xai.secret, "XAI_API_KEY");
  assert.equal(CANALS.grok46.secret, "XAI_API_KEY");
});

test("local canal is ollama over OLLAMA_HOST", () => {
  const canal = CANALS.local || CANALS.ollama;
  assert.equal(canal.secret, "OLLAMA_HOST");
  assert.equal(canal.provider, "ollama");
  assert.equal(canal.model, "llama3.2");
});

test("idsForDispatch without OLLAMA_HOST skips local/ollama", () => {
  const ids = idsForDispatch({
    XAI_API_KEY: "x",
    GEMINI_API_KEY: "g",
  });
  assert.equal(ids.includes("local"), false);
  assert.equal(ids.includes("ollama"), false);
  assert.ok(ids.includes("xai"));
});

test("idsForDispatch with OLLAMA_HOST includes the local canal", () => {
  const ids = idsForDispatch({
    OLLAMA_HOST: "http://127.0.0.1:11434",
  });
  assert.ok(ids.includes("local") || ids.includes("ollama"));
});

test("/local and /ollama follow CANALS", () => {
  assert.deepEqual(parseTrigger("/local", [], "issue_comment"), ["local"]);
  assert.deepEqual(parseTrigger("/ollama", [], "issue_comment"), ["local"]);
});
