#!/usr/bin/env node
/**
 * ACORN AI / COGNITIVE CONNECTOR
 *
 * Common ingress boundary for external intelligences, models, tools and
 * future channels. The Connector transports the original human intent and
 * its ingress frame; it does not create the Acorn cognitive task.
 * Protected execution crosses the Global Breaker before Acorn creates the
 * canonical task for downstream intelligence.
 *
 * Economic identity is observed here, at the real ingress boundary, when the
 * authenticated channel supplies an actor. No fingerprinting or identity
 * guessing is performed. Connection observation is documentary; authorization
 * remains enforced by the caller/breaker and never becomes payment authority.
 */
import { assertSystemMayProceed, controlState } from "./system-breaker.mjs";
import { inspectSystems, planSystems } from "./system-automation.mjs";
import { admissionDecision, observeConnection } from "../../scripts/economic-core.mjs";

export const CONNECTOR_VERSION = "ai-connector.v2";

function connectionState(actor, channel, source, env) {
  if (!actor) {
    return {
      observed: false,
      state: "IDENTITY_PENDING",
      decision: "AUTH_REQUIRED",
      human_alert: false,
    };
  }
  const connection = observeConnection({
    actor,
    channel,
    source,
    authenticated: env.ACORN_AUTHENTICATED === "true",
    authorized: env.ACORN_AUTHORIZED === "true",
  });
  if (!connection.ok) return { observed: false, state: "REJECTED", decision: "DENY", reason: connection.code, human_alert: false };
  const decision = admissionDecision(connection);
  return {
    observed: true,
    state: connection.event.state,
    decision: decision.decision,
    reason: decision.reason,
    human_alert: decision.human_alert,
    event: connection.event,
  };
}

export function acceptIngress({ channel = "unknown", source = "unknown", actor = null, payload = null, capabilities = ["lu"], context = null, ref = "main", env = process.env } = {}) {
  const intent = typeof payload === "string" ? payload : payload?.intent ?? payload?.prompt ?? "";
  const systems = planSystems({ capabilities, env });
  const state = assertSystemMayProceed({ env, origin: source, action: `AI ingress channel=${channel}` });
  const identity = connectionState(actor, channel, source, env);
  return {
    connector: CONNECTOR_VERSION,
    accepted: true,
    channel,
    source,
    actor: actor || null,
    mode: state.mode,
    diagnostic: state.diagnostic,
    identity,
    ingress: {
      intent,
      provenance: { source, channel, ref, actor: actor || null },
      capabilities: [...new Set((Array.isArray(capabilities) ? capabilities : [capabilities]).map((x) => String(x || "").trim().toLowerCase()).filter(Boolean))],
      context,
      systems,
    },
    provenance: { source, channel, ref, actor: actor || null },
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

export function inspectIngress({ channel = "unknown", source = "unknown", actor = null, capabilities = ["lu"], env = process.env } = {}) {
  const state = controlState(env);
  const identity = connectionState(actor, channel, source, env);
  return {
    connector: CONNECTOR_VERSION,
    channel,
    source,
    actor: actor || null,
    mode: state.mode,
    breaker_closed: state.breaker_closed,
    accepted: state.mode !== "OFF",
    diagnostic: state.diagnostic,
    identity,
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
    actor: process.argv[4] || null,
  }), null, 2));
}