import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AUTO = readFileSync(join(ROOT, "AUTOMATION.md"), "utf8");

describe("AUTOMATION.md — cloisonnement infrastructure + corpus", () => {
  it("allowlists access, keeps Claude read-only, excludes REVUE corpus, builds no schema this cycle", () => {
    assert.match(AUTO, /## Cloisonnement infrastructure/);
    assert.match(AUTO, /Allowlist \*\*positive\*\*/);
    assert.match(AUTO, /Claude = lecture seule/);
    assert.match(AUTO, /Aucune action Git/);
    assert.match(AUTO, /## Cloisonnement corpus \(REVUE Phase 1\)/);
    assert.match(AUTO, /IA → corpus → IA/);
    assert.match(AUTO, /dataset\.v0\.json/);
    assert.match(AUTO, /modele\.v0\.json/);
    assert.match(AUTO, /non construit ce cycle/);
    assert.match(AUTO, /Pas un fork de `mesh\.v0\.json`/);
    assert.equal(existsSync(join(ROOT, "schema/dataset.v0.json")), false);
    assert.equal(existsSync(join(ROOT, "schema/modele.v0.json")), false);
    const table = AUTO.slice(
      AUTO.indexOf("| Claude / Gemini"),
      AUTO.indexOf("| Claude / Gemini") + 200,
    );
    assert.match(table, /revue \/ LU \/ challenger/);
    assert.doesNotMatch(table, /ouvre la PR/);
  });
});
