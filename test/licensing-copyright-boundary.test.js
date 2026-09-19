import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

describe("licensing / copyright boundary — documentary lock", () => {
  it("active LICENSE is MIT and is not the closed option", () => {
    assert.equal(existsSync(join(ROOT, "LICENSE")), true);
    const license = read("LICENSE");
    const closed = read("LICENSE.option-closed");
    const open = read("LICENSE.option-open");
    assert.match(license, /^MIT License/m);
    assert.match(license, /Permission is hereby granted/);
    assert.match(license, /Copyright \(c\) 2026 Carl Laliberté/);
    assert.notEqual(license, closed);
    assert.match(closed, /is not the active LICENSE file/);
    assert.match(open, /^MIT License/m);
    assert.equal(existsSync(join(ROOT, "COPYING")), false);
  });

  it("COPYRIGHT.md states MIT for this tree and does not revoke LICENSE", () => {
    const text = read("COPYRIGHT.md");
    assert.match(text, /FAMILLE map is MIT\. See LICENSE\./);
    assert.match(text, /This file does not revoke LICENSE\./);
    assert.match(text, /Files physically in this repository/);
    assert.match(text, /follow LICENSE unless a file-level grant/);
    assert.match(text, /carllaliberte\/acorn/);
    assert.match(text, /Marks are not licensed by MIT\./);
    assert.match(text, /LICENSE\.option-open and LICENSE\.option-closed are candidate texts/);
    assert.doesNotMatch(text, /ARR private \(acorn, unforge, filon-noeud\)/);
  });

  it("NOTICE protects marks and does not revoke the MIT grant for files in this repository", () => {
    const notice = read("NOTICE");
    assert.match(notice, /does not grant any rights in the FAMILLE, Acorn, or UNFORGE names/);
    assert.match(notice, /carllaliberte\/acorn/);
    assert.match(notice, /Files physically present in this repository/);
    assert.match(notice, /This NOTICE does not revoke the MIT grant in LICENSE\./);
  });

  it("README states the same boundary", () => {
    const readme = read("README.md");
    assert.match(readme, /FAMILLE map \(this repository\) is MIT/);
    assert.match(readme, /Paths in this repository whose names contain Acorn follow LICENSE/);
    assert.match(readme, /carllaliberte\/acorn/);
  });

  it("audit trace names the inspected main SHA and does not claim to rewrite LICENSE", () => {
    const audit = read("docs/licensing-copyright-audit-2026-09-19.md");
    assert.match(audit, /f60a8d99c21e8a0a3f75a6e5d01f934d1ea32d99/);
    assert.match(audit, /HOLD_HUMAN/);
    assert.doesNotMatch(audit, /revokes MIT/);
  });

  it("authority contracts remain parseable and the breaker file is present", () => {
    const juge = JSON.parse(read("schema/juge.v0.json"));
    const flux = JSON.parse(read("schema/flux.v0.json"));
    assert.equal(juge.title, "famille.juge.v0");
    assert.equal(flux.title, "famille.flux.v0");
    assert.equal(existsSync(join(ROOT, ".github/swarm/system-breaker.mjs")), true);
  });
});
