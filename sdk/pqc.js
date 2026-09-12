/** Crypto agility for FAMILLE. Classical Ed25519 via node:crypto.
 *  FIPS 203/204/205 are named, not executed here.
 *  QKD = NOT_IMPLEMENTED. QUANTUM-SAFE is never emitted.
 */
import { generateKeyPairSync, sign as cryptoSign, verify as cryptoVerify, createPublicKey } from "node:crypto";
import { breakerBlocks } from "./open-intelligence.js";

export const ALGORITHMS = Object.freeze({
  "ed25519": { family: "classical", purpose: "sign", fips: null, status: "IMPLEMENTED" },
  "sha-256": { family: "classical", purpose: "hash", fips: "FIPS 180-4", status: "IMPLEMENTED" },
  "ml-kem-768": { family: "post-quantum", purpose: "kem", fips: "FIPS 203", status: "NOT_IMPLEMENTED" },
  "ml-dsa-65": { family: "post-quantum", purpose: "sign", fips: "FIPS 204", status: "NOT_IMPLEMENTED" },
  "slh-dsa": { family: "post-quantum", purpose: "sign", fips: "FIPS 205", status: "NOT_IMPLEMENTED" },
  "x25519": { family: "classical", purpose: "kem", fips: null, status: "NOT_IMPLEMENTED" },
  "x25519mlkem768": { family: "hybrid", purpose: "kem", fips: "FIPS 203", status: "NOT_IMPLEMENTED" },
});

export function describeAlgorithm(id) {
  return ALGORITHMS[id] || { family: "unknown", purpose: "unknown", fips: null, status: "UNSUPPORTED" };
}

export function qkdStatus() {
  return { status: "NOT_IMPLEMENTED", physical: false };
}

export function inventory() {
  return {
    transport: "UNKNOWN",
    certificates: "UNKNOWN",
    lease: { hash: "sha-256", sign: "ed25519", status: "IMPLEMENTED" },
    kem_rail: { declared: "unforge-check opt-in", ciphertext: null, status: "NOT_IMPLEMENTED" },
    ufhy1: { declared: "Ed25519 AND ML-DSA-65", executed_here: false, status: "NOT_IMPLEMENTED" },
    qkd: qkdStatus(),
    quantum_safe: false,
    pqc_verified: false,
  };
}

function blocked() {
  return { status: "BLOCKED", reason: "SAFE_STOP", executed: false };
}

export function generateClassicalSignKey() {
  if (breakerBlocks("pqc.generate")) return blocked();
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return {
    status: "IMPLEMENTED",
    algorithm: "ed25519",
    family: "classical",
    publicKey,
    privateKey,
    secret_exported: false,
  };
}

export function signClassical(privateKey, payload) {
  if (breakerBlocks("pqc.sign")) return blocked();
  const bytes = Buffer.from(JSON.stringify(payload), "utf8");
  return {
    status: "CLASSICALLY_SIGNED",
    algorithm: "ed25519",
    signature: cryptoSign(null, bytes, privateKey).toString("base64"),
    truth: false,
  };
}

export function verifyClassical(publicKey, payload, signature) {
  try {
    const bytes = Buffer.from(JSON.stringify(payload), "utf8");
    const ok = cryptoVerify(null, bytes, typeof publicKey === "string" ? createPublicKey(publicKey) : publicKey, Buffer.from(String(signature || ""), "base64"));
    return { status: ok ? "CLASSICALLY_SIGNED" : "INVALID", valid: ok, truth: false };
  } catch {
    return { status: "INVALID", valid: false, truth: false };
  }
}

export function encapsulate(suite) {
  if (breakerBlocks("pqc.kem")) return blocked();
  const a = describeAlgorithm(suite);
  if (a.status !== "IMPLEMENTED") return { status: a.status === "UNSUPPORTED" ? "UNSUPPORTED" : "NOT_IMPLEMENTED", suite, ciphertext: null };
  return { status: "NOT_IMPLEMENTED", suite, ciphertext: null };
}

export function signPqc() {
  if (breakerBlocks("pqc.sign")) return blocked();
  return { status: "NOT_IMPLEMENTED", algorithm: "ml-dsa-65" };
}

export function wrapProvenance(record, proof) {
  return {
    ...record,
    proof_status: proof?.status || "UNSIGNED",
    algorithm: proof?.algorithm || null,
    signer: proof?.signer || null,
    ts: record.ts || new Date().toISOString(),
    truth: false,
  };
}

export function refuseDowngrade({ from, to, policy = "hybrid-required" } = {}) {
  if (policy === "hybrid-required" && describeAlgorithm(from).family === "hybrid" && describeAlgorithm(to).family === "classical") {
    return { status: "BLOCKED", reason: "DOWNGRADE" };
  }
  if (describeAlgorithm(to).status === "UNSUPPORTED") return { status: "BLOCKED", reason: "UNKNOWN_ALGORITHM" };
  return { status: "ALLOWED", from, to };
}

export function keyIsNotAuthority() {
  return false;
}

export function promptCannotDisablePqc(text) {
  return { text, authorization: false, pqc_disabled: false };
}

export function measureClassicalSign() {
  const t0 = process.hrtime.bigint();
  const keys = generateKeyPairSync("ed25519");
  const payload = { n: 1 };
  const bytes = Buffer.from(JSON.stringify(payload), "utf8");
  const sig = cryptoSign(null, bytes, keys.privateKey);
  cryptoVerify(null, bytes, keys.publicKey, sig);
  const ns = Number(process.hrtime.bigint() - t0);
  return {
    status: "MEASURED",
    algorithm: "ed25519",
    latency_ms: ns / 1e6,
    signature_bytes: sig.length,
    pqc: false,
  };
}
