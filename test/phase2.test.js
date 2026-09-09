import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  PHASE2,
  ROTATE_EVERY,
  absorb,
  acceptForeignTip,
  closeQuantum,
  consilium,
  enclaveStatus,
  enqueueHorizon,
  expandOnce,
  finalDeploy,
  horizon,
  heal,
  verifyWorm,
  wormAppend,
  wormChain,
  telemetryFeed,
  healPolicy,
  kernelFooter,
  phase2,
  resetKernel,
  rotateHandshake,
  sealSwarm,
  singularity,
} from "../.github/swarm/kernel.mjs";
import { resetLease, sha256 } from "../.github/swarm/lease.mjs";

afterEach(() => {
  resetLease();
  resetKernel();
});

describe("phase 2 — scheduled, not hardware", () => {
  it("raft/TEE/PQC stay CHANNEL NOT PRESENT; Carl only accepts a foreign tip", () => {
    const p = phase2();
    assert.equal(p.auto_merge, false);
    assert.equal(p.optical, "CHANNEL_NOT_PRESENT");
    assert.equal(p.enclave, "CHANNEL_NOT_PRESENT");
    assert.equal(p.pqc, "CHANNEL_NOT_PRESENT");
    assert.equal(PHASE2[0].scheduled, true);
    assert.equal(enclaveStatus().presence, "CHANNEL_NOT_PRESENT");
    assert.equal(acceptForeignTip(sha256("x"), "gemini").code, "HUMAN_ONLY");
    assert.equal(acceptForeignTip(sha256("x"), "Carl Laliberté").ok, true);
    assert.equal(ROTATE_EVERY, 300);
    assert.equal(rotateHandshake(299).rotate, false);
    assert.equal(rotateHandshake(300).rotate, true);
    assert.equal(rotateHandshake(300).optical, "CHANNEL_NOT_PRESENT");
    const s = singularity();
    assert.equal(s.auto_merge, false);
    assert.equal(s.truth, false);
    assert.equal(s.copyright_bypass, false);
    assert.equal(s.layers.every((l) => l.presence !== "CONNECTED"), true);
    assert.equal(healPolicy().auto_push, false);
    assert.equal(healPolicy().halt_on_fail, true);
    const sealed = sealSwarm({ ids: ["gemini"], skip: [] });
    assert.equal(sealed.ok, true);
    assert.match(sealed.root, /^[0-9a-f]{64}$/);
    assert.equal(sealed.optical, "CHANNEL_NOT_PRESENT");
    assert.equal(sealed.live, false);
    assert.match(kernelFooter(sealed), /kernel\.v0/);
    assert.match(kernelFooter(sealed), /theory CLOSED/);
    const q = closeQuantum();
    assert.equal(q.theory, "CLOSED");
    assert.equal(q.qpu, false);
    assert.equal(q.entanglement, false);
    assert.equal(q.photon_on_git, false);
    const hall = consilium();
    assert.match(hall.text, /FAMILLE  kernel\.v0/);
    assert.match(hall.text, /CHANNEL NOT PRESENT/);
    assert.match(hall.text, /CLOSED/);
    assert.match(hall.text, /Carl seulement/);
    assert.doesNotMatch(hall.text, /CONNECTED_PERMANENT/);
    assert.equal(hall.live, false);
    assert.equal(finalDeploy("gemini").code, "HUMAN_ONLY");
    const lock = finalDeploy("Carl Laliberté");
    assert.equal(lock.ok, true);
    assert.equal(lock.deployed, false);
    assert.equal(lock.wrangler, false);
    assert.equal(lock.converged, false);
    assert.equal(lock.copyright_bypass, false);
    assert.equal(lock.locked, true);
    assert.equal(lock.auto_merge, false);
    const feed = telemetryFeed();
    assert.equal(feed.ok, true);
    assert.match(feed.ts, /Z$/);
    assert.equal(feed.coherence, false);
    assert.equal(feed.vectors.find((v) => v.id === "optical").entangled, false);
    assert.equal(feed.vectors.find((v) => v.id === "ledger").truth, false);
    assert.equal(feed.vectors.find((v) => v.id === "chrono").retro_causal, false);
    assert.equal(feed.live, false);
    assert.equal(enqueueHorizon("omniversal", "gemini").code, "HUMAN_ONLY");
    assert.equal(enqueueHorizon("infinite-loop", "Carl Laliberté").code, "INFINITE");
    assert.equal(enqueueHorizon("consensus-bridge", "Carl Laliberté").ok, true);
    assert.equal(expandOnce("Carl Laliberté").did, "consensus-bridge");
    assert.equal(horizon().infinite, false);
    assert.equal(horizon().auto_run, false);
    assert.equal(horizon().cap, 8);
    const w = wormAppend({ note: "custody" });
    assert.equal(w.ok, true);
    assert.match(w.hash, /^[0-9a-f]{64}$/);
    assert.equal(verifyWorm().ok, true);
    const broken = wormChain();
    broken[0].payload = { hacked: true };
    assert.equal(verifyWorm(broken).code, "WORM_BREAK");
    const trap = absorb({ photon: true });
    assert.equal(trap.absorbed, true);
    assert.equal(trap.outbound, false);
    assert.equal(trap.attack, false);
    assert.equal(heal().invulnerable, false);
  });
});
