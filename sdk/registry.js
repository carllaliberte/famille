/** Survivable register. Not a vault. Not eternal. */
import { createHash } from "node:crypto";
import {
  recordDiscovery, evolveDiscovery, rewriteOrigin, eraseOrigin, FOUNDER,
} from "./discovery.js";
import { breakerBlocks } from "./open-intelligence.js";

export function canonical(disc) {
  const body = {
    discovery_id: disc.discovery_id,
    title: disc.title,
    originator: disc.originator,
    created_at: disc.created_at,
    version: disc.version,
    status: disc.status,
  };
  return JSON.stringify(body);
}

export function hashRecord(disc) {
  const c = canonical(disc);
  const hex = createHash("sha256").update(c).digest("hex");
  return {
    ...disc,
    content_hash: hex,
    hash_algorithm: "sha-256",
    hash_proves_truth: false,
    timestamp_status: "UNVERIFIED",
    signature_status: "SIGNATURE_NOT_IMPLEMENTED",
  };
}

export function reanchor(disc, algorithm = "sha-256") {
  if (breakerBlocks("registry.reanchor") && algorithm !== "sha-256") {
    return { ...disc, blocked: true };
  }
  const prev = disc.content_hash || hashRecord(disc).content_hash;
  const layer = createHash("sha256").update(`${algorithm}:${prev}`).digest("hex");
  return {
    ...disc,
    content_hash: disc.content_hash || prev,
    reanchor_history: [...(disc.reanchor_history || []), {
      algorithm, layer, previous: prev, original_untouched: true,
    }],
    crypto_status: algorithm === "sha-256" ? "CURRENT" : "REANCHOR_REQUIRED",
  };
}

export function exportPlain(disc) {
  const h = hashRecord(disc);
  return [
    "ACORN HISTORICAL RECORD",
    `Discovery ID: ${h.discovery_id}`,
    `Title: ${h.title}`,
    `Originator: ${h.originator}`,
    `Date: ${h.created_at}`,
    `Status: ${h.status}`,
    `Hash: ${h.content_hash}`,
    `Hash algorithm: ${h.hash_algorithm}`,
    `Signature: ${h.signature_status}`,
    `Timestamp: ${h.timestamp_status}`,
    `Collective benefit: ${h.collective_benefit}`,
    `Attribution: ${h.historical_attribution}`,
  ].join("\n");
}

export function independentRediscovery(original, { who, when } = {}) {
  const rec = recordDiscovery({
    title: original.title,
    created_at: when,
    contributors: [{ id: who, role: "independent_origin" }],
  });
  return {
    ...rec,
    relation: "INDEPENDENT_REDISCOVERY",
    derived_from: original.discovery_id,
    independent_origin: who,
    originator: who,
    historical_attribution: `${who} (independent of ${FOUNDER.originator})`,
    not_reassigned_to_founder: true,
  };
}

export function archiveRef() {
  return { status: "NOT_CONNECTED", archive_existence: false };
}

export function survivability() {
  return {
    copies: 1,
    independent_archives: 0,
    eternal: false,
    immortal: false,
    years_50: "HYPOTHESIS",
    years_500: "HYPOTHESIS",
    years_5000: "HYPOTHESIS",
    format_dependence: ["json", "utf8"],
    carl_required_alive: false,
    acorn_runtime_required_to_read_export: false,
  };
}

export { recordDiscovery, evolveDiscovery, rewriteOrigin, eraseOrigin, FOUNDER };
