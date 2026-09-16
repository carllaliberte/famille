/**
 * Explicit Codex provider selection.
 * Requested provider wins. Presence of OPENROUTER_API_KEY never
 * overrides CODEX_PROVIDER=openai.
 */

export const PROVIDERS = Object.freeze(["openai", "openrouter"]);

export function normalizeProvider(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "openai" || raw === "chatgpt" || raw === "codex") return "openai";
  if (raw === "openrouter") return "openrouter";
  return "";
}

export function secretPresent(value) {
  return String(value || "").trim().length > 8;
}

export function selectCodexProvider(env = {}, opts = {}) {
  const requestedRaw = env.CODEX_PROVIDER;
  const requested = normalizeProvider(requestedRaw);
  const authPresent = Boolean(opts.authPathExists);
  const openrouterKey = secretPresent(env.OPENROUTER_API_KEY);

  if (requested === "openai") {
    return {
      requested: "openai",
      selected: "openai",
      auth_mode: authPresent ? "chatgpt-codex-session" : "openai-auth-missing",
      auth_present: authPresent,
      available: authPresent,
      use_openrouter_proxy: false,
      implicit: false,
    };
  }

  if (requested === "openrouter") {
    return {
      requested: "openrouter",
      selected: "openrouter",
      auth_mode: openrouterKey ? "openrouter-api-key" : "openrouter-key-missing",
      auth_present: openrouterKey,
      available: openrouterKey,
      use_openrouter_proxy: openrouterKey,
      implicit: false,
    };
  }

  // Unset / unknown: keep previous implicit routing so existing tests hold.
  let selected = "none";
  let auth_mode = "none";
  let available = false;
  let use_openrouter_proxy = false;
  if (authPresent && openrouterKey) {
    selected = "openai";
    auth_mode = "chatgpt-codex-session+openrouter";
    available = true;
    use_openrouter_proxy = false;
  } else if (authPresent) {
    selected = "openai";
    auth_mode = "chatgpt-codex-session";
    available = true;
  } else if (openrouterKey) {
    selected = "openrouter";
    auth_mode = "openrouter-api-key";
    available = true;
    use_openrouter_proxy = true;
  }

  return {
    requested: requested || "",
    selected,
    auth_mode,
    auth_present: authPresent || openrouterKey,
    available,
    use_openrouter_proxy,
    implicit: true,
  };
}

export function wrapperShouldProxy(env = {}, configHasOpenrouter = false) {
  const requested = normalizeProvider(env.CODEX_PROVIDER);
  if (requested === "openai") return false;
  if (!secretPresent(env.OPENROUTER_API_KEY)) return false;
  if (requested === "openrouter") return true;
  return Boolean(configHasOpenrouter);
}
