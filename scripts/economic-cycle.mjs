#!/usr/bin/env node
/**
 * ACORN ECONOMIC NETWORK CYCLE
 * Reconciles connection observations, verified usage, commercial state,
 * pricing rules and billing candidates in one dated documentary snapshot.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { economicSnapshot, observeConnection, meterExecution } from "./economic-core.mjs";

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

const usage = [];
for (const account of Array.isArray(usageDoc.accounts) ? usageDoc.accounts : []) {
  if (!account?.actor || !account?.measured_usage) continue;
  const measured = meterExecution({
    actor: account.actor,
    execution_id: `aggregate:${account.actor}:${account.last_seen || "unknown"}`,
    capability: "aggregate-verified-usage",
    channel: "identity-usage-commerce",
    executions: account.executions,
    work_units: account.work_units,
    duration_ms: account.duration_ms,
    executed: true,
    verified: true,
    at: account.last_seen,
  });
  if (measured.ok) usage.push(measured);
}

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
writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify(snapshot, null, 2));
