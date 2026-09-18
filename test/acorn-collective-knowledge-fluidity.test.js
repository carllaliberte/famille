import test from "node:test";
import assert from "node:assert/strict";
import {
  ID_ALGO,
  createKnowledge,
  addEvidence,
  verifyKnowledge,
  shareKnowledge,
  mergeKnowledge,
  routeForKnowledge,
  learnGlobally,
  assertCollectiveKnowledgeConstitution
} from "../scripts/acorn-collective-knowledge-fluidity.mjs";

function sample(claim = "c", evidence = ["e1"]) {
  return createKnowledge({ subject: "x", claim, evidence, source: "node-a" });
}

test("knowledge keeps provenance", () => {
  const k = createKnowledge({
    subject: "routing",
    claim: "native path is faster",
    evidence: ["m1"],
    source: "node-a"
  });
  assert.equal(k.provenance.source, "node-a");
  assert.equal(k.id_algo, ID_ALGO);
  assert.equal(k.live, false);
  assert.equal(k.claim_v0, false);
  assert.equal(Object.hasOwn(k, "evidence_hash"), false);
});

test("evidence upgrades observation", () => {
  const k = createKnowledge({ subject: "x", claim: "c" });
  assert.equal(addEvidence(k, { evidence: "e" }).state, "OBSERVED");
});

test("verification requires evidence and stays a local rail", () => {
  assert.throws(() => verifyKnowledge(createKnowledge({ subject: "x", claim: "c" })), /EVIDENCE_REQUIRED/);
  const k = verifyKnowledge(sample(), { confidence: 0.9 });
  assert.equal(k.state, "VERIFIED");
  assert.ok(k.verified_at);
  assert.equal(k.verified_by, "LOCAL_RAIL");
  assert.equal(k.live, false);
  assert.equal(k.executed, false);
  assert.equal(k.measured, false);
  assert.equal(k.claim_v0, false);
  assert.equal(Object.hasOwn(k, "evidence_hash"), false);
  assert.equal(assertCollectiveKnowledgeConstitution(k), true);
});

test("local FNV id is not claim.v0 evidence_hash", () => {
  const k = sample();
  assert.match(k.id, /^knowledge:[0-9a-f]+$/);
  assert.ok(k.id.split(":")[1].length <= 8);
  assert.notEqual(k.id.split(":")[1].length, 64);
  assert.throws(
    () => verifyKnowledge({ ...k, evidence_hash: k.id }),
    /LOCAL_FNV_IS_NOT_EVIDENCE_HASH/
  );
});

test("untrusted knowledge cannot spread", () => {
  const k = createKnowledge({ subject: "x", claim: "c" });
  assert.equal(shareKnowledge(k, { to: ["b"] }).state, "BLOCKED");
});

test("knowledge can be fused without erasing conflict", () => {
  const a = verifyKnowledge(sample("a", ["1"]));
  const b = verifyKnowledge(sample("b", ["2"]));
  const m = mergeKnowledge({ subject: "x", items: [a, b] });
  assert.equal(m.conflict, true);
  assert.equal(m.live, false);
});

test("verified knowledge routes with provenance", () => {
  const k = verifyKnowledge(sample());
  const r = routeForKnowledge({ knowledge: k, participants: [{ id: "p", scope: "LOCAL" }] });
  assert.equal(r[0].knowledge_id, k.id);
  assert.equal(r[0].live, false);
});

test("global learning deduplicates verified knowledge that still has evidence", () => {
  const k = verifyKnowledge(sample());
  assert.equal(learnGlobally({ local_results: [k, k] }).reusable_count, 1);
  assert.equal(learnGlobally({ local_results: [{ ...k, evidence: [] }] }).reusable_count, 0);
});

test("constitution fails closed and never mints LIVE or claim.v0", () => {
  assert.throws(() => assertCollectiveKnowledgeConstitution(), /CONSTITUTION_SNAPSHOT_REQUIRED/);
  assert.throws(() => assertCollectiveKnowledgeConstitution({}), /CONSTITUTION_SNAPSHOT_REQUIRED/);
  const ok = sample();
  assert.equal(assertCollectiveKnowledgeConstitution(ok), true);
  assert.throws(() => assertCollectiveKnowledgeConstitution({ ...ok, breaker_touched: true }), /BREAKER/);
  assert.throws(() => assertCollectiveKnowledgeConstitution({ ...ok, authority_transfer: true }), /AUTHORITY/);
  assert.throws(() => assertCollectiveKnowledgeConstitution({ ...ok, auto_merge: true }), /MERGE/);
  assert.throws(() => assertCollectiveKnowledgeConstitution({ ...ok, live: true }), /LIVE/);
  assert.throws(() => assertCollectiveKnowledgeConstitution({ ...ok, claim_v0: true }), /CLAIM_V0/);
  assert.throws(
    () => assertCollectiveKnowledgeConstitution({ ...ok, undated_verification: true }),
    /TEMPORAL/
  );
});
