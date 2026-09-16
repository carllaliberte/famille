import test from "node:test";
import assert from "node:assert/strict";
import {
  cognitiveFirewall,
  compatibilityLayer,
  componentLifecycle,
  discoverFutureIntelligence,
  egress,
  eternalUnknown,
  ingress,
  intelligencePassport,
  migrate,
  replaceComponent,
  retireComponent,
  runEternalArchitecture,
  staleKnowledge,
} from "../scripts/cortex-eternal.mjs";
import { runOrganismCycle } from "../scripts/cortex-organism.mjs";

test("passport describes identity without granting authority", () => {
  const p = intelligencePassport({ id: "future-x", provider: "UNKNOWN", model: "m1", channel: "c1", capabilities: ["review"] });
  assert.equal(p.grants_authority, false);
  assert.equal(p.passport.authority, false);
  assert.equal(p.passport.identity_is_not_model, true);
  assert.equal(p.passport.live, false);
});

test("future intelligence is discovered without modifying Cortex", () => {
  const d = discoverFutureIntelligence({ id: "future-intelligence-x" });
  assert.equal(d.trusted, false);
  assert.equal(d.cortex_modified, false);
});

test("replace stays shadow until verified; old component is kept", () => {
  const cur = componentLifecycle({ id: "a0", state: "CURRENT" });
  const cand = componentLifecycle({ id: "a1", state: "CANDIDATE" });
  const shadow = replaceComponent({ current: cur, candidate: cand, compared: false, verified: false });
  assert.equal(shadow.activated, false);
  assert.equal(shadow.old_kept, true);
  const done = replaceComponent({ current: cur, candidate: cand, compared: true, verified: true });
  assert.equal(done.current.state, "DEPRECATED");
  assert.equal(done.candidate.state, "ACTIVE");
  assert.equal(retireComponent(cur).identity_of_acorn_dead, false);
});

test("migration is versioned, reversible, not destructive", () => {
  const m = migrate({ from_version: "v0", to_version: "v1", payload: { k: 1 } });
  assert.equal(m.versioned, true);
  assert.equal(m.reversible, true);
  assert.equal(m.destructive, false);
  const c = compatibilityLayer({ versions: ["v0", "v1", "v2", "v3"] });
  assert.equal(c.keep_forever, false);
  assert.ok(c.versions.length <= 3);
});

test("claimed Acorn answer on an unconnected channel is bypass, not success", () => {
  const bad = ingress({ source: "external", channel: "mystery", connected: false, claimed_acorn: true });
  assert.equal(bad.bypass, true);
  assert.equal(bad.kind, "CHANNEL_BYPASS");
  assert.equal(bad.success, false);
  const out = egress({ observation: { text: "hi" }, verified: false });
  assert.equal(out.untrusted, true);
  assert.equal(out.presented_as_acorn_truth, false);
});

test("firewall treats external output as untrusted; live claim is quarantined", () => {
  const wall = cognitiveFirewall({ output: { live: true }, claim_authority: true });
  assert.equal(wall.untrusted_observation, true);
  assert.equal(wall.quarantined, true);
  assert.ok(wall.findings.some((row) => row.kind === "fake_live"));
});

test("expired knowledge becomes STALE, not automatically false", () => {
  const s = staleKnowledge({ expires_at: "2020-01-01T00:00:00.000Z", verified_at: "2019-01-01T00:00:00.000Z" }, { now: "2026-09-16T23:00:00.000Z" });
  assert.equal(s.state, "STALE");
  assert.equal(s.automatically_false, false);
});

test("unknown stays unknown — not success, not failure", () => {
  const u = eternalUnknown({});
  assert.equal(u.unknown_is_success, false);
  assert.equal(u.unknown_is_failure, false);
  assert.equal(u.intelligence.trusted, false);
  assert.equal(u.protocol.trusted, false);
});

test("eternal architecture is one Cortex, zero-cost, no LIVE", () => {
  const run = runEternalArchitecture({
    workerEvidence: { v: "cognitive-worker.v14" },
    claimed_acorn: true,
    skipContinuity: true,
  });
  assert.equal(run.gates.second_cortex, false);
  assert.equal(run.gates.second_fabric, false);
  assert.equal(run.gates.merge, false);
  assert.equal(run.gates.bypass_is_success, false);
  assert.equal(run.implementation_may_die, true);
  assert.equal(run.contract_remains, true);
  assert.equal(run.live, false);
  const organism = runOrganismCycle({
    workerEvidence: { v: "cognitive-worker.v14" },
    agents: [{ id: "worker", capabilities: ["review"] }],
    fluidity: { state: "FLOWING", property: { silent_stop: false } },
  });
  assert.equal(organism.live, false);
  assert.equal(organism.auto_merge, false);
});
