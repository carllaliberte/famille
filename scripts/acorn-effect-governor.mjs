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

const GOVERNANCE_MARKERS = [
  /\bgovernEffect\s*\(/,
  /\binterposeExternalEffect\s*\(/,
  /\bauthorizeRuntimeEffect\s*\(/,
  /\bassertRuntimeInterposition\s*\(/,
  /codex-interposition-gate/,
];

const JS_EFFECT_PATTERNS = [
  { kind: 'fetch', re: /(?<![\w.$])fetch\s*\(/ },
  { kind: 'http.request', re: /\b(?:https?|http)\.request\s*\(/ },
  { kind: 'axios', re: /\baxios(?:\.[A-Za-z]+)?\s*\(/ },
  { kind: 'spawn', re: /\bspawn(?:Sync)?\s*\(/ },
  { kind: 'exec', re: /\bexec(?:File|Sync)?\s*\(/ },
  { kind: 'shell', re: /\b(?:execa|crossSpawn)\s*\(/ },
  { kind: 'git-push', re: /\bgit\s+push\b/ },
  { kind: 'gh-api', re: /\bgh\s+api\b/ },
  { kind: 'gh-merge', re: /\bgh\s+(?:pr\s+merge|pr\s+close)\b/ },
  { kind: 'curl', re: /\bcurl\s+/ },
  { kind: 'wget', re: /\bwget\s+/ },
  { kind: 'wrangler-deploy', re: /\bwrangler\s+deploy\b/ },
  { kind: 'npm-publish', re: /\bnpm\s+publish\b/ },
];

function stripJavaScriptNonCode(text) {
  // Keep call syntax while removing comments and string contents so documentation
  // URLs, examples and prose do not become false external-effect candidates.
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

function detectEffects(file, text) {
  const executable = /\.(mjs|js|cjs)$/.test(file) ? stripJavaScriptNonCode(text) : text;
  const findings = JS_EFFECT_PATTERNS.filter(({ re }) => re.test(executable)).map(({ kind }) => kind);

  // Cloudflare-style inbound handlers are not outbound effects by themselves.
  if (/\bfetch\s*\(/.test(executable) && /(?:export\s+default\s*\{|module\.exports)/.test(executable)) {
    const inboundOnly = /(?:export\s+default\s*\{\s*(?:async\s+)?fetch\s*\([^)]*\)\s*\{|module\.exports\s*=\s*\{[^}]*fetch\s*\([^)]*\)\s*\{)/s.test(executable);
    if (inboundOnly) {
      const index = findings.indexOf('fetch');
      if (index >= 0) findings.splice(index, 1);
    }
  }

  return findings;
}

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
  const signals = source.map(({ file, text }) => {
    const effects = detectEffects(file, text);
    const governance = GOVERNANCE_MARKERS.filter(re => re.test(/\.(mjs|js|cjs)$/.test(file) ? stripJavaScriptNonCode(text) : text)).length;
    return {
      file,
      external_effect_signals: effects.length,
      effect_kinds: effects,
      governance_signals: governance,
    };
  });

  const candidates = signals.filter(x => x.external_effect_signals > 0);
  const uncovered = candidates.filter(x => x.governance_signals === 0);

  return {
    version: EFFECT_GOVERNOR_VERSION,
    invariant: 'NO_UNGOVERNED_CAPABILITY_PATH',
    surfaces,
    scanned_files: files.length,
    effect_candidates: candidates.length,
    interposed_candidates: candidates.length - uncovered.length,
    uncovered: uncovered.map(x => ({ file: x.file, effect_kinds: x.effect_kinds })),
    status: uncovered.length === 0 ? 'COVERED' : 'GAP_DETECTED',
    authority_granted: false,
    auto_merge: false,
    live: false,
    policy: interpositionPolicySummary(),
  };
}

export function assertEffectCoverage(audit) {
  if (!audit || audit.status !== 'COVERED') {
    const paths = (audit?.uncovered || []).map(x => `${x.file}:${(x.effect_kinds || []).join('|')}`);
    throw new Error(`UNGOVERNED_EFFECT_PATH:${paths.join(',')}`);
  }
  if (audit.authority_granted !== false || audit.live !== false || audit.auto_merge !== false) throw new Error('EFFECT_GOVERNOR_INVARIANT_FAILED');
  return true;
}
