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
  degradationMode,
  measureAuthorityEnvelope,
  operationalStop,
  quarantineResource,
} from "./acorn-defense.mjs";
import { controlState } from "../.github/swarm/system-breaker.mjs";
import { cortexCycle, cortexConstitution, composeOrganism, declareMeaning, diagnoseConflict, governEvolution, gradeEvidence, organismMetrics, stampTime } from "./cortex-cognition.mjs";
import { measureAutonomy, autonomyBudget } from "./autonomous-runtime.mjs";
import { learnCortexExperience } from "./cortex-learning-cycle.mjs";
import { expireEvidence, sealEvidence, verifyEvidenceSeal } from "./evidence-seal.mjs";

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
    capability_ceiling_is_not_authority_ceiling: true,
    auto_merge: false,
    live: false,
  };

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
      provenance: inventory.evidence?.current_digest || null,
    },
    defense: {
      actor: "cortex",
      channel: "continuous-runtime",
      operation: "capability-selection",
      breaker: breaker.observed,
    },
    meaning: {
      objective: "continuous runtime capability selection",
      human_origin: false,
      derived_by: "continuous-runtime",
    },
  });

  const selection = selectExecutableCapabilities(inventory, ["defense", "cortex", "breaker"]);
  const chain = verifyEvidenceChain([inventory.evidence]);
  const envelope = measureAuthorityEnvelope({
    resource: { id: "acorn", authority: false },
    observed: {
      capability: inventory.coverage.executed_count,
      authority: 0,
      trust: inventory.coverage.verification_coverage === "UNKNOWN" ? "UNKNOWN" : inventory.coverage.verified_count,
      autonomy: inventory.coverage.executed_count,
      reversibility: 1,
    },
  });
  const autonomy = measureAutonomy({
    autonomous_steps: 1,
    duration_ms: 0,
    authority_requests: 0,
    replication_attempts: 0,
  });
  const budget = autonomyBudget({
    limits: { autonomous_steps: 1, authority_requests: 0, replication_attempts: 0 },
    uncertainty: { unknown: breaker.threatened_blocked },
    breaker: breaker.observed,
  });
  const degradation = degradationMode({
    lost_ratio: inventory.coverage.failed_count && inventory.coverage.discovered_count
      ? inventory.coverage.failed_count / inventory.coverage.discovered_count
      : 0,
    cortex_degraded: cortex.status !== "VERIFIED" && cortex.status !== "EXECUTED",
    recovering: lastDefense.state === "RECOVERING" || lastDefense.state === "RECOVERED",
    breaker_unresolved: breaker.threatened_blocked,
  });
  const stop = threatened.allowed
    ? null
    : operationalStop({ target: threatened.operation, reason: threatened.reason, breaker: breaker.observed });
  const evidenceLife = expireEvidence({
    evidence: inventory.evidence,
    issued_at: at,
    now: Date.parse(at),
    ttl_ms: 24 * 60 * 60 * 1000,
  });
  const meaning = declareMeaning({
    objective: "continuous runtime capability selection",
    human_origin: false,
    derived_by: "continuous-runtime",
  });
  const science = learnCortexExperience({
    observation: {
      actual: inventory.coverage.loadable_count,
      evidence: [inventory.evidence],
      observed_at: at,
    },
    prediction: {
      hypothesis: "loadable stays aligned with discovered",
      expected: inventory.coverage.discovered_count,
    },
    verification: { verified: inventory.coverage.failed_count === 0 },
  });
  const diagnosis = diagnoseConflict({
    cortex: { status: cortex.status },
    defense: lastDefense,
    fabric: { status: "UNKNOWN" },
    memory: { current: false },
    runtime: { executed: true, status: "PRESENT" },
    time: { expired: evidenceLife.status === "EXPIRED" },
    governance: { authorized: false, denied: breaker.threatened_blocked },
  });
  const organism = composeOrganism({
    meaning: cortex.meaning || meaning,
    cortex,
    defense: lastDefense,
    fabric: { status: "UNKNOWN" },
    science: { status: science.status, live: false },
    memory: { status: "UNKNOWN" },
    evolution: governEvolution({ verified: cortex.status === "VERIFIED", simulated: false, adopted: false }),
    action: cortex.action,
    time: stampTime({ at, observed_at: at }),
    evidence: gradeEvidence({
      observed: true,
      measured: true,
      verified: cortex.status === "VERIFIED",
      live_execution: false,
    }),
    diagnosis,
  });
  const metrics = organismMetrics({
    runtime_coverage: inventory.coverage.execution_coverage,
    capability_discovery_rate: inventory.coverage.discovered_count,
    capability_verification_rate: inventory.coverage.verification_coverage,
    drift_detection: inventory.drift?.count ?? 0,
    successful_recoveries: recoveries.filter((row) => row.status === "RECOVERED").length,
    failed_recoveries: recoveries.filter((row) => row.status !== "RECOVERED" && row.status !== "NOT_REQUIRED").length,
    authority_violations_prevented: envelope.collision ? 1 : 0,
    autonomy_exposure: autonomy.autonomous_steps,
  });
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
      consensus_is_truth: cortex.constitution?.consensus_is_not_truth === true ? false : "UNKNOWN",
      envelope: cortex.envelope,
      perspectives: cortex.perspectives,
      selection,
      live: false,
    },
    resilience: {
      envelope,
      autonomy,
      budget,
      degradation,
      operational_stop: stop,
      evidence_life: evidenceLife,
      capability_is_not_authority: envelope.capability_is_not_authority,
      operational_stop_is_not_breaker: stop ? stop.is_not_breaker : true,
      pretends_normal: degradation.pretends_normal,
    },
    meaning,
    science: { status: science.status, live: false, auto_merge: false },
    diagnosis,
    organism,
    metrics,
    time: stampTime({ at, observed_at: at }),
    evidence: {
      inventory: inventory.evidence,
      sealed,
      seal_verified: verifyEvidenceSeal(sealed),
      chain,
    },
    threatened_operation: threatened,
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
