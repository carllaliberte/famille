import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  errorLoop, forgetOperational, metabolism, novelty, outOfDistribution,
  regime, correlationIsNotCause, counterfactual, curiosity, missingQuestions,
  diversity, selfFalsify, observeVsAct, blockedIfStop,
} from "../sdk/opt.js";
import { resetBreaker, requestStop } from "../sdk/open-intelligence.js";

beforeEach(() => resetBreaker());

test("error loop measures mismatch without claiming cerebellum", () => {
  const e = errorLoop({ prediction: 1, observation: 2 });
  assert.equal(e.error, 1);
  assert.equal(e.truth, false);
});

test("forget does not erase origin", () => {
  const f = forgetOperational([{ stale: true, id: 1 }, { stale: false, id: 2 }]);
  assert.equal(f.dropped.length, 1);
  assert.equal(f.erased_origin, false);
});

test("metabolism uses real rss", () => {
  const m = metabolism();
  assert.ok(m.rss_bytes > 0);
  assert.equal(m.energy, "NOT_MEASURED");
});

test("novelty and OOD do not force categories", () => {
  assert.equal(novelty("x", []).state, "NEW_EVENT");
  assert.equal(outOfDistribution("z", ["a"]).forced_category, false);
});

test("regime drift marks models stale", () => {
  assert.equal(regime("A", "B").state, "DRIFT");
});

test("correlation is not causality; counterfactual is not observation", () => {
  assert.equal(correlationIsNotCause("x", "y").causality, "HYPOTHESIS");
  assert.equal(counterfactual("no-x").observation, false);
});

test("curiosity is not authority", () => {
  assert.equal(curiosity({ uncertainty: 3, cost: 1, risk: 1 }).authority, false);
});

test("questions include unasked", () => {
  assert.ok(missingQuestions().unasked);
});

test("many agents same error is not diversity", () => {
  const d = diversity([{ kind: "llm" }, { kind: "llm" }]);
  assert.equal(d.distinct, 1);
  assert.equal(d.same_error_is_not_diversity, true);
});

test("architecture can be not-testable", () => {
  assert.equal(selfFalsify({ not_measured: true }).epistemic_status, "NOT_TESTABLE");
});

test("world action not implemented", () => {
  assert.equal(observeVsAct().ACORN_INFLUENCES_WORLD, "NOT_IMPLEMENTED");
});

test("STOP blocks opt act", () => {
  requestStop({ actor: "carl" });
  assert.equal(blockedIfStop("opt.act").status, "BLOCKED");
});
