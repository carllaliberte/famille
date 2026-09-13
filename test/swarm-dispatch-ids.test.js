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

test("idsForDispatch follows secrets not roster status", () => {
  const ids = idsForDispatch({
    GEMINI_API_KEY: "g",
    OPENROUTER_API_KEY: "o",
    XAI_API_KEY: "x",
  });
  assert.ok(ids.includes("gemini"));
  assert.ok(ids.includes("xai"));
  assert.ok(ids.includes("openrouter"));
});

test("missing secret is skip not provider error", () => {
  const { run, skip } = keyedModels(["xai", "gemini"], { GEMINI_API_KEY: "g" });
  assert.ok(run.some((s) => s.id === "gemini"));
  assert.ok(skip.some((s) => s.id === "xai" && /missing/.test(s.reason)));
});
