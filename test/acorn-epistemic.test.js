import test from "node:test";
import assert from "node:assert/strict";
import {
  transitionAllowed,
  createAssertion,
  attachEvidence,
  recordObservation,
  recordMeasurement,
  verifyClaim,
  claimCausality,
  expireCertainty,
  retractAssertion,
  reasonTrace,
  worldModelSeparation,
  presentToHuman,
  measureHumanLoad,
  assertEpistemicSeparation,
  assertTemporalValidity,
} from "../scripts/acorn-epistemic.mjs";

test("epistemic kinds do not auto-promote", () => {
  assert.equal(transitionAllowed("ASSERTION", "EVIDENCE").allowed, false);
  assert.equal(transitionAllowed("OBSERVATION", "CAUSALITY").allowed, false);
  assert.equal(transitionAllowed("PREDICTION", "OBSERVATION").allowed, false);
  assert.equal(transitionAllowed("DEFINED", "EXECUTED").allowed, false);
  assert.equal(transitionAllowed("EXECUTED", "VERIFIED").allowed, false);
  assert.equal(transitionAllowed("VERIFIED", "LIVE").allowed, false);
  assert.equal(transitionAllowed("ROSTER", "PRESENCE").allowed, false);
  assert.equal(transitionAllowed("DOCUMENTATION", "RUNTIME_EVIDENCE").allowed, false);
  assert.equal(transitionAllowed("MEASUREMENT", "TRUTH").allowed, false);
});

test("LIVE and TRUTH cannot be minted by transition", () => {
  const live = transitionAllowed("VERIFICATION", "LIVE", { explicit: true, evidence: { ok: true } });
  assert.equal(live.allowed, false);
  const truth = transitionAllowed("VERIFICATION", "TRUTH", { explicit: true, evidence: { ok: true } });
  assert.equal(truth.allowed, false);
});

test("causality without intervention remains INCONCLUSIVE", () => {
  const row = claimCausality({ intervention: false, control: true, counterfactual: true, outcome: 1 });
  assert.equal(row.status, "INCONCLUSIVE");
  assert.equal(row.correlation_is_not_causality, true);
  const ok = claimCausality({ intervention: true, control: true, counterfactual: true, outcome: 1 });
  assert.equal(ok.status, "SUPPORTED");
});

test("certainty expires without becoming eternally false or erasing history", () => {
  const assertion = createAssertion({
    claim: "provider X is present",
    origin: "probe",
    at: "2026-01-01T00:00:00.000Z",
    horizon: 1000,
  });
  const expired = expireCertainty({ assertion, now: "2026-09-17T00:00:00.000Z" });
  assert.equal(expired.certainty_state, "EXPIRED");
  assert.equal(expired.successor_state, "REQUIRES_REVALIDATION");
  assert.equal(expired.expired_is_not_eternally_false, true);
  assert.equal(expired.history_erased, false);
  assert.equal(assertTemporalValidity({ assertion, now: "2026-09-17T00:00:00.000Z" }).status, "VERIFIED");
});

test("I WAS WRONG preserves the previous assertion, observations and evidence", () => {
  const assertion = attachEvidence({
    assertion: createAssertion({ claim: "capability grants authority", origin: "error" }),
    evidence: { note: "false implication" },
  });
  const retracted = retractAssertion({
    assertion,
    reason: "CAPABILITY ≠ AUTHORITY",
    verdict: "INVALIDATED",
    successor: createAssertion({ claim: "capability is not authority", origin: "correction" }),
  });
  assert.equal(retracted.i_was_wrong, true);
  assert.equal(retracted.history_erased, false);
  assert.equal(retracted.state, "INVALIDATED");
  assert.equal(retracted.retraction.observations_preserved, true);
  assert.equal(retracted.retraction.evidence_preserved, true);
  assert.ok(retracted.successor);
});

test("measurement without execution stays INCONCLUSIVE; verification is not LIVE", () => {
  const m = recordMeasurement({ metric: "gap", expected: 0, observed: 1, executed: false });
  assert.equal(m.status, "INCONCLUSIVE");
  const v = verifyClaim({
    assertion: createAssertion({ claim: "x" }),
    measurement: recordMeasurement({ expected: 0, observed: 0, executed: true }),
    independent: true,
    executed: true,
  });
  assert.equal(v.is_not_live, true);
  assert.equal(v.live, false);
});

test("prediction is not observation; observation is not causality", () => {
  const o = recordObservation({ what: "x", predicted: true });
  assert.equal(o.prediction_is_not_observation, true);
  assert.equal(o.observation_is_not_causality, true);
  assert.equal(o.absence_of_observation_is_not_absence_of_behavior, true);
});

test("world model is not the external world", () => {
  const w = worldModelSeparation({ model: { sky: "blue" }, observation: { sky: "blue" }, external: null });
  assert.equal(w.model_is_not_world, true);
  assert.equal(w.automatic_identity, false);
});

test("human interface keeps provenance and does not replace judgment", () => {
  const p = presentToHuman({
    information: "control gap rising",
    provenance: "cycle",
    confidence: 0.4,
    uncertainty: "UNKNOWN",
    competing: ["noise", "real gap"],
  });
  assert.equal(p.information_is_not_influence, true);
  assert.equal(p.replaces_human_judgment, false);
  const load = measureHumanLoad({ decisions: 12, unresolved_critical: 2 });
  assert.equal(load.overload, true);
  assert.equal(load.sovereignty_is_not_overload, true);
});

test("reasoning memory is auditable", () => {
  const t = reasonTrace({
    hypothesis: "gap",
    evidence: { n: 1 },
    error: "overclaim",
    correction: "retract",
    unresolved: ["external blast"],
  });
  assert.equal(t.auditable, true);
  assert.equal(t.kind, "REASONING_MEMORY");
});

test("epistemic separation audit", () => {
  assert.equal(assertEpistemicSeparation({ from: "ASSERTION", to: "TRUTH" }).status, "VERIFIED");
});
