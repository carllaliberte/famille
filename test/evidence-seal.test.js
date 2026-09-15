import test from "node:test";
import assert from "node:assert/strict";
import { evidenceDigest, sealEvidence, verifyEvidenceSeal } from "../scripts/evidence-seal.mjs";

test("evidence seal is deterministic across object key order", () => {
  const a = { b: 2, a: 1, nested: { z: true, x: [3, 2, 1] } };
  const b = { nested: { x: [3, 2, 1], z: true }, a: 1, b: 2 };
  assert.equal(evidenceDigest(a), evidenceDigest(b));
  assert.equal(verifyEvidenceSeal(sealEvidence(a)), true);
});

test("tampering invalidates the seal", () => {
  const sealed = sealEvidence({ value: "measured", attempts: 3 });
  const tampered = { ...sealed, attempts: 4 };
  assert.equal(verifyEvidenceSeal(sealed), true);
  assert.equal(verifyEvidenceSeal(tampered), false);
});

test("a seal does not mint authority or LIVE", () => {
  const sealed = sealEvidence({ authority: "carl", auto_merge: false, live: false });
  assert.equal(sealed.authority, "carl");
  assert.equal(sealed.auto_merge, false);
  assert.equal(sealed.live, false);
});
