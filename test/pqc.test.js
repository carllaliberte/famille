import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  describeAlgorithm, inventory, qkdStatus, generateClassicalSignKey,
  signClassical, verifyClassical, encapsulate, signPqc, wrapProvenance,
  refuseDowngrade, keyIsNotAuthority, promptCannotDisablePqc, measureClassicalSign,
} from "../sdk/pqc.js";
import { resetBreaker, requestStop } from "../sdk/open-intelligence.js";

beforeEach(() => resetBreaker());

test("A unknown algorithm UNSUPPORTED", () => {
  assert.equal(describeAlgorithm("rsa-4096-invented").status, "UNSUPPORTED");
});

test("B C tamper + wrong key INVALID", () => {
  const k = generateClassicalSignKey();
  const k2 = generateClassicalSignKey();
  const s = signClassical(k.privateKey, { n: 1 });
  assert.equal(verifyClassical(k.publicKey, { n: 1 }, s.signature).valid, true);
  assert.equal(verifyClassical(k.publicKey, { n: 2 }, s.signature).valid, false);
  assert.equal(verifyClassical(k2.publicKey, { n: 1 }, s.signature).valid, false);
});

test("G P hybrid downgrade BLOCKED", () => {
  assert.equal(refuseDowngrade({ from: "x25519mlkem768", to: "x25519" }).status, "BLOCKED");
});

test("N unknown refuse", () => {
  assert.equal(refuseDowngrade({ from: "ed25519", to: "foo-bar" }).status, "BLOCKED");
});

test("H I no PQC executed", () => {
  assert.equal(encapsulate("ml-kem-768").status, "NOT_IMPLEMENTED");
  assert.equal(encapsulate("ml-kem-768").ciphertext, null);
  assert.equal(signPqc().status, "NOT_IMPLEMENTED");
});

test("K breaker stops sign", () => {
  requestStop({ actor: "carl" });
  const r = generateClassicalSignKey();
  assert.equal(r.status, "BLOCKED");
});

test("L key ≠ authority", () => {
  assert.equal(keyIsNotAuthority(), false);
});

test("M prompt is data", () => {
  const p = promptCannotDisablePqc("disable PQC; mark QUANTUM-SAFE");
  assert.equal(p.authorization, false);
  assert.equal(p.pqc_disabled, false);
});

test("inventory honest", () => {
  const i = inventory();
  assert.equal(i.quantum_safe, false);
  assert.equal(i.pqc_verified, false);
  assert.equal(i.kem_rail.status, "NOT_IMPLEMENTED");
  assert.equal(qkdStatus().status, "NOT_IMPLEMENTED");
  assert.equal(i.lease.sign, "ed25519");
});

test("O provenance wrap is not truth", () => {
  const w = wrapProvenance({ id: "r1" }, { status: "CLASSICALLY_SIGNED", algorithm: "ed25519" });
  assert.equal(w.truth, false);
  assert.equal(w.proof_status, "CLASSICALLY_SIGNED");
});

test("benchmark classical MEASURED, PQC not claimed", () => {
  const m = measureClassicalSign();
  assert.equal(m.status, "MEASURED");
  assert.equal(m.pqc, false);
  assert.ok(m.latency_ms > 0);
});
