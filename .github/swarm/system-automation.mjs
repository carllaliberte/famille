#!/usr/bin/env node
/** ACORN SYSTEM AUTOMATION — connector-side planning only. Secrets never exposed. */
export const SYSTEM_AUTOMATION_VERSION = "system-automation.v1";
const SYSTEMS = Object.freeze([
  { id: "xai", key: "XAI_API_KEY", capabilities: ["grok", "build", "review", "lu"], priority: 10 },
  { id: "openai", key: "OPENAI_API_KEY", capabilities: ["reason", "review", "build", "lu"], priority: 20 },
  { id: "anthropic", key: "ANTHROPIC_API_KEY", capabilities: ["reason", "review", "build", "lu"], priority: 30 },
  { id: "google", key: "GEMINI_API_KEY", capabilities: ["reason", "review", "lu"], priority: 40 },
  { id: "openrouter", key: "OPENROUTER_API_KEY", capabilities: ["model", "fallback", "lu"], priority: 50 },
]);
const hasCredential = (env, key) => typeof env?.[key] === "string" && env[key].trim().length > 0;
const describe = (s, env) => ({ id: s.id, capabilities: [...s.capabilities], priority: s.priority, credential: { configured: hasCredential(env, s.key), key_name: s.key, value_exposed: false } });
export function inspectSystems({ env = process.env } = {}) {
  const systems = SYSTEMS.map((s) => describe(s, env));
  return { automation: SYSTEM_AUTOMATION_VERSION, systems, configured: systems.filter((s) => s.credential.configured).map((s) => s.id), unconfigured: systems.filter((s) => !s.credential.configured).map((s) => s.id), executable: [], executed: [], ready_for_execution: false, execution_requires_breaker: true, production_write_allowed: false, auto_merge: false, live: false, human_authority: "carl" };
}
export function routeSystem({ capability = "lu", env = process.env } = {}) {
  const wanted = String(capability || "lu").toLowerCase();
  const candidates = SYSTEMS.filter((s) => s.capabilities.includes(wanted) && hasCredential(env, s.key)).sort((a, b) => a.priority - b.priority);
  return { automation: SYSTEM_AUTOMATION_VERSION, capability: wanted, selected: candidates[0] ? describe(candidates[0], env) : null, candidates: candidates.map((s) => s.id), fallback_available: candidates.length > 1, execution_requires_breaker: true, production_write_allowed: false, auto_merge: false, live: false, human_authority: "carl" };
}
export function planSystems({ capabilities = ["lu"], env = process.env } = {}) {
  const requested = [...new Set((Array.isArray(capabilities) ? capabilities : [capabilities]).map((x) => String(x || "lu").toLowerCase()))];
  return { automation: SYSTEM_AUTOMATION_VERSION, requested_capabilities: requested, routes: requested.map((capability) => routeSystem({ capability, env })), configured_count: inspectSystems({ env }).configured.length, ready_for_execution: false, execution_requires_breaker: true, production_write_allowed: false, auto_merge: false, live: false, human_authority: "carl" };
}
export function credentialAction({ system, env = process.env } = {}) {
  const row = SYSTEMS.find((s) => s.id === String(system || "").toLowerCase());
  if (!row) return { ok: false, code: "UNKNOWN_SYSTEM" };
  const configured = hasCredential(env, row.key);
  return { ok: true, system: row.id, configured, action: configured ? "USE_EXISTING_CREDENTIAL" : "HUMAN_CONFIGURATION_REQUIRED", key_name: row.key, value_exposed: false, automated_provisioning: false, production_write_allowed: false, auto_merge: false, live: false, human_authority: "carl" };
}
