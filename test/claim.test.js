import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { at, contest, decide, makeClaim, markLu } from "../.github/swarm/claim.mjs";

describe("claim.v0 — certainties expire", () => {
  it("does not invent provenance, does not treat expired as false, builder cannot LU self", () => {
    assert.equal(makeClaim({ verified: true, statement: "x" }).code, "NO_ETERNAL");
    const unknown = makeClaim({ statement: "fibre exists" });
    assert.equal(unknown.ok, true);
    assert.equal(unknown.claim.provenance, "UNKNOWN");
    assert.equal(unknown.claim.state, "UNKNOWN");
    assert.equal(unknown.claim.truth, false);
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
    assert.equal(markLu(dated.claim, "build").code, "SELF_REVIEW");
    assert.equal(markLu(dated.claim, "sonnet").ok, true);
    const clash = contest(dated.claim, unknown.claim);
    assert.equal(clash.conflict.vote, false);
    assert.equal(decide(clash.conflict, "gemini").code, "HUMAN_ONLY");
    assert.equal(decide(clash.conflict, "carllaliberte").ok, true);
  });
});
