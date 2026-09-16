/** OpenRouter model path for Codex worker. No new kernel.
 * Measured 2026-09-16 run 35081216861: nemotron-3.5-lightning:free → NETWORK/429.
 */
export const OPENROUTER_FREE_MODEL = "cohere/north-mini-code:free";
export const OPENROUTER_DEAD_FREE = Object.freeze([
  "openai/gpt-oss-20b:free",
  "openai/gpt-oss-120b:free",
  "openrouter/free",
  "nvidia/nemotron-3.5-lightning:free",
]);

export function resolveOpenRouterModel(env = {}) {
  const requested = String(env.CODEX_MODEL || "").trim();
  if (requested && !OPENROUTER_DEAD_FREE.includes(requested)) return requested;
  return OPENROUTER_FREE_MODEL;
}
