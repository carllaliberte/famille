#!/usr/bin/env node
import { createHash } from "node:crypto";

export const COGNITIVE_STRATEGY_VERSION = "acorn.cortex.cognitive-strategy.v1";
export const STRATEGY_STATES = Object.freeze(["CANDIDATE", "LEARNED", "CONTRADICTED", "EXPIRED"]);

const clean = (v) => String(v ?? "").trim();
const arr = (v) => Array.isArray(v) ? [...new Set(v.map(clean).filter(Boolean))].sort() : [];
const finite = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const clamp01 = (v) => Math.max(0, Math.min(1, finite(v)));

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function contextFingerprint(context = {}) {
  return digest({
    task_kind: clean(context.task_kind || context.kind),
    objective: clean(context.objective),
    risk: clean(context.risk),
    required_capabilities: arr(context.required_capabilities || context.capabilities),
    environment: clean(context.environment),
  });
}

export function strategyFingerprint({ context = {}, composition = [] } = {}) {
  return digest({ context: contextFingerprint(context), composition: arr(composition) });
}

export function createStrategy({ context = {}, composition = [], evidence = {} } = {}) {
  const compositionIds = arr(composition);
  return {
    id: strategyFingerprint({ context, composition: compositionIds }),
    context_fingerprint: contextFingerprint(context),
    composition: compositionIds,
    state: "CANDIDATE",
    evidence_count: 0,
    verified_count: 0,
    contradictions: 0,
    confidence: 0,
    information_gain: clamp01(evidence.information_gain),
    capability_gain: clamp01(evidence.capability_gain),
    control_gap: clamp01(evidence.control_gap),
    reversibility: clamp01(evidence.reversibility),
    last_verified_at: null,
    expires_at: null,
    authority_granted: false,
    live: false,
  };
}

export function scoreOutcome(outcome = {}) {
  const error = clamp01(outcome.error);
  const contradiction = outcome.contradiction === true ? 1 : 0;
  const verified = outcome.verified === true ? 1 : 0;
  const informationGain = clamp01(outcome.information_gain);
  const capabilityGain = clamp01(outcome.capability_gain);
  const controlGap = clamp01(outcome.control_gap);
  const reversible = clamp01(outcome.reversibility);
  return clamp01(
    verified * 0.35 + informationGain * 0.2 + capabilityGain * 0.2 + reversible * 0.1 +
    (1 - error) * 0.1 + (1 - controlGap) * 0.05 - contradiction * 0.35,
  );
}

export function learnStrategy(strategy, outcome = {}, now = "") {
  const next = { ...strategy };
  const score = scoreOutcome(outcome);
  next.evidence_count += 1;
  if (outcome.verified === true) next.verified_count += 1;
  if (outcome.contradiction === true) next.contradictions += 1;
  next.confidence = clamp01((next.confidence * (next.evidence_count - 1) + score) / next.evidence_count);
  next.information_gain = clamp01((next.information_gain + clamp01(outcome.information_gain)) / 2);
  next.capability_gain = clamp01((next.capability_gain + clamp01(outcome.capability_gain)) / 2);
  next.control_gap = clamp01((next.control_gap + clamp01(outcome.control_gap)) / 2);
  next.reversibility = clamp01((next.reversibility + clamp01(outcome.reversibility)) / 2);
  next.last_verified_at = outcome.verified === true ? clean(now) : next.last_verified_at;
  if (outcome.contradiction === true) next.state = "CONTRADICTED";
  else if (outcome.verified === true && next.verified_count > 0) next.state = "LEARNED";
  return next;
}

export function expireStrategy(strategy, now = "") {
  if (!strategy) return { state: "EXPIRED", reason: "MISSING_STRATEGY" };
  if (strategy.expires_at && clean(now) >= clean(strategy.expires_at)) {
    return { ...strategy, state: "EXPIRED", expired: true, reason: "EVIDENCE_EXPIRED" };
  }
  return { ...strategy, expired: false };
}

export function selectStrategy({ context = {}, strategies = [], now = "" } = {}) {
  const fp = contextFingerprint(context);
  const candidates = strategies
    .map((strategy) => expireStrategy(strategy, now))
    .filter((strategy) => strategy.context_fingerprint === fp && strategy.state === "LEARNED" && strategy.expired !== true)
    .sort((a, b) => b.confidence - a.confidence || b.verified_count - a.verified_count || a.id.localeCompare(b.id));
  if (!candidates.length) return { status: "NO_LEARNED_STRATEGY", strategy: null, context_fingerprint: fp };
  return { status: "SELECTED", strategy: candidates[0], context_fingerprint: fp };
}

export function buildStrategyMemory(previous = [], strategy, outcome, now = "") {
  const current = Array.isArray(previous) ? previous : [];
  const existing = current.find((item) => item.id === strategy.id) || strategy;
  const learned = learnStrategy(existing, outcome, now);
  return current.some((item) => item.id === strategy.id)
    ? current.map((item) => item.id === strategy.id ? learned : item)
    : [...current, learned];
}

export function assertCognitiveStrategyInvariant(memory = []) {
  const violations = [];
  for (const strategy of memory) {
    if (strategy.authority_granted !== false) violations.push(`${strategy.id}:AUTHORITY`);
    if (strategy.live !== false) violations.push(`${strategy.id}:LIVE`);
    if (strategy.confidence < 0 || strategy.confidence > 1) violations.push(`${strategy.id}:CONFIDENCE`);
    if (strategy.verified_count > strategy.evidence_count) violations.push(`${strategy.id}:VERIFIED_COUNT`);
  }
  return { status: violations.length ? "HOLD_HUMAN" : "VERIFIED", violations };
}

export function runCognitiveStrategyLearningCycle(input = {}) {
  const context = input.context ?? {};
  const composition = input.composition ?? [];
  const strategy = createStrategy({ context, composition });
  const memory = buildStrategyMemory(input.memory ?? [], strategy, input.outcome ?? {}, input.now ?? "cycle-1");
  const selected = selectStrategy({ context, strategies: memory, now: input.now ?? "cycle-1" });
  const invariant = assertCognitiveStrategyInvariant(memory);
  return {
    version: COGNITIVE_STRATEGY_VERSION,
    status: invariant.status === "VERIFIED" ? "VERIFIED" : "BLOCKED",
    context_fingerprint: contextFingerprint(context),
    strategy_fingerprint: strategy.id,
    strategy: memory.find((item) => item.id === strategy.id) ?? strategy,
    memory,
    selection: selected,
    invariant,
    authority: "carl",
    authority_granted: false,
    breaker_bypass: false,
    auto_merge: false,
    live: false,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(runCognitiveStrategyLearningCycle({
    context: { task_kind: "reasoning", objective: "self-measure", capabilities: ["reasoning"] },
    composition: ["cortex"],
    outcome: { verified: true, error: 0, information_gain: 0.8, capability_gain: 0.2, control_gap: 0, reversibility: 1 },
    now: "strategy-cycle-1",
  }), null, 2));
}
