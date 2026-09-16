#!/usr/bin/env node
/**
 * ACORN CORTEX RUNTIME BRIDGE
 *
 * Connects one real cognitive-worker cycle to Cortex without creating a
 * parallel worker. Cortex records the observed collaboration lifecycle
 * and runs one bounded evolution loop from real evidence + fluidity.
 * It never invents execution, authority, LIVE state, or merge authority.
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
  runEvolutionLoop,
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
  fluidity = readJson("cognitive-fluidity.json", {}),
  memory = readJson("cortex-evolution-memory.json", { entries: [] }).entries || [],
  topology = readJson("cortex-topology.json", { version: 0, paths: [], synapses: [] }),
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

  const evolution = runEvolutionLoop({
    workerEvidence,
    fluidity,
    discovery: discovered,
    composition,
    memory,
    topology,
    at,
    runtime: {
      channelPresent: true,
      capabilityAvailable: composition.ok,
      fail: executed.length === 0 && verified !== true,
      used_capabilities: composition.ok ? composition.capabilities : [],
      contributions: (composition.selected || []).map((id) => ({ intelligence: id, role: "node", live: false })),
      result: { dispatches: executed.length, verified },
    },
    falsify: {
      treat_fluidity_regression: fluidity.state === "STALLED",
    },
  });
  session = stage(session, "HYPOTHESIZE", evolution.hypothesis.hypothesis.statement, evolution.hypothesis.status);
  session = stage(session, "EXPERIMENT", evolution.experiment.experiment.experiment_id, evolution.execution.status);
  if (evolution.decision.decision === "HOLD_HUMAN") session = stage(session, "HOLD_HUMAN", evolution.decision.why || "human authority", "hold");
  else if (evolution.decision.decision === "ADOPT") session = stage(session, "ADOPT", evolution.decision.why, "adopted");
  else session = stage(session, "REJECT", evolution.decision.why, "rejected");
  session = stage(session, "REMEMBER", evolution.memory.entry.memory_id, "remembered");
  if (evolution.reconfiguration.ok) session = stage(session, "RECONFIGURE", `topology v${evolution.reconfiguration.topology.version}`, "adopted");
  session = stage(session, "DONE", "Cortex observation + evolution cycle completed");

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
    evolution,
    worker_evidence_ref: workerEvidence.v || null,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const output = runCortexRuntime();
  writeFileSync("cortex-evidence.json", `${JSON.stringify(output, null, 2)}\n`);
  if (output.evolution?.memory?.entry) {
    const prior = readJson("cortex-evolution-memory.json", { entries: [] });
    prior.entries = [...(prior.entries || []), output.evolution.memory.entry];
    prior.live = false;
    writeFileSync("cortex-evolution-memory.json", `${JSON.stringify(prior, null, 2)}\n`);
  }
  console.log(JSON.stringify(output, null, 2));
}
