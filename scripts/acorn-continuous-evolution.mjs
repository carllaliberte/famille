#!/usr/bin/env node
/**
 * ACORN — CONTINUOUS EVOLUTION FABRIC
 *
 * WORLD -> OBSERVE -> GAP -> DISCOVER -> COMPARE -> COMPOSE -> SIMULATE
 * -> PROPOSE -> BUILD/EXECUTE -> MEASURE -> VERIFY -> REGISTER -> REUSE
 * -> OBSERVE
 *
 * One bounded conductor over existing Acorn fabrics.
 * CAPABILITY != AUTHORITY
 * LEARNING != AUTHORITY
 * BUILD != MERGE
 * VERIFIED != LIVE
 * BEST_KNOWN_IN_SCOPE != GLOBAL_BEST
 * CARL = MERGE
 */
import crypto from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { nextAction as maintenanceNextAction } from "./acorn-continuous-maintenance.mjs";
import { buildUniversalEvolutionCycle } from "./acorn-universal-evolution.mjs";
import { runCognitiveStrategyLearningCycle } from "./acorn-cognitive-strategy.mjs";

export const CONTINUOUS_EVOLUTION_VERSION = "acorn.continuous-evolution.v1";

export const EVOLUTION_DOMAINS = Object.freeze([
  "CUSTOMER","PRODUCT","MARKET","CAPABILITY","INTELLIGENCE","CONNECTOR",
  "PROJECT","CODE","ARCHITECTURE","QUALITY","SECURITY","PERFORMANCE",
  "ECONOMICS","RESOURCE","EVIDENCE","KNOWLEDGE","OPPORTUNITY","REAL_WORLD","UNKNOWN"
]);

export const DECLARED_EVOLUTION_SURFACES = Object.freeze([
  "CUSTOMER","PRODUCT","MARKET","CAPABILITY","INTELLIGENCE","CONNECTOR",
  "PROJECT","CODE","ARCHITECTURE","QUALITY","SECURITY","PERFORMANCE",
  "ECONOMICS","RESOURCE","EVIDENCE","KNOWLEDGE","OPPORTUNITY","REAL_WORLD"
]);

const FAILED_RUN_CONCLUSIONS = new Set(["failure", "timed_out", "cancelled", "action_required"]);

const text = (v) => String(v ?? "").trim();
const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const clamp01 = (v) => Math.max(0, Math.min(1, finite(v)));
const arr = (v) => Array.isArray(v) ? v : [];

function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function normalizeDomain(value) {
  const candidate = text(value).toUpperCase();
  return EVOLUTION_DOMAINS.includes(candidate) ? candidate : "UNKNOWN";
}

export function evolutionConstitution() {
  return Object.freeze({
    version: CONTINUOUS_EVOLUTION_VERSION,
    one_conductor: true,
    second_runtime: false,
    second_cortex: false,
    second_market: false,
    second_evidence_engine: false,
    second_authority: false,
    capability_is_not_authority: true,
    learning_is_not_authority: true,
    build_is_not_merge: true,
    verified_is_not_live: true,
    best_known_is_scoped: true,
    declared_is_not_observed: true,
    human_authority: "carl",
    auto_merge: false,
    auto_spend: false,
    live: false
  });
}

export function judgeCardPresence(snapshot = {}) {
  const card = snapshot.juge || snapshot.judge || null;
  const quelle = text(card?.quelle);
  const temoin = text(card?.temoin);
  const epsilon = Number(card?.epsilon);
  const horizon = text(card?.horizon);
  const present = Boolean(
    quelle &&
    temoin &&
    Number.isFinite(epsilon) &&
    epsilon > 0 &&
    horizon
  );
  return {
    present,
    mode: present ? "juge" : "classique",
    hole: present ? null : "carte juge absente — quelle / temoin / epsilon>0 / horizon jour"
  };
}

function failedWorkflowRunCount(runs) {
  return runs.filter((run) => FAILED_RUN_CONCLUSIONS.has(text(run.conclusion).toLowerCase())).length;
}

function notMeasuredSurface(domain, extra = {}) {
  return normalizeObservation({
    id: "surface:" + domain,
    domain,
    status: "NOT_MEASURED",
    unknown: true,
    measured: false,
    verified: false,
    expected: null,
    observed: extra.observed ?? null,
    evidence: extra.evidence || "DECLARED_SURFACE_ABSENT_FROM_SNAPSHOT",
    provenance: extra.provenance || null
  });
}

export function observeDeclaredSurfaces(snapshot = {}) {
  const prs = Array.isArray(snapshot.pull_requests) ? snapshot.pull_requests : null;
  const runs = Array.isArray(snapshot.workflow_runs) ? snapshot.workflow_runs : null;
  const juge = judgeCardPresence(snapshot);
  const provenance = { main_sha: snapshot.main_sha || snapshot.mainSha || null };
  const failedCount = runs ? failedWorkflowRunCount(runs) : null;
  const openPrCount = prs
    ? prs.filter((pr) => text(pr.state).toLowerCase() !== "closed").length
    : null;

  return DECLARED_EVOLUTION_SURFACES.map((domain) => {
    if (domain === "CODE" && runs) {
      return normalizeObservation({
        id: "surface:CODE",
        domain: "CODE",
        status: failedCount > 0 ? "FAILED" : "OBSERVED",
        expected: { failed_count: 0 },
        observed: { run_count: runs.length, failed_count: failedCount },
        failed: failedCount > 0,
        unknown: false,
        measured: false,
        verified: false,
        evidence: "workflow_runs",
        provenance
      });
    }
    if (domain === "PROJECT" && prs) {
      return normalizeObservation({
        id: "surface:PROJECT",
        domain: "PROJECT",
        status: "OBSERVED",
        expected: null,
        observed: { open_pr_count: openPrCount, listed_count: prs.length },
        failed: false,
        unknown: false,
        measured: false,
        verified: false,
        evidence: "pull_requests",
        provenance
      });
    }
    if (domain === "EVIDENCE") {
      return notMeasuredSurface("EVIDENCE", {
        observed: { juge_present: juge.present, mode: juge.mode },
        evidence: juge.hole,
        provenance
      });
    }
    return notMeasuredSurface(domain, { provenance });
  });
}

export function collectEvolutionObservations(snapshot = {}) {
  const declared = observeDeclaredSurfaces(snapshot);
  const extra = [...arr(snapshot.observations), ...arr(snapshot.frontier)]
    .filter((row) => row && typeof row === "object");
  const byId = new Map(declared.map((row) => [row.id, row]));
  for (const row of extra) {
    const normalized = normalizeObservation(row);
    if (!normalized.id) continue;
    byId.set(normalized.id, normalized);
  }
  return [...byId.values()];
}

export function normalizeObservation(row = {}) {
  const status = text(row.status || "OBSERVED").toUpperCase();
  const domain = normalizeDomain(row.domain || row.category);
  const measured = row.measured === true;
  const verified = row.verified === true;
  const failed = row.failed === true || ["FAILED","ERROR","REGRESSION","DRIFT","BLOCKED"].includes(status);
  const unknown = row.unknown === true || status === "UNKNOWN" || domain === "UNKNOWN";
  return {
    id: text(row.id || row.key || (domain + ":" + status)),
    domain, status,
    objective: text(row.objective),
    expected: row.expected ?? null,
    observed: row.observed ?? null,
    delta: row.delta ?? null,
    failed, unknown, measured, verified,
    evidence: row.evidence ?? null,
    provenance: row.provenance ?? null,
    customer_impact: clamp01(row.customer_impact),
    value_potential: clamp01(row.value_potential),
    capability_gain: clamp01(row.capability_gain),
    risk_reduction: clamp01(row.risk_reduction),
    reusability: clamp01(row.reusability),
    confidence: clamp01(row.confidence),
    cost: Math.max(0, finite(row.cost)),
    reversible: row.reversible !== false,
    requires_human: row.requires_human === true
  };
}

export function detectGap(observation = {}) {
  const gapSignals = [
    observation.failed,
    observation.unknown,
    observation.expected != null && observation.observed != null &&
      JSON.stringify(observation.expected) !== JSON.stringify(observation.observed),
    observation.verified === false && observation.measured === true,
    observation.status === "DRIFT",
    observation.status === "BLOCKED"
  ];
  const gap = gapSignals.some(Boolean);
  return {
    gap,
    state: gap ? "GAP_DETECTED" : "OBSERVE",
    reason: observation.failed ? "FAILURE"
      : observation.unknown ? "UNKNOWN"
      : observation.status === "DRIFT" ? "DRIFT"
      : observation.status === "BLOCKED" ? "BLOCKED"
      : gap ? "EXPECTED_OBSERVED_DELTA" : "NO_MATERIAL_GAP"
  };
}

export function scoreEvolutionCandidate(observation = {}) {
  const gap = detectGap(observation);
  const urgency = observation.failed ? 1 : observation.unknown ? 0.7 : gap.gap ? 0.6 : 0.2;
  const information = observation.unknown ? 0.9 : observation.confidence < 0.5 ? 0.7 : 0.4;
  const leverage =
    observation.capability_gain * 0.28 +
    observation.reusability * 0.22 +
    observation.value_potential * 0.22 +
    observation.customer_impact * 0.18 +
    observation.risk_reduction * 0.10;
  const penalty = Math.min(1, observation.cost / 100);
  return {
    ...observation,
    gap: gap.gap,
    gap_reason: gap.reason,
    priority: Number((urgency * 0.25 + information * 0.2 + leverage * 0.55 - penalty * 0.1).toFixed(6))
  };
}

export function discoverFrontier({ observations = [], capabilities = [], opportunities = [] } = {}) {
  const rows = [
    ...arr(observations).map(normalizeObservation),
    ...arr(capabilities).map((x) => normalizeObservation({ ...x, domain: "CAPABILITY" })),
    ...arr(opportunities).map((x) => normalizeObservation({ ...x, domain: "OPPORTUNITY" }))
  ];
  const scored = rows.map(scoreEvolutionCandidate);
  return {
    candidates: scored.sort((a,b) => b.priority - a.priority || a.id.localeCompare(b.id)),
    gap_count: scored.filter((x) => x.gap).length,
    unknown_count: scored.filter((x) => x.unknown).length,
    frontier_count: scored.length
  };
}

export function compareKnownResults(candidates = [], constraints = {}) {
  const filtered = arr(candidates)
    .filter((c) => c && c.rejected !== true && c.quarantined !== true)
    .filter((c) => constraints.domain == null || normalizeDomain(c.domain) === normalizeDomain(constraints.domain))
    .filter((c) => constraints.max_cost == null || finite(c.cost, Infinity) <= Number(constraints.max_cost))
    .filter((c) => constraints.verified !== true || c.verified === true);

  if (!filtered.length) return { status: "NO_COMPARABLE_RESULT", selected: null, candidates: [] };

  const ranked = filtered.map((c) => ({
    ...c,
    comparison_score: Number((
      clamp01(c.quality) * 0.3 +
      clamp01(c.reliability) * 0.2 +
      clamp01(c.customer_value) * 0.2 +
      clamp01(c.reusability) * 0.15 +
      clamp01(c.speed) * 0.1 +
      (1 - clamp01(c.risk)) * 0.05
    ).toFixed(6))
  })).sort((a,b) => b.comparison_score - a.comparison_score || text(a.id).localeCompare(text(b.id)));

  return {
    status: "BEST_KNOWN_IN_SCOPE",
    selected: ranked[0],
    candidates: ranked,
    scope: { ...constraints },
    global_best_claim: false
  };
}

export function composeEvolution({ gap, capabilities = [], results = [], constraints = {} } = {}) {
  const selected = arr(capabilities)
    .filter((c) => c && c.authority_granted !== true && c.state !== "QUARANTINED" && c.state !== "REVOKED")
    .filter((c) => !constraints.domain || normalizeDomain(c.domain) === normalizeDomain(constraints.domain))
    .slice(0, 12);
  const comparison = compareKnownResults(results, constraints);
  return {
    state: selected.length || comparison.selected ? "COMPOSE" : "DISCOVER",
    gap: gap || null,
    capabilities: selected.map((c) => text(c.id)).filter(Boolean),
    best_known: comparison.selected?.id || null,
    composition: [...selected.map((c) => text(c.id)).filter(Boolean), comparison.selected?.id].filter(Boolean),
    compatible: selected.length > 0,
    authority_granted: false,
    auto_merge: false,
    live: false
  };
}

export function buildEvolutionPortfolio({ frontier, maintenance, cycle } = {}) {
  const candidates = arr(frontier?.candidates).filter((x) => x.gap || x.unknown);
  const maintenanceFindings = arr(maintenance?.audit?.findings);
  const combined = [
    ...candidates.map((x) => ({ source: "evolution", ...x })),
    ...maintenanceFindings.map((x) => ({
      source: "maintenance",
      id: "maintenance:" + x.kind + ":" + (x.number || x.id || x.title || "unknown"),
      domain: x.kind === "FAILING_CHECK" || x.kind === "BROKEN_WORKFLOW" ? "CODE" : "ARCHITECTURE",
      gap: true,
      gap_reason: x.reason,
      priority: x.severity === "CRITICAL" ? 1 : x.severity === "HIGH" ? 0.8 : 0.5
    }))
  ];

  const ranked = combined
    .sort((a,b) => finite(b.priority) - finite(a.priority) || text(a.id).localeCompare(text(b.id)))
    .slice(0, 50);

  const actionable = ranked.filter((x) => x.requires_human !== true);
  const human = ranked.filter((x) => x.requires_human === true);
  const portfolioId = "evolution:" + digest({
    main_sha: cycle?.main_sha || null,
    candidates: ranked.map((x) => ({ id: x.id, domain: x.domain, gap_reason: x.gap_reason }))
  }).slice(0, 16);

  return {
    contract: CONTINUOUS_EVOLUTION_VERSION,
    action: human.length && !actionable.length ? "WAITING_HUMAN" : actionable.length ? "EVOLVE_PORTFOLIO" : "CONTINUE",
    portfolio_id: portfolioId,
    main_sha: cycle?.main_sha || null,
    one_coherent_change: actionable.length > 0,
    no_micro_tasks: true,
    ranked,
    actionable_count: actionable.length,
    human_count: human.length,
    domains: [...new Set(ranked.map((x) => normalizeDomain(x.domain)))],
    lifecycle: actionable.length
      ? ["OBSERVE","GAP_DETECTED","DISCOVER","COMPARE","COMPOSE","SIMULATE","PROPOSE","BUILD","TEST","FALSIFY","MEASURE","VERIFY","REGISTER","REUSE","REOBSERVE"]
      : ["OBSERVE","CONTINUE"],
    invariants: [
      "CURRENT_MAIN_IS_BASE","ONE_COHERENT_EVOLUTION_PORTFOLIO","NO_MICRO_TASKS",
      "NO_AUTO_MERGE","NO_AUTO_SPEND","NO_AI_AUTHORITY","CAPABILITY_NE_AUTHORITY",
      "NO_FAKE_LIVE","NO_FAKE_VERIFIED","NO_FAKE_PAYMENT","NO_FAKE_VALUE",
      "UNKNOWN_IS_RESEARCH_TARGET","BEST_KNOWN_IS_SCOPED","HUMAN_BOUNDARIES_PRESERVED",
      "MEASURE_BEFORE_REUSE","PROVENANCE_REQUIRED"
    ],
    generated_at: new Date().toISOString()
  };
}

export function buildEvolutionMandate({ portfolio, cycle, repo = "carllaliberte/famille" } = {}) {
  const findings = arr(portfolio?.ranked).map((x,i) =>
    (i + 1) + ". [" + x.domain + "] " + x.id + " — " + (x.gap_reason || "frontier opportunity")
  );
  return [
    "# ACORN — CONTINUOUS EVOLUTION MANDATE","",
    "This is one coherent evolution chantier. Do not split it into micro-PRs.","",
    "Repository: " + repo,
    "MAIN observed: " + (cycle?.main_sha || "UNKNOWN"),
    "Portfolio: " + (portfolio?.portfolio_id || "UNKNOWN"),"",
    "## Objective",
    "Continuously reduce the measured gap between human intent and reality while increasing useful, reusable, verified capability.","",
    "## Universal loop",
    "WORLD → OBSERVE → GAP → DISCOVER → COMPARE → COMPOSE → SIMULATE → PROPOSE → BUILD/EXECUTE → MEASURE → FALSIFY → VERIFY → REGISTER → REUSE → OBSERVE","",
    "## Search surface",
    "Inspect customer outcome, product friction, market demand, capabilities, intelligences, connectors, code, architecture, quality, security, performance, economics, resources, evidence, knowledge, opportunities and real-world execution.","",
    "## DECLARED ≠ OBSERVED",
    "The 18 surfaces are observed one row each. A declaration is not an observation.",
    "Missing snapshot evidence stays NOT_MEASURED / UNKNOWN. The hole is named. It is not filled.",
    "Carte juge absente → MODE classique. Pas d'invention des quatre champs.","",
    "## Frontier rule",
    "Always seek the best known sufficiently demonstrated result within explicit scope. Never convert an unmeasured finite candidate set into a global-best claim.","",
    "## Learning rule",
    "Every verified outcome may become reusable capability only with provenance, rights, current evidence and expiry-aware status.","",
    "## Findings",
    ...findings,"",
    "## Non-negotiable boundaries",
    "- CAPABILITY ≠ AUTHORITY.",
    "- LEARNING ≠ AUTHORITY.",
    "- BUILD ≠ MERGE.",
    "- CODE_PRESENT ≠ TESTED ≠ EXECUTED ≠ MEASURED ≠ VERIFIED ≠ LIVE.",
    "- Never auto-merge, auto-spend, auto-sign, auto-publish or self-authorize.",
    "- Never invent payment, revenue, customer value, LIVE or VERIFIED state.",
    "- Human secrets, payments, contracts, signatures, publication and merge remain human/server-controlled.",
    "- If evidence is missing, say UNKNOWN / NOT_MEASURED / WAITING_HUMAN rather than filling the gap.","",
    "## Completion",
    "Recompose useful work on current MAIN, implement one coherent changeset, run tests, falsification and measurement, verify evidence, then open ONE PR for Carl. After merge, observe MAIN again and continue.",""
  ].join("\n");
}

export function runContinuousEvolution(snapshot = {}) {
  const maintenance = maintenanceNextAction({
    ...snapshot,
    repository: snapshot.repository || "carllaliberte/famille"
  });

  const universal = buildUniversalEvolutionCycle({
    observation: snapshot.observation || { status: "OBSERVED", category: "ARCHITECTURE" },
    execution: snapshot.execution || {},
    tests: snapshot.tests || {},
    measurement: snapshot.measurement || {},
    evidence: snapshot.evidence || {},
    work: snapshot.work || {}
  });

  const strategy = runCognitiveStrategyLearningCycle({
    context: snapshot.strategy_context || { task_kind: "continuous-evolution", objective: "reduce-gap" },
    composition: snapshot.strategy_composition || ["existing-fabrics"],
    outcome: snapshot.strategy_outcome || {
      verified: snapshot.measurement?.measured === true,
      error: 0,
      information_gain: 0.5,
      capability_gain: 0.5,
      control_gap: 0,
      reversibility: 1
    },
    now: snapshot.observed_at || new Date().toISOString()
  });

  const juge = judgeCardPresence(snapshot);
  const observations = collectEvolutionObservations(snapshot);
  const frontier = discoverFrontier({
    observations,
    capabilities: snapshot.capabilities || [],
    opportunities: snapshot.opportunities || []
  });

  const portfolio = buildEvolutionPortfolio({
    frontier,
    maintenance,
    cycle: { main_sha: snapshot.main_sha || null }
  });

  const mandate = buildEvolutionMandate({
    portfolio,
    cycle: { main_sha: snapshot.main_sha || null },
    repo: snapshot.repository || "carllaliberte/famille"
  });

  const action = portfolio.action === "EVOLVE_PORTFOLIO"
    ? "EVOLVE_PORTFOLIO"
    : maintenance.action === "REPAIR_PORTFOLIO"
      ? "REPAIR_PORTFOLIO"
      : portfolio.action;

  return {
    version: CONTINUOUS_EVOLUTION_VERSION,
    action,
    mode: juge.mode,
    juge,
    observations,
    declared_surface_count: DECLARED_EVOLUTION_SURFACES.length,
    observed_surface_count: DECLARED_EVOLUTION_SURFACES.filter((domain) =>
      observations.some((row) => row.domain === domain)
    ).length,
    portfolio,
    mandate,
    frontier,
    maintenance: {
      action: maintenance.action,
      portfolio_id: maintenance.portfolio_id,
      finding_count: maintenance.finding_count,
      actionable_count: maintenance.actionable_count
    },
    universal: { state: universal.state, verification: universal.verification },
    strategy: {
      status: strategy.status,
      selected: strategy.selection?.status || "NO_SELECTION",
      authority_granted: false
    },
    constitutional: evolutionConstitution(),
    auto_merge: false,
    auto_spend: false,
    live: false,
    authority: "carl",
    observed_at: new Date().toISOString()
  };
}

export function assertContinuousEvolutionContract(result = {}) {
  if (result.auto_merge !== false) throw new Error("EVOLUTION_AUTO_MERGE_FORBIDDEN");
  if (result.auto_spend !== false) throw new Error("EVOLUTION_AUTO_SPEND_FORBIDDEN");
  if (result.live !== false) throw new Error("EVOLUTION_LIVE_CLAIM_FORBIDDEN");
  if (result.authority !== "carl") throw new Error("EVOLUTION_AUTHORITY_MUST_REMAIN_HUMAN");
  if (result.constitutional?.capability_is_not_authority !== true) {
    throw new Error("EVOLUTION_CAPABILITY_AUTHORITY_BOUNDARY_FAILED");
  }
  if (result.portfolio?.one_coherent_change && result.portfolio.no_micro_tasks !== true) {
    throw new Error("EVOLUTION_MICRO_TASK_SPLIT_FORBIDDEN");
  }
  const observedDomains = new Set(arr(result.observations).map((row) => row.domain));
  for (const surface of DECLARED_EVOLUTION_SURFACES) {
    if (!observedDomains.has(surface)) {
      throw new Error("EVOLUTION_DECLARED_SURFACE_NOT_OBSERVED:" + surface);
    }
  }
  if (result.juge?.present !== true && result.mode !== "classique") {
    throw new Error("EVOLUTION_MISSING_JUGE_MUST_STAY_CLASSIQUE");
  }
  if (arr(result.observations).some((row) => row.verified === true || row.measured === true)) {
    throw new Error("EVOLUTION_FAKE_MEASURED_OR_VERIFIED_FORBIDDEN");
  }
  return true;
}

function loadEvolutionInput(path) {
  if (path) return JSON.parse(readFileSync(path, "utf8"));
  if (process.env.ACORN_EVOLUTION_SNAPSHOT) return JSON.parse(process.env.ACORN_EVOLUTION_SNAPSHOT);
  return {
    repository: process.env.GITHUB_REPOSITORY || "carllaliberte/famille",
    main_sha: process.env.GITHUB_SHA || "UNKNOWN"
  };
}

if (import.meta.url === "file://" + process.argv[1]) {
  const input = process.argv[2] ? loadEvolutionInput(process.argv[2]) : loadEvolutionInput(null);
  const result = runContinuousEvolution(input);
  assertContinuousEvolutionContract(result);
  const output = process.env.ACORN_EVOLUTION_OUTPUT;
  if (output) writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
  console.log(JSON.stringify(result, null, 2));
}
