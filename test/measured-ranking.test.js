import test from "node:test";
import assert from "node:assert/strict";
import { assertRankingSafe, rankAgents, scoreEvidence } from "../scripts/measured-ranking.mjs";

const agents = [
  { id: "astra", name: "Astra", kind: "model", specialty: "software-engineering", capabilities: ["review", "build"] },
  { id: "grok", name: "Grok", kind: "model", specialty: "independent", capabilities: ["review"] },
  { id: "new-model", name: "New Model", kind: "model", specialty: "unknown", capabilities: ["review"] },
];

test("scoreEvidence is confidence-aware and bounded", () => {
  const one = scoreEvidence({ execution: { successes: 1, attempts: 1, rate: 1 }, routing: null, collaboration: null });
  const many = scoreEvidence({ execution: { successes: 5, attempts: 5, rate: 1 }, routing: null, collaboration: null });
  assert.equal(one.score, 0.6);
  assert.equal(many.score, 1);
  assert.equal(one.confidence, 0.2);
  assert.equal(many.confidence, 1);
});

test("measured evidence can change rank", () => {
  const first = rankAgents(agents, {
    edges: [
      { type: "model-execution", id: "astra", attempts: 5, succeeded: 5 },
      { type: "model-execution", id: "grok", attempts: 5, succeeded: 2 },
    ],
  }, "2026-09-14T00:00:00Z");
  assert.equal(first.measured[0].id, "astra");
  assert.equal(first.measured[0].rank, 1);
  assert.equal(first.unmeasured[0].id, "new-model");

  const second = rankAgents(agents, {
    edges: [
      { type: "model-execution", id: "astra", attempts: 5, succeeded: 1 },
      { type: "model-execution", id: "grok", attempts: 5, succeeded: 5 },
    ],
  }, "2026-09-14T00:01:00Z");
  assert.equal(second.measured[0].id, "grok");
  assert.equal(second.measured[1].id, "astra");
});

test("collaboration and routing contribute without inventing evidence", () => {
  const ranking = rankAgents(agents, {
    edges: [
      { type: "routing", source: "astra", attempts: 4, successes: 3 },
      { type: "collaboration", sources: ["astra", "grok"], attempts: 2, completed: 2 },
    ],
  });
  const astra = ranking.measured.find((row) => row.id === "astra");
  const grok = ranking.measured.find((row) => row.id === "grok");
  assert.ok(astra);
  assert.ok(grok);
  assert.equal(astra.components.routing.attempts, 4);
  assert.equal(astra.components.collaboration.attempts, 2);
  assert.equal(grok.components.collaboration.attempts, 2);
  assert.equal(ranking.unmeasured.some((row) => row.id === "new-model"), true);
});

test("ranking remains non-authoritative and non-live", () => {
  const ranking = rankAgents(agents, { edges: [] });
  assert.equal(ranking.authority, "carl");
  assert.equal(ranking.auto_merge, false);
  assert.equal(ranking.live, false);
  assertRankingSafe(ranking);
});
