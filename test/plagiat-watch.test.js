import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

const spec = read("unforge-check/PLAGIAT-WATCH.md");
const yml = read(".github/workflows/plagiat-watch.yml");
const pointer = read("OTS.md");
const auto = read("AUTOMATION.md");
const juge = JSON.parse(read("schema/juge.v0.json"));
const flux = JSON.parse(read("schema/flux.v0.json"));

describe("plagiat-watch — détection, pas prévention", () => {
  it("workflow is dispatch-only, never pull_request, never main, no third-party secret", () => {
    assert.match(yml, /^on:\n  workflow_dispatch:\n/m);
    assert.doesNotMatch(yml, /pull_request/);
    assert.doesNotMatch(yml, /branches:\s*\[main\]/);
    assert.doesNotMatch(yml, /secrets\.\w/);
    assert.doesNotMatch(yml, /schedule:/);
    assert.doesNotMatch(yml, /cron:/);
    assert.match(yml, /contents: write/);
    assert.match(yml, /pull-requests: write/);
    assert.match(yml, /github\.token/);
  });

  it("opens one docs/plagiat-watch PR, never pushes main, never ots-bot", () => {
    assert.match(yml, /HEAD:refs\/heads\/docs\/plagiat-watch/);
    assert.match(yml, /github-actions\[bot\]/);
    assert.doesNotMatch(yml, /user\.name "ots-bot"/);
    assert.match(yml, /ots-bot forbidden on this rail/);
    assert.doesNotMatch(yml, /^\s*git push\s*$/m);
    assert.doesNotMatch(yml, /git push origin main/);
    assert.match(yml, /bloc\//);
  });

  it("spec says détection pas prévention and lists already-public canaries", () => {
    assert.match(spec, /détection, pas prévention/i);
    assert.match(spec, /famille\.juge\.v0/);
    assert.match(spec, /Error margin zero is a lie/);
    assert.match(spec, /const id = "preview00001"/);
    assert.match(spec, /Les certitudes ont une date de fin\./);
    assert.match(spec, /Ancrage, pas coffre magique/);
    assert.match(spec, /plagiat-watch:start/);
    assert.match(spec, /plagiat-watch:end/);
    assert.match(spec, /RAS — aucun hit hors user:carllaliberte|HIT —/);
    assert.doesNotMatch(spec, /watermark caché inventé/i);
  });

  it("OTS pointer is five lines: watch ≠ notaire", () => {
    assert.match(pointer, /Watch ≠ notaire/);
    assert.match(pointer, /unforge-check\/PLAGIAT-WATCH\.md/);
    assert.match(pointer, /workflow_dispatch/);
    assert.match(pointer, /docs\/plagiat-watch/);
  });

  it("juge.v0 / flux.v0 have no plagiat / canari / ots key", () => {
    const keys = [
      ...Object.keys(juge.properties || {}),
      ...Object.keys(flux.properties || {}),
    ];
    for (const banned of ["plagiat", "canari", "ots", "opentimestamps"]) {
      assert.ok(!keys.includes(banned), banned);
    }
    const dumped = JSON.stringify(juge) + JSON.stringify(flux);
    assert.doesNotMatch(dumped, /plagiat/i);
    assert.doesNotMatch(dumped, /canari/i);
    assert.equal(juge.title, "famille.juge.v0");
    assert.deepEqual(juge.required, ["quelle", "temoin", "epsilon", "horizon"]);
    assert.equal(flux.title, "famille.flux.v0");
  });

  it("does not add a second AUTOMATION.md main-push exception", () => {
    assert.match(auto, /Exception mécanique — ots-bot/);
    assert.doesNotMatch(auto, /plagiat-watch/);
    assert.doesNotMatch(auto, /docs\/plagiat-watch/);
    const file = read("FILE.md");
    assert.match(file, /plagiat-watch/);
    assert.match(file, /dispatch Carl, PR pas main/);
  });
});
