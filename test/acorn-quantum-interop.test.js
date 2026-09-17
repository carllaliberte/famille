import test from "node:test";
import assert from "node:assert/strict";
import { routeQuantumIntelligenceTask } from "../scripts/acorn-compute-fabric.mjs";
import {
  quantumInteropConstitution,
  classifyQuantumResource,
  makeQuantumCapability,
  adaptQuantumIntelligence,
  buildHybridTask,
  routeQuantumTask,
  quantumBenchmarkContract,
  verifyQuantumResult,
  assertQuantumInteropInvariant,
} from "../scripts/acorn-quantum-interop.mjs";

test("quantum interop remains provider-neutral and authority-free", () => {
  const c = quantumInteropConstitution();
  assert.equal(c.existing_cortex, true);
  assert.equal(c.second_cortex, false);
  assert.equal(c.fixed_provider_allowlist, false);
  assert.equal(c.capability_is_not_authority, true);
  assert.equal(c.auto_spend, false);
  assertQuantumInteropInvariant(c);
});

test("unknown future quantum hardware is discoverable without being trusted", () => {
  const c = classifyQuantumResource({ name: "future qpu", architecture: "unknown" });
  assert.equal(c.quantum, true);
  assert.equal(c.type, "qpu");
  const cap = makeQuantumCapability({ name: "future qpu", provider: "future-provider" });
  assert.equal(cap.status, "DISCOVERED");
  assert.equal(cap.authority, false);
  assert.equal(cap.live, false);
});

test("quantum intelligence only promotes after evidence-backed verification", () => {
  const unverified = makeQuantumCapability({
    identity: "qi.future",
    type: "qpu",
    provider: "future",
    status: "CONNECTED",
  }, { connected: true });
  const a = adaptQuantumIntelligence({ identity: "qi.future", intelligence: true, capability: unverified });
  assert.equal(a.mode, "QUANTUM_ASSISTED");
  assert.equal(a.can_authorize, false);

  const verified = makeQuantumCapability({
    identity: "qi.future",
    type: "qpu",
    provider: "future",
  }, { connected: true, measured: true, executed: true, verified: true });
  const b = adaptQuantumIntelligence({ identity: "qi.future", intelligence: true, capability: verified });
  assert.equal(b.mode, "QUANTUM_NATIVE");
});

test("hybrid routing prefers measured simulator before paid hardware", () => {
  const task = buildHybridTask({ requires_qpu: false, fallback_allowed: true });
  const route = routeQuantumTask({
    task,
    capabilities: [
      { capability_id: "sim", quantum: true, type: "quantum_simulator", status: "VERIFIED", cost: { estimated: 0 } },
      { capability_id: "qpu", quantum: true, type: "qpu", status: "VERIFIED", cost: { estimated: 10 } },
    ],
  });
  assert.equal(route.status, "SELECTED");
  assert.equal(route.selected, "sim");
  assert.equal(route.mode, "QUANTUM_ASSISTED");
});

test("paid QPU never bypasses human authorization", () => {
  const route = routeQuantumTask({
    task: { requires_qpu: true, fallback_allowed: true },
    capabilities: [{ capability_id: "qpu", quantum: true, type: "qpu", status: "VERIFIED", cost: { estimated: 10 } }],
  });
  assert.equal(route.status, "HOLD_HUMAN");
  assert.equal(route.reason, "PAID_QPU_REQUIRES_HUMAN");
});

test("quantum advantage remains unproven without comparative evidence", () => {
  const benchmark = quantumBenchmarkContract({
    baseline: { latency_ms: 100 },
    candidate: { latency_ms: 50 },
    task: { type: "optimization" },
  });
  assert.equal(benchmark.quantum_advantage, false);
  assert.equal(benchmark.quantum_advantage_status, "MEASURABLE_BUT_NOT_PROVEN");
});

test("result verification requires measurement and evidence", () => {
  assert.equal(verifyQuantumResult({ result: { shots: 100 }, evidence: { digest: "x" } }).verified, true);
  assert.equal(verifyQuantumResult({ result: { shots: 100 }, evidence: {} }).verified, false);
});

test("compute fabric exposes the same quantum route without a second architecture", () => {
  const route = routeQuantumIntelligenceTask({
    task: { allow_simulator: true },
    capabilities: [{ capability_id: "sim", quantum: true, type: "quantum_simulator", status: "VERIFIED", cost: { estimated: 0 } }],
  });
  assert.equal(route.selected, "sim");
  assert.equal(route.capability_first, true);
  assert.equal(route.authority, false);
});
