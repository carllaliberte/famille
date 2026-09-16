#!/usr/bin/env node
/**
 * ACORN CORTEX RUNTIME BRIDGE
 *
 * Connects one real cognitive-worker cycle to Cortex without creating a
 * parallel worker. Cortex records the observed collaboration lifecycle;
 * it never invents execution, authority, LIVE state, or merge authority.
 */
import { readFileSync, writeFileSync } from "node:fs";
import {
  createCortexSession,
  discoverCapabilities,
  composeSynapse,
  recordStage,
  recordExecution,
  measureCollaboration,
  learnCollaboration,
} from "../.github/swarm/cortex.mjs";

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function stage(session, state, summary, status = "observed") {
  const result = recordStage(session, state, { status, summary });
  return result.ok ? result.session : session;
}

export function runCortexRuntime({
  workerEvidence = readJson("worker-evidence.json", {}),
  agents = readJson("schema/agents.json", { agents: [] }).agents || [],
  at = new Date().toISOString(),
} = {}) {
  const objective = `cognitive worker cycle ${workerEvidence.v || "unknown"}`;
  const required = ["review"];
  const created = createCortexSession({ objective, required_capabilities: required, at });
  if (!created.ok) throw new Error("Cortex session could not be created");

  let session = created.session;
  session = stage(session, "OBSERVE", "real cognitive-worker evidence received");

  const discovered = discoverCapabilities({ objective, required_capabilities: required, at }, agents);
  session = stage(session, "MAP", `mapped ${discovered.discovered.length} declared intelligence entries`);

  const composition = composeSynapse({ objective, required_capabilities: required, at }, discovered);
  session = stage(session, "COMPOSE", composition.ok ? "context-specific composition available" : "composition blocked by missing callable capability", composition.ok ? "observed" : "blocked");

  const dispatches = Array.isArray(workerEvidence.dispatches) ? workerEvidence.dispatches : [];
  const executed = dispatches.filter((row) => ["ACCEPTED", "VERIFIED", "DISPATCHED"].includes(row.state));
  for (const row of executed) {
    const recorded = recordExecution(session, {
      node: "cognitive-worker",
      capability: "review",
      status: row.state,
      result: { pr: row.number, sha: row.sha, comment_id: row.comment_id || null },
      at,
    });
    if (recorded.ok) session = recorded.session;
  }

  const baseline = Number(workerEvidence.discovered || 0);
  const collaborative = Number(workerEvidence.routed || 0);
  const measurement = measureCollaboration({
    metric: "routed_targets",
    baseline,
    collaborative,
    direction: "higher_is_better",
    method: "worker evidence paired state",
    at,
  });
  session = stage(session, "MEASURE", measurement.ok ? `measured routed_targets delta=${measurement.delta}` : "measurement unavailable");

  const verified = workerEvidence.verified === true || workerEvidence.truth?.ACTION_VERIFIED === true;
  session = stage(session, "VERIFY", verified ? "worker evidence reports verified action" : "no verified action claimed");
  const lesson = learnCollaboration({
    task: objective,
    nodes: composition.selected,
    measurement,
    verified,
    at,
  });
  session = stage(session, "LEARN", lesson.ok ? "learning admitted from verified evidence" : "learning withheld until verified evidence exists", lesson.ok ? "observed" : "blocked");
  session = stage(session, "DONE", "Cortex observation cycle completed");

  return {
    version: "cortex-runtime.v0",
    executed: true,
    live: false,
    auto_merge: false,
    authority: "carl",
    session,
    discovery: discovered,
    composition,
    measurement,
    lesson,
    worker_evidence_ref: workerEvidence.v || null,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = runCortexRuntime();
  writeFileSync("cortex-evidence.json", `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
}
