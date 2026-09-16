import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('channel reality marker exists', () => {
  assert.match(readFileSync('CHANNEL-REALITY-CHECK.txt', 'utf8'), /Credentials are not proof/);
});
