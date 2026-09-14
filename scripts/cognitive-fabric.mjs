#!/usr/bin/env node
/**
 * ACORN COGNITIVE FABRIC
 * Deterministic routing and synapse accounting between the common AI connector
 * and the bounded worker. No provider is privileged; no route grants write,
 * merge, LIVE, or human-decision authority.
 */
import { acceptIngress } from "../.github/swarm/ai-connector.mjs";

export const FABRIC_VERSION = "cognitive-fabric.v4";

export function routeIngress({ channel = "generic-ai", source = "unknown", capability = "review", context = {}, env = process.env } = {}) {
  const ingress = acceptIngress({ channel, source, payload: { capability, context }, env });
  return {
    fabric: FABRIC_VERSION,
    connector: ingress.connector,
    route: { channel, source, capability },
    context,
    provenance: ingress.provenance,
    state: "DISPATCHABLE",
    production_write_allowed: false,
    auto_merge: false,
    live: false,
    human_authority: "carl",
  };
}

export function makeSynapse({ route, task, front }) {
  return {
    v: "synapse.v1",
    id: `${front.sha}:${route.source}:${route.capability}`.slice(0, 160),
    state: "PROPOSED",
    source: route.source,
    channel: route.channel,
    capability: route.capability,
    task,
    front: { number: front.number, sha: front.sha },
    provenance: route.provenance,
    stages: ["PROPOSED", "DISPATCHED", "RECEIVED", "WORKING", "RETURNED", "MEASURED"],
    objection: null,
    correction: null,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function composeFabric({ fronts = [], sources = [], env = process.env } = {}) {
  const routes = [];
  const synapses = [];
  for (const front of fronts) {
    for (const source of sources) {
      const route = routeIngress({
        channel: source.channel,
        source: source.id,
        capability: source.capability || "review",
        context: { front_sha: front.sha, front_number: front.number },
        env,
      });
      routes.push(route);
      synapses.push(makeSynapse({ route, task: "review", front }));
    }
  }
  return {
    fabric: FABRIC_VERSION,
    routes,
    synapses,
    route_count: routes.length,
    synapse_count: synapses.length,
    collective: sources.length > 1,
    live: false,
    auto_merge: false,
    human_decision: "PENDING_HUMAN",
    authority: "carl",
  };
}
