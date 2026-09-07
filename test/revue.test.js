import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { connectAgent, resetGuests } from "../.github/swarm/flux.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEXT = readFileSync(join(ROOT, "REVUE.md"), "utf8");
const AUTO = readFileSync(join(ROOT, "AUTOMATION.md"), "utf8");

describe("REVUE.md — two phases, file is the bridge, arbiter never debates", () => {
  it("does not rewrite AUTOMATION.md", () => {
    assert.match(TEXT, /ne change pas/i);
    assert.match(TEXT, /AUTOMATION\.md/);
    assert.match(AUTO, /commentaires de PR \+ FILE\.md/);
    assert.match(AUTO, /n'est plus le messager/);
  });

  it("names fixed arbitre and build, non-interchangeable", () => {
    assert.match(TEXT, /`arbitre`/);
    assert.match(TEXT, /Grok Arbitre/);
    assert.match(TEXT, /`build`/);
    assert.match(TEXT, /Grok Build/);
    assert.match(TEXT, /non-interchangeables/);
    assert.match(TEXT, /Jamais la même session/);
  });

  it("phase 1 readers include Claude Gemini ChatGPT DeepSeek", () => {
    assert.match(TEXT, /Claude/);
    assert.match(TEXT, /Gemini/);
    assert.match(TEXT, /ChatGPT/);
    assert.match(TEXT, /DeepSeek/);
    assert.match(TEXT, /verdict: LU \| HOLD \| OBJECTION/);
    assert.match(TEXT, /phase2_seen: false/);
    assert.match(TEXT, /Gemini n'est pas lecteur-seul/);
    assert.match(TEXT, /Jamais d'écriture \(code, `main`, merge\)/);
  });

  it("phase 2 includes Grok variants except arbitre", () => {
    for (const id of ["heavy", "build", "expert", "fast", "auto", "grok-bot"]) {
      assert.match(TEXT, new RegExp("`" + id + "`"));
    }
    assert.match(TEXT, /Interdit : `from: arbitre`/);
    assert.match(TEXT, /Carl n'est pas participant/);
  });

  it("arbiter packet confirms non-participation structurally", () => {
    assert.match(TEXT, /phase2_participated: false/);
    assert.match(TEXT, /distincte_de_phase2_ce_jour: true/);
    assert.match(TEXT, /Si aucune instance dédiée/);
    assert.match(TEXT, /Ne bascule jamais/);
    assert.match(TEXT, /Jamais à Grok Build pour décision/);
  });

  it("the shared file is the bridge — no webhook, no bot", () => {
    assert.match(TEXT, /\*\*EST\*\* le pont/);
    assert.match(TEXT, /Pas de webhook/);
    assert.match(TEXT, /Pas de bot inter-IA/);
    assert.match(TEXT, /Swarm ne circule pas/);
    assert.match(TEXT, /demande explicite de Carl/);
    assert.match(TEXT, /Carl seul merge/);
    assert.doesNotMatch(TEXT, /parler à travers cette page/);
  });

  it("Carl checks pesee before squash; only build writes code", () => {
    assert.match(TEXT, /decision: AVANCER \| AJUSTER \| BLOQUE/);
    assert.match(TEXT, /Seul `build` écrit/);
    assert.match(TEXT, /justification de l'arbitrage/);
    assert.match(TEXT, /## Lot en cours/);
  });

  it("section 7 reduces portage without dropping the locks", () => {
    assert.match(TEXT, /## 7\. Objectif de réduction du portage manuel/);
    assert.match(TEXT, /pas la cible/);
    assert.match(TEXT, /Indépendance Phase 1/);
    assert.match(TEXT, /structurellement.*hors Phase 2/);
    assert.match(TEXT, /vérifier `pesee` avant squash/);
    assert.match(TEXT, /ne fait pas circuler/);
    assert.match(TEXT, /Transmission automatique vers l'arbitre/);
    const six = TEXT.indexOf("## 6. État actuel");
    const seven = TEXT.indexOf("## 7. Objectif de réduction");
    const lot = TEXT.indexOf("## Lot en cours");
    assert.ok(six > 0 && seven > six && lot > seven);
  });

  it("ancre + profondeur + changelog, no parallel canal", () => {
    assert.match(TEXT, /ancre: <url du lot citée, ou "aucune">/);
    assert.match(TEXT, /profondeur: SURFACE \| VERIFIE/);
    assert.match(TEXT, /ANCRAGE_MANQUANT/);
    assert.match(TEXT, /vérifie l'ancrage de chaque bloc/);
    assert.match(TEXT, /Pas de canal parallèle/);
    assert.match(TEXT, /## Changelog du protocole/);
    const seven = TEXT.indexOf("## 7. Objectif de réduction");
    const log = TEXT.indexOf("## Changelog du protocole");
    const lot = TEXT.indexOf("## Lot en cours");
    assert.ok(seven > 0 && log > seven && lot > log);
  });

  it("cycle-1 lot marks ANCRAGE_MANQUANT and does not fake arbitre", () => {
    assert.match(TEXT, /lot: ml-kem-001/);
    assert.match(TEXT, /statut: ANCRAGE_MANQUANT/);
    assert.match(TEXT, /arbitrage:\n  - HOLD/);
    assert.doesNotMatch(TEXT, /arbitrage:\n  - \|\n    REVUE phase:arbitrage/);
    assert.doesNotMatch(TEXT, /quantum-safe/i);
    assert.doesNotMatch(TEXT, /HORIZON Watch/);
  });

  it("preuve de lecture is required beyond URL ancrage", () => {
    assert.match(TEXT, /### Preuve de lecture/);
    assert.match(TEXT, /preuve: <citation courte/);
    assert.match(TEXT, /PREUVE_INSUFFISANTE/);
    assert.match(TEXT, /jamais `LU` par défaut/);
    assert.match(TEXT, /Traçabilité, pas effacement/);
    assert.match(TEXT, /SURFACE` non confirmé/);
  });

  it("3bis risk palier defaults HIGH; periodic audit exists", () => {
    assert.match(TEXT, /## 3bis\. Paliers de risque/);
    assert.match(TEXT, /défaut = \*\*HIGH\*\*/);
    assert.match(TEXT, /jamais LOW par défaut/);
    assert.match(TEXT, /## Audit périodique/);
    assert.match(TEXT, /Tous les 10 lots/);
    const three = TEXT.indexOf("## 3. Flux");
    const bis = TEXT.indexOf("## 3bis. Paliers");
    const four = TEXT.indexOf("## 4. Arbitrage");
    const log = TEXT.indexOf("## Changelog du protocole");
    const audit = TEXT.indexOf("## Audit périodique");
    const lot = TEXT.indexOf("## Lot en cours");
    assert.ok(three > 0 && bis > three && four > bis);
    assert.ok(log > 0 && audit > log && lot > audit);
  });

  it("4bis hard locks force BLOQUE and are not arbitrable", () => {
    assert.match(TEXT, /## 4bis\. Verrous durs \(non-arbitrables\)/);
    assert.match(TEXT, /juge\.v0\.json/);
    assert.match(TEXT, /flux\.v0\.json/);
    assert.match(TEXT, /AUTOMATION\.md/);
    assert.match(TEXT, /verrou_dur: <catégorie touchée, ou "aucun">/);
    assert.match(TEXT, /decision: BLOQUE` \*\*automatique\*\*/);
    assert.match(TEXT, /hors du fichier/);
    const four = TEXT.indexOf("## 4. Arbitrage");
    const bis = TEXT.indexOf("## 4bis. Verrous durs");
    const five = TEXT.indexOf("## 5. Exécution");
    assert.ok(four > 0 && bis > four && five > bis);
  });

  it("post-merge reads pin SHA not main (CDN stale)", () => {
    assert.match(TEXT, /utiliser le SHA, pas `main`/);
    assert.match(TEXT, /raw\.githubusercontent\.com\/\{owner\}\/\{repo\}\/\{sha\}\/\{fichier\}/);
    assert.match(TEXT, /suspecter le cache/);
    const six = TEXT.indexOf("## 6. État actuel");
    const pin = TEXT.indexOf("### Lecture juste après un merge");
    const seven = TEXT.indexOf("## 7. Objectif");
    assert.ok(six > 0 && pin > six && seven > pin);
  });

  it("mesh cannot seat arbitre as a guest", () => {
    resetGuests();
    const r = connectAgent({ id: "arbitre", name: "Grok Arbitre" });
    assert.equal(r.ok, false);
    assert.equal(r.code, "RESERVED_ID");
  });
});
