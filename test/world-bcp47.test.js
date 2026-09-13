import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { HOTE, PACK_FILES, packLieu } from "../sdk/pack-lieu.js";
import { peutDire } from "../sdk/peut-dire.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKS = join(ROOT, "packs");
const KEYS = [
  "tag",
  "titre",
  "ligne",
  "sous_ligne",
  "vert",
  "ambre",
  "rouge",
  "classique",
  "apercu",
  "silence",
];
const TAGS = ["fr-CA", "en", "es-MX", "en-NG", "pt-BR", "de-DE"];
const HOST = "https://acorn-royal-dune-blend.grok.me";

const read = (p) => readFileSync(join(ROOT, p), "utf8");

describe("world BCP 47 — same judge, local phrases only", () => {
  it("lists the six born packs and no extra json", () => {
    const files = readdirSync(PACKS)
      .filter((f) => f.endsWith(".json"))
      .sort();
    assert.deepEqual(
      files,
      TAGS.map((t) => `${t}.json`).sort(),
    );
  });

  it("each pack has the door keys, matching tag, no empty phrase", () => {
    for (const tag of TAGS) {
      const pack = JSON.parse(read(`packs/${tag}.json`));
      assert.deepEqual(Object.keys(pack).sort(), [...KEYS].sort(), tag);
      assert.equal(pack.tag, tag);
      assert.equal(pack.titre, "Famille");
      for (const key of KEYS) {
        assert.equal(typeof pack[key], "string", `${tag}.${key}`);
        assert.ok(pack[key].trim().length > 0, `${tag}.${key} empty`);
      }
    }
  });

  it("keeps the human phrases and refuses a second slug", () => {
    const fr = JSON.parse(read("packs/fr-CA.json"));
    const en = JSON.parse(read("packs/en.json"));
    assert.equal(fr.ligne, "Les certitudes ont une date de fin.");
    assert.equal(en.ligne, "Certainties expire.");
    const corpus = [
      read("INTERNATIONAL.md"),
      read("examples/world-bcp47.md"),
      read("PORTES.md"),
      read("RENTE.md"),
      ...TAGS.map((t) => read(`packs/${t}.json`)),
    ].join("\n");
    const slugs = corpus.match(/https:\/\/[a-z0-9-]+\.grok\.me/g) || [];
    for (const slug of slugs) {
      assert.equal(slug, HOST);
    }
  });

  it("door 18 and rente name every listed tag; unknown stays spoken en", () => {
    const portes = read("PORTES.md");
    const rente = read("RENTE.md");
    const world = read("examples/world-bcp47.md");
    const intl = read("INTERNATIONAL.md");
    for (const tag of ["fr-CA", "es-MX", "en-NG", "pt-BR", "de-DE"]) {
      assert.match(portes, new RegExp(tag));
      assert.match(rente, new RegExp(tag));
      assert.match(world, new RegExp(tag));
      assert.match(intl, new RegExp(tag));
    }
    assert.match(portes, /en \/ en-CA/);
    assert.match(rente, /en \/ en-CA/);
    assert.match(world, /Tag BCP 47 sans fichier : spoken EN/);
    assert.match(world, /Casse ignorée : `fr-ca` = `fr-CA`/);
    assert.match(world, /pack-lieu/);
    assert.match(world, /ne comble pas/);
    assert.match(intl, /Tag absent du tableau : spoken/);
    assert.match(intl, /étiquette classique/);
    assert.match(intl, /pack-lieu/);
    assert.match(intl, /Casse BCP 47 ignorée/);
    assert.match(intl, /ne comble pas epsilon ni horizon/);
  });

  it("names vitrine /juge 404 as not the card, not live, not PRÉSENT", () => {
    const intl = read("INTERNATIONAL.md");
    const world = read("examples/world-bcp47.md");
    for (const text of [intl, world]) {
      assert.match(text, /Les certitudes ont une date de fin|Hôte cité unique/);
      assert.match(text, /acorn-royal-dune-blend\.grok\.me/);
      assert.match(text, /GET [` /]*juge/);
      assert.match(text, /sur la vitrine = 404 HTML/);
      assert.match(text, /Pas « live »/);
      assert.match(text, /Pas PRÉSENT/);
      assert.match(text, /Pas un bind wrangler/);
      assert.match(text, /404 ≠ carte juge/);
      assert.match(text, /404 ≠ trou epsilon \/ horizon/);
      assert.match(text, /Le pack ne comble pas/);
      assert.doesNotMatch(text, /404 → HOLD Carl/);
      assert.doesNotMatch(text, /quantum-safe/i);
      assert.doesNotMatch(text, /sealed forever/i);
    }
    assert.match(world, /Les certitudes ont une date de fin/);
  });

  it("resolves born tags, aliases en-CA, and keeps unknown spoken en", () => {
    assert.deepEqual([...PACK_FILES].sort(), TAGS.slice().sort());
    const fr = packLieu("fr-CA");
    assert.equal(fr.connu, true);
    assert.equal(fr.tag, "fr-CA");
    assert.equal(fr.pack.ligne, "Les certitudes ont une date de fin.");
    assert.equal(fr.hote, HOST);
    assert.equal(fr.hote, HOTE);
    const alias = packLieu("en-CA");
    assert.equal(alias.connu, true);
    assert.equal(alias.tag, "en");
    assert.equal(alias.demande, "en-CA");
    assert.equal(alias.pack.tag, "en");
    const door = packLieu("");
    assert.equal(door.defaut, true);
    assert.equal(door.tag, "fr-CA");
    const unknown = packLieu("it-IT");
    assert.equal(unknown.connu, false);
    assert.equal(unknown.tag, "en");
    assert.equal(unknown.raison, "inconnu");
    assert.equal(unknown.pack.ligne, "Certainties expire.");
    assert.equal(unknown.pack.classique, "It does not hold. Classical.");
    assert.equal(unknown.hote, HOST);
    const folded = packLieu("fr-ca");
    assert.equal(folded.connu, true);
    assert.equal(folded.tag, "fr-CA");
    assert.equal(folded.demande, "fr-ca");
    assert.equal(folded.pack.ligne, "Les certitudes ont une date de fin.");
    const aliasFold = packLieu("EN-CA");
    assert.equal(aliasFold.connu, true);
    assert.equal(aliasFold.tag, "en");
    assert.equal(aliasFold.demande, "EN-CA");
    const regionFold = packLieu("PT-BR");
    assert.equal(regionFold.connu, true);
    assert.equal(regionFold.tag, "pt-BR");
    const deFold = packLieu("de-de");
    assert.equal(deFold.connu, true);
    assert.equal(deFold.tag, "de-DE");
    const languageOnly = packLieu("fr");
    assert.equal(languageOnly.connu, false);
    assert.equal(languageOnly.tag, "en");
    assert.equal(languageOnly.raison, "inconnu");
  });

  it("does not fill the named card hole when choosing a pack", () => {
    const osExample = JSON.parse(read("examples/attest-os.json"));
    const lieu = packLieu("pt-BR");
    const r = peutDire(osExample, { today: "2026-09-09" });
    assert.equal(r.mode, "classique");
    assert.deepEqual(r.manques, ["epsilon", "horizon"]);
    assert.equal(osExample.epsilon, null);
    assert.equal(osExample.horizon, "");
    assert.equal(Object.hasOwn(lieu.pack, "epsilon"), false);
    assert.equal(Object.hasOwn(lieu.pack, "horizon"), false);
    assert.equal(lieu.pack.classique, "Não se sustenta. Clássico.");
  });
});
