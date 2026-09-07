import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEXT = readFileSync(join(ROOT, "AGENTS.md"), "utf8");

describe("AGENTS.md — doctrine, not a node", () => {
  it("does not keep oubli.py as an open file without flock", () => {
    assert.doesNotMatch(TEXT, /File ouverte : `oubli\.py` unlink sans jail\/flock/);
    assert.match(TEXT, /flock LOCK_EX sur l'objet/);
    assert.match(TEXT, /Sidecar `\.lock` n'est pas la jail/);
  });

  it("names FILE.md HOLD as human, not a CODE hole here", () => {
    assert.match(TEXT, /HOLD FILE\.md \(humain\)/);
    assert.match(TEXT, /clés Actions famille/);
    assert.match(TEXT, /Jamais `PRÉSENT`/);
    assert.match(TEXT, /File ouverte CODE : aucune ici/);
  });
});
