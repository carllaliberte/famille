#!/usr/bin/env node
/**
 * Wake after merge. Observe. Classify. Do not merge.
 * DEFINED is not EXECUTED — this file is the call.
 */
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { MODELS, keyedModels } from "../.github/swarm/review.mjs";
import {
  discover,
  novelFront,
  scanPointers,
  tryToBreak,
  noveltyRate,
} from "../.github/swarm/detect.mjs";
import { sha256 } from "../.github/swarm/lease.mjs";
import { activate } from "../.github/swarm/workforce.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function cycle(opts = {}) {
  const root = opts.root || ROOT;
  const env = opts.env || process.env;
  const trigger = String(opts.trigger || env.DISCOVER_TRIGGER || "manual");
  const sha = String(opts.sha || env.GITHUB_SHA || "unknown").slice(0, 40);
  const merged = opts.merged || env.MERGED || "";
  const ids = Object.keys(MODELS);
  const auto = Object.values(MODELS)
    .filter((m) => m.auto)
    .map((m) => m.id);
  const keyed = keyedModels(ids, env);
  const skip = keyed.skip.map((s) => s.id);
  const disc = discover({ auto, skip, scope: trigger === "local" ? "local" : "actions" });
  const ptr = scanPointers(root, ["EVAL.md", "schema/README.md"]);
  const obs = disc.findings.length
    ? { auto, skip }
    : ptr.missing.length
      ? { missing: ptr.missing }
      : {
          note: "cycle observed; pointers ok; skip is not absence",
          hypothesis: "quiet-cycle",
        };
  const front = novelFront(obs);
  const broke = tryToBreak(front);
  const woke = activate({ need: "review", skipped: skip });
  const body = {
    v: "discover-cycle.v0",
    cycle_id: sha256(`${sha}:${trigger}:${front.kind}`).slice(0, 16),
    sha,
    trigger,
    merged: merged || null,
    executed: true,
    observed: true,
    auto,
    skip,
    env_findings: disc.findings.length,
    pointers_missing: ptr.missing.length,
    front: { kind: front.kind, dim: front.dim || null, state: front.state || null },
    broke: { kind: broke.kind, survived: Boolean(broke.survived) },
    rate: noveltyRate([broke]),
    brains: {
      relevant: woke.relevant,
      unavailable: woke.unavailable,
      blocked: false,
      authority: "carl",
    },
    next: "discover",
    idle: disc.findings.length === 0 && ptr.missing.length === 0,
    live: false,
    auto_merge: false,
    truth: false,
  };
  return { ok: true, ...body };
}

function isMain() {
  const here = fileURLToPath(import.meta.url);
  const argv1 = process.argv[1] ? String(process.argv[1]) : "";
  return argv1.endsWith("discover-cycle.mjs") || here === argv1;
}

if (isMain()) {
  const out = cycle();
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}
