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

  it("mesh cannot seat arbitre as a guest", () => {
    resetGuests();
    const r = connectAgent({ id: "arbitre", name: "Grok Arbitre" });
    assert.equal(r.ok, false);
    assert.equal(r.code, "RESERVED_ID");
  });
});
