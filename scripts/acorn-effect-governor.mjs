// ACORN — unified effect governance / coverage audit
// This is a registry and enforcement contract over the existing interposition fabric.
// It does not create a second runtime, Cortex, Defense, Fabric or authority source.
import fs from 'node:fs';
import path from 'node:path';
import { interposeExternalEffect, assertExternalEffectDecision, interpositionPolicySummary } from './acorn-effect-interposition.mjs';

export const EFFECT_GOVERNOR_VERSION = 'acorn.effect-governor.v1';

const DEFAULT_EFFECT_SURFACES = [
  'codex', 'cognitive-worker', 'autonomous-runtime', 'runtime',
  'provider', 'gateway', 'connector', 'tool', 'external-api',
  'github', 'calendar', 'gmail', 'drive', 'canva', 'x-ads',
];

export function governEffect(input = {}) {
  const result = interposeExternalEffect(input);
  assertExternalEffectDecision(result);
  return { ...result, governor: EFFECT_GOVERNOR_VERSION };
}

export function registerEffectSurface(surface, { entrypoint, status = 'DECLARED', interposed = false, verified = false } = {}) {
  if (!surface || !entrypoint) throw new Error('INVALID_EFFECT_SURFACE');
  return Object.freeze({ surface, entrypoint, status, interposed: Boolean(interposed), verified: Boolean(verified) });
}

export function auditEffectCoverage({ root = process.cwd(), surfaces = DEFAULT_EFFECT_SURFACES } = {}) {
  const files = [];
  const walk = dir => {
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      if (name.name === 'node_modules' || name.name === '.git') continue;
      const full = path.join(dir, name.name);
      if (name.isDirectory()) walk(full);
      else if (/\.(mjs|js|cjs|sh)$/.test(name.name)) files.push(full);
    }
  };
  walk(path.join(root, 'scripts'));
  const source = files.map(file => ({ file, text: fs.readFileSync(file, 'utf8') }));
  const signals = source.map(({ file, text }) => ({
    file,
    external_effect_signals: [
      /gh\s+api/.test(text), /fetch\s*\(/.test(text), /https?:\/\//.test(text),
      /spawn(?:Sync)?\s*\(/.test(text), /exec(?:File|Sync)?\s*\(/.test(text),
    ].filter(Boolean).length,
    interposition_signals: [
      /interposeExternalEffect/.test(text), /authorizeRuntimeEffect/.test(text),
      /assertRuntimeInterposition/.test(text), /codex-interposition-gate/.test(text),
    ].filter(Boolean).length,
  }));
  const candidates = signals.filter(x => x.external_effect_signals > 0);
  const uncovered = candidates.filter(x => x.interposition_signals === 0);
  return {
    version: EFFECT_GOVERNOR_VERSION,
    invariant: 'NO_UNGOVERNED_CAPABILITY_PATH',
    surfaces,
    scanned_files: files.length,
    effect_candidates: candidates.length,
    interposed_candidates: candidates.length - uncovered.length,
    uncovered: uncovered.map(x => x.file),
    status: uncovered.length === 0 ? 'COVERED' : 'GAP_DETECTED',
    authority_granted: false,
    auto_merge: false,
    live: false,
    policy: interpositionPolicySummary(),
  };
}

export function assertEffectCoverage(audit) {
  if (!audit || audit.status !== 'COVERED') throw new Error(`UNGOVERNED_EFFECT_PATH:${(audit?.uncovered || []).join(',')}`);
  if (audit.authority_granted !== false || audit.live !== false || audit.auto_merge !== false) throw new Error('EFFECT_GOVERNOR_INVARIANT_FAILED');
  return true;
}
