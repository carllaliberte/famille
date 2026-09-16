import test from 'node:test';
import assert from 'node:assert/strict';
import { CHANNEL_STATES } from '../scripts/channel-reality.mjs';

test('channel reality exposes measured positive and negative states', () => {
  assert.ok(CHANNEL_STATES.includes('OBSERVED'));
  assert.ok(CHANNEL_STATES.includes('RETIRED'));
  assert.ok(CHANNEL_STATES.includes('AUTH_FAILED'));
  assert.ok(CHANNEL_STATES.includes('NOT_FOUND'));
  assert.ok(CHANNEL_STATES.includes('TRANSIENT_FAILURE'));
});
