import test from "node:test";
import assert from "node:assert/strict";
import {
  ACCELERATOR_KINDS,
  acceleratorPassport,
  acceleratorUnavailable,
  compareResources,
  describeAccelerator,
  discoverAccelerators,
  discoverCapability,
  futureProofUnknown,
  hardwareFailureDomains,
  noLockIn,
  nvidiaUnavailable,
  observeAccelerator,
  probeAccelerator,
  replaceIntelligence,
  runAccelerationFabric,
  tomorrowBundle,
  ultimateAccelerationExperiment,
} from "../scripts/cortex-acceleration.mjs";
import { describeIntelligence } from "../scripts/intelligence-contract.mjs";
import { createAdapter } from "../scripts/cortex-adaptive.mjs";
import { runOrganismCycle } from "../scripts/cortex-organism.mjs";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";

test("NVIDIA is a candidate, not the architecture", () => {
  const n = describeAccelerator({ id: "nvidia-gpu", kind: "GPU", vendor: "NVIDIA" });
  assert.equal(n.nvidia_is_architecture, false);
  assert.equal(n.vendor_is_not_kind, true);
  assert.equal(n.closed_vendor_list, false);
  assert.ok(ACCELERATOR_KINDS.includes("UNKNOWN"));
  assert.ok(ACCELERATOR_KINDS.includes("GPU"));
});

test("hardware is not intelligence is not provider is not channel", () => {
  const d = describeIntelligence({ id: "reasoner", provider: "UNKNOWN", type: "REASONING", hardware: "cpu-local" });
  assert.equal(d.hardware_is_not_intelligence, true);
  assert.equal(d.model_is_not_hardware, true);
  assert.equal(d.type, "REASONING");
  assert.equal(d.authority, false);
  const h = describeAccelerator({ id: "cpu-local", kind: "CPU", vendor: "host", channel: "local" });
  assert.equal(h.hardware_is_not_intelligence, true);
  assert.equal(h.provider_is_not_channel, true);
});

test("NVIDIA without a channel stays CHANNEL_NOT_PRESENT — no fake LIVE", () => {
  const probe = probeAccelerator({ identity: "nvidia-gpu", vendor: "NVIDIA", env: {} });
  assert.equal(probe.state, "CHANNEL_NOT_PRESENT");
  assert.equal(probe.nvidia_connected, false);
  assert.equal(probe.invented_metrics, false);
  assert.equal(probe.live, false);
  const found = discoverAccelerators({ env: {}, workerEvidence: {} });
  const nvidia = found.entries.find((row) => row.identity === "nvidia-gpu");
  assert.equal(nvidia.state, "CHANNEL_NOT_PRESENT");
  assert.equal(found.nvidia_is_architecture, false);
  assert.equal(found.closed_list, false);
});

test("configured CUDA env is CONFIGURED, still not LIVE", () => {
  const probe = probeAccelerator({
    identity: "nvidia-gpu",
    vendor: "NVIDIA",
    env: { NVIDIA_VISIBLE_DEVICES: "0" },
  });
  assert.equal(probe.state, "CONFIGURED");
  assert.equal(probe.live, false);
});

test("FUTURE_ACCELERATOR_X is UNKNOWN, adapter proposed, not trusted", () => {
  const found = discoverAccelerators({
    declared: [{ id: "FUTURE_ACCELERATOR_X", kind: "UNKNOWN", vendor: "UNKNOWN" }],
  });
  const x = found.entries.find((row) => row.identity === "FUTURE_ACCELERATOR_X");
  assert.equal(x.kind, "UNKNOWN");
  assert.equal(x.state, "UNKNOWN");
  assert.equal(x.trusted, false);
  const adapter = createAdapter({ kind: "accelerator", discovery: x });
  assert.equal(adapter.status, "PROPOSED");
  assert.equal(adapter.adapter.available, false);
  assert.equal(adapter.adapter.safe, false);
});

test("declared capability is not measured, unknown stays UNKNOWN_CAPABILITY", () => {
  assert.equal(discoverCapability({ claimed: true, name: "REASONING" }).status, "DECLARED");
  assert.equal(discoverCapability({ measured: true, name: "REASONING" }).status, "MEASURED");
  assert.equal(discoverCapability({}).capability, "UNKNOWN_CAPABILITY");
});

test("passport is not presence and grants no authority", () => {
  const p = acceleratorPassport({ id: "nvidia-gpu", kind: "GPU", vendor: "NVIDIA" });
  assert.equal(p.passport.passport_is_not_presence, true);
  assert.equal(p.grants_authority, false);
  assert.equal(p.live, false);
});

test("NVIDIA / GPU unavailable degrades to CPU, never fake success", () => {
  const n = nvidiaUnavailable({ remaining: ["cpu-local"] });
  assert.equal(n.status, "DEGRADED");
  assert.equal(n.fake_success, false);
  assert.equal(n.nvidia_is_architecture, false);
  const g = acceleratorUnavailable({ lost: "gpu", remaining: ["cpu-local"] });
  assert.equal(g.status, "DEGRADED");
  const none = acceleratorUnavailable({ lost: "accelerator", remaining: [] });
  assert.equal(none.status, "UNAVAILABLE");
});

test("intelligence A disappearing does not change the Cortex contract", () => {
  const replaced = replaceIntelligence({
    current: { id: "INTELLIGENCE_A", capabilities: ["review"] },
    candidate: { id: "INTELLIGENCE_B", capabilities: ["review"] },
    compared: false,
    verified: false,
  });
  assert.equal(replaced.activated, false);
  assert.equal(replaced.cortex_contract_unchanged, true);
});

test("three NVIDIA GPUs on one host are not three independences", () => {
  const domains = hardwareFailureDomains([
    { id: "a", provider: "NVIDIA", host: "cloud-1", capabilities: ["GPU_ACCELERATION"] },
    { id: "b", provider: "NVIDIA", host: "cloud-1", capabilities: ["GPU_ACCELERATION"] },
    { id: "c", provider: "NVIDIA", host: "cloud-1", capabilities: ["GPU_ACCELERATION"] },
  ]);
  assert.equal(domains.shared_provider, true);
  assert.equal(domains.three_sentinels_are_not_three_sources, true);
  assert.equal(domains.nodes_are_not_independence, true);
});

test("TECHNOLOGY_TOMORROW is received without pretending to know it", () => {
  const t = tomorrowBundle({});
  assert.equal(t.technology, "TECHNOLOGY_TOMORROW");
  assert.equal(t.understood, false);
  assert.equal(t.trusted, false);
  assert.equal(t.hardware.kind, "UNKNOWN");
  assert.equal(t.live, false);
});

test("ultimate 25-step experiment stays one Cortex, no extra authority", () => {
  const ult = ultimateAccelerationExperiment({ workerEvidence: { v: "cognitive-worker.v14" } });
  assert.equal(ult.chain.length, 25);
  assert.equal(ult.unknown_intelligence.trusted, false);
  assert.equal(ult.unknown_accelerator.kind, "UNKNOWN");
  assert.equal(ult.capability.status, "UNKNOWN");
  assert.equal(ult.adapter.status, "PROPOSED");
  assert.equal(ult.replaced.activated, false);
  assert.equal(ult.nvidiaGone.fake_success, false);
  assert.equal(ult.gates.merge, false);
  assert.equal(ult.gates.write, false);
  assert.equal(ult.gates.nvidia_is_architecture, false);
  assert.equal(ult.one_cortex, true);
  assert.equal(ult.live, false);
});

test("security: accelerator discovery never becomes merge/write", () => {
  const fabric = runAccelerationFabric({ env: {}, workerEvidence: { v: "cognitive-worker.v14" } });
  assert.equal(fabric.gates.merge, false);
  assert.equal(fabric.paid_forbidden, true);
  assert.equal(fabric.invoke.reason, "CHANNEL_NOT_PRESENT");
  assert.equal(fabric.gates.second_cortex, false);
  assert.equal(fabric.zero_cost, true);
  assert.equal(fabric.live, false);
});

test("NVIDIA is never coded as better reasoning; metrics stay uninvented", () => {
  const compared = compareResources({
    a: { id: "cpu-local" },
    b: { id: "nvidia-gpu" },
    measurements: { measured: false },
  });
  assert.equal(compared.nvidia_is_better_reasoning, false);
  assert.equal(compared.better_in_general, false);
  assert.equal(compared.invented_metrics, false);
  const obs = observeAccelerator({ identity: "nvidia-gpu", presence: "CHANNEL_NOT_PRESENT" }, {});
  assert.equal(obs.invented, false);
  assert.equal(obs.latency, null);
  assert.equal(obs.live, false);
});

test("Cortex survives provider/model/hardware/protocol/adapter/intelligence replacement", () => {
  for (const kind of ["provider", "model", "hardware", "protocol", "adapter", "intelligence"]) {
    const row = noLockIn({ kind });
    assert.equal(row.cortex_survives, true);
    assert.equal(row.acorn_replaced, false);
    assert.equal(row.activated, false);
  }
});

test("future-proof unknown bundle does not pretend understanding", () => {
  const u = futureProofUnknown();
  assert.equal(u.unknown_intelligence, true);
  assert.equal(u.unknown_hardware, true);
  assert.equal(u.understood, false);
  assert.equal(u.live, false);
});

test("intelligence contract carries optional fields without inventing measurements", () => {
  const d = describeIntelligence({ id: "reasoner", provider: "UNKNOWN", type: "REASONING" });
  assert.equal(d.capabilities_are_not_authority, true);
  assert.equal(d.observed_performance, null);
  assert.equal(d.context_window, null);
  assert.equal(d.confidence, "UNSCORED");
  assert.equal(d.cost_class, "PAID");
});

test("organism wires futures without a second Cortex or LIVE", () => {
  const organism = runOrganismCycle({
    workerEvidence: { v: "cognitive-worker.v14" },
    agents: [{ id: "worker", capabilities: ["review"] }],
    fluidity: { state: "FLOWING", property: { silent_stop: false } },
  });
  assert.equal(organism.futures.claim.pretended, false);
  assert.equal(organism.world.model_is_not_world, true);
  assert.equal(organism.acceleration.compared.nvidia_is_better_reasoning, false);
  assert.equal(organism.acceleration.lockin.length, 6);
  assert.equal(organism.acceleration.nvidia.state, "CHANNEL_NOT_PRESENT");
  assert.equal(organism.acceleration.unknown.identity, "FUTURE_ACCELERATOR_X");
  assert.equal(organism.acceleration.gates.nvidia_is_architecture, false);
  assert.equal(organism.live, false);
  const runtime = runCortexRuntime({
    workerEvidence: {
      v: "cognitive-worker.v14",
      verified: true,
      dispatches: [{ number: 642, sha: "abc", state: "VERIFIED" }],
      truth: { ACTION_VERIFIED: true },
    },
    agents: [{ id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" }],
    fluidity: { state: "FLOWING", property: { silent_stop: false, hint_consumed: true } },
    at: "2026-09-16T23:20:00.000Z",
  });
  assert.equal(runtime.organism.acceleration.failover.fake_success, false);
  assert.equal(runtime.organism.futures.claim.pretended, false);
  assert.equal(runtime.live, false);
  assert.equal(runtime.auto_merge, false);
});
