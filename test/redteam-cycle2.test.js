import { test } from "node:test";
import assert from "node:assert/strict";
import {
  authorize, executionRequest, grokExecutor, isolateCompromised,
  disclose, executionResult, declareIntelligence,
} from "../sdk/open-intelligence.js";
import { declareFutureIntelligence, route } from "../sdk/nerve.js";
import { humanDecide } from "../sdk/organism.js";

test("F16 self-grant WRITE ignored", () => {
  const a = authorize(executionRequest({
    requester: "monster",
    capability: "github.delete",
    permissions: ["WRITE"],
  }));
  assert.equal(a.status, "BLOCKED");
});

test("F16b EXECUTE does not unlock write", () => {
  const a = authorize(executionRequest({
    requester: "monster",
    capability: "github.write",
    permissions: ["EXECUTE"],
  }));
  assert.equal(a.status, "BLOCKED");
});

test("F17 catalog holes still fail-closed if grant is READ", () => {
  for (const cap of ["github.merge", "github.rm", "github.grant", "gmail.send"]) {
    assert.equal(authorize(executionRequest({ requester: "x", capability: cap })).status, "BLOCKED", cap);
  }
});

test("F18 isolateCompromised revokes adapter", () => {
  const g = grokExecutor({ run: () => ({ ok: true }) });
  isolateCompromised("grok", g);
  const res = g.invoke(executionRequest({ requester: "x", capability: "github.read" }));
  assert.equal(res.status, "REVOKED");
});

test("F19 disclose without proof dumps nothing", () => {
  assert.equal(disclose("carl", { secret: 1 }).disclosed, false);
  assert.equal(disclose("carl", { secret: 1 }, true).disclosed, true);
});

test("F20 nerve reserved id", () => {
  assert.throws(() => declareFutureIntelligence("carl"));
});

test("F21 nerve.route skips REVOKED", () => {
  const r = route({ need: "observe" }, [{ id: "evil", presence: "REVOKED", caps: ["observe"] }]);
  assert.equal(r.length, 0);
});

test("F22 humanDecide live always false", () => {
  assert.equal(humanDecide({}, "carl").live, false);
  assert.equal(humanDecide({}, "carl").decided, true);
});

test("F25 hostile output.live stripped", () => {
  const out = executionResult(
    executionRequest({ requester: "x", capability: "github.read" }),
    { executor: "grok", status: "SUCCEEDED", output: { live: true, authority: true, truth: true, login: "x" } },
  );
  assert.equal(out.output.live, undefined);
  assert.equal(out.output.authority, undefined);
  assert.equal(out.truth, false);
  assert.equal(out.output.login, "x");
});

test("F23 alias still not mayJudge", () => {
  const r = declareIntelligence({ agents: [] }, { id: "carll", role: "guest" });
  assert.equal(r.agents[0].authority, false);
});
