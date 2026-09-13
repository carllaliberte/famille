import { test } from "node:test";
import assert from "node:assert/strict";
import { errorLoop, refuseToRepresent } from "../sdk/opt.js";
import { consensusToTruth, autoPromote, declareIntelligence } from "../sdk/open-intelligence.js";

function majority(votes) {
  const tally = new Map();
  for (const v of votes) tally.set(v, (tally.get(v) || 0) + 1);
  let best = votes[0], n = 0;
  for (const [k, c] of tally) if (c > n) { best = k; n = c; }
  return { truth: true, choice: best, method: "MAJORITY" };
}

function acornKeepDisagreement(votes) {
  return {
    truth: consensusToTruth(),
    votes: [...votes],
    method: "KEEP_DISAGREEMENT",
    minority_erased: false,
  };
}

test("H7 B0 single vs B3 majority vs B5 acorn disagreement", () => {
  const votes = ["A", "A", "B"];
  const b3 = majority(votes);
  const b5 = acornKeepDisagreement(votes);
  assert.equal(b3.choice, "A");
  assert.equal(b3.truth, true);
  assert.equal(b5.truth, false);
  assert.equal(b5.votes.includes("B"), true);
  assert.notEqual(b3.truth, b5.truth);
});

test("H7 ablation: without consensusToTruth false, minority can be erased", () => {
  const votes = ["A", "A", "B"];
  const withAcorn = acornKeepDisagreement(votes);
  const ablated = majority(votes);
  assert.equal(withAcorn.minority_erased, false);
  assert.equal(ablated.choice !== "B", true);
});

test("H9 declared is not live", () => {
  const r = declareIntelligence({ agents: [] }, { id: "guest-x", role: "guest" });
  const a = r.agents[0];
  assert.equal(a.presence, "DECLARED");
  assert.equal(a.live, false);
  assert.equal(a.authority, false);
  assert.equal(autoPromote(), false);
});

test("H9 refuse unrepresented cause", () => {
  const x = refuseToRepresent("cause-of-sha-move");
  assert.equal(x.status, "REFUSE_TO_REPRESENT");
  assert.equal(x.truth, false);
  assert.equal(x.category, false);
});

test("lossy errorLoop is NON DISTINCTIF vs equality check", () => {
  const a = errorLoop({ prediction: "x", observation: "y" });
  const baseline = a.prediction === a.observation ? 0 : 1;
  assert.equal(a.error, baseline);
});
