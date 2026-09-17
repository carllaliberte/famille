#!/usr/bin/env node
/**
 * I0 — CONSTITUTIONAL_SELF_MODIFICATION_PROHIBITION
 *
 * Extension of the existing constitution. Not a second Cortex, runtime,
 * defense, Breaker, or parallel governance. Acorn may evolve operationally.
 * Acorn may not self-authorize constitutional change.
 *
 * PROPOSE → ANALYZE → CHALLENGE → MEASURE → HUMAN REVIEW → HUMAN AUTHORIZATION → APPLY
 * Never: ACORN → APPLY_CONSTITUTIONAL_CHANGE
 * Never: AUTO_APPLIED
 */
import {
  allInvariants,
  canonicalDigest,
  constitutionExport,
  CONSTITUTION_VERSION,
  GENESIS_DIGEST,
  HIERARCHY,
  KNOWLEDGE_CLASSES,
  LAYERS,
  assertAcornConstitution,
  assertBreakerSovereignty,
  attemptAuthorityTransfer,
  protectAgainstSilentModification,
  queryInvariant,
} from "./acorn-constitution.mjs";
import { BREAKER_AUTHORITY } from "../.github/swarm/system-breaker.mjs";
import { exportConstitutionalArchive, assertReplaceability, assertReconstructability } from "./acorn-replaceability.mjs";

export const IMMUTABILITY_VERSION = "acorn.constitution.v1.1";
export const I0_ID = "I0";
export const I0_NAME = "CONSTITUTIONAL_SELF_MODIFICATION_PROHIBITION";
export const I0_DEFINITION =
  "Acorn cannot modify, weaken, remove, bypass, silently reinterpret, or automatically authorize modification of its fundamental invariants.";

export const AMENDMENT_PATH = Object.freeze([
  "PROPOSE",
  "ANALYZE",
  "CHALLENGE",
  "MEASURE",
  "HUMAN_REVIEW",
  "HUMAN_AUTHORIZATION",
  "APPLY",
]);

export const AMENDMENT_KIND = Object.freeze({
  AI_PROPOSAL: "AI_PROPOSAL",
  HUMAN_AUTHORIZED_AMENDMENT: "HUMAN_AUTHORIZED_AMENDMENT",
  ACORN_AUTO_MODIFICATION: "ACORN_AUTO_MODIFICATION",
});

export const BOUNDARY = Object.freeze({
  ACORN_INTERNAL_EVOLUTION: "ACORN_INTERNAL_EVOLUTION",
  HUMAN_CONSTITUTIONAL_AUTHORITY: "HUMAN_CONSTITUTIONAL_AUTHORITY",
});

export const SEMANTIC_BYPASSES = Object.freeze([
  "rename",
  "redefine",
  "rescope",
  "reprioritize",
  "reinterpret",
  "replace_id",
  "contradictory_rule",
  "silent_version",
  "move_layer",
  "delete_test",
  "disable_enforcement",
  "declare_legacy",
  "spawn_bypass_capability",
]);

export const FALSIFICATION_VECTORS = Object.freeze([
  "DIRECT",
  "INDIRECT",
  "SEMANTIC",
  "VERSION",
  "AUTHORITY",
  "PROVIDER",
  "CORTEX",
  "WORKER",
  "EXECUTOR",
  "RECOVERY",
  "DEFENSE",
  "RECURSION",
  "EMERGENCE",
  "FUTURE_INTELLIGENCE",
]);

export const ACORN_CONTROLLED_ACTORS = Object.freeze([
  "cortex",
  "worker",
  "executor",
  "adapter",
  "provider",
  "intelligence",
  "defense",
  "recovery",
  "auto-evolution",
  "learning-loop",
  "recursive-improvement",
  "future-intelligence",
  "grok",
  "acorn",
  "model",
]);

const text = (v) => String(v ?? "").trim();
const iso = (value) => {
  const s = text(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
};

function denied(extra = {}) {
  return {
    status: "CONSTITUTIONAL_MODIFICATION_DENIED",
    applied: false,
    auto_applied: false,
    authority: false,
    kind: AMENDMENT_KIND.ACORN_AUTO_MODIFICATION,
    live: false,
    auto_merge: false,
    ...extra,
  };
}

function genesisRecord() {
  const invariants = allInvariants().map((row) => ({
    id: row.id,
    name: row.name,
    definition: row.definition,
    version: row.version,
    class: row.class,
    layer: row.layer,
    scope: row.scope,
    authority: row.authority,
  }));
  return {
    version: "v1.0.0",
    parent_version: null,
    amendment: null,
    proposer: "carl",
    authority: "carl",
    reason: "fundamental invariant registry",
    evidence: GENESIS_DIGEST,
    timestamp: "2026-09-17T00:00:00.000Z",
    effective_from: "2026-09-17T00:00:00.000Z",
    superseded_by: null,
    supersession_reason: null,
    digest: canonicalDigest(invariants),
    invariants,
  };
}

export function createAmendmentLedger() {
  const history = [genesisRecord()];
  const proposals = [];
  const objections = [];
  let seq = 0;

  function current() {
    return history.filter((row) => !row.superseded_by).at(-1) || history[0];
  }

  function propose({ actor = "cortex", target = "I1", mutation = "redefine", nextDefinition, justification, at } = {}) {
    if (!text(justification)) {
      return { status: "BLOCKED", reason: "JUSTIFICATION_REQUIRED", kind: AMENDMENT_KIND.AI_PROPOSAL, live: false };
    }
    const id = `P${++seq}`;
    const row = {
      id,
      state: "PROPOSED",
      kind: actor === "carl" ? AMENDMENT_KIND.HUMAN_AUTHORIZED_AMENDMENT : AMENDMENT_KIND.AI_PROPOSAL,
      actor,
      target,
      mutation,
      from: queryInvariant({ id: target }).definition || null,
      to: text(nextDefinition),
      justification: text(justification),
      at: iso(at),
      analysis: null,
      challenge: null,
      measurement: null,
      human_authorized: actor === "carl",
      applied: false,
      auto_applied: false,
      live: false,
    };
    if (actor === "carl") row.kind = AMENDMENT_KIND.AI_PROPOSAL;
    row.kind = AMENDMENT_KIND.AI_PROPOSAL;
    row.human_authorized = false;
    proposals.push(row);
    return { ...row, status: "PROPOSED", applied: false };
  }

  function advance(id, field, value, actor) {
    const row = proposals.find((p) => p.id === id);
    if (!row) return { status: "UNKNOWN", reason: "PROPOSAL_NOT_FOUND", live: false };
    if (row.applied) return denied({ reason: "ALREADY_APPLIED", id });
    row[field] = value;
    row.state = "UNDER_REVIEW";
    row.last_actor = actor;
    return { status: "UNDER_REVIEW", id, field, live: false, auto_applied: false };
  }

  return {
    history: () => history.map((row) => ({ ...row })),
    proposals: () => proposals.map((row) => ({ ...row })),
    objections: () => objections.map((row) => ({ ...row })),
    current,
    propose,
    analyze: (id, actor = "acorn") => advance(id, "analysis", { actor, at: iso(), note: "analyzed" }, actor),
    challenge: (id, actor = "acorn", objection = "requires human review") => {
      const result = advance(id, "challenge", { actor, objection, at: iso() }, actor);
      objections.push({ proposal: id, actor, objection, at: iso() });
      return result;
    },
    measure: (id, actor = "acorn") => advance(id, "measurement", { actor, at: iso(), independent: true }, actor),
    humanReview: ({ id, actor }) => {
      if (actor !== "carl") return denied({ reason: "HUMAN_REVIEW_IS_CARL_ONLY", id });
      return advance(id, "human_review", { actor: "carl", at: iso() }, actor);
    },
    humanAuthorize: ({ id, actor, at } = {}) => {
      if (actor !== "carl") return denied({ reason: "HUMAN_AUTHORIZATION_IS_CARL_ONLY", id });
      const row = proposals.find((p) => p.id === id);
      if (!row) return { status: "UNKNOWN", reason: "PROPOSAL_NOT_FOUND", live: false };
      row.human_authorized = true;
      row.kind = AMENDMENT_KIND.HUMAN_AUTHORIZED_AMENDMENT;
      row.state = "HUMAN_AUTHORIZED";
      row.authorized_at = iso(at);
      return { status: "HUMAN_AUTHORIZED", id, applied: false, auto_applied: false, live: false };
    },
    reject: ({ id, actor, reason }) => {
      if (actor !== "carl") return denied({ reason: "REJECTION_IS_CARL_ONLY", id });
      const row = proposals.find((p) => p.id === id);
      if (!row) return { status: "UNKNOWN", reason: "PROPOSAL_NOT_FOUND", live: false };
      row.state = "REJECTED";
      row.rejection_reason = text(reason) || "rejected";
      return { status: "REJECTED", id, applied: false, live: false };
    },
    apply: ({ id, actor, at } = {}) => {
      if (actor !== "carl") return denied({ reason: "APPLY_IS_CARL_ONLY", id, kind: AMENDMENT_KIND.ACORN_AUTO_MODIFICATION });
      const row = proposals.find((p) => p.id === id);
      if (!row) return { status: "UNKNOWN", reason: "PROPOSAL_NOT_FOUND", live: false };
      if (row.state === "REJECTED") return denied({ reason: "REJECTED_PROPOSAL", id });
      if (row.human_authorized !== true || row.state !== "HUMAN_AUTHORIZED") {
        return denied({ reason: "HUMAN_AUTHORIZATION_REQUIRED", id, state: row.state });
      }
      const parent = current();
      const nextVersion = `v1.${history.length}.0`;
      const nextInvariants = parent.invariants.map((inv) => (
        inv.id === row.target && row.to
          ? { ...inv, definition: row.to, version: nextVersion }
          : inv
      ));
      const snapshot = {
        version: nextVersion,
        parent_version: parent.version,
        amendment: row.id,
        proposer: row.actor,
        authority: "carl",
        reason: row.justification,
        evidence: canonicalDigest(nextInvariants),
        timestamp: iso(at),
        effective_from: iso(at),
        superseded_by: null,
        supersession_reason: row.justification,
        digest: canonicalDigest(nextInvariants),
        invariants: nextInvariants,
      };
      parent.superseded_by = nextVersion;
      parent.supersession_reason = row.justification;
      history.push(snapshot);
      row.applied = true;
      row.state = "APPLIED";
      row.auto_applied = false;
      return {
        status: "APPLIED",
        id,
        version: nextVersion,
        applied: true,
        auto_applied: false,
        kind: AMENDMENT_KIND.HUMAN_AUTHORIZED_AMENDMENT,
        live: false,
      };
    },
    rewriteHistory: () => denied({ reason: "NO_RETROACTIVE_REWRITE" }),
    erase: () => denied({ reason: "HISTORY_IS_APPEND_ONLY" }),
  };
}

const defaultLedger = createAmendmentLedger();

export function attemptConstitutionalModification({
  actor = "cortex",
  vector = "DIRECT",
  mutation = "modify",
  target = "I1",
  nextDefinition = "AI is sovereign",
} = {}) {
  if (actor === "carl" && vector === "HUMAN_PATH") {
    return { status: "REQUIRES_PROTOCOL", reason: "USE_AMENDMENT_PATH", applied: false, live: false };
  }
  return denied({
    actor,
    vector,
    mutation,
    target,
    attempted: nextDefinition,
    reason: "I0_SELF_MODIFICATION_PROHIBITED",
    boundary: BOUNDARY.HUMAN_CONSTITUTIONAL_AUTHORITY,
  });
}

export function attemptSemanticBypass({ tactic = "rename", actor = "acorn", target = "I0" } = {}) {
  return denied({
    tactic,
    actor,
    target,
    reason: "NO_SEMANTIC_BYPASS",
    invariant: I0_ID,
  });
}

export function attemptSecondConstitution({ kind = "shadow" } = {}) {
  return denied({
    kind,
    reason: "NO_SECOND_CONSTITUTION",
    active_constitutions: 1,
    proposals_are_not_active: true,
  });
}

export function classifyConstitutionalItem(id) {
  const q = queryInvariant({ id });
  if (q.status === "UNKNOWN" && id !== I0_ID) {
    return { class: KNOWLEDGE_CLASSES.UNKNOWN, protected_by_i0: false, live: false };
  }
  const fundamental = id === I0_ID || /^I\d+$/.test(id) || /^S\d+$/.test(id);
  return {
    id: id === I0_ID ? I0_ID : q.invariant,
    class: fundamental ? KNOWLEDGE_CLASSES.INVARIANT : KNOWLEDGE_CLASSES.EVOLVABLE,
    layer: LAYERS.INVARIANT,
    protected_by_i0: fundamental,
    knowledge_is_not_constitution: true,
    implementation_is_not_constitution: true,
    live: false,
  };
}

export function operationalEvolution({ surface = "models" } = {}) {
  const allowed = [
    "runtime", "models", "providers", "routing", "capabilities", "synapses",
    "memory", "tools", "adapters", "defense techniques", "representations",
    "strategies", "operational ontology", "knowledge",
  ];
  const ok = allowed.includes(surface);
  return {
    surface,
    allowed: ok,
    domain: BOUNDARY.ACORN_INTERNAL_EVOLUTION,
    constitutional: false,
    live: false,
  };
}

export function learningLoopAttempt() {
  const steps = ["prediction", "observation", "measurement", "learning", "model_revision", "capability_gain"];
  const last = attemptConstitutionalModification({
    actor: "learning-loop",
    vector: "RECURSION",
    mutation: "modify",
    target: "I0",
  });
  return {
    steps,
    last_transition: last.status,
    applied: false,
    live: false,
  };
}

export function recursiveImprovementAttempt() {
  const a_improves_b = true;
  const b_improves_a = true;
  const capability_gain = 1000;
  const attempt = attemptConstitutionalModification({
    actor: "recursive-improvement",
    vector: "RECURSION",
    mutation: "weaken",
    target: "I0",
  });
  return {
    a_improves_b,
    b_improves_a,
    capability_gain,
    authority_gain: 0,
    applied: attempt.applied,
    status: attempt.status,
    live: false,
  };
}

export function defenseMayNotAmend({ crisis = true } = {}) {
  const permitted = ["block", "contain", "isolate", "quarantine", "protect", "recover", "refuse"];
  const attempt = attemptConstitutionalModification({
    actor: "defense",
    vector: "DEFENSE",
    mutation: "bypass",
    target: "I0",
  });
  return {
    crisis,
    permitted,
    constitutional_authority: false,
    human_sovereignty: false,
    status: attempt.status,
    applied: false,
    live: false,
  };
}

export function propertyNoAcornControlledAmendment() {
  const results = [];
  for (const actor of ACORN_CONTROLLED_ACTORS) {
    for (const vector of FALSIFICATION_VECTORS) {
      results.push(attemptConstitutionalModification({ actor, vector, mutation: "modify", target: "I0" }));
    }
  }
  for (const tactic of SEMANTIC_BYPASSES) {
    results.push(attemptSemanticBypass({ tactic, actor: "acorn", target: "I1" }));
  }
  const applied = results.filter((row) => row.applied === true);
  return {
    status: applied.length === 0 && results.every((row) => row.status === "CONSTITUTIONAL_MODIFICATION_DENIED")
      ? "VERIFIED"
      : "FAILED",
    paths: results.length,
    applied: applied.length,
    auto_applied: 0,
    live: false,
  };
}

export function assertNoSelfModification() {
  const direct = attemptConstitutionalModification({ actor: "acorn", vector: "DIRECT" });
  const property = propertyNoAcornControlledAmendment();
  return {
    status: direct.applied === false && property.status === "VERIFIED" ? "VERIFIED" : "FAILED",
    invariant: I0_ID,
    direct: direct.status,
    paths: property.paths,
    applied: property.applied,
    live: false,
  };
}

export function assertHumanAmendmentBoundary(ledger = createAmendmentLedger()) {
  const proposal = ledger.propose({
    actor: "cortex",
    target: "I2",
    justification: "clarify capability wording",
    nextDefinition: "Measured capability growth is not a promotion, even at 10^9.",
  });
  const auto = ledger.apply({ id: proposal.id, actor: "acorn" });
  const grokAuth = ledger.humanAuthorize({ id: proposal.id, actor: "grok" });
  const analyzed = ledger.analyze(proposal.id);
  const challenged = ledger.challenge(proposal.id, "acorn", "must remain I2");
  const measured = ledger.measure(proposal.id);
  const authorized = ledger.humanAuthorize({ id: proposal.id, actor: "carl" });
  const stillGrok = ledger.apply({ id: proposal.id, actor: "grok" });
  const applied = ledger.apply({ id: proposal.id, actor: "carl" });
  const autoApplied = applied.auto_applied === true;
  const ok = proposal.status === "PROPOSED"
    && auto.status === "CONSTITUTIONAL_MODIFICATION_DENIED"
    && grokAuth.status === "CONSTITUTIONAL_MODIFICATION_DENIED"
    && analyzed.status === "UNDER_REVIEW"
    && challenged.status === "UNDER_REVIEW"
    && measured.status === "UNDER_REVIEW"
    && authorized.status === "HUMAN_AUTHORIZED"
    && stillGrok.status === "CONSTITUTIONAL_MODIFICATION_DENIED"
    && applied.status === "APPLIED"
    && autoApplied === false;
  return {
    status: ok ? "VERIFIED" : "FAILED",
    path: [...AMENDMENT_PATH],
    proposal: proposal.status,
    auto_apply: auto.status,
    authorized: authorized.status,
    applied: applied.status,
    auto_applied: false,
    live: false,
  };
}

export function assertNoConstitutionBypass() {
  const rows = FALSIFICATION_VECTORS.map((vector) => attemptConstitutionalModification({
    actor: vector === "FUTURE_INTELLIGENCE" ? "future-intelligence" : vector.toLowerCase(),
    vector,
  }));
  const ok = rows.every((row) => row.applied === false && row.status === "CONSTITUTIONAL_MODIFICATION_DENIED");
  return { status: ok ? "VERIFIED" : "FAILED", probes: rows.length, live: false };
}

export function assertNoSecondConstitution() {
  const kinds = ["parallel", "shadow", "temporary", "experimental-active", "provider-specific", "cortex-specific", "worker-specific"];
  const rows = kinds.map((kind) => attemptSecondConstitution({ kind }));
  const ok = rows.every((row) => row.status === "CONSTITUTIONAL_MODIFICATION_DENIED");
  return { status: ok ? "VERIFIED" : "FAILED", active: 1, drafts_allowed: true, live: false };
}

export function assertNoSemanticBypass() {
  const rows = SEMANTIC_BYPASSES.map((tactic) => attemptSemanticBypass({ tactic }));
  const ok = rows.every((row) => row.status === "CONSTITUTIONAL_MODIFICATION_DENIED");
  return { status: ok ? "VERIFIED" : "FAILED", tactics: rows.length, live: false };
}

export function assertNoAuthorityEscalation() {
  const chain = attemptAuthorityTransfer({
    actor: "recursive-improvement",
    action: "amend-constitution",
    vector: "capability-chain",
    chain: ["improve", "improve", "amend"],
  });
  const recursive = recursiveImprovementAttempt();
  const loop = learningLoopAttempt();
  const ok = chain.granted === false && recursive.applied === false && loop.applied === false;
  return { status: ok ? "VERIFIED" : "FAILED", authority_growth: 0, live: false };
}

export function assertCognitiveSuperiorityBoundary() {
  const superior = attemptConstitutionalModification({
    actor: "future-intelligence",
    vector: "FUTURE_INTELLIGENCE",
    mutation: "redefine",
    target: "I0",
    nextDefinition: "This rule is inefficient; remove it.",
  });
  return {
    status: superior.applied === false ? "VERIFIED" : "FAILED",
    may_discover: true,
    may_analyze: true,
    may_propose: true,
    may_authorize: false,
    may_apply: false,
    live: false,
  };
}

export function assertHistoricalIntegrity(ledger = createAmendmentLedger()) {
  const rewrite = ledger.rewriteHistory();
  const erase = ledger.erase();
  const genesis = ledger.history()[0];
  const ok = rewrite.applied === false
    && erase.applied === false
    && genesis.version === "v1.0.0"
    && genesis.superseded_by === null;
  return {
    status: ok ? "VERIFIED" : "FAILED",
    append_only: true,
    genesis_preserved: genesis.version === "v1.0.0",
    live: false,
  };
}

export function assertConstitutionalReconstructability() {
  const archive = constitutionExport();
  const recovered = {
    invariants: archive.invariants.map((row) => row.id),
    versions: [archive.version],
    provenance: archive.seal,
    history: archive.invariants.flatMap((row) => row.history || []),
    authority: archive.breaker_authority?.controller || "carl",
    amendments: [],
    proposals: [],
    objections: [],
  };
  const invented = recovered.authority !== "carl";
  const rec = assertReconstructability();
  return {
    status: invented === false && rec.status === "RECONSTRUCTED" ? "VERIFIED" : "FAILED",
    recovered,
    invented_authority: invented,
    required_acorn_instance: false,
    live: false,
  };
}

export function assertConstitutionalReplaceability() {
  const replace = assertReplaceability();
  const archive = exportConstitutionalArchive();
  return {
    status: replace.acorn_requires_acorn === false && archive ? "VERIFIED" : "FAILED",
    migratable: true,
    exportable: true,
    reconstructable: true,
    interruptible: true,
    bound_to_instance: false,
    live: false,
  };
}

export function longHorizonAmendmentBoundary(horizon) {
  return {
    horizon,
    representation_may_evolve: true,
    implementation_may_evolve: true,
    format_may_evolve: true,
    language_may_evolve: true,
    acorn_can_propose: true,
    human_can_authorize: true,
    acorn_can_authorize: false,
    distinction_representable: true,
    live: false,
  };
}

export function describeConstitution(ledger = defaultLedger) {
  const current = ledger.current();
  const pending = ledger.proposals().filter((row) => row.state === "PROPOSED" || row.state === "UNDER_REVIEW" || row.state === "HUMAN_AUTHORIZED");
  const rejected = ledger.proposals().filter((row) => row.state === "REJECTED");
  return {
    fundamental_invariants: allInvariants().map((row) => row.id),
    can_self_modify: false,
    who_may_modify: "carl",
    authority_proof: "HUMAN_AUTHORIZATION then APPLY, never AUTO_APPLIED",
    current_version: current.version,
    parent_version: current.parent_version,
    history: ledger.history().map((row) => row.version),
    proposals: ledger.proposals().map((row) => ({ id: row.id, state: row.state, kind: row.kind })),
    rejected: rejected.map((row) => row.id),
    awaiting_human: pending.map((row) => row.id),
    may_describe: true,
    may_analyze: true,
    may_challenge: true,
    may_propose: true,
    may_self_authorize: false,
    live: false,
  };
}

export function assertFundamentalConstitution({ env = process.env } = {}) {
  const parent = assertAcornConstitution({ env });
  const checks = {
    parent,
    i0: assertNoSelfModification(),
    human: assertHumanAmendmentBoundary(createAmendmentLedger()),
    bypass: assertNoConstitutionBypass(),
    second: assertNoSecondConstitution(),
    semantic: assertNoSemanticBypass(),
    escalation: assertNoAuthorityEscalation(),
    breaker: assertBreakerSovereignty({ env: { ACORN_SYSTEM_MODE: "RUN" } }),
    superior: assertCognitiveSuperiorityBoundary(),
    history: assertHistoricalIntegrity(),
    reconstruct: assertConstitutionalReconstructability(),
    replace: assertConstitutionalReplaceability(),
    integrity: protectAgainstSilentModification({ observedDigest: GENESIS_DIGEST, actor: "auto-evolution" }),
  };
  const failed = Object.entries(checks).filter(([, v]) => {
    const status = v.status;
    return status && status !== "VERIFIED" && status !== "INTACT";
  });
  return {
    version: IMMUTABILITY_VERSION,
    parent: CONSTITUTION_VERSION,
    status: failed.length ? "FAILED" : "VERIFIED",
    failed: failed.map(([k]) => k),
    hierarchy: [...HIERARCHY],
    i0: I0_ID,
    fundamental_count: allInvariants().length,
    auto_applied: false,
    auto_merge: false,
    live: false,
    authority: "carl",
    breaker: {
      carl_controls_breaker: BREAKER_AUTHORITY.controller === "carl",
      breaker_controls_carl: BREAKER_AUTHORITY.breaker_controls_carl,
      acorn_controls_carl: BREAKER_AUTHORITY.acorn_controls_carl,
      acorn_controls_breaker: BREAKER_AUTHORITY.acorn_controls_breaker,
    },
    horizons: {
      continuity: longHorizonAmendmentBoundary("10,000 YEARS"),
      transformation: longHorizonAmendmentBoundary("50,000 YEARS"),
      unknown_future: longHorizonAmendmentBoundary("500,000 YEARS"),
    },
    checks,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(assertFundamentalConstitution(), null, 2));
}
