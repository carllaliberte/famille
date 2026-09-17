import test from 'node:test';
import assert from 'node:assert/strict';
import { governEffect } from '../scripts/acorn-effect-governor.mjs';

test('worker-class effect is governed by the unified governor', () => {
  const result = governEffect({
    actor:'acorn.test', capability:{id:'github.issue.comment:1',kind:'external.test',resource:'test',observability:'VERIFIED',control:'VERIFIED',reversibility:'PARTIAL',epistemic:'MEASURED'},
    operation:'POST /test/effect', evidence:{measured:true,verified:true,known_entrypoint:true}, policy:{requireMeasured:true,requireVerified:true},
  });
  assert.equal(result.decision, 'ALLOW');
  assert.equal(result.allowed, true);
  assert.equal(result.authority_granted, false);
  assert.equal(result.live, false);
  assert.equal(result.governor, 'acorn.effect-governor.v1');
});

test('unknown effect remains blocked by the unified governor', () => {
  const result = governEffect({
    actor:'acorn.test', capability:{id:'unknown.effect',kind:'external.test',resource:'test',observability:'NONE',control:'NONE',reversibility:'UNKNOWN',epistemic:'UNKNOWN'},
    operation:'POST /test/effect', evidence:{measured:false,verified:false}, policy:{requireMeasured:true,requireVerified:true},
  });
  assert.notEqual(result.decision, 'ALLOW');
  assert.equal(result.allowed, false);
  assert.equal(result.authority_granted, false);
  assert.equal(result.live, false);
});
