/**
 * Proof-of-lease + epoch Merkle + kill-switch.
 * Classical control plane only. No photon on Git. No blockchain.
 * SHA-256 + Ed25519 (node:crypto). LIVE VERIFIED is Carl only.
 * Isolated nodes stay CHANNEL NOT PRESENT until Carl resets.
 */
import {
  createHash,
  createPublicKey,
  generateKeyPairSync,
  sign as cryptoSign,
  verify as cryptoVerify,
} from "node:crypto";
import { OWNER_ACTOR } from "./flux.mjs";

export const LEASE_VERSION = "lease.v0";
export const CANAL = "OPTICAL_QUANTUM";

function fail(code, error) {
  return { ok: false, code, error };
}

function isoTs(value) {
  const s = String(value || "");
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function clip(text, n) {
  return String(text || "").trim().slice(0, n);
}

export function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

function stable(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stable).join(",")}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stable(obj[k])}`).join(",")}}`;
}

function asKey(key) {
  if (!key) return null;
  if (typeof key === "string") return createPublicKey(key);
  return key;
}

export function newKeyPair() {
  return generateKeyPairSync("ed25519");
}

export function publicPem(keys) {
  return keys.publicKey.export({ type: "spki", format: "pem" });
}

export function signPayload(privateKey, payload) {
  const bytes = Buffer.from(stable(payload), "utf8");
  return cryptoSign(null, bytes, privateKey).toString("base64");
}

export function verifyPayload(publicKey, payload, signature) {
  try {
    const bytes = Buffer.from(stable(payload), "utf8");
    return cryptoVerify(
      null,
      bytes,
      asKey(publicKey),
      Buffer.from(String(signature || ""), "base64"),
    );
  } catch {
    return false;
  }
}

export function merkleRoot(leaves = []) {
  if (!leaves.length) return sha256("");
  let layer = leaves.map((leaf) => sha256(typeof leaf === "string" ? leaf : stable(leaf)));
  while (layer.length > 1) {
    if (layer.length % 2 === 1) layer = layer.concat(layer.at(-1));
    const next = [];
    for (let i = 0; i < layer.length; i += 2) {
      next.push(sha256(layer[i] + layer[i + 1]));
    }
    layer = next;
  }
  return layer[0];
}

const STATE = {
  isolated: false,
  revocations: [],
  epochs: [],
  leases: [],
  nonces: new Set(),
};

export function resetLease() {
  STATE.isolated = false;
  STATE.revocations = [];
  STATE.epochs = [];
  STATE.leases = [];
  STATE.nonces = new Set();
}

export function isIsolated() {
  return STATE.isolated === true;
}

export function epochs() {
  return STATE.epochs.slice();
}

export function leases() {
  return STATE.leases.slice();
}

export function revocations() {
  return STATE.revocations.slice();
}

function leaseBody(raw) {
  const loss = Number(raw.loss_db_max);
  const fidelity = Number(raw.fidelity_min);
  return {
    v: LEASE_VERSION,
    canal: CANAL,
    plane: "data",
    project: String(raw.project || "famille").toLowerCase(),
    from: String(raw.from || "").toLowerCase() || null,
    to: String(raw.to || "").toLowerCase() || null,
    certificate: clip(raw.certificate, 400),
    loss_db_max: Number.isFinite(loss) ? loss : 0.3,
    fidelity_min: Number.isFinite(fidelity) ? fidelity : 0.99,
    ts: isoTs(raw.ts),
    live: false,
  };
}

/** Sign a classical fiber lease. Not a photon. Unsigned is not a proof. */
export function proveLease(input = {}, keys) {
  const raw = input && typeof input === "object" ? input : {};
  if (raw.photonic || raw.qubit || raw.qkd || raw.qrng || raw.photon) {
    return fail("PHOTONIC_ON_CONTROL", "no raw quantum data on the control plane");
  }
  if (!keys || !keys.privateKey || !keys.publicKey) {
    return fail("LEASE_KEY", "proof-of-lease needs an ephemeral Ed25519 pair");
  }
  const body = leaseBody(raw);
  if (!body.certificate) return fail("LEASE_CLASSICAL", "optical lease needs a classical certificate");
  const signature = signPayload(keys.privateKey, body);
  const lease = Object.freeze({
    ...body,
    signature,
    publicKey: publicPem(keys),
    sha256: sha256(stable(body)),
  });
  if (!verifyPayload(keys.publicKey, body, signature)) {
    return fail("LEASE_SIGN", "proof-of-lease failed to verify");
  }
  STATE.leases.push(lease);
  return { ok: true, lease };
}

export function verifyLease(lease) {
  if (!lease || !lease.signature) return fail("LEASE_UNSIGNED", "unsigned lease is not a proof");
  const { signature, publicKey, sha256: hash, ...body } = lease;
  if (!publicKey) return fail("LEASE_KEY", "no public key");
  if (hash && hash !== sha256(stable(body))) {
    return fail("LEASE_TAMPER", "lease body does not match sha256");
  }
  if (!verifyPayload(publicKey, body, signature)) {
    return fail("LEASE_FORGED", "proof-of-lease signature rejected");
  }
  return { ok: true, lease };
}

export function closeEpoch(keys, extraLeaves = []) {
  if (!keys || !keys.privateKey) return fail("LEASE_KEY", "epoch needs an Ed25519 pair");
  const prev = STATE.epochs.at(-1);
  const prevRoot = prev ? prev.root : sha256("genesis");
  const prevSignature = prev ? prev.signature : "genesis";
  const leaves = [
    ...STATE.leases.map((l) => l.sha256),
    ...STATE.revocations.map((r) => r.sha256),
    ...extraLeaves,
  ];
  const root = merkleRoot(leaves.length ? leaves : [prevRoot]);
  const body = {
    n: STATE.epochs.length,
    prevRoot,
    prevSignature,
    root,
    leaves,
    ts: new Date().toISOString(),
  };
  const signature = signPayload(keys.privateKey, body);
  const epoch = Object.freeze({
    ...body,
    signature,
    publicKey: publicPem(keys),
    sha256: sha256(stable(body)),
  });
  STATE.epochs.push(epoch);
  return { ok: true, epoch };
}

export function verifyChain(chain = STATE.epochs) {
  let prevRoot = sha256("genesis");
  let i = 0;
  for (const epoch of chain) {
    if (!epoch) return fail("EPOCH_MISSING", "broken epoch");
    const { signature, publicKey, sha256: hash, ...body } = epoch;
    if (hash && hash !== sha256(stable(body))) return fail("EPOCH_TAMPER", "epoch body does not match sha256");
    if (body.prevRoot !== prevRoot) return fail("EPOCH_REPLAY", "prevRoot does not chain");
    const expectSig = i === 0 ? "genesis" : chain[i - 1].signature;
    if (body.prevSignature !== expectSig) return fail("EPOCH_REPLAY", "prevSignature does not chain");
    if (merkleRoot(body.leaves.length ? body.leaves : [body.prevRoot]) !== body.root) {
      return fail("EPOCH_ROOT", "merkle root mismatch");
    }
    if (!verifyPayload(publicKey, body, signature)) {
      return fail("EPOCH_FORGED", "epoch signature rejected");
    }
    prevRoot = body.root;
    i += 1;
  }
  return { ok: true, length: chain.length, tip: chain.at(-1)?.root || prevRoot };
}

export function isolate(reason, keys) {
  STATE.isolated = true;
  const body = {
    type: "revocation",
    reason: clip(reason, 400) || "watchdog",
    ts: new Date().toISOString(),
    presence: "CHANNEL NOT PRESENT",
    live: false,
  };
  let revocation = { ...body, sha256: sha256(stable(body)) };
  if (keys && keys.privateKey) {
    revocation = {
      ...body,
      signature: signPayload(keys.privateKey, body),
      publicKey: publicPem(keys),
      sha256: sha256(stable(body)),
    };
  }
  revocation = Object.freeze(revocation);
  STATE.revocations.push(revocation);
  return {
    ok: true,
    isolated: true,
    presence: "CHANNEL_NOT_PRESENT",
    connected: false,
    live: false,
    revocation,
  };
}

/** No automatic resume. Carl only. */
export function resetIsolation(actor) {
  if (String(actor || "").toLowerCase() !== OWNER_ACTOR) {
    return fail("HUMAN_ONLY", "only Carl resets the kill-switch");
  }
  STATE.isolated = false;
  return { ok: true, isolated: false, actor: OWNER_ACTOR };
}

/**
 * Watchdog. Any anomaly isolates. No auto-resume.
 * measured_loss / measured_fidelity are classical readings, not photons.
 */
export function watchdog(opts = {}) {
  if (STATE.isolated) {
    return {
      ok: true,
      isolated: true,
      presence: "CHANNEL_NOT_PRESENT",
      reason: "already isolated",
    };
  }
  const chain = verifyChain();
  if (!chain.ok) return isolate(`merkle ${chain.code}`, opts.keys);
  for (const lease of STATE.leases) {
    const v = verifyLease(lease);
    if (!v.ok) return isolate(`lease ${v.code}`, opts.keys);
    const loss = Number(opts.measured_loss);
    const fidelity = Number(opts.measured_fidelity);
    if (Number.isFinite(loss) && loss > lease.loss_db_max) {
      return isolate("decoherence loss above lease", opts.keys);
    }
    if (Number.isFinite(fidelity) && fidelity < lease.fidelity_min) {
      return isolate("fidelity below lease", opts.keys);
    }
  }
  if (opts.corrupt === true) return isolate("corruption", opts.keys);
  return {
    ok: true,
    isolated: false,
    presence: STATE.leases.length ? "DECLARED" : "CHANNEL_NOT_PRESENT",
    chain,
  };
}

/** Optical canal after kill-switch / unsigned lease: never CONNECTED. */
export function opticalCanal(lease, opts = {}) {
  if (STATE.isolated) {
    return {
      ok: true,
      canal: CANAL,
      presence: "CHANNEL_NOT_PRESENT",
      connected: false,
      live: false,
      reason: "kill-switch",
    };
  }
  if (!lease) {
    return {
      ok: true,
      canal: CANAL,
      presence: "CHANNEL_NOT_PRESENT",
      connected: false,
      live: false,
      reason: "no lease",
    };
  }
  const proof = verifyLease(lease);
  if (!proof.ok) {
    return {
      ok: true,
      canal: CANAL,
      presence: "CHANNEL_NOT_PRESENT",
      connected: false,
      live: false,
      reason: proof.error,
    };
  }
  const claim = String(opts.claim || "").toUpperCase().replace(/ /g, "_");
  if (claim === "LIVE_VERIFIED" || claim === "LIVE") {
    return fail("LIVE_NOT_CARL", "LIVE VERIFIED is Carl only");
  }
  if ((claim === "CONNECTED" || claim === "ACTIVE") && opts.fiber !== true) {
    return fail("CLAIMED_CHANNEL", "OPTICAL_QUANTUM CONNECTED requires a real fiber");
  }
  if (opts.fiber === true && (opts.secret === true || opts.canal === true)) {
    return {
      ok: true,
      canal: CANAL,
      presence: "CONNECTED",
      connected: true,
      live: false,
      reason: "signed lease + fiber attested by caller",
      lease,
    };
  }
  return {
    ok: true,
    canal: CANAL,
    presence: "CHANNEL_NOT_PRESENT",
    connected: false,
    live: false,
    reason: "DECLARED — optical data plane off this Git",
    lease,
  };
}

export const SKEW_MS = 5 * 60 * 1000;

function parseTs(ts) {
  const t = Date.parse(String(ts || ""));
  return Number.isFinite(t) ? t : NaN;
}

/** Authenticated control-plane envelope. Strict ISO ts + nonce. Replay is refused. */
export function wrapEnvelope(payload, keys, opts = {}) {
  if (!keys || !keys.privateKey) return fail("LEASE_KEY", "envelope needs an Ed25519 pair");
  if (payload && (payload.photonic || payload.qubit || payload.qkd || payload.photon)) {
    return fail("PHOTONIC_ON_CONTROL", "no raw quantum data on the control plane");
  }
  const ts = isoTs(opts.ts);
  const nonce = clip(opts.nonce, 64) || sha256(`${ts}:${Math.random().toString(36)}`);
  const body = {
    v: "envelope.v0",
    canal: "CLASSICAL",
    plane: "control",
    nonce,
    ts,
    payload,
  };
  const signature = signPayload(keys.privateKey, body);
  const envelope = Object.freeze({
    ...body,
    signature,
    publicKey: publicPem(keys),
    sha256: sha256(stable(body)),
  });
  return { ok: true, envelope };
}

export function openEnvelope(envelope, opts = {}) {
  if (!envelope || !envelope.signature) return fail("ENVELOPE_UNSIGNED", "unsigned envelope");
  const { signature, publicKey, sha256: hash, ...body } = envelope;
  if (hash && hash !== sha256(stable(body))) return fail("ENVELOPE_TAMPER", "envelope body does not match sha256");
  if (!verifyPayload(publicKey, body, signature)) return fail("ENVELOPE_FORGED", "envelope signature rejected");
  const t = parseTs(body.ts);
  if (!Number.isFinite(t)) return fail("ENVELOPE_TS", "strict ISO-8601 timestamp required");
  const now = typeof opts.now === "number" && Number.isFinite(opts.now)
    ? opts.now
    : parseTs(opts.now) || Date.now();
  if (Math.abs(now - t) > SKEW_MS) return fail("ENVELOPE_SKEW", "timestamp outside replay window");
  if (STATE.nonces.has(body.nonce)) return fail("ENVELOPE_REPLAY", "nonce already seen");
  STATE.nonces.add(body.nonce);
  return { ok: true, envelope, payload: body.payload };
}
