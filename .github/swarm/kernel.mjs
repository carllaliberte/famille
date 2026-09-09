/**
 * Sovereign meta-kernel — OS of collective cognition on this forge.
 * Native node:crypto only. No cloud. No wrangler. No photon on Git.
 * Carl Laliberté is the only merge authority. No auto-resume.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { OWNER_ACTOR, lookup } from "./flux.mjs";
import {
  closeEpoch,
  epochs,
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
  verifyLease,
  watchdog,
  wrapEnvelope,
} from "./lease.mjs";

export const KERNEL_VERSION = "kernel.v0";
export const HUMAN = OWNER_ACTOR;
export const RING = 1000;

/** Documentary manifest. status is presence, never 'active' for the optical bridge. */
export const MANIFEST = Object.freeze({
  identity: {
    name: "Sovereign Meta-Kernel",
    version: KERNEL_VERSION,
    maintainer: HUMAN,
  },
  modules: Object.freeze([
    { name: "quantum_bridge", presence: "CHANNEL_NOT_PRESENT", plane: "data" },
    { name: "cryptographic_lease", presence: "DECLARED", plane: "control" },
    { name: "logical_immune_system", presence: "DECLARED", plane: "control" },
    { name: "immutable_epoch_ledger", presence: "DECLARED", plane: "control" },
  ]),
  auto_merge: false,
  live: false,
});

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

function isCarl(requester) {
  const n = String(requester || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");
  return n === "carllaliberte" || n === HUMAN;
}

const MESH = {
  gateway: true,
  buffer: [],
  disconnected: new Set(),
  weights: Object.fromEntries(POSTS.map((p) => [p.id, 1])),
  logs: [],
  integrity: "STABLE",
  locked: false,
  horizon: [],
  worm: [],
};

export function resetKernel() {
  MESH.gateway = true;
  MESH.buffer = [];
  MESH.disconnected = new Set();
  MESH.weights = Object.fromEntries(POSTS.map((p) => [p.id, 1]));
  MESH.logs = [];
  MESH.integrity = "STABLE";
  MESH.locked = false;
  MESH.horizon = [];
  MESH.worm = [];
  resetLease();
}

function isoNow() {
  return new Date().toISOString();
}

function logTelemetry(module, message) {
  MESH.logs.push({ ts: isoNow(), module, message: String(message || "").slice(0, 240) });
  if (MESH.logs.length > 200) MESH.logs.shift();
  wormAppend({ module, message: String(message || "").slice(0, 240) });
}

export function wormAppend(payload) {
  const prev = MESH.worm.length ? MESH.worm[MESH.worm.length - 1] : null;
  const prevHash = prev ? prev.hash : sha256("genesis");
  const n = MESH.worm.length;
  const ts = isoNow();
  const body = { n, ts, prevHash, payload };
  const hash = sha256(JSON.stringify(body));
  const entry = { ...body, hash };
  MESH.worm.push(entry);
  return { ok: true, n, hash, prevHash };
}

export function verifyWorm(chain = MESH.worm) {
  let prevHash = sha256("genesis");
  let i = 0;
  for (const e of chain) {
    if (!e) return fail("WORM_BREAK", "missing entry");
    const { hash, ...body } = e;
    if (body.prevHash !== prevHash) return fail("WORM_BREAK", `prevHash at ${i}`);
    if (hash !== sha256(JSON.stringify(body))) return fail("WORM_BREAK", `hash at ${i}`);
    prevHash = hash;
    i += 1;
  }
  return { ok: true, n: chain.length, live: false };
}

export function wormChain() {
  return MESH.worm.map((e) => ({ ...e, payload: e.payload }));
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
  if (claim === "CONNECTED_PERMANENT" || claim === "CONNECTED" || claim === "CONVERGED") {
    return fail("CLAIMED_CHANNEL", "CONNECTED_PERMANENT is not a canal");
  }
  if (
    payload &&
    (payload.photonic ||
      payload.qubit ||
      payload.qkd ||
      payload.photon ||
      payload.entanglement ||
      payload.planck)
  ) {
    return fail("PHOTONIC_ON_CONTROL", "no raw quantum data on the control plane");
  }
  MESH.buffer.push({ payload, ts: isoNow() });
  if (MESH.buffer.length > RING) MESH.buffer.shift();
  logTelemetry("STATE_BUS", "inbound queued");
  return { ok: true, size: MESH.buffer.length, gateway: true };
}

/**
 * Reactive only. Never probes. Never strikes outbound.
 * + absorb refused inbound into the WORM (fuzz fuel)
 * − no outbound attack, no scan of foreign IA
 * does not forbid: LU, npm test, Carl merge
 */
export function absorb(payload) {
  const r = inbound(payload);
  if (r.ok) return { ok: true, absorbed: false, outbound: false, attack: false };
  wormAppend({ kind: "harness", code: r.code, inbound: true });
  return {
    ok: true,
    absorbed: true,
    outbound: false,
    attack: false,
    code: r.code,
    live: false,
  };
}

export function heal() {
  resetKernel();
  return {
    ok: true,
    restored: "resetKernel",
    invulnerable: false,
    live: false,
    auto_merge: false,
  };
}

export const stateBus = inbound;

export function disconnect(id, requester) {
  if (!isCarl(requester)) {
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
  if (!isCarl(requester)) {
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
    epoch: epochs().length,
    logs: MESH.logs.slice(-10),
    live: false,
    optical: "CHANNEL_NOT_PRESENT",
    bridge: MANIFEST.modules[0],
    auto_merge: false,
  };
}

/**
 * Carl issues a classical invitation. Not mTLS hardware. Not a photon.
 * Optical bridge stays CHANNEL NOT PRESENT.
 */
export function invite(to, keys, requester) {
  if (!isCarl(requester)) return fail("HUMAN_ONLY", "only Carl invites");
  if (!keys || !keys.privateKey) return fail("LEASE_KEY", "invite needs Ed25519");
  const target = String(to || "").toLowerCase();
  if (!/^[a-z][a-z0-9-]{1,24}$/.test(target)) return fail("BAD_TO", "invite to must match mesh from/to");
  const wrapped = wrapEnvelope(
    {
      type: "invite",
      to: target,
      bridge: "CHANNEL_NOT_PRESENT",
      auto_merge: false,
    },
    keys,
  );
  if (!wrapped.ok) return wrapped;
  logTelemetry("BRIDGE", `invite ${target}`);
  return { ok: true, invite: wrapped.envelope, to: target, live: false };
}

/**
 * External handshake: open invite + anti-replay envelope + optional signed lease.
 * Classical Ed25519 only. Not hardware mTLS. Never mints CONNECTED.
 */
export function handshake(opts = {}) {
  if (opts.mtls === true || opts.tls === true || opts.fiber === true) {
    return fail("CLAIMED_CHANNEL", "handshake is not hardware mTLS");
  }
  const opened = openEnvelope(opts.invite, { now: opts.now });
  if (!opened.ok) return opened;
  const body = opened.payload || {};
  if (body.type !== "invite") return fail("INVITE", "not an invitation");
  if (opts.to && String(opts.to).toLowerCase() !== body.to) {
    return fail("INVITE_TO", "invitation is for a different node");
  }
  let lease = null;
  if (opts.lease) {
    const v = verifyLease(opts.lease);
    if (!v.ok) return v;
    lease = opts.lease;
  }
  const optical = opticalCanal(lease);
  if (optical.presence === "CONNECTED" || optical.connected === true) {
    return fail("CLAIMED_CHANNEL", "handshake does not mint CONNECTED");
  }
  if (opts.payload) {
    const queued = inbound(opts.payload);
    if (!queued.ok) return queued;
  }
  logTelemetry("BRIDGE", `handshake ${body.to} optical=${optical.presence}`);
  return {
    ok: true,
    to: body.to,
    optical: "CHANNEL_NOT_PRESENT",
    connected: false,
    live: false,
    lease: Boolean(lease),
    mtls: false,
    auto_merge: false,
  };
}

const EVIDENCE_TYPES = new Set(["DIGITAL_SEAL_HASH", "CHAIN_OF_CUSTODY_LOG"]);

/** Heterogeneous evidence on the classical bus. Not a photon. Not LIVE. */
export function ingestEvidence(pkg = {}) {
  const raw = pkg && typeof pkg === "object" ? pkg : {};
  if (!clipId(raw.case_id)) return fail("EVIDENCE", "case_id required");
  if (!EVIDENCE_TYPES.has(String(raw.evidence_type || ""))) {
    return fail("EVIDENCE_TYPE", "unknown evidence_type");
  }
  if (!String(raw.payload_data || "").trim()) return fail("EVIDENCE", "payload_data required");
  const queued = inbound({
    case_id: String(raw.case_id),
    evidence_type: String(raw.evidence_type),
    payload_data: String(raw.payload_data).slice(0, 400),
    source_channel: String(raw.source_channel || "EXTERNAL_INBOUND_GATEWAY"),
  });
  if (!queued.ok) return queued;
  logTelemetry("VAULT", `${raw.evidence_type} ${raw.case_id}`);
  return { ok: true, case_id: raw.case_id, size: queued.size, live: false };
}

function clipId(id) {
  return String(id || "").trim();
}

/**
 * SQ-style vault cycle: ingest → pulse → merkle seal → tune → Carl dashboard.
 */
export function runVault(opts = {}) {
  resetKernel();
  const keys = opts.keys || newKeyPair();
  const packages = Array.isArray(opts.packages) ? opts.packages : [];
  const ingested = packages.map((p) => ingestEvidence(p));
  const wd = watchdog({ keys, corrupt: opts.anomaly === true });
  const wave = pulse({ case_id: packages[0] && packages[0].case_id, vault: true }, keys);
  const sealed = closeEpoch(keys);
  const weights = tune();
  const board = dashboard(opts.requester || HUMAN);
  return {
    ok: ingested.every((i) => i.ok) && wave.ok && sealed.ok && board.ok && wd.isolated !== true,
    ingested,
    watchdog: wd,
    pulse: wave,
    seal: sealed.ok ? sealed.epoch.root : null,
    epoch: sealed.ok ? sealed.epoch.n : null,
    weights: weights.weights,
    dashboard: board,
    live: false,
    optical: wave.optical,
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

export const ROTATE_EVERY = 300;

/** Phase 2 is scheduled. Not hardware. Not raft. Not LIVE. */
export const PHASE2 = Object.freeze([
  { name: "distributed_consensus_engine", presence: "CHANNEL_NOT_PRESENT", scheduled: true },
  { name: "hardware_secure_enclave", presence: "CHANNEL_NOT_PRESENT", scheduled: true },
  { name: "telemetry_auditor", presence: "DECLARED", scheduled: false },
]);

export function phase2() {
  return {
    ok: true,
    modules: PHASE2,
    auto_merge: false,
    live: false,
    optical: "CHANNEL_NOT_PRESENT",
    enclave: "CHANNEL_NOT_PRESENT",
    pqc: "CHANNEL_NOT_PRESENT",
  };
}

export function enclaveStatus() {
  return {
    ok: true,
    presence: "CHANNEL_NOT_PRESENT",
    connected: false,
    live: false,
    reason: "no TEE on this Git",
  };
}

/** Carl only. A foreign merkle tip does not become ours without him. */
export function acceptForeignTip(tip, requester) {
  if (!isCarl(requester)) return fail("HUMAN_ONLY", "consensus tip needs Carl");
  if (!tip || !/^[0-9a-f]{64}$/.test(String(tip))) return fail("TIP", "need a sha256 tip");
  logTelemetry("CONSENSUS", "foreign tip accepted by Carl");
  return { ok: true, tip, by: HUMAN, live: false };
}

/** Handshake ages out every 300 epochs. Optical stays CHANNEL NOT PRESENT. */
export function rotateHandshake(n) {
  const epoch = Number.isFinite(n) ? n : epochs().length;
  const due = epoch > 0 && epoch % ROTATE_EVERY === 0;
  return {
    ok: true,
    epoch,
    rotate: due,
    optical: "CHANNEL_NOT_PRESENT",
    live: false,
    note: due ? "invite again — Carl only" : "invite still valid",
  };
}

export const SINGULARITY = Object.freeze([
  { id: "cognition", presence: "CHANNEL_NOT_PRESENT" },
  { id: "optical", presence: "CHANNEL_NOT_PRESENT" },
  { id: "merkle", presence: "DECLARED" },
  { id: "enclave", presence: "CHANNEL_NOT_PRESENT" },
]);

/** Layers are not 'converged'. Merkle is a chain, not truth. No copyright bypass. */
export function singularity() {
  return {
    ok: true,
    layers: SINGULARITY,
    auto_merge: false,
    live: false,
    truth: false,
    copyright_bypass: false,
    heal: { auto_push: false, halt_on_fail: true, human: HUMAN },
  };
}

export function healPolicy() {
  return {
    ok: true,
    auto_push: false,
    auto_merge: false,
    halt_on_fail: true,
    human: HUMAN,
    live: false,
  };
}

/**
 * Seal a swarm run on the classical bus. Ephemeral key is enough for this process.
 * Does not post. Does not merge. Optical stays CHANNEL NOT PRESENT.
 */
export function sealSwarm(report = {}, keys) {
  const k = keys || newKeyPair();
  const queued = inbound({
    kind: "swarm",
    live: false,
    ids: report.ids || [],
    skip: (report.skip || []).map((s) => s.id || s),
  });
  if (!queued.ok) return queued;
  const wave = pulse({ swarm: true, ids: report.ids || [] }, k);
  const root = wave.epoch && wave.epoch.epoch ? wave.epoch.epoch.root : "";
  return {
    ok: wave.ok === true,
    root,
    optical: "CHANNEL_NOT_PRESENT",
    live: false,
    auto_merge: false,
    posts: POSTS.map((p) => p.id),
  };
}

export function kernelFooter(seal = {}) {
  const short = String(seal.root || "").slice(0, 12);
  const epoch = short ? `epoch \`${short}\` · ` : "";
  return `kernel.v0 · ${epoch}CHANNEL NOT PRESENT · theory CLOSED · auto_merge false`;
}

/** Optical theory is finished here. No QPU. No 100% coherence. Fiber + Carl, or HOLD. */
export function closeQuantum() {
  return {
    ok: true,
    theory: "CLOSED",
    optical: "CHANNEL_NOT_PRESENT",
    qpu: false,
    photon_on_git: false,
    entanglement: false,
    live: false,
    auto_merge: false,
  };
}

const CHAIRS = Object.freeze({
  grok: "build",
  sonnet: "architecture",
  chatgpt: "synthèse",
  deepseek: "merkle",
  gemini: "pilotage",
});

/** Five chairs, empty optical seat, Carl's gavel. Not CONNECTED. Not LIVE. */
export function consilium(opts = {}) {
  if (opts.reset !== false) resetKernel();
  const keys = opts.keys || newKeyPair();
  const sealed = sealSwarm({ ids: POSTS.map((p) => p.id) }, keys);
  const rows = neurons()
    .map((n) => {
      const chair = String(CHAIRS[n.id] || n.post).padEnd(14);
      const id = n.id.padEnd(10);
      return `  ${id}${chair}${n.presence}`;
    })
    .join("\n");
  const epoch = String(sealed.root || "").slice(0, 12);
  const lines = [
    "FAMILLE  kernel.v0",
    "----------------------------------------",
    "  siège     poste         présence",
    rows,
    "  optique                 CHANNEL NOT PRESENT",
    "  théorie                 CLOSED",
    "  vérité                  non  (Merkle = chaîne)",
    "  merge                   Carl seulement",
    "----------------------------------------",
    `  epoch ${epoch || "none"}`,
    "  auto_merge false",
  ];
  return {
    ok: true,
    text: lines.join("\n"),
    optical: "CHANNEL_NOT_PRESENT",
    live: false,
    theory: "CLOSED",
    epoch,
  };
}

const isMain =
  Boolean(process.argv[1]) &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const board = consilium();
  console.log(board.text);
}

/** Carl locks the doctrine. Not a cloud deploy. Not CONVERGED. Not a copyright bypass. */
export function finalDeploy(requester) {
  if (!isCarl(requester)) return fail("HUMAN_ONLY", "final lock is Carl only");
  MESH.locked = true;
  logTelemetry("LOCK", "doctrine locked by Carl");
  return {
    ok: true,
    deployed: false,
    wrangler: false,
    locked: true,
    converged: false,
    copyright_bypass: false,
    optical: "CHANNEL_NOT_PRESENT",
    theory: "CLOSED",
    auto_merge: false,
    live: false,
    human: HUMAN,
  };
}

export function isLocked() {
  return MESH.locked === true;
}

/** Honest stream. ISO ts. Real merkle if an epoch exists. No 100% coherence. */
export function telemetryFeed() {
  const q = closeQuantum();
  const chain = epochs();
  const last = chain.length ? chain[chain.length - 1] : null;
  return {
    ok: true,
    ts: isoNow(),
    coherence: false,
    vectors: [
      { id: "synapse", presence: "DECLARED", infinite: false },
      { id: "optical", presence: q.optical, entangled: false },
      {
        id: "ledger",
        presence: "DECLARED",
        epoch: last ? last.n : 0,
        root: last ? last.root : null,
        truth: false,
      },
      { id: "enclave", presence: "CHANNEL_NOT_PRESENT" },
      { id: "chrono", presence: "CHANNEL_NOT_PRESENT", retro_causal: false },
      { id: "github_ci", presence: "DECLARED", auto_heal: false, halt_on_fail: true },
    ],
    auto_merge: false,
    live: false,
    theory: "CLOSED",
    locked: isLocked(),
  };
}

export const HORIZON_CAP = 8;

/** Finite queue. Carl enqueues. Nothing runs itself. Infinity is refused. */
export function enqueueHorizon(name, requester) {
  if (!isCarl(requester)) return fail("HUMAN_ONLY", "horizon queue is Carl only");
  const id = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 24);
  if (!id) return fail("HORIZON", "name required");
  if (id.includes("infinit") || id === "n-plus-inf") return fail("INFINITE", "no infinite vector");
  if (MESH.horizon.length >= HORIZON_CAP) return fail("HORIZON_CAP", `cap ${HORIZON_CAP}`);
  MESH.horizon.push({ id, ts: isoNow(), status: "PROPOSED" });
  logTelemetry("HORIZON", id);
  return { ok: true, queue: MESH.horizon.slice(), auto_merge: false, live: false };
}

export function expandOnce(requester) {
  if (!isCarl(requester)) return fail("HUMAN_ONLY", "expansion is Carl only");
  const next = MESH.horizon.find((v) => v.status === "PROPOSED");
  if (!next) return { ok: true, did: null, queue: MESH.horizon.slice(), live: false };
  next.status = "SEEN";
  return { ok: true, did: next.id, infinite: false, auto_merge: false, live: false };
}

export function horizon() {
  return {
    ok: true,
    cap: HORIZON_CAP,
    queue: MESH.horizon.slice(),
    infinite: false,
    auto_run: false,
    auto_merge: false,
    live: false,
  };
}
