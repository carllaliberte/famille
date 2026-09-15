import test from "node:test";
import assert from "node:assert/strict";
import { assertRankingSafe, rankAgents } from "../scripts/measured-ranking.mjs";
import { verifyEvidenceSeal } from "../scripts/evidence-seal.mjs";

test("measured ranking is sealed and safe", () => {
  const ranking = rankAgents([
    { id: "astra", name: "Astra", kind: "model", capabilities: ["review"] },
  ], {
    edges: [{ type: "model-execution", id: "astra", attempts: 5, succeeded: 5 }],
  }, "2026-09-14T16:00:00Z");
  assert.equal(ranking.integrity, "SEALED");
  assert.equal(verifyEvidenceSeal(ranking), true);
  assertRankingSafe(ranking);
});

test("integrity conflict is rejected", () => {
  const ranking = rankAgents([
    { id: "astra", name: "Astra", kind: "model", capabilities: ["review"] },
  ], {
    edges: [{ type: "model-execution", id: "astra", attempts: 5, succeeded: 5 }],
  });
  ranking.measured[0].score = 0;
  assert.equal(verifyEvidenceSeal(ranking), false);
  assert.throws(() => assertRankingSafe({ ...ranking, integrity: "CONFLICT" }), /INTEGRITY_CONFLICT/);
});
