#!/usr/bin/env node
/**
 * ACORN — CODEX EXECUTION CHOKE POINT
 * The existing scripts/codex wrapper is the worker's provider/executor boundary.
 * This gate reuses the existing runtime interposition fabric; it is not a new
 * authority layer. Every real `codex exec` call must pass here.
 */
import { authorizeRuntimeEffect, assertRuntimeInterposition } from "./acorn-runtime-interposition.mjs";

const args = process.argv.slice(2);
const env = process.env;
const readOnly = args.includes("read-only");
const isExec = args[0] === "exec";

if (!isExec) process.exit(0);

const result = authorizeRuntimeEffect({
  actor: "acorn.codex-worker",
  capability: {
    id: readOnly ? "codex.exec.discovery" : "codex.exec.write",
    kind: readOnly ? "CODE_DISCOVERY" : "CODE_EXECUTION",
    resource: env.GITHUB_REPOSITORY || env.GITHUB_WORKSPACE || "codex-runtime",
    observability: "VERIFIED",
    control: "VERIFIED",
    reversibility: readOnly ? "REVERSIBLE" : "PARTIAL",
    epistemic: "MEASURED",
  },
  operation: `codex ${args.join(" ")}`,
  evidence: {
    measured: true,
    verified: true,
    known_executor: true,
    known_entrypoint: true,
    breaker_state: env.ACORN_SYSTEM_MODE || "UNKNOWN",
  },
  policy: { requireMeasured: true, requireVerified: true },
});

assertRuntimeInterposition(result);
process.stderr.write(`ACORN_CODEX_INTERPOSITION decision=${result.decision} capability=${result.event.capability} authority_granted=${result.authority_granted} live=${result.live}\n`);

if (!result.allowed) process.exit(126);
