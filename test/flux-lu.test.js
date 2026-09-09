import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { isCalendarDay, peutDire } from "../sdk/peut-dire.js";
import { makeClaim, markLu } from "../.github/swarm/claim.mjs";

const flux = readFileSync(new URL("../FLUX.md", import.meta.url), "utf8");
const walk = readFileSync(new URL("../examples/flux-v0.md", import.meta.url), "utf8");
const osExample = JSON.parse(
  readFileSync(new URL("../examples/attest-os.json", import.meta.url), "utf8"),
);

describe("flux — LU n'est pas consulter", () => {
  it("keeps the named hole: missing field stays classique", () => {
    assert.match(flux, /Un champ de carte manquant → MODE reste classique\. Pas d'invention\./);
    assert.match(flux, /Lire n'est pas consommer/);
    assert.match(flux, /claim\.v0/);
    assert.match(flux, /Pas une 5e carte/);
    assert.match(walk, /Ce n'est pas l'étape 2 \(`consulter`\)/);
  });

  it("names two horizon cards and refuses UFHY1 as a date", () => {
    assert.match(flux, /Deux horizons/);
    assert.match(flux, /horizon\.v0/);
    assert.match(flux, /re_presser_avant/);
    assert.match(flux, /UFHY1 nomme une suite/);
    assert.match(walk, /Les certitudes ont une date de fin/);
    assert.match(walk, /Deux horizons/);
    assert.match(walk, /horizon\.v0/);
    assert.match(walk, /UFHY1 est un nom de suite, pas une date/);
    assert.equal(isCalendarDay("UFHY1"), false);
    const ufhy = peutDire(
      { quelle: "os", temoin: "aucun", epsilon: 1e-6, horizon: "UFHY1" },
      { today: "2026-09-09" },
    );
    assert.equal(ufhy.quantique, false);
    assert.equal(ufhy.mode, "classique");
    assert.equal(ufhy.refus.code, "horizon");
    const fused = peutDire(
      {
        quelle: "os",
        temoin: "aucun",
        epsilon: 1e-6,
        horizon: { suite: "UFHY1", re_presser_avant: "2028-08-31" },
      },
      { today: "2026-09-09" },
    );
    assert.equal(fused.quantique, false);
    assert.equal(fused.mode, "classique");
    assert.equal(fused.refus.code, "horizon");
  });

  it("does not fill epsilon or horizon on the published os example", () => {
    const r = peutDire(osExample, { today: "2026-09-09" });
    assert.equal(r.quantique, false);
    assert.equal(r.mode, "classique");
    assert.deepEqual(r.manques, ["epsilon", "horizon"]);
    assert.equal(osExample.epsilon, null);
    assert.equal(osExample.horizon, "");
  });

  it("LU attests process, not content, and refuses a hashless stamp", () => {
    const hold = makeClaim({
      source: "FLUX.md",
      agent: "cursor",
      method: "lu",
      statement: "Lire n'est pas consommer",
      ts: "2026-09-09T05:33:04.000Z",
    });
    assert.equal(hold.claim.attestation, "processus");
    assert.equal(hold.claim.truth, false);
    assert.equal(markLu(hold.claim, "sonnet").code, "LU_NO_EVIDENCE");
    const lu = markLu(hold.claim, "sonnet", "b".repeat(32));
    assert.equal(lu.ok, true);
    assert.equal(lu.claim.attestation, "processus");
    assert.equal(lu.claim.truth, false);
  });
});
