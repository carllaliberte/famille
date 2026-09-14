import test from "node:test";
import assert from "node:assert/strict";
import { composeFabric, routeIngress } from "../scripts/cognitive-fabric.mjs";

const front = { number: 469, sha: "a".repeat(40) };

function env(mode = "RUN") {
  return { ACORN_SYSTEM_MODE: mode };
}

test("fabric routes every source through the common connector", () => {
  const fabric = composeFabric({
    fronts: [front],
    sources: [
      { id: "astra", channel: "model", capability: "review" },
      { id: "gemini", channel: "model", capability: "review" },
      { id: "future-quantum", channel: "quantum", capability: "measurement" },
    ],
    env: env(),
  });
  assert.equal(fabric.route_count, 3);
  assert.equal(fabric.synapse_count, 3);
  assert.equal(fabric.collective, true);
  assert.equal(fabric.live, false);
  assert.equal(fabric.authority, "carl");
  assert.ok(fabric.routes.every((r) => r.connector === "ai-connector.v1"));
  assert.ok(fabric.synapses.every((s) => s.state === "PROPOSED"));
});

test("breaker OFF blocks the fabric at ingress", () => {
  assert.throws(
    () => routeIngress({ source: "astra", channel: "model", env: env("OFF") }),
    (error) => error?.code === "GLOBAL_BREAKER_OFF",
  );
});

test("diagnostic mode remains dispatchable but non-authoritative", () => {
  const route = routeIngress({ source: "astra", channel: "model", env: env("DEBUG") });
  assert.equal(route.state, "DISPATCHABLE");
  assert.equal(route.production_write_allowed, false);
  assert.equal(route.auto_merge, false);
  assert.equal(route.live, false);
  assert.equal(route.human_authority, "carl");
});
