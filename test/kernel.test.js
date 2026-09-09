import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it } from "node:test";
import { inspectForge, runKernel, KERNEL_VERSION, HUMAN } from "../.github/swarm/kernel.mjs";
import { newKeyPair, openEnvelope, resetLease, wrapEnvelope } from "../.github/swarm/lease.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

afterEach(() => resetLease());

describe("sovereign meta-kernel", () => {
  it("inspectForge finds no live secrets and no forbidden packages", () => {
    const r = inspectForge(ROOT);
    assert.equal(r.ok, true, JSON.stringify(r.hits.slice(0, 5)));
    assert.deepEqual(r.forbidden, []);
    assert.equal(r.live, false);
  });

  it("runKernel: unsigned optical NOT PRESENT, replay refused, kill-switch, Carl resets", () => {
    const keys = newKeyPair();
    const now = Date.parse("2026-09-09T03:00:00.000Z");
    const cycle = runKernel({
      keys,
      root: ROOT,
      ts: "2026-09-09T03:00:00.000Z",
      now,
    });
    assert.equal(cycle.version, KERNEL_VERSION);
    assert.equal(cycle.human, HUMAN);
    assert.equal(cycle.unsigned.presence, "CHANNEL_NOT_PRESENT");
    assert.equal(cycle.unsigned.connected, false);
    assert.equal(cycle.proved.ok, true);
    assert.equal(cycle.opened.ok, true);
    assert.equal(cycle.replay.code, "ENVELOPE_REPLAY");
    assert.equal(cycle.chain.ok, true);
    assert.equal(cycle.trip.isolated, true);
    assert.equal(cycle.auto.code, "HUMAN_ONLY");
    assert.equal(cycle.carl.ok, true);
    assert.equal(cycle.live, false);
    assert.equal(cycle.ok, true);
  });

  it("envelope rejects skew and unsigned photonic payload", () => {
    const keys = newKeyPair();
    assert.equal(wrapEnvelope({ photon: true }, keys).code, "PHOTONIC_ON_CONTROL");
    const wrapped = wrapEnvelope({ hello: "sync" }, keys, { ts: "2020-01-01T00:00:00.000Z" });
    assert.equal(wrapped.ok, true);
    assert.equal(openEnvelope(wrapped.envelope).code, "ENVELOPE_SKEW");
    assert.equal(openEnvelope({ payload: 1 }).code, "ENVELOPE_UNSIGNED");
  });
});
