import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { ProvenanceEngine, clampEpsilon } from "../scripts/provenance.mjs";

describe("provenance — contradiction kept, epsilon never 0", () => {
  it("does not average two statuses into truth", () => {
    const engine = new ProvenanceEngine({ now: () => "2026-09-10T00:00:00.000Z" });
    const out = engine.evaluate([
      { node_id: "xai", status: "LU", error_margin_epsilon: 0.2, output: "a" },
      { node_id: "openai", status: "OBJECTION", error_margin_epsilon: 0, output: "b" },
    ]);
    assert.equal(out.status, "CONTRADICTION");
    assert.equal(out.contradiction, true);
    assert.equal(out.agreement, false);
    assert.ok(out.error_margin_epsilon > 0);
    assert.equal(out.write, "DENIED");
    assert.equal(out.receipt, false);
    assert.equal(out.preview, true);
    assert.equal(clampEpsilon(0), 1e-9);
    const schema = JSON.parse(readFileSync("schema/provenance.v0.json", "utf8"));
    assert.equal(schema.properties.error_margin_epsilon.exclusiveMinimum, 0);
    assert.equal(schema.properties.write.const, "DENIED");
  });
});
