/** ACORN — API HARVEST v0
 * Auto-récolte des surfaces AI developer du réseau Acorn.
 * DISCOVERED ≠ CONNECTED ≠ AUTHORIZED ≠ LIVE.
 * Jamais secret. Jamais merge. Jamais mutation de schema/agents.json.
 * CAPABILITY ≠ AUTHORITY. unpaid-first. skip mesuré ≠ stall.
 */
import { fileURLToPath } from "node:url";
import { seedDeveloperCatalog } from "./acorn-universal-developer-access.mjs";

const ISO = () => new Date().toISOString();
const clean = (v) => String(v ?? "").trim();
const arr = (v) => Array.isArray(v) ? v : [];
const present = (v) => clean(v).length > 8;

export const HARVEST_VERSION = "acorn.api-harvest.v0";

export const AI_PROVIDERS = Object.freeze([
  "openai", "anthropic", "google", "xai", "mistral", "cohere", "deepseek",
  "groq", "cerebras", "nvidia", "meta", "aws", "microsoft", "cloudflare",
  "huggingface", "openrouter", "together", "sambanova", "perplexity",
  "ollama", "fireworks"
]);

export const XAI_LIVE_SLUGS = Object.freeze([
  "grok-4.6", "grok-4.5", "grok-4.3", "grok-build-0.1", "grok-4.1-fast", "imagine", "voice"
]);
export const XAI_STALE_SLUGS = Object.freeze(["grok-2", "grok-2-mini"]);

export const SECRET_MAP = Object.freeze({
  chatgpt: "OPENAI_API_KEY",
  openai: "OPENAI_API_KEY",
  sonnet: "ANTHROPIC_API_KEY",
  fable: "ANTHROPIC_API_KEY",
  claude: "ANTHROPIC_API_KEY",
  opus: "ANTHROPIC_API_KEY",
  haiku: "HAIKU_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  google: "GEMINI_API_KEY",
  xai: "XAI_API_KEY",
  grok: "XAI_API_KEY",
  heavy: "XAI_API_KEY",
  build: "XAI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  orfree: "OPENROUTER_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  llama: "LLAMA_API_KEY",
  qwen: "QWEN_API_KEY",
  ollama: "OLLAMA_HOST",
  groq: "GROQ_API_KEY",
  cerebras: "CEREBRAS_API_KEY",
  together: "TOGETHER_API_KEY",
  sambanova: "SAMBANOVA_API_KEY",
  fireworks: "FIREWORKS_API_KEY",
  huggingface: "HF_TOKEN",
  perplexity: "PERPLEXITY_API_KEY",
  nvidia: "NVIDIA_API_KEY",
  "nvidia-nim": "NVIDIA_API_KEY",
  bedrock: "AWS_ACCESS_KEY_ID",
  "azure-openai": "AZURE_OPENAI_API_KEY",
  "workers-ai": "CLOUDFLARE_API_TOKEN"
});

export const OPENROUTER_IDS = Object.freeze([
  "orfree", "openrouter", "gemma431", "gemma426", "nemotron35", "nemotronu",
  "nemotrons", "nemotronn", "nemotroncs", "qwen3c", "gptoss20", "gptoss120",
  "northmini", "lfm26", "lagunas"
]);

export const MISSING_ROSTER_IDS = Object.freeze([
  { id: "groq", provider: "Groq", lane: "specialist", status: "declared" },
  { id: "cerebras", provider: "Cerebras", lane: "specialist", status: "declared" },
  { id: "together", provider: "Together", lane: "specialist", status: "declared" },
  { id: "sambanova", provider: "SambaNova", lane: "specialist", status: "declared" },
  { id: "fireworks", provider: "Fireworks", lane: "specialist", status: "declared" },
  { id: "huggingface", provider: "Hugging Face", lane: "generalist", status: "declared" },
  { id: "workers-ai", provider: "Cloudflare Workers AI", lane: "specialist", status: "declared" },
  { id: "bedrock", provider: "Amazon Bedrock", lane: "specialist", status: "declared" },
  { id: "azure-openai", provider: "Azure OpenAI", lane: "specialist", status: "declared" },
  { id: "nvidia-nim", provider: "NVIDIA NIM", lane: "specialist", status: "declared" },
  { id: "ollama", provider: "Ollama", lane: "generalist", status: "declared" }
]);

export function secretNameFor(id) {
  const key = clean(id).toLowerCase();
  if (SECRET_MAP[key]) return SECRET_MAP[key];
  if (OPENROUTER_IDS.includes(key) || /^(gemma|nemotron|gptoss|lfm|laguna|inkling|ling|nex|dots)/.test(key)) {
    return "OPENROUTER_API_KEY";
  }
  return null;
}

export function channelState({ id, env = {} } = {}) {
  const name = secretNameFor(id);
  if (!name) {
    return {
      id: clean(id),
      secret_name: null,
      state: "CHANNEL_NOT_PRESENT",
      reason: "NO_SECRET_MAPPING",
      stall: false,
      authority: false
    };
  }
  const value = env[name];
  if (present(value)) {
    return {
      id: clean(id),
      secret_name: name,
      state: "READY",
      reason: "SECRET_PRESENT",
      stall: false,
      authority: false
    };
  }
  return {
    id: clean(id),
    secret_name: name,
    state: "CHANNEL_NOT_PRESENT",
    reason: name === "OPENROUTER_API_KEY" ? "OPENROUTER_API_KEY_ABSENT" : "SECRET_ABSENT",
    stall: false,
    authority: false
  };
}

export function tagAiCatalog(catalog = seedDeveloperCatalog()) {
  return arr(catalog)
    .filter((x) => x && AI_PROVIDERS.includes(x.provider))
    .map((x) => ({
      ...x,
      metadata: { ...(x.metadata || {}), ai: true, surface_kind: "ai-api" },
      authority: false,
      human_authorized: false
    }));
}

export function harvestFromRoster({ roster = [], env = {} } = {}) {
  return arr(roster).map((agent) => {
    const id = clean(agent.id || agent);
    const channel = channelState({ id, env });
    return {
      contract: HARVEST_VERSION,
      id,
      provider: clean(agent.provider || id),
      roster_status: clean(agent.status || "declared"),
      lane: clean(agent.lane || ""),
      channel: channel.state,
      reason: channel.reason,
      secret_name: channel.secret_name,
      stall: false,
      authority: false,
      live: false
    };
  });
}

export function proposeRosterDelta({ roster = [], missing = MISSING_ROSTER_IDS } = {}) {
  const have = new Set(arr(roster).map((x) => clean(x.id || x).toLowerCase()));
  return arr(missing)
    .filter((row) => !have.has(clean(row.id).toLowerCase()))
    .map((row) => ({
      ...row,
      proposed: true,
      connected: false,
      live: false,
      authority: false,
      note: "DECLARED only. Canal absent jusqu'à secret Carl + merge."
    }));
}

export function probeKeyless({ env = {}, fetchImpl = null } = {}) {
  const probes = [];
  probes.push({
    surface: "catalog-seed",
    lane: "keyless",
    state: "MEASURED",
    detail: "local DEVELOPER_ECOSYSTEMS filtered ai=true",
    stall: false
  });
  probes.push({
    surface: "github-models",
    lane: "keyless",
    state: present(env.GITHUB_TOKEN) ? "READY" : "CHANNEL_NOT_PRESENT",
    detail: present(env.GITHUB_TOKEN) ? "GITHUB_TOKEN present" : "GITHUB_TOKEN absent in this frame",
    stall: false
  });
  const orKey = present(env.OPENROUTER_API_KEY);
  probes.push({
    surface: "openrouter-models",
    lane: orKey ? "free" : "keyless",
    state: orKey ? "READY" : "CHANNEL_NOT_PRESENT",
    reason: orKey ? "OPENROUTER_API_KEY_PRESENT" : "OPENROUTER_API_KEY_ABSENT",
    detail: orKey ? "may list /models" : "skip mesuré, pas stall",
    stall: false
  });
  const xaiKey = present(env.XAI_API_KEY);
  probes.push({
    surface: "xai-models",
    lane: xaiKey ? "paid" : "keyless",
    state: xaiKey ? "READY" : "CHANNEL_NOT_PRESENT",
    live_slugs: [...XAI_LIVE_SLUGS],
    stale_slugs: [...XAI_STALE_SLUGS],
    detail: xaiKey
      ? "use live slugs 2026-09-18; do not keep grok-2"
      : "skip mesuré; slugs stale FILE.md must not be rewritten here",
    stall: false
  });
  if (typeof fetchImpl === "function" && orKey) {
    probes.push({
      surface: "openrouter-fetch",
      lane: "free",
      state: "PROPOSED",
      detail: "fetch injected; caller measures HTTP; 401/402/403/404/429/503 = skip",
      stall: false
    });
  }
  return {
    contract: HARVEST_VERSION,
    probes,
    paid_api_required: false,
    stall: false,
    authority: false,
    live: false,
    measured_at: ISO()
  };
}

export function snapshotHarvest({
  env = {},
  roster = [],
  catalog = seedDeveloperCatalog()
} = {}) {
  const ai = tagAiCatalog(catalog);
  const channels = harvestFromRoster({ roster, env });
  const delta = proposeRosterDelta({ roster });
  const probe = probeKeyless({ env });
  const ready = channels.filter((x) => x.channel === "READY").map((x) => x.id);
  const absent = channels.filter((x) => x.channel === "CHANNEL_NOT_PRESENT").map((x) => x.id);
  return {
    contract: HARVEST_VERSION,
    purpose: "Discover AI developer APIs and propose roster adapters. Never merge. Never mint LIVE.",
    total_ai_surfaces: ai.length,
    by_provider: ai.reduce((acc, x) => {
      acc[x.provider] = (acc[x.provider] || 0) + 1;
      return acc;
    }, {}),
    roster_ready: ready,
    roster_channel_not_present: absent,
    proposed_roster_ids: delta.map((x) => x.id),
    proposed_count: delta.length,
    probe,
    auto_merge: false,
    authority: false,
    live: false,
    writes_schema_agents: false,
    writes: [".acorn/api-harvest.json", "proposals/agents-delta.json"],
    measured_at: ISO()
  };
}

export function harvestBundle({ env = {}, roster = [] } = {}) {
  const snapshot = snapshotHarvest({ env, roster });
  const delta = proposeRosterDelta({ roster });
  return {
    snapshot,
    delta,
    doctrine: {
      merge: "CARL",
      auto_merge: false,
      live: false,
      secret_material_present: false,
      schema_agents_json: "HOLD_HUMAN — proposal only"
    }
  };
}

export async function main(env = process.env) {
  const bundle = harvestBundle({ env, roster: [] });
  console.log(JSON.stringify(bundle.snapshot, null, 2));
  return bundle;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
