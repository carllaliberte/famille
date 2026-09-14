#!/usr/bin/env node
/**
 * ACORN AI / COGNITIVE CONNECTOR
 *
 * One common ingress boundary for external intelligences, models, tools and
 * future channels. The connector is deliberately channel-neutral: a future
 * quantum source is just another channel and does not get a privileged path.
 * Every ingress must cross the global breaker before reaching orchestration or
 * the protected source-of-record domain.
 */
import { assertSystemMayProceed, controlState } from "./system-breaker.mjs";

export const CONNECTOR_VERSION = "ai-connector.v1";

export function acceptIngress({ channel = "unknown", source = "unknown", payload = null, env = process.env } = {}) {
  const state = assertSystemMayProceed({ env, origin: source, action: `AI ingress channel=${channel}` });
  return {
    connector: CONNECTOR_VERSION,
    accepted: true,
    channel,
    source,
    mode: state.mode,
    diagnostic: state.diagnostic,
    provenance: { source, channel },
    payload,
    production_write_allowed: false,
    auto_merge: false,
    live: false,
    human_authority: "carl",
  };
}

export function inspectIngress({ channel = "unknown", source = "unknown", env = process.env } = {}) {
  const state = controlState(env);
  return {
    connector: CONNECTOR_VERSION,
    channel,
    source,
    mode: state.mode,
    breaker_closed: state.breaker_closed,
    accepted: state.mode !== "OFF",
    diagnostic: state.diagnostic,
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
