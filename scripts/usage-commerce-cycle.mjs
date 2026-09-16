#!/usr/bin/env node
/**
 * Turns measured worker evidence into a commercial-review ledger.
 * It is intentionally fail-closed: if execution evidence does not name an
 * identified actor, it records no customer usage rather than guessing.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { buildAccount, recordUsage } from "./identity-usage-commerce.mjs";

const inputPath = process.env.WORKER_EVIDENCE || "worker-evidence.json";
const outputPath = process.env.USAGE_COMMERCE || "identity-usage-commerce.json";

let evidence = {};
try {
  evidence = JSON.parse(readFileSync(inputPath, "utf8"));
} catch {
  evidence = {};
}

const rows = [];
for (const dispatch of Array.isArray(evidence.dispatches) ? evidence.dispatches : []) {
  const actor = dispatch.actor || dispatch.from || dispatch.source_actor || null;
  if (!actor || dispatch.state !== "VERIFIED") continue;
  const result = recordUsage({
    actor,
    executed: true,
    verified: true,
    execution_id: `${process.env.GITHUB_RUN_ID || "run"}:${dispatch.comment_id || dispatch.number || "dispatch"}`,
    channel: "cognitive-worker",
    capability: "cognitive-dispatch",
    work_units: 1,
    at: evidence.observed_at || new Date().toISOString(),
  });
  if (result.ok) rows.push(result);
}

const accounts = buildAccount(rows);
const output = {
  version: "identity-usage-commerce.v1",
  observed_at: new Date().toISOString(),
  source: inputPath,
  evidence_verified: evidence.verified === true,
  identified_verified_usage_events: rows.length,
  accounts,
  commercial_review: accounts.map((account) => ({
    actor: account.actor,
    measured_usage: true,
    state: account.commercial_state,
    charge_generated: false,
  })),
  truth: {
    identity_required: true,
    execution_required: true,
    verification_required: true,
    no_identity_guessing: true,
    no_automatic_charge: true,
  },
};
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
