/**
 * Provider-neutral nodes. Core does not belong to OpenAI / Anthropic / Google / xAI.
 * AI_WRITE is always forbidden. READY requires a real key in env, never a config claim.
 */
import { ROSTER_DOC } from "./flux.mjs";

export const PROVIDERS_VERSION = "providers.v0";
export const AI_WRITE = false;
export const HUMAN_WRITE = true;

function keyName(id) {
  return `${String(id || "").toUpperCase().replace(/[^A-Z0-9]/g, "_")}_API_KEY`;
}

export function nodeOf(agent = {}, env = {}) {
  const id = String(agent.id || "");
  const human = agent.kind === "seat" && id === "carl";
  const key = keyName(id);
  const keyed = Boolean(env[key] && String(env[key]).length > 8);
  let status = "REGISTERED";
  if (human) status = "HUMAN";
  else if (keyed) status = "READY";
  else if (String(agent.status || "").toLowerCase() === "auto") status = "CONFIGURED";
  else status = "REGISTERED";
  return {
    node_id: id,
    provider: agent.provider || "unspecified",
    model: agent.id,
    capabilities: agent.capabilities || [],
    specialty: agent.specialty || "",
    status,
    write_scope: human ? "HUMAN_WRITE" : "DENIED",
    merge: false,
    secret_access: false,
    fake_ready: false,
  };
}

export function mesh(roster = ROSTER_DOC, env = {}) {
  const agents = Array.isArray(roster.agents) ? roster.agents : [];
  const rows = agents.map((a) => nodeOf(a, env));
  return {
    ok: true,
    v: PROVIDERS_VERSION,
    rows,
    ready: rows.filter((r) => r.status === "READY").map((r) => r.node_id),
    registered: rows.filter((r) => r.status === "REGISTERED").map((r) => r.node_id),
    ai_write: AI_WRITE,
    human_write: HUMAN_WRITE,
    auto_merge: false,
    live: false,
  };
}

/** In-memory only. Never writes agents.json. Core unchanged. */
export function register(extra = {}, roster = ROSTER_DOC, env = {}) {
  const copy = {
    agents: [...(roster.agents || []), extra],
  };
  return mesh(copy, env);
}

export function mayWrite(node) {
  if (!node) return false;
  if (node.write_scope === "HUMAN_WRITE" && node.node_id === "carl") return true;
  return false;
}

export function board(m = mesh()) {
  const n = m.rows || [];
  return [
    `nodes: ${n.length}`,
    `ready: ${m.ready.length}`,
    `registered: ${m.registered.length}`,
    `ai_write: DENIED`,
    `merge: Carl only`,
  ].join("\n");
}
