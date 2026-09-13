import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DynamicTaxonomyEngine } from "../scripts/taxonomy.mjs";

describe("taxonomy — propose, never apply", () => {
  it("keeps boundaries when coupling is low", () => {
    const tax = new DynamicTaxonomyEngine();
    const out = tax.assess([
      { id: "core", coupling: 0.1 },
      { id: "proof", coupling: 0.2 },
    ]);
    assert.equal(out.create, false);
    assert.equal(out.auto_merge, false);
    assert.equal(out.write, "DENIED");
    assert.equal(out.n, 2);
    const split = tax.assess([{ id: "blob", coupling: 0.95 }]);
    assert.equal(split.proposals[0].act, "SPLIT_PROJECT");
    assert.equal(split.proposals[0].create, false);
  });
});
