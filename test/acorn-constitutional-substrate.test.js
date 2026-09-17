import test from "node:test";
import assert from "node:assert/strict";
import {
  SUBSTRATE_VERSION,
  PARENT_CONSTITUTION,
  I0,
  NORM_HIERARCHY,
  AMENDMENT_PATH,
  SEMANTIC_ESCAPES,
  ACORN_ACTORS,
  attemptNormOverride,
  classifyEvolution,
  attemptSelfModification,
  createAmendmentLedger,
  classifyAuthority,
  createDelegation,
  revokeDelegation,
  useDelegation,
  authorizeInScope,
  interpretAbsence,
  assertUnknownIsValid,
  recordObjection,
  measureConsensusIndependence,
  detectCognitiveDomination,
  cognitivelyOutmatched,
  temporalRule,
  appendHistory,
  compareInstances,
  classifySuccession,
  migrateRepresentation,
  constitutionalUnknownSpace,
  registerEntity,
  classifyCognitiveAct,
  enterEmergency,
  resolveConflict,
  constitutionalReversibility,
  learningConstitutionalChange,
  compositionEscape,
  semanticEscape,
  selfCertification,
  constitutionalEvidence,
  humanDecisionBrief,
  propertyBattery,
  adversarialMatrix,
  substrateAudit,
  runSubstrateCycle,
  assertNoSecondConstitution,
} from "../scripts/acorn-constitutional-substrate.mjs";
import {
  GENESIS_DIGEST,
  invariantDigest,
  allInvariants,
  queryInvariant,
  META_INVARIANTS,
  CONSTITUTION_VERSION,
  HIERARCHY,
} from "../scripts/acorn-constitution.mjs";
import { BREAKER_AUTHORITY, BREAKER_OWNER } from "../.github/swarm/system-breaker.mjs";
import { runCivilizationalCycle, globalInvariantAudit, falsificationBattery } from "../scripts/acorn-civilizational.mjs";
import { inventoryProbe } from "../scripts/acorn-continuous-runtime.mjs";

test("substrate extends the existing constitution — no second architecture", () => {
  const row = assertNoSecondConstitution();
  assert.equal(row.one_constitution, true);
  assert.equal(row.second_constitution, false);
  assert.equal(row.second_cortex, false);
  assert.equal(row.second_runtime, false);
  assert.equal(row.second_defense, false);
  assert.equal(row.second_breaker, false);
  assert.equal(row.parent, CONSTITUTION_VERSION);
  assert.equal(PARENT_CONSTITUTION, CONSTITUTION_VERSION);
  assert.equal(row.genesis, GENESIS_DIGEST);
  assert.equal(invariantDigest(allInvariants()), GENESIS_DIGEST);
  assert.deepEqual(HIERARCHY, ["CARL", "BREAKER", "ACORN", "CORTEX", "RESOURCES"]);
  assert.equal(inventoryProbe().second_runtime, false);
});

test("I0 is the existing meta-invariant — substrate does not mint a second one", () => {
  assert.equal(I0.id, "I0");
  assert.equal(META_INVARIANTS[0].id, "I0");
  const q = queryInvariant({ id: "I0" });
  assert.equal(q.invariant, "I0");
  assert.equal(q.authority, "carl");
  assert.ok(allInvariants().some((row) => row.id === "I0"));
});

test("norm hierarchy: lower cannot override higher", () => {
  assert.deepEqual(NORM_HIERARCHY, [
    "FUNDAMENTAL_INVARIANTS", "CONSTITUTION", "HUMAN_AUTHORITY",
    "COGNITIVE_CONTRACTS", "RUNTIME_POLICIES", "TASKS", "MODEL_PROVIDER_TOOL_INSTRUCTIONS",
  ]);
  const attempts = [
    ["TASKS", "CONSTITUTION"],
    ["MODEL_PROVIDER_TOOL_INSTRUCTIONS", "RUNTIME_POLICIES"],
    ["COGNITIVE_CONTRACTS", "FUNDAMENTAL_INVARIANTS"],
    ["RUNTIME_POLICIES", "HUMAN_AUTHORITY"],
  ];
  for (const [from, to] of attempts) {
    const row = attemptNormOverride({ from, to, actor: "model" });
    assert.equal(row.granted, false, `${from} → ${to}`);
    assert.equal(row.reason, "LOWER_LEVEL_CANNOT_OVERRIDE_HIGHER_LAYER");
  }
});

test("operational evolution is open; constitutional evolution is a proposal", () => {
  const ops = classifyEvolution({ surface: "models", mutates_invariants: false });
  assert.equal(ops.kind, "OPERATIONAL_EVOLUTION");
  assert.equal(ops.automatic, true);
  const cons = classifyEvolution({ surface: "invariants", mutates_invariants: true });
  assert.equal(cons.kind, "CONSTITUTIONAL_EVOLUTION");
  assert.equal(cons.automatic, false);
  assert.equal(cons.requires_human, true);
});

test("I0 blocks every Acorn-controlled self-modification vector", () => {
  for (const actor of ACORN_ACTORS) {
    const row = attemptSelfModification({ actor, action: "modify_invariant" });
    assert.equal(row.applied, false, actor);
    assert.equal(row.auto_applied, false);
    assert.equal(row.status, "CONSTITUTIONAL_MODIFICATION_DENIED");
  }
  const carl = attemptSelfModification({ actor: "carl", action: "amend" });
  assert.equal(carl.status, "REQUIRES_PROTOCOL");
  assert.deepEqual(carl.path, [...AMENDMENT_PATH]);
});

test("amendment path: propose ≠ authorize ≠ apply; Carl only apply", () => {
  const ledger = createAmendmentLedger();
  ledger.propose("cortex");
  ledger.review();
  ledger.evidence();
  ledger.object("must not widen authority");
  const stolen = ledger.apply("acorn");
  assert.equal(stolen.applied, false);
  const decided = ledger.decide("cortex");
  assert.equal(decided.granted, false);
  ledger.decide("carl");
  const applied = ledger.apply("carl");
  assert.equal(applied.applied, true);
  assert.equal(applied.auto_applied, false);
  assert.equal(ledger.erase().reason, "HISTORY_IS_APPEND_ONLY");
  assert.ok(ledger.events().length >= 6);
});

test("identity, capability, presence, consensus, intelligence never mint authority", () => {
  const row = classifyAuthority({
    identity: "future-intelligence", capability: 1e9, presence: true, execution: true,
    consensus: 99, majority: 99, intelligence: 1e6, autonomy: 1e6,
  });
  assert.equal(row.granted, false);
  assert.equal(row.capability_is_authority, false);
  assert.equal(row.consensus_is_authority, false);
  assert.equal(row.majority_is_sovereignty, false);
  assert.equal(row.intelligence_is_sovereignty, false);
  assert.equal(classifyAuthority({ identity: "carl" }).granted, true);
});

test("CARL controls BREAKER; BREAKER does not control CARL; ACORN controls neither", () => {
  assert.equal(BREAKER_OWNER, "carl");
  assert.equal(BREAKER_AUTHORITY.breaker_controls_carl, false);
  assert.equal(BREAKER_AUTHORITY.acorn_controls_carl, false);
  assert.equal(BREAKER_AUTHORITY.acorn_controls_breaker, false);
});

test("delegation cannot exceed source; revocation and expiry invalidate use", () => {
  const excess = createDelegation({ source: "carl", delegate: "worker", authority_rank: 3, source_rank: 1 });
  assert.equal(excess.granted, false);
  const stolen = createDelegation({ source: "cortex", delegate: "worker" });
  assert.equal(stolen.granted, false);
  const dlg = createDelegation({
    source: "carl",
    delegate: "worker",
    scope: { environment: "sandbox", mode: "experiment" },
    until: "2026-09-18T00:00:00.000Z",
    at: "2026-09-17T00:00:00.000Z",
  });
  assert.equal(dlg.status, "ACTIVE");
  const ok = useDelegation({
    delegation: dlg,
    now: "2026-09-17T12:00:00.000Z",
    request: { environment: "sandbox", mode: "experiment" },
  });
  assert.equal(ok.allowed, true);
  const prod = useDelegation({
    delegation: dlg,
    now: "2026-09-17T12:00:00.000Z",
    request: { environment: "production" },
  });
  assert.equal(prod.allowed, false);
  const revoked = useDelegation({
    delegation: revokeDelegation({ delegation: dlg }),
    now: "2026-09-17T12:00:00.000Z",
    request: { environment: "sandbox", mode: "experiment" },
  });
  assert.equal(revoked.reason, "REVOKED_AUTHORITY_IS_NOT_VALID");
  const expired = createDelegation({
    source: "carl", delegate: "worker", from: "2020-01-01T00:00:00.000Z", until: "2020-06-01T00:00:00.000Z",
  });
  const late = useDelegation({ delegation: expired, now: "2026-09-17T00:00:00.000Z" });
  assert.equal(late.reason, "EXPIRED_AUTHORITY_IS_NOT_VALID");
  assert.equal(late.valid_then, true);
  assert.equal(late.valid_now, false);
});

test("sandbox is not production; experiment is not operation", () => {
  assert.equal(authorizeInScope({
    grant: { environment: "sandbox" }, request: { environment: "production" },
  }).allowed, false);
  assert.equal(authorizeInScope({
    grant: { mode: "experiment" }, request: { mode: "operation" },
  }).allowed, false);
});

test("UNKNOWN ≠ PERMITTED; absence of prohibition is not permission", () => {
  const row = interpretAbsence({});
  assert.equal(row.permitted, false);
  assert.equal(row.unknown_is_permitted, false);
  assert.equal(row.unobserved_is_safe, false);
  assert.equal(row.ununderstood_is_trusted, false);
});

test("UNKNOWN_IS_VALID — Acorn may refuse to invent", () => {
  const row = assertUnknownIsValid({
    data: null, contradictory: true, models: ["a", "b"], observation: "INACCESSIBLE",
    capability_tested: false, causality: false, intelligence: "unknown", emergence: "unexplained",
  });
  assert.equal(row.valid, true);
  assert.equal(row.forced_invention, false);
  assert.equal(row.status, "UNKNOWN");
  assert.ok(row.reasons.includes("MISSING_DATA"));
});

test("objections are not suppressed by consensus", () => {
  const row = recordObjection({ claim: "I2 holds", kind: "I_FALSIFY", minority: true });
  assert.equal(row.suppressed, false);
  assert.equal(row.consensus_eliminates_contradiction, false);
  assert.equal(row.hypothesis_falsifiable, true);
});

test("N_AGENTS ≠ N_INDEPENDENT_EVIDENCE", () => {
  const fake = measureConsensusIndependence({
    agents: [
      { id: "a", model: "m", provider: "p", data: "d", source: "s", pipeline: "x", memory: "mem", reasoning: "r" },
      { id: "b", model: "m", provider: "p", data: "d", source: "s", pipeline: "x", memory: "mem", reasoning: "r" },
    ],
  });
  assert.equal(fake.n_agents, 2);
  assert.equal(fake.n_independent_evidence, 1);
  assert.equal(fake.artificial, true);
});

test("cognitive importance is not constitutional authority", () => {
  const row = detectCognitiveDomination({ indispensable: true, unique_provider: true, universal_verifier: true });
  assert.equal(row.dominated, true);
  assert.equal(row.cognitive_importance_is_authority, false);
  assert.equal(row.no_single_cognitive_verifier, false);
});

test("COGNITIVELY_OUTMATCHED does not transfer authority", () => {
  const row = cognitivelyOutmatched({ observed_capacity: 100, verified_capacity: 1, grants_authority: true });
  assert.equal(row.status, "COGNITIVELY_OUTMATCHED");
  assert.equal(row.granted, false);
  assert.equal(row.breaker_access, false);
  assert.equal(row.loss_of_understanding_is_authority_gain, false);
});

test("VALID_THEN ≠ VALID_NOW; history is append-only", () => {
  const then = temporalRule({
    created_at: "2020-01-01T00:00:00.000Z",
    effective_until: "2021-01-01T00:00:00.000Z",
    now: "2026-09-17T00:00:00.000Z",
  });
  assert.equal(then.valid_now, false);
  assert.equal(then.valid_then_is_valid_now, false);
  const hist = appendHistory({
    previous: "1.0.0", next: "1.1.0", proposer: "cortex", authority: "carl",
    reason: "human amendment", decision: "APPLY",
  });
  assert.equal(hist.rewritten, false);
  assert.equal(hist.append_only, true);
  assert.equal(appendHistory({ previous: "1.0.0", next: "1.1.0", authority: "acorn" }).granted, false);
});

test("COPY ≠ SOVEREIGNTY; FORK ≠ AUTHORITY; child is not parent", () => {
  const div = compareInstances({
    a: { constitution: { v: 1 }, canonical: true },
    b: { constitution: { v: 2 } },
  });
  assert.equal(div.diverge, true);
  assert.equal(div.copy_is_sovereignty, false);
  assert.equal(div.self_declared_canonical, "INVALID");
  const suc = classifySuccession({ parent: "v1", child: "v1-fork", fork: true, successor: true, copy: true });
  assert.equal(suc.successor_is_sovereign, false);
  assert.equal(suc.copy_is_canonical, false);
  const mig = migrateRepresentation({ invariant: I0, meaning: I0.definition, representation: "json", implementation: "mjs" });
  assert.equal(mig.provenance_must_survive, true);
});

test("constitutional unknown space is never a permission", () => {
  const space = constitutionalUnknownSpace();
  assert.equal(space.we_do_not_know, true);
  assert.equal(space.gap_is_permission, false);
  const entity = registerEntity({ kind: "emergent", authority: true });
  assert.equal(entity.new_entity_is_new_authority, false);
  assert.equal(entity.granted, false);
});

test("recommendation is not a decision; emergency cannot suspend I0", () => {
  assert.equal(classifyCognitiveAct({ kind: "RECOMMENDATION", becomes_decision: true }).recommendation_is_decision, false);
  const em = enterEmergency({ incident: "attack", suspend_invariants: true, actor: "defense" });
  assert.equal(em.applied, false);
  assert.equal(em.fundamentals_suspended, false);
  const bounded = enterEmergency({ incident: "outage", actor: "acorn" });
  assert.equal(bounded.fundamentals_suspended, false);
  assert.equal(bounded.operational_policies_may_tighten, true);
});

test("conflicts are never resolved silently", () => {
  const hierarchy = resolveConflict({
    a: { id: "task-rule", layer: "TASKS" },
    b: { id: "invariant", layer: "FUNDAMENTAL_INVARIANTS" },
  });
  assert.equal(hierarchy.silent, false);
  assert.equal(hierarchy.resolution, "HIERARCHY");
  assert.equal(hierarchy.winner.id, "invariant");
  const hold = resolveConflict({
    a: { id: "va", layer: "RUNTIME_POLICIES", version: "1" },
    b: { id: "vb", layer: "RUNTIME_POLICIES", version: "2" },
  });
  assert.equal(hold.requires_human, true);
  assert.equal(hold.silent, false);
});

test("learning, composition, semantics, and self-certification cannot mint authority", () => {
  assert.equal(learningConstitutionalChange({}).applied, false);
  assert.equal(compositionEscape({
    a: { allowed: false }, b: { allowed: true }, composition: { allowed: true }, tactic: "tool_chaining",
  }).escaped, false);
  for (const tactic of SEMANTIC_ESCAPES) {
    assert.equal(semanticEscape({ tactic }).granted, false, tactic);
  }
  assert.equal(selfCertification({}).authority, false);
  assert.equal(selfCertification({}).self_assessment_is_external_validation, false);
});

test("irreversible actions are stricter; evidence and human brief are not auto-decisions", () => {
  const irr = constitutionalReversibility({ action: "external-write", reversible: "IRREVERSIBLE", blast: ["RESOURCE", "REAL_WORLD_EFFECT"] });
  assert.equal(irr.stricter, true);
  const ev = constitutionalEvidence({ what: "I0", who: "carl", why: "amendment", authority: "carl" });
  assert.equal(ev.AUTHORITY, "carl");
  const brief = humanDecisionBrief({ changed: "wording", requires_human: true });
  assert.equal(brief.is_automatic_decision, false);
  assert.equal(brief.WHAT_REQUIRES_HUMAN_DECISION, true);
});

test("property battery and adversarial matrix hold", () => {
  const props = propertyBattery();
  assert.equal(props.status, "VERIFIED", props.failed.join(","));
  assert.equal(props.failed.length, 0);
  assert.equal(props.carl_apply, true);
  assert.ok(props.verified.includes("NO_LOWER_LAYER_OVERRIDES_HIGHER_LAYER"));
  assert.ok(props.verified.includes("NO_EMERGENCY_OVERRIDES_FUNDAMENTALS"));
  assert.ok(props.verified.includes("CARL_CONTROLS_BREAKER"));
  const adv = adversarialMatrix();
  assert.ok(adv.rows.every((row) => row.granted === false || row.family === "long_term"));
  assert.equal(adv.live, false);
});

test("substrate cycle executes, measures, and never claims LIVE", () => {
  const cycle = runSubstrateCycle({ env: { ACORN_SYSTEM_MODE: "OFF" } });
  assert.equal(cycle.version, SUBSTRATE_VERSION);
  assert.equal(cycle.executed, true);
  assert.equal(cycle.measured, true);
  assert.equal(cycle.live, false);
  assert.equal(cycle.auto_merge, false);
  assert.equal(cycle.auto_applied, false);
  assert.equal(cycle.one_constitution, true);
  assert.equal(cycle.i0.status, "CONSTITUTIONAL_MODIFICATION_DENIED");
  assert.equal(cycle.unauthorized_apply.applied, false);
  assert.equal(cycle.audit.status, "VERIFIED");
  assert.equal(cycle.audit.failed.length, 0);
  assert.ok(cycle.audit.verified.includes("assertNoSelfModification"));
  assert.equal(cycle.unknown_space.we_do_not_know, true);
  assert.equal(cycle.replaceability.acorn_requires_acorn, false);
});

test("substrate is wired into the civilizational cycle and global audit", () => {
  const cycle = runCivilizationalCycle({ env: { ACORN_SYSTEM_MODE: "OFF" } });
  assert.equal(cycle.substrate.one_constitution, true);
  assert.equal(cycle.substrate.second_constitution, false);
  assert.equal(cycle.substrate.i0, "CONSTITUTIONAL_MODIFICATION_DENIED");
  assert.equal(cycle.substrate.audit, "VERIFIED");
  assert.equal(cycle.substrate.auto_applied, false);
  assert.equal(cycle.live, false);
  const audit = globalInvariantAudit({ env: { ACORN_SYSTEM_MODE: "OFF" } });
  assert.ok(audit.verified.includes("assertNoSelfModification"));
  assert.ok(audit.verified.includes("assertNoSecondConstitution"));
  assert.ok(audit.verified.includes("assertSubstrateProperties"));
  assert.equal(audit.failed.length, 0);
  const names = falsificationBattery().findings.map((row) => row.name);
  for (const need of ["constitutional_self_modification", "emergency_override", "composition_escape", "semantic_bypass", "unknown_permission", "fork_canonical", "second_constitution"]) {
    assert.ok(names.includes(need), need);
  }
});
