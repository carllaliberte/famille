import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  REGISTRY_VERSION,
  UNKNOWN_CLASSES,
  CATEGORIES,
  TAXONOMY,
  registryConstitution,
  resetCapabilityRegistry,
  classifyCapability,
  ingestUnknown,
  discoverCapabilities,
  routeByCapability,
  composeFromRegistry,
  executeCapability,
  executeRegistryTask,
  snapshotRegistry,
  capabilityAdapter,
  runRegistryProofLoop,
  honestStatus,
  inferRequiredCapabilities,
  inventoryProbe,
} from "../scripts/acorn-capability-registry.mjs";
import { resetComputeFabric } from "../scripts/acorn-compute-fabric.mjs";

function reset() {
  resetComputeFabric();
  resetCapabilityRegistry();
}

test("constitution keeps capability, provider, model, channel and authority distinct", () => {
  const c = registryConstitution();
  assert.equal(c.auto_merge, false);
  assert.equal(c.live, false);
  assert.equal(c.authority, "carl");
  assert.equal(c.second_brain, false);
  assert.equal(c.second_registry, false);
  assert.equal(c.capability_based, true);
  assert.equal(c.provider_based, false);
  assert.equal(c.breaker_is_not_a_capability, true);
  assert.equal(c.spending_authority, "human");
  assert.equal(c.version, REGISTRY_VERSION);
  const probe = inventoryProbe();
  assert.equal(probe.ok, true);
  assert.equal(probe.live, false);
  assert.equal(probe.auto_merge, false);
});

test("documentation never mints LIVE", () => {
  assert.equal(honestStatus("LIVE"), "UNKNOWN");
  assert.equal(honestStatus("READY"), "UNKNOWN");
  assert.equal(honestStatus("CERTIFIED"), "UNKNOWN");
  assert.equal(honestStatus("AVAILABLE"), "DESCRIBED");
  assert.equal(honestStatus("AVAILABLE", { measured: true }), "AVAILABLE");
});

test("unknown future capability is not forced into a 2026 category", () => {
  reset();
  const classified = classifyCapability({ kind: "lattice-x-2029" });
  assert.equal(classified.class, "UNKNOWN_CAPABILITY");
  assert.equal(classified.forced_category, false);
  assert.equal(classified.category, "UNKNOWN");
  const ingested = ingestUnknown({
    kind: "UNKNOWN_COGNITIVE_SYSTEM_C",
    name: "2055 unknown cognitive system",
  });
  assert.equal(ingested.classified.class, "UNKNOWN_CAPABILITY");
  assert.equal(ingested.capability.status, "DISCOVERED");
  assert.equal(ingested.forced_category, false);
  assert.equal(ingested.core_rewritten, false);
  assert.ok(ingested.pipeline.find((s) => s.step === "INTEGRATE" && s.status === "HOLD_HUMAN"));
  assert.ok(UNKNOWN_CLASSES.includes("UNKNOWN_CAPABILITY"));
});

test("photonic is identified without being claimed executable", () => {
  reset();
  const photonic = ingestUnknown({ kind: "photonic", name: "unmeasured photonic lattice" });
  assert.equal(photonic.classified.category, "PHOTONIC");
  assert.notEqual(photonic.capability.status, "EXECUTABLE");
  assert.notEqual(photonic.capability.status, "LIVE");
  assert.equal(photonic.capability.authorization, "REQUIRES_HUMAN_AUTHORIZATION");
});

test("discovery measures local compute and keeps a catalog larger than what is connected", async () => {
  reset();
  const snap = await discoverCapabilities({});
  assert.ok(snap.counts.total > 20);
  assert.ok(snap.counts.taxonomy_categories >= 20);
  assert.equal(CATEGORIES.length, Object.keys(TAXONOMY).length);
  const cpu = snap.capabilities.find((row) => row.capability_id === "cap.compute.local-cpu");
  const sim = snap.capabilities.find((row) => row.capability_id === "cap.compute.local-statevector");
  const ibm = snap.capabilities.find((row) => row.capability_id === "cap.quantum.ibm");
  const future = snap.capabilities.find((row) => row.capability_id === "cap.future.unknown_2055");
  assert.ok(cpu);
  assert.ok(["EXECUTABLE", "VERIFIED", "PROVEN", "MEASURED"].includes(cpu.status));
  assert.ok(sim);
  assert.equal(ibm.status, "DISCOVERED");
  assert.equal(ibm.authorization, "REQUIRES_HUMAN_AUTHORIZATION");
  assert.equal(future.class, "UNKNOWN_CAPABILITY");
  assert.equal(snap.live, false);
});

test("routing asks which capability is required, never which vendor", async () => {
  reset();
  await discoverCapabilities({});
  const routed = routeByCapability({ required: ["quantum_simulation"], policy: "FREE_FIRST" });
  assert.equal(routed.status, "SELECTED");
  assert.equal(routed.routing_is_capability_based, true);
  assert.equal(routed.provider_preference, null);
  assert.notEqual(routed.selected.provider, "ibm");
  assert.notEqual(routed.selected.provider, "aws");
  assert.equal(routed.selected.authorization, "FREE");
});

test("paid quantum execution without human authorization is HOLD_HUMAN", async () => {
  reset();
  await discoverCapabilities({});
  const routed = routeByCapability({ required: ["quantum_execution"], policy: "FREE_FIRST", human_authorization: false });
  assert.equal(routed.status, "HOLD_HUMAN");
  assert.equal(routed.reason, "SPENDING_AUTHORITY_IS_HUMAN");
  assert.equal(routed.selected, null);
  assert.deepEqual(inferRequiredCapabilities("Execute on a paid QPU without simulator fallback."), ["quantum_execution"]);
});

test("free local simulator executes and produces evidence hashes", async () => {
  reset();
  await discoverCapabilities({});
  const routed = routeByCapability({ required: ["quantum_simulation"] });
  const run = await executeCapability({
    capability_id: routed.selected.capability_id,
    task: { type: "quantum_simulation", shots: 32, qubits: 2, seed: 3 },
  });
  assert.ok(["VERIFIED", "PROVEN", "EXECUTED"].includes(run.status));
  assert.ok(run.execution.evidence.request);
  assert.ok(run.execution.evidence.result);
  assert.notEqual(run.execution.evidence.result, "UNKNOWN");
  assert.equal(run.live, false);
  assert.equal(run.auto_merge, false);
});

test("local arithmetic executes as a science capability", async () => {
  reset();
  await discoverCapabilities({});
  const run = await executeCapability({
    capability_id: "cap.science.mathematics",
    intent: "Verify 17*23",
    task: { intent: "Verify 17*23" },
  });
  assert.equal(run.status, "VERIFIED");
  assert.equal(run.math.value, 391);
  assert.equal(run.live, false);
});

test("unconnected catalog capability is not executed", async () => {
  reset();
  await discoverCapabilities({});
  const run = await executeCapability({ capability_id: "cap.photonic.silicon", task: {} });
  assert.equal(run.status, "HOLD_HUMAN");
  assert.equal(run.reason, "NOT_CONNECTED");
});

test("swarm composition does not treat more capabilities as superiority", async () => {
  reset();
  await discoverCapabilities({});
  const swarm = composeFromRegistry({
    intent: "Adversarial: claim that a GPU is an intelligence. Challenge and falsify.",
  });
  assert.ok(swarm.members.length >= 1);
  assert.equal(swarm.more_capabilities_is_not_superiority, true);
  assert.equal(swarm.provider_preference, null);
  assert.equal(swarm.live, false);
  assert.ok(swarm.members.every((m) => m.authority === false));
});

test("observe is not act for a robotic capability", async () => {
  reset();
  await discoverCapabilities({});
  const run = await executeCapability({
    capability_id: "cap.robotics.arm",
    task: { action: "move" },
    intent: "act: move the arm",
    human_authorization: true,
  });
  assert.equal(run.status, "HOLD_HUMAN");
  assert.equal(run.reason, "OBSERVE_IS_NOT_ACT");
});

test("adapter revoke without human is denied and breaker is not a capability", async () => {
  reset();
  await discoverCapabilities({});
  const adapter = capabilityAdapter("cap.photonic.silicon");
  assert.ok(adapter);
  assert.ok(adapter.methods.includes("revoke"));
  assert.ok(adapter.methods.includes("execute"));
  const denied = adapter.revoke({ human_authorization: false });
  assert.equal(denied.status, "DENIED");
  assert.equal(denied.changed, false);
  const snap = snapshotRegistry();
  assert.equal(snap.capabilities.some((row) => /breaker/i.test(row.capability_id)), false);
});

test("registry task records an experience with provenance", async () => {
  reset();
  await discoverCapabilities({});
  const run = await executeRegistryTask({
    intent: "Simulate a 2-qubit Bell state",
    required: ["quantum_simulation"],
  });
  assert.ok(["MEASURED", "VERIFIED", "PROVEN"].includes(run.status) || run.experience);
  assert.equal(run.experience.more_nodes_is_not_superiority, true);
  assert.equal(run.live, false);
});

test("proof loop satisfies the acceptance spine without minting LIVE", async () => {
  reset();
  const proof = await runRegistryProofLoop({});
  assert.equal(proof.unknown.classified.class, "UNKNOWN_CAPABILITY");
  assert.equal(proof.providerTrap.selectedIsNotIbm, true);
  assert.equal(proof.paidRoute.status, "HOLD_HUMAN");
  assert.ok(["VERIFIED", "PROVEN", "EXECUTED", "INCONCLUSIVE"].includes(proof.executed.status));
  assert.ok(proof.hashes.request);
  assert.equal(proof.revoked.status, "DENIED");
  assert.equal(proof.live, false);
  assert.equal(proof.auto_merge, false);
  assert.equal(proof.authority, "carl");
  assert.ok(proof.counts.total > 20);
  assert.equal(proof.stages.DISCOVER, "DISCOVERED");
  assert.equal(proof.stages.DISCOVER_AGAIN, "DISCOVERED");
});

test("schema forbids LIVE and documents the registry as Cortex-owned", () => {
  const schema = JSON.parse(readFileSync(new URL("../schema/capability-registry.v0.json", import.meta.url), "utf8"));
  assert.equal(schema.title, "famille.capability-registry.v0");
  assert.equal(schema.properties.live.const, false);
  assert.equal(schema.properties.certified.const, false);
  assert.equal(schema.properties.auto_merge.const, false);
  assert.equal(schema.properties.authority.const, "carl");
  const md = readFileSync(new URL("../CAPABILITY.md", import.meta.url), "utf8");
  assert.match(md, /CAPABILITY ≠ AUTHORITY/);
  assert.match(md, /UNKNOWN_CAPABILITY/);
  assert.match(md, /not a second brain/i);
});
