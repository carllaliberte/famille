import test from 'node:test';
import assert from 'node:assert/strict';
import { governEffect, interpositionPolicySummary } from '../scripts/acorn-effect-governor.mjs';

test('effect governance allows a measured, verified, controllable reversible effect without authority', () => {
  const result = governEffect({
    capability_id: 'test.effect', kind: 'TEST_EFFECT', resource: 'test', provider: 'test',
    observability: 'VERIFIED', control: 'VERIFIED', reversibility: 'REVERSIBLE', epistemic: 'MEASURED',
    operation: 'test-effect', evidence: { verified: true },
  });
  assert.equal(result.decision, 'ALLOW');
  assert.equal(result.allowed, true);
  assert.equal(result.authority_granted, false);
  assert.equal(result.live, false);
});

test('effect governance blocks unknown capability paths', () => {
  const result = governEffect({
    capability_id: 'test.unknown', resource: 'unknown', operation: 'unknown',
    observability: 'NONE', control: 'NONE', reversibility: 'UNKNOWN', epistemic: 'UNKNOWN',
  });
  assert.notEqual(result.decision, 'ALLOW');
  assert.equal(result.authority_granted, false);
});

test('effect governance constitution never grants authority or LIVE', () => {
  const policy = interpositionPolicySummary();
  assert.equal(policy.invariant, 'NO_UNGOVERNED_CAPABILITY_PATH');
  assert.equal(policy.authority_granted, false);
  assert.equal(policy.auto_merge, false);
  assert.equal(policy.live, false);
});
