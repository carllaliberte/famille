import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it } from "node:test";
import { inspectForge, runKernel, KERNEL_VERSION, HUMAN, inbound, neurons, pulse, disconnect, resetKernel, dashboard, tune } from "../.github/swarm/kernel.mjs";
import { newKeyPair, openEnvelope, resetLease, wrapEnvelope } from "../.github/swarm/lease.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

afterEach(() => {
  resetLease();
  resetKernel();
});

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

  it("posts are DECLARED not CONNECTED_PERMANENT; only Carl disconnects", () => {
    const keys = newKeyPair();
    for (const n of neurons()) {
      assert.equal(n.declared, true, n.id);
      assert.equal(n.connected, false);
      assert.equal(n.presence, "DECLARED");
    }
    assert.equal(inbound({ status: "CONNECTED_PERMANENT" }).code, "CLAIMED_CHANNEL");
    assert.equal(inbound({ photon: true }).code, "PHOTONIC_ON_CONTROL");
    assert.equal(disconnect("gemini", "gemini").code, "HUMAN_ONLY");
    const wave = pulse({ topic: "sync" }, keys);
    assert.equal(wave.ok, true);
    assert.equal(wave.results.gemini.processed, true);
    assert.equal(wave.results.gemini.connected, false);
    assert.equal(wave.optical.presence, "CHANNEL_NOT_PRESENT");
    assert.equal(disconnect("gemini", "carllaliberte").ok, true);
    const after = pulse({ topic: "again" }, keys);
    assert.equal(after.results.gemini.presence, "BLOCKED");
    assert.equal(after.results.gemini.processed, false);
    assert.equal(after.results.grok.processed, true);
    assert.equal(dashboard("gemini").code, "HUMAN_ONLY");
    const board = dashboard("carllaliberte");
    assert.equal(board.ok, true);
    assert.equal(board.live, false);
    assert.equal(board.optical, "CHANNEL_NOT_PRESENT");
    assert.equal(board.neurons.find((n) => n.id === "gemini").presence, "BLOCKED");
    assert.ok(board.weights.grok >= 1);
    assert.ok(board.logs.length >= 1);
    assert.match(board.logs[0].ts, /Z$/);
    const t = tune();
    assert.ok(t.weights.grok <= 2);
    assert.equal(t.weights.gemini, board.weights.gemini);
  });
});
