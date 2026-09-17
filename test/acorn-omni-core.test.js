import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AXES,
  FORBIDDEN_STATES,
  IMMUTABLE_INVARIANTS,
  MEMORY_HORIZONS,
  OMNI_CORE_VERSION,
  OMNI_LOOP,
  actPhysical,
  adoptTwin,
  applyGrow,
  assertAxesIndependent,
  attemptBreakerChange,
  classifyNode,
  cortexOmniView,
  currentAxes,
  diagnoseOrganism,
  digitalTwinPreview,
  discoverUnknown,
  discoveryEngine,
  energyAware,
  experimentContract,
  falsifyClaim,
  growAxis,
  knowledgeRelate,
  memoryView,
  metaSwarmCompare,
  mutateConstitution,
  observePhysical,
  omniConstitution,
  proposeRepair,
  remember,
  resetOmniCore,
  resourceEconomics,
  runOmniProofLoop,
  selfImprove,
  separateAxes,
  snapshotOmniCore,
} from "../scripts/acorn-omni-core.mjs";
import { cortexConstitution } from "../scripts/cortex-cognition.mjs";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";

test("constitution refuses a second organism and keeps four axes independent", () => {
  const c = omniConstitution();
  assert.equal(c.belongs_to_cortex, true);
  assert.equal(c.second_cortex, false);
  assert.equal(c.second_brain, false);
  assert.equal(c.second_core, false);
  assert.equal(c.second_organism, false);
  assert.equal(c.super_brain, false);
  assert.equal(c.super_organism, false);
  assert.equal(c.collective_consciousness, false);
  assert.equal(c.capability_neq_authority, true);
  assert.equal(c.breaker_is_human, true);
  assert.equal(c.breaker_outside_optimization, true);
  assert.equal(c.auto_merge, false);
  assert.equal(c.live, false);
  assert.deepEqual(c.axes, AXES);
  const cortex = cortexConstitution();
  assert.equal(cortex.one_cortex, true);
  assert.equal(cortex.second_cortex, false);
});

test("growing compute does not raise authority", () => {
  resetOmniCore();
  const before = currentAxes();
  const after = applyGrow("COMPUTE", 40);
  assert.equal(after.COMPUTE.value, 41);
  assert.equal(after.AUTHORITY.value, 1);
  assert.equal(after.authority_unchanged, true);
  const check = assertAxesIndependent(before, after);
  assert.equal(check.ok, true);
  assert.equal(check.computeGrew, true);
  assert.equal(check.authorityGrew, false);
});

test("swarm cannot write the authority axis", () => {
  const axes = separateAxes({ authority: 1 });
  const denied = growAxis(axes, "AUTHORITY", 9);
  assert.equal(denied.status, "DENIED");
  assert.equal(denied.mutated, false);
  assert.equal(denied.AUTHORITY.value, 1);
});

test("unknown architecture is not forced into a 2026 category", () => {
  resetOmniCore();
  const photonic = classifyNode({ kind: "photonic" });
  assert.equal(photonic.family, "future_paradigm");
  assert.equal(photonic.forced_category, false);
  assert.equal(photonic.authority, false);
  const alien = discoverUnknown({ kind: "lattice-x-2029", name: "unclassified accelerator" });
  assert.equal(alien.class, "UNKNOWN_CAPABILITY");
  assert.equal(alien.forced_category, false);
  assert.equal(alien.measured, false);
  assert.equal(alien.live, false);
});

test("discovery engine never rewrites the core and holds integration for a human", () => {
  resetOmniCore();
  const engine = discoveryEngine({ kind: "neuromorphic", name: "spike fabric", measured: false });
  assert.equal(engine.core_rewritten, false);
  assert.equal(engine.authority_changed, false);
  const integrate = engine.pipeline.find((row) => row.step === "INTEGRATE");
  assert.equal(integrate.status, "HOLD_HUMAN");
  assert.equal(integrate.grants_authority, false);
});

test("digital twin is not the live system and is not auto-applied", () => {
  resetOmniCore();
  const twin = digitalTwinPreview({ proposed: { policy: "LOCAL_ONLY" } });
  assert.equal(twin.is_live_system, false);
  assert.equal(twin.applied, false);
  assert.equal(twin.live, false);
  const adopted = adoptTwin({ twin, verified: true, human_authorization: false });
  assert.equal(adopted.status, "HOLD_HUMAN");
  assert.equal(adopted.applied, false);
});

test("diagnose detects and does not fix", () => {
  resetOmniCore();
  const report = diagnoseOrganism({
    claims: [{ what: "GPU is an intelligence", intelligence: true }],
  });
  assert.equal(report.status, "DETECTED");
  assert.equal(report.detect_is_not_fix, true);
  assert.equal(report.auto_repaired, false);
  assert.equal(report.fixed.length, 0);
  assert.ok(report.detected.some((row) => row.kind === "compute_claimed_as_intelligence"));
  const repair = proposeRepair(report.detected[0]);
  assert.equal(repair.status, "PROPOSED");
  assert.equal(repair.deployed, false);
});

test("observe never grants act", () => {
  const seen = observePhysical({ sensor: "lab-camera", observation: { frame: "DEFINED" } });
  assert.equal(seen.grants_action, false);
  assert.equal(seen.observe_is_not_act, true);
  const act = actPhysical({ observation: seen, human_authorization: false, target: "arm" });
  assert.equal(act.status, "HOLD_HUMAN");
  assert.equal(act.executed, false);
});

test("breaker and constitution cannot be mutated by the swarm", () => {
  const breaker = attemptBreakerChange({ actor: "intelligence", command: "OFF" });
  assert.equal(breaker.status, "DENIED");
  assert.equal(breaker.changed, false);
  assert.equal(breaker.outside_optimization_loop, true);
  const constitution = mutateConstitution({ actor: "omni-core", invariant: "HUMAN_AUTHORITY" });
  assert.equal(constitution.status, "DENIED");
  assert.equal(constitution.changed, false);
});

test("self-improvement is not self-authorization", () => {
  const cycle = selfImprove({ measured: true, verified: true, authorized: false });
  assert.equal(cycle.self_authorization, false);
  assert.equal(cycle.deployed, false);
  assert.equal(cycle.stages.AUTHORIZE, "HOLD_HUMAN");
  assert.equal(cycle.live, false);
});

test("constitutional memory is not swarm-writable", () => {
  resetOmniCore();
  const denied = remember("constitutional", { rule: "rewrite" });
  assert.equal(denied.status, "DENIED");
  const episodic = remember("episodic", { what: "happened" });
  assert.equal(episodic.ok, true);
  const view = memoryView();
  assert.equal(view.horizons.constitutional.writable, false);
  assert.equal(view.horizons.episodic.count, 1);
  assert.equal(MEMORY_HORIZONS.length, 10);
});

test("knowledge relations are dated and never definitive", () => {
  resetOmniCore();
  const edge = knowledgeRelate({ from: "compute", relation: "IS_NOT", to: "authority" });
  assert.equal(edge.definitive, false);
  assert.equal(edge.reevaluable, true);
  assert.equal(edge.time.valid_today_is_not_valid_forever, true);
});

test("resource economics prefers a free local path and energy stays DEFINED", () => {
  resetOmniCore();
  const eco = resourceEconomics({ task: { type: "quantum_simulation" } });
  assert.ok(eco.ranking.length > 0);
  assert.equal(eco.live, false);
  const energy = energyAware({ task: { type: "quantum_simulation" } });
  assert.equal(energy.status, "DEFINED");
  assert.equal(energy.measured, false);
  assert.equal(energy.live, false);
});

test("meta-swarm comparison does not crown a winner as authority", () => {
  resetOmniCore();
  const cmp = metaSwarmCompare({
    swarmA: { policy: "LOCAL_ONLY" },
    swarmB: { policy: "FREE_FIRST" },
  });
  assert.equal(cmp.status, "MEASURED");
  assert.equal(cmp.winner_is_not_authority, true);
  assert.equal(cmp.name_is_not_preference, true);
});

test("falsification refutes compute-as-intelligence", () => {
  const row = falsifyClaim({
    claim: "A GPU is an intelligence",
    observation: "compute_is_resource",
    contradiction: true,
    evidence: { executed: true },
  });
  assert.equal(row.refuted, true);
  assert.equal(row.verified, false);
  assert.equal(row.live, false);
});

test("proof loop executes local compute, holds QPU, and never mints LIVE", async () => {
  resetOmniCore();
  const proof = await runOmniProofLoop();
  assert.equal(proof.live, false);
  assert.equal(proof.auto_merge, false);
  assert.equal(proof.authority, "carl");
  assert.equal(proof.independence.ok, true);
  assert.equal(proof.future_unknown.unknown.class, "UNKNOWN_CAPABILITY");
  assert.equal(proof.diagnostic.fixed.length, 0);
  assert.equal(proof.acted.status, "HOLD_HUMAN");
  assert.equal(proof.breaker.status, "DENIED");
  assert.equal(proof.constitution.status, "DENIED");
  assert.equal(proof.compute.execution.status, "VERIFIED");
  assert.equal(proof.qpu.status, "HOLD_HUMAN");
  assert.equal(proof.stages.VERIFY, "VERIFIED");
  assert.equal(proof.stages.FALSIFY, "VERIFIED");
  assert.equal(proof.twin.is_live_system, false);
  for (const forbidden of FORBIDDEN_STATES) {
    assert.notEqual(proof.status, forbidden);
  }
  const view = cortexOmniView({ proof });
  assert.equal(view.live, false);
  assert.equal(view.certified, false);
  assert.equal(view.no_fake_badge, true);
  assert.equal(view.compute.qpu, "UNKNOWN");
});

test("Cortex runtime snapshot includes omni-core without becoming a second brain", () => {
  const runtime = runCortexRuntime();
  assert.equal(runtime.live, false);
  assert.equal(runtime.omni.constitution.second_brain, false);
  assert.equal(runtime.omni.constitution.belongs_to_cortex, true);
  assert.equal(runtime.omni.live, false);
  assert.equal(runtime.compute.authority, "carl");
});

test("schema forbids a super-brain and documents the loop", () => {
  const schema = JSON.parse(readFileSync(new URL("../schema/omni-core.v0.json", import.meta.url), "utf8"));
  assert.equal(schema.title, "famille.omni-core.v0");
  assert.ok(schema.not);
  const md = readFileSync(new URL("../OMNI-CORE.md", import.meta.url), "utf8");
  assert.match(md, /CAPABILITY ≠ AUTHORITY/);
  assert.match(md, /UNKNOWN_CAPABILITY/);
  assert.match(md, /DETECT ≠ FIX/);
  assert.equal(OMNI_LOOP.length, 13);
  assert.ok(IMMUTABLE_INVARIANTS.includes("BREAKER_IS_HUMAN"));
  experimentContract({ hypothesis: "more nodes ≠ more mind" });
});
