#!/usr/bin/env node
/**
 * Honest seal. ZK / BFT / Φ are CHANNEL NOT PRESENT.
 * Does not write cadence.v0.json. Does not invent LIVE.
 */
import { fileURLToPath } from "node:url";
import { cycle } from "./discover-cycle.mjs";

export function seal(argv = process.argv.slice(2)) {
  const asked = argv.join(" ");
  return {
    ok: true,
    v: "official-seal.v0",
    asked: asked || null,
    zk: { status: "CHANNEL NOT PRESENT" },
    bft: { status: "CHANNEL NOT PRESENT" },
    phi: { status: "TALK.METAPHOR", value: null },
    nova: { status: "CHANNEL NOT PRESENT" },
    live: false,
    connected: false,
    auto_merge: false,
    cadence_file_written: false,
    authority: "carl",
    next: "discover",
  };
}

function isMain() {
  const here = fileURLToPath(import.meta.url);
  const argv1 = process.argv[1] ? String(process.argv[1]) : "";
  return argv1.endsWith("official-seal.mjs") || here === argv1;
}

if (isMain()) {
  const out = { ...seal(), cycle: cycle({ trigger: "seal" }) };
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}
