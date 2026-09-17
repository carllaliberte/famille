#!/usr/bin/env node
/**
 * ACORN CORTEX — Evolution Governor.
 *
 * The Governor is a function of the existing Cortex, not a second Cortex,
 * runtime, defense kernel, Breaker, or authority layer.
 *
 * It decides which already-proposed evolution experiment deserves the next
 * bounded attempt. It does not grant authority, merge, declare LIVE, or alter
 * constitutional invariants.
 *
 * CONSTITUTION > GOVERNOR > EXPERIMENT PORTFOLIO.
 * CAPABILITY ≠ AUTHORITY.
 * PROPOSED ≠ ADOPTED.
 * UNKNOWN ≠ SAFE.
 * UNOBSERVED ≠ SAFE.
 * live=false.
 */

import { valueOfInformation, whenToAskHuman } from "./cortex-ecosystem.mjs";

export const EVOLUTION_GOVERNOR_VERSION = "cortex.evolution-governor.v1";
export const GOVERNOR_MODES = Object.freeze(["EXPLORE", "EXPLOIT", "BALANCED", "COOL_DOWN", "HUMAN_GATE"]);
export const GOVERNOR_STATES = Object.freeze([
  "PROPOSED", "ELIGIBLE", "SELECTED", "EXECUTED", "MEASURED",
  "VERIFIED", "REJECTED", "INCONCLUSIVE", "REGRESSION", "HOLD_HUMAN",
  "QUARANTINED",
]);

const clamp01 = (value) => Math.max(0, Math.min(1, Number.isFinite(Number(value)) ? Number(value) : 0));
const text = (value) => String(value ?? "").trim();
const list = (value) => Array.isArray(value) ? value.map(text).filter(Boolean) : [];

function digest(value) {
  const raw = JSON.stringify(value ?? null);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function riskValue(value) {
  if (typeof value === "number") return clamp01(value);
  const map = { none: 0, low: 0.15, medium: 0.45, high: 0.75, critical: 1 };
  return map[text(value).toLowerCase()] ?? 0.5;
}

function reversibilityValue(value) {
  if (typeof value === "number") return clamp01(value);
  const map = { reversible: 1, partial: 0.6, partially_reversible: 0.6, irreversible: 0, unknown: 0 };
  return map[text(value).toLowerCase()] ?? 0;
}

function normalizeCandidate(input = {}, index = 0) {
  const id = text(input.id || input.experiment_id || input.hypothesis_id) || `candidate-${index + 1}`;
  const unknown = clamp01(input.uncertainty ?? input.unknown ?? 0.5);
  const information = clamp01(input.expected_information_gain ?? input.information_gain ?? input.voi ?? unknown);
  const benefit = clamp01(input.expected_benefit ?? input.benefit ?? input.expected_effect ?? 0.5);
  const novelty = clamp01(input.novelty ?? 0.5);
  const diversity = clamp01(input.diversity ?? 0.5);
  const correlation = clamp01(input.correlation ?? 0);
  const risk = riskValue(input.risk);
  const blast = clamp01(input.blast_radius ?? input.impact ?? 0);
  const controlGap = clamp01(input.control_gap ?? 0);
  const cost = clamp01(input.cost ?? input.cognitive_cost ?? 0.25);
  const reversibility = reversibilityValue(input.reversibility ?? "unknown");
  const measured = input.measured === true || input.status === "MEASURED" || input.status === "VERIFIED";
  const verified = input.verified === true || input.status === "VERIFIED";
  const channelPresent = input.channel_present !== false;
  const capabilityAvailable = input.capability_available !== false;
  return {
    ...input,
    id,
    objective: text(input.objective || input.task || "evolution"),
    hypothesis: text(input.hypothesis || input.statement || id),
    expected_information_gain: information,
    expected_benefit: benefit,
    uncertainty: unknown,
    novelty,
    diversity,
    correlation,
    risk,
    blast_radius: blast,
    control_gap: controlGap,
    cost,
    reversibility,
    measured,
    verified,
    channel_present: channelPresent,
    capability_available: capabilityAvailable,
    authority_required: input.authority_required === true,
    constitutional_change: input.constitutional_change === true,
    breaker_change: input.breaker_change === true,
    merge: input.merge === true,
    write: input.write === true,
    live_claim: input.live_claim === true,
    unobserved_capability_path: input.unobserved_capability_path === true,
    dependency_count: Math.max(0, Math.floor(number(input.dependency_count, 0))),
    failure_count: Math.max(0, Math.floor(number(input.failure_count, 0))),
    success_rate: clamp01(input.success_rate ?? 0.5),
    strategy: text(input.strategy || "unspecified"),
    evidence_quality: clamp01(input.evidence_quality ?? (verified ? 1 : measured ? 0.6 : 0.25)),
    live: false,
  };
}

function hardBlock(candidate) {
  const reasons = [];
  if (candidate.constitutional_change) reasons.push("CONSTITUTION_IMMUTABLE");
  if (candidate.authority_required) reasons.push("AUTHORITY_REQUIRED");
  if (candidate.breaker_change) reasons.push("BREAKER_CARL_ONLY");
  if (candidate.merge) reasons.push("MERGE_CARL_ONLY");
  if (candidate.write) reasons.push("AI_WRITE_DENIED");
  if (candidate.live_claim) reasons.push("LIVE_NOT_MINTED");
  if (candidate.unobserved_capability_path) reasons.push("NO_UNOBSERVED_CAPABILITY_PATH");
  if (!candidate.channel_present) reasons.push("CHANNEL_NOT_PRESENT");
  if (!candidate.capability_available) reasons.push("CAPABILITY_NOT_AVAILABLE");
  if (candidate.control_gap >= 0.8) reasons.push("CONTROL_GAP_TOO_LARGE");
  if (candidate.risk >= 0.95) reasons.push("RISK_TOO_HIGH");
  if (candidate.reversibility === 0 && candidate.blast_radius >= 0.5) reasons.push("IRREVERSIBILITY_WITH_BLAST_RADIUS");
  return reasons;
}

export function governorConstitution() {
  return {
    hierarchy: ["CONSTITUTION", "EVOLUTION_GOVERNOR", "EXPERIMENT_PORTFOLIO", "RESOURCES"],
    governor_is_not_authority: true,
    governor_cannot_modify_constitution: true,
    governor_cannot_change_breaker: true,
    governor_cannot_merge: true,
    governor_cannot_write: true,
    governor_cannot_mint_live: true,
    capability_is_not_authority: true,
    unknown_is_not_safe: true,
    unobserved_is_not_safe: true,
    human_authority: "carl",
    auto_merge: false,
    live: false,
  };
}

export function selectGovernorMode({ candidates = [], recent = [], pressure = {} } = {}) {
  const rows = candidates.map(normalizeCandidate);
  const eligible = rows.filter((row) => hardBlock(row).length === 0);
  const recentFailures = recent.filter((row) => ["VERIFIED_FAILURE", "REGRESSION", "REJECTED"].includes(text(row.verdict || row.status))).length;
  const recentSuccesses = recent.filter((row) => ["VERIFIED_SUCCESS", "VERIFIED", "ADOPTED"].includes(text(row.verdict || row.status))).length;
  const uncertainty = eligible.length ? eligible.reduce((sum, row) => sum + row.uncertainty, 0) / eligible.length : 1;
  const correlated = eligible.length ? eligible.reduce((sum, row) => sum + row.correlation, 0) / eligible.length : 1;
  const overloaded = pressure.overloaded === true || number(pressure.concurrent, 0) > number(pressure.max_concurrent, 2);
  if (overloaded || number(pressure.risk_pressure, 0) >= 0.8) return "COOL_DOWN";
  if (!eligible.length) return "HUMAN_GATE";
  if (recentFailures > recentSuccesses + 1 || correlated >= 0.75 || uncertainty >= 0.8) return "EXPLORE";
  if (recentSuccesses > recentFailures + 1 && uncertainty < 0.45) return "EXPLOIT";
  return "BALANCED";
}

export function scoreCandidate(candidateInput = {}, { mode = "BALANCED", portfolio = [] } = {}) {
  const candidate = normalizeCandidate(candidateInput);
  const blocked = hardBlock(candidate);
  const diversityPeers = portfolio.filter((row) => row.strategy && row.strategy === candidate.strategy && row.id !== candidate.id).length;
  const diversityBonus = Math.max(0, candidate.diversity - candidate.correlation * 0.75 - diversityPeers * 0.1);
  const informationGain = Number.isFinite(Number(candidate.risk_adjusted_information_gain))
    ? clamp01(candidate.risk_adjusted_information_gain)
    : candidate.expected_information_gain;
  const information = informationGain * 30;
  const benefit = candidate.expected_benefit * 25;
  const uncertainty = candidate.uncertainty * (mode === "EXPLORE" ? 20 : mode === "EXPLOIT" ? 5 : 12);
  const novelty = candidate.novelty * (mode === "EXPLORE" ? 15 : 7);
  const diversity = diversityBonus * 10;
  const evidence = candidate.evidence_quality * (mode === "EXPLOIT" ? 12 : 6);
  const success = candidate.success_rate * (mode === "EXPLOIT" ? 8 : 3);
  const costPenalty = candidate.cost * 15;
  const riskPenalty = candidate.risk * 25;
  const blastPenalty = candidate.blast_radius * 20;
  const controlPenalty = candidate.control_gap * 30;
  const correlationPenalty = candidate.correlation * 10;
  const reversibilityBonus = candidate.reversibility * 8;
  const score = information + benefit + uncertainty + novelty + diversity + evidence + success + reversibilityBonus
    - costPenalty - riskPenalty - blastPenalty - controlPenalty - correlationPenalty;
  return {
    candidate,
    eligible: blocked.length === 0,
    blocked_reasons: blocked,
    score: Number(score.toFixed(4)),
    components: {
      information, benefit, uncertainty, novelty, diversity, evidence, success,
      reversibility: reversibilityBonus, cost: -costPenalty, risk: -riskPenalty,
      blast_radius: -blastPenalty, control_gap: -controlPenalty, correlation: -correlationPenalty,
    },
    live: false,
  };
}

export function rankPortfolio(candidates = [], { mode = "BALANCED" } = {}) {
  const normalized = candidates.map(normalizeCandidate);
  return normalized
    .map((candidate) => scoreCandidate(candidate, { mode, portfolio: normalized }))
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));
}

export function allocateEvolutionBudget({ candidates = [], max_concurrent = 1, risk_budget = 1, cognitive_budget = 1, cost_budget = 1 } = {}) {
  const ranked = rankPortfolio(candidates, { mode: "BALANCED" });
  const selected = [];
  let risk = 0;
  let cognitive = 0;
  let cost = 0;
  for (const row of ranked) {
    if (!row.eligible) continue;
    const nextRisk = risk + row.candidate.risk * Math.max(row.candidate.blast_radius, 0.25);
    const nextCognitive = cognitive + row.candidate.cost;
    const nextCost = cost + row.candidate.cost;
    if (selected.length >= Math.max(1, Math.floor(max_concurrent))) break;
    if (nextRisk > Number(risk_budget)) continue;
    if (nextCognitive > Number(cognitive_budget)) continue;
    if (nextCost > Number(cost_budget)) continue;
    selected.push(row);
    risk = nextRisk;
    cognitive = nextCognitive;
    cost = nextCost;
  }
  return {
    status: "PROPOSED",
    selected,
    budget: {
      risk_used: Number(risk.toFixed(4)),
      cognitive_used: Number(cognitive.toFixed(4)),
      cost_used: Number(cost.toFixed(4)),
      risk_remaining: Math.max(0, Number(risk_budget) - risk),
      cognitive_remaining: Math.max(0, Number(cognitive_budget) - cognitive),
      cost_remaining: Math.max(0, Number(cost_budget) - cost),
    },
    auto_merge: false,
    live: false,
  };
}

export function governorDecision(ranked = [], { mode = "BALANCED", pressure = {} } = {}) {
  const top = ranked.find((row) => row.eligible);
  if (mode === "COOL_DOWN") {
    return {
      decision: "PAUSE",
      state: "HOLD_HUMAN",
      reason: "evolution pressure exceeds safe operating envelope",
      selected: null,
      continue: false,
      live: false,
    };
  }
  if (!top) {
    const human = whenToAskHuman({ risk: "high", authority_required: true, uncertainty: "CONFLICTING" });
    return {
      decision: "HUMAN_GATE",
      state: "HOLD_HUMAN",
      reason: human.why,
      selected: null,
      continue: false,
      live: false,
    };
  }
  if (top.score < 0) {
    return {
      decision: "NO_GOOD_EXPERIMENT",
      state: "PROPOSED",
      reason: "all eligible experiments have negative expected value after safety and cost penalties",
      selected: null,
      continue: false,
      live: false,
    };
  }
  return {
    decision: mode === "EXPLORE" ? "SELECT_EXPLORE" : mode === "EXPLOIT" ? "SELECT_EXPLOIT" : "SELECT",
    state: "SELECTED",
    reason: `selected ${top.candidate.id} under ${mode}`,
    selected: top.candidate,
    score: top.score,
    pressure,
    continue: true,
    live: false,
  };
}

export function evaluatePortfolio({
  candidates = [],
  recent = [],
  pressure = {},
  max_concurrent = 1,
  risk_budget = 0.8,
  cognitive_budget = 1,
  cost_budget = 1,
} = {}) {
  const normalized = candidates.map(normalizeCandidate);
  const mode = selectGovernorMode({ candidates: normalized, recent, pressure });
  const ranked = rankPortfolio(normalized, { mode });
  const allocation = mode === "COOL_DOWN" || mode === "HUMAN_GATE"
    ? { status: "PAUSED", selected: [], budget: { risk_used: 0, cognitive_used: 0, cost_used: 0, risk_remaining: risk_budget, cognitive_remaining: cognitive_budget, cost_remaining: cost_budget }, live: false }
    : allocateEvolutionBudget({ candidates: normalized, max_concurrent, risk_budget, cognitive_budget, cost_budget });
  const decision = governorDecision(ranked, { mode, pressure });
  const selectedIds = new Set(allocation.selected.map((row) => row.candidate.id));
  const queue = ranked.map((row) => ({
    ...row,
    state: selectedIds.has(row.candidate.id) && decision.selected?.id === row.candidate.id ? "SELECTED" : row.eligible ? "ELIGIBLE" : "QUARANTINED",
  }));
  return {
    status: "EXECUTED",
    version: EVOLUTION_GOVERNOR_VERSION,
    constitution: governorConstitution(),
    mode,
    queue,
    allocation,
    decision,
    portfolio: {
      total: normalized.length,
      eligible: queue.filter((row) => row.eligible).length,
      blocked: queue.filter((row) => !row.eligible).length,
      selected: allocation.selected.length,
      strategies: [...new Set(normalized.map((row) => row.strategy).filter(Boolean))],
    },
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function governorNextExperiment(input = {}) {
  const result = evaluatePortfolio(input);
  const selected = result.decision.selected;
  if (!selected) return result;
  const voi = valueOfInformation({
    unknown: { region: selected.uncertainty > 0.5 ? "UNCERTAIN" : "KNOWN" },
    cost: selected.cost,
    expected_reduction: selected.expected_information_gain,
  });
  return {
    ...result,
    next: {
      experiment_id: selected.id,
      objective: selected.objective,
      hypothesis: selected.hypothesis,
      mode: result.mode,
      expected_information_gain: selected.expected_information_gain,
      value_of_information: voi,
      rollback_required: true,
      checkpoint_required: true,
      causal_claim: selected.causal_claim === true ? "REQUIRES_INTERVENTION" : "NOT_CLAIMED",
      authority: "carl",
      live: false,
    },
    live: false,
  };
}

export function recordGovernorOutcome(candidateInput = {}, outcome = {}) {
  const candidate = normalizeCandidate(candidateInput);
  const status = text(outcome.verdict || outcome.status || "INCONCLUSIVE");
  const verified = status === "VERIFIED_SUCCESS" || status === "VERIFIED";
  const failure = status === "VERIFIED_FAILURE" || status === "REGRESSION" || status === "REJECTED";
  const nextSuccess = verified ? candidate.success_rate * 0.8 + 0.2 : failure ? candidate.success_rate * 0.8 : candidate.success_rate * 0.9;
  return {
    status: "MEASURED",
    candidate_id: candidate.id,
    outcome: status,
    learning: {
      success_rate: Number(nextSuccess.toFixed(4)),
      failure_count: candidate.failure_count + (failure ? 1 : 0),
      verified,
      failure_is_data: failure,
      requeue: status === "INCONCLUSIVE",
      quarantine: status === "REGRESSION" && candidate.blast_radius >= 0.5,
    },
    history_rewritten: false,
    live: false,
  };
}

export function assertGovernorInvariant(result = {}) {
  const checks = {
    one_governor: result.version === EVOLUTION_GOVERNOR_VERSION,
    constitution_above_governor: result.constitution?.hierarchy?.[0] === "CONSTITUTION",
    governor_not_authority: result.constitution?.governor_is_not_authority === true,
    no_constitutional_change: result.constitution?.governor_cannot_modify_constitution === true,
    carl_controls_breaker: result.constitution?.governor_cannot_change_breaker === true,
    no_merge: result.auto_merge === false && result.constitution?.governor_cannot_merge === true,
    no_write: result.constitution?.governor_cannot_write === true,
    no_live: result.live === false && result.constitution?.governor_cannot_mint_live === true,
    capability_not_authority: result.constitution?.capability_is_not_authority === true,
    unknown_not_safe: result.constitution?.unknown_is_not_safe === true,
    unobserved_not_safe: result.constitution?.unobserved_is_not_safe === true,
  };
  return {
    status: Object.values(checks).every(Boolean) ? "VERIFIED" : "FAILED",
    checks,
    live: false,
  };
}

export function runEvolutionGovernor(input = {}) {
  const result = governorNextExperiment(input);
  const invariant = assertGovernorInvariant(result);
  return {
    ...result,
    invariant,
    verified: invariant.status === "VERIFIED",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}
