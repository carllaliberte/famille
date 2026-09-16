import test from "node:test";
import assert from "node:assert/strict";
import {
  CHANNEL_STATES,
  RETIRED_PROVIDERS,
  classifyHttp,
  classifyTransport,
  evidenceState,
  channelEligibility,
  makeChannelEvidence,
  assertNoFakeExecution,
} from "../scripts/channel-reality.mjs";
import { classifyLane, secretAvailable, preferUnpaid } from "../scripts/inference-lanes.mjs";

test("channel reality has explicit terminal negative states", () => {
  for (const state of ["UNAVAILABLE", "RETIRED", "AUTH_FAILED", "FORBIDDEN", "NOT_FOUND", "RATE_LIMITED", "TRANSIENT_FAILURE"]) {
    assert.ok(CHANNEL_STATES.includes(state), state);
  }
});

test("HTTP 401/403/404/410 are learned as non-executable evidence", () => {
  assert.equal(classifyHttp(401).kind, "AUTH_FAILED");
  assert.equal(classifyHttp(403).kind, "FORBIDDEN");
  assert.equal(classifyHttp(404).kind, "NOT_FOUND");
  assert.equal(classifyHttp(410).kind, "RETIRED");
  assert.equal(classifyHttp(429).retryable, true);
  assert.equal(classifyHttp(503).retryable, true);
});

test("GitHub Models is structurally retired, even when a GitHub token exists", () => {
  assert.equal(RETIRED_PROVIDERS["github-models"].retired, true);
  const spec = { id: "ghmodels", provider: "github-models", secret: "GITHUB_TOKEN", model: "openai/gpt-4o-mini" };
  assert.equal(classifyLane(spec), "retired");
  assert.equal(secretAvailable(spec, { GITHUB_TOKEN: "present" }), false);
  assert.deepEqual(preferUnpaid([spec], { GITHUB_TOKEN: "present" }).selected, []);
  assert.deepEqual(preferUnpaid([spec], { GITHUB_TOKEN: "present" }).retired, ["ghmodels"]);
});

test("credentials alone never grant execution eligibility", () => {
  const configured = channelEligibility({ provider: "xai", credentialPresent: true });
  assert.equal(configured.eligible, false);
  assert.equal(configured.state, "CONFIGURED");
});

test("successful transport creates observed evidence, not fake LIVE", () => {
  const evidence = makeChannelEvidence({
    provider: "xai",
    channel: "grok46",
    model: "grok-4.6",
    endpoint: "https://example.invalid/v1/chat/completions",
    status: 200,
    responseText: "measured response",
    startedAt: 1000,
    finishedAt: 1200,
  });
  assert.equal(evidence.state, "OBSERVED");
  assert.equal(evidence.responseObserved, true);
  assert.equal(evidence.live, false);
  assert.equal(evidence.httpStatus, 200);
  assert.equal(evidence.durationMs, 200);
});

test("provider retirement overrides transport optimism", () => {
  const result = classifyTransport({ provider: "github-models", status: 200, body: "mocked success" });
  assert.equal(result.state, "RETIRED");
});

test("fake execution cannot be promoted", () => {
  assert.throws(
    () => assertNoFakeExecution({ state: "EXECUTED", provider: "xai", timestamp: new Date().toISOString() }),
    /FAKE_EXECUTION_BLOCKED/,
  );
  assert.doesNotThrow(() => assertNoFakeExecution({
    state: "OBSERVED",
    provider: "xai",
    timestamp: new Date().toISOString(),
    responseObserved: true,
  }));
});

test("transport failures preserve retry semantics", () => {
  const auth = evidenceState({ provider: "xai", status: 401, responseText: "unauthorized" });
  const transient = evidenceState({ provider: "xai", status: 503, responseText: "temporarily unavailable" });
  assert.equal(auth.state, "AUTH_FAILED");
  assert.equal(auth.retryable, false);
  assert.equal(transient.state, "TRANSIENT_FAILURE");
  assert.equal(transient.retryable, true);
});
