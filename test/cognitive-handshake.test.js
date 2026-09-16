import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCognitiveRegistry, loadDeclaredAgents, normalizeHandshake } from '../scripts/cognitive-handshake.mjs';

test('normalizes a declaration without promoting it to measured truth', () => {
  const h = normalizeHandshake({
    version: 'cognitive-handshake.v1',
    identity: { id: 'example', name: 'Example AI', kind: 'model' },
    capabilities: ['reason'],
    limits: ['No execution evidence'],
    interfaces: ['text'],
    provenance: { source: 'test', observed_at: '2026-09-15T00:00:00.000Z' },
    state: { status: 'declared', claims_are_measured: false }
  });
  assert.equal(h.state.status, 'declared');
  assert.equal(h.state.claims_are_measured, false);
  assert.equal(h.capabilities[0].status, 'declared');
});

test('rejects a declaration pretending claims are measured', () => {
  assert.throws(() => normalizeHandshake({
    version: 'cognitive-handshake.v1',
    identity: { id: 'example', name: 'Example AI', kind: 'model' },
    capabilities: ['reason'],
    limits: [], interfaces: [], provenance: { source: 'test', observed_at: '2026-09-15T00:00:00.000Z' },
    state: { status: 'verified', claims_are_measured: true }
  }), /claims_are_measured/);
});

test('backfills every existing roster identity as declared, never connected or LIVE', () => {
  const registry = buildCognitiveRegistry(loadDeclaredAgents());
  assert.equal(registry.role, 'acorn-cognitive-center');
  assert.ok(registry.entries.length > 0);
  assert.ok(registry.entries.every(e => e.state.status === 'declared'));
  assert.ok(registry.entries.every(e => e.state.claims_are_measured === false));
  assert.ok(registry.entries.every(e => e.provenance.source.endsWith('schema/agents.json')));
  const ids = new Set(registry.entries.map(e => e.identity.id));
  assert.ok(ids.has('grok') && ids.has('heavy') && ids.has('build') && ids.has('carl'));
  const grok = registry.entries.find(e => e.identity.id === 'grok');
  assert.equal(grok.identity.kind, 'chef');
});

test('rejects duplicate identities', () => {
  const a = normalizeHandshake({ version:'cognitive-handshake.v1', identity:{id:'same',name:'A',kind:'model'}, capabilities:[], limits:[], interfaces:[], constraints:[], provenance:{source:'test',observed_at:'2026-09-15T00:00:00.000Z'}, state:{status:'declared',claims_are_measured:false} });
  assert.throws(() => buildCognitiveRegistry([a, a]), /duplicate identity/);
});
