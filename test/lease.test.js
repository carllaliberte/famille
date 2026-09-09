import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  closeEpoch,
  isIsolated,
  isolate,
  merkleRoot,
  newKeyPair,
  opticalCanal,
  proveLease,
  resetIsolation,
  resetLease,
  sha256,
  verifyChain,
  verifyLease,
  watchdog,
} from "../.github/swarm/lease.mjs";
import { opticalPresence, resetCognition } from "../.github/swarm/cognition.mjs";

afterEach(() => {
  resetLease();
  resetCognition();
});

describe("proof-of-lease + merkle epoch + kill-switch", () => {
  it("unsigned optical canal is CHANNEL NOT PRESENT — no photon, no fake CONNECTED", () => {
    const p = opticalCanal(null);
    assert.equal(p.presence, "CHANNEL_NOT_PRESENT");
    assert.equal(p.connected, false);
    assert.equal(proveLease({ certificate: "x" }).code, "LEASE_KEY");
    assert.equal(proveLease({ photonic: true }, newKeyPair()).code, "PHOTONIC_ON_CONTROL");
  });

  it("Ed25519 proof-of-lease verifies; tamper is rejected", () => {
    const keys = newKeyPair();
    const proved = proveLease(
      {
        certificate: "classical-lease",
        from: "grok",
        to: "build",
        loss_db_max: 0.3,
        fidelity_min: 0.99,
        ts: "2026-09-09T02:40:00.000Z",
      },
      keys,
    );
    assert.equal(proved.ok, true);
    assert.equal(verifyLease(proved.lease).ok, true);
    const forged = { ...proved.lease, loss_db_max: 9.9 };
    assert.equal(verifyLease(forged).code, "LEASE_TAMPER");
    const other = newKeyPair();
    const swapped = { ...proved.lease, publicKey: other.publicKey.export({ type: "spki", format: "pem" }) };
    assert.equal(verifyLease(swapped).code, "LEASE_FORGED");
  });

  it("epoch merkle chains; replay and root edit fail", () => {
    const keys = newKeyPair();
    proveLease({ certificate: "a" }, keys);
    const e1 = closeEpoch(keys);
    assert.equal(e1.ok, true);
    proveLease({ certificate: "b" }, keys);
    const e2 = closeEpoch(keys);
    assert.equal(verifyChain().ok, true);
    assert.equal(e2.epoch.prevRoot, e1.epoch.root);
    assert.equal(e2.epoch.n, 1);
    assert.equal(verifyChain([e2.epoch]).code, "EPOCH_REPLAY");
    const broken = [{ ...e2.epoch, prevRoot: sha256("nope") }];
    assert.equal(verifyChain(broken).ok, false);
    const badRoot = [{ ...e1.epoch, root: merkleRoot(["x"]) }];
    assert.equal(verifyChain(badRoot).ok, false);
  });

  it("watchdog isolates on decoherence; Carl only resets", () => {
    const keys = newKeyPair();
    proveLease({ certificate: "fiber", loss_db_max: 0.3, fidelity_min: 0.99 }, keys);
    closeEpoch(keys);
    const trip = watchdog({ measured_loss: 1.2, keys });
    assert.equal(trip.isolated, true);
    assert.equal(trip.presence, "CHANNEL_NOT_PRESENT");
    assert.equal(isIsolated(), true);
    assert.equal(opticalCanal(null).reason, "kill-switch");
    assert.equal(resetIsolation("gemini").code, "HUMAN_ONLY");
    assert.equal(isIsolated(), true);
    const back = resetIsolation("carllaliberte");
    assert.equal(back.ok, true);
    assert.equal(isIsolated(), false);
  });

  it("cognition opticalPresence honors signed lease + isolation", () => {
    const keys = newKeyPair();
    const proved = proveLease({ certificate: "fiber" }, keys);
    const idle = opticalPresence(proved.lease);
    assert.equal(idle.presence, "CHANNEL_NOT_PRESENT");
    const live = opticalPresence(proved.lease, { fiber: true, secret: true });
    assert.equal(live.presence, "CONNECTED");
    assert.equal(live.live, false);
    isolate("test", keys);
    const after = opticalPresence(proved.lease, { fiber: true, secret: true });
    assert.equal(after.presence, "CHANNEL_NOT_PRESENT");
    assert.equal(after.reason, "kill-switch");
  });
});
