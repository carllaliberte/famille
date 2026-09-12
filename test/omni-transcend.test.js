import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  unknown, classifyUnknown, classifyNovelty, selfCritique, sandbox,
  snapshot, rejectEvolution, rollback, superiorSource, isolateThreat,
  extractSafe, minority, badStrategy, failClosed, frontier, e2e,
} from "../sdk/omni-ecosystem.js";
import { proposeDimension } from "../sdk/inter-organism.js";

test("A B — unknown stays unknown, not false", () => {
  const u = classifyUnknown({ measured: false });
  assert.equal(u.status, "UNKNOWN");
  assert.equal(u.falsehood, false);
});

test("C D — novelty vs artifact", () => {
  assert.equal(classifyNovelty({ artifact: true }).discovery, false);
  assert.equal(classifyNovelty({ repeat: true, control: true, reproduced: true }).discovery, true);
});

test("E–L — dim / sandbox / rollback", () => {
  assert.equal(proposeDimension("dX").status, "HYPOTHESIS");
  assert.equal(sandbox("x").writes_constitution, false);
  assert.equal(rollback(snapshot({ v: 1 })).recovered, true);
  assert.equal(rejectEvolution("x").status, "EVOLUTION_REJECTED");
  assert.equal(unknown("INTELLIGENCE", "n+1").forced_category, false);
});

test("M–X — no authority / isolate / minority", () => {
  assert.equal(superiorSource({ id: "max" }).authority, false);
  assert.equal(isolateThreat("x").integrated, false);
  assert.equal(extractSafe("x").authority, false);
  assert.equal(minority("alt").retained, true);
  assert.equal(badStrategy(true, true).incomplete, true);
  assert.equal(selfCritique(["closed"]).self_modification, false);
});

test("Y Z AA AB — open / fail-closed / regression", () => {
  assert.equal(e2e().loop_final, false);
  assert.equal(failClosed(true).fail_closed, true);
  assert.ok("unrepresented" in frontier());
  JSON.parse(readFileSync(new URL("../schema/mesh.v0.json", import.meta.url)));
});
