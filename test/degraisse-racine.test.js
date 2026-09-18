import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Portes: stay at repo root. Everything else descends over time. */
export const PORTES = Object.freeze([
  "README.md",
  "FILE.md",
  "INTEROP-IA.md",
  "PORTES.md",
  "COGNITION.md",
  "CHARTE.md",
  "AGENTS.md",
  "JUGE.md",
  "GARDE.md",
  "FLUX.md",
  "AUTOMATION.md",
  "SECURITE.md",
  "INTERNATIONAL.md",
  "NOTICE.md",
  "COPYRIGHT.md",
]);

/**
 * Graisse already on main 2026-09-14. Allowed until a menage PR moves them.
 * A NEW root .md that is in neither list fails the suite.
 */
export const GRAISSE_CONNUE = Object.freeze([
  "CAPABILITY.md",
  "COMPUTE.md",
  "CONNECTOR.md",
  "ACTES.md",
  "ADOPTION.md",
  "ALIMENTATION.md",
  "ARCHITECTURE.md",
  "ASSIGN.md",
  "ATTEST.md",
  "AUTO.md",
  "AUTONOMIE.md",
  "BOTS.md",
  "BRANCHES.md",
  "BUILD.md",
  "CHANNEL.md",
  "CHANTIERS.md",
  "COMPOSE.md",
  "CONNECT.md",
  "CONSEIL.md",
  "COUCHES.md",
  "COUTS.md",
  "CROISSANCE.md",
  "CURSOR-CLOUD.md",
  "CURSOR.md",
  "ETAGES.md",
  "EVAL.md",
  "EXPERIENCE.md",
  "FILM.md",
  "FORMAL.md",
  "GROKME.md",
  "HOOKS.md",
  "HORIZONS.md",
  "HOTE.md",
  "IDEES.md",
  "INDUSTRIE.md",
  "INTER-ORGANISM.md",
  "INTERDIT.md",
  "KEM.md",
  "LANCEMENT.md",
  "MERGE.md",
  "MODE-QUANTIQUE.md",
  "MODELES.md",
  "NERVE.md",
  "NOM.md",
  "OBJECTIF.md",
  "OMNI-ECOSYSTEM.md",
  "ORGANISM.md",
  "OTS.md",
  "PARCOURS.md",
  "PHILOSOPHIE.md",
  "PROJETS.md",
  "PROMPT_GROK_BUILD.md",
  "PROPOSAL.md",
  "PUNCH-PORTE-INTEROP.md",
  "QUANTUM-MASTER.md",
  "REFLEXION.md",
  "RENTE-TARIF.md",
  "RENTE.md",
  "REVUE-PROJECTION.md",
  "REVUE-test-log.md",
  "REVUE.md",
  "SCHEMAS_NOTICE.md",
  "SDK.md",
  "STEWARD.md",
  "TACHES-MESH.md",
  "UFHY1-PROFILE.md",
  "VILLES.md",
  "preview-docs.md",
]);

function rootMarkdown() {
  return readdirSync(ROOT).filter((n) => n.endsWith(".md"));
}

describe("dégraissage racine — permanent", () => {
  it("does not add a new root markdown outside PORTES and GRAISSE_CONNUE", () => {
    const allowed = new Set([...PORTES, ...GRAISSE_CONNUE]);
    const extra = rootMarkdown().filter((n) => !allowed.has(n));
    assert.deepEqual(extra, [], `nouvelle graisse à la racine: ${extra.join(", ")}`);
  });

  it("PORTES stay distinct from known fat", () => {
    const fat = new Set(GRAISSE_CONNUE);
    for (const p of PORTES) assert.equal(fat.has(p), false, p);
  });
});
