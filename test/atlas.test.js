import { test } from "node:test";
import assert from "node:assert/strict";
import {
  catalog, compareFn, noCentralRequired, metabolism,
  discoverArchitecture, humanFunctionNotNeeded, unknownUnknown, cortexIsNotJudge,
} from "../sdk/atlas.js";

test("catalog mixes bio and compute without closing taxonomy", () => {
  const c = catalog();
  assert.ok(c.some((x) => x.id === "octopus-distributed"));
  assert.ok(c.some((x) => x.id === "transformer"));
  assert.ok(c.some((x) => x.kind === "UNKNOWN_BRAIN"));
});

test("comparison has no automatic winner", () => {
  const r = compareFn("predict", { id: "cerebellum" }, { id: "rl" });
  assert.equal(r.winner, null);
  assert.equal(r.metric, "NOT_MEASURED");
});

test("no unique center required", () => {
  const n = noCentralRequired();
  assert.equal(n.center_required, false);
  assert.equal(n.judge, "carl");
});

test("metabolism unmeasured", () => {
  const m = metabolism();
  assert.equal(m.energy, "NOT_MEASURED");
  assert.equal(m.forget, "NOT_IMPLEMENTED");
});

test("unknown kind stays unknown brain", () => {
  const d = discoverArchitecture("future-x", "NOT_A_KIND");
  assert.equal(d.status, "DISCOVERED");
  assert.equal(d.implemented, false);
});

test("human function may be not needed", () => {
  const h = humanFunctionNotNeeded("olfactory-bulb-copy");
  assert.equal(h.copied, false);
  assert.equal(h.verdict, "UNKNOWN");
});

test("cortex still not judge", () => {
  assert.equal(cortexIsNotJudge().authority, false);
});

test("unknown unknown stays open", () => {
  assert.equal(unknownUnknown().status, "OPEN");
});
