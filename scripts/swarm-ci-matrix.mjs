#!/usr/bin/env node
/**
 * Swarm CI matrix. Presence boolean only. Never dump secrets.
 * Missing keys → skip. Always exit 0. Carl merges.
 */
import { fileURLToPath } from "node:url";
import { MODELS, keyedModels } from "../.github/swarm/review.mjs";

export function matrix(env = process.env) {
  const ids = Object.keys(MODELS);
  const { run, skip } = keyedModels(ids, env);
  const rows = ids.map((id) => {
    const spec = MODELS[id];
    const on = run.find((r) => r.id === id);
    const off = skip.find((s) => s.id === id);
    return {
      id,
      auto: Boolean(spec.auto),
      secret: spec.secret,
      present: Boolean(on),
      via: on && on.via ? on.via : on ? "native" : null,
      skip: off ? off.reason : null,
      connected: false,
      live: false,
    };
  });
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
    console.error("HOLD: matrix leaked a key-shaped string");
    process.exit(0);
  }
  console.log(text);
  process.exit(0);
}
