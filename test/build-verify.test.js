import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

describe("make + build-verify — native node, not rust/python", () => {
  it("Makefile gates build/test without rustc or python", () => {
    const mk = read("Makefile");
    assert.match(mk, /^test:\n\tnpm test/m);
    assert.match(mk, /node --check \.github\/swarm\/kernel\.mjs/);
    assert.doesNotMatch(mk, /^\t(rustc|cargo|python3|wrangler)/m);
    assert.match(mk, /No photon/);
  });

  it("build-verify.yml runs make on PR, never pushes main, never auto-merge", () => {
    const yml = read(".github/workflows/build-verify.yml");
    assert.match(yml, /^on:\n  pull_request:\n  push:\n    branches: \[main\]/m);
    assert.match(yml, /make build/);
    assert.match(yml, /make test/);
    assert.doesNotMatch(yml, /rustup|dtolnay\/rust-toolchain|python-version:/);
    assert.doesNotMatch(yml, /wrangler deploy/);
    assert.doesNotMatch(yml, /git push/);
    assert.doesNotMatch(yml, /gh pr merge/);
    assert.doesNotMatch(yml, /contents: write/);
    assert.match(yml, /Never auto-merge/);
    assert.match(yml, /no photon/);
  });
});
