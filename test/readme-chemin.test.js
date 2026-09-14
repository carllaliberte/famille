import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");
const head = readme.split("\n").slice(0, 40).join("\n");

describe("README 30-second path — cloneur, dev, Carl", () => {
  it("keeps the door line, then the happy path without a key", () => {
    assert.match(head, /Les certitudes ont une date de fin/);
    assert.match(head, /## 30 secondes/);
    assert.match(head, /npm test/);
    assert.match(head, /Pas de clé/);
    assert.match(head, /Carl squash\/merge/);
  });

  it("names this-repo vs not-this-repo and does not claim LIVE", () => {
    assert.match(readme, /\| Ce repo \| Pas ce repo \|/);
    assert.match(readme, /crédits 0/);
    assert.match(readme, /GitHub Actions qui joindrait `127\.0\.0\.1`/);
    assert.match(readme, /REAL_RESPONSE=0/);
    assert.match(readme, /Job GitHub ✓ ≠ REAL/);
    assert.doesNotMatch(readme, /réseau mondial/i);
    assert.doesNotMatch(readme, /\bREADY\b/);
    assert.doesNotMatch(readme, /auto_merge:\s*true/);
    assert.doesNotMatch(readme, /OLLAMA_HOST=127\.0\.0\.1/);
  });
});
