#!/usr/bin/env node
/**
 * ACORN RESOURCE GOVERNOR
 *
 * Resource economy for continuous work. It does not acquire authority.
 * It budgets compute, model calls, network, time, storage and human attention.
 *
 * Default policy is FREE_FIRST with model_calls=0 and external_spend=0.
 * A resource can be discovered without being trusted or executable.
 */

export const RESOURCE_GOVERNOR_VERSION = "acorn.resource-governor.v1";

export const RESOURCE_AXES = Object.freeze([
  "wall_time_ms",
  "cpu_ms",
  "model_calls",
  "model_tokens",
  "network_calls",
  "storage_bytes",
  "actions",
  "external_spend",
  "human_attention",
]);

export const DEFAULT_LIMITS = Object.freeze({
  wall_time_ms: 7 * 60_000,
  cpu_ms: 6 * 60_000,
  model_calls: 0,
  model_tokens: 0,
  network_calls: 0,
  storage_bytes: 25 * 1024 * 1024,
  actions: 100,
  external_spend: 0,
  human_attention: 0,
});

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function nonNegative(value, fallback = 0) {
  const n = finite(value);
  return n == null ? fallback : Math.max(0, n);
}

function envNumber(env, key, fallback) {
  const n = finite(env?.[key]);
  return n == null ? fallback : Math.max(0, n);
}

export function limitsFromEnv(env = process.env, overrides = {}) {
  const base = {
    ...DEFAULT_LIMITS,
    wall_time_ms: envNumber(env, "ACORN_BUDGET_WALL_MS", DEFAULT_LIMITS.wall_time_ms),
    cpu_ms: envNumber(env, "ACORN_BUDGET_CPU_MS", DEFAULT_LIMITS.cpu_ms),
    model_calls: envNumber(env, "ACORN_BUDGET_MODEL_CALLS", DEFAULT_LIMITS.model_calls),
    model_tokens: envNumber(env, "ACORN_BUDGET_MODEL_TOKENS", DEFAULT_LIMITS.model_tokens),
    network_calls: envNumber(env, "ACORN_BUDGET_NETWORK_CALLS", DEFAULT_LIMITS.network_calls),
    storage_bytes: envNumber(env, "ACORN_BUDGET_STORAGE_BYTES", DEFAULT_LIMITS.storage_bytes),
    actions: envNumber(env, "ACORN_BUDGET_ACTIONS", DEFAULT_LIMITS.actions),
    external_spend: envNumber(env, "ACORN_BUDGET_EXTERNAL_SPEND", DEFAULT_LIMITS.external_spend),
    human_attention: envNumber(env, "ACORN_BUDGET_HUMAN_ATTENTION", DEFAULT_LIMITS.human_attention),
  };
  return { ...base, ...overrides };
}

export function normalizeUsage(usage = {}) {
  return Object.fromEntries(RESOURCE_AXES.map((axis) => [axis, nonNegative(usage[axis])]));
}

export function remainingBudget(limits = DEFAULT_LIMITS, usage = {}) {
  const normalized = normalizeUsage(usage);
  const remaining = {};
  const exhausted = [];
  for (const axis of RESOURCE_AXES) {
    const limit = finite(limits[axis]);
    const used = normalized[axis];
    remaining[axis] = limit == null ? "UNKNOWN" : Number((limit - used).toFixed(6));
    if (limit != null && remaining[axis] < 0) exhausted.push(axis);
  }
  return { remaining, exhausted, exhausted_any: exhausted.length > 0 };
}

export function resourcePolicy({ env = process.env, limits = limitsFromEnv(env) } = {}) {
  const paid = limits.external_spend > 0;
  const model = limits.model_calls > 0 || limits.model_tokens > 0;
  const network = limits.network_calls > 0;
  return {
    version: RESOURCE_GOVERNOR_VERSION,
    mode: paid ? "PAID_ALLOWED" : "FREE_FIRST",
    model_execution_allowed: model,
    network_execution_allowed: network,
    external_spend_allowed: paid,
    human_attention_allowed: limits.human_attention > 0,
    auto_spend: false,
    auto_merge: false,
    authority: "carl",
    capability_is_not_authority: true,
    default_zero_model_budget: limits.model_calls === 0 && limits.model_tokens === 0,
    limits,
  };
}

export function canConsume({ limits, usage = {}, cost = {} } = {}) {
  const policy = remainingBudget(limits, usage);
  const normalizedCost = normalizeUsage(cost);
  const insufficient = [];
  for (const axis of RESOURCE_AXES) {
    const left = policy.remaining[axis];
    if (left !== "UNKNOWN" && normalizedCost[axis] > left) insufficient.push(axis);
  }
  return {
    allowed: insufficient.length === 0,
    insufficient,
    reason: insufficient.length ? "RESOURCE_BUDGET_EXHAUSTED" : "WITHIN_BUDGET",
    remaining_before: policy.remaining,
  };
}

export function reserve({ limits, usage = {}, cost = {}, label = "work" } = {}) {
  const decision = canConsume({ limits, usage, cost });
  if (!decision.allowed) {
    return {
      status: "BLOCKED_BUDGET",
      label,
      decision,
      usage: normalizeUsage(usage),
      cost: normalizeUsage(cost),
      auto_spend: false,
      live: false,
      authority: "carl",
    };
  }
  const nextUsage = normalizeUsage(usage);
  const normalizedCost = normalizeUsage(cost);
  for (const axis of RESOURCE_AXES) nextUsage[axis] += normalizedCost[axis];
  return {
    status: "RESERVED",
    label,
    usage: nextUsage,
    remaining: remainingBudget(limits, nextUsage).remaining,
    cost: normalizedCost,
    auto_spend: false,
    live: false,
    authority: "carl",
  };
}

export function rankResource(resource = {}) {
  const free = resource.cost === 0 || resource.cost === "0" || resource.free === true;
  const local = resource.local === true || resource.provider === "local";
  const measured = resource.measured === true;
  const verified = resource.verified === true;
  const network = resource.network === true;
  return (
    (verified ? 100 : 0) +
    (measured ? 40 : 0) +
    (local ? 20 : 0) +
    (free ? 20 : 0) -
    (network ? 5 : 0)
  );
}

export function chooseResource(resources = [], requirement = {}) {
  const candidates = resources
    .filter((r) => r && r.state !== "QUARANTINED" && r.state !== "REVOKED" && r.failed !== true)
    .filter((r) => !requirement.kind || r.kind === requirement.kind)
    .filter((r) => !requirement.capability || (r.capabilities || []).includes(requirement.capability))
    .filter((r) => requirement.allow_paid !== false || r.cost === 0 || r.free === true || r.local === true)
    .sort((a, b) => rankResource(b) - rankResource(a));
  return candidates[0] || null;
}

export function governorSnapshot({ env = process.env, limits, usage = {}, resources = [] } = {}) {
  const resolvedLimits = limits || limitsFromEnv(env);
  const budget = remainingBudget(resolvedLimits, usage);
  return {
    version: RESOURCE_GOVERNOR_VERSION,
    policy: resourcePolicy({ env, limits: resolvedLimits }),
    usage: normalizeUsage(usage),
    remaining: budget.remaining,
    exhausted: budget.exhausted,
    resource_count: resources.length,
    ranked_resources: resources
      .map((r) => ({ id: r.id || r.resource_id || "UNKNOWN", score: rankResource(r) }))
      .sort((a, b) => b.score - a.score),
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(governorSnapshot(), null, 2));
}
