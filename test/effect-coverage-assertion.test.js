import test from 'node:test';
import assert from 'node:assert/strict';
import { auditEffectCoverage, assertEffectCoverage } from '../scripts/acorn-effect-governor.mjs';

test('effect surface audit is a measured constitutional property', () => {
  const audit = auditEffectCoverage();
  assert.equal(audit.invariant, 'NO_UNGOVERNED_CAPABILITY_PATH');
  assert.equal(audit.authority_granted, false);
  assert.equal(audit.auto_merge, false);
  assert.equal(audit.live, false);
  assertEffectCoverage(audit);
});
