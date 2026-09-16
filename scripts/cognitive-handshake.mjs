import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const HANDSHAKE_VERSION = 'cognitive-handshake.v1';
export const HANDSHAKE_SCHEMA = path.join(ROOT, 'schema', 'cognitive-handshake.v1.json');
export const AGENTS_FILE = path.join(ROOT, 'schema', 'agents.json');

const STATUS = new Set(['declared','connected','observed','measured','verified','blocked']);
const CAPABILITY_STATUS = new Set(['declared','measured','verified','expired','blocked']);

function arrayOfStrings(value, field) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some(v => typeof v !== 'string')) throw new Error(`${field}: expected string array`);
  return [...value];
}

function requiredString(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field}: required`);
  return value.trim();
}

export function normalizeHandshake(input, now = new Date().toISOString()) {
  if (!input || typeof input !== 'object') throw new Error('handshake: object required');
  if (input.version !== HANDSHAKE_VERSION) throw new Error(`handshake: version must be ${HANDSHAKE_VERSION}`);
  const identity = input.identity ?? {};
  const id = requiredString(identity.id, 'identity.id');
  if (!/^[a-z][a-z0-9-]{1,63}$/.test(id)) throw new Error('identity.id: invalid');
  const kind = requiredString(identity.kind, 'identity.kind');
  if (!['model','agent','service','tool','human','seat','guest','other','chef','consult'].includes(kind)) throw new Error('identity.kind: invalid');
  const state = input.state ?? {};
  const status = state.status ?? 'declared';
  if (!STATUS.has(status)) throw new Error('state.status: invalid');
  if (state.claims_are_measured !== false) throw new Error('state.claims_are_measured: must remain false');
  const capabilities = arrayOfStrings(input.capabilities?.map(c => typeof c === 'string' ? c : c?.name), 'capabilities')
    .filter(Boolean).map(name => ({ name, status: 'declared' }));
  for (const c of input.capabilities ?? []) {
    if (typeof c !== 'object') continue;
    if (c.status && !CAPABILITY_STATUS.has(c.status)) throw new Error(`capability ${c.name}: invalid status`);
  }
  const measurements = (input.measurements ?? []).map(m => ({ ...m }));
  return {
    version: HANDSHAKE_VERSION,
    identity: {
      id,
      name: requiredString(identity.name, 'identity.name'),
      ...(identity.provider ? { provider: identity.provider } : {}),
      ...(identity.model ? { model: identity.model } : {}),
      ...(identity.version ? { version: identity.version } : {}),
      kind
    },
    capabilities,
    limits: arrayOfStrings(input.limits, 'limits'),
    interfaces: arrayOfStrings(input.interfaces, 'interfaces'),
    constraints: arrayOfStrings(input.constraints, 'constraints'),
    modalities: arrayOfStrings(input.modalities, 'modalities'),
    tools: arrayOfStrings(input.tools, 'tools'),
    formats: arrayOfStrings(input.formats, 'formats'),
    provenance: {
      source: requiredString(input.provenance?.source ?? 'handshake', 'provenance.source'),
      observed_at: requiredString(input.provenance?.observed_at ?? now, 'provenance.observed_at'),
      ...(input.provenance?.evidence_refs ? { evidence_refs: arrayOfStrings(input.provenance.evidence_refs, 'provenance.evidence_refs') } : {})
    },
    state: { status, claims_are_measured: false },
    measurements
  };
}

export function loadDeclaredAgents(file = AGENTS_FILE) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  return (raw.agents ?? []).map(agent => normalizeHandshake({
    version: HANDSHAKE_VERSION,
    identity: { id: agent.id, name: agent.name, kind: agent.kind ?? 'other' },
    capabilities: agent.capabilities ?? [],
    limits: ['Declared roster data is not evidence of execution.'],
    interfaces: agent.capabilities ?? [],
    constraints: agent.locked ? ['Registry entry is governance-locked.'] : [],
    provenance: { source: file, observed_at: new Date().toISOString() },
    state: { status: 'declared', claims_are_measured: false }
  }));
}

export function buildCognitiveRegistry(handshakes) {
  const entries = handshakes.map(normalizeHandshake);
  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.identity.id)) throw new Error(`registry: duplicate identity ${entry.identity.id}`);
    seen.add(entry.identity.id);
  }
  return {
    version: HANDSHAKE_VERSION,
    role: 'acorn-cognitive-center',
    generated_at: new Date().toISOString(),
    rule: 'declared != connected != observed != measured != verified',
    entries
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const registry = buildCognitiveRegistry(loadDeclaredAgents());
  process.stdout.write(JSON.stringify(registry, null, 2) + '\n');
}
