import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseTrigger,
  idsForDispatch,
  keyedModels,
} from "../.github/swarm/review.mjs";

test("PR without slash still uses auto roster — gemini not xai", () => {
  const ids = parseTrigger("", [], "pull_request");
  assert.ok(ids.includes("gemini"));
  assert.equal(ids.includes("xai"), false);
});

test("workflow_dispatch parseTrigger does not default to autoIds", () => {
  assert.deepEqual(parseTrigger("", [], "workflow_dispatch"), []);
});

test("idsForDispatch prefers free OpenRouter over paid native keys", () => {
  const ids = idsForDispatch({
    GEMINI_API_KEY: "g",
    OPENROUTER_API_KEY: "o",
    XAI_API_KEY: "x",
  });
  assert.equal(ids.includes("xai"), false);
  assert.equal(ids.includes("gemini"), false);
  assert.ok(ids.some((id) => id === "orfree" || id.includes("gemma") || id.includes("nemotron") || id === "llama"));
});

test("missing secret is skip not provider error", () => {
  const { run, skip } = keyedModels(["xai", "gemini"], { GEMINI_API_KEY: "g" });
  assert.ok(run.some((s) => s.id === "gemini"));
  assert.ok(skip.some((s) => s.id === "xai" && /missing/.test(s.reason)));
});
