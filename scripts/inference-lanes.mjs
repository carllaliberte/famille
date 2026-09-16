#!/usr/bin/env node
/**
 * ACORN INFERENCE LANES — unpaid first.
 *
 * KEYLESS (ollama, GitHub Models via GITHUB_TOKEN, local Cortex)
 * → FREE (OpenRouter :free models)
 * → PAID (native OpenAI/Anthropic/xAI/Gemini)
 *
 * Missing paid key is CHANNEL_NOT_PRESENT, not a stall.
 * A free-model row is not keyless: OpenRouter still needs its key.
 * LIVE is never minted here.
 */
export const LANES = Object.freeze(["keyless", "free", "paid"]);
export const FREE_DISPATCH_CAP = 3;
export const KEYLESS_DISPATCH_CAP = 2;

function present(env, key) {
  return String(env?.[key] || "").trim().length > 0;
}

function githubToken(env = {}) {
  return present(env, "GITHUB_TOKEN") || present(env, "GH_TOKEN");
}

export function isFreeModel(spec = {}) {
  const model = String(spec.model || "");
  return spec.id === "orfree"
    || spec.lane === "free"
    || model.includes(":free")
    || model.endsWith("/free");
}

export function classifyLane(spec = {}) {
  if (spec.lane && LANES.includes(spec.lane)) return spec.lane;
  const provider = String(spec.provider || "");
  const secret = String(spec.secret || "");
  if (provider === "ollama" || provider === "github-models" || secret === "OLLAMA_HOST" || secret === "GITHUB_TOKEN") {
    return "keyless";
  }
  if (isFreeModel(spec)) return "free";
  return "paid";
}

export function secretAvailable(spec = {}, env = {}) {
  if (present(env, spec.secret)) return true;
  if (spec.secret === "GITHUB_TOKEN" && githubToken(env)) return true;
  if (present(env, "OPENROUTER_API_KEY") && isFreeModel(spec) && spec.secret === "OPENROUTER_API_KEY") return true;
  return false;
}

export function preferUnpaid(specs = [], env = {}, { freeCap = FREE_DISPATCH_CAP, keylessCap = KEYLESS_DISPATCH_CAP } = {}) {
  const available = (specs || []).filter((spec) => secretAvailable(spec, env));
  const keyless = available.filter((spec) => classifyLane(spec) === "keyless").slice(0, keylessCap);
  const free = available.filter((spec) => classifyLane(spec) === "free").slice(0, freeCap);
  const paid = available.filter((spec) => classifyLane(spec) === "paid");
  const unpaid = [...keyless, ...free];
  const selected = unpaid.length ? unpaid : paid;
  return {
    version: "inference-lanes.v1",
    selected: selected.map((spec) => spec.id),
    skipped_paid: unpaid.length ? paid.map((spec) => spec.id) : [],
    lanes: {
      keyless: keyless.map((spec) => spec.id),
      free: free.map((spec) => spec.id),
      paid: paid.map((spec) => spec.id),
    },
    paid_required: unpaid.length === 0 && paid.length > 0,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function laneInventory(env = {}) {
  return {
    version: "inference-lanes.v1",
    keyless: {
      ollama: present(env, "OLLAMA_HOST"),
      github_models: githubToken(env),
      cortex_local: true,
    },
    free: {
      openrouter: present(env, "OPENROUTER_API_KEY"),
    },
    paid: {
      openai: present(env, "OPENAI_API_KEY"),
      anthropic: present(env, "ANTHROPIC_API_KEY"),
      xai: present(env, "XAI_API_KEY"),
      gemini: present(env, "GEMINI_API_KEY"),
    },
    default: present(env, "OLLAMA_HOST") || githubToken(env)
      ? "keyless"
      : present(env, "OPENROUTER_API_KEY")
        ? "free"
        : "keyless",
    paid_required: false,
    live: false,
  };
}
