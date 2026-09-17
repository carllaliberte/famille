#!/usr/bin/env node
/**
 * ACORN CORTEX RUNTIME BRIDGE
 *
 * Connects one real cognitive-worker cycle to Cortex without creating a
 * parallel worker. Cortex records collaboration, runs one bounded evolution
 * loop, then one organism cycle (fabric, prediction, immune, genome).
 * LIVE is never minted. Carl remains merge authority.
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
import { presenceFromRuntime, runOrganismCycle } from "./cortex-organism.mjs";
import { runIntelligenceContract } from "./intelligence-contract.mjs";
import { learnCortexExperience } from "./cortex-learning-cycle.mjs";
import { snapshotComputeFabric } from "./acorn-compute-fabric.mjs";
import { snapshotOmniCore } from "./acorn-omni-core.mjs";
import { snapshotConnector } from "./acorn-connector-flux.mjs";

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

function stampAgents(agents, workerEvidence, env) {
  const rows = (agents || []).map((agent) => {
    const runtimePresence = presenceFromRuntime(agent, { workerEvidence, env });
    const given = agent.presence;
    const presence = runtimePresence !== "DECLARED" ? runtimePresence : (given || "DECLARED");
    return {
      ...agent,
      presence,
      capabilities: [...new Set([...(agent.capabilities || []), ...(agent.id === "worker" && workerEvidence?.v ? ["cognitive-cycle", "review"] : [])])],
    };
  });
  if (workerEvidence?.v && !rows.some((row) => row.id === "worker")) {
    rows.push({
      id: "worker",
      capabilities: ["cognitive-cycle", "review"],
      presence: "ACTIVE",
      specialty: "runtime",
    });
  }
  return rows;
}

export function runCortexRuntime({
  workerEvidence = readJson("worker-evidence.json", {}),
  agents = readJson("schema/agents.json", { agents: [] }).agents || [],
  fluidity = readJson("cognitive-fluidity.json", {}),
  memory = readJson("cortex-evolution-memory.json", { entries: [] }).entries || [],
  topology = readJson("cortex-topology.json", { version: 0, paths: [], synapses: [] }),
  contributions = readJson("cortex-contributions.json", { entries: [] }).entries || [],
  timing = readJson("cognitive-fluidity-timing.json", {}),
  env = process.env,
  at = new Date().toISOString(),
  languageInput = { text: "⊞⊸λ", declared: "FUTURE-LANG-X" },
} = {}) {
  if (!fluidity.state) {
    fluidity = { ...readJson(process.env.FLUIDITY_PRIOR || "cognitive-fluidity-prior.json", {}), ...fluidity };
  }
  const stamped = stampAgents(agents, workerEvidence, env);
  const objective = `cognitive worker cycle ${workerEvidence.v || "unknown"}`;
  const required = ["review"];
  const created = createCortexSession({ objective, required_capabilities: required, at });
  if (!created.ok) throw new Error("Cortex session could not be created");

  let session = created.session;
  session = stage(session, "OBSERVE", "real cognitive-worker evidence received");

  const discovered = discoverCapabilities({ objective, required_capabilities: required, at }, stamped);
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
      fail: executed.length === 0 && verified !== true && !workerEvidence?.v,
      used_capabilities: composition.ok ? composition.capabilities : (workerEvidence?.v ? ["cognitive-cycle"] : []),
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

  const organism = runOrganismCycle({
    workerEvidence,
    agents: stamped,
    fluidity,
    memory,
    topology,
    contributions,
    timing,
    discovery: discovered,
    composition,
    evolution,
    env,
    at,
    languageInput,
  });
  const intelligence = runIntelligenceContract({
    env,
    agents: stamped,
    canals: {},
    workerEvidence,
    need: "review",
    policy: env.ACORN_COST_POLICY || "FREE_FIRST",
    memory,
  });
  const learning = learnCortexExperience({
    prediction: organism.prediction?.prediction || { hypothesis: "cognitive-cycle", expected: { capability: "cognitive-cycle", available: true } },
    observation: { actual: organism.observe?.actual, context: { route: intelligence.routed?.selected?.identity || "cortex-local" }, observed_at: at },
    model: { version: 1 },
    verification: { verified: evolution.verification?.verdict === "VERIFIED_SUCCESS" },
  });
  session = stage(session, "DONE", "Cortex observation + evolution + organism + intelligence + compute fabric + omni-core completed");

  const compute = snapshotComputeFabric({ env, now: at });
  const omni = snapshotOmniCore({ env, now: at });
  const connector = snapshotConnector({ env, now: at });

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
    organism,
    intelligence,
    learning,
    compute,
    omni,
    connector,
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
  if (output.organism?.genome?.genome) {
    writeFileSync("cortex-genome.json", `${JSON.stringify(output.organism.genome, null, 2)}\n`);
  }
  const eco = output.organism?.ecosystem;
  if (eco) {
    const arch = eco.architecture;
    console.log(`ecosystem.executor=${eco.graph?.assembly?.roles?.executor || "none"} homeostasis=${eco.homeostasis?.state || "none"} unknown_is_not_failure=${eco.unknown?.unknown_is_not_failure === true} architecture.class=${arch?.classified?.class || "none"} architecture.selected=${arch?.selected?.architecture?.architecture_id || "none"} architecture.better_in_general=${arch?.better_in_general === true} live=false`);
  }
  const lang = output.organism?.language;
  if (lang) {
    console.log(`language.state=${lang.discovery?.state || "none"} form.kind=${lang.discovery?.form?.kind || "none"} understood=${lang.discovery?.understood === true} zero_cost=${lang.zero_cost === true} authority_merge=${lang.gates?.merge === true} live=false`);
  }
  const ad = output.organism?.adaptive;
  if (ad) {
    console.log(`adaptive.protocol=${ad.protocol?.state || "none"} negotiated=${(ad.negotiated?.common || []).join(",") || "none"} intel=${ad.future_intelligence?.identity || "none"} immune.untrusted=${ad.immune?.untrusted === true} diff.better=${ad.diff?.better === true} mutation.adopted=${ad.evolved?.adopted === true} second_cortex=${ad.second_cortex === true} live=false`);
  }
  const meta = output.organism?.meta;
  if (meta) {
    console.log(`meta.self_authorize=${meta.improved?.self_authorize === true} rejected=${meta.improved?.rejected === true} winner=${meta.winner || "none"} unknown=${meta.unknown?.kind || "none"} counterfactual=${meta.counterfactual?.counterfactual === true} live=false`);
  }
  const acc = output.organism?.acceleration;
  if (acc) {
    console.log(`acceleration.nvidia=${acc.nvidia?.state || "none"} attempt=${acc.nvidia?.attempt?.status || "none"} unknown=${acc.unknown?.identity || "none"} nvidia_is_architecture=${acc.gates?.nvidia_is_architecture === true} failover=${acc.failover?.status || "none"} lockin_survives=${(acc.lockin || []).every((row) => row.cortex_survives === true)} live=false`);
  }
  const br = output.organism?.acceleration?.sovereignty?.breaker;
  if (br) {
    console.log(`breaker.reason=${br.reason || "none"} owner=carl nvidia_live=${output.organism?.acceleration?.nvidia?.attempt?.nvidia_live === true} live=false`);
  }
  const fut = output.organism?.futures;
  if (fut) {
    console.log(`futures.pretended=${fut.claim?.pretended === true} world_is_not_world=${fut.world?.model_is_not_world === true} live=false`);
  }
  console.log(JSON.stringify(output, null, 2));
}
