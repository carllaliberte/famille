import test from "node:test";
import assert from "node:assert/strict";
import {
  ID_ALGO,
  createKnowledge,
  validateKnowledge,
  shareKnowledge,
  transferKnowledge,
  buildKnowledgeGraph,
  deriveInsight,
  routeKnowledge,
  expireKnowledge,
  assertCortexConstitution
} from "../scripts/acorn-cortex-knowledge-fabric.mjs";

function sample(extra = {}) {
  return createKnowledge({
    subject: "x",
    predicate: extra.predicate || "works",
    value: extra.value ?? true,
    source: extra.source || "test",
    evidence: extra.evidence || ["e"],
    confidence: extra.confidence ?? 0.9,
    expires_at: extra.expires_at ?? null
  });
}

function constitutionOk(transfer) {
  return {
    breaker_touched: false,
    authority_transfer: false,
    hidden_learning: false,
    auto_merge: false,
    auto_spend: false,
    auto_signature: false,
    live: false,
    claim_v0: false,
    transfer
  };
}

test("knowledge keeps provenance and a local FNV id", () => {
  const k = sample();
  assert.equal(k.state, "PROVISIONAL");
  assert.equal(k.provenance.source, "test");
  assert.equal(k.id_algo, ID_ALGO);
  assert.match(k.id, /^knowledge:[0-9a-f]+$/);
  assert.ok(k.id.split(":")[1].length <= 8);
  assert.notEqual(k.id.split(":")[1].length, 64);
  assert.equal(k.live, false);
  assert.equal(k.claim_v0, false);
  assert.equal(Object.hasOwn(k, "evidence_hash"), false);
});

test("validateKnowledge requires evidence and does not mint VERIFIED from a count", () => {
  assert.throws(
    () => validateKnowledge(createKnowledge({ subject: "x", predicate: "works", value: true, source: "test" })),
    /EVIDENCE_REQUIRED/
  );
  const k = validateKnowledge(sample());
  assert.equal(k.state, "OBSERVED");
  assert.notEqual(k.state, "VERIFIED");
  assert.equal(k.measured, false);
  assert.equal(k.executed, false);
  assert.equal(k.live, false);
  assert.equal(k.claim_v0, false);
  assert.throws(
    () => validateKnowledge({ ...sample(), evidence_hash: sample().id }),
    /LOCAL_FNV_IS_NOT_EVIDENCE_HASH/
  );
});

test("knowledge can circulate without authority", () => {
  const k = validateKnowledge(sample({ source: "a" }));
  const s = shareKnowledge(k);
  assert.equal(s.shared, true);
  assert.equal(s.authority, false);
  assert.equal(s.live, false);
});

test("cortex builds an undirected shared graph", () => {
  const a = validateKnowledge(sample({ predicate: "p", source: "a", value: 1, confidence: 0.8 }));
  const b = validateKnowledge(sample({ predicate: "q", source: "b", value: 2, confidence: 0.7 }));
  assert.notEqual(a.id, b.id);
  assert.equal(buildKnowledgeGraph([a, b]).edges.length, 1);
});

test("insights remain provisional", () => {
  const k = validateKnowledge(sample({ predicate: "p", source: "a", value: 1, confidence: 0.8 }));
  assert.equal(deriveInsight({ knowledge: [k], goal: "g" }).requires_validation, true);
});

test("routing prefers confidence", () => {
  const a = validateKnowledge(sample({ predicate: "p", source: "a", value: 1, confidence: 0.5 }));
  const b = validateKnowledge(sample({ predicate: "p", source: "b", value: 2, confidence: 0.9 }));
  assert.equal(routeKnowledge({ knowledge: [a, b], need: "x" })[0], b.id);
});

test("expired knowledge is excluded", () => {
  const k = sample({ predicate: "p", source: "a", value: 1, expires_at: "2000-01-01T00:00:00Z" });
  assert.equal(expireKnowledge({ knowledge: [k] })[0].state, "EXPIRED");
});

test("constitution fails closed and executes A to B without authority", () => {
  assert.throws(() => assertCortexConstitution(), /CONSTITUTION_SNAPSHOT_REQUIRED/);
  assert.throws(() => assertCortexConstitution({}), /CONSTITUTION_SNAPSHOT_REQUIRED/);
  const k = validateKnowledge(sample({ source: "A" }));
  const transfer = transferKnowledge({ from: "A", to: "B", knowledge: k });
  assert.equal(transfer.path, "A_TO_B");
  assert.equal(transfer.path_ran, true);
  assert.equal(transfer.authority_transferred, false);
  assert.equal(transfer.authority, false);
  assert.equal(transfer.executed, false);
  assert.equal(assertCortexConstitution(constitutionOk(transfer)), true);
  assert.throws(() => transferKnowledge({ from: "A", to: "A", knowledge: k }), /DISTINCT/);
  assert.throws(
    () => assertCortexConstitution({ ...constitutionOk(transfer), breaker_touched: true }),
    /BREAKER/
  );
  assert.throws(
    () => assertCortexConstitution({ ...constitutionOk(transfer), hidden_learning: true }),
    /TRACEABLE/
  );
  assert.throws(
    () => assertCortexConstitution({ ...constitutionOk(transfer), authority_transfer: true }),
    /AUTHORITY/
  );
  assert.throws(
    () => assertCortexConstitution({ ...constitutionOk(transfer), live: true }),
    /LIVE/
  );
  assert.throws(
    () => assertCortexConstitution({ ...constitutionOk({ ...transfer, authority_transferred: true }) }),
    /AUTHORITY/
  );
});
