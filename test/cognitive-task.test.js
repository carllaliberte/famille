import test from 'node:test';
import assert from 'node:assert/strict';
import { createCognitiveTask, taskPrompt } from '../.github/swarm/cognitive-task.mjs';

test('preserves original intent and provenance', () => {
  const task = createCognitiveTask({
    intent: 'Combiner les intelligences sans que Carl traduise le travail.',
    source: 'carl',
    channel: 'grok-build',
    ref: 'main',
    capabilities: ['build', 'review', 'build'],
    env: { ACORN_SYSTEM_MODE: 'RUN' },
  });
  assert.equal(task.task, 'cognitive-task.v1');
  assert.equal(task.intent, 'Combiner les intelligences sans que Carl traduise le travail.');
  assert.deepEqual(task.capabilities, ['build', 'review']);
  assert.equal(task.provenance.source, 'carl');
  assert.equal(task.governance.human_authority, 'carl');
  assert.equal(task.governance.production_write_allowed, false);
  assert.equal(task.governance.auto_merge, false);
  assert.equal(task.governance.live, false);
  assert.equal(task.governance.execution_requires_breaker, true);
});

test('renders the same task for downstream intelligence', () => {
  const task = createCognitiveTask({ intent: 'Inspect and improve this bridge.' });
  const prompt = taskPrompt(task);
  assert.match(prompt, /Inspect and improve this bridge\./);
  assert.match(prompt, /human_authority=carl/);
  assert.match(prompt, /auto_merge=false/);
  assert.match(prompt, /live=false/);
  assert.match(prompt, /Global Breaker/);
});

test('never serializes credential values', () => {
  const secret = 'DO_NOT_EXPOSE_THIS_SECRET';
  const task = createCognitiveTask({ intent: 'test', env: { XAI_API_KEY: secret } });
  assert.equal(JSON.stringify(task).includes(secret), false);
});
