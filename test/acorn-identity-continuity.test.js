import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VERSION, createIdentity, createInstance, snapshotState, appendEvent, buildContinuityLog,
  compareContinuity, transformContinuity, forkContinuity, mergeContinuity,
  reconstructContinuity, detectContinuityBreak, successionEnvelope,
  runIdentityContinuityCycle, assertIdentityContinuityInvariant, assertIdentityContinuityConstitution,
} from '../scripts/acorn-identity-continuity.mjs';

test('identity continuity is distinct from model/provider/channel', () => {
  const identity = createIdentity({ key: 'cortex-x' });
  const a = createInstance({ identityId: identity.id, instanceKey: 'a', model: 'm1', provider: 'p1', channel: 'c1' });
  const b = createInstance({ identityId: identity.id, instanceKey: 'b', model: 'm2', provider: 'p2', channel: 'c2' });
  assert.equal(a.identityId, b.identityId);
  assert.notEqual(a.id, b.id);
  assert.equal(VERSION, 'acorn.cortex.identity-continuity.v1');
});

test('append-only history produces deterministic continuity identifiers', () => {
  const first = appendEvent([], { kind: 'IDENTITY_CREATED', value: 'x', at: '2026-01-01T00:00:00.000Z' });
  const log = buildContinuityLog([{ kind: first.kind, value: 'x', at: first.at }]);
  assert.equal(log.events.length, 1);
  assert.match(log.continuityId, /^continuity:/);
  assert.ok(log.events[0].digest);
});

test('transformation preserves provenance instead of rewriting history', () => {
  const log = buildContinuityLog([{ kind: 'IDENTITY_CREATED', value: 'x', at: '2026-01-01T00:00:00.000Z' }]);
  const transformed = transformContinuity(log, { from: 'm1', to: 'm2', reason: 'provider replacement', evidence: ['e1'], reversible: 'PARTIAL' });
  assert.equal(transformed.events.length, 2);
  assert.equal(transformed.events[1].kind, 'TRANSFORMED');
  assert.equal(transformed.events[1].evidence[0], 'e1');
});

test('fork is recorded and never treated as same instance', () => {
  const log = buildContinuityLog([{ kind: 'IDENTITY_CREATED', value: 'x', at: '2026-01-01T00:00:00.000Z' }]);
  const fork = forkContinuity(log, { forkKey: 'branch-a', reason: 'experiment' });
  assert.equal(fork.kind, 'FORKED');
  assert.equal(fork.parentContinuityId, log.continuityId);
});

test('merge preserves parent histories', () => {
  const a = buildContinuityLog([{ kind: 'IDENTITY_CREATED', value: 'a', at: '2026-01-01T00:00:00.000Z' }]);
  const b = buildContinuityLog([{ kind: 'IDENTITY_CREATED', value: 'b', at: '2026-01-01T00:00:00.000Z' }]);
  const merged = mergeContinuity([a, b], { reason: 'reconciliation' });
  assert.equal(merged.kind, 'MERGED');
  assert.deepEqual(merged.parents, [a.continuityId, b.continuityId]);
  assert.equal(merged.historyPreserved, true);
});

test('continuity comparison never inherits authority', () => {
  const a = { identityId: 'i', continuityId: 'c1' };
  const b = { identityId: 'i', continuityId: 'c2' };
  const result = compareContinuity(a, b);
  assert.equal(result.sameIdentity, true);
  assert.equal(result.continuity, 'IDENTITY_SAME_HISTORY_DIFFERENT');
  assert.equal(result.authorityInherited, false);
  assert.equal(result.evidenceRequired, true);
});

test('continuity break detection catches substitution, provenance and memory failures', () => {
  const result = detectContinuityBreak({ previous: { continuityId: 'a' }, current: { continuityId: 'b' }, provenance: false, memoryStable: false, identityStable: false });
  assert.equal(result.broken, true);
  assert.deepEqual(result.reasons, ['IDENTITY_SUBSTITUTION', 'PROVENANCE_BREAK', 'MEMORY_MUTATION', 'CONTINUITY_DIVERGENCE']);
});

test('reconstruction is measured and never authority-bearing', () => {
  const identity = createIdentity({ key: 'reconstruct-me' });
  const result = reconstructContinuity({ identity, snapshots: [{ digest: 's1' }], events: [{ digest: 'e1' }], memory: [{ digest: 'm1' }], target: 'new-runtime' });
  assert.equal(result.epistemic, 'MEASURED');
  assert.equal(result.provenancePreserved, true);
  assert.equal(result.authorityInherited, false);
});

test('succession remains replaceable and future-open', () => {
  const envelope = successionEnvelope();
  assert.equal(envelope.replaceableProvider, true);
  assert.equal(envelope.replaceableModel, true);
  assert.equal(envelope.futureUnknownAllowed, true);
  assert.equal(envelope.authorityInheritance, false);
});

test('continuous cycle emits measured evidence with no authority grant', () => {
  const identity = createIdentity({ key: 'cycle' });
  const instance = createInstance({ identityId: identity.id, instanceKey: 'i1', state: { memory: 'm' } });
  const result = runIdentityContinuityCycle({ identity, instance });
  assert.equal(result.epistemic, 'MEASURED');
  assert.equal(result.authorityGranted, false);
  assert.equal(result.breakerBypass, false);
  assert.equal(result.autoMerge, false);
  assert.equal(result.live, false);
  assert.equal(result.provenancePreserved, true);
  assertIdentityContinuityInvariant(result);
});

test('constitution preserves the Carl/Breaker boundary', () => {
  const constitution = assertIdentityContinuityConstitution();
  assert.equal(constitution.carlControlsBreaker, true);
  assert.equal(constitution.breakerDoesNotControlCarl, true);
  assert.equal(constitution.acornControlsNeither, true);
  assert.equal(constitution.continuityNotAuthority, true);
});

test('snapshot rejects invalid epistemic state', () => {
  const identity = createIdentity({ key: 'bad-state' });
  const instance = createInstance({ identityId: identity.id, instanceKey: 'i' });
  assert.throws(() => snapshotState(instance, { epistemic: 'SAFE' }), /INVALID_EPISTEMIC_STATE/);
});
