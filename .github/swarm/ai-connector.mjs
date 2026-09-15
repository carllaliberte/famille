#!/usr/bin/env node
/**
 * ACORN AI / COGNITIVE CONNECTOR
 *
 * Common ingress boundary for external intelligences, models, tools and
 * future channels. The Connector transports the original human intent and
 * its ingress frame; it does not create the Acorn cognitive task.
 * Protected execution crosses the Global Breaker before Acorn creates the
 * canonical task for downstream intelligence.
 */
import { assertSystemMayProceed, controlState } from "./system-breaker.mjs";
import { inspectSystems, planSystems } from "./system-automation.mjs";

export const CONNECTOR_VERSION = "ai-connector.v1";

export function acceptIngress({ channel = "unknown", source = "unknown", payload = null, capabilities = ["lu"], context = null, ref = "main", env = process.env } = {}) {
  const intent = typeof payload === "string" ? payload : payload?.intent ?? payload?.prompt ?? "";
  const systems = planSystems({ capabilities, env });
  const state = assertSystemMayProceed({ env, origin: source, action: `AI ingress channel=${channel}` });
  return {
    connector: CONNECTOR_VERSION,
    accepted: true,
    channel,
    source,
    mode: state.mode,
    diagnostic: state.diagnostic,
    ingress: {
      intent,
      provenance: { source, channel, ref },
      capabilities: [...new Set((Array.isArray(capabilities) ? capabilities : [capabilities]).map((x) => String(x || "").trim().toLowerCase()).filter(Boolean))],
      context,
      systems,
    },
    provenance: { source, channel, ref },
    payload,
    systems: { ...systems, execution_requires_breaker: true },
    production_write_allowed: false,
    auto_merge: false,
    live: false,
    human_authority: "carl",
    task_owner: "acorn",
    task_created_by_connector: false,
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
    task_owner: "acorn",
    task_created_by_connector: false,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(inspectIngress({
    channel: process.argv[2] || "generic-ai",
    source: process.argv[3] || "unknown",
  }), null, 2));
}
