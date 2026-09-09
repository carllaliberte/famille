import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  PHASE2,
  ROTATE_EVERY,
  acceptForeignTip,
  closeQuantum,
  consilium,
  enclaveStatus,
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
  });
});
