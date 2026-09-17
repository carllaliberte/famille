#!/usr/bin/env node
/**
 * ACORN CAPABILITY INVENTORY
 *
 * Generic discovery of Acorn's own executable modules.
 * DISCOVERED ≠ DEFINED ≠ LOADABLE ≠ WIRED ≠ DEPLOYED ≠ EXECUTED ≠ MEASURED ≠ VERIFIED ≠ LIVE.
 * No hardcoded script allowlist. Absence of proof is UNKNOWN, never a silent zero.
 * MAIN = REALITY. A file on disk is not an operational capability.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";

export const INVENTORY_VERSION = "acorn.capability-inventory.v1";
export const LIFECYCLE = Object.freeze([
  "DISCOVERED",
  "DEFINED",
  "LOADABLE",
  "WIRED",
  "DEPLOYED",
  "EXECUTED",
  "MEASURED",
  "VERIFIED",
  "LIVE",
  "QUARANTINED",
  "DRIFTED",
  "FAILED",
]);

const POSITIVE = Object.freeze([
  "DISCOVERED", "DEFINED", "LOADABLE", "WIRED", "DEPLOYED",
  "EXECUTED", "MEASURED", "VERIFIED", "LIVE",
]);

const SKIP_DIR = new Set([
  ".git", "node_modules", ".ots-anchor", "evidence", "imagine",
  "patches", ".husky", ".cursor", ".acorn",
]);

const ROOT_CONVENTIONS = Object.freeze([
  { dir: "scripts", ext: /\.(mjs|js)$/, kind: "script" },
  { dir: ".github/swarm", ext: /\.mjs$/, kind: "swarm" },
  { dir: "sdk", ext: /\.js$/, kind: "sdk" },
  { dir: "schema", ext: /\.json$/, kind: "contract" },
  { dir: ".github/workflows", ext: /\.ya?ml$/, kind: "workflow" },
  { dir: "test", ext: /\.test\.(js|mjs)$/, kind: "test" },
]);

const PROBE_EXPORTS = new Set([
  "inventoryProbe",
  "capabilityProbe",
  "defenseConstitution",
  "cortexConstitution",
  "controlState",
]);

const IMPORT_RE = /(?:from\s+|import\s*\()\s*["'](\.[^"']+)["']/g;
const NODE_RUN_RE = /\bnode(?:\s+[.\w/-]+)*\s+((?:scripts|\.github\/swarm|sdk)\/[.\w/-]+\.m?js)/g;
const EXPORT_RE = /export\s+(?:async\s+)?(?:function|class|const|let|var|default|{)/;

function text(v) {
  return String(v ?? "").trim();
}

function rel(root, abs) {
  return relative(root, abs).replace(/\\/g, "/");
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex");
}

function walkFiles(root, dir, out = []) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (SKIP_DIR.has(entry.name) || entry.name.startsWith(".")) {
      if (entry.name !== ".github") continue;
    }
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(root, abs, out);
    else out.push(abs);
  }
  return out;
}

function readJson(path, fallback = null) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback;
  }
}

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

function isTestFile(name) {
  return /\.test\.(mjs|js|cjs)$/.test(name) || /(^|\/)test\//.test(name);
}

function conventionKind(relativePath, explicit) {
  if (explicit) return explicit;
  if (relativePath.startsWith("scripts/")) return "script";
  if (relativePath.startsWith(".github/swarm/")) return "swarm";
  if (relativePath.startsWith("sdk/")) return "sdk";
  if (relativePath.startsWith("schema/")) return "contract";
  if (relativePath.startsWith(".github/workflows/")) return "workflow";
  if (relativePath.startsWith("test/")) return "test";
  return "module";
}

export function organOf(relativePath = "", kind = "") {
  const path = String(relativePath);
  if (kind === "contract") return "schema";
  if (kind === "workflow") return "workflow";
  if (kind === "test") return "test";
  if (/defense|breaker/.test(path)) return "defense";
  if (/cortex/.test(path)) return "cortex";
  if (/fabric/.test(path)) return "fabric";
  if (/mirror|backup|drive|evidence-seal|provenance/.test(path)) return "evidence";
  if (/memory|learn|evolv/.test(path)) return "memory";
  if (/connector|adapter|provider|lane|open-channel|open-intelligence/.test(path)) return "adapter";
  if (/runtime|worker|inventory|continuous/.test(path)) return "runtime";
  return kind || "module";
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith(".")) return null;
  const base = resolve(dirname(fromFile), spec);
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of [".mjs", ".js", ".cjs"]) {
    if (existsSync(base + ext)) return base + ext;
  }
  if (existsSync(base) && statSync(base).isDirectory()) {
    for (const name of ["index.mjs", "index.js"]) {
      const inner = join(base, name);
      if (existsSync(inner)) return inner;
    }
  }
  return null;
}

function collectImports(source, fromFile) {
  const hits = [];
  IMPORT_RE.lastIndex = 0;
  let match;
  while ((match = IMPORT_RE.exec(source))) {
    const abs = resolveImport(fromFile, match[1]);
    if (abs) hits.push(abs);
  }
  return hits;
}

function collectNodeInvocations(source, root) {
  const hits = [];
  NODE_RUN_RE.lastIndex = 0;
  let match;
  while ((match = NODE_RUN_RE.exec(source))) {
    const abs = resolve(root, match[1]);
    if (existsSync(abs)) hits.push(abs);
  }
  return hits;
}

function hasImportGuard(source) {
  return /import\.meta\.url/.test(source) || /\bisMain\s*\(/.test(source);
}

function isRunningEntrypoint(abs) {
  const argv1 = process.argv[1];
  if (!argv1) return false;
  try {
    return resolve(abs) === resolve(argv1);
  } catch {
    return false;
  }
}

function exportNamesFromSource(source) {
  const names = [];
  const named = source.matchAll(/export\s+(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g);
  for (const row of named) names.push(row[1]);
  const brace = source.match(/export\s*{([^}]+)}/g) || [];
  for (const block of brace) {
    for (const part of block.replace(/export\s*{/, "").replace(/}/, "").split(",")) {
      const token = part.split(/\bas\b/).pop().trim();
      if (token) names.push(token);
    }
  }
  return [...new Set(names)];
}

export function inventoryConstitution() {
  return Object.freeze({
    version: INVENTORY_VERSION,
    owner: "acorn",
    one_inventory: true,
    second_runtime: false,
    second_cortex: false,
    second_defense: false,
    second_breaker: false,
    second_fabric: false,
    no_script_allowlist: true,
    discovered_is_not_deployed: true,
    deployed_is_not_executed: true,
    executed_is_not_verified: true,
    verified_is_not_live: true,
    assertion_is_not_evidence: true,
    capability_is_not_authority: true,
    auto_merge: false,
    silent_fallback: false,
    live: false,
    authority: "carl",
  });
}

export function inventoryProbe() {
  return {
    ok: true,
    version: INVENTORY_VERSION,
    auto_merge: false,
    live: false,
    authority: "carl",
  };
}

export function defaultSyntaxCheck(abs) {
  if (/\.json$/.test(abs)) {
    try {
      JSON.parse(readFileSync(abs, "utf8"));
      return { loadable: true, reason: "JSON_OK" };
    } catch (error) {
      return { loadable: false, failed: true, reason: "JSON_FAILED", error: String(error?.message || error).slice(0, 240) };
    }
  }
  if (/\.ya?ml$/.test(abs)) {
    const body = readText(abs);
    if (!body.trim()) return { loadable: false, failed: true, reason: "YAML_EMPTY" };
    return { loadable: true, reason: "YAML_PRESENT" };
  }
  try {
    execFileSync(process.execPath, ["--check", abs], { stdio: "pipe", encoding: "utf8" });
    return { loadable: true, reason: "SYNTAX_OK" };
  } catch (error) {
    return { loadable: false, failed: true, reason: "SYNTAX_FAILED", error: String(error?.message || error).slice(0, 240) };
  }
}

function discoverFiles(root) {
  const found = [];
  for (const convention of ROOT_CONVENTIONS) {
    const dir = join(root, convention.dir);
    if (!existsSync(dir)) continue;
    for (const abs of walkFiles(root, dir)) {
      const relativePath = rel(root, abs);
      if (convention.kind !== "test" && isTestFile(relativePath)) continue;
      if (!convention.ext.test(relativePath) && !convention.ext.test(extname(abs))) continue;
      found.push({ abs, relativePath, kind: conventionKind(relativePath, convention.kind) });
    }
  }
  return found;
}

function packageBindings(root) {
  const pkg = readJson(join(root, "package.json"), {});
  const exports = pkg?.exports && typeof pkg.exports === "object" ? pkg.exports : {};
  const scripts = pkg?.scripts && typeof pkg.scripts === "object" ? pkg.scripts : {};
  const exported = new Map();
  for (const [key, value] of Object.entries(exports)) {
    const target = typeof value === "string" ? value : value?.import || value?.default || "";
    if (!target) continue;
    const abs = resolve(root, target.replace(/^\.\//, ""));
    if (existsSync(abs)) exported.set(abs, { exportKey: key, target });
  }
  const npm = new Map();
  for (const [name, cmd] of Object.entries(scripts)) {
    for (const abs of collectNodeInvocations(String(cmd), root)) {
      npm.set(abs, name);
    }
  }
  return { exported, npm, pkg };
}

function workflowBindings(root) {
  const dir = join(root, ".github/workflows");
  const scheduled = new Map();
  const referenced = new Map();
  if (!existsSync(dir)) return { scheduled, referenced };
  for (const name of readdirSync(dir)) {
    if (!/\.ya?ml$/.test(name)) continue;
    const abs = join(dir, name);
    const source = readText(abs);
    const isScheduled = /^\s+(schedule|push|workflow_dispatch):/m.test(source);
    for (const hit of collectNodeInvocations(source, root)) {
      referenced.set(hit, name);
      if (isScheduled) scheduled.set(hit, name);
    }
  }
  return { scheduled, referenced };
}

function testBindings(root) {
  const tests = new Map();
  const testDir = join(root, "test");
  if (!existsSync(testDir)) return tests;
  for (const abs of walkFiles(root, testDir)) {
    if (!/\.test\.(js|mjs)$/.test(abs)) continue;
    const source = readText(abs);
    for (const hit of collectImports(source, abs)) tests.set(hit, rel(root, abs));
  }
  return tests;
}

function importGraph(root, files) {
  const importers = new Map();
  const add = (target, from) => {
    if (!importers.has(target)) importers.set(target, new Set());
    importers.get(target).add(from);
  };
  for (const file of files) {
    const source = readText(file.abs);
    for (const hit of collectImports(source, file.abs)) add(hit, file.relativePath);
  }
  return importers;
}

function lifecycleOf(states) {
  if (states.quarantined) return "QUARANTINED";
  if (states.failed) return "FAILED";
  if (states.drifted) return "DRIFTED";
  let last = "DISCOVERED";
  for (const name of POSITIVE) {
    if (states[name.toLowerCase()] === true) last = name;
    else break;
  }
  return last;
}

function unknownIfMissing(numerator, denominator) {
  if (!Number.isFinite(denominator) || denominator <= 0) return "UNKNOWN";
  if (!Number.isFinite(numerator) || numerator < 0) return "UNKNOWN";
  return Number((numerator / denominator).toFixed(4));
}

export function deploymentIntegrity(entries = []) {
  const findings = [];
  for (const entry of entries) {
    const s = entry.states || {};
    if (s.discovered === true && s.loadable === true && s.wired !== true) {
      findings.push({ subject: entry.id, kind: "UNWIRED", reason: "executable present but unwired" });
    }
    if (s.wired === true && s.deployed !== true) {
      findings.push({ subject: entry.id, kind: "UNDEPLOYED", reason: "wired but undeployed" });
    }
    if (s.deployed === true && s.executed !== true) {
      findings.push({ subject: entry.id, kind: "UNEXECUTED", reason: "deployed but never executed" });
    }
    if (s.executed === true && s.measured !== true) {
      findings.push({ subject: entry.id, kind: "UNMEASURED", reason: "executed without measurement" });
    }
    if (s.measured === true && s.verified !== true) {
      findings.push({ subject: entry.id, kind: "UNVERIFIED", reason: "measured without verification" });
    }
    if (s.verified === true && s.drifted === true) {
      findings.push({ subject: entry.id, kind: "DIGEST_CHANGED", reason: "verified capability whose implementation digest changed" });
    }
    if (s.drifted === true) {
      findings.push({ subject: entry.id, kind: "STALE_EVIDENCE", reason: entry.drift?.reason || "stale evidence" });
    }
  }
  return {
    findings,
    count: findings.length,
    status: findings.length ? "DIVERGENT" : "ALIGNED",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

function isScheduledWorkflow(source) {
  return /^\s+(schedule|push|workflow_dispatch|pull_request):/m.test(String(source || ""));
}

function definedFor(kind, source, exported) {
  if (kind === "contract") {
    try {
      const parsed = JSON.parse(source);
      return Boolean(parsed && typeof parsed === "object");
    } catch {
      return false;
    }
  }
  if (kind === "workflow") return /^\s*on:/m.test(source);
  if (kind === "test") return /\btest\s*\(/.test(source);
  return EXPORT_RE.test(source) || exported;
}

export function coverageMetrics(entries = []) {
  const rows = Array.isArray(entries) ? entries : [];
  const count = (key) => rows.filter((row) => row.states?.[key] === true).length;
  const discovered = rows.length;
  const defined = count("defined");
  const loadable = count("loadable");
  const wired = count("wired");
  const deployed = count("deployed");
  const executed = count("executed");
  const measured = count("measured");
  const verified = count("verified");
  const live = count("live");
  const quarantined = count("quarantined");
  const drifted = count("drifted");
  const failed = count("failed");
  return {
    discovered_count: discovered,
    defined_count: defined,
    loadable_count: loadable,
    wired_count: wired,
    deployed_count: deployed,
    executed_count: executed,
    measured_count: measured,
    verified_count: verified,
    live_count: live,
    quarantined_count: quarantined,
    drifted_count: drifted,
    failed_count: failed,
    unknown_count: rows.filter((row) => row.loadable_unknown === true).length,
    deployment_coverage: unknownIfMissing(deployed, discovered),
    runtime_wiring_coverage: unknownIfMissing(wired, loadable),
    execution_coverage: unknownIfMissing(executed, deployed),
    verification_coverage: unknownIfMissing(verified, executed),
  };
}

export function detectDrift(previous = [], current = [], at = new Date().toISOString()) {
  const prev = new Map((previous || []).map((row) => [row.id, row]));
  const events = [];
  for (const row of current || []) {
    const before = prev.get(row.id);
    if (!before) continue;
    const expected = before.lifecycle;
    const observed = row.lifecycle;
    const reasons = [];
    if (before.states?.wired === true && row.states?.wired !== true) reasons.push("runtime wiring broken");
    if (before.states?.deployed === true && row.states?.exported !== true && row.states?.wired !== true) reasons.push("export present but no longer used");
    if (before.states?.exported === true && row.states?.exported !== true) reasons.push("script present but no longer exported");
    if (before.states?.executed === true && row.states?.measured !== true) reasons.push("executed but not measured");
    if (before.states?.measured === true && row.states?.verified !== true) reasons.push("measured but not verified");
    if (before.states?.verified === true && row.states?.failed === true) reasons.push("verified capability ceased to function");
    if (before.states?.loadable === true && row.states?.loadable !== true) reasons.push("entrypoint or module no longer loadable");
    if (POSITIVE.indexOf(observed) < POSITIVE.indexOf(expected) && expected !== observed) {
      reasons.push(`lifecycle dropped ${expected} → ${observed}`);
    }
    if (!reasons.length) continue;
    events.push({
      event: "DRIFT_DETECTED",
      subject: row.id,
      expected,
      observed,
      reason: reasons.join("; "),
      timestamp: at,
    });
    row.states.drifted = true;
    row.lifecycle = lifecycleOf(row.states);
    row.drift = events[events.length - 1];
  }
  return events;
}

export function appendEvidence({ sequence = 0, previousDigest = null, event, subject, result, timestamp = new Date().toISOString() } = {}) {
  const record = {
    sequence: Number.isInteger(sequence) && sequence >= 0 ? sequence : 0,
    previous_digest: previousDigest || null,
    event: text(event) || "INVENTORY",
    subject: text(subject) || "acorn",
    timestamp,
    result: result ?? null,
  };
  return { ...record, current_digest: digest(record) };
}

export function verifyEvidenceChain(records = []) {
  if (!Array.isArray(records) || records.length === 0) {
    return { intact: false, status: "UNKNOWN", reason: "NO_CHAIN" };
  }
  for (let i = 0; i < records.length; i += 1) {
    const row = records[i];
    const expected = digest({
      sequence: row.sequence,
      previous_digest: row.previous_digest,
      event: row.event,
      subject: row.subject,
      timestamp: row.timestamp,
      result: row.result ?? null,
    });
    if (row.current_digest !== expected) {
      return { intact: false, status: "BROKEN", reason: "DIGEST_MISMATCH", at: i };
    }
    if (i > 0 && row.previous_digest !== records[i - 1].current_digest) {
      return { intact: false, status: "BROKEN", reason: "SEQUENCE_GAP", at: i };
    }
  }
  return { intact: true, status: "VERIFIED", length: records.length };
}

async function probeModule(abs, source, importer) {
  if (!/\.(mjs|js|cjs)$/.test(abs)) {
    return { executed: false, measured: false, verified: false, reason: "NO_SAFE_PROBE" };
  }
  if (typeof importer !== "function") {
    return { executed: false, measured: false, verified: false, reason: "NO_IMPORTER" };
  }
  if (isRunningEntrypoint(abs)) {
    return { executed: true, measured: true, verified: false, reason: "SELF_ENTRYPOINT" };
  }
  const names = exportNamesFromSource(source);
  const probeable = names.filter((name) => PROBE_EXPORTS.has(name));
  if (!probeable.length && !hasImportGuard(source) && !EXPORT_RE.test(source)) {
    return { executed: false, measured: false, verified: false, reason: "NO_SAFE_PROBE" };
  }
  if (!probeable.length) {
    return { executed: false, measured: false, verified: false, reason: "NO_SAFE_PROBE" };
  }
  try {
    const mod = await importer(pathToFileURL(abs).href);
    const observations = [];
    for (const name of probeable) {
      const fn = mod?.[name];
      if (typeof fn !== "function") continue;
      const value = name === "controlState" ? fn({ ACORN_SYSTEM_MODE: "RUN" }) : fn();
      observations.push({ export: name, value });
    }
    if (!observations.length) {
      return { executed: false, measured: false, verified: false, reason: "PROBE_NOT_CALLABLE" };
    }
    const verified = observations.every((row) => {
      const v = row.value;
      if (!v || typeof v !== "object") return false;
      if (v.auto_merge === true) return false;
      if (v.live === true) return false;
      return true;
    });
    return {
      executed: true,
      measured: true,
      verified,
      reason: verified ? "PROBE_VERIFIED" : "PROBE_INVARIANTS_FAILED",
      observations: observations.map((row) => ({ export: row.export, keys: Object.keys(row.value || {}) })),
    };
  } catch (error) {
    return {
      executed: true,
      measured: true,
      verified: false,
      failed: true,
      reason: "PROBE_FAILED",
      error: String(error?.message || error).slice(0, 240),
    };
  }
}

export async function runInventory({
  root = resolve("."),
  previous = [],
  quarantined = [],
  executions = {},
  checkLoadable = defaultSyntaxCheck,
  importer = null,
  at = new Date().toISOString(),
  previousDigest = null,
  sequence = 0,
} = {}) {
  const constitution = inventoryConstitution();
  const files = discoverFiles(root);
  const bindings = packageBindings(root);
  const workflows = workflowBindings(root);
  const tests = testBindings(root);
  const importers = importGraph(root, files);
  const quarantineSet = new Set((quarantined || []).map(String));
  const entries = [];

  for (const file of files) {
    const source = readText(file.abs);
    const exported = bindings.exported.has(file.abs);
    const defined = definedFor(file.kind, source, exported);
    const syntax = typeof checkLoadable === "function" ? checkLoadable(file.abs) : { loadable: false, reason: "NO_CHECKER" };
    const loadableUnknown = syntax.loadable !== true && syntax.failed !== true;
    const npmWired = bindings.npm.has(file.abs);
    const workflowWired = workflows.referenced.has(file.abs);
    const importedBy = [...(importers.get(file.abs) || [])];
    const npmTestDeploys = /test\//.test(String(bindings.pkg?.scripts?.test || ""));
    const selfWorkflow = file.kind === "workflow";
    const wired = exported || npmWired || workflowWired || importedBy.length > 0 || selfWorkflow || file.kind === "test";
    const deployed = exported || npmWired || workflows.scheduled.has(file.abs) || (selfWorkflow && isScheduledWorkflow(source)) || (file.kind === "test" && npmTestDeploys);
    const names = exportNamesFromSource(source);
    let probe = { executed: false, measured: false, verified: false, reason: "NOT_PROBED" };
    if (syntax.loadable === true && typeof importer === "function") {
      probe = await probeModule(file.abs, source, importer);
    }
    const forced = executions[file.relativePath] || executions[rel(root, file.abs)] || null;
    if (forced) {
      probe = {
        executed: forced.executed === true,
        measured: forced.measured === true,
        verified: forced.verified === true,
        failed: forced.failed === true,
        reason: forced.reason || "EXTERNAL_EVIDENCE",
      };
    }
    const failed = syntax.failed === true || probe.failed === true;
    const liveEarned = Boolean(
      defined
      && syntax.loadable === true
      && wired
      && deployed
      && probe.executed === true
      && probe.measured === true
      && probe.verified === true
      && !failed
      && !quarantineSet.has(file.relativePath),
    );
    const states = {
      discovered: true,
      defined,
      loadable: syntax.loadable === true,
      wired,
      deployed,
      executed: probe.executed === true,
      measured: probe.measured === true,
      verified: probe.verified === true,
      live: liveEarned,
      quarantined: quarantineSet.has(file.relativePath),
      drifted: false,
      failed,
      exported,
    };
    const entry = {
      id: file.relativePath.replace(/\.(mjs|js)$/, ""),
      path: file.relativePath,
      kind: file.kind,
      organ: organOf(file.relativePath, file.kind),
      script: file.kind === "script" || file.kind === "swarm" || file.kind === "sdk",
      capability: defined && names.length > 0 && file.kind !== "test" && file.kind !== "workflow" && file.kind !== "contract",
      exports: names,
      importers: importedBy,
      package_export: exported ? bindings.exported.get(file.abs).exportKey : null,
      workflow: workflows.referenced.get(file.abs) || null,
      test: tests.get(file.abs) || null,
      states,
      loadable_unknown: loadableUnknown,
      loadable_reason: syntax.reason || null,
      probe_reason: probe.reason,
      probe_error: probe.error || null,
      live: false,
      live_word_earned: liveEarned,
      auto_merge: false,
      authority: "carl",
    };
    entry.lifecycle = lifecycleOf(states);
    entries.push(entry);
  }

  const drift = detectDrift(previous, entries, at);
  const coverage = coverageMetrics(entries);
  const integrity = deploymentIntegrity(entries);
  const organs = {};
  for (const row of entries) {
    const organ = row.organ || "module";
    organs[organ] = (organs[organ] || 0) + 1;
  }
  const evidence = appendEvidence({
    sequence,
    previousDigest,
    event: "INVENTORY_CYCLE",
    subject: "acorn.capability-inventory",
    result: {
      coverage,
      drift_count: drift.length,
      failed: coverage.failed_count,
      quarantined: coverage.quarantined_count,
    },
    timestamp: at,
  });

  return {
    version: INVENTORY_VERSION,
    constitution,
    observed_at: at,
    root: rel(process.cwd(), root) || ".",
    entries,
    drift,
    coverage,
    integrity,
    organs,
    evidence,
    auto_merge: false,
    live: false,
    authority: "carl",
    missing_proof: files.length === 0 ? "NO_CONVENTION_MATCH" : null,
  };
}

export function availabilityFromInventory(entry) {
  if (!entry) {
    return {
      exists: false,
      reachable: false,
      executable: false,
      verified: false,
      healthy: false,
      lifecycle: "UNKNOWN",
      roster_is_not_availability: true,
    };
  }
  const s = entry.states || {};
  return {
    exists: s.discovered === true,
    reachable: s.loadable === true,
    executable: s.loadable === true && s.wired === true && s.quarantined !== true && s.failed !== true,
    verified: s.verified === true,
    healthy: s.verified === true && s.failed !== true && s.quarantined !== true && s.drifted !== true,
    lifecycle: entry.lifecycle || "DISCOVERED",
    roster_is_not_availability: true,
    live: false,
  };
}

export function selectExecutableCapabilities(inventory, required = []) {
  const need = Array.isArray(required) ? required.filter(Boolean) : [];
  const rows = inventory?.entries || [];
  const selected = rows.filter((row) => {
    const avail = availabilityFromInventory(row);
    if (!avail.executable) return false;
    if (!need.length) return true;
    const hay = `${row.id} ${row.path} ${(row.exports || []).join(" ")}`.toLowerCase();
    return need.some((cap) => hay.includes(String(cap).toLowerCase()));
  });
  return {
    status: selected.length ? "EXECUTABLE" : "UNAVAILABLE",
    selected: selected.map((row) => row.id),
    missing: need.filter((cap) => !selected.some((row) => `${row.id} ${row.path}`.toLowerCase().includes(String(cap).toLowerCase()))),
    roster_used: false,
    live: false,
    authority: "carl",
  };
}

function isMain() {
  const here = fileURLToPath(import.meta.url);
  const argv1 = process.argv[1] ? String(process.argv[1]) : "";
  return argv1.endsWith("acorn-capability-inventory.mjs") || here === argv1;
}

if (isMain()) {
  const out = await runInventory({ root: resolve("."), importer: (url) => import(url) });
  console.log(JSON.stringify({
    version: out.version,
    coverage: out.coverage,
    drift: out.drift,
    live: false,
    auto_merge: false,
    entries: out.entries.map((row) => ({
      id: row.id,
      lifecycle: row.lifecycle,
      kind: row.kind,
      capability: row.capability,
      package_export: row.package_export,
      live_word_earned: row.live_word_earned,
    })),
  }, null, 2));
}
