import { test } from "node:test";
import assert from "node:assert/strict";
import { parseTrigger } from "../.github/swarm/review.mjs";

test("PR without slash still uses auto roster only", () => {
  const ids = parseTrigger("", [], "pull_request");
  assert.ok(ids.includes("gemini"));
  assert.ok(!ids.includes("xai"));
});

test("workflow_dispatch parseTrigger does not default to auto-only", () => {
  const ids = parseTrigger("", [], "workflow_dispatch");
  assert.deepEqual(ids, []);
});
