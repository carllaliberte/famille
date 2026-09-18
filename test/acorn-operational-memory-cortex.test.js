import test from "node:test";
import assert from "node:assert/strict";
import {
  ID_ALGO,
  recordEpisode,
  extractLessons,
  validateLesson,
  recall,
  consolidate,
  forgetExpired,
  isExpired,
  assertOperationalMemoryConstitution
} from "../scripts/acorn-operational-memory-cortex.mjs";

function episode(extra = {}) {
  return recordEpisode({
    actor: "acorn",
    goal: "build network",
    outcomes: ["ok"],
    evidence: ["e1"],
    ...extra
  });
}

test("records episode with local FNV id and provenance", () => {
  const e = episode();
  assert.equal(e.state, "RECORDED");
  assert.equal(e.id_algo, ID_ALGO);
  assert.match(e.id, /^episode:[0-9a-f]+$/);
  assert.ok(e.id.split(":")[1].length <= 8);
  assert.notEqual(e.id.split(":")[1].length, 64);
  assert.equal(e.provenance.actor, "acorn");
  assert.equal(e.provenance.source_episode, e.id);
  assert.equal(e.live, false);
  assert.equal(e.claim_v0, false);
  assert.equal(Object.hasOwn(e, "evidence_hash"), false);
});

test("two different episodes do not share a Date.now id", () => {
  const a = recordEpisode({ actor: "a", goal: "g1", outcomes: ["x"] });
  const b = recordEpisode({ actor: "a", goal: "g2", outcomes: ["y"] });
  assert.notEqual(a.id, b.id);
});

test("validateLesson requires evidence tokens and an actor", () => {
  const e = episode({ evidence: [] });
  const l = extractLessons({ episode: e, lessons: ["reuse the route"] })[0];
  assert.equal(l.requires_validation, true);
  assert.equal(l.state, "PROVISIONAL");
  assert.throws(() => validateLesson(l), /EVIDENCE_REQUIRED/);
  assert.throws(() => validateLesson({ ...l, evidence: [""] }), /EVIDENCE_REQUIRED/);
  assert.throws(() => validateLesson({ ...l, evidence: [{}] }), /EVIDENCE_REQUIRED/);
  assert.throws(() => validateLesson({ lesson: "x", evidence: ["e"] }), /ACTOR_REQUIRED/);
  const v = validateLesson(l, { evidence: ["m1"] });
  assert.equal(v.state, "VERIFIED");
  assert.equal(v.validated_by, "LOCAL_RAIL");
  assert.equal(v.live, false);
  assert.equal(v.executed, false);
  assert.equal(v.measured, false);
  assert.equal(v.claim_v0, false);
  assert.ok(v.provenance.actor);
  assert.equal(assertOperationalMemoryConstitution(v), true);
});

test("local FNV id is not claim.v0 evidence_hash", () => {
  const e = episode();
  const l = extractLessons({ episode: e, lessons: ["l"] })[0];
  assert.throws(
    () => validateLesson({ ...l, evidence_hash: e.id }, { evidence: ["e"] }),
    /LOCAL_FNV_IS_NOT_EVIDENCE_HASH/
  );
});

test("recall is token match and persists provenance", () => {
  const e = episode();
  const l = validateLesson(extractLessons({ episode: e, lessons: ["reuse the route"] })[0], {
    evidence: ["m1"]
  });
  const hit = recall({ episodes: [e], lessons: [l], goal: "build network" });
  assert.ok(hit.results.length >= 1);
  assert.equal(hit.match, "TOKEN");
  assert.ok(hit.results.every((r) => r.provenance && r.provenance.source_episode && r.provenance.id_algo === ID_ALGO));
  const miss = recall({ episodes: [e], lessons: [l], goal: "net" });
  assert.equal(miss.results.length, 0);
});

test("consolidates verified lessons that still have evidence", () => {
  const e = episode();
  const x = validateLesson(extractLessons({ episode: e, lessons: ["reuse"] })[0], { evidence: ["e"] });
  assert.equal(consolidate({ lessons: [x] }).verified_lessons, 1);
  assert.equal(consolidate({ lessons: [{ ...x, evidence: [] }] }).verified_lessons, 0);
});

test("expiry is explicit and cannot be re-validated", () => {
  const expired = forgetExpired([{ expires_at: "2000-01-01T00:00:00Z", state: "VERIFIED", actor: "a", evidence: ["e"] }])[0];
  assert.equal(expired.state, "EXPIRED");
  assert.equal(isExpired(expired), true);
  assert.throws(() => validateLesson(expired, { evidence: ["e2"] }), /EXPIRED_CANNOT_REVALIDATE/);
  const e = episode({ expires_at: "2000-01-01T00:00:00Z" });
  const fresh = extractLessons({ episode: { ...e, expires_at: null }, lessons: ["old"] })[0];
  const l = validateLesson(fresh, { evidence: ["e"] });
  const aged = { ...l, expires_at: "2000-01-01T00:00:00Z" };
  const rec = recall({ episodes: [e], lessons: [aged], goal: "build network" });
  assert.equal(rec.results.length, 0);
});

test("constitution fails closed and never mints LIVE or claim.v0", () => {
  assert.throws(() => assertOperationalMemoryConstitution(), /CONSTITUTION_SNAPSHOT_REQUIRED/);
  assert.throws(() => assertOperationalMemoryConstitution({}), /CONSTITUTION_SNAPSHOT_REQUIRED/);
  const e = episode();
  assert.equal(assertOperationalMemoryConstitution(e), true);
  assert.throws(() => assertOperationalMemoryConstitution({ ...e, breaker_touched: true }), /BREAKER/);
  assert.throws(() => assertOperationalMemoryConstitution({ ...e, hidden_memory: true }), /TRACEABLE/);
  assert.throws(() => assertOperationalMemoryConstitution({ ...e, authority_transfer: true }), /AUTHORITY/);
  assert.throws(() => assertOperationalMemoryConstitution({ ...e, auto_merge: true }), /MERGE/);
  assert.throws(() => assertOperationalMemoryConstitution({ ...e, live: true }), /LIVE/);
  assert.throws(() => assertOperationalMemoryConstitution({ ...e, claim_v0: true }), /CLAIM_V0/);
});
