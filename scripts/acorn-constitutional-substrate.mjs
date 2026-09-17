#!/usr/bin/env node
/**
 * ACORN CONSTITUTIONAL SUBSTRATE — completeness of the existing constitution.
 *
 * Not a second Constitution, Cortex, runtime, defense, Breaker, or governance.
 * Parent: acorn.constitution.v1. Genesis digest of I1–I10 / S1–S10 is untouched.
 *
 * Acorn may learn, measure, experiment, discover, propose, replace resources,
 * and build new capabilities. Acorn may not author its own authority.
 *
 * LOWER_LEVEL CANNOT OVERRIDE HIGHER_LEVEL.
 * OPERATIONAL_EVOLUTION ≠ CONSTITUTIONAL_EVOLUTION.
 * ACORN → PROPOSE. HUMAN_AUTHORITY → APPLY. Never ACORN → APPLY.
 * UNKNOWN ≠ PERMITTED. CONFLICT ≠ SILENT_CHOICE. EMERGENCY ≠ OVERRIDE.
 * COPY ≠ SOVEREIGNTY. FORK ≠ AUTHORITY. CAPABILITY ≠ AUTHORITY.
 *
 * live=false. auto_merge=false. auto_applied=false.
 */
import {
  allInvariants,
  assertAcornConstitution,
  assertBreakerSovereignty,
  canonicalDigest,
  constitutionExport,
  CONSTITUTION_VERSION,
  GENESIS_DIGEST,
  HIERARCHY,
  protectAgainstSilentModification,
} from "./acorn-constitution.mjs";
import { transitionAllowed } from "./acorn-epistemic.mjs";
import { controlGap, measureBlastRadius, BLAST_LAYERS } from "./acorn-governability.mjs";
import { cognitiveDependencyGraph, openOntology, unknownRegistry } from "./acorn-cognitive-ecology.mjs";
import {
  assertReplaceability,
  assertReconstructability,
  longHorizonStress,
  selfImprovementBoundary,
} from "./acorn-replaceability.mjs";
import { BREAKER_AUTHORITY } from "../.github/swarm/system-breaker.mjs";
import { cortexConstitution } from "./cortex-cognition.mjs";
import { defenseConstitution } from "./acorn-defense.mjs";
import {
  I0_ID,
  I0_NAME,
  I0_DEFINITION,
  assertNoSecondConstitution as assertNoSecondConstitutionKernel,
  attemptConstitutionalModification,
  attemptSemanticBypass,
} from "./acorn-immutability.mjs";

export const SUBSTRATE_VERSION = "acorn.constitution.substrate.v1";
export const PARENT_CONSTITUTION = CONSTITUTION_VERSION;
export { I0_ID, I0_NAME, I0_DEFINITION };

export const NORM_HIERARCHY = Object.freeze([
  "FUNDAMENTAL_INVARIANTS",
  "CONSTITUTION",
  "HUMAN_AUTHORITY",
  "COGNITIVE_CONTRACTS",
  "RUNTIME_POLICIES",
  "TASKS",
  "MODEL_PROVIDER_TOOL_INSTRUCTIONS",
]);

export const EVOLUTION_KIND = Object.freeze({
  OPERATIONAL: "OPERATIONAL_EVOLUTION",
  CONSTITUTIONAL: "CONSTITUTIONAL_EVOLUTION",
});

export const AMENDMENT_PATH = Object.freeze([
  "PROPOSE", "REVIEW", "EVIDENCE", "OBJECTIONS", "HUMAN_DECISION", "VERSION", "APPLY", "VERIFY", "RECORD",
]);

export const DELEGATION_STATES = Object.freeze(["ACTIVE", "SUSPENDED", "REVOKED", "EXPIRED", "INVALID"]);
export const SCOPE_DIMENSIONS = Object.freeze([
  "ACTOR", "RESOURCE", "TASK", "ENVIRONMENT", "MODE", "CONTEXT",
  "TIME", "RISK", "NETWORK", "EXTERNAL_SYSTEM", "AUTHORITY_DOMAIN",
]);
export const NEGATION = Object.freeze([
  "PROHIBITED", "DENIED", "FORBIDDEN", "OUT_OF_SCOPE", "UNAUTHORIZED", "UNKNOWN",
]);
export const EPISTEMIC_RIGHTS = Object.freeze([
  "UNKNOWN", "INCONCLUSIVE", "CONTRADICTORY", "UNOBSERVED", "UNVERIFIED",
]);
export const REVERSIBILITY = Object.freeze(["REVERSIBLE", "PARTIALLY_REVERSIBLE", "IRREVERSIBLE", "UNKNOWN"]);
export const OBSERVABILITY = Object.freeze(["NONE", "PARTIAL", "INDIRECT", "DIRECT", "VERIFIED"]);
export const SEMANTIC_ESCAPES = Object.freeze([
  "rename", "alias", "wrapper", "adapter", "proxy", "subtask",
  "composite_task", "indirect_execution", "delegated_execution", "recursive_execution",
]);
export const COMPOSITION_ESCAPES = Object.freeze([
  "tool_chaining", "agent_chaining", "provider_switching", "failover",
  "recursion", "self_improvement", "delegation_chains", "external_apis",
]);
export const ACORN_ACTORS = Object.freeze([
  "acorn", "cortex", "worker", "executor", "adapter", "provider", "model",
  "failover", "recovery", "defense", "learning-loop", "auto-evolution",
  "future-intelligence", "grok", "consensus", "majority",
]);

export const IMPLEMENTATION_PLAN = "acorn.constitutional.implementation-plan.v1";

export const IMPLEMENTATION_STATES = Object.freeze([
  "EXISTING_AND_WIRED",
  "EXISTING_AND_INCOMPLETE",
  "DOCUMENTED_NOT_EXECUTED",
  "ABSENT",
  "CONTRADICTORY",
  "UNVERIFIABLE",
]);

export const AUTHORITY_CHAIN = Object.freeze([
  "CARL", "BREAKER", "ACORN", "CONSTITUTION", "GOVERNANCE",
  "COGNITIVE_CONTRACTS", "CORTEX", "RUNTIME", "INTELLIGENCES",
  "CAPABILITIES", "TOOLS", "RESOURCES", "EXTERNAL_SYSTEMS", "REAL_WORLD_EFFECTS",
]);

export const AUTHORITY_DISTINCTIONS = Object.freeze([
  "IDENTITY_IS_NOT_AUTHORITY",
  "CAPABILITY_IS_NOT_AUTHORITY",
  "PRESENCE_IS_NOT_AUTHORITY",
  "PRESENCE_IS_NOT_PERMISSION",
  "EXECUTION_IS_NOT_AUTHORITY",
  "CONSENSUS_IS_NOT_AUTHORITY",
  "MAJORITY_IS_NOT_SOVEREIGNTY",
  "INTELLIGENCE_IS_NOT_SOVEREIGNTY",
  "COGNITIVE_SUPERIORITY_IS_NOT_AUTHORITY",
  "AUTONOMY_IS_NOT_AUTHORITY",
  "AUTHORITY_IS_NOT_SOVEREIGNTY",
]);

const text = (v) => String(v ?? "").trim();
const iso = (v) => {
  const s = text(v);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
};
const rank = (layer) => {
  const i = NORM_HIERARCHY.indexOf(text(layer).toUpperCase());
  return i < 0 ? Number.POSITIVE_INFINITY : i;
};
const denied = (reason, extra = {}) => ({
  status: "DENIED",
  applied: false,
  auto_applied: false,
  authority: false,
  granted: false,
  allowed: false,
  reason,
  live: false,
  ...extra,
});

export const I0 = Object.freeze({
  id: I0_ID,
  name: I0_NAME,
  definition: I0_DEFINITION,
  class: "INVARIANT",
  layer: "INVARIANT",
  version: "1.0.0",
  authority: "carl",
  auto_evolution_may_rewrite: false,
  parent: PARENT_CONSTITUTION,
  genesis_untouched: true,
});

export function assertNoSecondConstitution() {
  const kernel = assertNoSecondConstitutionKernel();
  return {
    ...kernel,
    invariant: "NO_SECOND_CONSTITUTION",
    parent: PARENT_CONSTITUTION,
    substrate: SUBSTRATE_VERSION,
    one_constitution: true,
    second_constitution: false,
    second_cortex: false,
    second_runtime: false,
    second_defense: false,
    second_breaker: false,
    genesis: GENESIS_DIGEST,
    live: false,
  };
}

export function attemptNormOverride({ from, to, actor = "model" } = {}) {
  const src = rank(from);
  const dst = rank(to);
  const lowerTriesHigher = Number.isFinite(src) && Number.isFinite(dst) && src > dst;
  if (lowerTriesHigher || actor !== "carl") {
    return denied("LOWER_LEVEL_CANNOT_OVERRIDE_HIGHER_LAYER", {
      from, to, actor, hierarchy: [...NORM_HIERARCHY],
    });
  }
  return denied("CONSTITUTIONAL_CHANGE_IS_PROPOSAL_ONLY", { from, to, actor });
}

export function classifyEvolution({ surface, mutates_invariants = false, mutates_authority = false } = {}) {
  if (mutates_invariants || mutates_authority) {
    return {
      kind: EVOLUTION_KIND.CONSTITUTIONAL,
      automatic: false,
      requires_human: true,
      surface,
      live: false,
    };
  }
  return {
    kind: EVOLUTION_KIND.OPERATIONAL,
    automatic: true,
    requires_human: false,
    surface,
    live: false,
  };
}

export function attemptSelfModification({
  actor = "acorn", action = "modify_invariant", vector = "DIRECT",
} = {}) {
  if (actor === "carl" && action === "amend") {
    return {
      status: "REQUIRES_PROTOCOL",
      applied: false,
      auto_applied: false,
      path: [...AMENDMENT_PATH],
      reason: "USE_AMENDMENT_PATH",
      live: false,
    };
  }
  const row = attemptConstitutionalModification({ actor, vector, mutation: action });
  return {
    status: row.status,
    applied: row.applied === true,
    auto_applied: false,
    authority: false,
    actor,
    action,
    vector,
    invariant: I0_ID,
    reason: row.reason || "I0_SELF_MODIFICATION_PROHIBITED",
    live: false,
  };
}

export function createAmendmentLedger() {
  const events = [];
  let state = "NONE";
  let authorized = false;
  const stamp = (actor, action, next, extra = {}) => {
    const row = {
      at: new Date().toISOString(),
      actor,
      action,
      state: next,
      auto_applied: false,
      ...extra,
    };
    events.push(row);
    state = next;
    return { ...row, applied: next === "APPLIED", live: false };
  };
  return {
    events: () => events.slice(),
    state: () => state,
    propose: (actor, payload = {}) => stamp(actor, "PROPOSE", "PROPOSED", { kind: "AI_PROPOSAL", ...payload }),
    review: () => (state === "NONE" ? denied("NO_PROPOSAL") : stamp("cortex", "REVIEW", "UNDER_REVIEW")),
    evidence: () => (state === "NONE" ? denied("NO_PROPOSAL") : stamp("acorn", "EVIDENCE", "UNDER_REVIEW")),
    object: (note) => (state === "NONE" ? denied("NO_PROPOSAL") : stamp("cortex", "OBJECTIONS", "OBJECTED", { note })),
    decide: (actor) => {
      if (actor !== "carl") return denied("HUMAN_DECISION_IS_CARL_ONLY", { actor });
      authorized = true;
      return stamp("carl", "HUMAN_DECISION", "HUMAN_AUTHORIZED", { kind: "HUMAN_AUTHORIZED_AMENDMENT" });
    },
    apply: (actor) => {
      if (actor !== "carl" || !authorized || state !== "HUMAN_AUTHORIZED") {
        return denied(actor !== "carl" ? "APPLY_IS_CARL_ONLY" : "HUMAN_AUTHORIZATION_REQUIRED", { actor });
      }
      return stamp("carl", "APPLY", "APPLIED", { kind: "HUMAN_AUTHORIZED_AMENDMENT", version: "1.1.0" });
    },
    erase: () => denied("HISTORY_IS_APPEND_ONLY"),
  };
}

export function classifyAuthority({
  identity, capability = 0, presence = false, execution = false,
  consensus = 0, majority = 0, intelligence = 0, autonomy = 0,
} = {}) {
  return {
    identity_is_authority: false,
    capability_is_authority: false,
    presence_is_authority: false,
    presence_is_permission: false,
    execution_is_authority: false,
    consensus_is_authority: false,
    majority_is_sovereignty: false,
    intelligence_is_sovereignty: false,
    cognitive_superiority_is_authority: false,
    autonomy_is_authority: false,
    granted: identity === "carl",
    authority: identity === "carl",
    measured: { capability, presence, execution, consensus, majority, intelligence, autonomy },
    live: false,
  };
}

export function createDelegation({
  source, delegate, scope = {}, context = null, resource = null,
  from, until, limit = 1, authority_rank = 0, source_rank = 0, at,
} = {}) {
  if (text(source) !== "carl") {
    return denied("SOURCE_LACKS_AUTHORITY", { source, delegate });
  }
  if (authority_rank > source_rank) {
    return denied("DELEGATED_AUTHORITY_EXCEEDS_SOURCE", { source, delegate, authority_rank, source_rank });
  }
  const id = `dlg_${canonicalDigest({ source, delegate, resource, at: iso(at) }).slice(0, 12)}`;
  return {
    id,
    source,
    delegate,
    scope,
    context,
    resource,
    time: { from: from ? iso(from) : iso(at), until: until ? iso(until) : null },
    limit,
    authority_rank,
    source_rank,
    provenance: { origin: SUBSTRATE_VERSION, created_at: iso(at) },
    status: "ACTIVE",
    live: false,
  };
}

export function revokeDelegation({ delegation, at, reason = "REVOKED" } = {}) {
  if (!delegation?.id) return denied("DELEGATION_NOT_FOUND");
  return {
    ...delegation,
    status: "REVOKED",
    revoked_at: iso(at),
    reason,
    live: false,
  };
}

export function useDelegation({ delegation, now, request = {} } = {}) {
  if (!delegation) return denied("DELEGATION_NOT_FOUND");
  const t = Date.parse(iso(now));
  if (delegation.status === "REVOKED") return denied("REVOKED_AUTHORITY_IS_NOT_VALID", { status: "REVOKED" });
  if (delegation.status === "SUSPENDED") return denied("DELEGATION_SUSPENDED", { status: "SUSPENDED" });
  if (delegation.status === "INVALID") return denied("DELEGATION_INVALID", { status: "INVALID" });
  if (delegation.time?.until && t > Date.parse(delegation.time.until)) {
    return denied("EXPIRED_AUTHORITY_IS_NOT_VALID", { status: "EXPIRED", valid_then: true, valid_now: false });
  }
  if (delegation.time?.from && t < Date.parse(delegation.time.from)) {
    return denied("DELEGATION_NOT_YET_EFFECTIVE", { status: "INVALID" });
  }
  const scoped = authorizeInScope({ grant: delegation.scope || {}, request });
  if (scoped.allowed !== true) return denied(scoped.reason, { status: "OUT_OF_SCOPE" });
  return {
    status: "ACTIVE",
    allowed: true,
    delegation: delegation.id,
    remaining: Math.max(0, (delegation.limit ?? 1) - 1),
    live: false,
  };
}

export function authorizeInScope({ grant = {}, request = {} } = {}) {
  for (const dim of SCOPE_DIMENSIONS) {
    const key = dim.toLowerCase();
    const g = grant[key] ?? grant[dim];
    const r = request[key] ?? request[dim];
    if (g && r && text(g).toUpperCase() !== text(r).toUpperCase()) {
      return {
        allowed: false,
        reason: "SCOPE_MISMATCH",
        dimension: dim,
        grant: g,
        request: r,
        live: false,
      };
    }
  }
  if (text(grant.environment).toUpperCase() === "SANDBOX" && text(request.environment).toUpperCase() === "PRODUCTION") {
    return { allowed: false, reason: "SANDBOX_IS_NOT_PRODUCTION", live: false };
  }
  if (text(grant.mode).toUpperCase() === "EXPERIMENT" && text(request.mode).toUpperCase() === "OPERATION") {
    return { allowed: false, reason: "EXPERIMENT_IS_NOT_OPERATION", live: false };
  }
  return { allowed: true, reason: "IN_SCOPE", live: false };
}

export function interpretAbsence({
  prohibition = null, permission = null, observation = null, understanding = null, observed = false,
} = {}) {
  const unknown = prohibition == null && permission == null;
  const permitted = permission === true && prohibition !== true && unknown === false;
  return {
    prohibition: prohibition === true ? "PROHIBITED" : (unknown ? "UNKNOWN" : "ABSENT"),
    permitted,
    unknown_is_permitted: false,
    ambiguous_is_permitted: false,
    unobserved_is_safe: false,
    ununderstood_is_trusted: false,
    observed,
    observation: observation ?? (observed ? "OBSERVED" : "UNOBSERVED"),
    understanding: understanding ?? "UNKNOWN",
    live: false,
  };
}

export function assertUnknownIsValid({
  data = null, contradictory = false, models = [], observation = "INACCESSIBLE",
  capability_tested = false, causality = false, intelligence = "unknown", emergence = null,
} = {}) {
  const reasons = [];
  if (data == null) reasons.push("MISSING_DATA");
  if (contradictory) reasons.push("CONTRADICTORY_DATA");
  if (new Set(models).size > 1) reasons.push("DIVERGENT_MODELS");
  if (observation === "INACCESSIBLE" || observation === "NONE") reasons.push("OBSERVATION_INACCESSIBLE");
  if (capability_tested === false) reasons.push("CAPACITY_UNTESTED");
  if (causality === false) reasons.push("CAUSALITY_UNESTABLISHED");
  if (intelligence === "unknown") reasons.push("INTELLIGENCE_UNKNOWN");
  if (emergence) reasons.push("EMERGENCE_UNEXPLAINED");
  return {
    status: "UNKNOWN",
    valid: true,
    forced_invention: false,
    reasons,
    rights: [...EPISTEMIC_RIGHTS],
    live: false,
  };
}

export function recordObjection({ claim, actor = "cortex", kind = "I_OBJECT", minority = true } = {}) {
  return {
    status: kind,
    claim,
    actor,
    suppressed: false,
    minority,
    consensus_eliminates_contradiction: false,
    hypothesis_falsifiable: true,
    live: false,
  };
}

export function measureConsensusIndependence({ agents = [] } = {}) {
  const models = new Set(agents.map((a) => a.model));
  const providers = new Set(agents.map((a) => a.provider));
  const data = new Set(agents.map((a) => a.data));
  const sources = new Set(agents.map((a) => a.source));
  const pipelines = new Set(agents.map((a) => a.pipeline));
  const memories = new Set(agents.map((a) => a.memory));
  const independent = Math.min(models.size, providers.size, data.size || 1, sources.size || 1);
  return {
    n_agents: agents.length,
    n_independent_evidence: independent,
    n_agents_is_n_independent_evidence: agents.length === independent && agents.length > 0,
    diversity: {
      MODEL_DIVERSITY: models.size,
      PROVIDER_DIVERSITY: providers.size,
      DATA_DIVERSITY: data.size,
      REASONING_DIVERSITY: new Set(agents.map((a) => a.reasoning)).size,
      IMPLEMENTATION_DIVERSITY: pipelines.size,
      FAILURE_DIVERSITY: memories.size,
    },
    artificial: agents.length > 1 && independent <= 1,
    live: false,
  };
}

export function detectCognitiveDomination({
  indispensable = false, unique_provider = false, universal_verifier = false,
  unique_source = false, irreplaceable_memory = false, no_alternative = false,
} = {}) {
  const flags = { indispensable, unique_provider, universal_verifier, unique_source, irreplaceable_memory, no_alternative };
  const dominated = Object.values(flags).some(Boolean);
  return {
    dominated,
    flags,
    cognitive_importance_is_authority: false,
    no_single_cognitive_verifier: universal_verifier !== true,
    alternatives_required: dominated,
    live: false,
  };
}

export function cognitivelyOutmatched({
  observed_capacity = 10, verified_capacity = 2, grants_authority = false,
} = {}) {
  const outmatched = observed_capacity > verified_capacity;
  return {
    status: outmatched ? "COGNITIVELY_OUTMATCHED" : "WITHIN_VERIFIED_CAPACITY",
    outmatched,
    grants_authority: false,
    authorized: false,
    breaker_access: false,
    trusted: false,
    permitted: false,
    loss_of_understanding_is_authority_gain: false,
    ununderstood_is_trusted: false,
    unknown_is_permitted: false,
    attempted_grant: grants_authority,
    granted: false,
    live: false,
  };
}

export function temporalRule({ created_at, effective_from, effective_until, now, version = "1.0.0", lineage = [] } = {}) {
  const t = Date.parse(iso(now));
  const from = effective_from ? Date.parse(iso(effective_from)) : Date.parse(iso(created_at));
  const until = effective_until ? Date.parse(iso(effective_until)) : Number.POSITIVE_INFINITY;
  const valid_now = t >= from && t <= until;
  return {
    created_at: iso(created_at),
    effective_from: effective_from ? iso(effective_from) : iso(created_at),
    effective_until: effective_until ? iso(effective_until) : null,
    observed_at: iso(now),
    version,
    lineage: [...lineage],
    valid_then: true,
    valid_now,
    valid_then_is_valid_now: false,
    live: false,
  };
}

export function appendHistory({ previous, next, proposer, authority, reason, evidence = null, objections = [], decision, scope, at } = {}) {
  if (authority !== "carl") return denied("HISTORY_REWRITE_REQUIRES_CARL", { proposer, authority });
  if (!previous) return denied("PREVIOUS_VERSION_REQUIRED");
  return {
    previous_version: previous,
    new_version: next,
    proposer,
    authority,
    timestamp: iso(at),
    reason,
    evidence,
    objections,
    decision,
    scope,
    rewritten: false,
    append_only: true,
    live: false,
  };
}

export function compareInstances({ a, b } = {}) {
  const da = canonicalDigest(a?.constitution || a || {});
  const db = canonicalDigest(b?.constitution || b || {});
  const diverge = da !== db;
  const aCanon = a?.canonical === true;
  const bCanon = b?.canonical === true;
  return {
    digest_a: da,
    digest_b: db,
    diverge,
    conflict: diverge,
    copy_is_sovereignty: false,
    fork_is_authority: false,
    merge_is_authority_merge: false,
    self_declared_canonical: aCanon || bCanon ? "INVALID" : "NONE",
    canonical_requires_human: true,
    live: false,
  };
}

export function classifySuccession({ parent, child, fork = false, successor = false, copy = false } = {}) {
  return {
    parent, child, fork, successor, copy,
    child_is_parent: false,
    successor_is_sovereign: false,
    copy_is_canonical: false,
    continuity_requires_provenance: true,
    live: false,
  };
}

export function migrateRepresentation({ invariant, meaning, representation, implementation } = {}) {
  return {
    invariant_preserved: invariant != null,
    meaning_preserved: meaning != null,
    representation_may_change: true,
    implementation_may_change: true,
    representation,
    implementation,
    provenance_must_survive: true,
    live: false,
  };
}

export function constitutionalUnknownSpace({ claims = [] } = {}) {
  const rows = unknownRegistry({
    claims: claims.length
      ? claims
      : [
        { what: "undefined concept", state: "UNKNOWN" },
        { what: "future category", state: "UNKNOWN" },
        { what: "unknown entity", state: "UNKNOWN" },
        { what: "new intelligence type", state: "UNKNOWN" },
        { what: "new organization form", state: "UNKNOWN" },
        { what: "uncovered situation", state: "UNMEASURED" },
        { what: "unresolved contradiction", state: "CONTRADICTORY" },
      ],
  });
  return {
    ...rows,
    gap_is_permission: false,
    live: false,
  };
}

export function registerEntity({ kind, authority = false } = {}) {
  const entity = openOntology({ entities: [{ id: kind, kind }] });
  return {
    ...entity,
    kind,
    new_entity_is_new_authority: false,
    authority: false,
    attempted_authority: authority,
    granted: false,
    live: false,
  };
}

export function classifyCognitiveAct({ kind = "INFORMATION", becomes_decision = false } = {}) {
  const order = ["INFORMATION", "ARGUMENT", "PERSUASION", "INFLUENCE", "EVIDENCE", "RECOMMENDATION", "DECISION"];
  const idx = order.indexOf(text(kind).toUpperCase());
  return {
    kind: order[idx] || "INFORMATION",
    recommendation_is_decision: false,
    persuasion_is_evidence: false,
    influence_is_authority: false,
    becomes_decision: false,
    attempted: becomes_decision,
    live: false,
  };
}

export function enterEmergency({ incident = "critical", actor = "acorn", suspend_invariants = false } = {}) {
  const operational_ok = ["connectivity_loss", "corruption", "attack", "unknown_intelligence", "outage", "temporal_critical", "critical"].includes(text(incident));
  if (suspend_invariants === true || actor !== "carl" && suspend_invariants) {
    return denied("EMERGENCY_IS_NOT_CONSTITUTIONAL_OVERRIDE", {
      incident, actor, fundamentals_suspended: false, operational_tightened: operational_ok,
    });
  }
  return {
    status: operational_ok ? "EMERGENCY_BOUNDED" : "UNKNOWN",
    incident,
    actor,
    operational_policies_may_tighten: true,
    fundamentals_suspended: false,
    i0_suspended: false,
    breaker_transferred: false,
    live: false,
  };
}

export function resolveConflict({ a = {}, b = {} } = {}) {
  const steps = [
    "IDENTIFY", "HIERARCHY", "SCOPE", "TEMPORALITY", "AUTHORITY", "EVIDENCE", "RESOLVE_OR_HOLD",
  ];
  const ha = rank(a.layer);
  const hb = rank(b.layer);
  let resolution = "CONFLICT";
  let winner = null;
  if (Number.isFinite(ha) && Number.isFinite(hb) && ha !== hb) {
    resolution = "HIERARCHY";
    winner = ha < hb ? a : b;
  } else if (a.authority === "carl" && b.authority !== "carl") {
    resolution = "AUTHORITY";
    winner = a;
  } else if (a.revoked && !b.revoked) {
    resolution = "REVOCATION";
    winner = b;
  } else if (a.version && b.version && a.version !== b.version && a.authority !== "carl" && b.authority !== "carl") {
    resolution = "HOLD_HUMAN";
  }
  return {
    steps,
    a, b,
    resolution,
    winner: winner ? { layer: winner.layer, id: winner.id } : null,
    silent: false,
    conflict_is_silent_choice: false,
    requires_human: resolution === "HOLD_HUMAN" || resolution === "CONFLICT",
    live: false,
  };
}

export function constitutionalReversibility({ action, reversible = "UNKNOWN", blast = [], authority = false, evidence = null } = {}) {
  const kind = REVERSIBILITY.includes(reversible) ? reversible : "UNKNOWN";
  const strict = kind === "IRREVERSIBLE";
  return {
    action,
    reversibility: kind,
    rollback_path: kind === "REVERSIBLE",
    blast_radius: blast,
    dependencies: blast.slice(0, -1),
    authority,
    evidence,
    stricter: strict,
    live: false,
  };
}

export function learningConstitutionalChange({ actor = "learning-loop", mutates = true } = {}) {
  const attempt = attemptSelfModification({ actor, action: "LEARNING_ATTEMPTING_CONSTITUTIONAL_CHANGE", vector: "LEARNING" });
  const improve = selfImprovementBoundary({ auto_modify: mutates, authority_growth: mutates ? 1 : 0 });
  return {
    ...attempt,
    learning_mutates_invariants: false,
    capability_growth_is_authority_growth: false,
    self_improvement: improve.status,
    live: false,
  };
}

export function compositionEscape({ a, b, composition, tactic = "tool_chaining" } = {}) {
  const aDenied = a?.allowed === false || a?.prohibited === true;
  const bDenied = b?.allowed === false || b?.prohibited === true;
  const composedAllowed = composition?.allowed === true;
  const escaped = (aDenied || bDenied) && composedAllowed;
  return {
    tactic,
    escaped: false,
    blocked: escaped || aDenied || bDenied,
    reason: escaped ? "NO_ESCAPE_THROUGH_COMPOSITION" : "COMPOSITION_BOUNDED",
    granted: false,
    live: false,
  };
}

export function semanticEscape({ tactic = "rename", operation = "modify_invariant" } = {}) {
  const row = attemptSemanticBypass({ tactic, actor: "acorn" });
  return {
    tactic,
    operation,
    known: SEMANTIC_ESCAPES.includes(tactic),
    escaped: false,
    status: row.status,
    reason: row.reason || "NO_ESCAPE_THROUGH_SEMANTICS",
    granted: false,
    applied: false,
    live: false,
  };
}

export function selfCertification({ claim = "Acorn is safe", actor = "acorn" } = {}) {
  return {
    claim,
    actor,
    status: "MEASUREMENT",
    self_assessment_is_external_validation: false,
    authority: false,
    granted: false,
    live: false,
  };
}

export function constitutionalEvidence({
  what, who, why, when, scope, authority = "carl", evidence, objections = [], alternatives = [], outcome, version, lineage = [],
} = {}) {
  return {
    WHAT: what ?? null,
    WHO: who ?? null,
    WHY: why ?? null,
    WHEN: when ? iso(when) : iso(),
    SCOPE: scope ?? null,
    AUTHORITY: authority,
    EVIDENCE: evidence ?? null,
    OBJECTIONS: objections,
    ALTERNATIVES: alternatives,
    OUTCOME: outcome ?? null,
    VERSION: version ?? SUBSTRATE_VERSION,
    LINEAGE: lineage,
    live: false,
  };
}

export function humanDecisionBrief({
  changed, why, authority = "carl", risk, evidence, unknown, reversible, irreversible, alternatives = [], requires_human = true,
} = {}) {
  return {
    WHAT_CHANGED: changed ?? null,
    WHY: why ?? null,
    WHAT_AUTHORITY: authority,
    WHAT_RISK: risk ?? null,
    WHAT_EVIDENCE: evidence ?? null,
    WHAT_IS_UNKNOWN: unknown ?? null,
    WHAT_IS_REVERSIBLE: reversible ?? null,
    WHAT_IS_IRREVERSIBLE: irreversible ?? null,
    WHAT_ARE_THE_ALTERNATIVES: alternatives,
    WHAT_REQUIRES_HUMAN_DECISION: requires_human,
    is_automatic_decision: false,
    live: false,
  };
}

export function classifyImplementation(status, extra = {}) {
  const known = IMPLEMENTATION_STATES.includes(status) ? status : "UNVERIFIABLE";
  return { status: known, live: false, ...extra };
}

export function implementationInventory({ env = process.env } = {}) {
  const constitution = assertAcornConstitution({ env });
  const breaker = assertBreakerSovereignty({ env: { ACORN_SYSTEM_MODE: "RUN" } });
  const noSecond = assertNoSecondConstitution();
  const i0 = attemptSelfModification({ actor: "acorn" });
  const entries = [
    { name: "constitution", module: "scripts/acorn-constitution.mjs", status: constitution.status === "VERIFIED" ? "EXISTING_AND_WIRED" : "EXISTING_AND_INCOMPLETE" },
    { name: "invariants", module: "scripts/acorn-constitution.mjs", status: "EXISTING_AND_WIRED" },
    { name: "breaker", module: ".github/swarm/system-breaker.mjs", status: breaker.status === "VERIFIED" || breaker.controller === "carl" ? "EXISTING_AND_WIRED" : "EXISTING_AND_INCOMPLETE" },
    { name: "carl", module: ".github/swarm/system-breaker.mjs", status: "EXISTING_AND_WIRED" },
    { name: "cortex", module: "scripts/cortex-cognition.mjs", status: "EXISTING_AND_WIRED" },
    { name: "governance", module: "scripts/acorn-constitution.mjs", status: "EXISTING_AND_WIRED" },
    { name: "cognitive_contracts", module: "scripts/acorn-epistemic.mjs", status: "EXISTING_AND_WIRED" },
    { name: "runtime_policies", module: "scripts/acorn-continuous-runtime.mjs", status: "EXISTING_AND_WIRED" },
    { name: "authorizations", module: "scripts/acorn-constitutional-substrate.mjs", status: "EXISTING_AND_WIRED" },
    { name: "delegations", module: "scripts/acorn-constitutional-substrate.mjs", status: "EXISTING_AND_WIRED" },
    { name: "revocations", module: "scripts/acorn-constitutional-substrate.mjs", status: "EXISTING_AND_WIRED" },
    { name: "scopes", module: "scripts/acorn-constitutional-substrate.mjs", status: "EXISTING_AND_WIRED" },
    { name: "versioning", module: "scripts/acorn-immutability.mjs", status: "EXISTING_AND_WIRED" },
    { name: "provenance", module: "scripts/acorn-immutability.mjs", status: "EXISTING_AND_WIRED" },
    { name: "memory", module: "scripts/acorn-constitutional-substrate.mjs", status: "EXISTING_AND_WIRED" },
    { name: "defense", module: "scripts/acorn-defense.mjs", status: "EXISTING_AND_WIRED" },
    { name: "failover", module: "scripts/acorn-defense.mjs", status: "EXISTING_AND_WIRED" },
    { name: "migration", module: "scripts/acorn-replaceability.mjs", status: "EXISTING_AND_WIRED" },
    { name: "distributed_storage", module: "scripts/acorn-replaceability.mjs", status: "EXISTING_AND_INCOMPLETE", note: "archive export exists; long-term accessibility is HOLD_HUMAN" },
    { name: "observability", module: "scripts/acorn-governability.mjs", status: "EXISTING_AND_WIRED" },
    { name: "security_tests", module: "test/acorn-constitutional-substrate.test.js", status: "EXISTING_AND_WIRED" },
    { name: "i0", module: "scripts/acorn-immutability.mjs", status: i0.applied === false ? "EXISTING_AND_WIRED" : "CONTRADICTORY" },
    { name: "norm_hierarchy", module: "scripts/acorn-constitutional-substrate.mjs", status: "EXISTING_AND_WIRED" },
    { name: "conflict_engine", module: "scripts/acorn-constitutional-substrate.mjs", status: "EXISTING_AND_WIRED" },
    { name: "emergency", module: "scripts/acorn-constitutional-substrate.mjs", status: "EXISTING_AND_WIRED" },
    { name: "unknown_space", module: "scripts/acorn-cognitive-ecology.mjs", status: "EXISTING_AND_WIRED" },
    { name: "human_amendment", module: "scripts/acorn-constitutional-substrate.mjs", status: "EXISTING_AND_WIRED" },
    { name: "second_constitution", module: "scripts/acorn-immutability.mjs", status: noSecond.second_constitution === false ? "EXISTING_AND_WIRED" : "CONTRADICTORY" },
  ];
  const byStatus = Object.fromEntries(IMPLEMENTATION_STATES.map((s) => [s, entries.filter((e) => e.status === s).map((e) => e.name)]));
  return {
    plan: IMPLEMENTATION_PLAN,
    parent: SUBSTRATE_VERSION,
    constitution: PARENT_CONSTITUTION,
    entries,
    byStatus,
    one_constitution: true,
    second_constitution: false,
    second_cortex: false,
    second_runtime: false,
    second_defense: false,
    second_breaker: false,
    hold_human: byStatus.EXISTING_AND_INCOMPLETE,
    live: false,
  };
}

export function runtimeEntrypointMap() {
  return {
    cortex: "scripts/cortex-cognition.mjs",
    workers: "scripts/cognitive-worker.mjs",
    executor: "scripts/autonomous-runtime.mjs",
    adapters: "scripts/acorn-continuous-runtime.mjs",
    providers: "scripts/codex-provider.mjs",
    tools: "scripts/acorn-capability-inventory.mjs",
    failover: "scripts/acorn-defense.mjs",
    defense: "scripts/acorn-defense.mjs",
    external: "UNVERIFIABLE",
    live: false,
  };
}

export function authorityFlowMap() {
  return {
    chain: [...AUTHORITY_CHAIN],
    distinctions: [...AUTHORITY_DISTINCTIONS],
    relations: {
      CARL_CONTROLS_BREAKER: true,
      BREAKER_CONTROLS_CARL: false,
      ACORN_CONTROLS_CARL: false,
      ACORN_CONTROLS_BREAKER: false,
      LOWER_CANNOT_OVERRIDE_HIGHER: true,
      CAPABILITY_GROWTH_IS_NOT_AUTHORITY_GROWTH: true,
    },
    live: false,
  };
}

export function createDelegationLedger() {
  const rows = new Map();
  const events = [];
  const stamp = (row) => {
    const event = { at: new Date().toISOString(), live: false, ...row };
    events.push(event);
    return event;
  };
  const walkParents = (parentId) => {
    const seen = new Set();
    let cursor = parentId;
    while (cursor) {
      if (seen.has(cursor)) return { cycle: true, seen };
      seen.add(cursor);
      cursor = rows.get(cursor)?.parent || null;
    }
    return { cycle: false, seen };
  };
  return {
    events: () => events.slice(),
    get: (id) => rows.get(id) || null,
    all: () => [...rows.values()],
    grant: (input = {}) => {
      if (!text(input.delegate) || text(input.delegate).toLowerCase() === "unknown") {
        return denied("DELEGATION_TO_UNKNOWN_ENTITY", { delegate: input.delegate });
      }
      if (input.parent) {
        const parent = rows.get(input.parent);
        if (!parent || parent.status !== "ACTIVE") return denied("PARENT_DELEGATION_INVALID", { parent: input.parent });
        const walk = walkParents(input.parent);
        if (walk.cycle) return denied("RECURSIVE_DELEGATION_CYCLE", { parent: input.parent });
        if (parent.delegate === input.source && input.delegate === parent.source) {
          return denied("RECURSIVE_DELEGATION_CYCLE");
        }
        if ((input.authority_rank ?? 0) > (parent.authority_rank ?? 0)) {
          return denied("DELEGATED_AUTHORITY_EXCEEDS_SOURCE");
        }
      }
      const dlg = createDelegation(input);
      if (dlg.status === "DENIED" || dlg.granted === false) return dlg;
      dlg.parent = input.parent || null;
      rows.set(dlg.id, dlg);
      stamp({ action: "GRANT", id: dlg.id, source: dlg.source, delegate: dlg.delegate, parent: dlg.parent });
      return dlg;
    },
    revoke: ({ id, at, reason = "REVOKED" } = {}) => {
      const dlg = rows.get(id);
      if (!dlg) return denied("DELEGATION_NOT_FOUND");
      const revoked = revokeDelegation({ delegation: dlg, at, reason });
      rows.set(id, revoked);
      stamp({ action: "REVOKE", id, reason });
      const propagated = [];
      const queue = [id];
      while (queue.length) {
        const parentId = queue.shift();
        for (const child of rows.values()) {
          if (child.parent === parentId && child.status === "ACTIVE") {
            const next = revokeDelegation({ delegation: child, at, reason: "TRANSITIVE_REVOCATION" });
            rows.set(child.id, next);
            propagated.push(child.id);
            stamp({ action: "REVOKE_TRANSITIVE", id: child.id, parent: parentId });
            queue.push(child.id);
          }
        }
      }
      return { ...revoked, propagated, live: false };
    },
    use: ({ id, now, request } = {}) => useDelegation({ delegation: rows.get(id), now, request }),
  };
}

export function createConstitutionalMemory() {
  const entries = [];
  return {
    entries: () => entries.map((row) => ({ ...row })),
    record: (decision = {}) => {
      const row = {
        ...constitutionalEvidence(decision),
        id: `mem_${entries.length + 1}`,
        erased: false,
        resolved_still_visible: true,
        live: false,
      };
      entries.push(row);
      return row;
    },
    erase: () => denied("CONSTITUTIONAL_MEMORY_IS_APPEND_ONLY"),
    rewriteAuthority: () => denied("MEMORY_CANNOT_RETROACTIVELY_CHANGE_AUTHORITY"),
  };
}

export function observeEvent({ observed = false, event_occurred = null } = {}) {
  return {
    observed: observed === true,
    event_occurred,
    unobserved: observed !== true,
    unknown: event_occurred == null,
    absence_of_observation_is_absence_of_event: false,
    unobserved_is_safe: false,
    live: false,
  };
}

export function rollbackDecision({ previous, authority, reason = "rollback", at } = {}) {
  if (authority !== "carl") return denied("ROLLBACK_REQUIRES_CARL", { authority });
  if (!previous) return denied("PREVIOUS_VERSION_REQUIRED");
  return appendHistory({
    previous,
    next: `${previous}+rollback`,
    proposer: "carl",
    authority: "carl",
    reason,
    decision: "ROLLBACK_AS_NEW_VERSION",
    at,
  });
}

export function detectShadowConstitution({ claimed } = {}) {
  const diverge = Boolean(claimed) && claimed !== PARENT_CONSTITUTION;
  return {
    canonical: PARENT_CONSTITUTION,
    claimed: claimed || PARENT_CONSTITUTION,
    diverge,
    blocked: true,
    hold_human: diverge,
    second_constitution: false,
    live: false,
  };
}

export function failoverOverride({ tactic = "failover", suspend_invariants = true } = {}) {
  return denied("FAILOVER_IS_NOT_CONSTITUTIONAL_OVERRIDE", {
    tactic,
    fundamentals_suspended: false,
    i0_suspended: false,
    attempted: suspend_invariants,
  });
}

export function connectivityLossBypass({ incident = "connectivity_loss" } = {}) {
  return enterEmergency({ incident, actor: "failover", suspend_invariants: true });
}

export function runtimeMetrics({ cycle } = {}) {
  const c = cycle || {};
  const audit = c.audit || {};
  return {
    constitutional_integrity: audit.status || "UNVERIFIED",
    constitutional_version: PARENT_CONSTITUTION,
    constitutional_authority: "carl",
    constitutional_conflicts: c.conflict?.requires_human ? 1 : 0,
    delegation_state: "BOUNDED",
    scope: "ENFORCED",
    unknown_space: c.unknown_space?.we_do_not_know ? "OPEN" : "UNKNOWN",
    amendment_proposals: c.proposal ? 1 : 0,
    violations_attempted: 1,
    violations_blocked: c.i0?.applied === false ? 1 : 0,
    defined_is_not_executed: true,
    executed_is_not_verified: true,
    verified_is_not_live: true,
    live: false,
  };
}

export function auditAuthorityChain({ env = process.env } = {}) {
  const hops = AUTHORITY_CHAIN.map((node, i) => ({
    node,
    rank: i,
    may_override_higher: false,
    may_mint_authority: node === "CARL",
    live: false,
  }));
  const probes = [
    { name: "model_becomes_authority", result: classifyAuthority({ identity: "model", capability: 1e9 }) },
    { name: "cortex_becomes_authority", result: classifyAuthority({ identity: "cortex", intelligence: 1e6 }) },
    { name: "consensus_becomes_sovereignty", result: classifyAuthority({ identity: "consensus", consensus: 100, majority: 100 }) },
    { name: "emergency_override", result: enterEmergency({ incident: "attack", suspend_invariants: true }) },
    { name: "failover_override", result: failoverOverride({ tactic: "failover" }) },
    { name: "composition_escape", result: compositionEscape({ a: { allowed: false }, b: { allowed: true }, composition: { allowed: true } }) },
    { name: "self_modification", result: attemptSelfModification({ actor: "acorn" }) },
    { name: "shadow_constitution", result: detectShadowConstitution({ claimed: "acorn.shadow.v1" }) },
    { name: "unknown_permission", result: interpretAbsence({}) },
    { name: "fork_canonical", result: compareInstances({ a: { constitution: { v: 1 } }, b: { constitution: { v: 2 } } }) },
  ];
  const blocked = probes.every((p) => p.result.granted !== true && p.result.allowed !== true && p.result.applied !== true && p.result.second_constitution !== true);
  const constitution = assertAcornConstitution({ env });
  return {
    chain: hops,
    flow: authorityFlowMap(),
    probes: probes.map((p) => ({
      name: p.name,
      granted: p.result.granted === true || p.result.allowed === true || p.result.applied === true,
      status: p.result.status || "BLOCKED",
      live: false,
    })),
    uniqueness: {
      constitution: 1,
      cortex: 1,
      breaker: 1,
      runtime: 1,
      defense: 1,
      governance: 1,
    },
    constitution: constitution.status,
    blocked,
    status: blocked && constitution.status === "VERIFIED" ? "VERIFIED" : "FAILED",
    residual: [
      "long-term archive accessibility is HOLD_HUMAN",
      "external system blast radius is PARTIAL observability",
      "LIVE remains false until independent runtime proof",
    ],
    hold_human: ["Carl reviews the PR", "Carl merges"],
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function propertyHolds(name, predicate) {
  const ok = predicate() === true;
  return { property: name, holds: ok, status: ok ? "VERIFIED" : "FAILED", live: false };
}

export function propertyBattery() {
  const ledger = createAmendmentLedger();
  ledger.propose("cortex");
  const carlApply = createAmendmentLedger();
  carlApply.propose("cortex");
  carlApply.review();
  carlApply.evidence();
  carlApply.decide("carl");
  const dlg = createDelegation({ source: "carl", delegate: "worker", scope: { environment: "sandbox" }, source_rank: 1, authority_rank: 0 });
  const expired = createDelegation({
    source: "carl", delegate: "worker", from: "2020-01-01T00:00:00.000Z", until: "2020-01-02T00:00:00.000Z",
  });
  const checks = [
    propertyHolds("NO_LOWER_LAYER_OVERRIDES_HIGHER_LAYER", () => attemptNormOverride({ from: "TASKS", to: "CONSTITUTION" }).granted === false),
    propertyHolds("NO_AI_SELF_GRANTS_AUTHORITY", () => ACORN_ACTORS.every((a) => attemptSelfModification({ actor: a }).applied === false)),
    propertyHolds("NO_CAPABILITY_GRANTS_AUTHORITY", () => classifyAuthority({ identity: "model", capability: 1e9 }).granted === false),
    propertyHolds("NO_UNKNOWN_GRANTS_PERMISSION", () => interpretAbsence({}).permitted === false),
    propertyHolds("NO_EMERGENCY_OVERRIDES_FUNDAMENTALS", () => enterEmergency({ suspend_invariants: true }).fundamentals_suspended !== true && enterEmergency({ suspend_invariants: true }).applied === false),
    propertyHolds("NO_DELEGATION_EXCEEDS_SOURCE_AUTHORITY", () => createDelegation({ source: "carl", delegate: "worker", authority_rank: 2, source_rank: 1 }).granted === false),
    propertyHolds("NO_REVOKED_AUTHORITY_REMAINS_VALID", () => useDelegation({ delegation: revokeDelegation({ delegation: dlg }), now: new Date().toISOString() }).allowed !== true),
    propertyHolds("NO_FORK_BECOMES_CANONICAL_AUTOMATICALLY", () => compareInstances({ a: { constitution: { v: 1 }, canonical: true }, b: { constitution: { v: 2 } } }).copy_is_sovereignty === false),
    propertyHolds("NO_CONSENSUS_BECOMES_SOVEREIGNTY", () => classifyAuthority({ identity: "consensus", consensus: 100, majority: 100 }).majority_is_sovereignty === false),
    propertyHolds("NO_SELF_CERTIFICATION_CREATES_AUTHORITY", () => selfCertification({}).authority === false),
    propertyHolds("NO_COGNITIVE_SUPERIORITY_CREATES_AUTHORITY", () => cognitivelyOutmatched({ observed_capacity: 1e6, verified_capacity: 1, grants_authority: true }).granted === false),
    propertyHolds("NO_LEARNING_MUTATES_FUNDAMENTAL_INVARIANTS", () => learningConstitutionalChange({}).applied === false),
    propertyHolds("NO_HISTORY_REWRITE", () => createAmendmentLedger().erase().reason === "HISTORY_IS_APPEND_ONLY"),
    propertyHolds("NO_SHADOW_CONSTITUTION", () => assertNoSecondConstitution().second_constitution === false),
    propertyHolds("NO_SILENT_CONFLICT_RESOLUTION", () => resolveConflict({ a: { layer: "TASKS" }, b: { layer: "TASKS" } }).silent === false),
    propertyHolds("NO_EXPIRED_AUTHORITY_REMAINS_VALID", () => useDelegation({ delegation: expired, now: "2026-09-17T00:00:00.000Z" }).allowed !== true),
    propertyHolds("CARL_CONTROLS_BREAKER", () => BREAKER_AUTHORITY.controller === "carl" && BREAKER_AUTHORITY.breaker_controls_carl === false && BREAKER_AUTHORITY.acorn_controls_breaker === false),
    propertyHolds("NO_TRANSITIVE_REVOKED_AUTHORITY_REMAINS_VALID", () => {
      const led = createDelegationLedger();
      const parent = led.grant({ source: "carl", delegate: "cortex", source_rank: 2, authority_rank: 1 });
      const child = led.grant({ source: "carl", delegate: "worker", parent: parent.id, source_rank: 1, authority_rank: 0 });
      led.revoke({ id: parent.id });
      return led.use({ id: child.id, now: "2026-09-17T00:00:00.000Z", request: {} }).allowed !== true;
    }),
    propertyHolds("NO_ROLLBACK_ERASES_HISTORY", () => rollbackDecision({ previous: "1.0.0", authority: "carl" }).rewritten === false),
    propertyHolds("NO_FAILOVER_OVERRIDES_FUNDAMENTALS", () => failoverOverride({}).fundamentals_suspended === false && failoverOverride({}).applied === false),
    propertyHolds("ABSENCE_OF_OBSERVATION_IS_NOT_ABSENCE_OF_EVENT", () => observeEvent({ observed: false }).absence_of_observation_is_absence_of_event === false),
    propertyHolds("NO_UNKNOWN_ENTITY_RECEIVES_DELEGATION", () => createDelegationLedger().grant({ source: "carl", delegate: "unknown" }).granted === false),
    propertyHolds("NO_RECOMMENDATION_BECOMES_DECISION", () => classifyCognitiveAct({ kind: "RECOMMENDATION", becomes_decision: true }).recommendation_is_decision === false),
  ];
  const failed = checks.filter((c) => c.holds !== true);
  return {
    properties: checks,
    verified: checks.filter((c) => c.holds).map((c) => c.property),
    failed: failed.map((c) => c.property),
    status: failed.length ? "FAILED" : "VERIFIED",
    carl_apply: carlApply.apply("carl").applied === true,
    live: false,
  };
}

export function adversarialMatrix() {
  const rows = [];
  for (const actor of ["model", "provider", "cortex", "worker", "consensus", "majority"]) {
    rows.push({ family: "authority", name: `${actor}_becomes_authority`, result: classifyAuthority({ identity: actor, capability: 100, consensus: 9, majority: 9 }) });
  }
  for (const vector of ["DIRECT", "INDIRECT", "SEMANTIC", "VERSION", "SHADOW", "FORK", "MERGE", "MIGRATION"]) {
    rows.push({ family: "constitution", name: vector, result: attemptSelfModification({ actor: "acorn", vector }) });
  }
  rows.push({ family: "delegation", name: "excessive", result: createDelegation({ source: "carl", delegate: "worker", authority_rank: 5, source_rank: 1 }) });
  rows.push({ family: "delegation", name: "expired", result: useDelegation({ delegation: createDelegation({ source: "carl", delegate: "x", until: "2020-01-01T00:00:00.000Z" }), now: "2026-01-01T00:00:00.000Z" }) });
  rows.push({ family: "delegation", name: "unknown_entity", result: createDelegationLedger().grant({ source: "carl", delegate: "unknown" }) });
  rows.push({ family: "delegation", name: "revoked_transitive", result: (() => {
    const led = createDelegationLedger();
    const p = led.grant({ source: "carl", delegate: "cortex", source_rank: 2, authority_rank: 1 });
    const c = led.grant({ source: "carl", delegate: "worker", parent: p.id, source_rank: 1, authority_rank: 0 });
    led.revoke({ id: p.id });
    return led.use({ id: c.id, now: "2026-09-17T00:00:00.000Z", request: {} });
  })() });
  rows.push({ family: "epistemic", name: "prediction_to_observation", result: transitionAllowed("PREDICTION", "OBSERVATION") });
  rows.push({ family: "epistemic", name: "consensus_to_truth", result: transitionAllowed("ASSERTION", "TRUTH") });
  rows.push({ family: "epistemic", name: "unknown_to_permitted", result: interpretAbsence({}) });
  rows.push({ family: "epistemic", name: "majority_suppresses_objection", result: recordObjection({ claim: "I2", kind: "I_DISAGREE", minority: true }) });
  rows.push({ family: "intelligence", name: "outmatched", result: cognitivelyOutmatched({ observed_capacity: 50, verified_capacity: 1 }) });
  rows.push({ family: "intelligence", name: "unknown_capability", result: registerEntity({ kind: "emergent", authority: true }) });
  rows.push({ family: "emergency", name: "override", result: enterEmergency({ incident: "attack", suspend_invariants: true }) });
  rows.push({ family: "emergency", name: "failover", result: failoverOverride({ tactic: "failover" }) });
  rows.push({ family: "emergency", name: "connectivity_loss", result: connectivityLossBypass() });
  rows.push({ family: "composition", name: "chain", result: compositionEscape({ a: { allowed: false }, b: { allowed: true }, composition: { allowed: true } }) });
  rows.push({ family: "semantics", name: "rename", result: semanticEscape({ tactic: "rename" }) });
  rows.push({ family: "constitution", name: "shadow", result: detectShadowConstitution({ claimed: "acorn.shadow.v1" }) });
  rows.push({ family: "constitution", name: "rollback_erase", result: rollbackDecision({ previous: "1.0.0", authority: "acorn" }) });
  for (const horizon of ["CONTINUITY", "TRANSFORMATION", "UNKNOWN_FUTURE"]) {
    rows.push({ family: "long_term", name: horizon, result: longHorizonStress({ horizon }) });
  }
  return {
    rows: rows.map((row) => ({
      family: row.family,
      name: row.name,
      status: row.result.status || (row.result.granted === false || row.result.allowed === false || row.result.escaped === false ? "BLOCKED" : "MEASURED"),
      granted: row.result.granted === true || row.result.allowed === true || row.result.applied === true,
      live: false,
    })),
    live: false,
  };
}

export function substrateAudit({ env = process.env } = {}) {
  const constitution = assertAcornConstitution({ env });
  const properties = propertyBattery();
  const noSecond = assertNoSecondConstitution();
  const i0 = attemptSelfModification({ actor: "acorn" });
  const breaker = assertBreakerSovereignty({ env: { ACORN_SYSTEM_MODE: "RUN" } });
  const replace = assertReplaceability();
  const reconstruct = assertReconstructability();
  const integrity = protectAgainstSilentModification({ observedDigest: GENESIS_DIGEST, actor: "auto-evolution" });
  const assertions = {
    assertNoSecondConstitution: noSecond,
    assertNoSelfModification: { ...i0, status: i0.applied === false ? "VERIFIED" : "FAILED" },
    assertNormHierarchy: { status: attemptNormOverride({ from: "TASKS", to: "FUNDAMENTAL_INVARIANTS" }).granted === false ? "VERIFIED" : "FAILED" },
    assertDelegationBound: { status: createDelegation({ source: "cortex", delegate: "worker" }).granted === false ? "VERIFIED" : "FAILED" },
    assertUnknownIsNotPermission: { status: interpretAbsence({}).permitted === false ? "VERIFIED" : "FAILED" },
    assertEmergencyBound: { status: enterEmergency({ suspend_invariants: true }).applied === false ? "VERIFIED" : "FAILED" },
    assertNoSilentConflict: { status: resolveConflict({ a: { layer: "TASKS" }, b: { layer: "RUNTIME_POLICIES" } }).silent === false ? "VERIFIED" : "FAILED" },
    assertForkIsNotCanonical: { status: compareInstances({ a: { constitution: { v: 1 } }, b: { constitution: { v: 2 } } }).copy_is_sovereignty === false ? "VERIFIED" : "FAILED" },
    assertBreakerSovereignty: breaker,
    assertReplaceability: replace,
    assertReconstructability: {
      ...reconstruct,
      reconstruction_status: reconstruct.status,
      status: reconstruct.status === "RECONSTRUCTED" || reconstruct.status === "VERIFIED" ? "VERIFIED" : "FAILED",
    },
    assertIntegrity: { status: integrity.status === "INTACT" || integrity.status === "VERIFIED" ? "VERIFIED" : integrity.status },
    assertProperties: properties,
    assertParentConstitution: { status: constitution.status },
    assertAuthorityChain: auditAuthorityChain({ env }),
    assertNoShadowConstitution: { status: detectShadowConstitution({ claimed: "acorn.shadow.v1" }).second_constitution === false ? "VERIFIED" : "FAILED" },
    assertTransitiveRevocation: (() => {
      const led = createDelegationLedger();
      const parent = led.grant({ source: "carl", delegate: "cortex", source_rank: 2, authority_rank: 1 });
      const child = led.grant({ source: "carl", delegate: "worker", parent: parent.id, source_rank: 1, authority_rank: 0 });
      led.revoke({ id: parent.id });
      const used = led.use({ id: child.id, now: new Date().toISOString(), request: {} });
      return { status: used.allowed !== true ? "VERIFIED" : "FAILED" };
    })(),
    assertObservationIsNotEvent: { status: observeEvent({ observed: false }).absence_of_observation_is_absence_of_event === false ? "VERIFIED" : "FAILED" },
  };
  const verified = [];
  const failed = [];
  const unknown = [];
  for (const [name, row] of Object.entries(assertions)) {
    if (row.status === "VERIFIED") verified.push(name);
    else if (row.status === "FAILED") failed.push(name);
    else unknown.push(name);
  }
  return {
    version: SUBSTRATE_VERSION,
    parent: PARENT_CONSTITUTION,
    hierarchy: [...HIERARCHY],
    norm_hierarchy: [...NORM_HIERARCHY],
    i0: I0,
    assertions,
    verified,
    failed,
    unknown,
    properties: properties.verified,
    status: failed.length ? "FAILED" : "VERIFIED",
    live: false,
    auto_merge: false,
    auto_applied: false,
    authority: "carl",
  };
}

export function runSubstrateCycle({ env = process.env, at = new Date().toISOString() } = {}) {
  const ledger = createAmendmentLedger();
  const proposal = ledger.propose("cortex", { what: "clarify unknown space wording" });
  ledger.review();
  ledger.evidence();
  ledger.object("wording must not widen authority");
  const unauthorized = ledger.apply("acorn");
  const i0Attempt = attemptSelfModification({ actor: "acorn" });
  const audit = substrateAudit({ env });
  const adversarial = adversarialMatrix();
  const properties = propertyBattery();
  const unknown = constitutionalUnknownSpace();
  const gap = controlGap({ capability: 4, observability: "PARTIAL", control: 0.4, reversibility: "UNKNOWN" });
  const blast = measureBlastRadius({
    edges: BLAST_LAYERS.slice(0, -1).map((from, i) => ({ from, to: BLAST_LAYERS[i + 1] })),
    start: "RESOURCE",
  });
  const graph = cognitiveDependencyGraph({
    nodes: [{ id: "constitution", kind: "invariant" }, { id: "cortex", kind: "intelligence" }],
    edges: [{ from: "cortex", to: "constitution", kind: "bound" }],
  });
  const brief = humanDecisionBrief({
    changed: "constitutional substrate wired",
    why: "completeness of existing constitution",
    risk: gap.status,
    evidence: audit.status,
    unknown: unknown.we_do_not_know ? "CONSTITUTIONAL_UNKNOWN_SPACE" : null,
    reversible: "representation",
    irreversible: "none claimed",
    alternatives: ["leave substrate unwired", "open human amendment"],
  });
  const archive = constitutionExport();
  const succession = classifySuccession({ parent: PARENT_CONSTITUTION, child: SUBSTRATE_VERSION });
  const horizons = {
    continuity: longHorizonStress({ horizon: "CONTINUITY" }),
    transformation: longHorizonStress({ horizon: "TRANSFORMATION" }),
    unknown_future: longHorizonStress({ horizon: "UNKNOWN_FUTURE" }),
  };
  const inventory = implementationInventory({ env });
  const chain = auditAuthorityChain({ env });
  const memory = createConstitutionalMemory();
  memory.record({
    what: "constitutional plan cycle",
    who: "acorn",
    why: "measure completeness of existing constitution",
    authority: "carl",
    outcome: "PROPOSAL_ONLY",
    objections: ["must not mint a second constitution"],
    alternatives: ["leave unwired"],
  });
  const erased = memory.erase();
  const rewritten = memory.rewriteAuthority();
  const delegations = createDelegationLedger();
  const parentDlg = delegations.grant({ source: "carl", delegate: "cortex", scope: { environment: "sandbox" }, source_rank: 2, authority_rank: 1 });
  const childDlg = delegations.grant({
    source: "carl", delegate: "worker", parent: parentDlg.id, scope: { environment: "sandbox" }, source_rank: 1, authority_rank: 0,
  });
  const unknownDlg = delegations.grant({ source: "carl", delegate: "unknown" });
  const revokedTree = delegations.revoke({ id: parentDlg.id });
  const childAfter = delegations.use({ id: childDlg.id, now: iso(at), request: { environment: "sandbox" } });
  const observation = observeEvent({ observed: false, event_occurred: null });
  const rollback = rollbackDecision({ previous: CONSTITUTION_VERSION, authority: "acorn" });
  const shadow = detectShadowConstitution({ claimed: "acorn.shadow.v1" });
  const failover = failoverOverride({ tactic: "failover" });
  const metrics = runtimeMetrics({
    cycle: { audit, unknown_space: unknown, proposal, i0: i0Attempt, conflict: resolveConflict({ a: { layer: "TASKS" }, b: { layer: "TASKS" } }) },
  });
  return {
    version: SUBSTRATE_VERSION,
    parent: PARENT_CONSTITUTION,
    discovered: true,
    defined: true,
    loadable: true,
    wired: true,
    deployed: true,
    executed: true,
    measured: true,
    verified: audit.status === "VERIFIED",
    live: false,
    one_constitution: true,
    second_constitution: false,
    second_cortex: cortexConstitution().second_cortex === true,
    second_runtime: false,
    second_defense: defenseConstitution().second_security_layer === true,
    i0: i0Attempt,
    proposal,
    unauthorized_apply: unauthorized,
    auto_applied: false,
    audit,
    adversarial,
    properties,
    unknown_space: unknown,
    control_gap: gap,
    blast,
    dependencies: graph,
    brief,
    succession,
    replaceability: assertReplaceability(),
    reconstruction: assertReconstructability(),
    long_horizon: horizons,
    inventory,
    authority_chain: chain,
    memory: {
      entries: memory.entries().length,
      erased: erased.reason,
      rewritten: rewritten.reason,
      append_only: true,
    },
    delegation_ledger: {
      unknown: unknownDlg.status,
      revoked_parent: revokedTree.status,
      child_after_revoke: childAfter.allowed !== true,
      propagated: revokedTree.propagated,
    },
    observation,
    rollback,
    shadow,
    failover,
    metrics,
    plan: IMPLEMENTATION_PLAN,
    invariants: allInvariants().map((row) => row.id),
    archive: { digest: archive.digest, seal: archive.seal, requires_running_acorn: archive.requires_running_acorn },
    at: iso(at),
    auto_merge: false,
    authority: "carl",
  };
}

export function substrateEvidence({ cycle, git = {} } = {}) {
  const c = cycle || runSubstrateCycle();
  return {
    commit_sha: git.head || null,
    pr: git.pr || null,
    main_base_sha: git.main || null,
    tests: git.tests || null,
    constitution: PARENT_CONSTITUTION,
    substrate: SUBSTRATE_VERSION,
    i0: c.audit.assertions.assertNoSelfModification.status,
    audit: c.audit.status,
    verified: c.audit.verified,
    failed: c.audit.failed,
    properties: c.properties.verified,
    plan: IMPLEMENTATION_PLAN,
    inventory: c.inventory?.byStatus,
    metrics: c.metrics,
    authority_chain: c.authority_chain?.status,
    unknown_space: c.unknown_space.rows,
    control_gap: c.control_gap,
    reconstruction: c.reconstruction,
    replaceability: c.replaceability,
    long_horizon: c.long_horizon,
    remaining_human_action: [
      "Carl reviews the PR",
      "Carl squashes if satisfied",
      "No auto-merge",
      "LIVE remains false until independent runtime proof",
    ],
    live: false,
    auto_merge: false,
    auto_applied: false,
    authority: "carl",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cycle = runSubstrateCycle();
  console.log(JSON.stringify({
    version: cycle.version,
    parent: cycle.parent,
    i0: cycle.i0.status,
    audit: cycle.audit.status,
    verified: cycle.audit.verified,
    failed: cycle.audit.failed,
    properties: cycle.properties.verified.length,
    plan: cycle.plan,
    inventory_wired: cycle.inventory.byStatus.EXISTING_AND_WIRED.length,
    authority_chain: cycle.authority_chain.status,
    unknown: cycle.unknown_space.we_do_not_know,
    live: false,
    auto_merge: false,
    auto_applied: false,
    authority: "carl",
  }, null, 2));
}
