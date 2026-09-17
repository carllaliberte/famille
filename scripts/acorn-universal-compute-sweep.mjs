#!/usr/bin/env node
import { listComputeAdapters, discoverCompute, executeComputeTask } from "./acorn-compute-fabric.mjs";

const SAFE_TASKS = Object.freeze({
  cpu: { type: "classical", required_capabilities: ["cpu"] },
  simulator: {
    type: "quantum_simulation",
    required_capabilities: ["quantum_simulation"],
    allow_simulator: true,
    qubits: 2,
    gates: [["h", 0], ["cx", 0, 1]],
    shots: 64,
    seed: 17,
  },
});

function isExecutable(row) {
  return ["EXECUTABLE", "VERIFIED", "MEASURED", "CONNECTED"].includes(row?.state)
    && row?.live !== true && row?.certified !== true;
}

export async function runUniversalComputeSweep({
  env = process.env,
  allowExec = true,
  human_authorization = false,
  policy = "FREE_FIRST",
  nowAt = new Date().toISOString(),
  fetchImpl = null,
} = {}) {
  const discovery = await discoverCompute({ env, allowExec, fetchImpl, now: nowAt });
  const resources = discovery.resources || [];
  const attempts = [], executed = [], held = [], skipped = [];

  for (const row of resources) {
    const task = SAFE_TASKS[row?.compute_type];
    if (!task) {
      skipped.push({ resource_id: row?.resource_id, provider: row?.provider, compute_type: row?.compute_type, reason: "NO_SAFE_SWEEP_TASK" });
      continue;
    }
    if (!isExecutable(row)) {
      skipped.push({ resource_id: row?.resource_id, provider: row?.provider, compute_type: row?.compute_type, reason: "RESOURCE_NOT_EXECUTABLE", state: row?.state || "UNKNOWN" });
      continue;
    }
    const result = await executeComputeTask({
      task: { ...task, resource_id: row.resource_id, provider: row.provider },
      discovery: { ...discovery, resources: [row] },
      env, human_authorization, policy, now: nowAt,
    });
    const attempt = {
      resource_id: row.resource_id, provider: row.provider, compute_type: row.compute_type,
      status: result.status, reason: result.reason || null, execution: result.execution || null,
      live: false, authority: "carl",
    };
    attempts.push(attempt);
    if (["EXECUTED", "VERIFIED", "COMPLETED"].includes(result.status)) executed.push(attempt);
    else held.push(attempt);
  }

  return {
    status: executed.length > 0 ? "EXECUTED" : "INCONCLUSIVE",
    mode: "UNIVERSAL_COMPUTE_SWEEP",
    discovered_count: resources.length, attempted_count: attempts.length,
    executed_count: executed.length, held_count: held.length, skipped_count: skipped.length,
    executed, held, skipped,
    providers: discovery.providers,
    resource_inventory: resources,
    adapters: listComputeAdapters().map((a) => ({
      provider: a.provider_id, label: a.label, compute_types: a.compute_types || [],
      intelligence: false, authority: false,
    })),
    proof: {
      all_executed_resources_have_execution_records: executed.every((x) => Boolean(x.execution?.execution_id)),
      no_fake_execution: attempts.every((x) => !x.execution || x.execution.status !== "PROPOSED"),
      paid_remote_not_auto_spent: human_authorization === true || held.every((x) => x.reason !== "UNAUTHORIZED_EXECUTION"),
    },
    live: false, auto_merge: false, auto_spend: false, authority: "carl", observed_at: nowAt,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = await runUniversalComputeSweep();
  process.stdout.write(JSON.stringify({
    status: r.status, discovered_count: r.discovered_count, attempted_count: r.attempted_count,
    executed_count: r.executed_count, held_count: r.held_count, skipped_count: r.skipped_count,
    executed: r.executed.map((x) => ({ resource_id: x.resource_id, compute_type: x.compute_type, status: x.status, execution_id: x.execution?.execution_id || null, measured: x.execution?.measured === true })),
    held: r.held.map((x) => ({ resource_id: x.resource_id, compute_type: x.compute_type, status: x.status, reason: x.reason })),
    live: false, auto_spend: false, authority: "carl",
  }, null, 2) + "\n");
}
