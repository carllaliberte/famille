import test from "node:test";
import assert from "node:assert/strict";
import {
  createActivationRequest,
  recordActivationObservation,
  buildWorldSignal,
  routeActivation,
  buildActivationSnapshot,
  assertActivationConstitution
} from "../scripts/acorn-live-world-activation-fabric.mjs";

test("activation stays unobserved until evidence arrives", () => {
  const r = createActivationRequest({connector_id:"github", capability:"read_repository"});
  assert.equal(r.state, "UNOBSERVED");
  assert.equal(r.authority, false);
});

test("physical observation without full verification is not LIVE", () => {
  const r = createActivationRequest({connector_id:"calendar"});
  const o = recordActivationObservation(r, {observed:true, physically_observed:true, authenticated:false, usable:true, evidence:[{kind:"probe",at:"2026-09-19T00:00:00Z"}]});
  assert.equal(o.state, "CONNECTED");
  assert.equal(o.live, false);
});

test("dated physical authenticated usable evidence produces LIVE_VERIFIED", () => {
  const r = createActivationRequest({connector_id:"gmail", capability:"read_mail"});
  const o = recordActivationObservation(r, {physically_observed:true, authenticated:true, usable:true, evidence:[{kind:"response",observed_at:"2026-09-19T00:00:00Z"}]});
  assert.equal(o.state, "LIVE_VERIFIED");
  assert.equal(o.live, true);
  const signal = buildWorldSignal(o);
  assert.equal(signal.live, true);
  assert.equal(signal.provenance.authenticated, true);
});

test("routing requires both activation and connectivity proof", () => {
  const r = createActivationRequest({connector_id:"drive"});
  const o = recordActivationObservation(r, {physically_observed:true, authenticated:true, usable:true, evidence:[{kind:"response"}]});
  assert.equal(routeActivation(o, {connectivity:{state:"CONNECTED",live:true}}).ok, false);
  assert.equal(routeActivation(o, {connectivity:{state:"LIVE_VERIFIED",live:true}, nervous:{signal_id:"s1"}}).ok, true);
});

test("snapshot exposes gaps rather than inventing readiness", () => {
  const s = buildActivationSnapshot([{connector_id:"x",state:"LIVE_VERIFIED",live:true},{connector_id:"y",state:"DEGRADED",live:false,capability:"read"}]);
  assert.equal(s.live_verified_count, 1);
  assert.equal(s.gaps.length, 1);
});

test("constitution blocks authority and bypass", () => {
  assert.equal(assertActivationConstitution({authority:true}).valid, false);
  assert.equal(assertActivationConstitution({bypass_connectivity:true}).valid, false);
  assert.equal(assertActivationConstitution({}).valid, true);
});
