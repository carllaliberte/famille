import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

const HEADER =
  "Copyright (c) 2026 Carl Laliberté. Tous droits réservés sauf mention contraire dans LICENSE.";

describe("copyright mechanics — options only, no legal choice", () => {
  it("does not add or replace a final LICENSE in this gesture", () => {
    const open = read("LICENSE.option-open");
    const closed = read("LICENSE.option-closed");
    assert.match(open, /^MIT License/m);
    assert.match(open, /Copyright \(c\) 2026 Carl Laliberté/);
    assert.match(open, /Permission is hereby granted/);
    assert.match(closed, /All rights reserved/i);
    assert.match(closed, /Tous droits réservés/);
    assert.match(closed, /Public visibility is not a/);
    assert.match(closed, /prior written authorization/);
    assert.doesNotMatch(closed, /Permission is hereby granted/);
    // Active LICENSE on main, if present, stays MIT until Carl renames.
    assert.equal(existsSync(join(ROOT, "LICENSE")), true);
    const active = read("LICENSE");
    assert.match(active, /^MIT License/m);
    assert.notEqual(active, closed);
  });

  it("NOTICE.md is factual production process, not a legal position", () => {
    const notice = read("NOTICE.md");
    assert.match(notice, /contributions humaines/);
    assert.match(notice, /Carl Laliberté/);
    assert.match(notice, /Grok/);
    assert.match(notice, /Claude/);
    assert.match(notice, /Gemini/);
    assert.match(notice, /ChatGPT/);
    assert.match(notice, /DeepSeek/);
    assert.match(notice, /REVUE\.md/);
    assert.match(notice, /acorn\.v0/);
    assert.match(
      notice,
      /Ce document décrit le processus de production, il ne constitue pas une position juridique sur la titularité des droits\./,
    );
    assert.match(notice, /LICENSE\.option-open/);
    assert.match(notice, /LICENSE\.option-closed/);
    assert.doesNotMatch(notice, /titulaire des droits d'auteur est/);
  });

  it("distinctive files carry a neutral two-line header", () => {
    for (const p of ["REVUE.md", "unforge-check/OTS.md", "KEM.md"]) {
      const text = read(p);
      const head = text.split("\n").slice(0, 4).join("\n");
      assert.match(head, /Copyright \(c\) 2026 Carl Laliberté/);
      assert.match(head, /Tous droits réservés sauf mention contraire dans LICENSE/);
      assert.ok(text.includes(HEADER));
    }
  });

  it("JSON schemas stay parseable — copyright lives in SCHEMAS_NOTICE.md", () => {
    const notice = read("SCHEMAS_NOTICE.md");
    assert.match(notice, /Copyright \(c\) 2026 Carl Laliberté/);
    assert.match(notice, /schema\/mesh\.v0\.json/);
    assert.match(notice, /schema\/juge\.v0\.json/);
    assert.match(notice, /schema\/flux\.v0\.json/);
    assert.match(notice, /schema\/kem\.v0\.json/);
    assert.match(notice, /intouché/);
    assert.match(notice, /check\.py/);
    assert.match(notice, /oubli\.py/);
    const juge = JSON.parse(read("schema/juge.v0.json"));
    const flux = JSON.parse(read("schema/flux.v0.json"));
    const mesh = JSON.parse(read("schema/mesh.v0.json"));
    assert.equal(juge.title, "famille.juge.v0");
    assert.deepEqual(juge.required, ["quelle", "temoin", "epsilon", "horizon"]);
    assert.equal(flux.title, "famille.flux.v0");
    assert.equal(mesh.title, "famille.mesh.v0");
    for (const p of [
      "schema/juge.v0.json",
      "schema/flux.v0.json",
      "schema/mesh.v0.json",
    ]) {
      const raw = read(p);
      assert.equal(raw.trimStart()[0], "{");
      assert.doesNotMatch(raw, /Copyright \(c\)/);
    }
  });

  it("does not vendor sibling check.py / oubli.py and does not touch AUTOMATION.md for this gesture", () => {
    assert.equal(existsSync(join(ROOT, "unforge-check/check.py")), false);
    assert.equal(existsSync(join(ROOT, "unforge-check/oubli.py")), false);
    const auto = read("AUTOMATION.md");
    assert.doesNotMatch(auto, /LICENSE\.option-/);
    assert.doesNotMatch(auto, /NOTICE\.md/);
    assert.match(auto, /ots-bot/);
  });

  it("FILE.md records the options without renaming LICENSE", () => {
    const file = read("FILE.md");
    assert.match(file, /license-options/);
    assert.match(file, /LICENSE\.option-open/);
    assert.match(file, /LICENSE\.option-closed/);
    assert.match(file, /Pas de rename en `LICENSE`/);
    assert.match(file, /pas une position juridique/);
  });

  it("does not name gas, coins, or default PQC activation", () => {
    for (const p of [
      "NOTICE.md",
      "SCHEMAS_NOTICE.md",
      "LICENSE.option-open",
      "LICENSE.option-closed",
    ]) {
      const t = read(p);
      assert.doesNotMatch(t, /frais de gas/i);
      assert.doesNotMatch(t, /gas fees/i);
      assert.doesNotMatch(t, /PQC par défaut/i);
    }
  });
});
