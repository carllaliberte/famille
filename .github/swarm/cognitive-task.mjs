#!/usr/bin/env node
/**
 * ACORN COGNITIVE TASK
 *
 * Acorn owns creation of the one canonical cognitive task after the
 * Connector has transported the original human intent and the Global
 * Breaker has authorized protected execution.
 * Every intelligence consumes the same task without the human translating
 * it between systems.
 *
 * Cortex is invoked here as the cognitive-network planning surface. It does
 * not grant authority or execute providers; it records the task's cognitive
 * session so downstream runtime can continue through the same provenance and
 * governance contract.
 */
import { planAdaptiveCadence } from "./adaptive-cadence.mjs";
import { createCortexSession, recordStage } from "./cortex.mjs";
import { createCognitiveContract } from "./cognitive-contract.mjs";

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
  demand = {},
  safety = {},
  currentCadence = 0.25,
  env = process.env,
} = {}) {
  const requested = [...new Set((Array.isArray(capabilities) ? capabilities : [capabilities])
    .map((x) => clean(x).toLowerCase())
    .filter(Boolean))];
  const breaker = clean(env?.ACORN_SYSTEM_MODE, "RUN").toUpperCase();
  const cadence = planAdaptiveCadence({ demand, safety, currentCadence, breaker });
  const cortexCreated = createCortexSession({
    objective: clean(intent),
    required_capabilities: requested,
    context: Array.isArray(context) ? context : context == null ? [] : [String(context)],
    at: new Date().toISOString(),
  });
  const cortexSession = cortexCreated.ok
    ? recordStage(cortexCreated.session, "OBSERVE", {
        status: "created",
        summary: "canonical cognitive task entered Acorn Cortex",
      }).session
    : null;

  const cognitiveContract = createCognitiveContract({
    identity: "acorn-cortex",
    model: "cognitive-task",
    channel: clean(channel, "unknown"),
    intent: clean(intent),
    capabilities: requested,
    context,
    provenance: { source, ref },
    authority: { breaker: "HUMAN_CONTROLLED" },
  });

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
    cadence,
    cortex: {
      version: "cortex.v0",
      invoked: cortexCreated.ok,
      session: cortexSession,
    },
    cognitive_contract: cognitiveContract,
    governance: {
      human_authority: "carl",
      production_write_allowed: false,
      auto_merge: false,
      live: false,
      execution_requires_breaker: true,
      breaker_authority: "human_only",
    },
    environment: {
      system_mode: breaker,
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
    `Cadence: ${value.cadence?.next_cadence ?? 0.25}`,
    `Cortex: ${value.cortex?.invoked ? "invoked" : "not invoked"}`,
    `Cognitive contract: ${value.cognitive_contract?.contract || "missing"} / ${value.cognitive_contract?.state || "unknown"}`,
    "Governance: human_authority=carl; production_write_allowed=false; auto_merge=false; live=false; breaker_authority=human_only.",
    "Execution must remain behind the Global Breaker.",
    "Do not reinterpret the task into a different objective. Report what was actually done, tested, blocked, or left unchanged.",
  ].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(createCognitiveTask({ intent: process.argv.slice(2).join(" ") }), null, 2));
}
