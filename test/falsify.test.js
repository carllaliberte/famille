import { test } from "node:test";
import assert from "node:assert/strict";
import { hypothesis, hiddenAssumption, falsify, noChange, stale, fabricCycle, futureIntelligenceCycle, consensusToTruth } from "../sdk/open-intelligence.js";

test("hypothèse n'est pas un fait", () => {
  const h = hypothesis({ statement: "tests locaux = LIVE", falsifier: "pas de HTTP réel" });
  assert.equal(h.established, false);
  assert.equal(h.truth, false);
  assert.equal(h.epistemic_status, "HYPOTHESIS");
});

test("falsifier : tests locaux ≠ LIVE — réfutée", () => {
  const h = hypothesis({ statement: "SDK invoke est LIVE", falsifier: "CHANNEL_NOT_PRESENT" });
  const r = falsify(h, { matches_falsifier: true });
  assert.equal(r.epistemic_status, "REFUTED");
});

test("HIDDEN_ASSUMPTION GitHub SPOF", () => {
  const h = hiddenAssumption("persistance = GitHub uniquement");
  assert.equal(h.hidden, true);
  assert.equal(h.epistemic_status, "HIDDEN_ASSUMPTION");
});

test("NO_CHANGE lorsque coût > valeur", () => {
  assert.equal(noChange({ expected_value: 0, cost: 2, risk: 1, complexity: 1 }).decision, "NO_CHANGE");
});

test("STALE force réévaluation", () => {
  const s = stale(hypothesis({ statement: "canal toujours LIVE" }));
  assert.equal(s.epistemic_status, "STALE");
  assert.equal(s.reassess, true);
});

test("consensus ≤ vérité ; future ≤ LIVE", () => {
  assert.equal(consensusToTruth([1, 1]), false);
  assert.equal(futureIntelligenceCycle().invoked.live, false);
  assert.equal(fabricCycle().result.status, "CHANNEL_NOT_PRESENT");
});
