#!/usr/bin/env node
/**
 * ACORN AI / COGNITIVE CONNECTOR
 *
 * Common ingress boundary for external intelligences, models, tools and
 * future channels. System automation lives here; protected execution then
 * crosses the Global Breaker immediately after this layer.
 */
import { assertSystemMayProceed, controlState } from "./system-breaker.mjs";
import { inspectSystems, planSystems } from "./system-automation.mjs";
import { createCognitiveTask } from "./cognitive-task.mjs";

export const CONNECTOR_VERSION = "ai-connector.v1";

export function acceptIngress({ channel = "unknown", source = "unknown", payload = null, capabilities = ["lu"], context = null, ref = "main", env = process.env } = {}) {
  const intent = typeof payload === "string" ? payload : payload?.intent ?? payload?.prompt ?? "";
  const task = createCognitiveTask({ intent, source, channel, ref, capabilities, context, env });
  const systems = planSystems({ capabilities, env });
  const state = assertSystemMayProceed({ env, origin: source, action: `AI ingress channel=${channel}` });
  return {
    connector: CONNECTOR_VERSION,
    accepted: true,
    channel,
    source,
    mode: state.mode,
    diagnostic: state.diagnostic,
    task,
    systems,
    provenance: { source, channel, ref },
    payload,
    production_write_allowed: false,
    auto_merge: false,
    live: false,
    human_authority: "carl",
  };
}

export function inspectIngress({ channel = "unknown", source = "unknown", capabilities = ["lu"], env = process.env } = {}) {
  const state = controlState(env);
  return {
    connector: CONNECTOR_VERSION,
    channel,
    source,
    mode: state.mode,
    breaker_closed: state.breaker_closed,
    accepted: state.mode !== "OFF",
    diagnostic: state.diagnostic,
    systems: planSystems({ capabilities, env }),
    system_inventory: inspectSystems({ env }),
    production_write_allowed: false,
    auto_merge: false,
    live: false,
    human_authority: "carl",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(inspectIngress({
    channel: process.argv[2] || "generic-ai",
    source: process.argv[3] || "unknown",
  }), null, 2));
}
