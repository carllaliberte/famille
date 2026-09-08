import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  canApply,
  isSensitive,
  renderReport,
  runScan,
} from "../scripts/optimize-scan.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

describe("optimize-scan — rail, pas un nœud", () => {
  it("marks official sensitive paths and never applies them", () => {
    assert.equal(isSensitive("unforge-check/OTS.md"), true);
    assert.equal(isSensitive("schema/juge.v0.json"), true);
    assert.equal(isSensitive("mesure-protocol/SPEC.md"), true);
    assert.equal(isSensitive(".github/actions/attest-preview/action.yml"), true);
    assert.equal(isSensitive("action.yml"), true);
    assert.equal(isSensitive("scripts/optimize-scan.mjs"), false);
    assert.equal(isSensitive("AUTOMATION.md"), false);
    assert.equal(canApply("schema/juge.v0.json"), false);
    assert.equal(canApply("unforge-check/OTS.md"), false);
    assert.equal(canApply("REVUE.md"), false);
    assert.equal(canApply("AUTOMATION.md"), false);
    assert.equal(canApply(".github/workflows/grok-optimize.yml"), false);
    assert.equal(canApply("scripts/optimize-scan.mjs"), true);
    assert.equal(canApply("test/optimize-scan.test.js"), true);
    assert.equal(canApply("README.md"), false);
  });

  it("skips sensitive trees, applies trailing ws only under scripts/", () => {
    const dir = mkdtempSync(join(tmpdir(), "famille-opt-"));
    mkdirSync(join(dir, "scripts"));
    mkdirSync(join(dir, "schema"));
    mkdirSync(join(dir, "docs"));
    writeFileSync(join(dir, "scripts", "a.sh"), "#!/bin/sh  \n");
    writeFileSync(join(dir, "schema", "juge.v0.json"), "{}\n");
    writeFileSync(join(dir, "docs", "x.md"), "# X\n[missing](nope.md)\n");
    const { findings, applied } = runScan({
      root: dir,
      scope: "perf+structure",
      apply: true,
    });
    assert.ok(findings.some((f) => f.file === "scripts/a.sh"));
    assert.ok(findings.some((f) => f.file === "docs/x.md" && /lien cassé/.test(f.change)));
    assert.ok(!findings.some((f) => f.file.startsWith("schema/")));
    const sh = readFileSync(join(dir, "scripts", "a.sh"), "utf8");
    assert.equal(sh, "#!/bin/sh\n");
    assert.ok(applied.size >= 1);
    const json = readFileSync(join(dir, "schema", "juge.v0.json"), "utf8");
    assert.equal(json, "{}\n");
  });

  it("HOLD empty: no findings → empty list", () => {
    const dir = mkdtempSync(join(tmpdir(), "famille-opt-empty-"));
    mkdirSync(join(dir, "scripts"));
    writeFileSync(join(dir, "scripts", "ok.sh"), "#!/bin/sh\n");
    const { findings } = runScan({
      root: dir,
      scope: "perf",
      apply: false,
    });
    assert.equal(findings.length, 0);
  });

  it("report table has the four columns Carl asked for", () => {
    const md = renderReport({
      scope: "perf+structure",
      findings: [
        {
          file: "scripts/a.sh",
          change: "espaces en fin de ligne",
          reason: "Mécanique.",
          risk: "low",
        },
      ],
      applied: new Set(),
      now: "2026-09-08T16:50:00Z",
    });
    assert.match(md, /optimize-scan:start/);
    assert.match(md, /\| Fichier \| Changement \| Justification \| Risque \|/);
    assert.match(md, /scripts\/a.sh/);
    assert.match(md, /unforge-check\//);
  });
});

describe("grok-optimize.yml — jamais main", () => {
  const yml = read(".github/workflows/grok-optimize.yml");
  const branche = read(".github/workflows/branche.yml");
  const auto = read("AUTOMATION.md");
  const branches = read("BRANCHES.md");

  it("is dispatch-only, signs, never pushes main, never auto-merge", () => {
    assert.match(yml, /^on:\n  workflow_dispatch:\n/m);
    assert.doesNotMatch(yml, /pull_request/);
    assert.doesNotMatch(yml, /schedule:/);
    assert.doesNotMatch(yml, /cron:/);
    assert.doesNotMatch(yml, /git push origin main/);
    assert.doesNotMatch(yml, /gh pr merge/);
    assert.doesNotMatch(yml, /auto-merge:\s*true/);
    assert.doesNotMatch(yml, /merge --ff/);
    assert.match(yml, /Jamais auto-merge/);
    assert.match(yml, /contents: write/);
    assert.match(yml, /pull-requests: write/);
    assert.match(yml, /commit -S/);
    assert.match(yml, /GROK_SIGNING_KEY/);
    assert.match(yml, /grok\/optimize-/);
    assert.match(yml, /optimization_report.md/);
    assert.match(yml, /scripts\/optimize-scan.mjs/);
    assert.match(yml, /SENSITIVE_PATHS/);
    assert.match(yml, /unforge-check\//);
    assert.match(yml, /Pas de tampon à vide|Pas de PR vide/);
  });

  it("CI nom accepts grok/optimize-YYYYMMDD-HHMMSS", () => {
    assert.match(branche, /grok\/optimize-\[0-9\]\{8\}-\[0-9\]\{6\}/);
    assert.match(branches, /grok\/optimize-YYYYMMDD-HHMMSS/);
  });

  it("inventory says this rail does not write main", () => {
    assert.match(auto, /grok-optimize\.yml/);
    assert.match(auto, /grok\/optimize-\*/);
    assert.match(auto, /Exception mécanique — ots-bot/);
    assert.doesNotMatch(auto, /plagiat-watch/);
    const juge = JSON.parse(read("schema/juge.v0.json"));
    assert.deepEqual(juge.required, ["quelle", "temoin", "epsilon", "horizon"]);
  });
});
