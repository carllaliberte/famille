#!/usr/bin/env node
/**
 * ACORN CONTINUOUS WORK ENGINE
 *
 * One persistent work graph over all Acorn fronts.
 *
 * It discovers work from the canonical organism runtime, ranks it by
 * information/capability/risk value, applies a resource budget, executes
 * only bounded deterministic actions by default, and emits a durable state
 * artifact. AI/model dispatch is opt-in and budgeted; default model budget is 0.
 *
 * HUMAN AUTHORITY: Carl.
 * EXECUTOR: replaceable.
 * CAPABILITY != AUTHORITY.
 * NO AUTO-MERGE.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { runContinuousRuntime } from "./acorn-continuous-runtime.mjs";
import { executeComputeTask, snapshotComputeFabric } from "./acorn-compute-fabric.mjs";
import { runUniversalComputeSweep } from "./acorn-universal-compute-sweep.mjs";
import { runValueOpportunityCycle } from "./acorn-value-opportunity-fabric.mjs";
import { gatewayPolicy, buildDeveloperConnectManifest } from "./acorn-developer-gateway.mjs";
import { runMarketCycle } from "./acorn-market-engine.mjs";
import { contributionSettlementReadiness, economyPolicy } from "./acorn-contribution-economy.mjs";
import { revenuePolicy, measureRevenueEconomics, measureCommercialYield, chooseRevenueOpportunities, buildCommercialActionPlan, consolidateBilling, consolidateCryptoSettlement, buildTaxReadyLedger } from "./acorn-revenue-maximizer.mjs";
import { universalProjectValueCycle } from "./acorn-universal-project-value.mjs";
import { privacyPolicy, privacyAudit } from "./acorn-privacy-process.mjs";
import { runConnectionSweep } from "./acorn-connection-fabric.mjs";
import { snapshotFreeFirstCloud, createResource, buildFreeFirstPlan } from "./acorn-free-first-cloud-fabric.mjs";
import { economicPolicy, measureUnitEconomics, economicAllocation } from "./acorn-economic-optimizer.mjs";
import {
  RESOURCE_GOVERNOR_VERSION,
  limitsFromEnv,
  governorSnapshot,
  reserve,
} from "./acorn-resource-governor.mjs";

export const CONTINUOUS_WORK_ENGINE_VERSION = "acorn.continuous-work-engine.v2";

const TERMINAL = new Set(["COMPLETED", "REJECTED", "QUARANTINED"]);
const ACTIVE = new Set(["READY", "RUNNING", "VERIFYING", "BLOCKED_BUDGET", "WAITING_HUMAN"]);

function text(value) {
  return String(value ?? "").trim();
}

function readJson(path, fallback) {
  try { return JSON.parse(readFileSync(path, "utf8")); } catch { return fallback; }
}

function clamp(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
}

function workId(row, prefix = "work") {
  const raw = text(row.id || row.subject || row.path || prefix).replace(/[^a-zA-Z0-9._:-]+/g, "-");
  return `${prefix}:${raw}`;
}

export function canonicalWorkFromRuntime(runtime) {
  const rows = [];
  const push = (row, source) => {
    if (!row) return;
    rows.push({
      id: workId(row),
      source,
      subject: text(row.subject || row.id || "unknown-work"),
      state: text(row.state || "READY") || "READY",
      information_gain: clamp(row.information_gain),
      capability_gain: clamp(row.capability_gain),
      risk_reduction: clamp(row.risk_reduction),
      cost: clamp(row.cost),
      uncertainty: clamp(row.uncertainty ?? row.unknown ?? 0),
      reversibility: clamp(row.reversibility ?? 1),
      dependencies: Array.isArray(row.dependencies) ? row.dependencies : [],
      human_required: row.human_required === true,
      capability: text(row.capability || ""),
      execution_kind: text(row.execution_kind || row.executor || "deterministic"),
      task: row.task && typeof row.task === "object" ? row.task : null,
    });
  };

  const workRows = (value, keys = []) => {
    if (Array.isArray(value)) return value;
    if (!value || typeof value !== "object") return [];
    for (const key of keys) {
      if (Array.isArray(value[key])) return value[key];
    }
    return Object.keys(value).some((key) => key === "id" || key === "subject")
      ? [value]
      : [];
  };

  for (const row of workRows(runtime?.unified?.evolution?.next_work, ["items", "next", "next_work"])) push(row, "evolution");
  for (const row of workRows(runtime?.unified?.learning?.next, ["items", "next", "next_work"])) push(row, "learning");
  for (const row of workRows(runtime?.unified?.metabolism?.next, ["items", "next", "next_work"])) push(row, "metabolism");

  push({ id:"value-opportunity-cycle", subject:"measure public access, business value, and commercial recovery opportunities", information_gain:1, capability_gain:0.8, risk_reduction:0.6, uncertainty:0.8, reversibility:1, cost:0.1, execution_kind:"value-opportunity" }, "value");

  push({ id:"connection-sweep", subject:"discover, authenticate, measure and verify all available connection adapters", information_gain:1, capability_gain:1, risk_reduction:0.9, uncertainty:0.9, reversibility:1, cost:0.1, execution_kind:"connection-sweep" }, "connections");
  push({ id:"privacy-process-audit", subject:"minimize data, redact secrets, enforce retention and reduce human administration", information_gain:1, capability_gain:0.9, risk_reduction:1, uncertainty:0.8, reversibility:1, cost:0.05, execution_kind:"privacy-audit" }, "privacy");
  push({ id:"developer-gateway-sweep", subject:"keep universal developer onboarding and connection readiness measured", information_gain:1, capability_gain:1, risk_reduction:0.8, uncertainty:0.8, reversibility:1, cost:0.05, execution_kind:"developer-gateway" }, "developer");
  push({ id:"market-engine-cycle", subject:"detect demand, diversify verified offers, and prepare measured commercial collection", information_gain:1, capability_gain:1, risk_reduction:0.7, uncertainty:0.9, reversibility:1, cost:0.08, execution_kind:"market" }, "market");
  push({ id:"contribution-economy-cycle", subject:"allocate measured contribution rewards only through verified settlement rails", information_gain:0.8, capability_gain:0.8, risk_reduction:0.9, uncertainty:0.8, reversibility:1, cost:0.05, execution_kind:"contribution-economy" }, "economy");
  push({ id:"revenue-maximization-cycle", subject:"maximize verified net revenue while preserving Acorn essence and open access", information_gain:1, capability_gain:1, risk_reduction:0.8, uncertainty:0.9, reversibility:1, cost:0.06, execution_kind:"revenue-maximization" }, "revenue");
  push({ id:"universal-project-value-cycle", subject:"turn human intention into a verified project, reusable product and measured value", information_gain:1, capability_gain:1, risk_reduction:0.8, uncertainty:0.9, reversibility:1, cost:0.07, execution_kind:"universal-project-value" }, "project-value");

  push({ id:"free-first-cloud-sweep", subject:"discover, classify, verify and measure free-first cloud resources", information_gain:1, capability_gain:1, risk_reduction:0.9, uncertainty:1, reversibility:1, cost:0.1, execution_kind:"free-first-cloud" }, "cloud");
  push({ id:"economic-optimization-cycle", subject:"maximize verified net value and crypto yield per unit of resource", information_gain:1, capability_gain:0.8, risk_reduction:0.7, uncertainty:0.9, reversibility:1, cost:0.05, execution_kind:"economic-optimization" }, "economy");

  // Compute is part of the organism metabolism: execute every currently
  // executable safe resource, while keeping remote/paid/unknown work gated.
  push({
    id: "universal-compute-sweep",
    subject: "execute all currently executable compute resources",
    information_gain: 1,
    capability_gain: 1,
    risk_reduction: 0.8,
    uncertainty: 0.8,
    reversibility: 1,
    cost: 0.1,
    execution_kind: "compute-sweep",
  }, "compute");

  if (!rows.length) {
    const coverage = runtime?.coverage || {};
    push({
      id: "inventory-revalidation",
      subject: "revalidate capability inventory",
      information_gain: 1 - clamp(coverage.verified_count / Math.max(1, coverage.discovered_count)),
      capability_gain: 1 - clamp(coverage.measured_count / Math.max(1, coverage.discovered_count)),
      risk_reduction: clamp(coverage.verified_count / Math.max(1, coverage.discovered_count)),
      cost: 0.1,
      reversibility: 1,
    }, "fallback");
  }

  return deduplicateWork(rows);
}

export function deduplicateWork(rows = []) {
  const map = new Map();
  for (const row of rows) {
    const existing = map.get(row.id);
    if (!existing || scoreWork(row) > scoreWork(existing)) map.set(row.id, row);
  }
  return [...map.values()];
}

export function scoreWork(row = {}) {
  const gain = (
    0.30 * clamp(row.information_gain) +
    0.25 * clamp(row.capability_gain) +
    0.25 * clamp(row.risk_reduction) +
    0.10 * clamp(row.uncertainty) +
    0.10 * clamp(row.reversibility)
  );
  const cost = 0.05 + 0.95 * clamp(row.cost);
  return Number((gain / cost).toFixed(6));
}

export function rankWork(rows = []) {
  return [...rows]
    .filter((row) => !TERMINAL.has(row.state))
    .map((row) => ({ ...row, priority: scoreWork(row) }))
    .sort((a, b) => b.priority - a.priority);
}

export function workState({ previous = {}, discovered = [] } = {}) {
  const old = new Map((previous.queue || []).map((row) => [row.id, row]));
  const queue = discovered.map((row) => {
    const prior = old.get(row.id);
    return {
      ...row,
      state: prior?.state === "COMPLETED" && row.repeatable !== false ? row.state : (prior?.state || row.state),
      attempts: Number(prior?.attempts || 0),
      cycle_count: prior?.state === "COMPLETED" && row.repeatable !== false ? Number(prior?.cycle_count || 0) + 1 : Number(prior?.cycle_count || 0),
      optimization: { basis: Array.isArray(previous.history) && previous.history.length ? "measured_history" : "initial_measurement" },
      last_error: prior?.last_error || null,
      last_completed_at: prior?.last_completed_at || null,
      priority: scoreWork(row),
    };
  });
  return { queue: rankWork(queue, { history: previous.history || [] }), updated_at: new Date().toISOString() };
}

function executeDeterministic({ root, task, env }) {
  const command = task.command || env.ACORN_WORK_DETERMINISTIC_COMMAND || "node --check scripts/acorn-continuous-runtime.mjs";
  const [bin, ...args] = command.split(/\s+/).filter(Boolean);
  const started = Date.now();
  const result = spawnSync(bin, args, {
    cwd: root,
    env: { ...env, CI: "true" },
    encoding: "utf8",
    timeout: Math.max(5_000, Number(env.ACORN_WORK_TASK_TIMEOUT_MS || 90_000)),
    maxBuffer: 2 * 1024 * 1024,
  });
  return {
    status: result.status === 0 ? "COMPLETED" : "FAILED",
    exit_code: result.status,
    signal: result.signal || null,
    duration_ms: Date.now() - started,
    stdout_tail: text(result.stdout).slice(-4000),
    stderr_tail: text(result.stderr).slice(-4000),
    executor: "deterministic-ci",
  };
}

export async function executeWorkTask({ root, task, env = process.env, computeDiscovery = null } = {}) {
  const kind = text(task.execution_kind || "deterministic").toLowerCase();
  if (kind === "value-opportunity") {
    const started = Date.now();
    const result = runValueOpportunityCycle({ opportunities: task.opportunities || [], observations: task.observations || [] });
    return { status:"COMPLETED", duration_ms:Date.now()-started, executor:"value-opportunity-fabric", value:result, stdout_tail:"", stderr_tail:"" };
  }
  if (kind === "privacy-audit") { const started=Date.now(); const result=privacyAudit({events:task.events||[],records:task.records||[]}); return {status:result.status==="PASS"?"COMPLETED":"FAILED",duration_ms:Date.now()-started,executor:"privacy-process-fabric",privacy:{policy:privacyPolicy(),audit:result},stdout_tail:"",stderr_tail:result.status==="PASS"?"":"PRIVACY_AUDIT_FAILED"}; }
  if (kind === "developer-gateway") { const started=Date.now(); const manifest=buildDeveloperConnectManifest({capabilities:task.capabilities||[],protocols:["connector-flux"]}); return {status:"COMPLETED",duration_ms:Date.now()-started,executor:"developer-gateway-fabric",developer:{policy:gatewayPolicy(),manifest},stdout_tail:"",stderr_tail:""}; }
  if (kind === "market") { const started=Date.now(); const result=runMarketCycle({signals:task.signals||[],capabilityIndex:task.capabilityIndex||[]}); return {status:"COMPLETED",duration_ms:Date.now()-started,executor:"market-engine",market:result,stdout_tail:"",stderr_tail:""}; }
  if (kind === "contribution-economy") { const started=Date.now(); const readiness=contributionSettlementReadiness({paymentRail:task.paymentRail||null,destination:task.destination||null}); return {status:"COMPLETED",duration_ms:Date.now()-started,executor:"contribution-economy",economy:{policy:economyPolicy(),settlement:readiness},stdout_tail:"",stderr_tail:""}; }
  if (kind === "universal-project-value") { const started = Date.now(); const result = universalProjectValueCycle(task.project || task); return { status:"COMPLETED", duration_ms:Date.now()-started, executor:"universal-project-value-engine", project_value:result, stdout_tail:"", stderr_tail:"" }; }
  if (kind === "revenue-maximization") { const started=Date.now(); const economics=measureRevenueEconomics(task.economics||{}); const commercial_yield=measureCommercialYield(task.commercial_yield||{}); const opportunities=chooseRevenueOpportunities(task.opportunities||[],{max:Number(task.max_opportunities||10)}); const action_plan=buildCommercialActionPlan({opportunities:task.opportunities||[],capabilities:task.capabilities||[],existing_customers:task.existing_customers||[]}); const billing=consolidateBilling({customer_id:task.customer_id||null,period:task.period||null,events:task.billing_events||[],currency:task.currency||"USD",settlement_threshold:task.settlement_threshold||0}); const crypto=consolidateCryptoSettlement({customer_id:task.customer_id||null,period:task.period||null,invoices:task.crypto_invoices||[],rail:task.payment_rail||null,minimum_threshold:task.crypto_threshold||0}); const tax=buildTaxReadyLedger({customer_id:task.customer_id||null,period:task.period||null,invoices:task.billing_events||[],settlements:task.crypto_invoices||[],costs:task.costs||[]}); return {status:"COMPLETED",duration_ms:Date.now()-started,executor:"revenue-maximizer",revenue:{policy:revenuePolicy(),economics,commercial_yield,opportunities,action_plan,billing,crypto_settlement:crypto,tax_ready:tax},stdout_tail:"",stderr_tail:""}; }
  if (kind === "connection-sweep") {
    const started = Date.now();
    const result = await runConnectionSweep({ env, now: new Date().toISOString() });
    return {
      status: result.proof?.status === "VERIFIED" ? "COMPLETED" : "FAILED",
      duration_ms: Date.now() - started,
      executor: "connection-fabric",
      connections: result,
      stdout_tail: "",
      stderr_tail: result.proof?.status === "VERIFIED" ? "" : "CONNECTION_SWEEP_NOT_VERIFIED",
    };
  }
  if (kind === "economic-optimization") {
    const started = Date.now();
    const economics = measureUnitEconomics(task.economics || {});
    const allocation = economicAllocation({resources:task.resources || [], opportunities:task.opportunities || [], budget:task.budget || 0});
    return { status:"COMPLETED", duration_ms:Date.now()-started, executor:"economic-optimizer", economy:{policy:economicPolicy(),measurement:economics,allocation}, stdout_tail:"", stderr_tail:"" };
  }
  if (kind === "free-first-cloud") {
    const started = Date.now();
    const resources = [
      createResource({ id:"github:public-actions", provider:"github", name:"GitHub public repository Actions", resource_class:"FREE_PERMANENT", state:"DISCOVERED", capabilities:["ci","compute","test"], metadata:{verification_required:true} }),
      createResource({ id:"oracle:always-free", provider:"oracle", name:"Oracle Cloud Always Free", resource_class:"FREE_PERMANENT", state:"DISCOVERED", capabilities:["compute","storage","database","network"], metadata:{verification_required:true} }),
      createResource({ id:"cloudflare:free", provider:"cloudflare", name:"Cloudflare Free services", resource_class:"FREE_QUOTA", state:"DISCOVERED", capabilities:["edge","worker","network","storage"], metadata:{verification_required:true} })
    ];
    const snapshot = snapshotFreeFirstCloud({ resources });
    const plan = buildFreeFirstPlan(resources);
    return { status:"COMPLETED", duration_ms:Date.now()-started, executor:"free-first-cloud-fabric", cloud:{snapshot,plan}, stdout_tail:"", stderr_tail:"" };
  }
  if (kind === "compute-sweep") {
    const started = Date.now();
    const result = await runUniversalComputeSweep({ env, human_authorization: task.human_authorization === true, policy: task.policy || "FREE_FIRST" });
    return {
      status: result.executed_count > 0 || result.held_count > 0 ? "COMPLETED" : "FAILED",
      duration_ms: Date.now() - started,
      executor: "compute-fabric-sweep",
      compute: result,
      stdout_tail: "",
      stderr_tail: result.executed_count === 0 && result.held_count === 0 ? "NO_COMPUTE_RESOURCE_EXECUTED_OR_HELD" : "",
    };
  }
  if (kind === "compute" || kind === "quantum" || kind === "qpu" || kind === "simulator") {
    const started = Date.now();
    const computeTask = {
      ...(task.task && typeof task.task === "object" ? task.task : {}),
      type: task.task?.type || (kind === "quantum" || kind === "qpu" || kind === "simulator" ? "quantum_simulation" : "compute"),
      allow_simulator: task.task?.allow_simulator !== false,
    };
    const discovery = computeDiscovery || snapshotComputeFabric({ env, now: new Date().toISOString() });
    const result = await executeComputeTask({
      task: computeTask,
      discovery,
      env,
      human_authorization: task.human_authorization === true,
      policy: task.policy || "FREE_FIRST",
    });
    return {
      status: result.status === "VERIFIED" || result.status === "EXECUTED" ? "COMPLETED"
        : result.status === "HOLD_HUMAN" ? "WAITING_HUMAN" : "FAILED",
      duration_ms: Date.now() - started,
      executor: "compute-fabric",
      compute: result,
      stdout_tail: "",
      stderr_tail: result.reason || "",
    };
  }
  return executeDeterministic({ root, task, env });
}

export function executorPolicy({ env = process.env } = {}) {
  const allowModels = text(env.ACORN_ALLOW_MODEL_DISPATCH).toLowerCase() === "true";
  const modelCalls = Number(env.ACORN_BUDGET_MODEL_CALLS || 0);
  const tokens = Number(env.ACORN_BUDGET_MODEL_TOKENS || 0);
  return {
    deterministic: true,
    model_dispatch: allowModels && modelCalls > 0 && tokens > 0,
    model_calls_budget: Number.isFinite(modelCalls) ? modelCalls : 0,
    model_tokens_budget: Number.isFinite(tokens) ? tokens : 0,
    auto_merge: false,
    auto_spend: false,
    authority: "carl",
  };
}

function defaultTaskFor(row, env = process.env) {
  if (row.execution_kind === "value-opportunity") return { ...row, execution_kind:"value-opportunity", resource_cost:{actions:1,cpu_ms:10000} };
  if (row.execution_kind === "privacy-audit") return { ...row, execution_kind:"privacy-audit", resource_cost:{actions:1,cpu_ms:10000} };
  if (row.execution_kind === "economic-optimization") return { ...row, execution_kind:"economic-optimization", resource_cost:{actions:1,cpu_ms:5000} };
  if (row.execution_kind === "developer-gateway") return { ...row, execution_kind:"developer-gateway", resource_cost:{actions:1,cpu_ms:10000} };
  if (row.execution_kind === "market") return { ...row, execution_kind:"market", resource_cost:{actions:1,cpu_ms:10000} };
  if (row.execution_kind === "contribution-economy") return { ...row, execution_kind:"contribution-economy", resource_cost:{actions:1,cpu_ms:10000} };
  if (row.execution_kind === "revenue-maximization") return { ...row, execution_kind:"revenue-maximization", resource_cost:{actions:1,cpu_ms:10000} };
  if (row.execution_kind === "universal-project-value") return { ...row, execution_kind:"universal-project-value", resource_cost:{actions:1,cpu_ms:12000} };
  if (row.execution_kind === "connection-sweep") {
    return { ...row, execution_kind: "connection-sweep", resource_cost: { actions: 1, cpu_ms: 30_000 } };
  }
  if (row.execution_kind === "compute-sweep") {
    return { ...row, execution_kind: "compute-sweep", resource_cost: { actions: 1, cpu_ms: 30_000 } };
  }
  if (row.subject.includes("inventory") || row.source === "fallback") {
    return { ...row, command: env.ACORN_WORK_DETERMINISTIC_COMMAND || "node --check scripts/acorn-continuous-runtime.mjs", resource_cost: { actions: 1, cpu_ms: 30_000 } };
  }
  return { ...row, command: env.ACORN_WORK_DETERMINISTIC_COMMAND || "node --check scripts/acorn-continuous-runtime.mjs", resource_cost: { actions: 1, cpu_ms: 30_000 } };
}

export async function runContinuousWorkEngine({
  root = resolve("."),
  env = process.env,
  statePath = resolve(root, "evidence/autopilot/continuous-work-state.json"),
  at = new Date().toISOString(),
  runtime = null,
  previous = null,
} = {}) {
  const prior = previous || readJson(statePath, { queue: [], usage: {}, history: [] });
  const organism = runtime || await runContinuousRuntime({
    root,
    env,
    at,
    previous: prior.runtime_entries || [],
    evidencePath: resolve(root, "evidence/autopilot/continuous-runtime.json"),
    operation: "inventory",
  });

  const discovered = canonicalWorkFromRuntime(organism);
  const graph = workState({ previous: prior, discovered });
  const limits = limitsFromEnv(env);
  const usage = prior.usage || {};
  const policy = executorPolicy({ env });

  let currentUsage = { ...usage };
  const completed = [];
  const blocked = [];
  const history = Array.isArray(prior.history) ? prior.history.slice(-100) : [];

  for (const candidate of graph.queue) {
    if (candidate.human_required) {
      blocked.push({ ...candidate, state: "WAITING_HUMAN", reason: "HUMAN_AUTHORITY_REQUIRED" });
      continue;
    }
    const task = defaultTaskFor(candidate, env);
    const reservation = reserve({
      limits,
      usage: currentUsage,
      cost: task.resource_cost,
      label: candidate.id,
    });
    if (reservation.status !== "RESERVED") {
      blocked.push({ ...candidate, state: "BLOCKED_BUDGET", reason: reservation.decision.insufficient });
      continue;
    }
    currentUsage = reservation.usage;

    const execution = await executeWorkTask({ root, task, env });
    const next = {
      ...candidate,
      state: execution.status === "COMPLETED" ? "COMPLETED" : "VERIFYING",
      attempts: candidate.attempts + 1,
      last_error: execution.status === "COMPLETED" ? null : execution.stderr_tail,
      last_completed_at: execution.status === "COMPLETED" ? new Date().toISOString() : null,
      execution,
      executor: execution.executor || "deterministic-ci",
      model_dispatched: false,
    };
    if (execution.status === "COMPLETED") completed.push(next);
    else blocked.push({ ...next, state: "VERIFYING", reason: "DETERMINISTIC_EXECUTION_FAILED" });
    history.push({
      at: new Date().toISOString(),
      work_id: candidate.id,
      state: next.state,
      executor: next.executor,
      duration_ms: execution.duration_ms,
      model_dispatched: false,
    });
    if (completed.length >= Number(env.ACORN_WORK_MAX_TASKS || 3)) break;
  }

  const queue = graph.queue.map((row) => {
    const hit = [...completed, ...blocked].find((x) => x.id === row.id);
    return hit || row;
  });

  const snapshot = {
    version: CONTINUOUS_WORK_ENGINE_VERSION,
    resource_governor: RESOURCE_GOVERNOR_VERSION,
    observed_at: at,
    state: blocked.some((row) => row.state === "WAITING_HUMAN") ? "WAITING_HUMAN"
      : blocked.some((row) => row.state === "BLOCKED_BUDGET") ? "BUDGET_PAUSED"
      : "CONTINUING",
    queue: rankWork(queue),
    completed_count: completed.length,
    blocked_count: blocked.length,
    usage: currentUsage,
    governor: governorSnapshot({ env, limits, usage: currentUsage }),
    executor_policy: policy,
    runtime: {
      state: organism.state,
      coverage: organism.coverage,
      cycle_order: organism.unified?.cycle_order || [],
    },
    next_action: rankWork(queue.filter((row) => !TERMINAL.has(row.state)))[0] || null,
    history,
    auto_merge: false,
    auto_spend: false,
    live: false,
    authority: "carl",
  };

  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(snapshot, null, 2)}\n`);
  return snapshot;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runContinuousWorkEngine();
  console.log(JSON.stringify(result, null, 2));
}
