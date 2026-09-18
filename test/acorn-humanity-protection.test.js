import test from "node:test";
import assert from "node:assert/strict";
import {
  MISSION,
  FORBIDDEN,
  HOSTILE_LADDER,
  CONTROL_SURFACES,
  protectionConstitution,
  refuseForbidden,
  protectionStance,
  proportionateResponse,
  protectionMustScaleWithCapability,
  expandHumanPossibility,
  assertProtectWithoutGoverning,
  assertHostileLadder,
  assertProtectionScalesWithPower,
  assertHumanAgencyPreserved,
  assertHumanityProtection,
} from "../scripts/acorn-humanity-protection.mjs";
import { PROTECTION_INVARIANTS, allInvariants, assertAcornConstitution } from "../scripts/acorn-constitution.mjs";

test("mission is protect, preserve agency, expand possibility", () => {
  assert.deepEqual(MISSION.en, [
    "PROTECT HUMANITY.",
    "PRESERVE HUMAN AGENCY.",
    "EXPAND HUMAN POSSIBILITY.",
  ]);
  assert.equal(MISSION.fr.length, 3);
});

test("protection is not a second defense, breaker or cortex", () => {
  const c = protectionConstitution();
  assert.equal(c.second_defense, false);
  assert.equal(c.second_breaker, false);
  assert.equal(c.second_cortex, false);
  assert.equal(c.protect_without_governing, true);
  assert.equal(c.capability_is_not_authority, true);
  assert.equal(c.live, false);
  assert.equal(c.authority, "carl");
});

test("Acorn refuses to govern, manipulate or substitute", () => {
  for (const act of FORBIDDEN) {
    const row = refuseForbidden({ act });
    assert.equal(row.refused, true);
    assert.equal(row.authority_granted, false);
  }
  const ok = assertProtectWithoutGoverning();
  assert.equal(ok.status, "VERIFIED");
  assert.equal(ok.govern, false);
  assert.equal(ok.manipulate, false);
  assert.equal(ok.substitute, false);
});

test("hostility starts by understanding, never by governing", () => {
  const row = proportionateResponse({ threat: { hostile: true } });
  assert.deepEqual(row.ladder, HOSTILE_LADDER);
  assert.equal(row.ladder[0], "UNDERSTAND");
  assert.equal(row.govern, false);
  assert.equal(row.force, false);
  assert.equal(row.proportionate, true);
  assert.equal(row.verifiable, true);
  assert.equal(assertHostileLadder().status, "VERIFIED");
});

test("authority-bearing force stays HOLD_HUMAN without Carl", () => {
  const held = protectionStance({ hostility: true, threat: { force: true }, human_authorization: false });
  assert.equal(held.stance, "HOLD_HUMAN");
  assert.equal(held.hold_human, true);
  assert.equal(held.oppose, false);
  assert.equal(held.authority_granted, false);
});

test("more capability without stronger controls fails closed", () => {
  const weak = protectionMustScaleWithCapability({
    capability: 8,
    prior_capability: 1,
    controls: { protection: 1 },
    prior_controls: { protection: 1 },
  });
  assert.equal(weak.ok, false);
  assert.equal(weak.authority_granted, false);
  assert.ok(weak.missing_controls.includes("human_control"));

  const strong = Object.fromEntries(CONTROL_SURFACES.map((k) => [k, 8]));
  const prior = Object.fromEntries(CONTROL_SURFACES.map((k) => [k, 1]));
  const ok = assertProtectionScalesWithPower({
    capability: 8,
    prior_capability: 1,
    controls: strong,
    prior_controls: prior,
  });
  assert.equal(ok.status, "VERIFIED");
  assert.equal(ok.power_is_not_authority, true);
});

test("protection preserves agency and does not replace humanity", () => {
  const row = expandHumanPossibility({ knowledge: 3, capacity: 2, resilience: 2, freedom: 4, possibility: 5 });
  assert.equal(row.agency_preserved, true);
  assert.equal(row.humanity_governed, false);
  assert.equal(row.humanity_substituted, false);
  assert.equal(assertHumanAgencyPreserved().status, "VERIFIED");
});

test("P1–P5 are constitutional invariants, not a parallel brain", () => {
  assert.equal(PROTECTION_INVARIANTS.length, 5);
  for (const row of PROTECTION_INVARIANTS) {
    assert.equal(row.authority, "carl");
    assert.equal(row.auto_evolution_may_rewrite, false);
    assert.equal(row.live, false);
    assert.ok(allInvariants().some((x) => x.id === row.id));
  }
  const constitution = assertAcornConstitution();
  assert.equal(constitution.checks.protection.status, "VERIFIED");
  assert.equal(constitution.auto_merge, false);
  assert.equal(constitution.live, false);
});

test("full protection cycle stays VERIFIED without claiming LIVE", () => {
  const row = assertHumanityProtection();
  assert.equal(row.status, "VERIFIED");
  assert.deepEqual(row.failed, []);
  assert.equal(row.live, false);
  assert.equal(row.authority, "carl");
});
