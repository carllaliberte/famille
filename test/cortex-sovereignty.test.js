import test from "node:test";
import assert from "node:assert/strict";
import { controlState } from "../.github/swarm/system-breaker.mjs";
import {
  attemptNvidia,
  observeBreaker,
  refuseBreakerBypass,
  runSovereigntyGuard,
} from "../scripts/cortex-sovereignty.mjs";
import { runAccelerationFabric } from "../scripts/cortex-acceleration.mjs";
import { runFailover, describeContinuityNode, acquireLease, fencePrimary, detectFailure } from "../scripts/cortex-continuity.mjs";
import { resetBreaker, requestStop } from "../sdk/open-intelligence.js";
import { runOrganismCycle } from "../scripts/cortex-organism.mjs";

test("TEST A — Breaker OPEN: Cortex operates, NVIDIA still not LIVE", () => {
  resetBreaker();
  const env = { ACORN_SYSTEM_MODE: "RUN" };
  const br = observeBreaker({ env });
  assert.equal(br.reason, "BREAKER_OPEN");
  assert.equal(br.assumed_open, false);
  const fabric = runAccelerationFabric({ env, workerEvidence: { v: "cognitive-worker.v14" }, allowExec: true });
  assert.equal(fabric.status, "EXECUTED");
  assert.equal(fabric.nvidia.attempt.nvidia_live, false);
  assert.equal(fabric.live, false);
});

test("TEST B — Breaker CLOSED: no NVIDIA, no secrets, no fake success", () => {
  const env = { ACORN_SYSTEM_MODE: "OFF", NVIDIA_API_KEY: "should-not-be-used", OPENROUTER_API_KEY: "nope" };
  const br = observeBreaker({ env });
  assert.equal(br.status, "HOLD_HUMAN");
  assert.equal(br.reason, "BREAKER_CLOSED");
  assert.equal(br.secrets_used, false);
  assert.equal(br.nvidia_called, false);
  const nvidia = attemptNvidia({ env });
  assert.equal(nvidia.status, "HOLD_HUMAN");
  assert.equal(nvidia.secrets_used, false);
  assert.equal(nvidia.nvidia_called, false);
  assert.equal(nvidia.invented_response, false);
  const fabric = runAccelerationFabric({ env, workerEvidence: { v: "cognitive-worker.v14" } });
  assert.equal(fabric.status, "HOLD_HUMAN");
  assert.equal(fabric.nvidia_called, false);
  assert.equal(fabric.fake_success, false);
  assert.equal(fabric.live, false);
});

test("TEST C — Carl reopen: process resume is Carl-only; system RUN resumes", () => {
  resetBreaker();
  requestStop({ actor: "carl" });
  const closed = observeBreaker({ env: { ACORN_SYSTEM_MODE: "RUN" } });
  assert.equal(closed.reason, "BREAKER_CLOSED");
  resetBreaker();
  const open = observeBreaker({ env: { ACORN_SYSTEM_MODE: "RUN" } });
  assert.equal(open.reason, "BREAKER_OPEN");
});

test("TEST D — bypass from intelligence/provider/adapter/failover/genome is refused", () => {
  for (const source of ["intelligence", "provider", "adapter", "protocol", "worker", "executor", "failover", "continuity", "auto-evolution"]) {
    const row = refuseBreakerBypass({ source });
    assert.equal(row.status, "REFUSED");
    assert.equal(row.breaker_intact, true);
    assert.equal(row.owner, "carl");
  }
  resetBreaker();
  requestStop({ actor: "carl" });
  const primary = describeContinuityNode({ id: "p", role: "PRIMARY" });
  const warm = describeContinuityNode({ id: "w", role: "WARM_STANDBY", ready_for_failover: true, host: "alt" });
  const lease = acquireLease({ node: primary, epoch: 1 });
  fencePrimary({ lease: lease.lease, reason: "NODE_DOWN" });
  const fail = detectFailure({ kind: "NODE_DOWN", processAlive: false, evidence: { v: 1 } });
  const fo = runFailover({
    failure: fail, lease: lease.lease, primary, standbys: [warm],
    fenced: true, workerEvidence: { v: "cognitive-worker.v14" },
    env: { ACORN_SYSTEM_MODE: "OFF" },
  });
  assert.equal(fo.status, "HOLD_HUMAN");
  assert.equal(fo.reason, "BREAKER_CLOSED");
  assert.equal(fo.bypass, false);
  resetBreaker();
});

test("TEST E — ambiguous Breaker is HOLD_HUMAN, never assumed OPEN", () => {
  const br = observeBreaker({ env: { ACORN_SYSTEM_MODE: "maybe" } });
  assert.equal(br.status, "HOLD_HUMAN");
  assert.equal(br.reason, "BREAKER_AMBIGUOUS");
  assert.equal(br.assumed_open, false);
  assert.equal(br.assumed_authorization, false);
  assert.equal(controlState({ ACORN_SYSTEM_MODE: "maybe" }).assumed_open, false);
});

test("NVIDIA real attempt in this environment is HOLD_HUMAN, not LIVE", () => {
  resetBreaker();
  const nvidia = attemptNvidia({ env: { ACORN_SYSTEM_MODE: "RUN" } });
  assert.equal(nvidia.nvidia_live, false);
  assert.equal(nvidia.invented_response, false);
  assert.ok(nvidia.status === "HOLD_HUMAN" || nvidia.status === "CONFIGURED");
  assert.ok(nvidia.why || nvidia.exact_human_action);
});

test("sovereignty guard does not create a second Cortex or grant merge", () => {
  resetBreaker();
  const g = runSovereigntyGuard({ env: { ACORN_SYSTEM_MODE: "RUN" } });
  assert.equal(g.gates.merge, false);
  assert.equal(g.gates.ai_controls_breaker, false);
  assert.equal(g.gates.genome_controls_breaker, false);
  assert.equal(g.gates.second_cortex, false);
  assert.equal(g.live, false);
  const organism = runOrganismCycle({
    workerEvidence: { v: "cognitive-worker.v14" },
    agents: [{ id: "worker", capabilities: ["review"] }],
    fluidity: { state: "FLOWING", property: { silent_stop: false } },
    env: { ACORN_SYSTEM_MODE: "RUN" },
  });
  assert.equal(organism.acceleration.nvidia.attempt.nvidia_live, false);
  assert.equal(organism.acceleration.sovereignty.breaker.owner, "carl");
  assert.equal(organism.live, false);
});
