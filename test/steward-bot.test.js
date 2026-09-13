import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { cursorGate } from "../.github/swarm/cadence.mjs";
import { seal } from "../scripts/official-seal.mjs";
import { peutDire } from "../sdk/peut-dire.js";

const steward = readFileSync(new URL("../STEWARD.md", import.meta.url), "utf8");
const cursor = readFileSync(new URL("../CURSOR.md", import.meta.url), "utf8");
const agents = readFileSync(new URL("../AGENTS.md", import.meta.url), "utf8");
const osExample = JSON.parse(
  readFileSync(new URL("../examples/attest-os.json", import.meta.url), "utf8"),
);

describe("bot — vitrine /juge 404 n'est pas PRÉSENT", () => {
  it("names 404 HTML as not PRESENT, not a missing card, not wrangler", () => {
    for (const doc of [steward, cursor, agents]) {
      assert.match(doc, /GET [` /]*juge/);
      assert.match(doc, /404 HTML/);
      assert.match(doc, /Pas PRÉSENT/);
      assert.match(doc, /404 ≠ carte juge/);
      assert.doesNotMatch(doc, /404 → HOLD Carl/);
      assert.doesNotMatch(doc, /404 = HOLD Carl/);
    }
    assert.match(steward, /Pas un bind wrangler/);
    assert.match(steward, /Cursor consomme le juge/);
    assert.match(cursor, /Pas un HOLD wrangler/);
    assert.match(agents, /HOLD FILE ≠ 404 vitrine/);
    assert.match(agents, /HOLD FILE\.md \(humain\)/);
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

  it("keeps official-seal and cursorGate off the door", () => {
    const s = seal();
    assert.equal(s.phi.status, "CHANNEL NOT PRESENT");
    assert.equal(s.zk.status, "CHANNEL NOT PRESENT");
    assert.equal(s.bft.status, "CHANNEL NOT PRESENT");
    assert.equal(s.live, false);
    assert.equal(s.auto_merge, false);
    const g = cursorGate({ repo: "famille", openPrs: [] });
    assert.equal(g.action, "ONE");
    assert.equal(g.state, "READY");
    assert.equal(g.auto_merge, false);
    assert.equal(g.live, false);
  });
});
