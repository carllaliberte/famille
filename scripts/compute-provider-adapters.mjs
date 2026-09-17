#!/usr/bin/env node
/**
 * COMPUTE PROVIDER ADAPTERS
 *
 * Generic adapters for compute resources. Not intelligences. Not authority.
 * A new provider joins by implementing this contract — the Cortex core is not
 * rewritten. CAPABILITY ≠ AUTHORITY.
 *
 * Braket / IBM / CUDA-Q / local are adapters, not the centre of the system.
 * Devices are discovered, never hardcoded as the totality of the world.
 */
import { cpus, totalmem, freemem, arch, platform, availableParallelism } from "node:os";
import { existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { probeGpuRuntime, executeGpuWork } from "./acorn-gpu-runtime.mjs";

export const ADAPTER_CONTRACT_VERSION = "compute-adapter.v0";
export const UNKNOWN = "UNKNOWN";
export const FORBIDDEN_UNPROVEN = Object.freeze(["READY", "LIVE", "AVAILABLE", "CERTIFIED"]);
export const AUTH_STATES = Object.freeze(["MISSING", "PRESENT", "UNKNOWN"]);
export const COMPUTE_TYPES = Object.freeze([
  "cpu", "gpu", "qpu", "simulator", "hpc",
  "tpu", "npu", "photonic", "neuromorphic", "optical", "analog", "unknown",
]);

const MAGIC_CLAIMS = /\bquantum\s+(advantage|supremacy|intelligence|consciousness)\b/i;

function text(v) {
  return String(v ?? "").trim();
}

function list(v) {
  return Array.isArray(v) ? v.map(text).filter(Boolean) : [];
}

function iso(v) {
  const s = text(v);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

export function unknownOf(value) {
  if (value === undefined || value === null || value === "") return UNKNOWN;
  return value;
}

export function refuseMagicClaim(value) {
  const s = text(value);
  if (!s) return { ok: true, claim: null };
  if (MAGIC_CLAIMS.test(s)) {
    return { ok: false, claim: s, reason: "UNMEASURED_MAGIC_CLAIM", live: false };
  }
  return { ok: true, claim: s };
}

export function honestState(state, { measured = false, verified = false, connected = false } = {}) {
  const s = text(state) || UNKNOWN;
  if (s === "LIVE") return UNKNOWN;
  if (s === "CERTIFIED") return UNKNOWN;
  if (s === "READY" && !measured && !verified) return UNKNOWN;
  if (s === "AVAILABLE" && !measured && !connected) return UNKNOWN;
  if (FORBIDDEN_UNPROVEN.includes(s) && !verified) return UNKNOWN;
  return s;
}

export function credentialPresent(keys = [], env = {}) {
  return keys.some((key) => text(env[key]).length > 8);
}

function costBlank() {
  return {
    estimated_cost: UNKNOWN,
    actual_cost: UNKNOWN,
    currency: UNKNOWN,
    billing_unit: UNKNOWN,
  };
}

export function makeResource(input = {}, proof = {}) {
  const now = iso(input.observed_at);
  const connected = proof.connected === true;
  const measured = proof.measured === true;
  const verified = proof.verified === true;
  return {
    provider: text(input.provider) || UNKNOWN,
    resource_id: text(input.resource_id) || UNKNOWN,
    architecture: unknownOf(input.architecture),
    compute_type: COMPUTE_TYPES.includes(input.compute_type) ? input.compute_type : "unknown",
    location: unknownOf(input.location),
    availability: honestState(input.availability, { measured, connected, verified }),
    capabilities: list(input.capabilities),
    qubit_count: Number.isFinite(Number(input.qubit_count)) ? Number(input.qubit_count) : UNKNOWN,
    gpu_count: Number.isFinite(Number(input.gpu_count)) ? Number(input.gpu_count) : UNKNOWN,
    cpu_count: Number.isFinite(Number(input.cpu_count)) ? Number(input.cpu_count) : UNKNOWN,
    memory: Number.isFinite(Number(input.memory)) ? Number(input.memory) : UNKNOWN,
    precision: unknownOf(input.precision),
    supported_operations: list(input.supported_operations),
    supported_frameworks: list(input.supported_frameworks),
    latency: Number.isFinite(Number(input.latency)) ? Number(input.latency) : UNKNOWN,
    cost: { ...costBlank(), ...(input.cost && typeof input.cost === "object" ? input.cost : {}) },
    queue_status: unknownOf(input.queue_status),
    calibration: unknownOf(input.calibration),
    error_metrics: input.error_metrics && typeof input.error_metrics === "object" ? input.error_metrics : UNKNOWN,
    execution_limits: unknownOf(input.execution_limits),
    authentication_state: AUTH_STATES.includes(input.authentication_state) ? input.authentication_state : UNKNOWN,
    observed_at: now,
    expires_at: input.expires_at || null,
    state: honestState(input.state || "DEFINED", { measured, connected, verified }),
    live: false,
    certified: false,
    authority: false,
    intelligence: false,
    invented: false,
  };
}

function asDeviceList(body) {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];
  for (const key of ["devices", "deviceSummaries", "backends", "items", "data", "results"]) {
    if (Array.isArray(body[key])) return body[key];
  }
  return [];
}

function inferArchitecture(raw = {}) {
  const blob = `${raw.architecture || ""} ${raw.paradigm || ""} ${raw.providerName || ""} ${raw.name || ""} ${JSON.stringify(raw.deviceCapabilities || raw.configuration || {})}`.toLowerCase();
  if (/neutral.?atom|aquila|quera/.test(blob)) return "neutral_atom";
  if (/trapped.?ion|ionq|quantinuum/.test(blob)) return "trapped_ion";
  if (/superconduct|transmon|ibm|rigetti|oqpro/.test(blob)) return "superconducting";
  if (/photonic|xanadu|quandela/.test(blob)) return "photonic";
  if (/spin|silicon|intel/.test(blob)) return "spin";
  if (/simulator|sv1|tn1|dm1|aer|qasm/.test(blob)) return "simulator";
  if (/cuda|gpu|nvidia/.test(blob)) return "gpu_cuda";
  if (/cpu|x86|arm/.test(blob)) return "cpu";
  return UNKNOWN;
}

function inferComputeType(raw = {}) {
  const blob = `${raw.deviceType || raw.type || raw.kind || raw.simulator || raw.name || ""}`.toLowerCase();
  if (/sim/.test(blob)) return "simulator";
  if (/qpu|quantum/.test(blob)) return "qpu";
  if (/gpu/.test(blob)) return "gpu";
  if (/cpu/.test(blob)) return "cpu";
  if (/hpc/.test(blob)) return "hpc";
  return "unknown";
}

function inferQubits(raw = {}) {
  const caps = raw.deviceCapabilities || raw.configuration || raw.properties || {};
  const n = raw.qubit_count ?? raw.n_qubits ?? raw.num_qubits ?? caps.paradigm?.qubitCount ?? caps.n_qubits ?? caps.num_qubits;
  return Number.isFinite(Number(n)) ? Number(n) : UNKNOWN;
}

export function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulateCircuit({ qubits = 2, gates = [["h", 0], ["cx", 0, 1]], shots = 256, seed = 1 } = {}) {
  const n = 1 << qubits;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  re[0] = 1;
  for (const gate of gates) applyGate(re, im, qubits, gate);
  const probs = Array.from({ length: n }, (_, i) => re[i] * re[i] + im[i] * im[i]);
  const norm = probs.reduce((a, b) => a + b, 0);
  const counts = {};
  const rng = mulberry32(Number(seed) || 1);
  const shotCount = Math.max(1, Math.min(Number(shots) || 256, 8192));
  for (let s = 0; s < shotCount; s++) {
    let x = rng();
    let idx = n - 1;
    for (let i = 0; i < n; i++) {
      x -= probs[i] / (norm || 1);
      if (x <= 0) { idx = i; break; }
    }
    const key = idx.toString(2).padStart(qubits, "0");
    counts[key] = (counts[key] || 0) + 1;
  }
  return {
    qubits,
    shots: shotCount,
    gates,
    counts,
    state_norm: norm,
    simulator: "local-statevector",
    quantum_advantage: false,
    quantum_supremacy: false,
    quantum_intelligence: false,
  };
}

function applyGate(re, im, qubits, gate) {
  const kind = String(gate[0] || "").toLowerCase();
  if (kind === "h") return hadamard(re, im, qubits, Number(gate[1]));
  if (kind === "x") return pauliX(re, im, qubits, Number(gate[1]));
  if (kind === "cx" || kind === "cnot") return cnot(re, im, qubits, Number(gate[1]), Number(gate[2]));
}

function hadamard(re, im, qubits, q) {
  const n = re.length;
  const bit = 1 << (qubits - 1 - q);
  const s = Math.SQRT1_2;
  const seen = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const j = i ^ bit;
    if (seen[i] || seen[j]) continue;
    seen[i] = 1; seen[j] = 1;
    const ar = re[i]; const ai = im[i];
    const br = re[j]; const bi = im[j];
    re[i] = s * (ar + br); im[i] = s * (ai + bi);
    re[j] = s * (ar - br); im[j] = s * (ai - bi);
  }
}

function pauliX(re, im, qubits, q) {
  const n = re.length;
  const bit = 1 << (qubits - 1 - q);
  const seen = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const j = i ^ bit;
    if (seen[i] || j < i) continue;
    seen[i] = 1; seen[j] = 1;
    const tr = re[i]; const ti = im[i];
    re[i] = re[j]; im[i] = im[j];
    re[j] = tr; im[j] = ti;
  }
}

function cnot(re, im, qubits, c, t) {
  const n = re.length;
  const cb = 1 << (qubits - 1 - c);
  const tb = 1 << (qubits - 1 - t);
  const seen = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (!(i & cb)) continue;
    const j = i ^ tb;
    if (seen[i] || j < i) continue;
    seen[i] = 1; seen[j] = 1;
    const tr = re[i]; const ti = im[i];
    re[i] = re[j]; im[i] = im[j];
    re[j] = tr; im[j] = ti;
  }
}

export function measureCpu({ now } = {}) {
  const t0 = performance.now();
  let acc = 0;
  for (let i = 0; i < 200000; i++) acc += i & 7;
  const latency = performance.now() - t0;
  const count = typeof availableParallelism === "function" ? availableParallelism() : cpus().length;
  return {
    observed: true,
    measured: true,
    proposed: false,
    cpu_count: count,
    memory: totalmem(),
    memory_free: freemem(),
    arch: arch(),
    platform: platform(),
    latency_ms: latency,
    checksum: createHash("sha256").update(String(acc)).digest("hex").slice(0, 16),
    observed_at: iso(now),
    models: cpus().slice(0, 1).map((c) => c.model),
  };
}

export function probeNvidiaGpu({ allowExec = false } = {}) {
  const proc = "/proc/driver/nvidia/gpus";
  if (existsSync(proc)) {
    try {
      const dirs = readdirSync(proc).filter((name) => name && !name.startsWith("."));
      return { present: dirs.length > 0, gpu_count: dirs.length, source: "proc", names: dirs };
    } catch {
      return { present: false, gpu_count: 0, source: "proc_error" };
    }
  }
  if (!allowExec) return { present: false, gpu_count: 0, source: "not_observed", state: UNKNOWN };
  try {
    const out = execFileSync("nvidia-smi", ["--query-gpu=name,memory.total", "--format=csv,noheader"], {
      encoding: "utf8",
      timeout: 1500,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const lines = out.trim().split("\n").filter(Boolean);
    return { present: lines.length > 0, gpu_count: lines.length, source: "nvidia-smi", names: lines };
  } catch {
    return { present: false, gpu_count: 0, source: "absent" };
  }
}

export function probeCudaq({ allowExec = false } = {}) {
  if (!allowExec) return { present: false, source: "not_observed", state: UNKNOWN };
  try {
    const out = execFileSync("python3", ["-c", "import cudaq; print(getattr(cudaq,'__version__','present'))"], {
      encoding: "utf8",
      timeout: 2000,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return { present: true, version: text(out) || "present", source: "python-cudaq" };
  } catch {
    return { present: false, source: "absent" };
  }
}

export function localAdapter() {
  return {
    provider_id: "local",
    label: "local-compute",
    compute_types: ["cpu", "simulator"],
    credential_keys: [],
    intelligence: false,
    authority: false,
    discoverSync(ctx = {}) {
      const cpu = measureCpu({ now: ctx.now });
      const gpu = ctx.gpuProbe || probeNvidiaGpu({ allowExec: ctx.allowExec === true });
      const gpuRuntime = ctx.gpuRuntimeProbe || probeGpuRuntime({ allowExec: ctx.allowExec === true });
      const sim = makeResource({
        provider: "local",
        resource_id: "local-statevector",
        architecture: "simulator",
        compute_type: "simulator",
        location: "localhost",
        availability: "MEASURED",
        capabilities: ["quantum_simulation", "statevector", "cpu"],
        cpu_count: cpu.cpu_count,
        memory: cpu.memory,
        precision: "float64",
        supported_operations: ["h", "x", "cx"],
        supported_frameworks: ["acorn-local-statevector"],
        latency: cpu.latency_ms,
        cost: { estimated_cost: 0, actual_cost: 0, currency: "USD", billing_unit: "shot" },
        authentication_state: "PRESENT",
        observed_at: cpu.observed_at,
        state: "EXECUTABLE",
      }, { connected: true, measured: true });
      const cpuRes = makeResource({
        provider: "local",
        resource_id: "local-cpu",
        architecture: cpu.arch,
        compute_type: "cpu",
        location: "localhost",
        availability: "MEASURED",
        capabilities: ["cpu", "classical"],
        cpu_count: cpu.cpu_count,
        memory: cpu.memory,
        latency: cpu.latency_ms,
        cost: { estimated_cost: 0, actual_cost: 0, currency: "USD", billing_unit: "cycle" },
        authentication_state: "PRESENT",
        observed_at: cpu.observed_at,
        state: "EXECUTABLE",
      }, { connected: true, measured: true });
      const gpuPresent = gpu.present === true && gpu.gpu_count > 0;
      const gpuRes = makeResource({
        provider: "local",
        resource_id: "local-gpu",
        architecture: gpuPresent ? "gpu_cuda" : UNKNOWN,
        compute_type: "gpu",
        location: "localhost",
        availability: gpuPresent ? "MEASURED" : UNKNOWN,
        capabilities: gpuPresent && gpuRuntime.present ? ["gpu", "cuda", "local_gpu_execution"] : gpuPresent ? ["gpu", "cuda"] : ["gpu"],
        gpu_count: gpuPresent ? gpu.gpu_count : UNKNOWN,
        authentication_state: gpuPresent ? "PRESENT" : "MISSING",
        observed_at: iso(ctx.now),
        state: gpuPresent && gpuRuntime.present ? "EXECUTABLE" : (gpu.source === "not_observed" ? "DEFINED" : "DISCOVERED"),
        cost: costBlank(),
      }, { connected: gpuPresent, measured: gpuPresent });
      return {
        status: "DISCOVERED",
        authentication_state: "PRESENT",
        provider_connected: true,
        resources: [cpuRes, sim, gpuRes],
        measurement: cpu,
        gpu_probe: gpu,
        gpu_runtime: gpuRuntime,
        live: false,
      };
    },
    async discover(ctx = {}) {
      return this.discoverSync(ctx);
    },
    async measure(resource, ctx = {}) {
      if (resource.compute_type === "cpu" || resource.resource_id === "local-cpu") {
        const cpu = measureCpu({ now: ctx.now });
        return { status: "MEASURED", observed: true, measured: true, proposed: false, ...cpu, live: false };
      }
      if (resource.compute_type === "simulator" || resource.resource_id === "local-statevector") {
        const t0 = performance.now();
        const result = simulateCircuit({ qubits: 1, gates: [["h", 0]], shots: 32, seed: 7 });
        return {
          status: "MEASURED",
          observed: true,
          measured: true,
          proposed: false,
          latency_ms: performance.now() - t0,
          shots: result.shots,
          state_norm: result.state_norm,
          live: false,
        };
      }
      return { status: UNKNOWN, observed: false, measured: false, proposed: true, live: false };
    },
    async execute(resource, task = {}, ctx = {}) {
      const started = iso(ctx.now);
      const t0 = performance.now();
      if (resource.compute_type === "simulator" || task.type === "quantum_simulation") {
        const result = simulateCircuit({
          qubits: Number(task.qubits) || 2,
          gates: Array.isArray(task.gates) ? task.gates : [["h", 0], ["cx", 0, 1]],
          shots: Number(task.shots) || 256,
          seed: Number(task.seed) || 1,
        });
        return {
          status: "EXECUTED",
          observed: true,
          measured: true,
          proposed: false,
          started_at: started,
          completed_at: iso(ctx.now || new Date().toISOString()),
          duration_ms: performance.now() - t0,
          result,
          cost: { estimated_cost: 0, actual_cost: 0, currency: "USD", billing_unit: "shot" },
          live: false,
        };
      }
      if (resource.compute_type === "gpu") {
        const runtimeProbe = ctx.gpuRuntimeProbe || probeGpuRuntime({ allowExec: ctx.allowExec === true });
        return executeGpuWork({ task, runtimeProbe, allowExec: ctx.allowExec === true });
      }
      const cpu = measureCpu({ now: ctx.now });
      return {
        status: "EXECUTED",
        observed: true,
        measured: true,
        proposed: false,
        started_at: started,
        completed_at: iso(ctx.now || new Date().toISOString()),
        duration_ms: cpu.latency_ms,
        result: { cpu },
        cost: { estimated_cost: 0, actual_cost: 0, currency: "USD", billing_unit: "cycle" },
        live: false,
      };
    },
  };
}

function remoteAuth(keys, env) {
  return credentialPresent(keys, env) ? "PRESENT" : "MISSING";
}

export function braketAdapter() {
  const keys = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "BRAKET_DEVICE_ARN", "AWS_SESSION_TOKEN"];
  return {
    provider_id: "braket",
    label: "amazon-braket",
    compute_types: ["qpu", "simulator"],
    credential_keys: keys,
    intelligence: false,
    authority: false,
    discoverSync(ctx = {}) {
      const auth = remoteAuth(keys, ctx.env || {});
      return {
        status: auth === "PRESENT" ? "CONNECTED" : "HOLD_HUMAN",
        authentication_state: auth,
        provider_connected: auth === "PRESENT",
        qpu_execution_verified: false,
        resources: [],
        reason: auth === "MISSING" ? "CHANNEL_NOT_PRESENT" : "PROBE_REQUIRED",
        closed_list: false,
        live: false,
      };
    },
    async discover(ctx = {}) {
      const base = this.discoverSync(ctx);
      if (base.authentication_state !== "PRESENT") return base;
      if (typeof ctx.fetchImpl !== "function") return { ...base, status: "CONNECTED", reason: "NO_TRANSPORT" };
      try {
        const url = text(ctx.braketUrl) || "https://braket.us-east-1.amazonaws.com/devices";
        const res = await ctx.fetchImpl(url, {
          headers: { authorization: `AWS ${text((ctx.env || {}).AWS_ACCESS_KEY_ID).slice(0, 4)}…` },
        });
        if (!res || res.ok === false) {
          return { ...base, status: "HOLD_HUMAN", reason: `HTTP_${res?.status || "ERROR"}`, live: false };
        }
        const body = typeof res.json === "function" ? await res.json() : {};
        const resources = asDeviceList(body).map((raw) => resourceFromProvider("braket", raw)).filter(Boolean);
        return {
          ...base,
          status: "DISCOVERED",
          resources,
          closed_list: false,
          qpu_execution_verified: false,
          live: false,
        };
      } catch (error) {
        return { ...base, status: "HOLD_HUMAN", reason: String(error?.message || error).slice(0, 240), live: false };
      }
    },
    async measure() {
      return { status: UNKNOWN, observed: false, measured: false, proposed: true, live: false };
    },
    async execute(_resource, _task, ctx = {}) {
      if (ctx.human_authorization !== true) {
        return { status: "HOLD_HUMAN", reason: "PAID_QPU_REQUIRES_HUMAN", observed: false, measured: false, proposed: true, live: false };
      }
      return { status: "HOLD_HUMAN", reason: "NO_ARBITRARY_EXTERNAL_WRITE", observed: false, live: false };
    },
  };
}

export function ibmAdapter() {
  const keys = ["IBM_QUANTUM_TOKEN", "QISKIT_IBM_TOKEN", "IBM_CLOUD_API_KEY"];
  return {
    provider_id: "ibm",
    label: "ibm-quantum",
    compute_types: ["qpu", "simulator"],
    credential_keys: keys,
    intelligence: false,
    authority: false,
    discoverSync(ctx = {}) {
      const auth = remoteAuth(keys, ctx.env || {});
      return {
        status: auth === "PRESENT" ? "CONNECTED" : "HOLD_HUMAN",
        authentication_state: auth,
        provider_connected: auth === "PRESENT",
        qpu_execution_verified: false,
        resources: [],
        reason: auth === "MISSING" ? "CHANNEL_NOT_PRESENT" : "PROBE_REQUIRED",
        closed_list: false,
        live: false,
      };
    },
    async discover(ctx = {}) {
      const base = this.discoverSync(ctx);
      if (base.authentication_state !== "PRESENT") return base;
      if (typeof ctx.fetchImpl !== "function") return { ...base, status: "CONNECTED", reason: "NO_TRANSPORT" };
      try {
        const url = text(ctx.ibmUrl) || "https://api.quantum-computing.ibm.com/runtime/backends";
        const token = text((ctx.env || {}).IBM_QUANTUM_TOKEN || (ctx.env || {}).QISKIT_IBM_TOKEN || (ctx.env || {}).IBM_CLOUD_API_KEY);
        const res = await ctx.fetchImpl(url, { headers: { authorization: `Bearer ${token}` } });
        if (!res || res.ok === false) {
          return { ...base, status: "HOLD_HUMAN", reason: `HTTP_${res?.status || "ERROR"}`, live: false };
        }
        const body = typeof res.json === "function" ? await res.json() : {};
        const resources = asDeviceList(body).map((raw) => resourceFromProvider("ibm", raw)).filter(Boolean);
        return {
          ...base,
          status: "DISCOVERED",
          resources,
          closed_list: false,
          qpu_execution_verified: false,
          live: false,
        };
      } catch (error) {
        return { ...base, status: "HOLD_HUMAN", reason: String(error?.message || error).slice(0, 240), live: false };
      }
    },
    async measure() {
      return { status: UNKNOWN, observed: false, measured: false, proposed: true, live: false };
    },
    async execute(_resource, _task, ctx = {}) {
      if (ctx.human_authorization !== true) {
        return { status: "HOLD_HUMAN", reason: "PAID_QPU_REQUIRES_HUMAN", observed: false, measured: false, proposed: true, live: false };
      }
      return { status: "HOLD_HUMAN", reason: "NO_ARBITRARY_EXTERNAL_WRITE", observed: false, live: false };
    },
  };
}

export function cudaqAdapter() {
  return {
    provider_id: "cudaq",
    label: "nvidia-cuda-q",
    compute_types: ["gpu", "cpu", "qpu", "simulator"],
    credential_keys: [],
    intelligence: false,
    authority: false,
    discoverSync(ctx = {}) {
      const gpu = ctx.gpuProbe || probeNvidiaGpu({ allowExec: ctx.allowExec === true });
      const cudaq = ctx.cudaqProbe || probeCudaq({ allowExec: ctx.allowExec === true });
      const gpuPresent = gpu.present === true && gpu.gpu_count > 0;
      const resources = [
        makeResource({
          provider: "cudaq",
          resource_id: "cudaq-hybrid",
          architecture: gpuPresent ? "gpu_cuda" : UNKNOWN,
          compute_type: gpuPresent ? "gpu" : "unknown",
          location: "localhost",
          capabilities: ["cpu", "gpu", "qpu_orchestration"].filter((c) => c !== "gpu" || gpuPresent),
          gpu_count: gpuPresent ? gpu.gpu_count : UNKNOWN,
          cpu_count: typeof availableParallelism === "function" ? availableParallelism() : cpus().length,
          supported_frameworks: cudaq.present ? ["cudaq"] : [],
          authentication_state: gpuPresent ? "PRESENT" : "MISSING",
          observed_at: iso(ctx.now),
          state: gpuPresent && cudaq.present ? "EXECUTABLE" : gpuPresent ? "DISCOVERED" : "DEFINED",
          cost: costBlank(),
        }, { connected: gpuPresent, measured: gpuPresent }),
      ];
      return {
        status: gpuPresent ? "DISCOVERED" : "DEFINED",
        authentication_state: gpuPresent ? "PRESENT" : "MISSING",
        provider_connected: gpuPresent,
        gpu_is_not_intelligence: true,
        cudaq_present: cudaq.present === true,
        cudaq_probe: cudaq,
        gpu_probe: gpu,
        resources,
        live: false,
      };
    },
    async discover(ctx = {}) {
      return this.discoverSync(ctx);
    },
    async measure(resource, ctx = {}) {
      const gpu = ctx.gpuProbe || probeNvidiaGpu({ allowExec: ctx.allowExec === true });
      if (gpu.present !== true) return { status: UNKNOWN, observed: false, measured: false, proposed: true, live: false };
      return { status: "MEASURED", observed: true, measured: true, proposed: false, gpu_count: gpu.gpu_count, live: false };
    },
    async execute(_resource, _task, ctx = {}) {
      const gpu = ctx.gpuProbe || probeNvidiaGpu({ allowExec: ctx.allowExec === true });
      if (gpu.present !== true) return { status: "HOLD_HUMAN", reason: "GPU_NOT_PRESENT", observed: false, live: false };
      return { status: "HOLD_HUMAN", reason: "CUDAQ_ORCHESTRATION_NOT_VERIFIED", observed: false, live: false };
    },
  };
}

export function resourceFromProvider(provider, raw = {}) {
  const id = raw.deviceArn || raw.id || raw.name || raw.backend_name || raw.backendName || raw.deviceName;
  if (!id) return null;
  const computeType = inferComputeType(raw);
  const statusHint = text(raw.status || raw.operational || raw.state).toUpperCase();
  const online = /ONLINE|ACTIVE|OPERATIONAL/.test(statusHint);
  return makeResource({
    provider,
    resource_id: String(id),
    architecture: inferArchitecture(raw),
    compute_type: computeType,
    location: unknownOf(raw.region || raw.location || raw.city),
    availability: online ? "DISCOVERED" : UNKNOWN,
    capabilities: list(raw.capabilities).concat(
      computeType === "qpu" ? ["quantum_hardware"] : [],
      computeType === "simulator" ? ["quantum_simulation"] : [],
      raw.architecture === "neutral_atom" || inferArchitecture(raw) === "neutral_atom" ? ["neutral_atom"] : [],
    ),
    qubit_count: inferQubits(raw),
    supported_operations: list(raw.gates || raw.supported_operations || raw.basis_gates),
    supported_frameworks: list(raw.supported_frameworks),
    queue_status: unknownOf(raw.queueDepth || raw.queue_status),
    calibration: unknownOf(raw.calibration),
    authentication_state: "PRESENT",
    observed_at: iso(raw.observed_at),
    expires_at: raw.expires_at || null,
    state: "DISCOVERED",
    cost: {
      estimated_cost: Number.isFinite(Number(raw.estimated_cost)) ? Number(raw.estimated_cost) : UNKNOWN,
      actual_cost: UNKNOWN,
      currency: raw.currency || "USD",
      billing_unit: unknownOf(raw.billing_unit || "shot"),
    },
  }, { connected: true, measured: false });
}

export function defaultAdapters() {
  return [localAdapter(), braketAdapter(), ibmAdapter(), cudaqAdapter()];
}

export function unknownAdapter(provider_id) {
  return {
    provider_id: text(provider_id) || "unknown",
    label: "unknown-provider",
    compute_types: ["unknown"],
    credential_keys: [],
    intelligence: false,
    authority: false,
    discoverSync() {
      return {
        status: UNKNOWN,
        authentication_state: UNKNOWN,
        provider_connected: false,
        resources: [],
        reason: "UNKNOWN_PROVIDER",
        live: false,
      };
    },
    async discover() {
      return this.discoverSync();
    },
    async measure() {
      return { status: UNKNOWN, observed: false, measured: false, proposed: true, live: false };
    },
    async execute() {
      return { status: UNKNOWN, reason: "UNKNOWN_PROVIDER", live: false };
    },
  };
}
