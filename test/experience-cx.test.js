import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { seal } from "../scripts/official-seal.mjs";
import { peutDire } from "../sdk/peut-dire.js";

const exp = readFileSync(new URL("../EXPERIENCE.md", import.meta.url), "utf8");
const osExample = JSON.parse(
  readFileSync(new URL("../examples/attest-os.json", import.meta.url), "utf8"),
);

describe("cx — trou attest-os nommé, pas comblé", () => {
  it("names the hole on the client door: missing field stays classique, not VERT", () => {
    assert.match(exp, /Les certitudes ont une date de fin/);
    assert.match(exp, /Champ manquant → classique/);
    assert.match(exp, /Pas VERT inventé/);
    assert.match(exp, /attest-os\.json/);
    assert.match(exp, /epsilon et horizon manquent/);
    assert.match(exp, /On ne le comble pas/);
    assert.match(exp, /acorn-royal-dune-blend\.grok\.me/);
    assert.match(exp, /canal ≠ vitrine/);
    assert.match(exp, /Pas un HOLD wrangler/);
    assert.doesNotMatch(exp, /punch-list Carl \/ wrangler/);
    assert.match(exp, /Jamais « quantum-safe »/);
    assert.match(exp, /Jamais « sealed forever »/);
    assert.match(exp, /ne voit pas Φ/);
    assert.match(exp, /CHANNEL NOT PRESENT/);
    assert.match(exp, /Un 200 n'est pas VERT/);
    assert.match(exp, /CHANNEL NOT PRESENT n'est pas VERT/);
  });

  it("does not paint official-seal Φ as a door color", () => {
    const s = seal();
    assert.equal(s.phi.status, "CHANNEL NOT PRESENT");
    assert.equal(s.phi.value, null);
    assert.equal(s.zk.status, "CHANNEL NOT PRESENT");
    assert.equal(s.bft.status, "CHANNEL NOT PRESENT");
    assert.equal(s.live, false);
    assert.equal(s.auto_merge, false);
    assert.match(exp, /Ce n'est pas une couleur/);
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
});
