/**
 * Sovereign meta-kernel — OS of collective cognition on this forge.
 * Native node:crypto only. No cloud. No wrangler. No photon on Git.
 * Carl Laliberté is the only merge authority. No auto-resume.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { OWNER_ACTOR, lookup } from "./flux.mjs";
import {
  closeEpoch,
  isIsolated,
  merkleRoot,
  newKeyPair,
  openEnvelope,
  opticalCanal,
  proveLease,
  resetIsolation,
  resetLease,
  sha256,
  verifyChain,
  watchdog,
  wrapEnvelope,
} from "./lease.mjs";

export const KERNEL_VERSION = "kernel.v0";
export const HUMAN = OWNER_ACTOR;
export const RING = 1000;

/** Posts on the existing roster. Not a mesh fork. Not CONNECTED_PERMANENT. */
export const POSTS = Object.freeze([
  { id: "grok", post: "build" },
  { id: "sonnet", post: "architecture" },
  { id: "chatgpt", post: "synthesis" },
  { id: "deepseek", post: "merkle" },
  { id: "gemini", post: "pilot" },
]);

function fail(code, error) {
  return { ok: false, code, error };
}

const MESH = {
  gateway: true,
  buffer: [],
  disconnected: new Set(),
  weights: Object.fromEntries(POSTS.map((p) => [p.id, 1])),
  logs: [],
  integrity: "STABLE",
};

export function resetKernel() {
  MESH.gateway = true;
  MESH.buffer = [];
  MESH.disconnected = new Set();
  MESH.weights = Object.fromEntries(POSTS.map((p) => [p.id, 1]));
  MESH.logs = [];
  MESH.integrity = "STABLE";
  resetLease();
}

function isoNow() {
  return new Date().toISOString();
}

function logTelemetry(module, message) {
  MESH.logs.push({ ts: isoNow(), module, message: String(message || "").slice(0, 240) });
  if (MESH.logs.length > 200) MESH.logs.shift();
}

const FORBIDDEN_PKGS = Object.freeze([
  "wrangler",
  "ethers",
  "web3",
  "bitcoinjs-lib",
  "@cloudflare/workers-types",
]);

const SECRET_RE =
  /(sk-ant-[A-Za-z0-9_-]{16,}|sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|xai-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/g;

const SKIP_DIR = new Set([".git", "node_modules", ".ots-anchor", "coverage"]);

function walk(root, dir, out) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP_DIR.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(root, p, out);
    else out.push(p);
  }
}

function pkgForbidden(root) {
  try {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
    const names = [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.devDependencies || {}),
    ];
    return names.filter((n) => FORBIDDEN_PKGS.includes(n) || n.startsWith("web3-"));
  } catch {
    return [];
  }
}

/** Static inspection. Forbidden deps + live secret fingerprints. Names of env vars are not secrets. */
export function inspectForge(root) {
  const hits = [];
  const pkgs = pkgForbidden(root);
  for (const n of pkgs) hits.push({ kind: "dependency", file: "package.json", detail: n });
  const files = [];
  walk(root, root, files);
  for (const file of files) {
    if (!/\.(js|mjs|cjs|json|yml|yaml|md|toml)$/.test(file)) continue;
    let text = "";
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    const rel = relative(root, file).replace(/\\/g, "/");
    SECRET_RE.lastIndex = 0;
    const m = text.match(SECRET_RE);
    if (m) {
      for (const token of m) {
        if (/PRIVATE KEY/.test(token) && /test\//.test(rel)) continue;
        hits.push({ kind: "secret", file: rel, detail: token.slice(0, 12) + "…" });
      }
    }
  }
  return {
    ok: hits.length === 0,
    hits,
    forbidden: pkgs,
    live: false,
    note: "CHANNEL NOT PRESENT is the optical default. Carl merges.",
  };
}

export function neurons() {
  return POSTS.map(({ id, post }) => {
    const agent = lookup(id);
    const off = MESH.disconnected.has(id);
    return {
      id,
      post,
      role: agent && agent.specialty ? agent.specialty : post,
      declared: Boolean(agent),
      presence: off ? "BLOCKED" : "DECLARED",
      connected: false,
      live: false,
      locked: true,
      weight: MESH.weights[id] || 1,
    };
  });
}

/** Universal inbound. Gateway closes on kill-switch. CONNECTED_PERMANENT is not a canal. */
export function inbound(payload) {
  if (isIsolated() || MESH.gateway === false) {
    return fail("GATEWAY", "inbound locked by kill-switch");
  }
  const claim = String(
    (payload && (payload.claim || payload.status || payload.presence)) || "",
  )
    .toUpperCase()
    .replace(/ /g, "_");
  if (claim === "CONNECTED_PERMANENT" || claim === "CONNECTED") {
    return fail("CLAIMED_CHANNEL", "CONNECTED_PERMANENT is not a canal");
  }
  if (payload && (payload.photonic || payload.qubit || payload.qkd || payload.photon)) {
    return fail("PHOTONIC_ON_CONTROL", "no raw quantum data on the control plane");
  }
  MESH.buffer.push({ payload, ts: isoNow() });
  if (MESH.buffer.length > RING) MESH.buffer.shift();
  logTelemetry("STATE_BUS", "inbound queued");
  return { ok: true, size: MESH.buffer.length, gateway: true };
}

export const stateBus = inbound;

export function disconnect(id, requester) {
  if (String(requester || "").toLowerCase() !== HUMAN) {
    return fail("HUMAN_ONLY", "no neuron disconnects itself");
  }
  const agent = lookup(id);
  if (!agent) return fail("UNKNOWN_AGENT", String(id || ""));
  MESH.disconnected.add(id);
  logTelemetry("GOVERNANCE", `${id} disconnected by ${HUMAN}`);
  return { ok: true, id, presence: "BLOCKED", by: HUMAN, connected: false };
}

/** Routing weights only. Not presence. Not truth. Capped. Isolated posts do not tune. */
export function tune() {
  for (const { id } of POSTS) {
    if (MESH.disconnected.has(id)) continue;
    const next = Math.round((MESH.weights[id] || 1) * 1.01 * 10000) / 10000;
    MESH.weights[id] = Math.min(next, 2);
  }
  logTelemetry("SELF_TUNING", "weights capped at 2, routing only");
  return { ok: true, weights: { ...MESH.weights }, live: false };
}

/** Carl only. Presence stays DECLARED/BLOCKED, never CONNECTED_PERMANENT. */
export function dashboard(requester) {
  if (String(requester || "").toLowerCase() !== HUMAN) {
    return fail("HUMAN_ONLY", "dashboard is Carl only");
  }
  return {
    ok: true,
    sovereign: HUMAN,
    integrity: isIsolated() ? "LOCKDOWN" : MESH.integrity,
    gateway: MESH.gateway && !isIsolated(),
    neurons: neurons(),
    weights: { ...MESH.weights },
    buffer: MESH.buffer.length,
    logs: MESH.logs.slice(-10),
    live: false,
    optical: "CHANNEL_NOT_PRESENT",
  };
}

/**
 * Classical pulse across declared posts. Not a photon. Not CONNECTED_PERMANENT.
 * Optical canals stay CHANNEL NOT PRESENT unless a signed lease + fiber exist.
 */
export function pulse(signal = {}, keys) {
  const inb = inbound(signal);
  if (!inb.ok) return inb;
  const wd = watchdog({ keys });
  if (wd.isolated) MESH.gateway = false;
  const ref = sha256(JSON.stringify(signal || {})).slice(0, 16);
  const ts = isoNow();
  const results = {};
  for (const n of neurons()) {
    results[n.id] = {
      id: n.id,
      post: n.post,
      presence: n.presence,
      processed: n.presence === "DECLARED",
      connected: false,
      live: false,
      weight: n.weight,
      ts,
      payload_ref: ref,
    };
  }
  tune();
  const leaves = MESH.buffer.map((b) => sha256(JSON.stringify(b)));
  const sealed = keys ? closeEpoch(keys, leaves) : { ok: true, root: merkleRoot(leaves) };
  return {
    ok: true,
    results,
    watchdog: wd,
    epoch: sealed,
    optical: opticalCanal(null),
    live: false,
  };
}

/**
 * End-to-end kernel cycle. Unsigned optical → NOT PRESENT.
 * Signed lease + envelope. Epoch chain. Tamper → kill-switch. Carl resets.
 */
export function runKernel(opts = {}) {
  resetKernel();
  const keys = opts.keys || newKeyPair();
  const inspect = inspectForge(opts.root || process.cwd());
  const unsigned = opticalCanal(null);
  const proved = proveLease(
    {
      certificate: opts.certificate || "classical-lease",
      project: opts.project || "famille",
      ts: opts.ts,
    },
    keys,
  );
  const wrapped = proved.ok ? wrapEnvelope(proved.lease, keys, { ts: opts.ts }) : proved;
  const opened = wrapped.ok ? openEnvelope(wrapped.envelope, { now: opts.now }) : wrapped;
  const replay = wrapped.ok ? openEnvelope(wrapped.envelope, { now: opts.now }) : wrapped;
  if (proved.ok) closeEpoch(keys);
  closeEpoch(keys);
  const chain = verifyChain();
  const pulseRun = pulse({ hello: "sync" }, keys);
  const trip = watchdog({ measured_loss: 9, keys });
  const auto = resetIsolation("kernel");
  const carl = resetIsolation(HUMAN);
  return {
    ok: unsigned.presence === "CHANNEL_NOT_PRESENT" && trip.isolated === true && carl.ok === true,
    version: KERNEL_VERSION,
    human: HUMAN,
    inspect,
    unsigned,
    proved,
    opened,
    replay,
    chain,
    trip,
    pulse: pulseRun,
    auto,
    carl,
    live: false,
  };
}
