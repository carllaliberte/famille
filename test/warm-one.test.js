import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { siege } from "../scripts/siege.mjs";
import {
  presentOf,
  RECIPE,
  recette,
  transferPrompt,
} from "../scripts/warm-one.mjs";

const src = readFileSync(new URL("../scripts/warm-one.mjs", import.meta.url), "utf8");

describe("warm-one — séquentiel, pas de parallèle", () => {
  it("ne lance pas 3 POST simultanés", () => {
    assert.doesNotMatch(src, /Promise\.all\s*\(/);
    assert.doesNotMatch(src, /Promise\.allSettled\s*\(/);
    assert.match(src, /for \(const model of models\)/);
  });

  it("TRANSFER met le texte de A dans le prompt de B", () => {
    const p = transferPrompt("alpha-body", "présent");
    assert.match(p, /alpha-body/);
    assert.match(p, /présent/);
    assert.equal(transferPrompt("", "présent"), "présent");
  });

  it("ne déclare que les modèles réellement listés", () => {
    assert.deepEqual(
      presentOf(RECIPE, ["llama3.2:latest"]),
      ["llama3.2"],
    );
    assert.deepEqual(presentOf(RECIPE, ["gemma2:2b", "other"]), ["gemma2:2b"]);
    assert.deepEqual(presentOf(RECIPE, []), []);
  });
});

describe("warm-one — CI sans daemon", () => {
  it("daemon DOWN = skip, pas un throw", async () => {
    const out = await recette({
      tagsFn: async () => ({ up: false, models: [] }),
    });
    assert.equal(out.skipped, true);
    assert.match(out.reason, /ollama absent/);
    assert.deepEqual(out.seats, []);
  });

  it("aucun modèle visé = skip", async () => {
    const out = await recette({
      tagsFn: async () => ({ up: true, models: ["mistral"] }),
    });
    assert.equal(out.skipped, true);
    assert.match(out.reason, /aucun modèle visé/);
  });

  it("N présents, un par un, TRANSFER si N>1", async () => {
    const order = [];
    const out = await recette({
      wanted: ["gemma2:2b", "llama3.2"],
      tagsFn: async () => ({ up: true, models: ["gemma2:2b", "llama3.2"] }),
      chatFn: async (_h, model, prompt) => {
        order.push(model);
        const text = model === "gemma2:2b" ? "from-a" : `got:${prompt.slice(0, 20)}`;
        return siege({ nom: model, http: 200, text, present: true, ms: 1 });
      },
    });
    assert.equal(out.skipped, false);
    assert.deepEqual(order, ["gemma2:2b", "llama3.2"]);
    assert.equal(out.seats.length, 2);
    assert.equal(out.seats[0].real, 1);
    assert.equal(out.seats[1].real, 1);
    assert.equal(out.transfer, true);
  });
});
