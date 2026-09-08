import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const juge = JSON.parse(readFileSync(join(ROOT, "schema/juge.v0.json"), "utf8"));
const flux = JSON.parse(readFileSync(join(ROOT, "schema/flux.v0.json"), "utf8"));
const interop = JSON.parse(readFileSync(join(ROOT, "map/interop.v0.json"), "utf8"));
const spec = readFileSync(join(ROOT, "unforge-check/OTS.md"), "utf8");
const pointer = readFileSync(join(ROOT, "OTS.md"), "utf8");
const auto = readFileSync(join(ROOT, "AUTOMATION.md"), "utf8");
const anchor = readFileSync(join(ROOT, ".github/workflows/ots-anchor.yml"), "utf8");
const upgrade = readFileSync(join(ROOT, ".github/workflows/ots-upgrade.yml"), "utf8");

function banned(text) {
  assert.doesNotMatch(text, /frais de gas/i);
  assert.doesNotMatch(text, /gas fees/i);
  assert.doesNotMatch(text, /PQC par défaut/i);
}

describe("OTS is a sibling notary — never a juge/flux key", () => {
  it("juge.v0 has no ots property and still requires the four cards", () => {
    const keys = Object.keys(juge.properties);
    assert.equal(juge.title, "famille.juge.v0");
    assert.ok(!keys.includes("ots"));
    assert.ok(!keys.includes("opentimestamps"));
    assert.deepEqual(juge.required, ["quelle", "temoin", "epsilon", "horizon"]);
  });

  it("flux.v0 does not grow an ots satellite", () => {
    const dumped = JSON.stringify(flux);
    assert.ok(!dumped.includes("ots"));
    assert.ok(!dumped.includes("opentimestamps"));
  });

  it("interop lists ots like kem — pointer, not a card key", () => {
    const ots = interop.nodes.find((n) => n.id === "ots");
    const kem = interop.nodes.find((n) => n.id === "kem");
    assert.ok(kem, "kem node missing from interop");
    assert.ok(ots, "ots node missing from interop");
    assert.equal(ots.kind, "verify");
    assert.equal(ots.repo, "https://github.com/carllaliberte/famille");
    assert.ok(!Object.prototype.hasOwnProperty.call(ots, "keys"));
    assert.match(ots.talks, /not a juge\.v0 key/);
    assert.match(ots.talks, /not a fifth card/);
    assert.match(ots.talks, /only after Carl merges to main/);
    assert.match(ots.note, /unforge-check\/OTS\.md/);
    assert.match(ots.note, /ots-anchor\.yml/);
    assert.match(ots.note, /AUTOMATION\.md/);
    assert.equal(interop.contract, "schema/juge.v0.json");
  });

  it("map pointer and spec cover verify, pending, complete, limits", () => {
    assert.match(pointer, /unforge-check\/OTS\.md/);
    assert.match(pointer, /jamais par défaut|Jamais sur une PR/i);
    assert.match(spec, /preuve d'antériorité/i);
    assert.match(spec, /ots verify \.ots-anchor\/latest\.sha\.ots/);
    assert.match(spec, /pending/);
    assert.match(spec, /complete/);
    assert.match(spec, /calendriers publics/);
    assert.match(spec, /pas garantie à vie/);
    assert.match(spec, /ots-upgrade/);
    assert.match(spec, /bitcoin-node/);
  });

  it("AUTOMATION.md documents the ots-bot exception before activation", () => {
    assert.match(auto, /commentaires de PR \+ FILE\.md/);
    assert.match(auto, /n'est plus le messager/);
    assert.match(auto, /Exception mécanique — ots-bot/);
    assert.match(auto, /ots-bot/);
    assert.match(auto, /jamais sur une PR/i);
    assert.match(auto, /squash \*\*explicite\*\*/);
  });

  it("ots-anchor.yml runs only on push to main, stamps without --wait, no PR trigger", () => {
    assert.match(anchor, /^on:\n  push:\n    branches: \[main\]/m);
    assert.doesNotMatch(anchor, /pull_request/);
    assert.match(anchor, /ots stamp/);
    assert.doesNotMatch(anchor, /ots stamp[^\n]*--wait/);
    assert.match(anchor, /user\.name "ots-bot"/);
    assert.match(anchor, /ots: anchor/);
    assert.match(anchor, /nothing to commit/);
    assert.doesNotMatch(anchor, /secrets\.\w/);
    assert.match(anchor, /contents: write/);
  });

  it("ots-upgrade.yml is daily cron, not pull_request", () => {
    assert.match(upgrade, /schedule:/);
    assert.match(upgrade, /cron:/);
    assert.doesNotMatch(upgrade, /pull_request/);
    assert.match(upgrade, /ots --no-bitcoin upgrade/);
    assert.match(upgrade, /user\.name "ots-bot"/);
    assert.match(upgrade, /ots: upgrade/);
    assert.match(upgrade, /nothing to commit/);
    assert.doesNotMatch(upgrade, /secrets\.\w/);
  });

  it("produced OTS files do not name gas fees or default PQC activation", () => {
    banned(spec);
    banned(pointer);
    banned(anchor);
    banned(upgrade);
    banned(JSON.stringify(interop.nodes.find((n) => n.id === "ots")));
  });

  it("ots-anchor.yml pins public calendars and alerts on stamp failure", () => {
    assert.match(anchor, /-c https:\/\/alice\.btc\.calendar\.opentimestamps\.org/);
    assert.match(anchor, /-c https:\/\/bob\.btc\.calendar\.opentimestamps\.org/);
    assert.match(anchor, /-c https:\/\/finney\.calendar\.eternitywall\.com/);
    assert.match(anchor, /-c https:\/\/btc\.calendar\.catallaxy\.com/);
    assert.match(anchor, /if: failure\(\)/);
    assert.match(anchor, /ots-anchor-status/);
    assert.match(anchor, /issues: write/);
    assert.match(anchor, /github\.token/);
    assert.doesNotMatch(anchor, /pull_request/);
  });

  it("ots-upgrade.yml writes a delimited status block into the spec", () => {
    assert.match(upgrade, /ots-status:start/);
    assert.match(upgrade, /unforge-check\/OTS.md/);
    assert.match(upgrade, /ots: upgrade/);
    assert.match(upgrade, /BitcoinBlockHeaderAttestation/);
    assert.match(upgrade, /PendingAttestation/);
  });

  it("AUTOMATION.md enumerates github-actions[bot] workflows and the path limit", () => {
    assert.match(auto, /Identité github-actions\[bot\]/);
    assert.match(auto, /ots-anchor\.yml/);
    assert.match(auto, /ots-upgrade\.yml/);
    assert.match(auto, /swarm\.yml/);
    assert.match(auto, /branche\.yml/);
    assert.match(auto, /carte\.yml/);
    assert.match(auto, /pas nativement \*\*par path\*\*/);
    assert.match(auto, /issues: write/);
    assert.match(auto, /pas de PAT créé/i);
  });

  it("spec pins calendars, status markers, and retention", () => {
    assert.match(spec, /ots-status:start/);
    assert.match(spec, /ots-status:end/);
    assert.match(spec, /## Rétention/);
    assert.match(spec, /sans purge automatique/);
    assert.match(spec, /1 fichier/);
    assert.match(spec, /alice\.btc\.calendar\.opentimestamps\.org/);
    assert.match(pointer, /fixés en dur|fixée en dur/);
  });
});
