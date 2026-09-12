import { test } from "node:test";
import assert from "node:assert/strict";
import { nextWork, diagnose, loopStatus } from "../sdk/omni-ecosystem.js";
import { requestStop, resetBreaker, breakerStatus } from "../sdk/open-intelligence.js";

test("nextWork ranks OPEN without claiming LIVE", () => {
  resetBreaker();
  const n = nextWork();
  assert.equal(n.live, false);
  assert.equal(n.authority, false);
  assert.equal(n.mode, "COLLECTIVE_COGNITION");
  assert.match(n.phrase, /certitudes/
);
  assert.ok(n.now.some((x) => x.id === "session-tools-unbound"));
  assert.ok(n.do_not.includes("invent LIVE"));
});

test("diagnose exposes next + breaker", () => {
  const d = diagnose();
  assert.ok(d.next.now.length >= 1);
  assert.equal(d.breaker.session_tools_bound, false);
  assert.equal(d.live_invented, false);
  assert.equal(loopStatus().EXTERNAL_FEEDBACK, "NOT_IMPLEMENTED");
});

test("under SAFE_STOP next_safe is diagnose-only", () => {
  resetBreaker();
  requestStop({ actor: "carl" });
  assert.equal(nextWork().next_safe, "diagnose-only");
  assert.equal(breakerStatus().state, "SAFE_STOP");
  resetBreaker();
});
