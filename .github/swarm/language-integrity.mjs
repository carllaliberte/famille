#!/usr/bin/env node
/**
 * ACORN LANGUAGE INTEGRITY
 *
 * Deterministic guard for malformed language and architecture role inversion.
 * It never rewrites the original intent; it reports and blocks malformed representation.
 */
export const LANGUAGE_INTEGRITY_VERSION = "language-integrity.v1";
const FORBIDDEN_PHRASES = Object.freeze(["s'aplatissait", "s’aplatissait"]);
const ARCHITECTURE = Object.freeze(["AI CONNECTOR / FLUX", "GLOBAL BREAKER", "ACORN", "TOUT LE RESTE"]);
const normalize = (value) => String(value ?? "").normalize("NFKC").replace(/[’]/g, "'").trim();

export function inspectLanguage(text) {
  const value = normalize(text).toLowerCase();
  const findings = FORBIDDEN_PHRASES.filter((phrase) => value.includes(normalize(phrase).toLowerCase())).map((phrase) => ({ code: "FORBIDDEN_PHRASE", phrase }));
  return { version: LANGUAGE_INTEGRITY_VERSION, ok: findings.length === 0, findings };
}

export function assertLanguageIntegrity(text) {
  const result = inspectLanguage(text);
  if (!result.ok) throw new Error(`LANGUAGE_INTEGRITY_BLOCKED ${result.findings.map((x) => `${x.code}:${x.phrase}`).join(", ")}`);
  return true;
}

export function architectureRoles() {
  return {
    version: LANGUAGE_INTEGRITY_VERSION,
    order: [...ARCHITECTURE],
    roles: {
      connector: "transporte l'intention et le cadre d'entrée",
      breaker: "autorise ou bloque le passage protégé",
      acorn: "crée, possède et orchestre la tâche cognitive",
      downstream: "travaille sur la tâche, mesure et rapporte",
      human: "Carl reste l'autorité et la décision finale",
    },
    role_inversion_allowed: false,
  };
}

export function validateArchitectureStatement(statement) {
  const value = normalize(statement).toLowerCase();
  const errors = [];
  if (value.includes("connector") && (value.includes("crée la tâche") || value.includes("cree la tache"))) errors.push("CONNECTOR_MUST_NOT_CREATE_TASK");
  if (value.includes("acorn") && value.includes("avant le global breaker")) errors.push("ACORN_MUST_REMAIN_AFTER_BREAKER");
  if (value.includes("ia") && (value.includes("s'auto-autorise") || value.includes("s'auto autorise"))) errors.push("INTELLIGENCE_MUST_NOT_SELF_AUTHORIZE");
  return { version: LANGUAGE_INTEGRITY_VERSION, ok: errors.length === 0, errors, order: [...ARCHITECTURE] };
}
