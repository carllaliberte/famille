import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { cursorGate } from "../.github/swarm/cadence.mjs";
import { seal } from "../scripts/official-seal.mjs";
import { peutDire } from "../sdk/peut-dire.js";

const steward = readFileSync(new URL("../STEWARD.md", import.meta.url), "utf8");
const cursor = readFileSync(new URL("../CURSOR.md", import.meta.url), "utf8");
const osExample = JSON.parse(
  readFileSync(new URL("../examples/attest-os.json", import.meta.url), "utf8"),
);

describe("bot — 404 vitrine n'est pas un HOLD wrangler", () => {
  it("locks steward + cursor: HTML 404 is not the card and not the hole", () => {
    assert.match(steward, /Les certitudes ont une date de fin/);
    assert.match(cursor, /Les certitudes ont une date de fin/);
    assert.match(steward, /acorn-royal-dune-blend\.grok\.me/);
    assert.match(steward, /Preview ≠ receipt/);
    assert.match(steward, /GET [` /]*juge/);
    assert.match(steward, /sur la vitrine = 404 HTML/);
    assert.match(steward, /Pas un HOLD wrangler/);
    assert.match(steward, /404 ≠ carte juge/);
    assert.match(steward, /404 ≠ trou epsilon \/ horizon/);
    assert.match(cursor, /acorn-royal-dune-blend\.grok\.me/);
    assert.match(cursor, /GET [` /]*juge/);
    assert.match(cursor, /vitrine = 404 HTML/);
    assert.match(cursor, /Pas un HOLD wrangler/);
    assert.match(cursor, /404 ≠ carte juge/);
    assert.match(cursor, /404 ≠ trou epsilon \/ horizon/);
    assert.doesNotMatch(steward, /404 → HOLD Carl/);
    assert.doesNotMatch(cursor, /404 → HOLD Carl/);
    assert.doesNotMatch(steward, /quantum-safe/i);
    assert.doesNotMatch(cursor, /sealed forever/i);
  });

  it("does not fill epsilon or horizon on the published os example", () => {
    const r = peutDire(osExample, { today: "2026-09-09" });
    assert.equal(r.quantique, false);
    assert.equal(r.mode, "classique");
    assert.deepEqual(r.manques, ["epsilon", "horizon"]);
    assert.equal(osExample.epsilon, null);
    assert.equal(osExample.horizon, "");
    assert.equal(r.preview, true);
  });

  it("cursorGate READY is one act, not a missing card", () => {
    const one = cursorGate({ repo: "famille", openPrs: [] });
    assert.equal(one.action, "ONE");
    assert.equal(one.state, "READY");
    assert.equal(one.auto_merge, false);
    assert.equal(one.live, false);
    const s = seal();
    assert.equal(s.phi.status, "CHANNEL NOT PRESENT");
    assert.equal(s.zk.status, "CHANNEL NOT PRESENT");
    assert.equal(s.bft.status, "CHANNEL NOT PRESENT");
    assert.equal(s.live, false);
    assert.equal(s.auto_merge, false);
  });
});
