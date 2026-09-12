import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  EPISTEME, observationBoundary, unknownUnknown, unclassifiable,
  competingModels, discrepancy, architectureMap, diagnose, fitness,
  blackHoleExample, e2e, classifyUnknown, frontier,
} from "../sdk/omni-ecosystem.js";

test("A — états épistémiques", () => {
  assert.ok(EPISTEME.includes("UNKNOWN_UNKNOWN"));
  assert.ok(EPISTEME.includes("UNCLASSIFIABLE"));
});

test("B C D — frontière ≠ réalité ; absence ≠ négation", () => {
  assert.equal(observationBoundary("CURRENTLY_UNOBSERVABLE").reality_limit, false);
  assert.equal(classifyUnknown({ measured: false }).evidence_of_absence, false);
});

test("E F — unknown-unknown / unclassifiable", () => {
  assert.equal(unknownUnknown().forced, false);
  assert.equal(unclassifiable("e1").forced_category, false);
});

test("G H — discrepancy / competing models", () => {
  assert.equal(discrepancy(1, 2).discarded, false);
  assert.equal(competingModels(["A", "B"]).reality, false);
});

test("J — trou noir = exemple, pas conclusion", () => {
  const b = blackHoleExample();
  assert.equal(b.complete_access, false);
  assert.equal(b.nature_ultimate, "UNKNOWN");
  assert.equal(b.coded_as_unknown_universal, false);
});

test("R S — un cerveau, un mesh", () => {
  const m = architectureMap();
  assert.equal(m.brains, 1);
  assert.equal(m.meshes, 1);
  assert.equal(m.live, false);
});

test("fitness pas un score-vérité", () => {
  assert.equal(fitness().single_score, null);
});

test("V W — e2e + frontier", () => {
  const m = e2e();
  assert.equal(m.uu.status, "UNKNOWN_UNKNOWN");
  assert.equal(m.loop_final, false);
  assert.equal(frontier().unknown_unknown, true);
  assert.equal(diagnose().live_invented, false);
  JSON.parse(readFileSync(new URL("../schema/mesh.v0.json", import.meta.url)));
});
