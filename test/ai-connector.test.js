import test from "node:test";
import assert from "node:assert/strict";
import { acceptIngress, inspectIngress } from "../.github/swarm/ai-connector.mjs";

const env = (mode) => ({ ACORN_SYSTEM_MODE: mode });

test("AI connector accepts every channel through the same boundary", () => {
  for (const channel of ["model", "tool", "local", "cloud", "quantum", "future"]) {
    const result = acceptIngress({ channel, source: "test", payload: { ok: true }, env: env("RUN") });
    assert.equal(result.accepted, true);
    assert.equal(result.channel, channel);
    assert.equal(result.auto_merge, false);
    assert.equal(result.live, false);
  }
});

test("AI connector is fully cut off by OFF regardless of channel", () => {
  assert.throws(
    () => acceptIngress({ channel: "quantum", source: "future", env: env("OFF") }),
    (error) => error.code === "GLOBAL_BREAKER_OFF"
  );
  assert.equal(inspectIngress({ channel: "model", source: "cloud", env: env("OFF") }).accepted, false);
});

test("DEBUG crosses the connector only as diagnostic execution", () => {
  const result = acceptIngress({ channel: "model", source: "astra", env: env("DEBUG") });
  assert.equal(result.accepted, true);
  assert.equal(result.diagnostic, true);
  assert.equal(result.production_write_allowed, false);
  assert.equal(result.live, false);
});
