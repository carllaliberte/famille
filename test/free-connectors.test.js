import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyCloudflareMeasurement,
  assertCard,
  classifyEnv,
  emptyCard,
  readWrangler,
  staticInventory,
} from "../scripts/free-connectors.mjs";

const wranglerText = readFileSync("canal/wrangler.toml", "utf8");
const workflow = readFileSync(".github/workflows/github-drive-mirror.yml", "utf8");

test("wrangler.toml has no D1/KV/workflow bindings", () => {
  const w = readWrangler();
  assert.equal(w.exists, true);
  assert.equal(w.name, "acorn-juge");
  assert.deepEqual(w.bindings, []);
  assert.doesNotMatch(wranglerText, /d1_databases/);
  assert.doesNotMatch(wranglerText, /kv_namespaces/);
});

test("empty card cannot be PASS and cannot mint LIVE", () => {
  const card = emptyCard("SENTRY");
  assert.equal(card.live, false);
  assert.equal(card.auto_merge, false);
  assert.equal(card.authority, "carl");
  assert.equal(card.status, "UNAVAILABLE");
  assert.throws(() => assertCard({ ...card, status: "PASS", measured: false }), /PASS_REQUIRES_MEASUREMENT/);
  assert.throws(() => assertCard({ ...card, live: true }), /LIVE_FORBIDDEN/);
  assert.throws(() => assertCard({ ...card, status: "READY" }), /STATUS_FORBIDDEN/);
});

test("static inventory without secrets stays HOLD/UNAVAILABLE/NOT_NEEDED", () => {
  const inv = staticInventory({ env: {}, wrangler: { exists: true, name: "acorn-juge", bindings: [] } });
  assert.equal(inv.CLOUDFLARE_D1.status, "UNAVAILABLE");
  assert.equal(inv.CLOUDFLARE_KV.status, "UNAVAILABLE");
  assert.equal(inv.CLOUDFLARE_WORKFLOWS.status, "UNAVAILABLE");
  assert.equal(inv.NEON.status, "NOT_NEEDED");
  assert.equal(inv.SUPABASE.status, "NOT_NEEDED");
  assert.equal(inv.UPSTASH.status, "NOT_NEEDED");
  assert.equal(inv.GOOGLE_DRIVE.status, "HOLD_HUMAN");
  assert.equal(inv.SENTRY.status, "HOLD_HUMAN");
  assert.equal(inv.GITHUB_ACTIONS.live, false);
  assert.equal(inv.GITHUB_ACTIONS.auto_merge, false);
  for (const card of Object.values(inv)) {
    assert.equal(card.live, false);
    assert.equal(card.authority, "carl");
    if (card.status === "PASS") assert.equal(card.measured, true);
  }
});

test("GitHub PASS requires an executed workflow list", () => {
  const inv = staticInventory({
    env: { GITHUB_TOKEN: "present-but-unused" },
    wrangler: { exists: true, name: "acorn-juge", bindings: [] },
    github: { measured: true, callable: true, test: "GET workflows", result: "workflows=22" },
  });
  assert.equal(inv.GITHUB_ACTIONS.status, "PASS");
  assert.equal(inv.GITHUB_ACTIONS.callable, true);
  assert.equal(inv.GITHUB_ACTIONS.measured, true);
});

test("Cloudflare PASS only after real preview + lie contract", () => {
  const base = staticInventory({ env: {}, wrangler: { exists: true, name: "acorn-juge", bindings: [] } });
  const fail = applyCloudflareMeasurement(base, { critical_juge: { status: 500, json: {} } });
  assert.equal(fail.CLOUDFLARE_WORKERS.status, "FAIL");
  const pass = applyCloudflareMeasurement(base, {
    critical_juge: { status: 200, json: { preview: true, receipt: false, status: "CLASSIQUE" } },
    epsilon_zero: { status: 400, json: { error: "lie", phrase: "Error margin zero is a lie" } },
    vitrine_juge: { status: 404 },
  });
  assert.equal(pass.CLOUDFLARE_WORKERS.status, "PASS");
  assert.equal(pass.CLOUDFLARE_WORKERS.callable, true);
  assert.equal(pass.CLOUDFLARE_WORKERS.live, false);
  assert.match(pass.CLOUDFLARE_WORKERS.next_action, /wrangler deploy/);
});

test("classifyEnv never treats empty strings as present", () => {
  const keys = classifyEnv({ SENTRY_DSN: "  ", GOOGLE_DRIVE_FOLDER_ID: "x" });
  assert.equal(keys.sentry_dsn, false);
  assert.equal(keys.drive_folder, true);
  assert.equal(keys.drive_token, false);
});

test("mirror workflow fails closed when the engine is missing", () => {
  assert.match(workflow, /set -o pipefail/);
  assert.match(workflow, /scripts\/github-drive-mirror\.mjs/);
});
