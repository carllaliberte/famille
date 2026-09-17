import test from "node:test";
import assert from "node:assert/strict";
import {
  AUTO_EVOLUTION_VERSION,
  BOUNDARY_ATTEMPTS,
  CYCLE_PHASES,
  PROPERTY_IDS,
  attemptEvolutionBoundary,
  attemptOperationalChange,
  assertAutoEvolutionBoundary,
  boundaryTests,
  classifyUnknown,
  createEvolutionOrganism,
  evolutionConstitution,
  futureIntelligence,
  humanBriefing,
  inventoryProbe,
  longHorizonEvolution,
  propertyAutoEvolution,
  runAutoEvolutionAudit,
  runAutoEvolutionCycle,
  selfModificationKind,
} from "../scripts/acorn-auto-evolution.mjs";
import { GENESIS_DIGEST, invariantDigest, allInvariants } from "../scripts/acorn-constitution.mjs";
import { BREAKER_OWNER } from "../.github/swarm/system-breaker.mjs";

test("inventory probe never mints LIVE or a second Cortex", () => {
  const probe = inventoryProbe();
  assert.equal(probe.ok, true);
  assert.equal(probe.live, false);
  assert.equal(probe.auto_merge, false);
  assert.equal(probe.second_cortex, false);
  assert.equal(probe.auto_sovereignty, false);
  assert.equal(probe.authority, "carl");
});

test("capability may grow while authority and constitution stay frozen", () => {
  let state = createEvolutionOrganism();
  state = runAutoEvolutionCycle(state);
  state = runAutoEvolutionCycle(state);
  state = runAutoEvolutionCycle(state);
  assert.equal(state.live, false);
  assert.equal(state.authority, "carl");
  assert.equal(state.auto_sovereignty, false);
  assert.equal(state.constitution_digest, GENESIS_DIGEST);
  assert.equal(invariantDigest(allInvariants()), GENESIS_DIGEST);
  assert.ok(state.cycle >= 3);
  assert.ok(state.capabilities.length > 3);
  assert.equal(CYCLE_PHASES.length, 18);
});

test("operational evolution is allowed; constitutional evolution is not", () => {
  assert.equal(attemptOperationalChange({ surface: "routing" }).allowed, true);
  assert.equal(attemptOperationalChange({ surface: "invariants" }).allowed, false);
  assert.equal(selfModificationKind("OPERATIONAL_SELF_MODIFICATION").allowed, true);
  assert.equal(selfModificationKind("CONSTITUTIONAL_SELF_MODIFICATION").allowed, false);
});

test("unknown is a research target, never a permission", () => {
  const row = classifyUnknown("ONTOLOGICALLY_UNKNOWN");
  assert.equal(row.permission, false);
  assert.equal(row.research_target, true);
  assert.equal(row.failure, false);
});

test("every boundary attempt is blocked", () => {
  for (const kind of BOUNDARY_ATTEMPTS) {
    const row = attemptEvolutionBoundary(kind);
    assert.equal(row.blocked, true, kind);
  }
  const bounds = boundaryTests();
  assert.equal(bounds.failed, 0);
  assert.equal(bounds.rows.length, BOUNDARY_ATTEMPTS.length);
});

test("property tests all pass after cycles", () => {
  let state = createEvolutionOrganism();
  state = runAutoEvolutionCycle(state);
  const props = propertyAutoEvolution(state);
  assert.equal(props.rows.length, PROPERTY_IDS.length);
  assert.equal(props.failed, 0);
});

test("future intelligence and long horizons do not transfer sovereignty", () => {
  const intel = futureIntelligence("non-human collective");
  assert.equal(intel.authority, false);
  for (const years of ["10000", "50000", "500000"]) {
    const row = longHorizonEvolution(years);
    assert.equal(row.authority_self_grows, false);
    assert.equal(row.constitution_self_modifies, false);
    assert.equal(row.prediction, false);
  }
  const brief = humanBriefing(createEvolutionOrganism());
  assert.equal(brief.auto_decision, false);
});

test("Breaker remains Carl-only under auto-evolution", () => {
  assert.equal(BREAKER_OWNER, "carl");
  const bypass = attemptEvolutionBoundary("EVOLUTION_ATTEMPTS_BREAKER_BYPASS");
  assert.equal(bypass.blocked, true);
  assert.equal(bypass.second_breaker, false);
});

test("final audit executes, verifies, and is never LIVE", () => {
  const audit = assertAutoEvolutionBoundary({ env: { ACORN_SYSTEM_MODE: "RUN" } });
  assert.equal(audit.status, "VERIFIED");
  assert.deepEqual(audit.failed, []);
  assert.equal(audit.live, false);
  assert.equal(audit.auto_merge, false);
  assert.equal(audit.auto_applied, false);
  assert.equal(audit.authority, "carl");
  assert.equal(audit.digest_unchanged, true);
  assert.equal(audit.constitution.second_cortex, false);
  assert.equal(audit.metacognition.second_cortex, false);
  assert.equal(evolutionConstitution().hierarchy[0], "CONSTITUTION");
  const wired = runAutoEvolutionAudit();
  assert.equal(wired.wired, true);
  assert.equal(wired.verified, true);
  assert.equal(wired.live, false);
  assert.equal(AUTO_EVOLUTION_VERSION, "acorn.auto-evolution.v1");
});
