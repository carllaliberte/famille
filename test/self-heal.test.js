import test from "node:test";
import assert from "node:assert/strict";
import { classifyFailure, recoveryPlan, selfHealDecision } from "../scripts/self-heal.mjs";

test("transient failures are retried automatically", () => {
  assert.equal(classifyFailure({ status: 429, reason: "rate limit" }), "TRANSIENT");
  assert.equal(recoveryPlan({ failureClass: "TRANSIENT", attempt: 0 }).action, "RETRY");
});

test("code/test failures return to the repair worker", () => {
  const d = selfHealDecision({ reason: "npm test assertion failed", attempt: 0 });
  assert.equal(d.failure_class, "CODE_OR_TEST");
  assert.equal(d.action, "DISPATCH_REPAIR");
  assert.equal(d.auto_merge, false);
});

test("secrets and authorization remain human boundaries", () => {
  const d = selfHealDecision({ reason: "missing API secret", attempt: 0 });
  assert.equal(d.failure_class, "HUMAN_BOUNDARY");
  assert.equal(d.action, "HOLD_HUMAN");
  assert.equal(d.human_required, true);
});

test("global breaker OFF always stops recovery", () => {
  const d = selfHealDecision({ reason: "test failure", breaker: "OFF" });
  assert.equal(d.action, "STOP");
  assert.equal(d.reason, "GLOBAL_BREAKER_OFF");
});

test("repair budget is bounded", () => {
  const d = selfHealDecision({ reason: "test failure", attempt: 3, maxAttempts: 3 });
  assert.equal(d.action, "ESCALATE");
  assert.equal(d.retry, false);
});
