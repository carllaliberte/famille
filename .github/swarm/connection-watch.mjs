#!/usr/bin/env node
/**
 * ACORN CONNECTION WATCH
 *
 * A connection is a measured ingress event, not a roster entry.
 * Roster membership != connected != called != executed.
 * The watcher records provenance and prepares immediate human notification.
 * It never grants authority, writes source, merges, or claims LIVE.
 */
import { lookup } from "./flux.mjs";

export const CONNECTION_WATCH_VERSION = "connection-watch.v0";

function iso(value) {
  const s = String(value || "");
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function clean(value, fallback = "unknown") {
  const s = String(value ?? "").trim();
  return s || fallback;
}

export function observeConnection(input = {}) {
  const actor = clean(input.actor);
  const channel = clean(input.channel);
  const source = clean(input.source);
  const roster = lookup(actor);
  const authorized = roster ? roster.enabled !== false : false;
  const event = {
    schema: CONNECTION_WATCH_VERSION,
    event: "CONNECTION_DETECTED",
    observed: true,
    actor,
    identified: Boolean(roster),
    kind: roster?.kind || "unknown",
    authorized,
    channel,
    source,
    at: iso(input.at),
    provenance: {
      source: "connection-watch",
      operation: "observe-connection",
      actor,
      channel,
      ref: clean(input.ref, "main"),
    },
    permissions: {
      production_write_allowed: false,
      auto_merge: false,
      live: false,
      human_authority: "carl",
    },
  };
  event.alert = {
    required: true,
    severity: roster && authorized ? "INFO" : "SECURITY",
    state: "PROPOSED",
    delivered: false,
    channels: ["github", "sms"],
  };
  return event;
}

export function formatConnectionAlert(event) {
  if (!event?.observed) return "";
  const identity = event.identified ? event.actor : `${event.actor} (UNKNOWN)`;
  const auth = event.authorized ? "authorized" : "NOT_AUTHORIZED";
  return `ACORN CONNECTION — ${identity} — ${auth} — channel=${event.channel} — source=${event.source} — at=${event.at}`;
}

export function alertPayload(event) {
  return {
    type: "ACORN_CONNECTION",
    severity: event.alert.severity,
    message: formatConnectionAlert(event),
    event,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [actor = "unknown", channel = "unknown", source = "cli"] = process.argv.slice(2);
  console.log(JSON.stringify(observeConnection({ actor, channel, source }), null, 2));
}
