#!/usr/bin/env node
/**
 * ACORN COGNITIVE TASK
 *
 * Acorn owns creation of the one canonical cognitive task after the
 * Connector has transported the original human intent and the Global
 * Breaker has authorized protected execution.
 * Every intelligence consumes the same task without the human translating
 * it between systems.
 */
export const COGNITIVE_TASK_VERSION = "cognitive-task.v1";

const clean = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

export function createCognitiveTask({
  intent = "",
  source = "unknown",
  channel = "unknown",
  ref = "main",
  capabilities = ["lu"],
  context = null,
  env = process.env,
} = {}) {
  const requested = [...new Set((Array.isArray(capabilities) ? capabilities : [capabilities])
    .map((x) => clean(x).toLowerCase())
    .filter(Boolean))];

  return {
    task: COGNITIVE_TASK_VERSION,
    owner: "acorn",
    intent: clean(intent),
    provenance: {
      source: clean(source, "unknown"),
      channel: clean(channel, "unknown"),
      ref: clean(ref, "main"),
    },
    capabilities: requested,
    context,
    governance: {
      human_authority: "carl",
      production_write_allowed: false,
      auto_merge: false,
      live: false,
      execution_requires_breaker: true,
    },
    environment: {
      system_mode: clean(env?.ACORN_SYSTEM_MODE, "RUN").toUpperCase(),
    },
    state: "RECEIVED",
  };
}

export function taskPrompt(task) {
  const value = task || {};
  return [
    "ACORN TASK — preserve the original human intent exactly.",
    `Owner: ${clean(value.owner, "acorn")}`,
    `Intent: ${clean(value.intent)}`,
    `Source: ${clean(value.provenance?.source, "unknown")}`,
    `Channel: ${clean(value.provenance?.channel, "unknown")}`,
    `Ref: ${clean(value.provenance?.ref, "main")}`,
    `Capabilities: ${(value.capabilities || []).join(", ") || "none"}`,
    "Governance: human_authority=carl; production_write_allowed=false; auto_merge=false; live=false.",
    "Execution must remain behind the Global Breaker.",
    "Do not reinterpret the task into a different objective. Report what was actually done, tested, blocked, or left unchanged.",
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(createCognitiveTask({ intent: process.argv.slice(2).join(" ") }), null, 2));
}
