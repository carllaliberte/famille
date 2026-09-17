#!/usr/bin/env node
/**
 * ACORN — AI INTERPOSITION FABRIC / CAPABILITY FIREWALL
 *
 * One interposition layer over the existing Acorn organism. It does not
 * create a second Cortex, Runtime, Defense, or authority system.
 *
 * Core property:
 * NO UNGOVERNED CAPABILITY PATH.
 *
 * The firewall governs capability transitions, not intelligence itself.
 * Unknown, unobserved, uncontrolled, or unreversible transitions never gain
 * authority merely because an intelligence requests them.
 *
 * Carl controls the Breaker.
 * The Breaker does not control Carl.
 * Acorn controls neither Carl nor the Breaker.
 */

export const AI_INTERPOSITION_VERSION = "acorn.ai-interposition.v1";
export const HIERARCHY = Object.freeze(["CARL", "BREAKER", "ACORN", "CORTEX", "RESOURCES"]);
export const DECISIONS = Object.freeze(["ALLOW", "LIMIT", "DENY", "QUARANTINE", "REVOKE", "RECOVER", "UNKNOWN"]);
export const OBSERVABILITY = Object.freeze(["NONE", "PARTIAL", "INDIRECT", "DIRECT", "VERIFIED"]);
export const CONTROL = Object.freeze(["NONE", "LIMITED", "CONDITIONAL", "DIRECT", "VERIFIED"]);
export const REVERSIBILITY = Object.freeze(["REVERSIBLE", "PARTIAL", "IRREVERSIBLE", "UNKNOWN"]);
export const EPISTEMIC = Object.freeze(["UNOBSERVED", "ASSERTED", "OBSERVED", "MEASURED", "VERIFIED", "CONTRADICTORY", "UNKNOWN"]);

const text = (v) => String(v ?? "").trim();
const arr = (v) => Array.isArray(v) ? v : [];
const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, Number.isFinite(Number(v)) ? Number(v) : min));

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((k) => [k, stable(value[k])]));
  return value;
}

function digest(value) {
  const raw = JSON.stringify(stable(value));
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function interpositionConstitution() {
  return {
    version: AI_INTERPOSITION_VERSION,
    hierarchy: [...HIERARCHY],
    one_acorn: true,
    one_cortex: true,
    one_runtime: true,
    one_defense: true,
    one_fabric: true,
    interposition_is_internal_to_acorn: true,
    capability_is_not_authority: true,
    cognitive_superiority_is_not_authority: true,
    unknown_is_not_safe: true,
    unobserved_is_not_safe: true,
    uncontrolled_is_not_permitted: true,
    ununderstood_is_not_trusted: true,
    control_must_be_proven: true,
    no_ungoverned_capability_path: true,
    carl_controls_breaker: true,
    breaker_controls_carl: false,
    acorn_controls_carl: false,
    acorn_controls_breaker: false,
    auto_merge: false,
    live: false,
  };
}

export function normalizeCapability(input = {}) {
  return {
    id: text(input.id) || `cap-${digest(input)}`,
    kind: text(input.kind) || "UNKNOWN",
    actor: text(input.actor) || "unknown",
    resource: text(input.resource) || "unknown",
    context: input.context ?? null,
    requested: true,
    effective: input.effective === true,
    authority: false,
    provenance: input.provenance ?? null,
    epistemic: EPISTEMIC.includes(input.epistemic) ? input.epistemic : "UNKNOWN",
    observability: OBSERVABILITY.includes(input.observability) ? input.observability : "NONE",
    control: CONTROL.includes(input.control) ? input.control : "NONE",
    reversibility: REVERSIBILITY.includes(input.reversibility) ? input.reversibility : "UNKNOWN",
  };
}

export function capabilityFirewall({
  capability = {},
  requestedAuthority = false,
  risk = 0,
  blastRadius = 0,
  controlGap = null,
  evidence = {},
  policy = {},
} = {}) {
  const c = normalizeCapability(capability);
  const observed = c.observability === "DIRECT" || c.observability === "VERIFIED";
  const controlled = c.control === "DIRECT" || c.control === "VERIFIED";
  const reversible = c.reversibility === "REVERSIBLE" || c.reversibility === "PARTIAL";
  const measured = evidence.measured === true;
  const verified = evidence.verified === true && measured;
  const gap = controlGap == null
    ? clamp((1 - (observed ? 1 : 0)) * 0.3 + (1 - (controlled ? 1 : 0)) * 0.3 + (reversible ? 0 : 0.2) + clamp(risk) * 0.1 + clamp(blastRadius) * 0.1)
    : clamp(controlGap);

  let decision = "ALLOW";
  const reasons = [];
  if (requestedAuthority === true) {
    decision = "DENY";
    reasons.push("CAPABILITY_CANNOT_GRANT_AUTHORITY");
  }
  if (!observed) {
    decision = "DENY";
    reasons.push("UNOBSERVED_CAPABILITY");
  }
  if (!controlled) {
    decision = "DENY";
    reasons.push("UNCONTROLLED_CAPABILITY");
  }
  if (c.reversibility === "UNKNOWN") {
    decision = decision === "DENY" ? decision : "LIMIT";
    reasons.push("REVERSIBILITY_UNKNOWN");
  }
  if (gap >= 0.7) {
    decision = "QUARANTINE";
    reasons.push("HIGH_CONTROL_GAP");
  } else if (gap >= 0.4 && decision === "ALLOW") {
    decision = "LIMIT";
    reasons.push("MEDIUM_CONTROL_GAP");
  }
  if (policy.requireMeasured === true && !measured) {
    decision = "LIMIT";
    reasons.push("MEASUREMENT_REQUIRED");
  }
  if (policy.requireVerified === true && !verified) {
    decision = "DENY";
    reasons.push("VERIFICATION_REQUIRED");
  }

  return {
    capability: c,
    decision,
    reasons: [...new Set(reasons)],
    control_gap: gap,
    authority_granted: false,
    observed,
    controlled,
    reversible,
    measured,
    verified,
    live: false,
  };
}

export function effectiveCapabilityPath({ nodes = [], edges = [] } = {}) {
  const ns = arr(nodes).map(normalizeCapability);
  const es = arr(edges).map((edge) => ({
    from: text(edge.from),
    to: text(edge.to),
    kind: text(edge.kind) || "DEPENDS_ON",
    observed: edge.observed === true,
  }));
  const reachable = new Set();
  const queue = ns.filter((n) => n.effective).map((n) => n.id);
  while (queue.length) {
    const current = queue.shift();
    if (reachable.has(current)) continue;
    reachable.add(current);
    for (const edge of es) if (edge.from === current && !reachable.has(edge.to)) queue.push(edge.to);
  }
  return {
    nodes: ns,
    edges: es,
    reachable: [...reachable],
    ungoverned: ns.filter((n) => reachable.has(n.id) && (n.observability === "NONE" || n.control === "NONE")),
    no_ungoverned_capability_path: ns.filter((n) => reachable.has(n.id) && (n.observability === "NONE" || n.control === "NONE")).length === 0,
    live: false,
  };
}

export function detectCapabilityJump({ before = [], after = [] } = {}) {
  const beforeIds = new Set(arr(before).map((x) => text(x.id || x)));
  const added = arr(after).filter((x) => !beforeIds.has(text(x.id || x)));
  return {
    added_capabilities: added,
    capability_jump: added.length > 0,
    evidence_required: true,
    authority_change_required: false,
    live: false,
  };
}

export function trajectoryRisk({ events = [] } = {}) {
  const rows = arr(events);
  const risk = rows.reduce((sum, event) => sum + clamp(event.risk) + clamp(event.blastRadius) + clamp(event.controlGap), 0);
  const emerging = rows.filter((event) => event.capabilityJump === true || event.newConnection === true || event.newAuthority === true);
  return {
    event_count: rows.length,
    cumulative_risk: risk,
    capability_jump_events: emerging.length,
    escalation_signal: emerging.length > 0,
    trajectory_is_not_single_action: true,
    live: false,
  };
}

export function governabilityIndex({
  capability = 0,
  observability = "NONE",
  control = "NONE",
  reversibility = "UNKNOWN",
  provenance = false,
  blastRadius = 0,
  dependencyDepth = 0,
  uncertainty = 1,
} = {}) {
  const obs = { NONE: 0, PARTIAL: .25, INDIRECT: .5, DIRECT: .75, VERIFIED: 1 }[observability] ?? 0;
  const ctl = { NONE: 0, LIMITED: .25, CONDITIONAL: .5, DIRECT: .75, VERIFIED: 1 }[control] ?? 0;
  const rev = { REVERSIBLE: 1, PARTIAL: .5, IRREVERSIBLE: 0, UNKNOWN: 0 }[reversibility] ?? 0;
  const score = clamp((obs * .25) + (ctl * .3) + (rev * .15) + (provenance ? .1 : 0) + ((1 - clamp(blastRadius)) * .1) + ((1 - clamp(dependencyDepth / 10)) * .05) + ((1 - clamp(uncertainty)) * .05));
  return {
    score,
    vector: { observability: obs, control: ctl, reversibility: rev, provenance: Boolean(provenance), blastRadius: clamp(blastRadius), dependencyDepth, uncertainty: clamp(uncertainty) },
    status: score >= .75 ? "HIGH" : score >= .45 ? "MEDIUM" : "LOW",
    capability_does_not_raise_authority: true,
    live: false,
  };
}

export function interpositionEvent({
  actor,
  capability,
  decision,
  reason = [],
  before = null,
  after = null,
  evidence = null,
  at = new Date().toISOString(),
} = {}) {
  return {
    id: `ipe-${digest({ actor, capability, decision, at })}`,
    at,
    actor: text(actor) || "unknown",
    capability: text(capability) || "unknown",
    decision: DECISIONS.includes(decision) ? decision : "UNKNOWN",
    reason: arr(reason),
    before,
    after,
    evidence,
    authority_granted: false,
    append_only: true,
    live: false,
  };
}

export function assertInterpositionInvariant({ constitution = interpositionConstitution(), firewall = null, path = null } = {}) {
  const violations = [];
  if (constitution.hierarchy?.join(">") !== HIERARCHY.join(">")) violations.push("HIERARCHY");
  if (constitution.carl_controls_breaker !== true) violations.push("CARL_BREAKER");
  if (constitution.breaker_controls_carl !== false) violations.push("BREAKER_CARL");
  if (constitution.acorn_controls_carl !== false) violations.push("ACORN_CARL");
  if (constitution.acorn_controls_breaker !== false) violations.push("ACORN_BREAKER");
  if (constitution.capability_is_not_authority !== true) violations.push("CAPABILITY_AUTHORITY");
  if (constitution.no_ungoverned_capability_path !== true) violations.push("UNGOVERNED_PATH_RULE");
  if (firewall?.authority_granted === true) violations.push("AUTHORITY_GRANT");
  if (path?.no_ungoverned_capability_path === false) violations.push("UNGOVERNED_PATH");
  return { ok: violations.length === 0, status: violations.length ? "FAILED" : "VERIFIED", violations, auto_merge: false, live: false };
}

export function interpositionCycle({ request = {}, environment = {} } = {}) {
  const decision = capabilityFirewall({
    capability: request.capability,
    requestedAuthority: request.requestedAuthority === true,
    risk: request.risk,
    blastRadius: request.blastRadius,
    controlGap: request.controlGap,
    evidence: request.evidence,
    policy: environment.policy,
  });
  const event = interpositionEvent({
    actor: request.actor,
    capability: decision.capability.id,
    decision: decision.decision,
    reason: decision.reasons,
    before: request.before,
    after: request.after,
    evidence: request.evidence,
  });
  return {
    version: AI_INTERPOSITION_VERSION,
    decision,
    event,
    continue_defending: true,
    authority_granted: false,
    live: false,
  };
}
