import test from "node:test";
import assert from "node:assert/strict";
import {
  assertLearningInvariant,
  learningCandidate,
  learningCheckpoint,
  learningCycle,
  learningConstitution,
  resolveLearningState,
} from "../scripts/acorn-learning-fabric.mjs";

test("unverified knowledge remains a candidate", () => {
  const row = learningCandidate({ subject: "x", confidence: 1 });
  assert.equal(row.state, "CANDIDATE");
  assert.equal(row.verified, false);
  assert.equal(row.live, false);
});

test("verification requires measurement and provenance", () => {
  const row = learningCandidate({
    subject: "x",
    provenance: { source: "test" },
    measurement: { measured: true, confidence: 1 },
    verification: { verified: true },
    confidence: 1,
  });
  assert.equal(row.state, "VERIFIED");
  assert.equal(row.measured, true);
  assert.equal(row.provenance_present, true);
});

test("verified item without provenance is quarantined", () => {
  const row = learningCandidate({
    subject: "x",
    measurement: { measured: true },
    verification: { verified: true },
  });
  const resolved = resolveLearningState({ ...row, verified: true }, []);
  assert.equal(resolved.state, "QUARANTINED");
});

test("cycle preserves contradictions and continues", () => {
  const result = learningCycle({
    observations: [
      { subject: "same", observer: "a", epistemic_state: "CONTRADICTORY", evidence: { a: 1 } },
      { subject: "same", observer: "b", epistemic_state: "MEASURED", evidence: { b: 2 } },
    ],
  });
  assert.ok(result.candidates.every((x) => x.live === false));
  assert.equal(result.continue, true);
  assert.equal(result.checkpoint.auto_merge, false);
});

test("constitutional boundary is explicit", () => {
  const c = learningConstitution();
  assert.equal(c.second_memory, false);
  assert.equal(c.authority, "carl");
  assertLearningInvariant(learningCycle({}));
});

test("checkpoint is deterministic for same payload except timestamp", () => {
  const a = learningCheckpoint({ candidates: [{ subject: "a" }], at: "2026-01-01T00:00:00Z" });
  const b = learningCheckpoint({ candidates: [{ subject: "a" }], at: "2026-01-01T00:00:00Z" });
  assert.equal(a.digest, b.digest);
});
