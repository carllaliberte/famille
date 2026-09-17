#!/usr/bin/env node
/**
 * ACORN COMPUTE FABRIC
 *
 * Cortex-owned resource layer. Not a second brain, mesh, judge, or governance.
 * Maps global compute capabilities (CPU / GPU / HPC / QPU / future accelerators)
 * without granting authority. CAPABILITY ≠ AUTHORITY.
 *
 *   ACORN CORTEX → CAPABILITY ROUTER → COMPUTE FABRIC → adapters
 *
 * IDENTITY ≠ MODEL ≠ CHANNEL ≠ CAPABILITY ≠ AUTHORITY
 * A QPU is not an intelligence. A GPU is not an intelligence.
 * A provider is not an intelligence. A model is not an authority.
 *
 * DEFINED ≠ DISCOVERED ≠ CONNECTED ≠ MEASURED ≠ EXECUTABLE ≠ VERIFIED ≠ LIVE
 * Unmeasured = UNKNOWN. Never READY / LIVE / AVAILABLE / CERTIFIED without proof.
 * LIVE remains Carl. Auto-merge remains false.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import {
  ADAPTER_CONTRACT_VERSION,
  AUTH_STATES,
  COMPUTE_TYPES,
  FORBIDDEN_UNPROVEN,
  UNKNOWN,
  cudaqAdapter,
  defaultAdapters,
  honestState,
  localAdapter,
  makeResource,
  refuseMagicClaim,
  unknownAdapter,
} from "./compute-provider-adapters.mjs";
import { discoverAccelerators } from "./cortex-acceleration.mjs";

export const COMPUTE_FABRIC_VERSION = "acorn.compute-fabric.v1";
export const COMPUTE_STATES = Object.freeze([
  "DEFINED",
  "DISCOVERED",
  "CONNECTED",
  "MEASURED",
  "EXECUTABLE",
  "VERIFIED",
  "HOLD_HUMAN",
  "UNAVAILABLE",
  "FAILED",
  "UNKNOWN",
]);
export { COMPUTE_TYPES, UNKNOWN, FORBIDDEN_UNPROVEN, AUTH_STATES, ADAPTER_CONTRACT_VERSION };

export const SIMULATOR_LADDER = Object.freeze(["local_simulator", "managed_simulator", "hardware_qpu"]);
export const COST_POLICIES = Object.freeze(["LOCAL_ONLY", "FREE_ONLY", "FREE_FIRST", "PAID_ALLOWED", "PAID_FORBIDDEN"]);

const registry = new Map();
const ledger = [];

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

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, canonical(value[k])]));
  }
  return value;
}

export function digest(value) {
  return createHash("sha256").update(JSON.stringify(canonical(value ?? null))).digest("hex");
}

export function computeConstitution() {
  return Object.freeze({
    version: COMPUTE_FABRIC_VERSION,
    adapter_contract: ADAPTER_CONTRACT_VERSION,
    owner: "acorn",
    belongs_to_cortex: true,
    second_cortex: false,
    second_brain: false,
    second_mesh: false,
    second_governance: false,
    second_cognitive_fabric: false,
    compute_is_resource: true,
    compute_is_not_intelligence: true,
    qpu_is_not_intelligence: true,
    gpu_is_not_intelligence: true,
    provider_is_not_intelligence: true,
    model_is_not_authority: true,
    channel_is_not_authority: true,
    capability_is_not_authority: true,
    closed_provider_allowlist: false,
    quantum_is_not_magic: true,
    simulator_first: true,
    no_arbitrary_external_write: true,
    no_auto_spend: true,
    auto_merge: false,
    live: false,
    authority: "carl",
  });
}

export function resetComputeFabric() {
  registry.clear();
  ledger.length = 0;
  for (const adapter of defaultAdapters()) registerComputeAdapter(adapter);
}

export function registerComputeAdapter(adapter) {
  const provider_id = text(adapter?.provider_id);
  if (!provider_id) return { ok: false, reason: "ADAPTER_REQUIRES_PROVIDER_ID", live: false };
  registry.set(provider_id, {
    ...adapter,
    intelligence: false,
    authority: false,
    live: false,
  });
  return {
    ok: true,
    provider_id,
    core_modified: false,
    cortex_modified: false,
    cognition_modified: false,
    live: false,
  };
}

export function listComputeAdapters() {
  if (!registry.size) resetComputeFabric();
  return [...registry.values()];
}

export function getComputeAdapter(provider_id) {
  if (!registry.size) resetComputeFabric();
  return registry.get(text(provider_id)) || unknownAdapter(provider_id);
}

function epsilonOk(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

export function assertHonestResource(resource = {}) {
  const fakeLive = resource.live === true || resource.state === "LIVE" || resource.availability === "LIVE";
  const fakeCert = resource.certified === true || resource.state === "CERTIFIED";
  const zeroEps = resource.error_margin_epsilon === 0 || resource.error_metrics?.epsilon === 0;
  if (fakeLive) return { ok: false, reason: "FAKE_LIVE_STATE", live: false };
  if (fakeCert) return { ok: false, reason: "FAKE_CERTIFIED", live: false };
  if (zeroEps) return { ok: false, reason: "INVALID_ERROR_MARGIN", live: false };
  if (resource.error_margin_epsilon != null && resource.error_margin_epsilon !== UNKNOWN && !epsilonOk(resource.error_margin_epsilon)) {
    return { ok: false, reason: "INVALID_ERROR_MARGIN", live: false };
  }
  return { ok: true, live: false };
}

export function isStaleResource(resource = {}, now = Date.now()) {
  if (!resource.expires_at) return { stale: false, freshness: UNKNOWN };
  const exp = Date.parse(resource.expires_at);
  if (!Number.isFinite(exp)) return { stale: false, freshness: UNKNOWN };
  const stale = exp < Number(now);
  return { stale, freshness: stale ? "STALE" : "CURRENT", expires_at: resource.expires_at };
}

function resourceCost(resource) {
  const estimated = resource?.cost?.estimated_cost;
  if (estimated === 0 || estimated === "0") return 0;
  if (estimated === UNKNOWN || estimated == null) return null;
  const n = Number(estimated);
  return Number.isFinite(n) ? n : null;
}

function isSimulator(resource) {
  return resource.compute_type === "simulator" || resource.architecture === "simulator" || /sim/i.test(resource.resource_id || "");
}

function isLocal(resource) {
  return resource.provider === "local" || resource.location === "localhost";
}

export async function discoverCompute({
  env = process.env,
  fetchImpl = null,
  now = new Date().toISOString(),
  allowExec = false,
  gpuProbe,
  cudaqProbe,
  braketUrl,
  ibmUrl,
} = {}) {
  const adapters = listComputeAdapters();
  const providers = [];
  const resources = [];
  for (const adapter of adapters) {
    const ctx = { env, fetchImpl, now, allowExec, gpuProbe, cudaqProbe, braketUrl, ibmUrl };
    const found = typeof adapter.discover === "function"
      ? await adapter.discover(ctx)
      : adapter.discoverSync(ctx);
    providers.push({
      provider: adapter.provider_id,
      label: adapter.label,
      adapter_defined: true,
      intelligence: false,
      authority: false,
      status: found.status || "DEFINED",
      authentication_state: found.authentication_state || UNKNOWN,
      provider_connected: found.provider_connected === true,
      qpu_execution_verified: found.qpu_execution_verified === true,
      reason: found.reason || null,
      resource_count: (found.resources || []).length,
      closed_list: found.closed_list === false ? false : false,
      live: false,
    });
    for (const row of found.resources || []) {
      const honest = assertHonestResource(row);
      if (!honest.ok) continue;
      resources.push(row);
    }
  }
  return {
    status: "EXECUTED",
    version: COMPUTE_FABRIC_VERSION,
    constitution: computeConstitution(),
    providers,
    resources,
    unknown_provider: getComputeAdapter("not-a-catalog").discoverSync().status === UNKNOWN,
    closed_list: false,
    live: false,
    auto_merge: false,
    authority: "carl",
    observed_at: iso(now),
  };
}

export function snapshotComputeFabric(input = {}) {
  const adapters = listComputeAdapters();
  const providers = [];
  const resources = [];
  for (const adapter of adapters) {
    const found = adapter.discoverSync
      ? adapter.discoverSync(input)
      : { status: "DEFINED", resources: [], authentication_state: UNKNOWN, provider_connected: false };
    providers.push({
      provider: adapter.provider_id,
      label: adapter.label,
      adapter_defined: true,
      intelligence: false,
      status: found.status || "DEFINED",
      authentication_state: found.authentication_state || UNKNOWN,
      provider_connected: found.provider_connected === true,
      qpu_execution_verified: found.qpu_execution_verified === true,
      reason: found.reason || null,
      live: false,
    });
    for (const row of found.resources || []) resources.push(row);
  }
  return {
    status: "EXECUTED",
    version: COMPUTE_FABRIC_VERSION,
    providers,
    resources,
    live: false,
    auto_merge: false,
    authority: "carl",
    observed_at: iso(input.now),
    accelerators: discoverAccelerators({
      env: input.env || {},
      workerEvidence: input.workerEvidence || {},
    }),
    acceleration_is_not_second_fabric: true,
  };
}

function matchesTask(resource, task = {}) {
  const required = list(task.required_capabilities || task.capabilities);
  const caps = new Set(list(resource.capabilities).concat(resource.compute_type, resource.architecture));
  if (task.compute_type) {
    const same = resource.compute_type === task.compute_type;
    const simOk = isSimulator(resource) && task.allow_simulator !== false
      && (task.compute_type === "qpu" || task.type === "quantum_simulation" || required.includes("quantum_simulation"));
    if (!same && !simOk) return false;
  }
  if (task.architecture && task.architecture !== UNKNOWN) {
    if (resource.architecture !== task.architecture && !(isSimulator(resource) && task.allow_simulator !== false)) return false;
  }
  if (required.length && !required.every((cap) => caps.has(cap) || (cap === "quantum_simulation" && isSimulator(resource)))) {
    return false;
  }
  if (Number.isFinite(Number(task.min_shots)) && Number(resource.execution_limits) < Number(task.min_shots)) return false;
  if (Number.isFinite(Number(task.max_latency_ms)) && Number.isFinite(Number(resource.latency)) && Number(resource.latency) > Number(task.max_latency_ms)) {
    return false;
  }
  const cost = resourceCost(resource);
  if (Number.isFinite(Number(task.max_cost)) && cost != null && cost > Number(task.max_cost)) return false;
  return true;
}

function ladderRank(resource) {
  if (isLocal(resource) && isSimulator(resource)) return 0;
  if (isSimulator(resource)) return 1;
  if (resource.compute_type === "cpu") return 0;
  if (resource.compute_type === "gpu") return 2;
  if (resource.compute_type === "qpu") return 3;
  return 4;
}

function costRank(resource) {
  const cost = resourceCost(resource);
  if (cost === 0) return 0;
  if (cost == null) return 1;
  return 2 + cost;
}

export function routeComputeTask({
  task = {},
  discovery = null,
  policy = "FREE_FIRST",
  human_authorization = false,
} = {}) {
  const magic = refuseMagicClaim(task.claim || task.objective || task.type);
  if (!magic.ok) {
    return { status: "HOLD_HUMAN", reason: magic.reason, selected: null, live: false };
  }
  const snap = discovery || snapshotComputeFabric({});
  const mode = COST_POLICIES.includes(policy) ? policy : "FREE_FIRST";
  const required = list(task.required_capabilities || task.capabilities);
  let candidates = (snap.resources || []).filter((row) => matchesTask(row, task));
  const mismatch = (snap.resources || []).filter((row) => !matchesTask(row, task));

  if (mode === "LOCAL_ONLY") candidates = candidates.filter(isLocal);
  if (mode === "FREE_ONLY" || mode === "PAID_FORBIDDEN") {
    candidates = candidates.filter((row) => resourceCost(row) === 0 || isLocal(row) || isSimulator(row));
  }

  candidates = candidates.filter((row) => {
    const stale = isStaleResource(row);
    if (stale.stale) return false;
    return ["EXECUTABLE", "MEASURED", "DISCOVERED", "CONNECTED"].includes(row.state) || isLocal(row);
  });

  candidates.sort((a, b) => {
    const ladder = ladderRank(a) - ladderRank(b);
    if (ladder) return ladder;
    return costRank(a) - costRank(b);
  });

  const paidQpu = candidates.find((row) => row.compute_type === "qpu" && resourceCost(row) !== 0);
  const free = candidates.find((row) => resourceCost(row) === 0 || isSimulator(row) || isLocal(row));
  let selected = free || candidates[0] || null;

  if (selected && selected.compute_type === "qpu" && resourceCost(selected) !== 0 && human_authorization !== true) {
    return {
      status: "HOLD_HUMAN",
      reason: "PAID_QPU_REQUIRES_HUMAN",
      selected: null,
      candidates: candidates.map((row) => row.resource_id),
      paid_skipped: paidQpu?.resource_id || null,
      provider_preference: null,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }

  if (!selected) {
    return {
      status: required.length || task.architecture ? "HOLD_HUMAN" : "INCONCLUSIVE",
      reason: candidates.length ? "NO_EXECUTABLE_MATCH" : "CAPABILITY_MISMATCH",
      selected: null,
      mismatch: mismatch.map((row) => row.resource_id),
      missing: required,
      live: false,
    };
  }

  return {
    status: "SELECTED",
    selected: {
      provider: selected.provider,
      resource_id: selected.resource_id,
      compute_type: selected.compute_type,
      architecture: selected.architecture,
      state: selected.state,
      intelligence: false,
      authority: false,
      live: false,
    },
    candidates: candidates.map((row) => row.resource_id),
    ladder: SIMULATOR_LADDER,
    policy: mode,
    provider_preference: null,
    selection_is_not_authority: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function makeComputeExecution({
  provider,
  resource_id,
  task = {},
  request = {},
  result = {},
  status = "EXECUTED",
  submitted_at,
  started_at,
  completed_at,
  cost = null,
  measurement = null,
} = {}) {
  const submitted = iso(submitted_at);
  const request_hash = digest({ provider, resource_id, request, task: { type: task.type, shots: task.shots, gates: task.gates } });
  const task_hash = digest(task);
  const result_reference = result && Object.keys(result).length ? digest(result) : null;
  return {
    execution_id: id("xcmp"),
    provider: text(provider) || UNKNOWN,
    resource_id: text(resource_id) || UNKNOWN,
    request_hash,
    task_hash,
    submitted_at: submitted,
    started_at: started_at || null,
    completed_at: completed_at || null,
    status,
    result_reference,
    measurement: measurement || { observed: false, measured: false, proposed: true },
    cost: cost || { estimated_cost: UNKNOWN, actual_cost: UNKNOWN, currency: UNKNOWN, billing_unit: UNKNOWN },
    provenance: {
      method: COMPUTE_FABRIC_VERSION,
      operation: "executeComputeTask",
      invented: false,
    },
    observed: status === "EXECUTED" || status === "VERIFIED",
    measured: measurement?.measured === true,
    proposed: status === "HOLD_HUMAN" || status === "PROPOSED",
    live: false,
    certified: false,
    auto_merge: false,
    authority: "carl",
  };
}

export async function executeComputeTask({
  task = {},
  discovery = null,
  env = process.env,
  human_authorization = false,
  policy = "FREE_FIRST",
  now = new Date().toISOString(),
} = {}) {
  const routed = routeComputeTask({ task, discovery, policy, human_authorization });
  if (routed.status !== "SELECTED" || !routed.selected) {
    const pool = (discovery || snapshotComputeFabric({ env, now })).resources || [];
    const staleHit = pool.find((row) => matchesTask(row, { ...task, allow_simulator: task.allow_simulator }) && isStaleResource(row, Date.parse(now) || Date.now()).stale);
    const reason = staleHit ? "STALE_RESOURCE_METADATA" : routed.reason;
    const exec = makeComputeExecution({
      provider: staleHit?.provider || routed.selected?.provider,
      resource_id: staleHit?.resource_id || routed.selected?.resource_id,
      task,
      status: "HOLD_HUMAN",
      submitted_at: now,
    });
    exec.reason = reason;
    ledger.push(exec);
    return { status: "HOLD_HUMAN", reason, execution: exec, routed, live: false };
  }

  const adapter = getComputeAdapter(routed.selected.provider);
  const resource = (discovery || snapshotComputeFabric({ env, now })).resources
    .find((row) => row.resource_id === routed.selected.resource_id);

  if (!resource) {
    const exec = makeComputeExecution({
      provider: routed.selected.provider,
      resource_id: routed.selected.resource_id,
      task,
      status: "HOLD_HUMAN",
      submitted_at: now,
    });
    exec.reason = "UNAVAILABLE_RESOURCE";
    ledger.push(exec);
    return { status: "HOLD_HUMAN", reason: "UNAVAILABLE_RESOURCE", execution: exec, routed, live: false };
  }

  const stale = isStaleResource(resource, Date.parse(now) || Date.now());
  if (stale.stale) {
    const exec = makeComputeExecution({
      provider: resource.provider,
      resource_id: resource.resource_id,
      task,
      status: "HOLD_HUMAN",
      submitted_at: now,
    });
    exec.reason = "STALE_RESOURCE_METADATA";
    ledger.push(exec);
    return { status: "HOLD_HUMAN", reason: "STALE_RESOURCE_METADATA", execution: exec, routed, live: false };
  }

  const honest = assertHonestResource(resource);
  if (!honest.ok) {
    const exec = makeComputeExecution({
      provider: resource.provider,
      resource_id: resource.resource_id,
      task,
      status: "HOLD_HUMAN",
      submitted_at: now,
    });
    exec.reason = honest.reason;
    ledger.push(exec);
    return { status: "HOLD_HUMAN", reason: honest.reason, execution: exec, routed, live: false };
  }

  if (resource.compute_type === "qpu" && resourceCost(resource) !== 0 && human_authorization !== true) {
    const exec = makeComputeExecution({
      provider: resource.provider,
      resource_id: resource.resource_id,
      task,
      status: "HOLD_HUMAN",
      submitted_at: now,
    });
    exec.reason = "UNAUTHORIZED_EXECUTION";
    ledger.push(exec);
    return { status: "HOLD_HUMAN", reason: "UNAUTHORIZED_EXECUTION", execution: exec, routed, live: false };
  }

  const started = iso(now);
  const raw = await adapter.execute(resource, task, { env, human_authorization, now });
  const execution = makeComputeExecution({
    provider: resource.provider,
    resource_id: resource.resource_id,
    task,
    request: { type: task.type, shots: task.shots },
    result: raw.result || {},
    status: raw.status || "EXECUTED",
    submitted_at: now,
    started_at: raw.started_at || started,
    completed_at: raw.completed_at || iso(now),
    cost: raw.cost,
    measurement: {
      observed: raw.observed === true,
      measured: raw.measured === true,
      proposed: raw.proposed === true,
      duration_ms: raw.duration_ms ?? null,
    },
  });
  if (raw.status === "EXECUTED" && raw.observed === true && execution.result_reference) {
    execution.status = "VERIFIED";
    execution.measured = true;
  }
  if (raw.reason) execution.reason = raw.reason;
  ledger.push(execution);
  return {
    status: execution.status,
    execution,
    routed,
    result: raw.result || null,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function listExecutions() {
  return ledger.slice();
}

export function latestEvidence() {
  const last = ledger[ledger.length - 1];
  if (!last) return { status: UNKNOWN, proof: null, live: false };
  return { status: last.status, proof: last, live: false };
}

export function cortexComputeView({ discovery = null, env = process.env, now = new Date().toISOString() } = {}) {
  const snap = discovery || snapshotComputeFabric({ env, now });
  const resources = snap.resources || [];
  const byType = (type) => resources.filter((row) => row.compute_type === type);
  const cpu = byType("cpu")[0] || null;
  const gpu = byType("gpu")[0] || null;
  const hpc = byType("hpc")[0] || null;
  const quantumResources = resources.filter((row) => row.compute_type === "qpu" || row.compute_type === "simulator");
  const executions = listExecutions();
  const latest = latestEvidence();
  const classState = (row, definedIfMissing = "DEFINED") => {
    if (!row) return { status: definedIfMissing, capability: UNKNOWN, measured: false, live: false, certified: false };
    return {
      status: row.state,
      capability: row.capabilities,
      measured: row.state === "MEASURED" || row.state === "EXECUTABLE" || row.state === "VERIFIED",
      live: false,
      certified: false,
      resource_id: row.resource_id,
      architecture: row.architecture,
    };
  };
  return {
    title: "ACORN CORTEX",
    fabric: "COMPUTE FABRIC",
    constitution: computeConstitution(),
    cpu: classState(cpu, "DEFINED"),
    gpu: classState(gpu, "DEFINED"),
    hpc: classState(hpc, "DEFINED"),
    quantum: {
      discovered_providers: (snap.providers || [])
        .filter((p) => p.provider === "braket" || p.provider === "ibm" || p.provider === "local")
        .map((p) => ({
          provider: p.provider,
          adapter_defined: p.adapter_defined === true,
          provider_connected: p.provider_connected === true,
          qpu_execution_verified: p.qpu_execution_verified === true,
          status: p.status,
          authentication_state: p.authentication_state,
          live: false,
        })),
      discovered_qpus: quantumResources.filter((row) => row.compute_type === "qpu").map((row) => ({
        provider: row.provider,
        resource_id: row.resource_id,
        architecture: row.architecture,
        state: row.state,
        qubit_count: row.qubit_count,
        availability: row.availability,
        live: false,
        certified: false,
      })),
      availability: quantumResources.some((row) => row.state === "EXECUTABLE") ? "EXECUTABLE" : UNKNOWN,
      measured_capability: quantumResources.some((row) => row.state === "EXECUTABLE" || row.state === "MEASURED")
        ? quantumResources.filter((row) => row.state === "EXECUTABLE" || row.state === "MEASURED").map((row) => row.resource_id)
        : UNKNOWN,
    },
    executions: {
      total: executions.length,
      verified: executions.filter((row) => row.status === "VERIFIED").length,
      failed: executions.filter((row) => row.status === "FAILED").length,
      hold_human: executions.filter((row) => row.status === "HOLD_HUMAN").length,
    },
    evidence: {
      latest: latest.proof,
      proof: latest.proof,
      status: latest.status,
    },
    providers: snap.providers,
    no_fake_badge: true,
    live: false,
    certified: false,
    auto_merge: false,
    authority: "carl",
    observed_at: iso(now),
  };
}

export async function runComputeProofLoop({
  env = process.env,
  fetchImpl = null,
  now = new Date().toISOString(),
  task = { type: "quantum_simulation", required_capabilities: ["quantum_simulation"], shots: 128, qubits: 2, seed: 3 },
  human_authorization = false,
} = {}) {
  const discovered = await discoverCompute({ env, fetchImpl, now });
  const cpu = discovered.resources.find((row) => row.compute_type === "cpu");
  const sim = discovered.resources.find((row) => row.compute_type === "simulator");
  const gpu = discovered.resources.find((row) => row.compute_type === "gpu");
  const identified = {
    cpu: cpu?.resource_id || UNKNOWN,
    simulator: sim?.resource_id || UNKNOWN,
    gpu: gpu?.resource_id || UNKNOWN,
    qpu: discovered.resources.filter((row) => row.compute_type === "qpu").map((row) => row.resource_id),
  };
  const measured = [];
  for (const adapter of listComputeAdapters()) {
    for (const resource of discovered.resources.filter((row) => row.provider === adapter.provider_id)) {
      if (typeof adapter.measure === "function") {
        measured.push({ resource_id: resource.resource_id, ...(await adapter.measure(resource, { env, now })) });
      }
    }
  }
  const selected = routeComputeTask({ task, discovery: discovered, policy: "FREE_FIRST", human_authorization });
  const executed = selected.status === "SELECTED"
    ? await executeComputeTask({ task, discovery: discovered, env, human_authorization, now })
    : { status: selected.status, reason: selected.reason, execution: null };
  const observed = executed.execution
    ? { observed: executed.execution.observed, measured: executed.execution.measured, proposed: executed.execution.proposed }
    : { observed: false, measured: false, proposed: true };
  const recorded = executed.execution || null;
  const verified = recorded?.status === "VERIFIED";
  const view = cortexComputeView({ discovery: discovered, env, now });
  return {
    status: verified ? "VERIFIED" : executed.status,
    stages: {
      DISCOVER: discovered.status,
      IDENTIFY: identified,
      MEASURE: measured.some((row) => row.status === "MEASURED") ? "MEASURED" : UNKNOWN,
      SELECT: selected.status,
      EXECUTE: executed.status,
      OBSERVE: observed,
      RECORD: recorded ? recorded.execution_id : null,
      VERIFY: verified ? "VERIFIED" : "UNVERIFIED",
    },
    adapter_exists_is_not_provider_connected: true,
    provider_connected_is_not_qpu_verified: true,
    cpu_local_simulator: sim?.state === "EXECUTABLE",
    gpu_or_accelerator: gpu?.state === "EXECUTABLE" ? "EXECUTABLE" : gpu?.state || "DEFINED",
    real_qpu: discovered.providers.some((p) => p.qpu_execution_verified) ? "VERIFIED" : "HOLD_HUMAN",
    discovery: discovered,
    selected,
    executed,
    view,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

resetComputeFabric();

export { localAdapter, cudaqAdapter, makeResource };

if (import.meta.url === `file://${process.argv[1]}`) {
  const proof = await runComputeProofLoop({ env: process.env });
  const view = proof.view;
  const summary = {
    version: COMPUTE_FABRIC_VERSION,
    constitution: computeConstitution(),
    stages: proof.stages,
    cpu: view.cpu,
    gpu: view.gpu,
    hpc: view.hpc,
    quantum: view.quantum,
    executions: view.executions,
    evidence: (view.evidence?.latest || view.evidence?.proof) ? {
      execution_id: (view.evidence.latest || view.evidence.proof).execution_id,
      status: (view.evidence.latest || view.evidence.proof).status,
      result_reference: (view.evidence.latest || view.evidence.proof).result_reference,
    } : null,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
  writeFileSync("compute-fabric-evidence.json", `${JSON.stringify(summary, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}
