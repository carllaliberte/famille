#!/usr/bin/env node
/**
 * Swarm CI matrix. Presence boolean only. Never dump secrets.
 * Missing keys → silent skip. Always exit 0. connected stays false.
 * Carl merges.
 */
import { fileURLToPath } from "node:url";
import { MODELS, keyedModels } from "../.github/swarm/review.mjs";

export function matrix(env = process.env) {
  const ids = Object.keys(MODELS);
  const { run } = keyedModels(ids, env);
  const presentIds = new Set(run.map((r) => r.id));
  const rows = ids.map((id) => ({
    id,
    present: presentIds.has(id),
    connected: false,
  }));
  return {
    ok: true,
    n: rows.length,
    run: rows.filter((r) => r.present).map((r) => r.id),
    skip: rows.filter((r) => !r.present).map((r) => r.id),
    rows,
    live: false,
    auto_merge: false,
  };
}

function isMain() {
  const here = fileURLToPath(import.meta.url);
  const argv1 = process.argv[1] ? String(process.argv[1]) : "";
  return argv1.endsWith("swarm-ci-matrix.mjs") || here === argv1;
}

if (isMain()) {
  const out = matrix();
  const text = JSON.stringify(out, null, 2);
  if (/sk-|sk-or-|AIza|xai-|BEGIN /.test(text)) {
    process.exit(0);
  }
  console.log(text);
  process.exit(0);
}
