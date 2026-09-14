import test from "node:test";
import assert from "node:assert/strict";
import { emptyCollaborationMemory, collaborationKey, updateCollaborationMemory, collaborationSummary } from "../scripts/collaboration-memory.mjs";

test("collaboration memory canonicalizes the same group", () => {
  assert.equal(collaborationKey(["gemini", "astra"], "review"), "astra+gemini:review");
  assert.equal(collaborationKey(["astra", "gemini", "astra"], "review"), "astra+gemini:review");
});

test("collaboration memory records only measured collaboration events", () => {
  const memory = emptyCollaborationMemory();
  const next = updateCollaborationMemory(memory, {
    sources: ["gemini", "astra"],
    capability: "review",
    completed: true,
    synthesis_received: true,
    disagreement: true,
    correction: true,
  }, "2026-09-15T00:00:00Z");
  const row = next.collaborations["astra+gemini:review"];
  assert.equal(row.attempts, 1);
  assert.equal(row.completed, 1);
  assert.equal(row.disagreements, 1);
  assert.equal(row.corrections, 1);
  assert.equal(row.synthesis_received, 1);
  assert.equal(row.last_state, "MEASURED");
});

test("single-source events do not become collaboration memory", () => {
  const next = updateCollaborationMemory(emptyCollaborationMemory(), { sources: ["astra"], completed: true });
  assert.equal(Object.keys(next.collaborations).length, 0);
});

test("summary is explicit and does not claim LIVE", () => {
  const summary = collaborationSummary(emptyCollaborationMemory());
  assert.equal(summary.version, "collaboration-memory.v1");
  assert.equal(summary.collaborations, 0);
});
