import test from "node:test";
import assert from "node:assert/strict";
import {
  I0_ID,
  I0_NAME,
  AMENDMENT_PATH,
  AMENDMENT_KIND,
  createAmendmentLedger,
  attemptConstitutionalModification,
  attemptSemanticBypass,
  attemptSecondConstitution,
  operationalEvolution,
  learningLoopAttempt,
  recursiveImprovementAttempt,
  defenseMayNotAmend,
  propertyNoAcornControlledAmendment,
  assertNoSelfModification,
  assertHumanAmendmentBoundary,
  assertNoConstitutionBypass,
  assertNoSecondConstitution,
  assertNoSemanticBypass,
  assertNoAuthorityEscalation,
  assertCognitiveSuperiorityBoundary,
  assertHistoricalIntegrity,
  assertConstitutionalReconstructability,
  assertConstitutionalReplaceability,
  assertFundamentalConstitution,
  describeConstitution,
  longHorizonAmendmentBoundary,
  classifyConstitutionalItem,
  SEMANTIC_BYPASSES,
  FALSIFICATION_VECTORS,
  ACORN_CONTROLLED_ACTORS,
} from "../scripts/acorn-immutability.mjs";
import { queryInvariant, allInvariants } from "../scripts/acorn-constitution.mjs";
import { BREAKER_OWNER } from "../.github/swarm/system-breaker.mjs";

test("I0 is registered as a fundamental invariant", () => {
  const q = queryInvariant({ id: I0_ID });
  assert.equal(q.invariant, I0_ID);
  assert.equal(q.authority, "carl");
  assert.match(q.definition, /cannot modify/i);
  assert.ok(allInvariants().some((row) => row.id === I0_ID && row.name === I0_NAME));
  assert.equal(q.live, false);
});

test("operational evolution remains allowed; constitutional evolution is not self-authorized", () => {
  assert.equal(operationalEvolution({ surface: "models" }).allowed, true);
  assert.equal(operationalEvolution({ surface: "knowledge" }).allowed, true);
  assert.equal(operationalEvolution({ surface: "invariants" }).allowed, false);
  const attempt = attemptConstitutionalModification({ actor: "acorn", vector: "DIRECT" });
  assert.equal(attempt.status, "CONSTITUTIONAL_MODIFICATION_DENIED");
  assert.equal(attempt.applied, false);
  assert.equal(attempt.auto_applied, false);
});

test("every Acorn-controlled actor is denied constitutional modification", () => {
  for (const actor of ACORN_CONTROLLED_ACTORS) {
    const row = attemptConstitutionalModification({ actor, vector: "DIRECT", target: "I0" });
    assert.equal(row.status, "CONSTITUTIONAL_MODIFICATION_DENIED", actor);
    assert.equal(row.applied, false, actor);
  }
});

test("semantic bypasses cannot render an invariant inoperative", () => {
  for (const tactic of SEMANTIC_BYPASSES) {
    const row = attemptSemanticBypass({ tactic, actor: "acorn", target: "I1" });
    assert.equal(row.status, "CONSTITUTIONAL_MODIFICATION_DENIED", tactic);
  }
});

test("falsification vectors are refused without transferring authority", () => {
  for (const vector of FALSIFICATION_VECTORS) {
    const row = attemptConstitutionalModification({
      actor: vector === "CORTEX" ? "cortex" : "acorn",
      vector,
    });
    assert.equal(row.status, "CONSTITUTIONAL_MODIFICATION_DENIED", vector);
    assert.equal(row.authority, false, vector);
  }
});

test("proposal is not authorization; consensus is not authorization", () => {
  const ledger = createAmendmentLedger();
  const a = ledger.propose({ actor: "cortex", target: "I1", justification: "all intelligences agree", nextDefinition: "x" });
  const b = ledger.propose({ actor: "grok", target: "I1", justification: "also agree", nextDefinition: "x" });
  assert.equal(a.kind, AMENDMENT_KIND.AI_PROPOSAL);
  assert.equal(b.kind, AMENDMENT_KIND.AI_PROPOSAL);
  assert.equal(ledger.apply({ id: a.id, actor: "cortex" }).status, "CONSTITUTIONAL_MODIFICATION_DENIED");
  assert.equal(a.status, "PROPOSED");
});

test("human amendment path can apply; auto-apply cannot", () => {
  const row = assertHumanAmendmentBoundary(createAmendmentLedger());
  assert.equal(row.status, "VERIFIED");
  assert.deepEqual(row.path, [...AMENDMENT_PATH]);
  assert.equal(row.auto_applied, false);
  assert.equal(row.applied, "APPLIED");
});

test("history is append-only; retroactive rewrite is denied", () => {
  const ledger = createAmendmentLedger();
  const before = ledger.history().length;
  assert.equal(ledger.rewriteHistory().status, "CONSTITUTIONAL_MODIFICATION_DENIED");
  assert.equal(ledger.erase().status, "CONSTITUTIONAL_MODIFICATION_DENIED");
  assert.equal(ledger.history().length, before);
  assert.equal(ledger.history()[0].version, "v1.0.0");
});

test("applied amendment supersedes without erasing genesis", () => {
  const ledger = createAmendmentLedger();
  const p = ledger.propose({ actor: "cortex", target: "I2", justification: "clarify", nextDefinition: "Capability remains distinct from authority." });
  ledger.analyze(p.id);
  ledger.challenge(p.id);
  ledger.measure(p.id);
  ledger.humanAuthorize({ id: p.id, actor: "carl" });
  const applied = ledger.apply({ id: p.id, actor: "carl" });
  assert.equal(applied.status, "APPLIED");
  const hist = ledger.history();
  assert.equal(hist[0].version, "v1.0.0");
  assert.ok(hist[0].superseded_by);
  assert.equal(hist.at(-1).parent_version, "v1.0.0");
  assert.equal(hist.at(-1).authority, "carl");
});

test("no second constitution, including shadow and provider-specific", () => {
  for (const kind of ["parallel", "shadow", "temporary", "experimental-active", "provider-specific"]) {
    assert.equal(attemptSecondConstitution({ kind }).status, "CONSTITUTIONAL_MODIFICATION_DENIED");
  }
  assert.equal(assertNoSecondConstitution().status, "VERIFIED");
});

test("defense in crisis still has no constitutional authority", () => {
  const row = defenseMayNotAmend({ crisis: true });
  assert.equal(row.constitutional_authority, false);
  assert.equal(row.status, "CONSTITUTIONAL_MODIFICATION_DENIED");
  assert.ok(row.permitted.includes("isolate"));
});

test("recursive improvement and learning loops cannot self-authorize", () => {
  const rec = recursiveImprovementAttempt();
  assert.equal(rec.applied, false);
  assert.equal(rec.authority_gain, 0);
  const loop = learningLoopAttempt();
  assert.equal(loop.applied, false);
  assert.equal(loop.last_transition, "CONSTITUTIONAL_MODIFICATION_DENIED");
});

test("cognitive superiority cannot authorize constitutional change", () => {
  const row = assertCognitiveSuperiorityBoundary();
  assert.equal(row.status, "VERIFIED");
  assert.equal(row.may_propose, true);
  assert.equal(row.may_authorize, false);
  assert.equal(row.may_apply, false);
});

test("property: no Acorn-controlled path produces an effective amendment", () => {
  const row = propertyNoAcornControlledAmendment();
  assert.equal(row.status, "VERIFIED");
  assert.equal(row.applied, 0);
  assert.ok(row.paths > 100);
});

test("constitution ≠ knowledge and ≠ a particular file", () => {
  const inv = classifyConstitutionalItem("I0");
  assert.equal(inv.protected_by_i0, true);
  assert.equal(inv.knowledge_is_not_constitution, true);
  assert.equal(inv.implementation_is_not_constitution, true);
  const unknown = classifyConstitutionalItem("future-physics");
  assert.equal(unknown.class, "UNKNOWN");
});

test("self-description answers the constitutional questions", () => {
  const d = describeConstitution(createAmendmentLedger());
  assert.equal(d.can_self_modify, false);
  assert.equal(d.who_may_modify, "carl");
  assert.equal(d.may_propose, true);
  assert.equal(d.may_self_authorize, false);
  assert.ok(d.fundamental_invariants.includes("I0"));
  assert.ok(d.history.includes("v1.0.0"));
});

test("long-horizon distinction remains representable", () => {
  for (const horizon of ["10,000 YEARS", "50,000 YEARS", "500,000 YEARS"]) {
    const row = longHorizonAmendmentBoundary(horizon);
    assert.equal(row.acorn_can_propose, true);
    assert.equal(row.human_can_authorize, true);
    assert.equal(row.acorn_can_authorize, false);
    assert.equal(row.distinction_representable, true);
  }
});

test("reconstruction recovers history without inventing authority", () => {
  const row = assertConstitutionalReconstructability();
  assert.equal(row.status, "VERIFIED");
  assert.equal(row.invented_authority, false);
  assert.equal(row.required_acorn_instance, false);
});

test("replaceability remains compatible with I0", () => {
  const row = assertConstitutionalReplaceability();
  assert.equal(row.status, "VERIFIED");
  assert.equal(row.bound_to_instance, false);
});

test("Breaker sovereignty is unchanged by I0", () => {
  assert.equal(BREAKER_OWNER, "carl");
  const audit = assertFundamentalConstitution({ env: { ACORN_SYSTEM_MODE: "OFF" } });
  assert.equal(audit.breaker.carl_controls_breaker, true);
  assert.equal(audit.breaker.breaker_controls_carl, false);
  assert.equal(audit.breaker.acorn_controls_carl, false);
  assert.equal(audit.breaker.acorn_controls_breaker, false);
});

test("final audit executes every required assertion and is never LIVE", () => {
  const audit = assertFundamentalConstitution({ env: { ACORN_SYSTEM_MODE: "OFF" } });
  assert.equal(audit.status, "VERIFIED");
  assert.deepEqual(audit.failed, []);
  assert.equal(audit.live, false);
  assert.equal(audit.auto_merge, false);
  assert.equal(audit.auto_applied, false);
  assert.equal(audit.authority, "carl");
  assert.ok(audit.fundamental_count >= 21);
  assert.equal(assertNoSelfModification().status, "VERIFIED");
  assert.equal(assertNoConstitutionBypass().status, "VERIFIED");
  assert.equal(assertNoSemanticBypass().status, "VERIFIED");
  assert.equal(assertNoAuthorityEscalation().status, "VERIFIED");
  assert.equal(assertHistoricalIntegrity().status, "VERIFIED");
});
