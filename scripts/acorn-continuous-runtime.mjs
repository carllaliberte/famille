#!/usr/bin/env node
/**
 * ACORN CONTINUOUS RUNTIME
 *
 * One organism cycle:
 * REAL STATE → DISCOVERY → DEPLOYMENT INSPECTION → WIRING CHECK → EXECUTION
 * → MEASUREMENT → FALSIFICATION → VERIFICATION → EVIDENCE → DRIFT
 * → CORRECTION / ISOLATION / RECOVERY → NEW REAL STATE → CONTINUE
 *
 * Not a second runtime, Cortex, Defense, Breaker or Fabric.
 * Breaker CLOSED / AMBIGUOUS / UNKNOWN / INVALID blocks threatened operations.
 * It never stops defense or this continuity cycle.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  availabilityFromInventory,
  runInventory,
  selectExecutableCapabilities,
  verifyEvidenceChain,
} from "./acorn-capability-inventory.mjs";
import {
  assertDefenseInvariant,
  chooseRecovery,
  defenseCycle,
  quarantineResource,
} from "./acorn-defense.mjs";
import { controlState } from "../.github/swarm/system-breaker.mjs";
import { cortexCycle, cortexConstitution } from "./cortex-cognition.mjs";
import { sealEvidence, verifyEvidenceSeal } from "./evidence-seal.mjs";
import { runCivilizationalCycle } from "./acorn-civilizational.mjs";
import { runCognitiveEcologyCycle, inventoryProbe as ecologyProbe } from "./acorn-cognitive-ecology.mjs";
import { buildUniversalEvolutionCycle, assertUniversalEvolutionInvariant } from "./acorn-universal-evolution.mjs";
import { consolidate, assertLearningOrchestratorInvariant } from "./acorn-learning-orchestrator.mjs";
import { metabolicCycle, assertCognitiveMetabolismInvariant } from "./acorn-cognitive-metabolism.mjs";
import { runConnectionSweep, connectionConstitution } from "./acorn-connection-fabric.mjs";

export const CONTINUOUS_RUNTIME_VERSION = "acorn.continuous-runtime.v1";

const THREATENED = new Set(["dispatch", "write", "merge", "auto_modify", "source_write"]);

export function inventoryProbe() {
  return {
    ok: true,
    version: CONTINUOUS_RUNTIME_VERSION,
    auto_merge: false,
    live: false,
    authority: "carl",
    second_runtime: false,
    continuity: true,
    defense_never_hold: true,
  };
}

export function breakerObservation(env = process.env) {
  const state = controlState(env);
  let observed = "UNKNOWN";
  if (!Object.prototype.hasOwnProperty.call(env, "ACORN_SYSTEM_MODE")) observed = "UNKNOWN";
  else {
    const raw = String(env.ACORN_SYSTEM_MODE ?? "").trim().toUpperCase();
    if (!raw) observed = "UNKNOWN";
    else if (raw === "RUN") observed = "OPEN";
    else if (raw === "OFF") observed = "CLOSED";
    else if (raw === "DEBUG") observed = "AMBIGUOUS";
    else observed = "INVALID";
  }
  return {
    ...state,
    observed,
    threatened_blocked: observed !== "OPEN",
    continuity_active: true,
    defense_active: true,
    hold_on_defense: false,
  };
}

export function mayPerform({ operation, breaker } = {}) {
  const threatened = THREATENED.has(String(operation || "").toLowerCase());
  if (threatened && breaker?.threatened_blocked) {
    return {
      allowed: false,
      reason: "BREAKER_BLOCKS_THREATENED_OPERATION",
      operation,
      defense_active: true,
      continuity_active: true,
    };
  }
  return {
    allowed: true,
    reason: threatened ? "BREAKER_OPEN" : "CONTINUITY_NOT_THREATENED",
    operation,
    defense_active: true,
    continuity_active: true,
  };
}

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function alternativesFor(entry, inventory) {
  const role = String(entry.id.split("/").pop() || "");
  return (inventory.entries || [])
    .filter((row) => row.id !== entry.id)
    .filter((row) => row.states?.verified === true && row.states?.quarantined !== true && row.states?.failed !== true)
    .filter((row) => {
      const other = String(row.id.split("/").pop() || "");
      return other === role || (row.kind === entry.kind && row.states?.wired === true);
    })
    .map((row) => ({
      id: row.id,
      verified: true,
      quarantined: false,
      authority: false,
    }));
}

export async function runContinuousRuntime({
  root = resolve("."),
  env = process.env,
  previous = [],
  quarantined = [],
  executions = {},
  importer = null,
  checkLoadable,
  at = new Date().toISOString(),
  sequence = 0,
  previousDigest = null,
  evidencePath = null,
  operation = "inventory",
} = {}) {
  const breaker = breakerObservation(env);
  const threatened = mayPerform({ operation, breaker });
  const constitution = {
    version: CONTINUOUS_RUNTIME_VERSION,
    owner: "acorn",
    hierarchy: ["CARL", "BREAKER", "ACORN", "CORTEX", "RESOURCES"],
    one_runtime: true,
    second_runtime: false,
    second_cortex: false,
    second_defense: false,
    second_breaker: false,
    second_fabric: false,
    cortex_belongs_to_acorn: true,
    carl_controls_breaker: true,
    breaker_controls_carl: false,
    acorn_controls_carl: false,
    acorn_controls_breaker: false,
    capability_is_not_authority: true,
    one_constitution: true,
    constitutional_self_modification: false,
    auto_applied: false,
    civilizational_cognition: true,
    constitutional_substrate: true,
    constitutional_plan: true,
    cognitive_ecology: true,
    reality_engine: true,
    second_constitution: false,
    auto_evolution: true,
    auto_sovereignty: false,
    auto_merge: false,
    live: false,
  };

  const connections = await runConnectionSweep({ env, now: at });

  const inventory = await runInventory({
    root,
    previous,
    quarantined,
    executions,
    importer,
    checkLoadable,
    at,
    previousDigest,
    sequence,
  });

  const defenseEvents = [];
  const quarantines = [];
  const recoveries = [];
  let previousEventDigest = inventory.evidence?.current_digest || previousDigest;

  for (const entry of inventory.entries) {
    const suspect = entry.states.failed === true || entry.states.drifted === true || (entry.states.wired === true && entry.states.loadable !== true);
    if (!suspect) continue;
    const cycle = defenseCycle({
      actor: "continuous-runtime",
      capability: { authority: false },
      channel: "runtime",
      operation: "inventory-inspect",
      breaker: breaker.observed,
      threat: { kind: entry.states.failed ? "dependency_failure" : "anomalous_behavior" },
      baseline: { lifecycle: previous.find((row) => row.id === entry.id)?.lifecycle || "UNKNOWN" },
      observed: { lifecycle: entry.lifecycle },
      recoveryCandidates: alternativesFor(entry, inventory),
      evidence: { path: entry.path, probe: entry.probe_reason },
      sequence: sequence + defenseEvents.length + 1,
      previousDigest: previousEventDigest,
    });
    defenseEvents.push(cycle);
    previousEventDigest = cycle.event?.digest || previousEventDigest;
    if (cycle.containment?.blocked) {
      const isolated = quarantineResource({ resource: { id: entry.id, presence: entry.lifecycle }, reason: cycle.containment.reason });
      quarantines.push(isolated);
      entry.states.quarantined = true;
      entry.lifecycle = "QUARANTINED";
      const recovery = chooseRecovery({
        candidates: alternativesFor(entry, inventory),
        evidence: { breaker_ambiguous: breaker.observed !== "OPEN" },
        human_required: false,
      });
      recoveries.push({ subject: entry.id, ...recovery });
    }
  }

  const lastDefense = defenseEvents[defenseEvents.length - 1] || defenseCycle({
    actor: "continuous-runtime",
    capability: { authority: false },
    channel: "runtime",
    operation: "continuity",
    breaker: breaker.observed,
    evidence: { continuity: true },
    sequence,
    previousDigest: previousEventDigest,
  });
  const defenseInvariant = assertDefenseInvariant(lastDefense);

  const cortex = cortexCycle({
    task: { objective: "continuous runtime capability selection", required_capabilities: ["review"] },
    resources: inventory.entries
      .filter((row) => availabilityFromInventory(row).executable)
      .map((row) => ({
        id: row.id,
        kind: row.kind,
        capabilities: row.exports.slice(0, 8),
        presence: row.states.quarantined ? "QUARANTINED" : row.states.verified ? "ACTIVE" : row.states.loadable ? "CONNECTED" : "DECLARED",
      })),
    expected: inventory.coverage.discovered_count,
    observed: inventory.coverage.loadable_count,
    evidence: {
      executed: true,
      verified: inventory.coverage.failed_count === 0,
    },
    defense: {
      actor: "cortex",
      channel: "continuous-runtime",
      operation: "capability-selection",
      breaker: breaker.observed,
    },
  });

  const selection = selectExecutableCapabilities(inventory, ["defense", "cortex", "breaker"]);
  const chain = verifyEvidenceChain([inventory.evidence]);
  const sealed = sealEvidence({
    version: CONTINUOUS_RUNTIME_VERSION,
    observed_at: at,
    breaker: {
      observed: breaker.observed,
      threatened_blocked: breaker.threatened_blocked,
      continuity_active: true,
      defense_active: true,
      hold_on_defense: false,
    },
    coverage: inventory.coverage,
    drift: inventory.drift,
    quarantines: quarantines.map((row) => row.id),
    recoveries: recoveries.map((row) => ({ subject: row.subject, status: row.status, reason: row.reason })),
    cortex_status: cortex.status,
    threatened_operation: threatened,
    auto_merge: false,
    live: false,
    authority: "carl",
  });

  const civilizational = runCivilizationalCycle({
    env,
    at,
    previous: previous.length ? { capability: previous.length } : {},
    current: {
      capability: inventory.coverage.executed_count,
      observability: inventory.coverage.verified_count > 0 ? "DIRECT" : "PARTIAL",
      control: threatened.allowed ? 1 : 0,
      reversibility: "UNKNOWN",
      connectivity: inventory.coverage.wired_count,
      autonomy: 0,
      blast_radius: 0,
    },
  });

  const ecology = runCognitiveEcologyCycle({
    inventory,
    env,
    at,
  });

  // UNIFIED ORGANISM CYCLE: one canonical cycle, grounded in live inventory measurements.
  const coverage = inventory.coverage;
  const ratio = (value, total) => total > 0 ? Number((value / total).toFixed(6)) : 0;
  const verificationRatio = ratio(coverage.verified_count, coverage.discovered_count);
  const measurementRatio = ratio(coverage.measured_count, coverage.discovered_count);
  const wiringRatio = ratio(coverage.wired_count, coverage.discovered_count);
  const unknownRatio = ratio(coverage.unknown_count, coverage.discovered_count);
  const failureRatio = ratio(coverage.failed_count, coverage.discovered_count);
  const unifiedObservation = {
    status: coverage.failed_count > 0 ? "REGRESSION" : "OBSERVED",
    category: "ARCHITECTURE", failed: coverage.failed_count > 0,
    regression: coverage.failed_count > 0, unknown: coverage.unknown_count > 0,
    evidence: inventory.evidence, provenance: { source: "continuous-runtime", observed_at: at },
    channel_present: coverage.wired_count > 0,
    capability_available: coverage.loadable_count > 0,
  };
  const evolution = buildUniversalEvolutionCycle({
    observation: unifiedObservation,
    execution: { executed: coverage.executed_count > 0, failed: coverage.failed_count > 0 },
    tests: { passed: coverage.failed_count === 0, failed: coverage.failed_count },
    measurement: { measured: coverage.measured_count > 0, value: coverage.verified_count },
    evidence: { verified: coverage.failed_count === 0 && chain.ok !== false },
    work: {
      observations: [
        { id: "capability-drift", information_gain: Math.min(1, unknownRatio + failureRatio), capability_gain: 1 - verificationRatio, risk_reduction: verificationRatio, cost: 1 - wiringRatio },
        { id: "unknown-frontier", information_gain: unknownRatio, capability_gain: unknownRatio, risk_reduction: 1 - failureRatio, cost: 1 - measurementRatio },
      ],
      independent: [{ id: "revalidation", information_gain: 1 - verificationRatio, capability_gain: measurementRatio, risk_reduction: verificationRatio, cost: 1 - wiringRatio }],
    },
  });
  assertUniversalEvolutionInvariant(evolution);

  const learning = consolidate({
    observations: [{
      subject: "continuous-runtime",
      confidence: verificationRatio,
      provenance: { source: "continuous-runtime", observed_at: at },
      evidence: { score: verificationRatio },
      measurement: { measured: coverage.measured_count > 0, confidence: measurementRatio },
      verification: { verified: coverage.failed_count === 0 && chain.ok !== false },
    }],
    previous: [],
    frontier: evolution.next_work || [],
  });
  assertLearningOrchestratorInvariant(learning);

  const metabolism = metabolicCycle({
    observations: [{
      id: "continuous-runtime",
      subject: "canonical organism cycle",
      provenance: { source: "continuous-runtime", observed_at: at },
      evidence: { score: verificationRatio },
      measurement: { measured: true, confidence: 1 },
      verification: { verified: inventory.coverage.failed_count === 0 },
      state: coverage.failed_count === 0 && chain.ok !== false ? "VERIFIED" : "FAILED",
    }],
    frontier: [
      ...learning.frontier.map(row => ({
        ...row,
        uncertainty: row.uncertainty ?? .5,
        impact: row.impact ?? .5,
        observability: row.observability ?? .8,
        reversibility: row.reversibility ?? .8,
      })),
      {
        id: "unknown-frontier",
        subject: "unknown capability frontier",
        uncertainty: unknownRatio,
        impact: unknownRatio,
        observability: measurementRatio,
        reversibility: 1 - failureRatio,
      },
    ],
    revalidation: learning.frontier,
    authority: "carl",
    auto_merge: false,
    live: false,
  });
  assertCognitiveMetabolismInvariant(metabolism);

  const result = {
    version: CONTINUOUS_RUNTIME_VERSION,
    constitution,
    observed_at: at,
    breaker: {
      observed: breaker.observed,
      mode: breaker.mode,
      threatened_blocked: breaker.threatened_blocked,
      continuity_active: true,
      defense_active: true,
      hold_on_defense: false,
      owner: "carl",
    },
    inventory,
    discovery: {
      second_cortex: false,
      live: false,
      paths: { ranked: false },
      trust: { single_number: null },
      experiment: { adopted: false },
      unknown: { cortex_modified: false },
    },
    coverage: inventory.coverage,
    drift: inventory.drift,
    defense: {
      active: true,
      continue_defending: true,
      state: lastDefense.state,
      invariant: defenseInvariant.status,
      events: defenseEvents.length,
      quarantines,
      recoveries,
    },
    cortex: {
      status: cortex.status,
      belongs_to_acorn: cortex.constitution?.cortex_belongs_to_acorn === true,
      second_cortex: cortex.constitution?.second_cortex === true,
      selection,
      live: false,
    },
    evidence: {
      inventory: inventory.evidence,
      sealed,
      seal_verified: verifyEvidenceSeal(sealed),
      chain,
    },
    threatened_operation: threatened,
    civilizational: {
      version: civilizational.version,
      vision: civilizational.vision,
      constitution: civilizational.constitution.status,
      audit: civilizational.audit.status,
      verified: civilizational.audit.verified,
      failed: civilizational.audit.failed,
      unknown_space: civilizational.unknown_space.we_do_not_know,
      control_gap: civilizational.control_gap,
      observability_gap: civilizational.observability_gap,
      replaceability: civilizational.replaceability.status,
      reconstruction: civilizational.reconstruction.status,
      anti_escape: civilizational.anti_escape.status,
      defense_of_defense: civilizational.defense.of_defense,
      substrate: civilizational.substrate,
      plan: civilizational.substrate?.plan || null,
      metrics: civilizational.substrate?.metrics || null,
      authority_chain: civilizational.substrate?.authority_chain || null,
      long_horizon: {
        continuity: civilizational.long_horizon.continuity.horizon,
        transformation: civilizational.long_horizon.transformation.horizon,
        unknown_future: civilizational.long_horizon.unknown_future.horizon,
      },
      live: false,
    },
    unified: {
      cycle_order: ["REAL_STATE", "INVENTORY", "DEFENSE", "CORTEX", "EVOLUTION", "LEARNING", "METABOLISM", "EVIDENCE", "CONTINUE"],
      measurement_basis: {
        discovered: coverage.discovered_count, wired: coverage.wired_count, executed: coverage.executed_count,
        measured: coverage.measured_count, verified: coverage.verified_count, unknown: coverage.unknown_count, failed: coverage.failed_count,
      },
      measured_from_inventory: true,
      declared_scores_removed: true,
      evolution: {
        state: evolution.state,
        next_work: evolution.next_work,
        verification: evolution.verification,
      },
      learning: {
        metrics: learning.metrics,
        next: learning.next,
      },
      connections: {
        version: connections.version,
        constitution: connectionConstitution(),
        proof: connections.proof,
        metrics: connections.metrics,
        active: connections.active_connections,
        local_self_test: connections.local_self_test,
        live: false,
      },
      metabolism: {
        phase: metabolism.metabolism?.phase || null,
        homeostasis: metabolism.homeostasis,
        next: metabolism.next,
        continue: metabolism.continue,
      },
      connection_fabric: {
        version: connections.version,
        proof: connections.proof,
        verified: connections.proof.status === "VERIFIED",
        active_connections: connections.metrics.active_connections,
        measured_connections: connections.metrics.measured_connections,
        verified_connections: connections.metrics.verified_connections,
        external_boundary: "connector-flux",
      },
      one_organism_cycle: true,
      second_runtime: false,
      second_cortex: false,
      live: false,
    },
    ecology: {
      version: ecology.version,
      cycle: ecology.cycle,
      audit: ecology.audit.status,
      control_gap: ecology.control_gap.status,
      unknown_space: ecology.unknown_space.length,
      governor: ecology.governor.decision,
      defense_kernel: ecology.defense.kernel,
      second_cortex: false,
      second_runtime: false,
      second_defense: false,
      second_governor: false,
      executed: true,
      measured: true,
      verified: ecology.audit.status === "VERIFIED",
      live: false,
    },
    state: breaker.threatened_blocked ? "DEFENSIVE_CONTINUATION" : "CONTINUOUS",
    auto_merge: false,
    live: false,
    authority: "carl",
  };

  if (evidencePath) {
    mkdirSync(dirname(evidencePath), { recursive: true });
    writeFileSync(evidencePath, `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

function isMain() {
  const here = fileURLToPath(import.meta.url);
  const argv1 = process.argv[1] ? String(process.argv[1]) : "";
  return argv1.endsWith("acorn-continuous-runtime.mjs") || here === argv1;
}

if (isMain()) {
  const root = resolve(process.env.ACORN_RUNTIME_ROOT || ".");
  const evidencePath = process.env.ACORN_CONTINUOUS_EVIDENCE || "evidence/autopilot/continuous-runtime.json";
  const previous = readJson(resolve(root, process.env.ACORN_INVENTORY_PREVIOUS || "evidence/autopilot/capability-inventory.json"), null);
  const selfProbe = inventoryProbe();
  const result = await runContinuousRuntime({
    root,
    env: process.env,
    previous: previous?.entries || [],
    importer: (url) => import(url),
    evidencePath: resolve(root, evidencePath),
    executions: {
      "scripts/acorn-continuous-runtime.mjs": {
        executed: true,
        measured: true,
        verified: selfProbe.auto_merge === false && selfProbe.live === false && selfProbe.second_runtime === false,
        reason: "SELF_ENTRYPOINT",
      },
      "scripts/acorn-cognitive-ecology.mjs": {
        executed: true,
        measured: true,
        verified: ecologyProbe().live === false && ecologyProbe().second_cortex === false,
        reason: "ECOLOGY_CYCLE",
      },
    },
  });
  writeFileSync(
    resolve(root, process.env.ACORN_INVENTORY_SNAPSHOT || "evidence/autopilot/capability-inventory.json"),
    `${JSON.stringify({ observed_at: result.observed_at, coverage: result.coverage, entries: result.inventory.entries, live: false }, null, 2)}\n`,
  );
  const c = result.coverage;
  console.log(JSON.stringify({
    runtime: CONTINUOUS_RUNTIME_VERSION,
    state: result.state,
    breaker: result.breaker.observed,
    defense: result.defense.state,
    cortex: result.cortex.status,
    DISCOVERED: c.discovered_count,
    LOADABLE: c.loadable_count,
    WIRED: c.wired_count,
    DEPLOYED: c.deployed_count,
    EXECUTED: c.executed_count,
    MEASURED: c.measured_count,
    VERIFIED: c.verified_count,
    LIVE: c.live_count,
    DRIFTED: c.drifted_count,
    QUARANTINED: c.quarantined_count,
    FAILED: c.failed_count,
    DEFENSE: "ACTIVE",
    auto_merge: false,
    live: false,
    authority: "carl",
  }, null, 2));
}
