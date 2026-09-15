import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDeclaredAgents } from './cognitive-handshake.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const KNOWLEDGE_VERSION = 'cognitive-knowledge.v1';
export const KNOWLEDGE_SCHEMA = path.join(ROOT, 'schema', `${KNOWLEDGE_VERSION}.json`);
export const LEDGER_FILE = path.join(ROOT, 'evidence', 'cognitive', 'knowledge-ledger.jsonl');

const KINDS = new Set(['knowledge','observation','method','capability','limit','failure','measurement','evidence']);
const STATES = new Set(['declared','observed','measured','verified','retracted']);

function strings(value, field) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some(v => typeof v !== 'string')) throw new Error(`${field}: expected string array`);
  return [...value];
}
function required(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field}: required`);
  return value.trim();
}
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function contributionId(input) {
  const copy = { ...input };
  delete copy.id;
  return crypto.createHash('sha256').update(canonical(copy)).digest('hex');
}

export function normalizeContribution(input, now = new Date().toISOString()) {
  if (!input || typeof input !== 'object') throw new Error('knowledge: object required');
  if (input.version !== KNOWLEDGE_VERSION) throw new Error(`knowledge: version must be ${KNOWLEDGE_VERSION}`);
  const source_identity = required(input.source_identity, 'source_identity');
  if (!/^[a-z][a-z0-9-]{1,63}$/.test(source_identity)) throw new Error('source_identity: invalid');
  if (!KINDS.has(input.kind)) throw new Error('kind: invalid');
  if (!STATES.has(input.state ?? 'declared')) throw new Error('state: invalid');
  const state = input.state ?? 'declared';
  const contribution = {
    version: KNOWLEDGE_VERSION,
    source_identity,
    kind: input.kind,
    subject: required(input.subject, 'subject'),
    content: required(input.content, 'content'),
    ...(input.conditions ? { conditions: strings(input.conditions, 'conditions') } : {}),
    state,
    provenance: {
      source: required(input.provenance?.source ?? source_identity, 'provenance.source'),
      observed_at: required(input.provenance?.observed_at ?? input.observed_at ?? now, 'provenance.observed_at'),
      ...(input.provenance?.evidence_refs ? { evidence_refs: strings(input.provenance.evidence_refs, 'provenance.evidence_refs') } : {})
    },
    ...(input.evidence_refs ? { evidence_refs: strings(input.evidence_refs, 'evidence_refs') } : {}),
    observed_at: required(input.observed_at ?? now, 'observed_at'),
    ...(input.valid_from ? { valid_from: input.valid_from } : {}),
    ...(input.valid_until ? { valid_until: input.valid_until } : {}),
    ...(input.supersedes ? { supersedes: strings(input.supersedes, 'supersedes') } : {}),
    ...(input.retracts ? { retracts: strings(input.retracts, 'retracts') } : {})
  };
  contribution.id = contributionId(contribution);
  if (input.id && input.id !== contribution.id) throw new Error('id: does not match deterministic contribution hash');
  return contribution;
}

export function assertShareable(contribution) {
  const text = `${contribution.subject}\n${contribution.content}`.toLowerCase();
  if (/chain[- ]of[- ]thought|private reasoning|system prompt|api key|secret|credential|password|access token/.test(text)) throw new Error('knowledge: private or secret material is not shareable');
  return true;
}

export function ingestContribution(input, { ledgerFile = LEDGER_FILE, now } = {}) {
  const contribution = normalizeContribution(input, now);
  assertShareable(contribution);
  fs.mkdirSync(path.dirname(ledgerFile), { recursive: true });
  const lines = fs.existsSync(ledgerFile) ? fs.readFileSync(ledgerFile, 'utf8').split('\n').filter(Boolean) : [];
  const existing = lines.map(line => JSON.parse(line)).find(entry => entry.id === contribution.id);
  if (existing) return { status: 'duplicate', contribution: existing };
  fs.appendFileSync(ledgerFile, JSON.stringify(contribution) + '\n');
  return { status: 'appended', contribution };
}

export function readKnowledge(ledgerFile = LEDGER_FILE) {
  if (!fs.existsSync(ledgerFile)) return [];
  return fs.readFileSync(ledgerFile, 'utf8').split('\n').filter(Boolean).map(JSON.parse);
}

export function queryKnowledge(filters = {}, ledgerFile = LEDGER_FILE) {
  return readKnowledge(ledgerFile).filter(entry =>
    (!filters.subject || entry.subject === filters.subject) &&
    (!filters.kind || entry.kind === filters.kind) &&
    (!filters.source_identity || entry.source_identity === filters.source_identity) &&
    (!filters.state || entry.state === filters.state) &&
    (!filters.condition || (entry.conditions ?? []).includes(filters.condition))
  );
}

export function backfillRoster({ ledgerFile = LEDGER_FILE, now } = {}) {
  const results = [];
  for (const agent of loadDeclaredAgents()) {
    results.push(ingestContribution({
      version: KNOWLEDGE_VERSION,
      source_identity: agent.identity.id,
      kind: 'knowledge',
      subject: 'cognitive-handshake',
      content: `Declared identity: ${agent.identity.name}. Capabilities are declarations, not evidence of execution.`,
      state: 'declared',
      provenance: { source: 'schema/agents.json', observed_at: now ?? new Date().toISOString() },
      observed_at: now ?? new Date().toISOString()
    }, { ledgerFile, now }));
  }
  return results;
}

export function supersedeContribution(input, targetId, options = {}) {
  return ingestContribution({ ...input, supersedes: [...new Set([...(input.supersedes ?? []), targetId])] }, options);
}

export function retractContribution(input, targetId, options = {}) {
  return ingestContribution({ ...input, state: 'retracted', retracts: [...new Set([...(input.retracts ?? []), targetId])] }, options);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = backfillRoster();
  process.stdout.write(JSON.stringify({ version: KNOWLEDGE_VERSION, status: 'measured-run', count: result.length }, null, 2) + '\n');
}
