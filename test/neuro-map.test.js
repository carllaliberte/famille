import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAP, analogue, cortexIsNotJudge, thalamicRoute, hippocampalTrace,
  cerebellarLoop, actionSelect, sleepPass, beyondBiology,
  humanDoesAcornDoesNot, consciousnessClaimForbidden, unknownBrainFunction,
  verdict,
} from "../sdk/neuro-map.js";
import { resetBreaker, requestStop } from "../sdk/open-intelligence.js";

test("map is function not anatomy dump", () => {
  assert.ok(MAP.length >= 10);
  assert.ok(MAP.every((r) => r.fn && r.status));
  assert.equal(analogue("claustrum-invented").status, "UNKNOWN");
});

test("cortex is not judge", () => {
  const c = cortexIsNotJudge();
  assert.equal(c.authority, false);
  assert.equal(c.judge, "carl");
});

test("thalamus analogue routes without authority", () => {
  const r = thalamicRoute("observe", [{ id: "a", caps: ["observe"], presence: "DECLARED" }]);
  assert.equal(r[0].authority, false);
});

test("hippocampus keeps dated change", () => {
  const m = hippocampalTrace({ what: "X", when: "2026-09-12", who: "carl", evidence: "e", changed_because: "new measure" });
  assert.ok(m);
});

test("cerebellum loop is NOT_IMPLEMENTED not fake calibration", () => {
  const c = cerebellarLoop({ prediction: 1, observation: 2 });
  assert.equal(c.status, "NOT_IMPLEMENTED");
  assert.equal(c.error, 1);
});

test("STOP blocks action select", () => {
  resetBreaker();
  requestStop({ actor: "carl" });
  assert.equal(actionSelect(["write"]).status, "BLOCKED");
});

test("sleep analogue absent", () => {
  assert.equal(sleepPass().status, "NOT_IMPLEMENTED");
});

test("beyond biology named", () => {
  assert.ok(beyondBiology().includes("sovereign STOP"));
  assert.ok(humanDoesAcornDoesNot().some((x) => /sleep/.test(x)));
});

test("consciousness remains hypothesis", () => {
  const h = consciousnessClaimForbidden();
  assert.notEqual(h.consciousness, true);
  assert.equal(h.truth, false);
});

test("unknown brain function stays open", () => {
  assert.equal(unknownBrainFunction().status, "UNKNOWN");
  assert.equal(verdict({ status: "ABSENTE" }), "EXPERIMENT_OR_HOLD");
  assert.equal(verdict({ status: "REDONDANTE" }), "REMOVE_CANDIDATE");
});
