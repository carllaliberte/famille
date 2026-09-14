import test from "node:test";
import assert from "node:assert/strict";
import { emptyMemory, rankSources, scoreFor, updateMemory, memorySummary } from "../scripts/synaptic-memory.mjs";

test("synaptic memory ranks measured successful edges first", () => {
  const memory = emptyMemory();
  memory.edges["astra:review"] = { source: "astra", capability: "review", attempts: 4, successes: 3, failures: 1 };
  memory.edges["gemini:review"] = { source: "gemini", capability: "review", attempts: 4, successes: 1, failures: 3 };
  const ranked = rankSources([{ id: "gemini", capability: "review" }, { id: "astra", capability: "review" }], memory);
  assert.deepEqual(ranked.map((x) => x.id), ["astra", "gemini"]);
  assert.equal(scoreFor(memory, "astra", "review"), 0.75);
});

test("synaptic memory updates only from measured dispatch states", () => {
  const memory = emptyMemory();
  const routing = { routes: [
    { route: { source: "astra", capability: "review" }, context: { front_sha: "sha-ok" } },
    { route: { source: "gemini", capability: "review" }, context: { front_sha: "sha-fail" } },
  ] };
  const next = updateMemory(memory, routing, [
    { sha: "sha-ok", state: "DISPATCHED" },
    { sha: "sha-fail", state: "DISPATCH_FAILED" },
  ], "2026-09-14T23:00:00Z");
  assert.equal(next.cycles, 1);
  assert.equal(next.edges["astra:review"].successes, 1);
  assert.equal(next.edges["gemini:review"].failures, 1);
  assert.equal(next.updated_at, "2026-09-14T23:00:00Z");
});

test("memory summary remains explicit and non-live", () => {
  const summary = memorySummary(emptyMemory());
  assert.equal(summary.version, "synaptic-memory.v1");
  assert.equal(summary.edges, 0);
});
