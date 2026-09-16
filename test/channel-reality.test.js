import test from "node:test";
import assert from "node:assert/strict";
import {
  CHANNEL_STATES, RETIRED_PROVIDERS, classifyHttp, classifyTransport, evidenceState,
  channelEligibility, makeChannelEvidence, assertNoFakeExecution,
} from "../scripts/channel-reality.mjs";
import { classifyLane, secretAvailable, preferUnpaid } from "../scripts/inference-lanes.mjs";

test("channel reality has explicit negative states", () => {
  for (const state of ["UNAVAILABLE", "RETIRED", "AUTH_FAILED", "FORBIDDEN", "NOT_FOUND", "RATE_LIMITED", "TIMEOUT", "TRANSIENT_FAILURE"]) assert.ok(CHANNEL_STATES.includes(state));
});

test("HTTP taxonomy does not collapse timeout and rate limit", () => {
  assert.equal(classifyHttp(401).kind, "AUTH_FAILED");
  assert.equal(classifyHttp(403).kind, "FORBIDDEN");
  assert.equal(classifyHttp(404).kind, "NOT_FOUND");
  assert.equal(classifyHttp(410).kind, "RETIRED");
  assert.equal(classifyHttp(408).kind, "TIMEOUT");
  assert.equal(classifyHttp(429).kind, "RATE_LIMITED");
  assert.equal(classifyHttp(503).kind, "TRANSIENT_FAILURE");
});

test("transport taxonomy covers DNS/TLS/connection failures", () => {
  assert.equal(classifyTransport({ provider: "xai", errorCode: "ENOTFOUND" }).kind, "TRANSIENT_FAILURE");
  assert.equal(classifyTransport({ provider: "xai", errorCode: "ETIMEDOUT" }).kind, "TIMEOUT");
  assert.equal(classifyTransport({ provider: "xai", errorCode: "EPROTO" }).kind, "TRANSIENT_FAILURE");
});

test("GitHub Models is retired even when a token exists", () => {
  assert.equal(RETIRED_PROVIDERS["github-models"].retired, true);
  const spec = { id: "ghmodels", provider: "github-models", secret: "GITHUB_TOKEN", model: "openai/gpt-4o-mini" };
  assert.equal(classifyLane(spec), "retired");
  assert.equal(secretAvailable(spec, { GITHUB_TOKEN: "present" }), false);
  assert.deepEqual(preferUnpaid([spec], { GITHUB_TOKEN: "present" }).selected, []);
});

test("credentials alone are CONFIGURED, never executable", () => {
  const configured = channelEligibility({ provider: "xai", credentialPresent: true });
  assert.equal(configured.eligible, false);
  assert.equal(configured.state, "CONFIGURED");
});

test("real transport evidence carries its lease timestamp", () => {
  const evidence = makeChannelEvidence({ provider: "xai", channel: "grok46", model: "grok-4.6", status: 200, responseText: "real response", startedAt: 1000, finishedAt: 1200 });
  assert.equal(evidence.state, "OBSERVED");
  assert.equal(evidence.responseObserved, true);
  assert.equal(evidence.finishedAt, 1200);
  assert.equal(channelEligibility({ provider: "xai", credentialPresent: true, evidence, now: 1200 }).eligible, true);
  assert.equal(channelEligibility({ provider: "xai", credentialPresent: true, evidence, now: 1200 + 15 * 60 * 1000 + 1 }).eligible, false);
});

test("retirement overrides mocked transport optimism", () => {
  assert.equal(classifyTransport({ provider: "github-models", status: 200, body: "mocked success" }).state, "RETIRED");
  assert.equal(evidenceState({ provider: "github-models", status: 200, responseText: "mocked success" }).state, "RETIRED");
});

test("fallback never rewrites original provider evidence", () => {
  const failed = makeChannelEvidence({ provider: "dead-provider", channel: "native", status: 404, responseText: "not found" });
  const fallback = makeChannelEvidence({ provider: "openrouter", channel: "fallback", status: 200, responseText: "fallback response" });
  assert.equal(failed.provider, "dead-provider");
  assert.equal(failed.state, "NOT_FOUND");
  assert.equal(fallback.provider, "openrouter");
  assert.equal(fallback.state, "OBSERVED");
});

test("fake execution requires transport evidence", () => {
  assert.throws(() => assertNoFakeExecution({ state: "EXECUTED", provider: "xai", channel: "grok46", timestamp: new Date().toISOString(), responseObserved: true }), /FAKE_EXECUTION_BLOCKED/);
  assert.doesNotThrow(() => assertNoFakeExecution({ state: "OBSERVED", provider: "xai", channel: "grok46", timestamp: new Date().toISOString(), responseObserved: true, transportEvidence: { httpStatus: 200, observed: true } }));
});
