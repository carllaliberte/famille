import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ProvenanceEngine, STATUSES } from "../scripts/provenance.mjs";

describe("provenance edges — every status, no fake certainty", () => {
  const engine = new ProvenanceEngine({ now: () => "2026-09-10T01:00:00.000Z" });

  it("empty → INSUFFICIENT, epsilon > 0", () => {
    const out = engine.evaluate([]);
    assert.equal(out.status, "INSUFFICIENT");
    assert.ok(out.error_margin_epsilon > 0);
    assert.equal(out.receipt, false);
  });

  it("all LU stays LU, agreement is not truth", () => {
    const out = engine.evaluate([
      { node_id: "a", status: "LU", error_margin_epsilon: 0.1 },
      { node_id: "b", status: "LU", error_margin_epsilon: 0.3 },
    ]);
    assert.equal(out.status, "LU");
    assert.equal(out.agreement, true);
    assert.equal(out.certified, false);
    assert.equal(out.error_margin_epsilon, 0.3);
  });

  it("OFFLINE+ERROR prefers ERROR; all OFFLINE stays OFFLINE", () => {
    const mix = engine.evaluate([
      { node_id: "a", status: "OFFLINE" },
      { node_id: "b", status: "ERROR" },
    ]);
    assert.equal(mix.status, "ERROR");
    const off = engine.evaluate([
      { node_id: "a", status: "OFFLINE" },
      { node_id: "b", status: "OFFLINE" },
    ]);
    assert.equal(off.status, "OFFLINE");
  });

  it("unknown status becomes UNKNOWN; garbage payload does not throw", () => {
    const out = engine.evaluate([{ node_id: "x", status: "WAT", output: { n: 1n } }]);
    assert.equal(out.status, "UNKNOWN");
    assert.ok(STATUSES.includes("CONTRADICTION"));
    const huge = engine.evaluate([{ node_id: "z", status: "LU", output: "x".repeat(50_000) }]);
    assert.equal(huge.status, "LU");
    assert.equal(huge.write, "DENIED");
  });
});
