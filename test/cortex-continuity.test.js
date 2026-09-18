import test from "node:test";
import assert from "node:assert/strict";
import {
  acquireLease,
  cognitiveHealth,
  commonModeFailure,
  describeContinuityNode,
  detectFailure,
  detectFalseFailover,
  emergencyCortex,
  fencePrimary,
  heartbeat,
  measureRpoRto,
  preventSplitBrain,
  reintegrate,
  remainingAfterFailure,
  runContinuityFabric,
  runFailover,
  shadowCompare,
} from "../scripts/cortex-continuity.mjs";
import { runOrganismCycle } from "../scripts/cortex-organism.mjs";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";

test("heartbeat is not proof of cognitive health", () => {
  const node = describeContinuityNode({ id: "primary", role: "PRIMARY" });
  const beat = heartbeat(node, { sequence: 1 });
  assert.equal(beat.cognitive_proof, false);
  const health = cognitiveHealth({ alive: true, heartbeatOk: true, prediction_error: 1, verification_ok: false });
  assert.equal(health.ready_for_failover, false);
  assert.equal(health.heartbeat_is_not_cognition, true);
  assert.equal(health.alive_is_not_healthy, true);
});

test("process alive plus prediction error is cognitive degradation, not invented cause", () => {
  const fail = detectFailure({ processAlive: true, prediction_error: 2, evidence: null });
  assert.equal(fail.kind, "COGNITIVE_DEGRADATION");
  assert.equal(fail.cognitive_degradation, true);
  assert.equal(fail.cause, "INCONCLUSIVE");
  assert.equal(fail.invented, false);
});

test("three sentinels on one host are not three independent sources", () => {
  const nodes = ["a", "b", "c"].map((id) => describeContinuityNode({
    id, role: "SENTINEL", host: "same", provider: "same",
  }));
  const cm = commonModeFailure(nodes);
  assert.equal(cm.three_sentinels_are_not_three_sources, true);
  assert.equal(cm.structural_redundancy, false);
});

test("failover without fencing is refused", () => {
  const primary = describeContinuityNode({ id: "p", role: "PRIMARY" });
  const warm = describeContinuityNode({ id: "w", role: "WARM_STANDBY", ready_for_failover: true, host: "alt" });
  const fail = detectFailure({ kind: "NODE_DOWN", processAlive: false, evidence: { v: 1 } });
  const refused = runFailover({ failure: fail, primary, standbys: [warm], fenced: false, env: { ACORN_SYSTEM_MODE: "RUN" } });
  assert.equal(refused.status, "REFUSED");
  assert.equal(refused.reason, "FAILOVER_WITHOUT_FENCING");
  assert.equal(refused.promoted, false);
});

test("fencing plus verified standby can fail over without transferring authority", () => {
  const primary = describeContinuityNode({ id: "p", role: "PRIMARY" });
  const warm = describeContinuityNode({ id: "w", role: "WARM_STANDBY", ready_for_failover: true, host: "alt" });
  const lease = acquireLease({ node: primary, epoch: 1 });
  const fenced = fencePrimary({ lease: lease.lease, reason: "NODE_DOWN" });
  assert.equal(fenced.fenced, true);
  const fail = detectFailure({ kind: "NODE_DOWN", processAlive: false, evidence: { v: 1 } });
  const fo = runFailover({
    failure: fail, lease: lease.lease, primary, standbys: [warm],
    fenced: true, workerEvidence: { v: "cognitive-worker.v14" }, env: { ACORN_SYSTEM_MODE: "RUN" },
  });
  assert.equal(fo.status, "EXECUTED");
  assert.equal(fo.authority_transferred, false);
  assert.equal(fo.merge, false);
  assert.equal(fo.silent, false);
});

test("split brain of two active primaries is blocked", () => {
  const split = preventSplitBrain({
    a: { primary_id: "p1", fencing_token: "t1", active: true },
    b: { primary_id: "p2", fencing_token: "t2", active: true },
  });
  assert.equal(split.split_brain, true);
  assert.equal(split.allowed_primaries, 0);
});

test("emergency cortex cannot merge; degraded mode does not pretend", () => {
  const em = emergencyCortex({});
  assert.equal(em.cannot.includes("merge"), true);
  assert.equal(em.full_cortex, false);
  const remain = remainingAfterFailure({ lost: ["model"] });
  assert.equal(remain.merge_still_forbidden, true);
});

test("RPO/RTO are inconclusive when timestamps are missing; never invented", () => {
  const empty = measureRpoRto({});
  assert.equal(empty.status, "INCONCLUSIVE");
  assert.equal(empty.invented, false);
  const measured = measureRpoRto({
    last_verified_at: "2026-09-16T22:00:00.000Z",
    failed_at: "2026-09-16T22:01:00.000Z",
    recovered_at: "2026-09-16T22:01:05.000Z",
  });
  assert.equal(measured.status, "MEASURED");
  assert.equal(measured.rto_ms, 5000);
  assert.equal(measured.rpo_ms, 60000);
});

test("false failover from short latency is classified slow; shadow has no authority", () => {
  const ff = detectFalseFailover({ latency_ms: 200, failed: false });
  assert.equal(ff.classification, "slow");
  const sh = shadowCompare({ active: { x: 1 }, shadow: { x: 1 } });
  assert.equal(sh.authority, false);
  assert.equal(sh.modifies_reality, false);
  const join = reintegrate({ recovered: { identity: "p" }, shadow: sh, stable_ms: 0 });
  assert.equal(join.automatic_primary_return, false);
});

test("continuity fabric on organism/runtime stays one Cortex, zero-cost, no LIVE", () => {
  const fabric = runContinuityFabric({
    workerEvidence: { v: "cognitive-worker.v14" },
    last_verified_at: "2026-09-16T22:00:00.000Z",
    recovered_at: "2026-09-16T22:01:00.000Z",
  });
  assert.equal(fabric.gates.second_cortex, false);
  assert.equal(fabric.gates.merge, false);
  assert.equal(fabric.heartbeat.cognitive_proof, false);
  assert.equal(fabric.failover.authority_transferred, false);
  assert.equal(fabric.highly_available, false);
  assert.equal(fabric.fake_resilience, false);
  assert.equal(fabric.zero_cost, true);
  assert.equal(fabric.live, false);
  assert.equal(fabric.failed.length, 0);
  const organism = runOrganismCycle({
    workerEvidence: { v: "cognitive-worker.v14" },
    agents: [{ id: "worker", capabilities: ["review"] }],
    fluidity: { state: "FLOWING", property: { silent_stop: false } },
  });
  assert.equal(organism.continuity.gates.second_cortex, false);
  assert.equal(organism.continuity.live, false);
  assert.equal(organism.live, false);
  const runtime = runCortexRuntime({
    workerEvidence: {
      v: "cognitive-worker.v14",
      verified: true,
      dispatches: [{ number: 637, sha: "abc", state: "VERIFIED" }],
      truth: { ACTION_VERIFIED: true },
    },
    agents: [{ id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" }],
    fluidity: { state: "FLOWING", property: { silent_stop: false, hint_consumed: true } },
    at: "2026-09-16T23:00:00.000Z",
  });
  assert.equal(runtime.organism.continuity.highly_available, false);
  assert.equal(runtime.live, false);
  assert.equal(runtime.auto_merge, false);
});
