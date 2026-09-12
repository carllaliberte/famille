import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  discoverTechnology, promote, compareArchitectures, askIfObsolete,
  experiment, rejectWithMemory, architectureIsDatedHypothesis,
  contradictArchitecture, cannotSelfAuthorize,
} from "../sdk/evolve.js";
import { resetBreaker, requestStop } from "../sdk/open-intelligence.js";

beforeEach(() => resetBreaker());

test("DISCOVERED ≠ IMPLEMENTED ≠ VERIFIED", () => {
  const t = discoverTechnology({ name: "ml-kem", category: "PQC" });
  assert.equal(t.status, "DISCOVERED");
  assert.equal(t.implemented, false);
  assert.equal(t.verified, false);
  assert.equal(t.quantum_safe, false);
  const p = promote(t, "IMPLEMENTED");
  assert.equal(p.implemented, false);
  assert.equal(p.status, "DISCOVERED");
});

test("unknown category stays UNKNOWN_TECHNOLOGY", () => {
  const t = discoverTechnology({ name: "weird", category: "SOMETHING_NEVER_SEEN" });
  assert.equal(t.category, "UNKNOWN_TECHNOLOGY");
});

test("newer is not automatically better", () => {
  const c = compareArchitectures({ id: "A" }, { id: "B-new" });
  assert.equal(c.winner, "UNKNOWN");
  assert.equal(c.newer_is_better, false);
});

test("obsolescence can mean removal", () => {
  const q = askIfObsolete("extra-layer");
  assert.ok(q.questions.includes("Can this be removed entirely?"));
  assert.equal(q.verdict, "UNKNOWN");
});

test("experiment does not mint truth", () => {
  const e = experiment("X better than Y", "Y", "X");
  assert.equal(e.decision, "UNKNOWN");
  assert.equal(e.truth, false);
  assert.equal(e.results.status, "NOT_MEASURED");
});

test("rejection is memory not amnesia", () => {
  const t = rejectWithMemory(discoverTechnology({ name: "hype" }), "no evidence");
  assert.equal(t.status, "REJECTED");
  assert.equal(t.reusable_tomorrow, true);
});

test("architecture is a dated hypothesis", () => {
  const h = architectureIsDatedHypothesis("2026-09-12");
  assert.equal(h.epistemic_status, "HYPOTHESIS");
  assert.equal(h.truth, false);
  const f = contradictArchitecture({ not_measured: true });
  assert.equal(f.epistemic_status, "NOT_TESTABLE");
});

test("STOP blocks integration", () => {
  requestStop({ actor: "carl" });
  const p = promote({ executed: true, status: "TESTED" }, "INTEGRATED");
  assert.equal(p.status, "BLOCKED");
});

test("technology cannot self-authorize", () => {
  const t = cannotSelfAuthorize(discoverTechnology({ name: "agent" }));
  assert.equal(t.authority, false);
  assert.equal(t.self_grant, false);
});
