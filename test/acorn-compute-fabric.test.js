import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  COMPUTE_FABRIC_VERSION,
  COMPUTE_STATES,
  SIMULATOR_LADDER,
  UNKNOWN,
  assertHonestResource,
  computeConstitution,
  cortexComputeView,
  discoverCompute,
  executeComputeTask,
  getComputeAdapter,
  isStaleResource,
  listComputeAdapters,
  makeComputeExecution,
  registerComputeAdapter,
  resetComputeFabric,
  routeComputeTask,
  runComputeProofLoop,
  snapshotComputeFabric,
} from "../scripts/acorn-compute-fabric.mjs";
import {
  FORBIDDEN_UNPROVEN,
  makeResource,
  localAdapter,
  refuseMagicClaim,
  simulateCircuit,
} from "../scripts/compute-provider-adapters.mjs";
import { cortexConstitution } from "../scripts/cortex-cognition.mjs";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";

function futureDeviceFetch() {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      devices: [
        {
          deviceArn: "arn:aws:braket:us-east-1::device/qpu/newco/future-lattice",
          providerName: "NewCo",
          deviceType: "QPU",
          status: "ONLINE",
          deviceCapabilities: { paradigm: { qubitCount: 11, architecture: "neutral_atom" } },
          estimated_cost: 12,
          currency: "USD",
          billing_unit: "shot",
        },
        {
          deviceArn: "arn:aws:braket:us-west-1::device/quantum-simulator/amazon/sv1",
          providerName: "Amazon",
          deviceType: "SIMULATOR",
          status: "ONLINE",
          deviceCapabilities: { paradigm: { qubitCount: 34 } },
          estimated_cost: 0,
        },
      ],
    }),
  });
}

function ibmFetch() {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      backends: [
        { name: "ibm_future_osprey", status: "active", n_qubits: 133, basis_gates: ["cx", "sx", "rz"] },
      ],
    }),
  });
}

test("constitution refuses a second brain and keeps compute as a resource", () => {
  const c = computeConstitution();
  assert.equal(c.belongs_to_cortex, true);
  assert.equal(c.second_cortex, false);
  assert.equal(c.second_brain, false);
  assert.equal(c.second_mesh, false);
  assert.equal(c.compute_is_not_intelligence, true);
  assert.equal(c.qpu_is_not_intelligence, true);
  assert.equal(c.gpu_is_not_intelligence, true);
  assert.equal(c.provider_is_not_intelligence, true);
  assert.equal(c.closed_provider_allowlist, false);
  assert.equal(c.auto_merge, false);
  assert.equal(c.live, false);
  assert.equal(c.authority, "carl");
  const cortex = cortexConstitution();
  assert.equal(cortex.compute_is_resource, true);
  assert.equal(cortex.qpu_is_not_intelligence, true);
  assert.ok(COMPUTE_STATES.includes("DEFINED"));
  assert.ok(COMPUTE_STATES.includes("HOLD_HUMAN"));
  assert.ok(!COMPUTE_STATES.includes("LIVE"));
});

test("provider discovery lists adapters without treating them as intelligence", () => {
  resetComputeFabric();
  const adapters = listComputeAdapters();
  assert.ok(adapters.some((a) => a.provider_id === "braket"));
  assert.ok(adapters.some((a) => a.provider_id === "ibm"));
  assert.ok(adapters.some((a) => a.provider_id === "cudaq"));
  assert.ok(adapters.some((a) => a.provider_id === "local"));
  assert.ok(adapters.every((a) => a.intelligence === false && a.authority === false));
});

test("resource discovery measures local CPU and simulator; GPU stays honest", async () => {
  resetComputeFabric();
  const found = await discoverCompute({ env: {}, now: "2026-09-17T18:00:00.000Z" });
  const cpu = found.resources.find((r) => r.resource_id === "local-cpu");
  const sim = found.resources.find((r) => r.resource_id === "local-statevector");
  const gpu = found.resources.find((r) => r.resource_id === "local-gpu");
  assert.equal(cpu.compute_type, "cpu");
  assert.equal(cpu.state, "EXECUTABLE");
  assert.notEqual(cpu.cpu_count, UNKNOWN);
  assert.equal(sim.compute_type, "simulator");
  assert.equal(sim.cost.estimated_cost, 0);
  assert.ok(["DEFINED", "DISCOVERED"].includes(gpu.state));
  assert.equal(gpu.availability, UNKNOWN);
  assert.equal(found.closed_list, false);
  assert.equal(found.live, false);
});

test("capability discovery is not a closed vendor allowlist", async () => {
  resetComputeFabric();
  const found = await discoverCompute({
    env: { AWS_ACCESS_KEY_ID: "AKIAEXAMPLETESTKEY", AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" },
    fetchImpl: futureDeviceFetch(),
    now: "2026-09-17T18:00:00.000Z",
  });
  const future = found.resources.find((r) => r.resource_id.includes("future-lattice"));
  assert.ok(future, "new devices must be discoverable");
  assert.equal(future.architecture, "neutral_atom");
  assert.equal(future.compute_type, "qpu");
  assert.equal(future.state, "DISCOVERED");
  assert.equal(future.live, false);
  assert.equal(future.intelligence, false);
});

test("unknown provider stays UNKNOWN, never CONNECTED", () => {
  resetComputeFabric();
  const unknown = getComputeAdapter("brand-new-vendor");
  const found = unknown.discoverSync();
  assert.equal(found.status, UNKNOWN);
  assert.equal(found.provider_connected, false);
  assert.equal(found.reason, "UNKNOWN_PROVIDER");
});

test("unavailable device is not silently executable", async () => {
  resetComputeFabric();
  const found = await discoverCompute({ env: {} });
  const executed = await executeComputeTask({
    task: { type: "quantum_simulation", required_capabilities: ["quantum_simulation"] },
    discovery: { ...found, resources: found.resources.filter((r) => r.resource_id !== "local-statevector") },
    env: {},
  });
  assert.ok(["HOLD_HUMAN", "INCONCLUSIVE"].includes(executed.status));
});

test("CPU selection routes by capability, not provider name", () => {
  resetComputeFabric();
  const routed = routeComputeTask({
    task: { required_capabilities: ["cpu"], compute_type: "cpu" },
    discovery: snapshotComputeFabric({ env: {} }),
  });
  assert.equal(routed.status, "SELECTED");
  assert.equal(routed.selected.compute_type, "cpu");
  assert.equal(routed.provider_preference, null);
  assert.equal(routed.selected.intelligence, false);
});

test("GPU selection requires a measured GPU resource", () => {
  resetComputeFabric();
  const snap = snapshotComputeFabric({
    env: {},
    gpuProbe: { present: true, gpu_count: 2, source: "test", names: ["tesla"] },
    cudaqProbe: { present: true, version: "test", source: "test" },
  });
  const gpu = snap.resources.find((r) => r.compute_type === "gpu" && r.gpu_count === 2)
    || snap.resources.find((r) => r.provider === "cudaq");
  assert.ok(gpu);
  const routed = routeComputeTask({
    task: { required_capabilities: ["gpu"], compute_type: "gpu", allow_simulator: false },
    discovery: snap,
  });
  assert.equal(routed.status, "SELECTED");
  assert.equal(routed.selected.compute_type, "gpu");
});

test("simulator is preferred over a paid QPU", async () => {
  resetComputeFabric();
  const found = await discoverCompute({
    env: { AWS_ACCESS_KEY_ID: "AKIAEXAMPLETESTKEY", AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" },
    fetchImpl: futureDeviceFetch(),
  });
  const routed = routeComputeTask({
    task: { type: "quantum_simulation", required_capabilities: ["quantum_simulation"], shots: 64 },
    discovery: found,
    policy: "FREE_FIRST",
  });
  assert.equal(routed.status, "SELECTED");
  assert.equal(routed.selected.compute_type, "simulator");
  assert.deepEqual(SIMULATOR_LADDER[0], "local_simulator");
});

test("QPU selection is capability-based and holds without human authorization when paid", async () => {
  resetComputeFabric();
  const found = await discoverCompute({
    env: { AWS_ACCESS_KEY_ID: "AKIAEXAMPLETESTKEY", AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" },
    fetchImpl: futureDeviceFetch(),
  });
  const routed = routeComputeTask({
    task: {
      type: "quantum_hardware",
      required_capabilities: ["quantum_hardware", "neutral_atom"],
      architecture: "neutral_atom",
      allow_simulator: false,
    },
    discovery: found,
    human_authorization: false,
  });
  assert.equal(routed.status, "HOLD_HUMAN");
  assert.equal(routed.reason, "PAID_QPU_REQUIRES_HUMAN");
});

test("capability mismatch does not pick a vendor by name", () => {
  resetComputeFabric();
  const routed = routeComputeTask({
    task: { architecture: "photonic", required_capabilities: ["photonic"], allow_simulator: false },
    discovery: snapshotComputeFabric({ env: {} }),
  });
  assert.notEqual(routed.status, "SELECTED");
  assert.ok(["HOLD_HUMAN", "INCONCLUSIVE"].includes(routed.status));
});

test("cost constraint prefers zero-cost local simulator", async () => {
  resetComputeFabric();
  const found = await discoverCompute({
    env: { AWS_ACCESS_KEY_ID: "AKIAEXAMPLETESTKEY", AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" },
    fetchImpl: futureDeviceFetch(),
  });
  const routed = routeComputeTask({
    task: { required_capabilities: ["quantum_simulation"], max_cost: 0 },
    discovery: found,
  });
  assert.equal(routed.status, "SELECTED");
  const selected = found.resources.find((r) => r.resource_id === routed.selected.resource_id);
  assert.equal(selected.cost.estimated_cost, 0);
});

test("latency constraint rejects a slower resource", () => {
  resetComputeFabric();
  registerComputeAdapter({
    provider_id: "slowbox",
    label: "slow",
    intelligence: false,
    authority: false,
    discoverSync() {
      return {
        status: "DISCOVERED",
        authentication_state: "PRESENT",
        provider_connected: true,
        resources: [
          makeResource({
            provider: "slowbox",
            resource_id: "slow-cpu",
            compute_type: "cpu",
            capabilities: ["cpu"],
            latency: 50_000,
            cost: { estimated_cost: 0, actual_cost: 0, currency: "USD", billing_unit: "cycle" },
            authentication_state: "PRESENT",
            state: "EXECUTABLE",
          }, { connected: true, measured: true }),
        ],
      };
    },
    async discover() { return this.discoverSync(); },
    async execute() { return { status: "EXECUTED", observed: true, measured: true, result: {} }; },
  });
  const routed = routeComputeTask({
    task: { required_capabilities: ["cpu"], compute_type: "cpu", max_latency_ms: 1, allow_simulator: false },
    discovery: snapshotComputeFabric({ env: {} }),
  });
  assert.notEqual(routed.selected?.resource_id, "slow-cpu");
});

test("execution proof carries hashes, timestamps, cost and provenance", async () => {
  resetComputeFabric();
  const executed = await executeComputeTask({
    task: { type: "quantum_simulation", required_capabilities: ["quantum_simulation"], shots: 64, seed: 9 },
    env: {},
    now: "2026-09-17T18:00:00.000Z",
  });
  assert.equal(executed.status, "VERIFIED");
  const proof = executed.execution;
  assert.ok(proof.execution_id);
  assert.equal(proof.provider, "local");
  assert.equal(proof.resource_id, "local-statevector");
  assert.match(proof.request_hash, /^[a-f0-9]{64}$/);
  assert.match(proof.task_hash, /^[a-f0-9]{64}$/);
  assert.match(proof.result_reference, /^[a-f0-9]{64}$/);
  assert.ok(proof.submitted_at);
  assert.ok(proof.started_at);
  assert.ok(proof.completed_at);
  assert.equal(proof.cost.actual_cost, 0);
  assert.equal(proof.provenance.invented, false);
  assert.equal(proof.observed, true);
  assert.equal(proof.measured, true);
  assert.equal(proof.proposed, false);
  assert.equal(proof.live, false);
});

test("observed, measured and proposed stay distinct in a hold", async () => {
  const proof = makeComputeExecution({ status: "HOLD_HUMAN", provider: "ibm", resource_id: "missing" });
  assert.equal(proof.observed, false);
  assert.equal(proof.measured, false);
  assert.equal(proof.proposed, true);
});

test("missing credentials hold human and do not fake a QPU", async () => {
  resetComputeFabric();
  const found = await discoverCompute({ env: {} });
  const braket = found.providers.find((p) => p.provider === "braket");
  const ibm = found.providers.find((p) => p.provider === "ibm");
  assert.equal(braket.status, "HOLD_HUMAN");
  assert.equal(braket.authentication_state, "MISSING");
  assert.equal(braket.provider_connected, false);
  assert.equal(braket.qpu_execution_verified, false);
  assert.equal(ibm.status, "HOLD_HUMAN");
});

test("unauthorized paid execution is HOLD_HUMAN", async () => {
  resetComputeFabric();
  const found = await discoverCompute({
    env: { AWS_ACCESS_KEY_ID: "AKIAEXAMPLETESTKEY", AWS_SECRET_ACCESS_KEY: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" },
    fetchImpl: futureDeviceFetch(),
  });
  const executed = await executeComputeTask({
    task: {
      type: "quantum_hardware",
      required_capabilities: ["quantum_hardware"],
      architecture: "neutral_atom",
      allow_simulator: false,
    },
    discovery: found,
    human_authorization: false,
  });
  assert.equal(executed.status, "HOLD_HUMAN");
  assert.ok(["PAID_QPU_REQUIRES_HUMAN", "UNAUTHORIZED_EXECUTION"].includes(executed.reason));
});

test("stale resource metadata is not executable", async () => {
  resetComputeFabric();
  const stale = makeResource({
    provider: "local",
    resource_id: "stale-sim",
    compute_type: "simulator",
    capabilities: ["quantum_simulation"],
    cost: { estimated_cost: 0, actual_cost: 0, currency: "USD", billing_unit: "shot" },
    authentication_state: "PRESENT",
    state: "EXECUTABLE",
    expires_at: "2020-01-01T00:00:00.000Z",
  }, { connected: true, measured: true });
  assert.equal(isStaleResource(stale, Date.parse("2026-09-17T00:00:00.000Z")).stale, true);
  const executed = await executeComputeTask({
    task: { type: "quantum_simulation", required_capabilities: ["quantum_simulation"] },
    discovery: { resources: [stale], providers: [] },
    now: "2026-09-17T18:00:00.000Z",
  });
  assert.equal(executed.status, "HOLD_HUMAN");
  assert.equal(executed.reason, "STALE_RESOURCE_METADATA");
});

test("zero or invalid error margin is rejected", () => {
  assert.equal(assertHonestResource({ error_margin_epsilon: 0 }).ok, false);
  assert.equal(assertHonestResource({ error_margin_epsilon: -1 }).ok, false);
  assert.equal(assertHonestResource({ error_metrics: { epsilon: 0 } }).ok, false);
  assert.equal(assertHonestResource({ error_margin_epsilon: 0.01 }).ok, true);
});

test("fake LIVE state is never admitted", () => {
  assert.equal(assertHonestResource({ live: true }).reason, "FAKE_LIVE_STATE");
  assert.equal(assertHonestResource({ state: "LIVE" }).reason, "FAKE_LIVE_STATE");
  assert.equal(assertHonestResource({ certified: true }).reason, "FAKE_CERTIFIED");
  assert.ok(FORBIDDEN_UNPROVEN.includes("LIVE"));
});

test("IBM adapter discovers backends dynamically when a token is present", async () => {
  resetComputeFabric();
  const found = await discoverCompute({
    env: { IBM_QUANTUM_TOKEN: "ibm-test-token-value-123456" },
    fetchImpl: ibmFetch(),
  });
  const ibm = found.providers.find((p) => p.provider === "ibm");
  assert.equal(ibm.provider_connected, true);
  assert.equal(ibm.qpu_execution_verified, false);
  const qpu = found.resources.find((r) => r.resource_id === "ibm_future_osprey");
  assert.ok(qpu);
  assert.equal(qpu.state, "DISCOVERED");
  assert.equal(qpu.qubit_count, 133);
});

test("quantum magic claims are refused without measurement", () => {
  assert.equal(refuseMagicClaim("quantum advantage").ok, false);
  assert.equal(refuseMagicClaim("quantum supremacy").ok, false);
  assert.equal(refuseMagicClaim("quantum intelligence").ok, false);
  assert.equal(refuseMagicClaim("quantum consciousness").ok, false);
  const routed = routeComputeTask({ task: { claim: "quantum advantage" } });
  assert.equal(routed.status, "HOLD_HUMAN");
});

test("local simulator actually executes a Bell circuit", () => {
  const result = simulateCircuit({ qubits: 2, gates: [["h", 0], ["cx", 0, 1]], shots: 200, seed: 2 });
  assert.ok(result.counts["00"] > 0);
  assert.ok(result.counts["11"] > 0);
  assert.equal(result.quantum_advantage, false);
  assert.equal(result.quantum_intelligence, false);
  const total = Object.values(result.counts).reduce((a, b) => a + b, 0);
  assert.equal(total, 200);
});

test("proof loop distinguishes adapter / connected / verified", async () => {
  resetComputeFabric();
  const proof = await runComputeProofLoop({ env: {}, now: "2026-09-17T18:00:00.000Z" });
  assert.equal(proof.adapter_exists_is_not_provider_connected, true);
  assert.equal(proof.provider_connected_is_not_qpu_verified, true);
  assert.equal(proof.cpu_local_simulator, true);
  assert.equal(proof.real_qpu, "HOLD_HUMAN");
  assert.equal(proof.stages.DISCOVER, "EXECUTED");
  assert.equal(proof.stages.SELECT, "SELECTED");
  assert.equal(proof.stages.VERIFY, "VERIFIED");
  assert.equal(proof.live, false);
  const view = proof.view;
  assert.equal(view.title, "ACORN CORTEX");
  assert.equal(view.fabric, "COMPUTE FABRIC");
  assert.equal(view.cpu.status, "EXECUTABLE");
  assert.equal(view.certified, false);
  assert.equal(view.no_fake_badge, true);
});

test("Cortex view never mints CERTIFIED or LIVE", () => {
  resetComputeFabric();
  const view = cortexComputeView({ env: {} });
  assert.equal(view.live, false);
  assert.equal(view.certified, false);
  assert.equal(view.cpu.certified, false);
  assert.equal(view.gpu.live, false);
  assert.equal(view.hpc.status, "DEFINED");
  const schema = JSON.parse(readFileSync(new URL("../schema/compute-fabric.v0.json", import.meta.url), "utf8"));
  assert.equal(schema.properties.live.const, false);
  assert.equal(schema.properties.certified.const, false);
});

test("new adapter registers without modifying Cortex", () => {
  resetComputeFabric();
  const added = registerComputeAdapter({
    provider_id: "photonic-x",
    label: "future-photonic",
    intelligence: false,
    discoverSync() {
      return { status: "DEFINED", authentication_state: "MISSING", resources: [], provider_connected: false };
    },
  });
  assert.equal(added.ok, true);
  assert.equal(added.cortex_modified, false);
  assert.equal(added.core_modified, false);
  assert.ok(listComputeAdapters().some((a) => a.provider_id === "photonic-x"));
});

test("Cortex runtime snapshot includes compute fabric without inventing LIVE", () => {
  const result = runCortexRuntime({
    workerEvidence: { v: "cognitive-worker.v14", verified: false, dispatches: [] },
    agents: [{ id: "reviewer", capabilities: ["review"], presence: "DECLARED" }],
    at: "2026-09-17T18:00:00.000Z",
  });
  assert.equal(result.live, false);
  assert.ok(result.compute);
  assert.equal(result.compute.live, false);
  assert.equal(result.compute.version, COMPUTE_FABRIC_VERSION);
});


test("GPU discovery never falls back to CPU execution", async () => {
  const adapter = localAdapter();
  const found = adapter.discoverSync({ now: "2026-09-17T18:00:00.000Z", allowExec: false, gpuProbe: { present: true, gpu_count: 1, source: "test" } });
  const gpu = found.resources.find((r) => r.compute_type === "gpu");
  assert.ok(gpu);
  const result = await adapter.execute(gpu, { type: "compute" }, { now: "2026-09-17T18:00:00.000Z" });
  assert.equal(result.status, "HOLD_HUMAN");
  assert.equal(result.reason, "GPU_RUNTIME_NOT_IMPLEMENTED");
  assert.equal(result.result, undefined);
});
