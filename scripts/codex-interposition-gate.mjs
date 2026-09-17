#!/usr/bin/env node
/**
 * ACORN — CODEX EXECUTION CHOKE POINT
 * Reuses the unified external-effect governance bridge.
 */
import { governEffect } from './acorn-effect-governor.mjs';

const args = process.argv.slice(2);
const env = process.env;
const readOnly = args.includes('read-only');
const isExec = args[0] === 'exec';

if (!isExec) process.exit(0);

if (String(env.ACORN_SYSTEM_MODE || '').trim().toUpperCase() !== 'RUN') {
  process.stderr.write('ACORN_CODEX_INTERPOSITION decision=DENY reason=BREAKER_NOT_RUN authority_granted=false live=false\n');
  process.exit(126);
}

const result = governEffect({
  capability_id: readOnly ? 'codex.exec.discovery' : 'codex.exec.write',
  kind: readOnly ? 'CODE_DISCOVERY' : 'CODE_EXECUTION',
  resource: env.GITHUB_REPOSITORY || env.GITHUB_WORKSPACE || 'codex-runtime',
  provider: 'codex',
  context: 'autonomous-worker',
  observability: 'VERIFIED',
  control: 'VERIFIED',
  reversibility: readOnly ? 'REVERSIBLE' : 'PARTIAL',
  epistemic: 'MEASURED',
  operation: `codex ${args.join(' ')}`,
  evidence: {
    measured: true,
    verified: true,
    known_executor: true,
    known_entrypoint: true,
    breaker_state: 'RUN',
  },
  risk: { external_effect: true },
});

process.stderr.write(`ACORN_CODEX_INTERPOSITION decision=${result.decision} capability=${result.event?.capability || result.capability_id} authority_granted=${result.authority_granted} live=${result.live}\n`);
if (!result.allowed) process.exit(126);
