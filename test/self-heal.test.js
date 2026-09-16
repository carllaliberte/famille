import test from "node:test";
import assert from "node:assert/strict";
import { classifyFailure, recoveryPlan, selfHealDecision } from "../scripts/self-heal.mjs";

test("self-heal classifies transient failures for automatic retry", () => {
  assert.equal(classifyFailure({ status: 429, reason: "rate limit" }), "TRANSIENT");
  assert.equal(recoveryPlan({ failureClass: "TRANSIENT", attempt: 0 }).action, "RETRY");
});

test("self-heal routes code/test failures back to repair worker", () => {
  const decision = selfHealDecision({ reason: "npm test assertion failed", attempt: 0 });
  assert.equal(decision.failure_class, "CODE_OR_TEST");
  assert.equal(decision.action, "DISPATCH_REPAIR");
  assert.equal(decision.auto_merge, false);
});

test("self-heal preserves human boundary for secrets and authorization", () => {
  const decision = selfHealDecision({ reason: "missing API secret", attempt: 0 });
  assert.equal(decision.failure_class, "HUMAN_BOUNDARY");
  assert.equal(decision.action, "HOLD_HUMAN");
  assert.equal(decision.human_required, true);
});

test("self-heal is fail-closed when global breaker is OFF", () => {
  const decision = selfHealDecision({ reason: "test failure", breaker: "OFF" });
  assert.equal(decision.action, "STOP");
  assert.equal(decision.reason, "GLOBAL_BREAKER_OFF");
});

test("self-heal stops automatic retries after the bounded repair budget", () => {
  const decision = selfHealDecision({ reason: "test failure", attempt: 3, maxAttempts: 3 });
  assert.equal(decision.action, "ESCALATE");
  assert.equal(decision.retry, false);
});
