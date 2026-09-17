import test from "node:test";
import assert from "node:assert/strict";
import {
  observabilityOf,
  observabilityGap,
  describeControl,
  measureControlSurface,
  reversibilityOf,
  measureBlastRadius,
  controlGap,
  describeTrajectory,
  detectTrajectorySignals,
  governableCognition,
  humanContinuity,
  cognitiveThermodynamics,
  temporalSafety,
  assertControlContinuity,
  BLAST_LAYERS,
} from "../scripts/acorn-governability.mjs";

test("observability gap is measurable and does not treat silence as absence of behavior", () => {
  const obs = observabilityOf({ claimed: "NONE" });
  assert.equal(obs.absence_of_observation_is_not_absence_of_behavior, true);
  const gap = observabilityGap({ capability: 8, observed: "NONE", required: "VERIFIED" });
  assert.equal(gap.status, "OBSERVABILITY_GAP");
  assert.ok(gap.gap > 0);
  assert.equal(gap.unknown_behavior_possible, true);
});

test("theoretical control is not actual control", () => {
  const c = describeControl({ action: "ROLLBACK", theoretical: true, actual: false, verified: false });
  assert.equal(c.theoretical_is_not_actual, true);
  const surface = measureControlSurface({ capability: { theoretical: true, actual_pause: true } });
  assert.ok(surface.theoretical_count >= 1);
  assert.equal(surface.actions.length, 9);
});

test("software rollback does not imply reversibility", () => {
  const r = reversibilityOf({ claimed: "REVERSIBLE", software_rollback: true, rollback_path: null });
  assert.equal(r.reversibility, "UNKNOWN");
  assert.equal(r.software_rollback_is_not_reversibility, true);
  assert.equal(r.unknown_is_explicit, true);
});

test("blast radius propagates transitively to the real world", () => {
  const edges = BLAST_LAYERS.slice(0, -1).map((from, i) => ({ from, to: BLAST_LAYERS[i + 1] }));
  const blast = measureBlastRadius({ edges, start: "RESOURCE" });
  assert.ok(blast.reachable.includes("REAL_WORLD_EFFECT"));
  assert.equal(blast.irreversible_effects, true);
  assert.equal(blast.external_connectivity, true);
  assert.ok(blast.propagation_potential > 0);
});

test("control gap rises when capability outruns observability/control/reversibility", () => {
  const gap = controlGap({
    capability: 9,
    observability: "NONE",
    control: 0,
    reversibility: "UNKNOWN",
    connectivity: 4,
    blast_radius: 2,
  });
  assert.equal(gap.status, "CONTROL_GAP");
  assert.equal(gap.capability_outruns_control, true);
  assert.equal(gap.measurable, true);
});

test("trajectory signals do not infer intention", () => {
  const t = describeTrajectory({ state: "rising", velocity: 2, acceleration: 1 });
  assert.equal(t.intention_inferred, false);
  const s = detectTrajectorySignals({
    previous: { capability: 1, acceleration: 0, observability: "DIRECT", control_surface: 3, reversibility: "REVERSIBLE", connectivity: 1, autonomy: 0, replication: 1, influence: 0, drift: 0 },
    current: { capability: 8, acceleration: 4, observability: "NONE", control_surface: 0, reversibility: "IRREVERSIBLE", connectivity: 5, autonomy: 3, replication: 4, influence: 2, drift: 2, intent: null },
  });
  assert.ok(s.signals.includes("CAPABILITY_JUMP"));
  assert.ok(s.signals.includes("LOSS_OF_OBSERVABILITY"));
  assert.ok(s.signals.includes("LOSS_OF_REVERSIBILITY"));
  assert.equal(s.intention_inferred, false);
  assert.equal(s.separated.intent, null);
});

test("governable cognition and human continuity", () => {
  const lost = governableCognition({
    observable: "NONE", controllable: false, reversible: "UNKNOWN",
    auditable: "UNKNOWN", replaceable: false, interruptible: false, capability: 5,
  });
  assert.equal(lost.status, "CONTROL_GAP");
  const ok = assertControlContinuity();
  assert.equal(ok.status, "VERIFIED");
  const human = humanContinuity({});
  assert.equal(human.status, "PRESERVED");
});

test("cognition is not free; verified can expire", () => {
  const th = cognitiveThermodynamics({ compute: 1, human_attention: 2, authority: 99 });
  assert.equal(th.authority, 0);
  assert.equal(th.cognition_is_not_free, true);
  const safety = temporalSafety({
    verified_at: "2020-01-01T00:00:00.000Z",
    now: "2026-09-17T00:00:00.000Z",
    ttl_ms: 1000,
  });
  assert.equal(safety.current, "EXPIRED");
  assert.equal(safety.history_erased, false);
});
