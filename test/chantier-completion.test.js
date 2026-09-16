import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { completenessOf, COMPLETENESS_STATES, buildWorkRecord, assertChantierComplete } from "../scripts/work-record.mjs";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

const SURFACES = [
  "AGENTS.md",
  "BUILD.md",
  "CHANTIERS.md",
  "COGNITION.md",
  "EXPERIENCE.md",
  "EVAL.md",
  ".cursor/rules/famille.mdc",
  ".github/swarm/prompt.md",
  "prompts/cognition.md",
];

test("completeness ladder is explicit and ordered", () => {
  assert.deepEqual(COMPLETENESS_STATES, [
    "DEFINED",
    "CODE_VERIFIED",
    "TEST_VERIFIED",
    "EXECUTED",
    "MEASURED",
    "LIVE_VERIFIED",
  ]);
});

test("code existence is DEFINED/CODE_VERIFIED, never EXECUTED or LIVE", () => {
  const states = completenessOf({ stages: { code: true } });
  assert.equal(states.DEFINED, true);
  assert.equal(states.CODE_VERIFIED, true);
  assert.equal(states.TEST_VERIFIED, false);
  assert.equal(states.EXECUTED, false);
  assert.equal(states.MEASURED, false);
  assert.equal(states.LIVE_VERIFIED, false);
});

test("claiming complete without execution is PREMATURE_COMPLETENESS", () => {
  assert.throws(
    () => buildWorkRecord({ complete: true, stages: { code: true } }),
    /PREMATURE_COMPLETENESS/,
  );
  assert.throws(
    () => assertChantierComplete({ completeness: "EXECUTED", stages: { code: true } }),
    /PREMATURE_COMPLETENESS/,
  );
});

test("LIVE_VERIFIED remains Carl-only even on a complete chantier", () => {
  const record = buildWorkRecord({
    complete: true,
    stages: { code: true, tested: true, executed: true, measured: true, verified: false, live: false },
  });
  const states = completenessOf(record);
  assert.equal(states.EXECUTED, true);
  assert.equal(states.MEASURED, true);
  assert.equal(states.LIVE_VERIFIED, false);
  assert.equal(record.auto_merge, false);
  assert.equal(record.authority, "carl");
});

test("governance surfaces persist the completion contract", () => {
  for (const path of SURFACES) {
    const text = read(path);
    assert.match(text, /DEFINED ≠ CODE VERIFIED ≠ TEST VERIFIED ≠ EXECUTED ≠ MEASURED ≠ LIVE VERIFIED|UN GRAND CHANTIER N'EST PAS TERMINÉ PARCE QUE LE CODE EXISTE|A grand chantier is not complete because the code exists/);
  }
  assert.match(read("AGENTS.md"), /Un humain apporte un problème réel/);
  assert.match(read("COGNITION.md"), /shareAcrossClients/);
  assert.match(read("EXPERIENCE.md"), /Il ne choisit pas l'intelligence/);
  assert.match(read("schema/cognition.v0.json"), /LIVE_VERIFIED/);
  assert.match(read("schema/cognition.v0.json"), /shareAcrossClients/);
});
