import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const juge = JSON.parse(readFileSync(join(ROOT, "schema/juge.v0.json"), "utf8"));
const flux = JSON.parse(readFileSync(join(ROOT, "schema/flux.v0.json"), "utf8"));
const interop = JSON.parse(readFileSync(join(ROOT, "map/interop.v0.json"), "utf8"));
const couches = readFileSync(join(ROOT, "COUCHES.md"), "utf8");
const pointer = readFileSync(join(ROOT, "KEM.md"), "utf8");
const schemaReadme = readFileSync(join(ROOT, "schema/README.md"), "utf8");

describe("kem.v0 is a sibling rail — never a juge/flux key", () => {
  it("juge.v0 has no kem / mlkem property and still requires the four cards", () => {
    const keys = Object.keys(juge.properties);
    assert.equal(juge.title, "famille.juge.v0");
    assert.ok(!keys.includes("kem"));
    assert.ok(!keys.includes("mlkem"));
    assert.ok(!keys.includes("mlkem768"));
    assert.deepEqual(juge.required, ["quelle", "temoin", "epsilon", "horizon"]);
  });

  it("flux.v0 does not grow a kem satellite", () => {
    assert.equal(flux.title, "famille.flux.v0");
    assert.equal(flux.properties.carte.$ref, "juge.v0.json");
    const sats = Object.keys(flux.properties.satellites?.properties || {});
    assert.ok(!sats.includes("kem"));
    assert.ok(!sats.includes("mlkem"));
    const dumped = JSON.stringify(flux);
    assert.ok(!dumped.includes("kem.v0"));
    assert.ok(!dumped.includes("mlkem768"));
  });

  it("interop lists kem as opt-in, not a card key", () => {
    const kem = interop.nodes.find((n) => n.id === "kem");
    assert.ok(kem, "kem node missing from interop");
    assert.equal(kem.kind, "opt-in");
    assert.equal(kem.repo, "https://github.com/carllaliberte/unforge-check");
    assert.ok(!Object.prototype.hasOwnProperty.call(kem, "keys"));
    assert.match(kem.talks, /never default/);
    assert.match(kem.talks, /never UFHY1/);
    assert.match(kem.talks, /not a juge\.v0 key/);
    const jugeNode = interop.nodes.find((n) => n.id === "famille");
    assert.ok(jugeNode);
    assert.notEqual(interop.contract, "schema/kem.v0.json");
    assert.equal(interop.contract, "schema/juge.v0.json");
  });

  it("COUCHES keeps PQC-off-by-default and names KEM as opt-in", () => {
    assert.match(couches, /PQC par défaut/);
    assert.match(couches, /rail séparé opt-in/);
    assert.match(couches, /jamais une 5e carte/);
  });

  it("map pointer does not vendor the schema and does not use banned slogans", () => {
    assert.match(pointer, /unforge-check\/KEM\.md/);
    assert.match(pointer, /schema\/kem\.v0\.json/);
    assert.match(pointer, /jamais par défaut/);
    assert.match(pointer, /UFHY1.*signatures/s);
    assert.doesNotMatch(pointer, /HORIZON Watch/);
    assert.match(schemaReadme, /jamais fusionné/);
    assert.match(schemaReadme, /unforge-check\/schema\/kem\.v0\.json/);
  });
});
