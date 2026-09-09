/**
 * Sovereign meta-kernel — OS of collective cognition on this forge.
 * Native node:crypto only. No cloud. No wrangler. No photon on Git.
 * Carl Laliberté is the only merge authority. No auto-resume.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { OWNER_ACTOR } from "./flux.mjs";
import {
  closeEpoch,
  newKeyPair,
  openEnvelope,
  opticalCanal,
  proveLease,
  resetIsolation,
  resetLease,
  verifyChain,
  watchdog,
  wrapEnvelope,
} from "./lease.mjs";

export const KERNEL_VERSION = "kernel.v0";
export const HUMAN = OWNER_ACTOR;

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

/**
 * End-to-end kernel cycle. Unsigned optical → NOT PRESENT.
 * Signed lease + envelope. Epoch chain. Tamper → kill-switch. Carl resets.
 */
export function runKernel(opts = {}) {
  resetLease();
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
    auto,
    carl,
    live: false,
  };
}
