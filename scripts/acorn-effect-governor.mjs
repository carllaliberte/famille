// ACORN — unified effect governance / coverage audit
// This is a registry and enforcement contract over the existing interposition fabric.
// It does not create a second runtime, Cortex, Defense, Fabric or authority source.
import fs from 'node:fs';
import path from 'node:path';
import { interposeExternalEffect, assertExternalEffectDecision, interpositionPolicySummary } from './acorn-effect-interposition.mjs';

export const EFFECT_GOVERNOR_VERSION = 'acorn.effect-governor.v1';
export { interpositionPolicySummary };

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
  { kind: 'http.request', re: /(?<![\w.$])(?:https?|http)\.request\s*\(/ },
  { kind: 'axios', re: /(?<![\w.$])axios(?:\.[A-Za-z]+)?\s*\(/ },
  { kind: 'spawn', re: /(?<![\w.$])spawn(?:Sync)?\s*\(/ },
  { kind: 'exec', re: /(?<![\w.$])exec(?:File|Sync)?\s*\(/ },
  { kind: 'shell', re: /(?<![\w.$])(?:execa|crossSpawn)\s*\(/ },
];

const SHELL_EFFECT_PATTERNS = [
  { kind: 'git-push', re: /\bgit\s+push\b/ },
  { kind: 'gh-api', re: /\bgh\s+api\b/ },
  { kind: 'gh-merge', re: /\bgh\s+(?:pr\s+merge|pr\s+close)\b/ },
  { kind: 'curl', re: /\bcurl\s+/ },
  { kind: 'wget', re: /\bwget\s+/ },
  { kind: 'wrangler-deploy', re: /\bwrangler\s+deploy\b/ },
  { kind: 'npm-publish', re: /\bnpm\s+publish\b/ },
];

function stripJavaScriptNonCode(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

function detectEffects(file, text) {
  const isShell = /\.sh$/.test(file);
  const executable = isShell ? text : stripJavaScriptNonCode(text);
  const patterns = isShell ? SHELL_EFFECT_PATTERNS : JS_EFFECT_PATTERNS;
  let findings = patterns.filter(({ re }) => re.test(executable)).map(({ kind }) => kind);

  // A local Node syntax check is not an external effect path.
  if (file.endsWith('scripts/acorn-capability-inventory.mjs') && /execFileSync\(process\.execPath/.test(executable)) {
    findings = findings.filter((kind) => kind !== 'exec');
  }

  // The Codex worker's `codex` child process is already forced through the existing
  // scripts/codex → codex-interposition-gate choke point. Count that as transitive governance.
  if (file.endsWith('scripts/codex-autonomous-worker.mjs') && /spawn\(\s*["']codex["']/.test(executable)) {
    findings = findings.filter((kind) => kind !== 'spawn' && kind !== 'exec');
  }

  // Internal runtime stages launched as `node scripts/*.mjs` are not themselves
  // external effects; their own files are scanned independently for their effects.
  if (file.endsWith('scripts/cognitive-conductor.mjs') && /spawn\(process\.execPath,\s*\[script\]/.test(executable)) {
    findings = findings.filter((kind) => kind !== 'spawn');
  }

  if (!isShell && /(?<![\w.$])fetch\s*\(/.test(executable) && /(?:export\s+default\s*\{|module\.exports)/.test(executable)) {
    const inboundOnly = /(?:export\s+default\s*\{\s*(?:async\s+)?fetch\s*\([^)]*\)\s*\{|module\.exports\s*=\s*\{[^}]*fetch\s*\([^)]*\)\s*\{)/s.test(executable);
    if (inboundOnly) findings = findings.filter((kind) => kind !== 'fetch');
  }
  return findings;
}

function hasTransitiveGovernance(file, text, root) {
  if (file.endsWith('scripts/codex-autonomous-worker.mjs')) {
    const gate = path.join(root, 'scripts/codex-interposition-gate.mjs');
    const wrapper = path.join(root, 'scripts/codex');
    if (fs.existsSync(gate) && fs.existsSync(wrapper)) {
      const gateText = fs.readFileSync(gate, 'utf8');
      const wrapperText = fs.readFileSync(wrapper, 'utf8');
      return /codex-interposition-gate/.test(wrapperText) && /governEffect|authorizeRuntimeEffect/.test(gateText);
    }
  }
  return false;
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

  const signals = files.map(file => {
    const text = fs.readFileSync(file, 'utf8');
    const effects = detectEffects(file, text);
    const executable = /\.(mjs|js|cjs)$/.test(file) ? stripJavaScriptNonCode(text) : text;
    const governance = GOVERNANCE_MARKERS.filter(re => re.test(executable)).length;
    const transitive = hasTransitiveGovernance(file, executable, root);
    return { file, external_effect_signals: effects.length, effect_kinds: effects, governance_signals: governance, transitive_governance: transitive };
  });

  const candidates = signals.filter(x => x.external_effect_signals > 0);
  const uncovered = candidates.filter(x => x.governance_signals === 0 && !x.transitive_governance);
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
