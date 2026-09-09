import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CRYPTO_LIMITS,
  asOf,
  at,
  contest,
  decide,
  makeClaim,
  markLu,
} from "../.github/swarm/claim.mjs";

const HASH = "a".repeat(32);

describe("claim.v0 — certainties expire", () => {
  it("does not invent provenance, does not treat expired as false, builder cannot LU self", () => {
    assert.equal(makeClaim({ verified: true, statement: "x" }).code, "NO_ETERNAL");
    const unknown = makeClaim({ statement: "fibre exists" });
    assert.equal(unknown.ok, true);
    assert.equal(unknown.claim.provenance, "UNKNOWN");
    assert.equal(unknown.claim.state, "UNKNOWN");
    assert.equal(unknown.claim.truth, false);
    assert.equal(unknown.claim.attestation, "processus");
    const dated = makeClaim({
      source: "lease.mjs",
      agent: "build",
      method: "npm-test",
      statement: "207 tests green",
      ts: "2026-09-09T04:00:00.000Z",
      until: "2026-09-09T05:00:00.000Z",
    });
    assert.equal(dated.claim.provenance, "STATED");
    assert.equal(dated.claim.state, "HOLD");
    const old = at(dated.claim, Date.parse("2026-09-09T06:00:00.000Z"));
    assert.equal(old.claim.state, "EXPIRED");
    assert.equal(old.claim.current, false);
    assert.equal(old.claim.false, false);
    assert.equal(old.claim.not_current, true);
    assert.equal(markLu(dated.claim, "build", HASH).code, "SELF_REVIEW");
    assert.equal(markLu(dated.claim, "sonnet").code, "LU_NO_EVIDENCE");
    assert.equal(markLu(dated.claim, "sonnet", HASH).ok, true);
    assert.equal(markLu(dated.claim, "sonnet", HASH).claim.attestation, "processus");
    assert.equal(markLu(dated.claim, "sonnet", HASH).claim.truth, false);
    const clash = contest(dated.claim, unknown.claim);
    assert.equal(clash.conflict.vote, false);
    assert.equal(decide(clash.conflict, "gemini").code, "HUMAN_ONLY");
    assert.equal(decide(clash.conflict, "carllaliberte").ok, true);
    const echo = contest(
      { ...dated.claim, vendor: "xai", agent: "grok" },
      { ...unknown.claim, vendor: "xai", agent: "grok-heavy" },
    );
    assert.equal(echo.code, "ECHO");
    const snap = asOf([dated.claim], Date.parse("2026-09-09T06:00:00.000Z"));
    assert.equal(snap.claims[0].state, "EXPIRED");
    assert.ok(CRYPTO_LIMITS.does_not_prove.includes("truth"));
  });
});
