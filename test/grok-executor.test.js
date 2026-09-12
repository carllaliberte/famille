import { test } from "node:test";
import assert from "node:assert/strict";
import {
  grokExecutor, executionRequest, authorize, fabricCycle,
  intelligenceAdapter, mayJudge, consensusToTruth,
} from "../sdk/open-intelligence.js";

test("D — Grok executor n'est pas juge", () => {
  const g = grokExecutor();
  assert.equal(g.id, "grok");
  assert.equal(g.authority, false);
  assert.equal(mayJudge("grok"), false);
});

test("E — requester ≠ executor", () => {
  const c = fabricCycle({ requester: "future-x", capability: "github.read" });
  assert.equal(c.requester_is_executor, false);
  assert.equal(c.result.executor, "grok");
  assert.equal(c.result.requester, "future-x");
});

test("F — executor ≠ authority", () => {
  assert.equal(fabricCycle().executor_is_authority, false);
  assert.equal(consensusToTruth([1, 1]), false);
});

test("G — provenance requester/executor/capability", () => {
  const c = fabricCycle({ requester: "future-x" });
  assert.equal(c.result.provenance.requester, "future-x");
  assert.equal(c.result.provenance.executor, "grok");
  assert.equal(c.result.provenance.authority, false);
});

test("H — WRITE refusé sans permission", () => {
  const req = executionRequest({ requester: "a", capability: "github.write", permissions: ["READ"] });
  assert.equal(authorize(req).status, "BLOCKED");
});

test("I J — revoke / disconnect", () => {
  const g = grokExecutor();
  assert.equal(g.revoke().presence, "REVOKED");
  assert.equal(g.disconnect().presence, "DISCONNECTED");
});

test("K L — malformed + failed", () => {
  assert.equal(authorize({}).status, "BLOCKED");
  const c = fabricCycle({
    requester: "future-x",
    capability: "github.read",
    run: () => ({ error: "boom" }),
  });
  assert.equal(c.result.status, "FAILED");
});

test("W — sans run = CHANNEL_NOT_PRESENT, pas LIVE", () => {
  const c = fabricCycle({ requester: "future-x" });
  assert.equal(c.result.truth, false);
  assert.equal(c.result.status, "CHANNEL_NOT_PRESENT");
});

test("X — run injecté SUCCEEDED local ≠ LIVE_VERIFIED", () => {
  const c = fabricCycle({
    requester: "future-x",
    capability: "github.read",
    run: () => ({ login: "fixture" }),
  });
  assert.equal(c.result.status, "SUCCEEDED");
  assert.equal(c.result.measurement.status, "NOT_MEASURED");
});
