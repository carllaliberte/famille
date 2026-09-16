#!/usr/bin/env node
/**
 * ACORN ECONOMIC NETWORK CYCLE
 * Reconciles connection observations, verified usage, commercial state,
 * pricing rules and billing candidates in one dated documentary snapshot.
 * No synthetic execution is created during reconciliation.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { economicSnapshot, observeConnection } from "./economic-core.mjs";

const usagePath = process.env.USAGE_COMMERCE || "identity-usage-commerce.json";
const connectionPath = process.env.CONNECTION_EVIDENCE || "connection-evidence.json";
const pricingPath = process.env.ECONOMIC_PRICING || "schema/economic-pricing.v0.json";
const outputPath = process.env.ECONOMIC_SNAPSHOT || "economic-network-snapshot.json";

function readJson(path, fallback) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

const usageDoc = readJson(usagePath, {});
const connectionDoc = readJson(connectionPath, {});
const pricing = readJson(pricingPath, {});

const connections = [];
for (const raw of Array.isArray(connectionDoc.connections) ? connectionDoc.connections : []) {
  const observed = observeConnection(raw);
  if (observed.ok) connections.push(observed);
}

const usage = (Array.isArray(usageDoc.usage_events) ? usageDoc.usage_events : [])
  .filter((event) => event?.event === "USAGE_MEASURED" && event?.verified === true)
  .map((event) => ({ ok: true, event }));

const accounts = Object.fromEntries(
  (Array.isArray(usageDoc.accounts) ? usageDoc.accounts : []).map((a) => [a.actor, {
    commercial_state: a.commercial_state || "FREE",
  }]),
);

const snapshot = economicSnapshot({ connections, usage, accounts, pricing });
snapshot.source = {
  usage: usagePath,
  connections: connectionPath,
  pricing: pricingPath,
};
snapshot.observed_at = new Date().toISOString();
snapshot.truth.reconciliation_creates_execution = false;
snapshot.truth.usage_source = "raw_verified_usage_events";
writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify(snapshot, null, 2));
