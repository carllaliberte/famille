import test from "node:test";
import assert from "node:assert/strict";
import { assertMemoryIndexSafe, buildMemoryIndex, emptyMemoryIndex, memoryIndexSummary } from "../scripts/cognitive-memory-index.mjs";

test("empty memory index is fail-safe and human-controlled", () => {
  const index = emptyMemoryIndex();
  assert.equal(index.authority, "carl");
  assert.equal(index.auto_merge, false);
  assert.equal(index.live, false);
  assertMemoryIndexSafe(index);
});

test("junction preserves measured routing, collaboration, and execution evidence", () => {
  const index = buildMemoryIndex({
    observedAt: "2026-09-14T20:00:00.000Z",
    synaptic: {
      v: "synaptic-memory.v1",
      cycles: 4,
      updated_at: "2026-09-14T19:59:00.000Z",
      edges: {
        "astra:review": { source: "astra", capability: "review", attempts: 4, successes: 2, failures: 2, last_state: "DISPATCHED", last_seen: "2026-09-14T19:59:00.000Z" },
      },
    },
    collaboration: {
      v: "collaboration-memory.v1",
      cycles: 2,
      updated_at: "2026-09-14T19:58:00.000Z",
      collaborations: {
        "astra+grok:review": { sources: ["grok", "astra"], capability: "review", attempts: 2, completed: 1, disagreements: 1, corrections: 1, synthesis_received: 1, last_state: "MEASURED", last_seen: "2026-09-14T19:58:00.000Z" },
      },
    },
    modelExecution: {
      v: "model-execution-memory.v1",
      cycles: 3,
      updated_at: "2026-09-14T19:57:00.000Z",
      models: {
        astra: { id: "astra", attempts: 3, succeeded: 1, errors: 1, skipped: 1, empty: 0, last_status: "SUCCEEDED", last_reason: null, last_seen: "2026-09-14T19:57:00.000Z" },
      },
    },
  });

  assert.equal(index.edges.length, 3);
  assert.equal(index.conflicts.length, 0);
  assert.equal(index.edges.find((x) => x.type === "routing").score, 0.5);
  assert.equal(index.edges.find((x) => x.type === "collaboration").completion_rate, 0.5);
  assert.equal(index.edges.find((x) => x.type === "model-execution").success_rate, 1 / 3);
  assert.equal(index.status_counts.attempted, 3);
  assert.equal(index.status_counts.succeeded, 3);
  assertMemoryIndexSafe(index);
});

test("summary is deterministic and exposes conflicts instead of overwriting them", () => {
  const index = buildMemoryIndex({
    observedAt: "2026-09-14T20:00:00.000Z",
    synaptic: { v: "synaptic-memory.v1", cycles: 1, updated_at: "x", edges: {} },
    collaboration: { v: "collaboration-memory.v1", cycles: 1, updated_at: "x", collaborations: {} },
    modelExecution: { v: "model-execution-memory.v1", cycles: 1, updated_at: "x", models: {} },
  });
  const summary = memoryIndexSummary(index);
  assert.deepEqual(summary.sources, ["collaboration-memory", "model-execution-memory", "synaptic-memory"]);
  assert.equal(summary.live, false);
  assert.equal(summary.auto_merge, false);
});
