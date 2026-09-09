import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { HOTE, quoteActe } from "../sdk/acte.js";
import { peutDire } from "../sdk/peut-dire.js";

const actes = readFileSync(new URL("../ACTES.md", import.meta.url), "utf8");
const rente = readFileSync(new URL("../RENTE.md", import.meta.url), "utf8");
const tarif = readFileSync(new URL("../RENTE-TARIF.md", import.meta.url), "utf8");
const osExample = JSON.parse(
  readFileSync(new URL("../examples/attest-os.json", import.meta.url), "utf8"),
);

describe("rente — acte classique si champ juge manque", () => {
  it("names the lock: missing field stays classique, not a four-card sale", () => {
    assert.match(actes, /Les certitudes ont une date de fin/);
    assert.match(actes, /Champ juge manquant/);
    assert.match(actes, /MODE classique/);
    assert.match(actes, /Ce n'est pas un acte à quatre cartes/);
    assert.match(actes, /On n'invente pas le prix/);
    assert.match(actes, /Preview ≠ quittance/);
    assert.match(actes, /Un 200 n'est pas un sceau/);
    assert.match(actes, /attest-os\.json/);
    assert.match(actes, /acorn-royal-dune-blend\.grok\.me/);
    assert.match(actes, /detect\.v0/);
    assert.match(actes, /Ce n'est pas une facture/);
    assert.match(actes, /quoteActe/);
    assert.match(actes, /Un 200 n'est pas une facture/);
    assert.match(rente, /Champ manquant → aperçu classique/);
    assert.match(rente, /Pas une vente à quatre cartes/);
    assert.match(rente, /Les lignes ACTES ne sont pas un tarif/);
    assert.match(rente, /quoteActe/);
    assert.match(rente, /Un 200 n'est pas une facture/);
    assert.match(tarif, /Champ manquant → MODE classique\. Pas ce tarif/);
    assert.doesNotMatch(actes, /quantum-safe/i);
    assert.doesNotMatch(actes, /sealed forever/i);
    assert.doesNotMatch(actes, /\$\d/);
  });

  it("does not fill epsilon or horizon on the published os example", () => {
    const r = peutDire(osExample, { today: "2026-09-09" });
    assert.equal(r.quantique, false);
    assert.equal(r.mode, "classique");
    assert.deepEqual(r.manques, ["epsilon", "horizon"]);
    assert.equal(osExample.epsilon, null);
    assert.equal(osExample.horizon, "");
  });

  it("lists the six born packs on the same act, one host", () => {
    for (const tag of ["fr-CA", "es-MX", "en-NG", "pt-BR", "de-DE"]) {
      assert.match(actes, new RegExp(tag));
    }
    assert.match(actes, /en \/ en-CA/);
    const slugs = actes.match(/https:\/\/[a-z0-9-]+\.grok\.me/g) || [];
    for (const slug of slugs) {
      assert.equal(slug, "https://acorn-royal-dune-blend.grok.me");
    }
  });
});

describe("rente — quoteActe never invents a price", () => {
  it("keeps attest-os classique and does not fill the hole", () => {
    const q = quoteActe(osExample, { today: "2026-09-09" });
    assert.equal(q.sale, false);
    assert.equal(q.invoice, false);
    assert.equal(q.price, null);
    assert.equal(q.seal, false);
    assert.equal(q.mode, "classique");
    assert.equal(q.reason, "champ_manquant");
    assert.deepEqual(q.manques, ["epsilon", "horizon"]);
    assert.equal(q.four_cards, false);
    assert.equal(q.need_carl, false);
    assert.equal(q.hote, HOTE);
    assert.equal(osExample.epsilon, null);
    assert.equal(osExample.horizon, "");
    const local = peutDire(osExample, { today: "2026-09-09" });
    assert.deepEqual(local.manques, q.manques);
  });

  it("treats HTTP 200 as preview, not an invoice", () => {
    const q = quoteActe(osExample, {
      today: "2026-09-09",
      http: { status: 200, path: "/juge" },
    });
    assert.equal(q.invoice, false);
    assert.equal(q.sale, false);
    assert.equal(q.price, null);
    assert.equal(q.seal, false);
    assert.equal(q.http, 200);
    assert.match(q.note, /200 n'est pas un sceau/);
    assert.deepEqual(q.manques, ["epsilon", "horizon"]);
  });

  it("names GET /juge 404 as HOLD Carl, still not a product", () => {
    const q = quoteActe(osExample, {
      today: "2026-09-09",
      http: { status: 404, path: "/juge" },
    });
    assert.equal(q.hold, true);
    assert.equal(q.reason, "hold_carl");
    assert.equal(q.sale, false);
    assert.equal(q.price, null);
    assert.deepEqual(q.manques, ["epsilon", "horizon"]);
  });

  it("refuses epsilon 0 without inventing a price", () => {
    const q = quoteActe(
      {
        quelle: "os",
        temoin: "aucun",
        epsilon: 0,
        horizon: "2028-08-31",
      },
      { today: "2026-09-09" },
    );
    assert.equal(q.sale, false);
    assert.equal(q.price, null);
    assert.equal(q.reason, "lie");
    assert.equal(q.need_carl, false);
  });

  it("four fields present still leave the price to Carl", () => {
    const q = quoteActe(
      {
        quelle: "os",
        temoin: "aucun",
        epsilon: 0.01,
        horizon: "2028-08-31",
      },
      { today: "2026-09-09" },
    );
    assert.equal(q.four_cards, true);
    assert.equal(q.need_carl, true);
    assert.equal(q.price, null);
    assert.equal(q.sale, false);
    assert.equal(q.invoice, false);
    assert.equal(q.reason, "carl_ecrit_le_prix");
    assert.equal(q.mode, "classique");
  });
});
