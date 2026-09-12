import { test } from "node:test";
import assert from "node:assert/strict";
import { diagnose, operationalReality, loopStatus, e2e, fitness } from "../sdk/omni-ecosystem.js";

test("TESTED ≠ CONNECTED ≠ LIVE", () => {
  const r = operationalReality();
  assert.equal(r.LIVE_VERIFIED, false);
  assert.equal(r.CONNECTED, false);
  assert.equal(r.MEASURED, "NOT_MEASURED");
  assert.match(r.nerve, /TESTED/);
});

test("loop: action externe absente", () => {
  const l = loopStatus();
  assert.equal(l.ACTION_EXTERNAL, "NOT_IMPLEMENTED");
  assert.equal(l.LIVE_FEEDBACK, "NOT_IMPLEMENTED");
  assert.equal(l.SIGNAL, "IMPLEMENTED");
});

test("diagnose ne fabrique pas LIVE", () => {
  const d = diagnose();
  assert.equal(d.live_invented, false);
  assert.equal(d.measured.latency, "NOT_MEASURED");
  assert.equal(d.unasked.includes("NOT EVEN"), true);
  assert.equal(d.centralization, false);
});

test("fitness n'est pas vérité", () => {
  assert.equal(fitness().single_score, null);
  assert.equal(e2e().ops.LIVE_VERIFIED, false);
});
