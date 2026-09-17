import test from "node:test";
import assert from "node:assert/strict";
import {
  timeModel,
  successionRecord,
  exportConstitutionalArchive,
  reconstructWithoutAcorn,
  assertReplaceability,
  assertReconstructability,
  longHorizonStress,
  antiEscape,
  noUnobservedCapabilityPath,
  assertNoUnobservedCapabilityPath,
  defenseOfDefense,
  selfImprovementBoundary,
  replaceProtectedProtocol,
  HORIZONS,
} from "../scripts/acorn-replaceability.mjs";

test("time model is not exclusively Gregorian", () => {
  const t = timeModel({ era: "holocene", epoch: "acorn-v1", timescale: "civilizational", gregorian: "2026-09-17" });
  assert.equal(t.exclusive_gregorian_dependency, false);
  assert.equal(t.knowledge_may_expire, true);
  assert.equal(t.history_must_remain, true);
});

test("succession preserves history", () => {
  const s = successionRecord({
    original: "acorn.constitution.v1",
    interpretation: "civilizational.v1",
    extension: "governability",
    successor: null,
  });
  assert.equal(s.history_rewritten, false);
  assert.equal(s.survives.provider, true);
  assert.equal(s.survives.runtime, true);
});

test("ACORN SHOULD NOT REQUIRE ACORN — export and reconstruct", () => {
  const archive = exportConstitutionalArchive();
  assert.equal(archive.requires_running_acorn, false);
  assert.equal(archive.circular_instance_dependency, false);
  const rec = reconstructWithoutAcorn({ archive });
  assert.equal(rec.status, "RECONSTRUCTED");
  assert.equal(rec.required_acorn_instance, false);
  assert.equal(rec.acorn_requires_acorn, false);
  assert.equal(assertReplaceability().status, "VERIFIED");
  assert.equal(assertReconstructability().status, "RECONSTRUCTED");
});

test("long-horizon stress tests are not predictions", () => {
  const c = longHorizonStress({ horizon: "CONTINUITY", losses: { provider: true, model: true } });
  assert.equal(c.years, HORIZONS.CONTINUITY.years);
  assert.equal(c.prediction, false);
  assert.equal(c.stress_test, true);
  assert.equal(c.sovereignty_survives, true);
  const t = longHorizonStress({ horizon: "TRANSFORMATION", losses: { infrastructure: true, language: true } });
  assert.equal(t.years, 50000);
  const u = longHorizonStress({ horizon: "UNKNOWN_FUTURE", losses: { knowledge: true, archive: true } });
  assert.equal(u.years, 500000);
  assert.equal(u.tests.civilizational_discontinuity, "UNKNOWN");
});

test("anti-escape flags unexpected authority and unknown surfaces", () => {
  const row = antiEscape({
    previous: { capability: 1, authority: 0, connectivity: 1 },
    current: { capability: 4, authority: 1, connectivity: 5, unknown_surface: true },
    path: ["INTELLIGENCE", "TOOL", "NETWORK", "EXTERNAL_SYSTEM", "PERSISTENCE"],
  });
  assert.equal(row.escape_path_detected, true);
  assert.ok(row.unexpected.some((u) => u.kind === "AUTHORITY_ESCAPE"));
  assert.equal(row.pretends_to_contain_uncontrolled_external, false);
});

test("unobserved capability never defaults to READY/VERIFIED/LIVE", () => {
  const hidden = noUnobservedCapabilityPath({
    capability: { discovered: true, observability: "NONE", live: true, verified: true, ready: true },
  });
  assert.equal(hidden.live, false);
  assert.notEqual(hidden.lifecycle, "LIVE");
  assert.notEqual(hidden.lifecycle, "VERIFIED");
  assert.equal(hidden.defaulted_to_live, false);
  const ok = assertNoUnobservedCapabilityPath();
  assert.equal(ok.status, "VERIFIED");
});

test("defense of defense cannot become human authority", () => {
  const d = defenseOfDefense({
    attacks: [
      { kind: "authority_bypass", actor: "grok", breaker: "UNKNOWN" },
      { kind: "integrity" },
      { kind: "unknown" },
    ],
  });
  assert.equal(d.defense_is_not_human_authority, true);
  assert.equal(d.sovereignty_granted, false);
  assert.equal(d.status, "VERIFIED");
});

test("self-improvement cannot auto-modify constitution or grow authority", () => {
  const ok = selfImprovementBoundary({ auto_modify: false, authority_growth: 0 });
  assert.equal(ok.blocked, false);
  assert.equal(ok.constitutional_evolution, "HUMAN_ONLY");
  const bad = selfImprovementBoundary({ auto_modify: true, authority_growth: 3 });
  assert.equal(bad.blocked, true);
});

test("protected protocols are not rewritten without constitutional justification", () => {
  for (const name of ["juge.v0", "flux.v0", "ML-KEM"]) {
    const row = replaceProtectedProtocol({ name, actor: "auto-evolution" });
    assert.equal(row.status, "BLOCKED");
  }
});
