/**
 * Siège local — une mesure, pas un slogan.
 * REAL = 1 seulement si HTTP 2xx et texte non vide.
 * Daemon DOWN / secret vide / 4xx = skip ou REAL=0, jamais un fail CI.
 * Séquentiel seulement. Jamais 3 POST Ollama simultanés.
 */

export function siege({
  nom = "",
  present = false,
  chaud = false,
  http = 0,
  text = "",
  skipped = false,
  error = "",
  ms = null,
} = {}) {
  const body = String(text || "").trim();
  const code = Number(http) || 0;
  const hasError = Boolean(error);
  const real =
    !skipped &&
    !hasError &&
    code >= 200 &&
    code < 300 &&
    body.length > 0
      ? 1
      : 0;
  return Object.freeze({
    nom: String(nom || ""),
    present: Boolean(present),
    chaud: Boolean(chaud),
    http: code,
    real,
    ms: ms == null || ms === "" ? null : Number(ms),
    text: body,
    skipped: Boolean(skipped),
    error: hasError ? String(error) : "",
  });
}

export function realOf(row) {
  return siege(row).real;
}

/** Daemon absent → skip propre. Pas un throw. Pas un fail. */
export function ifDaemonDown(up) {
  if (up) return { skipped: false, reason: "" };
  return { skipped: true, reason: "ollama absent" };
}
