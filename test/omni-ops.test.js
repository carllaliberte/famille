import { test } from "node:test";
import assert from "node:assert/strict";
import {
  diagnose, operationalReality, loopStatus, e2e, fitness,
  internalFeedback, externalFeedback, capabilitySplit, recoverInvalid,
} from "../sdk/omni-ecosystem.js";

test("TESTED ≠ CONNECTED ≠ LIVE", () => {
  const r = operationalReality();
  assert.equal(r.LIVE_VERIFIED, false);
  assert.equal(r.CONNECTED, false);
  assert.equal(r.MEASURED, "NOT_MEASURED");
  assert.match(r.nerve, /TESTED/);
});

test("loop: externe absente, interne présente", () => {
  const l = loopStatus();
  assert.equal(l.ACTION_EXTERNAL, "NOT_IMPLEMENTED");
  assert.equal(l.EXTERNAL_FEEDBACK, "NOT_IMPLEMENTED");
  assert.equal(l.INTERNAL_FEEDBACK, "IMPLEMENTED");
  assert.equal(l.SIGNAL, "IMPLEMENTED");
});

test("READ ≠ WRITE", () => {
  const c = capabilitySplit({ read: true, write: false });
  assert.equal(c.READ, true);
  assert.equal(c.WRITE, false);
});

test("internal feedback n'est pas feedback monde", () => {
  const i = internalFeedback({ act: "hold" }, { ok: true });
  assert.equal(i.external, false);
  assert.equal(externalFeedback().status, "NOT_IMPLEMENTED");
});

test("réponse invalide : detect isolate recover, pas de fake LIVE", () => {
  const r = recoverInvalid({ error: true });
  assert.equal(r.detect, true);
  assert.equal(r.isolate, true);
  assert.equal(r.recovered, true);
  assert.equal(r.live_faked, false);
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
  assert.equal(e2e().ifb.external, false);
});
