import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

const KEYS = [
  "tag",
  "titre",
  "ligne",
  "vert",
  "ambre",
  "rouge",
  "classique",
  "apercu",
  "silence",
];

describe("world — packs BCP 47", () => {
  const files = readdirSync(join(ROOT, "packs")).filter((f) => f.endsWith(".json"));
  const packs = files.map((f) => JSON.parse(read(join("packs", f))));
  const tags = packs.map((p) => p.tag);

  it("every pack has the same phrase keys and a BCP 47 tag", () => {
    assert.ok(files.includes("fr-CA.json"));
    assert.ok(files.includes("en.json"));
    assert.ok(files.includes("de-DE.json"));
    for (const pack of packs) {
      assert.deepEqual(Object.keys(pack).sort(), [...KEYS].sort());
      assert.match(pack.tag, /^[a-z]{2}(-[A-Z]{2})?$/);
      assert.doesNotMatch(pack.ligne, /sealed forever/i);
      assert.doesNotMatch(pack.ligne, /quantum-safe/i);
    }
  });

  it("docs that list packs cite every tag, including de-DE", () => {
    const rente = read("RENTE.md");
    const portes = read("PORTES.md");
    const intl = read("INTERNATIONAL.md");
    const world = read("examples/world-bcp47.md");
    const cx = read("EXPERIENCE.md");
    for (const tag of tags) {
      assert.match(rente, new RegExp(tag));
      assert.match(portes, new RegExp(tag));
      assert.match(intl, new RegExp(tag));
      assert.match(world, new RegExp(`${tag}\\.json`));
      assert.match(
        cx,
        tag === "en" ? /packs\/en\.json/ : new RegExp(tag),
      );
    }
  });
});
