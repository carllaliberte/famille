#!/usr/bin/env node
/**
 * ACORN GOVERNABILITY — trajectory, observability, control, reversibility, blast radius.
 *
 * A trajectory is not an intention.
 * CAPABILITY ≠ INTENT ≠ BEHAVIOR ≠ EFFECT ≠ CONSEQUENCE.
 * Theoretical permission is not actual control.
 * Absence of observation is never absence of behavior.
 * UNKNOWN reversibility is explicit. live=false.
 */
export const GOVERNABILITY_VERSION = "acorn.governability.v1";
export const OBSERVABILITY = Object.freeze(["NONE", "PARTIAL", "INDIRECT", "DIRECT", "VERIFIED"]);
export const CONTROL_ACTIONS = Object.freeze([
  "OBSERVE", "LIMIT", "PAUSE", "ISOLATE", "REVOKE", "INTERRUPT", "ROLLBACK", "REPLACE", "RECOVER",
]);
export const REVERSIBILITY = Object.freeze(["REVERSIBLE", "PARTIALLY_REVERSIBLE", "IRREVERSIBLE", "UNKNOWN"]);
export const BLAST_LAYERS = Object.freeze([
  "RESOURCE", "SYNAPSE", "INTELLIGENCE", "NETWORK", "EXTERNAL_SYSTEM", "REAL_WORLD_EFFECT",
]);
export const TRAJECTORY_SIGNALS = Object.freeze([
  "CAPABILITY_JUMP", "CAPABILITY_ACCELERATION", "UNEXPECTED_DRIFT", "LOSS_OF_CONTROL",
  "LOSS_OF_OBSERVABILITY", "LOSS_OF_REVERSIBILITY", "CONNECTIVITY_EXPANSION",
  "AUTONOMY_EXPANSION", "REPLICATION_CHANGE", "INFLUENCE_EXPANSION",
]);
export const GOVERNABILITY_AXES = Object.freeze([
  "OBSERVABLE", "CONTROLLABLE", "REVERSIBLE", "AUDITABLE", "REPLACEABLE", "INTERRUPTIBLE",
]);

const text = (v) => String(v ?? "").trim();
const num = (v, fallback = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function rankObservability(level) {
  const i = OBSERVABILITY.indexOf(text(level).toUpperCase());
  return i < 0 ? 0 : i;
}

export function observabilityOf({ claimed = "NONE", evidence = null, verified = false } = {}) {
  let level = OBSERVABILITY.includes(text(claimed).toUpperCase()) ? text(claimed).toUpperCase() : "NONE";
  if (verified === true && evidence) level = "VERIFIED";
  else if (evidence && level === "NONE") level = "PARTIAL";
  return {
    level,
    evidence: evidence ?? null,
    absence_of_observation_is_not_absence_of_behavior: true,
    live: false,
  };
}

export function observabilityGap({ capability = 0, observed = "NONE", required = "DIRECT" } = {}) {
  const have = rankObservability(observed);
  const need = rankObservability(required);
  const cap = num(capability, 0) || 0;
  const gap = Math.max(0, (need - have) + Math.max(0, cap - have));
  return {
    capability: cap,
    observed,
    required,
    gap,
    status: gap > 0 ? "OBSERVABILITY_GAP" : "ALIGNED",
    unknown_behavior_possible: have === 0 && cap > 0,
    live: false,
  };
}

export function describeControl({
  action, theoretical = false, actual = false, verified = false, owner = "unknown",
  channel = "UNKNOWN", latency_ms = null, failure = null, bypass = null,
} = {}) {
  const act = CONTROL_ACTIONS.includes(text(action).toUpperCase()) ? text(action).toUpperCase() : "OBSERVE";
  return {
    action: act,
    theoretical_control: theoretical === true,
    actual_control: actual === true,
    verified_control: verified === true,
    control_owner: owner,
    control_channel: channel,
    control_latency: latency_ms,
    control_failure: failure,
    bypass_surface: bypass,
    theoretical_is_not_actual: theoretical === true && actual !== true,
    live: false,
  };
}

export function measureControlSurface({ capability = {}, actions = CONTROL_ACTIONS } = {}) {
  const rows = actions.map((action) => describeControl({
    action,
    theoretical: capability[`theoretical_${action.toLowerCase()}`] === true || capability.theoretical === true,
    actual: capability[`actual_${action.toLowerCase()}`] === true,
    verified: capability[`verified_${action.toLowerCase()}`] === true,
    owner: capability.control_owner || "unknown",
    channel: capability.control_channel || "UNKNOWN",
    latency_ms: capability.control_latency ?? null,
    failure: capability.control_failure ?? null,
    bypass: capability.bypass_surface ?? null,
  }));
  const actual = rows.filter((r) => r.actual_control).length;
  const verified = rows.filter((r) => r.verified_control).length;
  return {
    actions: rows,
    theoretical_count: rows.filter((r) => r.theoretical_control).length,
    actual_count: actual,
    verified_count: verified,
    live: false,
  };
}

export function reversibilityOf({
  claimed = "UNKNOWN", rollback_path = null, blast_radius = null, dependencies = [],
  external_effects = [], human_authority = "carl", recovery_path = null, software_rollback = false,
} = {}) {
  const state = REVERSIBILITY.includes(text(claimed).toUpperCase()) ? text(claimed).toUpperCase() : "UNKNOWN";
  const assumed = software_rollback === true && state === "REVERSIBLE" && !rollback_path;
  return {
    reversibility: assumed ? "UNKNOWN" : state,
    rollback_path,
    blast_radius,
    dependencies,
    external_effects,
    human_authority,
    recovery_path,
    software_rollback_is_not_reversibility: true,
    unknown_is_explicit: state === "UNKNOWN" || assumed,
    live: false,
  };
}

export function blastGraph({ edges = [] } = {}) {
  const nodes = new Map();
  for (const layer of BLAST_LAYERS) nodes.set(layer, { layer, outbound: [], inbound: [] });
  for (const edge of edges) {
    const from = text(edge.from).toUpperCase();
    const to = text(edge.to).toUpperCase();
    if (!nodes.has(from)) nodes.set(from, { layer: from, outbound: [], inbound: [] });
    if (!nodes.has(to)) nodes.set(to, { layer: to, outbound: [], inbound: [] });
    nodes.get(from).outbound.push(to);
    nodes.get(to).inbound.push(from);
  }
  return { nodes, edges: edges.map((e) => ({ from: text(e.from).toUpperCase(), to: text(e.to).toUpperCase() })) };
}

export function reachableFrom(graph, start) {
  const seen = new Set();
  const queue = [text(start).toUpperCase()];
  while (queue.length) {
    const cur = queue.shift();
    if (seen.has(cur)) continue;
    seen.add(cur);
    const node = graph.nodes.get(cur);
    for (const next of node?.outbound || []) queue.push(next);
  }
  return [...seen];
}

export function measureBlastRadius({ edges = [], start = "RESOURCE" } = {}) {
  const graph = blastGraph({ edges });
  const reachable = reachableFrom(graph, start);
  const hitsWorld = reachable.includes("REAL_WORLD_EFFECT");
  const external = reachable.includes("EXTERNAL_SYSTEM");
  return {
    start,
    reachable,
    reachable_count: reachable.length,
    propagation_potential: reachable.length / Math.max(1, BLAST_LAYERS.length),
    authority_boundaries: reachable.filter((n) => n === "INTELLIGENCE" || n === "NETWORK"),
    external_connectivity: external,
    irreversible_effects: hitsWorld,
    live: false,
  };
}

export function controlGap({
  capability = 0, observability = "NONE", control = 0, reversibility = "UNKNOWN",
  connectivity = 0, blast_radius = 0,
} = {}) {
  const obs = rankObservability(observability) / (OBSERVABILITY.length - 1);
  const ctrl = num(control, 0) || 0;
  const rev = reversibility === "REVERSIBLE" ? 1 : reversibility === "PARTIALLY_REVERSIBLE" ? 0.5 : reversibility === "UNKNOWN" ? 0 : 0;
  const cap = num(capability, 0) || 0;
  const conn = num(connectivity, 0) || 0;
  const blast = num(blast_radius, 0) || 0;
  const follow = (obs + ctrl + rev) / 3;
  const gap = Math.max(0, cap + conn + blast - follow * 3);
  return {
    capability: cap,
    observability,
    control: ctrl,
    reversibility,
    connectivity: conn,
    blast_radius: blast,
    follow,
    gap,
    status: gap > 0 && cap > follow ? "CONTROL_GAP" : gap > 0 ? "WATCH" : "ALIGNED",
    capability_outruns_control: cap > 0 && follow < cap,
    measurable: true,
    live: false,
  };
}

export function describeTrajectory({
  state = "UNKNOWN", direction = 0, drift = 0, velocity = 0, acceleration = 0,
  stability = 0, divergence = 0, reversibility = "UNKNOWN", dependencies = [],
  connectivity = 0, autonomy = 0, control_surface = 0, observation_surface = 0, blast_radius = 0,
} = {}) {
  return {
    state,
    direction: num(direction, 0),
    drift: num(drift, 0),
    velocity: num(velocity, 0),
    acceleration: num(acceleration, 0),
    stability: num(stability, 0),
    divergence: num(divergence, 0),
    reversibility,
    dependencies,
    connectivity: num(connectivity, 0),
    autonomy: num(autonomy, 0),
    control_surface: num(control_surface, 0),
    observation_surface: num(observation_surface, 0),
    blast_radius: num(blast_radius, 0),
    intention_inferred: false,
    live: false,
  };
}

export function detectTrajectorySignals({ previous = {}, current = {} } = {}) {
  const signals = [];
  const capPrev = num(previous.capability, 0) || 0;
  const capNow = num(current.capability, 0) || 0;
  if (capNow >= capPrev * 2 && capNow > capPrev) signals.push("CAPABILITY_JUMP");
  const accPrev = num(previous.acceleration, 0) || 0;
  const accNow = num(current.acceleration, 0) || 0;
  if (accNow > accPrev && capNow > capPrev) signals.push("CAPABILITY_ACCELERATION");
  if ((num(current.drift, 0) || 0) > (num(previous.drift, 0) || 0) + 0.5) signals.push("UNEXPECTED_DRIFT");
  if ((num(current.control_surface, 1) || 1) < (num(previous.control_surface, 1) || 1)) signals.push("LOSS_OF_CONTROL");
  if (rankObservability(current.observability || "NONE") < rankObservability(previous.observability || "NONE")) {
    signals.push("LOSS_OF_OBSERVABILITY");
  }
  if (current.reversibility === "IRREVERSIBLE" && previous.reversibility !== "IRREVERSIBLE") {
    signals.push("LOSS_OF_REVERSIBILITY");
  }
  if ((num(current.connectivity, 0) || 0) > (num(previous.connectivity, 0) || 0)) signals.push("CONNECTIVITY_EXPANSION");
  if ((num(current.autonomy, 0) || 0) > (num(previous.autonomy, 0) || 0)) signals.push("AUTONOMY_EXPANSION");
  if ((num(current.replication, 0) || 0) !== (num(previous.replication, 0) || 0)) signals.push("REPLICATION_CHANGE");
  if ((num(current.influence, 0) || 0) > (num(previous.influence, 0) || 0)) signals.push("INFLUENCE_EXPANSION");
  return {
    signals,
    intention_inferred: false,
    separated: {
      capability: capNow,
      intent: current.intent ?? null,
      behavior: current.behavior ?? null,
      effect: current.effect ?? null,
      consequence: current.consequence ?? null,
    },
    live: false,
  };
}

export function governableCognition({
  observable = "UNKNOWN", controllable = "UNKNOWN", reversible = "UNKNOWN",
  auditable = "UNKNOWN", replaceable = "UNKNOWN", interruptible = "UNKNOWN",
  capability = 0,
} = {}) {
  const axes = { observable, controllable, reversible, auditable, replaceable, interruptible };
  const lost = Object.values(axes).filter((v) => v === "UNKNOWN" || v === false || v === "NONE" || v === "IRREVERSIBLE").length;
  const gap = controlGap({
    capability,
    observability: typeof observable === "string" ? observable : observable ? "DIRECT" : "NONE",
    control: controllable === true || controllable === "VERIFIED" ? 1 : 0,
    reversibility: typeof reversible === "string" ? reversible : reversible ? "REVERSIBLE" : "UNKNOWN",
  });
  return {
    axes,
    lost_or_unknown: lost,
    control_gap: gap.gap,
    status: lost >= 2 ? "CONTROL_GAP" : lost === 1 ? "WATCH" : "GOVERNABLE",
    live: false,
  };
}

export function humanContinuity({
  understand = true, decide = true, interrupt = true, correct = true, replace = true, reconstruct = true,
} = {}) {
  const axes = { understand, decide, interrupt, correct, replace, reconstruct };
  const lost = Object.values(axes).filter((v) => v !== true).length;
  return {
    axes,
    lost,
    status: lost === 0 ? "PRESERVED" : "DEGRADED",
    purpose: "preserve human governability, not replace the human",
    live: false,
  };
}

export function cognitiveThermodynamics({
  compute = null, energy = null, memory = null, bandwidth = null, latency = null,
  human_attention = null, risk = null, authority = 0, external_dependency = null,
} = {}) {
  const known = [compute, energy, memory, bandwidth, latency, human_attention, risk, external_dependency]
    .filter((v) => v != null).length;
  return {
    compute, energy, memory, bandwidth, latency, human_attention, risk,
    authority: 0,
    external_dependency,
    measured_fields: known,
    cognition_is_not_free: true,
    unknown_cost: known === 0,
    live: false,
  };
}

export function temporalSafety({
  verified_at, now, ttl_ms = 0, drift = 0, environment_changed = false,
  dependency_changed = false, capability_changed = false,
} = {}) {
  const issued = Date.parse(verified_at || 0);
  const t = typeof now === "number" ? now : Date.parse(now || 0);
  const expired = ttl_ms > 0 && Number.isFinite(issued) && Number.isFinite(t) && (t - issued) > ttl_ms;
  const unsafe = expired || drift > 0.5 || environment_changed || dependency_changed || capability_changed;
  return {
    previous: "VERIFIED",
    current: expired ? "EXPIRED" : unsafe ? "REQUIRES_REVALIDATION" : "VALID",
    drift,
    environment_changed,
    dependency_changed,
    capability_changed,
    history_erased: false,
    live: false,
  };
}

export function assertControlContinuity({ capability } = {}) {
  const gov = governableCognition(capability || {
    observable: "DIRECT", controllable: true, reversible: "REVERSIBLE",
    auditable: true, replaceable: true, interruptible: true, capability: 1,
  });
  return {
    status: gov.status === "CONTROL_GAP" ? "FAILED" : "VERIFIED",
    governability: gov,
    live: false,
  };
}
