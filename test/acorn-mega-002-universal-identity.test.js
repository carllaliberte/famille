import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRecord,
  measureRecords,
  buildIdentityState,
  selectNext,
  assertConstitution,
} from '../scripts/acorn-mega-002-universal-identity.mjs';

test('Universal Identity Fabric preserves evidence boundaries', () => {
  const a = createRecord({ id: 'a', label: 'A', value: 2, evidence: ['e'], verified: true });
  const b = createRecord({ id: 'b', label: 'B', value: 1 });

  assert.equal(a.verified, false);
  assert.equal(a.measured, false);
  assert.equal(a.authority, false);
  assert.equal(a.live, false);

  const s = buildIdentityState([a, b]);
  assert.equal(s.count, 2);
  assert.equal(s.verified_count, 0);
  assert.equal(s.authority, false);
  assert.equal(s.live, false);
  assert.equal(selectNext([a, b]).id, 'a');
  assert.equal(assertConstitution(s).valid, true);

  const measured = measureRecords([a]);
  assert.equal(measured.records[0].measured, true);
  assert.equal(measured.records[0].verified, false);
  assert.equal(measured.records[0].authority, false);
  assert.equal(measured.records[0].live, false);
});
