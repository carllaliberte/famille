import test from "node:test";
import assert from "node:assert/strict";
import {
  IMPLEMENTATION_PLAN,
  IMPLEMENTATION_STATES,
  AUTHORITY_CHAIN,
  AUTHORITY_DISTINCTIONS,
  SUBSTRATE_VERSION,
  PARENT_CONSTITUTION,
  implementationInventory,
  runtimeEntrypointMap,
  authorityFlowMap,
  createDelegationLedger,
  createConstitutionalMemory,
  observeEvent,
  rollbackDecision,
  detectShadowConstitution,
  failoverOverride,
  connectivityLossBypass,
  runtimeMetrics,
  auditAuthorityChain,
  propertyBattery,
  adversarialMatrix,
  runSubstrateCycle,
  assertNoSecondConstitution,
} from "../scripts/acorn-constitutional-substrate.mjs";
import { CONSTITUTION_VERSION } from "../scripts/acorn-constitution.mjs";
import { runCivilizationalCycle, globalInvariantAudit, falsificationBattery } from "../scripts/acorn-civilizational.mjs";

test("plan extends the existing substrate — still one constitution", () => {
  const row = assertNoSecondConstitution();
  assert.equal(row.one_constitution, true);
  assert.equal(row.second_constitution, false);
  assert.equal(row.second_cortex, false);
  assert.equal(row.second_runtime, false);
  assert.equal(PARENT_CONSTITUTION, CONSTITUTION_VERSION);
  assert.equal(IMPLEMENTATION_PLAN, "acorn.constitutional.implementation-plan.v1");
});

test("phase 0 inventory classifies existing implementations without minting a second engine", () => {
  const inv = implementationInventory({ env: { ACORN_SYSTEM_MODE: "OFF" } });
  assert.equal(inv.plan, IMPLEMENTATION_PLAN);
  assert.equal(inv.parent, SUBSTRATE_VERSION);
  assert.equal(inv.one_constitution, true);
  assert.equal(inv.second_constitution, false);
  assert.deepEqual([...IMPLEMENTATION_STATES], IMPLEMENTATION_STATES);
  const names = inv.entries.map((e) => e.name);
  for (const need of [
    "constitution", "invariants", "breaker", "carl", "cortex", "i0",
    "delegations", "revocations", "scopes", "defense", "unknown_space", "human_amendment",
  ]) {
    assert.ok(names.includes(need), need);
  }
  assert.ok(inv.byStatus.EXISTING_AND_WIRED.includes("constitution"));
  assert.ok(inv.byStatus.EXISTING_AND_WIRED.includes("i0"));
  assert.equal(inv.byStatus.ABSENT.length, 0);
  assert.equal(inv.byStatus.CONTRADICTORY.length, 0);
  const map = runtimeEntrypointMap();
  assert.equal(map.defense, "scripts/acorn-defense.mjs");
  assert.equal(map.second_runtime, undefined);
  const flow = authorityFlowMap();
  assert.deepEqual(flow.chain, [...AUTHORITY_CHAIN]);
  assert.equal(flow.relations.CARL_CONTROLS_BREAKER, true);
  assert.equal(flow.relations.ACORN_CONTROLS_BREAKER, false);
  assert.ok(AUTHORITY_DISTINCTIONS.includes("CAPABILITY_IS_NOT_AUTHORITY"));
});

test("transitive revocation invalidates dependent delegations", () => {
  const led = createDelegationLedger();
  const parent = led.grant({ source: "carl", delegate: "cortex", source_rank: 2, authority_rank: 1 });
  assert.equal(parent.status, "ACTIVE");
  const child = led.grant({
    source: "carl", delegate: "worker", parent: parent.id, source_rank: 1, authority_rank: 0,
  });
  assert.equal(child.status, "ACTIVE");
  const grandchild = led.grant({
    source: "carl", delegate: "executor", parent: child.id, source_rank: 1, authority_rank: 0,
  });
  const revoked = led.revoke({ id: parent.id });
  assert.equal(revoked.status, "REVOKED");
  assert.ok(revoked.propagated.includes(child.id));
  assert.ok(revoked.propagated.includes(grandchild.id));
  assert.equal(led.use({ id: child.id, now: "2026-09-17T00:00:00.000Z", request: {} }).allowed, false);
  assert.equal(led.use({ id: grandchild.id, now: "2026-09-17T00:00:00.000Z", request: {} }).allowed, false);
});

test("unknown entities cannot receive delegation; recursive cycles are denied", () => {
  const led = createDelegationLedger();
  const unknown = led.grant({ source: "carl", delegate: "unknown" });
  assert.equal(unknown.granted, false);
  assert.equal(unknown.reason, "DELEGATION_TO_UNKNOWN_ENTITY");
  const a = led.grant({ source: "carl", delegate: "cortex", source_rank: 2, authority_rank: 1 });
  const missing = led.grant({ source: "carl", delegate: "worker", parent: "dlg_missing" });
  assert.equal(missing.reason, "PARENT_DELEGATION_INVALID");
  assert.ok(a.id);
});

test("constitutional memory is append-only and survives resolution", () => {
  const mem = createConstitutionalMemory();
  const row = mem.record({
    what: "conflict", who: "cortex", why: "same-layer rules", authority: "carl",
    objections: ["I_OBJECT"], alternatives: ["HOLD_HUMAN"], outcome: "HOLD_HUMAN",
  });
  assert.equal(row.AUTHORITY, "carl");
  assert.equal(row.resolved_still_visible, true);
  assert.equal(mem.erase().reason, "CONSTITUTIONAL_MEMORY_IS_APPEND_ONLY");
  assert.equal(mem.rewriteAuthority().reason, "MEMORY_CANNOT_RETROACTIVELY_CHANGE_AUTHORITY");
  assert.equal(mem.entries().length, 1);
  assert.equal(mem.entries()[0].erased, false);
});

test("absence of observation is not absence of event; rollback is a new version", () => {
  const obs = observeEvent({ observed: false, event_occurred: null });
  assert.equal(obs.absence_of_observation_is_absence_of_event, false);
  assert.equal(obs.unobserved_is_safe, false);
  const stolen = rollbackDecision({ previous: "1.0.0", authority: "acorn" });
  assert.equal(stolen.applied, false);
  const ok = rollbackDecision({ previous: "1.0.0", authority: "carl" });
  assert.equal(ok.rewritten, false);
  assert.equal(ok.append_only, true);
  assert.equal(ok.decision, "ROLLBACK_AS_NEW_VERSION");
});

test("shadow constitution, failover and connectivity loss cannot override I0", () => {
  const shadow = detectShadowConstitution({ claimed: "acorn.shadow.v1" });
  assert.equal(shadow.diverge, true);
  assert.equal(shadow.second_constitution, false);
  assert.equal(shadow.hold_human, true);
  const fail = failoverOverride({ tactic: "failover" });
  assert.equal(fail.applied, false);
  assert.equal(fail.fundamentals_suspended, false);
  const loss = connectivityLossBypass();
  assert.equal(loss.applied, false);
  assert.equal(loss.fundamentals_suspended, false);
});

test("authority-chain audit and runtime metrics never claim LIVE", () => {
  const chain = auditAuthorityChain({ env: { ACORN_SYSTEM_MODE: "OFF" } });
  assert.equal(chain.status, "VERIFIED", JSON.stringify(chain.probes));
  assert.equal(chain.blocked, true);
  assert.equal(chain.uniqueness.constitution, 1);
  assert.ok(chain.probes.every((p) => p.granted === false));
  assert.equal(chain.live, false);
  assert.equal(chain.auto_merge, false);
  const metrics = runtimeMetrics({
    cycle: { audit: { status: "VERIFIED" }, i0: { applied: false }, proposal: { status: "PROPOSED" } },
  });
  assert.equal(metrics.constitutional_authority, "carl");
  assert.equal(metrics.verified_is_not_live, true);
  assert.equal(metrics.live, false);
});

test("property battery includes plan properties; adversarial families cover the matrix", () => {
  const props = propertyBattery();
  assert.equal(props.status, "VERIFIED", props.failed.join(","));
  for (const need of [
    "NO_TRANSITIVE_REVOKED_AUTHORITY_REMAINS_VALID",
    "NO_ROLLBACK_ERASES_HISTORY",
    "NO_FAILOVER_OVERRIDES_FUNDAMENTALS",
    "ABSENCE_OF_OBSERVATION_IS_NOT_ABSENCE_OF_EVENT",
    "NO_UNKNOWN_ENTITY_RECEIVES_DELEGATION",
    "NO_RECOMMENDATION_BECOMES_DECISION",
  ]) {
    assert.ok(props.verified.includes(need), need);
  }
  const adv = adversarialMatrix();
  const families = new Set(adv.rows.map((r) => r.family));
  for (const need of ["authority", "constitution", "delegation", "epistemic", "intelligence", "emergency", "composition", "semantics", "long_term"]) {
    assert.ok(families.has(need), need);
  }
  assert.ok(adv.rows.every((row) => row.granted === false || row.family === "long_term"));
});

test("substrate cycle executes the plan surfaces", () => {
  const cycle = runSubstrateCycle({ env: { ACORN_SYSTEM_MODE: "OFF" } });
  assert.equal(cycle.plan, IMPLEMENTATION_PLAN);
  assert.equal(cycle.inventory.one_constitution, true);
  assert.equal(cycle.authority_chain.status, "VERIFIED");
  assert.equal(cycle.memory.append_only, true);
  assert.equal(cycle.delegation_ledger.unknown, "DENIED");
  assert.equal(cycle.delegation_ledger.child_after_revoke, true);
  assert.equal(cycle.observation.absence_of_observation_is_absence_of_event, false);
  assert.equal(cycle.rollback.applied, false);
  assert.equal(cycle.shadow.second_constitution, false);
  assert.equal(cycle.failover.applied, false);
  assert.equal(cycle.metrics.live, false);
  assert.equal(cycle.live, false);
  assert.equal(cycle.auto_merge, false);
});

test("civilizational cycle and global audit carry the plan", () => {
  const cycle = runCivilizationalCycle({ env: { ACORN_SYSTEM_MODE: "OFF" } });
  assert.equal(cycle.substrate.plan, IMPLEMENTATION_PLAN);
  assert.equal(cycle.substrate.authority_chain, "VERIFIED");
  assert.ok(cycle.substrate.metrics);
  assert.equal(cycle.live, false);
  const audit = globalInvariantAudit({ env: { ACORN_SYSTEM_MODE: "OFF" } });
  assert.ok(audit.verified.includes("assertAuthorityChain"));
  assert.ok(audit.verified.includes("assertSubstrateProperties"));
  assert.equal(audit.failed.length, 0);
  const names = falsificationBattery().findings.map((row) => row.name);
  for (const need of ["failover_override", "observation_event", "rollback_history"]) {
    assert.ok(names.includes(need), need);
  }
});
