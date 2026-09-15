#!/usr/bin/env node
/**
 * Dated xAI surface monitor for the Acorn kernel.
 * Does not call the live API unless explicitly asked.
 * Missing XAI_API_KEY = CONFIGURATION_ERROR, not “xAI absent”.
 * Never prints secret values. auto_merge=false. live=false.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { controlState } from "../.github/swarm/system-breaker.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function loadCatalog(root = ROOT) {
  return JSON.parse(readFileSync(join(root, "schema/xai-surface.json"), "utf8"));
}

export function keyPresent(env = process.env) {
  const raw = env.XAI_API_KEY;
  return typeof raw === "string" && raw.trim().length > 0;
}

export function catalogExpired(catalog, now = new Date()) {
  const horizon = Date.parse(`${catalog.horizon}T23:59:59Z`);
  return Number.isFinite(horizon) ? now.getTime() > horizon : true;
}

export function inspectSurface(surface, env = process.env) {
  const breaker = controlState(env);
  const hasKey = keyPresent(env);
  const blocked = breaker.mode === "OFF";
  let state = "DECLARED";
  if (surface.runtime === "forbidden" || surface.status === "not-canal") {
    state = "OUT_OF_RUNTIME";
  } else if (surface.status === "retired") {
    state = "RETIRED";
  } else if (surface.status === "announced") {
    state = "ANNOUNCED_NO_SLUG";
  } else if (blocked) {
    state = "BLOCKED_BY_BREAKER";
  } else if (surface.slug && !hasKey) {
    state = "CONFIGURATION_ERROR";
  } else if (surface.slug && hasKey) {
    state = "CONFIGURED";
  } else {
    state = "CHANNEL_NOT_PRESENT";
  }
  return {
    id: surface.id,
    roster_id: surface.roster_id,
    slug: surface.slug,
    status: surface.status,
    runtime: surface.runtime,
    state,
    key_present: hasKey,
    live: false,
    auto_merge: false,
    api_call: "NOT_EXECUTED",
  };
}

export function monitor(env = process.env, now = new Date()) {
  const catalog = loadCatalog();
  const rows = catalog.surfaces.map((surface) => inspectSurface(surface, env));
  const expired = catalogExpired(catalog, now);
  return {
    workflow: "xai-surface-monitor",
    purpose: "surveillance dated — not LIVE, not eternal truth",
    measured_on: catalog.measured_on,
    horizon: catalog.horizon,
    catalog_expired: expired,
    provider: catalog.provider,
    secret_name: catalog.secret,
    key_present: keyPresent(env),
    breaker: controlState(env),
    human_authority: "carl",
    auto_merge: false,
    live: false,
    production_write_allowed: false,
    kernel: catalog.kernel,
    rows,
    counts: {
      declared: rows.length,
      configured: rows.filter((r) => r.state === "CONFIGURED").length,
      configuration_error: rows.filter((r) => r.state === "CONFIGURATION_ERROR").length,
      out_of_runtime: rows.filter((r) => r.state === "OUT_OF_RUNTIME").length,
      announced: rows.filter((r) => r.state === "ANNOUNCED_NO_SLUG").length,
    },
    truth: {
      CATALOG_LOADED: true,
      LIVE_API_CALLED: false,
      KERNEL_REWRITE: false,
      ETERNAL_LABEL: false,
    },
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const report = monitor();
  console.log(JSON.stringify(report, null, 2));
}
