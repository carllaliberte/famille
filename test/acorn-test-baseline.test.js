import test from "node:test";
import assert from "node:assert/strict";
import {
  CLASSES,
  KNOWN_ON_MAIN_6824EEE,
  classifyFailure,
  classifySuite,
  inventoryProbe,
} from "../scripts/acorn-test-baseline.mjs";

test("baseline probe never declares the suite green", () => {
  const probe = inventoryProbe();
  assert.equal(probe.live, false);
  assert.equal(probe.auto_merge, false);
  assert.ok(CLASSES.includes("PRE_EXISTING"));
  assert.ok(KNOWN_ON_MAIN_6824EEE.length >= 12);
});

test("known main failures stay classified and a new name is NEW, never success", () => {
  const known = classifyFailure("OFF is fail-closed and invalid persisted state also becomes OFF");
  assert.equal(known.class, "TEST_DRIFT");
  assert.equal(known.status, "CLASSIFIED");
  const fresh = classifyFailure("invented passing test");
  assert.equal(fresh.class, "NEW");
  assert.equal(fresh.status, "UNKNOWN");
  const suite = classifySuite({
    failures: [
      "OFF is fail-closed and invalid persisted state also becomes OFF",
      "invented passing test",
    ],
    mainSha: "6824eeeb9e76b8fa13d0a5d50ca237472af362f7",
  });
  assert.equal(suite.counts.TEST_DRIFT, 1);
  assert.equal(suite.counts.NEW, 1);
  assert.equal(suite.green_declared, false);
  assert.equal(suite.hidden, false);
  assert.equal(suite.live, false);
});
