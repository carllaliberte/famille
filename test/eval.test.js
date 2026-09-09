import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TEXT = readFileSync(join(ROOT, "EVAL.md"), "utf8");

describe("EVAL.md — external specialist entry", () => {
  it("is a compass, not a quantum-safe pitch", () => {
    assert.match(TEXT, /Copyright \(c\) 2026 Carl Laliberté/);
    assert.match(TEXT, /schema\/juge\.v0\.json/);
    assert.match(TEXT, /schema\/mesh\.v0\.json/);
    assert.match(TEXT, /KEM\.md/);
    assert.match(TEXT, /unforge-check/);
    assert.match(TEXT, /UFHY1/);
    assert.match(TEXT, /npm test/);
    assert.match(TEXT, /evidence_hash/);
    assert.match(TEXT, /une PR/);
    assert.match(TEXT, /Défense réactive/);
    assert.match(TEXT, /Aucune frappe sortante/);
    assert.doesNotMatch(TEXT, /quantum-safe/i);
    assert.doesNotMatch(TEXT, /CONNECTED_PERMANENT/);
  });
});
