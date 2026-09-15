import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inspectLanguage,
  assertLanguageIntegrity,
  architectureRoles,
  validateArchitectureStatement,
} from '../.github/swarm/language-integrity.mjs';

test('blocks known malformed language instead of letting it pass', () => {
  const result = inspectLanguage('Ça s’aplatissait assez logique.');
  assert.equal(result.ok, false);
  assert.equal(result.findings[0].code, 'FORBIDDEN_PHRASE');
  assert.throws(() => assertLanguageIntegrity('Ça s’aplatissait assez logique.'), /LANGUAGE_INTEGRITY_BLOCKED/);
});

test('allows clear ordinary language', () => {
  assert.equal(assertLanguageIntegrity('Ça me semblait assez logique.'), true);
});

test('preserves the canonical Acorn role order', () => {
  const roles = architectureRoles();
  assert.deepEqual(roles.order, ['AI CONNECTOR / FLUX', 'GLOBAL BREAKER', 'ACORN', 'TOUT LE RESTE']);
  assert.equal(roles.role_inversion_allowed, false);
  assert.match(roles.roles.connector, /transporte/);
  assert.match(roles.roles.breaker, /autorise ou bloque/);
  assert.match(roles.roles.acorn, /crée, possède et orchestre/);
});

test('rejects role inversion statements', () => {
  assert.equal(validateArchitectureStatement('Connector crée la tâche cognitive.').ok, false);
  assert.equal(validateArchitectureStatement('Acorn avant le Global Breaker.').ok, false);
  assert.equal(validateArchitectureStatement("Une IA s'auto-autorise.").ok, false);
});

test('accepts the canonical architecture statement', () => {
  const result = validateArchitectureStatement('AI Connector / Flux → Global Breaker → Acorn → tout le reste.');
  assert.equal(result.ok, true);
});
