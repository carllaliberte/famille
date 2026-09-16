#!/usr/bin/env node
/**
 * Free / optional connectors inventory.
 * File presence is DECLARED. A secret name is not AVAILABLE. LIVE is forbidden.
 * Cloudflare D1/KV/workflows stay UNAVAILABLE unless wrangler actually binds them.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FORBIDDEN_STATUS = new Set(["READY", "LIVE"]);

export function emptyCard(name) {
  return {
    name,
    status: "UNAVAILABLE",
    declared: true,
    measured: false,
    callable: false,
    live: false,
    auto_merge: false,
    authority: "carl",
    next_action: "HOLD_HUMAN",
  };
}

export function assertCard(card = {}) {
  if (card.live === true) throw new Error("LIVE_FORBIDDEN");
  if (FORBIDDEN_STATUS.has(String(card.status || ""))) throw new Error("STATUS_FORBIDDEN");
  if (card.status === "PASS" && card.measured !== true) throw new Error("PASS_REQUIRES_MEASUREMENT");
  return card;
}

export function readWrangler(root = ROOT) {
  const path = join(root, "canal/wrangler.toml");
  if (!existsSync(path)) return { exists: false, name: null, bindings: [] };
  const text = readFileSync(path, "utf8");
  const name = (text.match(/^\s*name\s*=\s*"([^"]+)"/m) || [])[1] || null;
  const bindings = [];
  if (/d1_databases/.test(text)) bindings.push("d1");
  if (/kv_namespaces/.test(text)) bindings.push("kv");
  if (/\[\[workflows\]\]/.test(text)) bindings.push("workflows");
  return { exists: true, name, bindings };
}

export function classifyEnv(env = process.env) {
  const present = (key) => String(env[key] || "").trim().length > 0;
  return {
    sentry_dsn: present("SENTRY_DSN"),
    drive_folder: present("GOOGLE_DRIVE_FOLDER_ID"),
    drive_token: present("GOOGLE_DRIVE_ACCESS_TOKEN") || present("GOOGLE_DRIVE_CREDENTIALS"),
  };
}

function card(name, extra = {}) {
  return assertCard({ ...emptyCard(name), ...extra, live: false, auto_merge: false, authority: "carl" });
}

export function staticInventory({ env = {}, wrangler = readWrangler(), github = null } = {}) {
  const keys = classifyEnv(env);
  const hasBinding = (name) => (wrangler.bindings || []).includes(name);
  const githubPass = github?.measured === true && github?.callable === true;
  return {
    CLOUDFLARE_D1: card("CLOUDFLARE_D1", { status: hasBinding("d1") ? "CONFIGURED" : "UNAVAILABLE" }),
    CLOUDFLARE_KV: card("CLOUDFLARE_KV", { status: hasBinding("kv") ? "CONFIGURED" : "UNAVAILABLE" }),
    CLOUDFLARE_WORKFLOWS: card("CLOUDFLARE_WORKFLOWS", { status: hasBinding("workflows") ? "CONFIGURED" : "UNAVAILABLE" }),
    CLOUDFLARE_WORKERS: card("CLOUDFLARE_WORKERS", { status: wrangler.exists ? "DECLARED" : "UNAVAILABLE", next_action: "measure preview" }),
    NEON: card("NEON", { status: "NOT_NEEDED" }),
    SUPABASE: card("SUPABASE", { status: "NOT_NEEDED" }),
    UPSTASH: card("UPSTASH", { status: "NOT_NEEDED" }),
    GOOGLE_DRIVE: card("GOOGLE_DRIVE", { status: keys.drive_token ? "CONFIGURED" : "HOLD_HUMAN" }),
    SENTRY: card("SENTRY", { status: keys.sentry_dsn ? "CONFIGURED" : "HOLD_HUMAN" }),
    GITHUB_ACTIONS: card("GITHUB_ACTIONS", {
      status: githubPass ? "PASS" : "DECLARED",
      measured: Boolean(githubPass),
      callable: Boolean(github?.callable),
      next_action: githubPass ? "reuse" : "HOLD_HUMAN",
    }),
  };
}

export function applyCloudflareMeasurement(inventory, probes = {}) {
  const next = { ...inventory };
  const juge = probes.critical_juge || {};
  const epsilon = probes.epsilon_zero || {};
  const vitrine = probes.vitrine_juge || {};
  const okJuge = juge.status === 200 && juge.json?.preview === true && juge.json?.receipt === false;
  const okLie = epsilon.status === 400 && /lie/i.test(JSON.stringify(epsilon.json || {}));
  const vitrineAbsent = !vitrine.status || vitrine.status === 404;
  if (okJuge && okLie && vitrineAbsent) {
    next.CLOUDFLARE_WORKERS = card("CLOUDFLARE_WORKERS", {
      status: "PASS",
      measured: true,
      callable: true,
      next_action: "wrangler deploy remains HOLD_HUMAN",
    });
  } else {
    next.CLOUDFLARE_WORKERS = card("CLOUDFLARE_WORKERS", {
      status: "FAIL",
      measured: true,
      callable: false,
      next_action: "repair preview measurement",
    });
  }
  return next;
}
