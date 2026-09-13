import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTrigger } from "../.github/swarm/review.mjs";

test("PR without slash uses auto roster — gemini not xai", () => {
  const ids = parseTrigger("", [], "pull_request");
  assert.ok(ids.includes("gemini"));
  assert.equal(ids.includes("xai"), false);
});
