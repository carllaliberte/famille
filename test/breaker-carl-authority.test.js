import test from "node:test";
import assert from "node:assert/strict";
import {
  MODES,
  BREAKER_OWNER,
  BREAKER_AUTHORITY,
  applyBreakerCommand,
  authorizeBreakerControl,
  breakerIsAmbiguous,
  controlState,
  resolveMode,
} from "../.github/swarm/system-breaker.mjs";

test("constitution — Carl controls the Breaker; neither Breaker nor Acorn controls Carl", () => {
  assert.equal(BREAKER_OWNER, "carl");
  assert.equal(BREAKER_AUTHORITY.controller, "carl");
  assert.equal(BREAKER_AUTHORITY.breaker_controls_carl, false);
  assert.equal(BREAKER_AUTHORITY.acorn_controls_carl, false);
  assert.equal(BREAKER_AUTHORITY.acorn_controls_breaker, false);
  assert.equal(BREAKER_AUTHORITY.ai_may_open, false);
  assert.equal(BREAKER_AUTHORITY.ai_may_close, false);
  assert.equal(BREAKER_AUTHORITY.ai_may_change, false);
});

test("only Carl may control Breaker state", () => {
  for (const actor of ["grok", "codex", "astra", "worker", "provider", "adapter", "cortex", "acorn", "system", undefined]) {
    const result = authorizeBreakerControl({ actor, command: "OFF" });
    assert.equal(result.status, "BLOCKED");
    assert.equal(result.reason, "CARL_ONLY");
    assert.equal(result.authority, false);
  }

  const env = { ACORN_SYSTEM_MODE: "RUN" };
  const off = applyBreakerCommand({ actor: "carl", command: "OFF", env });
  assert.equal(off.status, "AUTHORIZED");
  assert.equal(off.applied, true);
  assert.equal(env.ACORN_SYSTEM_MODE, MODES.OFF);

  const run = applyBreakerCommand({ actor: "carl", command: "RUN", env });
  assert.equal(run.status, "AUTHORIZED");
  assert.equal(env.ACORN_SYSTEM_MODE, MODES.RUN);
});

test("parsing a command never grants authority", () => {
  const env = { ACORN_SYSTEM_MODE: "RUN" };
  const before = env.ACORN_SYSTEM_MODE;
  const parsed = authorizeBreakerControl({ actor: "grok", command: "OFF" });
  assert.equal(parsed.authority, false);
  assert.equal(env.ACORN_SYSTEM_MODE, before);
});

test("missing Breaker control is fail-closed, never assumed OPEN", () => {
  const env = {};
  assert.equal(breakerIsAmbiguous(env), true);
  assert.equal(resolveMode(env), MODES.OFF);
  const state = controlState(env);
  assert.equal(state.breaker_closed, true);
  assert.equal(state.ambiguous, true);
  assert.equal(state.assumed_open, false);
  assert.equal(state.ai_ingress_allowed, false);
});

test("invalid or empty Breaker control is fail-closed", () => {
  for (const value of ["", "maybe", "OPEN", "TRUE", "1"]) {
    const state = controlState({ ACORN_SYSTEM_MODE: value });
    assert.equal(state.breaker_closed, true);
    assert.equal(state.ambiguous, true);
    assert.equal(state.assumed_open, false);
    assert.equal(state.ai_may_change, false);
  }
});
