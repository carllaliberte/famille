#!/usr/bin/env node
/**
 * ACORN TOOL RESOLVE
 * Missing capability → search → reuse → else BUILD_TOOL. Never "I cannot".
 * File presence is DECLARED, not AVAILABLE, not EXECUTED, not LIVE.
 * Secrets, merge, QPU and wrangler stay HOLD_HUMAN.
 */
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const TOOL_RESOLVE_VERSION = "tool-resolve.v1";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIRS = ["scripts", ".github/swarm", "sdk"];
const FORBIDDEN = /\b(secret|credential|token|wrangler|merge|qpu|photon|quantum-node)\b/i;

function clip(value) {
  return String(value || "").trim().toLowerCase();
}

export function catalogTools(root = ROOT) {
  const tools = [];
  for (const dir of DIRS) {
    const path = join(root, dir);
    if (!existsSync(path)) continue;
    for (const name of readdirSync(path)) {
      if (!/\.(mjs|js)$/.test(name)) continue;
      const id = name.replace(/\.(mjs|js)$/, "");
      tools.push({
        id,
        path: `${dir}/${name}`,
        declared: true,
        available: false,
        executed: false,
        live: false,
      });
    }
  }
  return tools;
}

export function resolveTool(need = {}, opts = {}) {
  const name = clip(need?.name || need);
  const why = need?.why || "capability unmeasured";
  const base = {
    v: TOOL_RESOLVE_VERSION,
    auto_merge: false,
    live: false,
    authority: "carl",
  };
  if (!name) {
    return { ...base, decision: "HOLD_HUMAN", why: "unnamed capability", human_required: true };
  }
  if (FORBIDDEN.test(name) || FORBIDDEN.test(why)) {
    return { ...base, decision: "HOLD_HUMAN", tool: name, why: "human boundary", human_required: true };
  }
  const tools = opts.catalog || catalogTools(opts.root || ROOT);
  const hit = tools.find((row) => row.id === name || row.path.endsWith(`/${name}.mjs`) || row.path.endsWith(`/${name}.js`));
  if (hit) {
    return {
      ...base,
      decision: "REUSE",
      tool: hit.id,
      path: hit.path,
      why: "existing module already provides this capability",
      declared: true,
      executed: false,
      then: "call the existing module; do not rebuild it",
    };
  }
  return {
    ...base,
    decision: "BUILD_TOOL",
    tool: name,
    why,
    then: "specify → build → test → keep → reuse on the next cycle",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const name = process.argv[2] || "";
  console.log(JSON.stringify(resolveTool({ name, why: process.argv[3] }), null, 2));
}
