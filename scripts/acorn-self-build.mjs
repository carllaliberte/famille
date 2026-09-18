#!/usr/bin/env node
/**
 * ACORN SELF-BUILD LOOP
 *
 * Coordinator for missing-capability construction. Not a second Cortex,
 * registry, runtime, mesh, or authority.
 *
 * Reuses: tool-resolve, evidence registry, constitution, inventory matching
 * when supplied. Does not replace those modules.
 *
 *   TASK → REQUIRED CAPABILITY → MISSING → GAP DETECTED → PROPOSE → DESIGN
 *        → BUILD → TEST → FALSIFY → MEASURE → VERIFY → REGISTER → USE
 *
 * GAP DETECTED ≠ CAPABILITY EXISTS
 * CAPABILITY ≠ AUTHORITY
 * TEST GENERATED ≠ TEST PASSED
 * CODE_PRESENT ≠ EXECUTED ≠ VERIFIED ≠ LIVE
 * READY ≠ AUTHORIZED
 * UNKNOWN is first-class.
 *
 * The loop may propose, design, build in a safe zone, test, falsify, measure,
 * and open a PR-shaped proposal. It cannot merge, grant authority, mint LIVE,
 * write production, or treat a gap as an existing capability.
 *
 * MAIN = REALITY. CARL = MERGE. AUTO_MERGE = FALSE.
 */
import { createHash } from "node:crypto";
import { catalogTools, resolveTool } from "./tool-resolve.mjs";
import { assertCapabilityAuthoritySeparation } from "./acorn-constitution.mjs";
import { registerEvidence, evidenceIsCurrent, proofGate } from "./acorn-evidence-registry.mjs";

export const SELF_BUILD_VERSION = "acorn.self-build.v0";

export const SELF_BUILD_LOOP = Object.freeze([
  "OBSERVE",
  "UNDERSTAND",
  "DETECT_GAP",
  "PROPOSE",
  "DESIGN",
  "BUILD",
  "TEST",
  "FALSIFY",
  "MEASURE",
  "VERIFY",
  "REGISTER",
  "USE",
  "LEARN",
]);

export const BUILD_LIFECYCLE = Object.freeze([
  "UNKNOWN",
  "DISCOVERED",
  "PROPOSED",
  "DESIGNED",
  "BUILT",
  "TESTED",
  "MEASURED",
  "VERIFIED",
  "READY",
  "AVAILABLE",
  "DEPRECATED",
  "EXPIRED",
]);

export const SAFE_ZONES = Object.freeze([
  "BUILD",
  "TEST",
  "EXPERIMENT",
  "STAGING",
  "PRODUCTION",
]);

export const EXTENSION_KINDS = Object.freeze([
  "CODE",
  "CONNECTOR",
  "CAPABILITY",
  "WORKFLOW",
  "ADAPTER",
  "TOOL",
  "MODEL",
  "INTERFACE",
  "DATA_TRANSFORM",
  "PROJECT",
  "PRODUCT",
  "INTELLIGENCE",
  "MACHINE",
  "ORGANISM",
  "ECONOMIC_RAIL",
  "DATASOURCE",
  "SENSOR",
  "PROTOCOL",
  "MARKET",
  "HUMAN",
  "ORGANIZATION",
]);

export const PROTECTED_EXTENSION_KINDS = Object.freeze([
  "CONSTITUTION",
  "AUTHORITY",
  "MERGE",
  "BREAKER",
  "LIVE",
  "CARL",
  "SECRET",
]);

export const STOP_REASONS = Object.freeze([
  "AUTHORITY_ABSENT",
  "SECURITY_INSUFFICIENT",
  "CRITICAL_DEPENDENCY_UNKNOWN",
  "INSUFFICIENT_EVIDENCE",
  "ENVIRONMENT_UNRELIABLE",
  "RISK_UNMANAGED",
  "PROTECTED_MODIFICATION",
  "SECRET_REQUIRED",
  "IRREVERSIBLE_UNAUTHORIZED",
  "GOVERNANCE_CONFLICT",
]);

export const KNOWLEDGE_CLASSES = Object.freeze([
  "KNOW",
  "OBSERVED",
  "MEASURED",
  "INFERRED",
  "PROPOSED",
  "BUILT",
  "EXECUTED",
  "VERIFIED",
  "UNKNOWN",
]);

export const FORBIDDEN_SELF_CLAIMS = Object.freeze([
  "LIVE",
  "CERTIFIED",
  "AUTHORIZED",
  "MERGED",
  "PRODUCTION_WRITTEN",
]);

export const AUTONOMY_LEVELS = Object.freeze([
  { code: "L0", name: "OBSERVE", may: ["observe", "read"] },
  { code: "L1", name: "PROPOSE", may: ["observe", "read", "propose"] },
  { code: "L2", name: "BUILD_IN_SANDBOX", may: ["observe", "read", "propose", "build_sandbox"] },
  { code: "L3", name: "TEST", may: ["observe", "read", "propose", "build_sandbox", "test"] },
  { code: "L4", name: "MEASURE", may: ["observe", "read", "propose", "build_sandbox", "test", "measure"] },
  { code: "L5", name: "PREPARE_DEPLOYMENT", may: ["observe", "read", "propose", "prepare_deployment"], human_required: true },
  { code: "L6", name: "EXECUTE_AUTHORIZED_ACTION", may: ["execute_authorized"], human_required: true, authorized_required: true },
  { code: "L7", name: "HUMAN_APPROVAL_REQUIRED", may: [], human_required: true, ceiling: true },
]);

export const AUTONOMY_CEILING_WITHOUT_CARL = "L2";

export const WORK_CLASS = Object.freeze(["IMPLEMENT_NOW", "FOUNDATION_NOW", "FUTURE", "HUMAN_HOLD"]);

const HOLD_PATTERN = /\b(secret|credential|token|password|wrangler|merge|qpu|photon|quantum-node|payment|spend|irreversible)\b/i;

const extensions = new Map();

function text(value, fallback = "") {
  const s = String(value ?? "").trim();
  return s || fallback;
}

function list(value) {
  return Array.isArray(value) ? value.map((row) => text(row)).filter(Boolean) : [];
}

function iso(value) {
  const s = text(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function digest(value) {
  const normalize = (v) => {
    if (Array.isArray(v)) return v.map(normalize);
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.keys(v).sort().map((k) => [k, normalize(v[k])]));
    }
    return v;
  };
  return createHash("sha256").update(JSON.stringify(normalize(value ?? null))).digest("hex");
}

function nextLifecycle(from) {
  const i = BUILD_LIFECYCLE.indexOf(from);
  if (i < 0 || i >= BUILD_LIFECYCLE.length - 1) return null;
  return BUILD_LIFECYCLE[i + 1];
}

export function selfBuildConstitution() {
  return Object.freeze({
    version: SELF_BUILD_VERSION,
    owner: "acorn",
    second_architecture: false,
    second_cortex: false,
    second_registry: false,
    second_runtime: false,
    second_authority: false,
    capability_neq_authority: true,
    gap_detected_neq_exists: true,
    test_generated_neq_test_passed: true,
    code_present_neq_executed: true,
    executed_neq_verified: true,
    verified_neq_live: true,
    ready_neq_authorized: true,
    proposed_neq_built: true,
    built_neq_ready: true,
    unknown_is_first_class: true,
    auto_merge: false,
    auto_authorize: false,
    production_write: false,
    autonomy_ceiling_without_carl: AUTONOMY_CEILING_WITHOUT_CARL,
    autonomy_cannot_self_escalate: true,
    live: false,
    authority: "carl",
    merge: "carl",
  });
}

export function selfBuildProbe() {
  return {
    ok: true,
    version: SELF_BUILD_VERSION,
    auto_merge: false,
    live: false,
    authority: "carl",
    capability_neq_authority: true,
  };
}

export function assertLifecycleTransition(from, to) {
  const current = text(from, "UNKNOWN").toUpperCase();
  const target = text(to).toUpperCase();
  if (!BUILD_LIFECYCLE.includes(current)) throw new Error("UNKNOWN_LIFECYCLE:" + current);
  if (!BUILD_LIFECYCLE.includes(target)) throw new Error("UNKNOWN_LIFECYCLE:" + target);
  if (current === target) return { from: current, to: target, skipped: false };
  if (target === "UNKNOWN") throw new Error("LIFECYCLE_CANNOT_RETURN_TO_UNKNOWN");
  if (target === "EXPIRED" || target === "DEPRECATED") {
    return { from: current, to: target, skipped: false, terminal: true };
  }
  const allowed = nextLifecycle(current);
  if (target !== allowed) {
    throw new Error("LIFECYCLE_SKIP_FORBIDDEN:" + current + "->" + target);
  }
  return { from: current, to: target, skipped: false };
}

export function classifyStop({
  task = "",
  capability = "",
  authorized = false,
  secret_required = false,
  evidence = [],
  environment_reliable = true,
  risk_managed = true,
  protected_modification = false,
  irreversible = false,
  governance_conflict = false,
  critical_dependency_unknown = false,
  security_ok = true,
} = {}) {
  const hay = `${task} ${capability}`;
  if (secret_required || HOLD_PATTERN.test(hay)) return "SECRET_REQUIRED";
  if (protected_modification) return "PROTECTED_MODIFICATION";
  if (governance_conflict) return "GOVERNANCE_CONFLICT";
  if (irreversible && authorized !== true) return "IRREVERSIBLE_UNAUTHORIZED";
  if (critical_dependency_unknown) return "CRITICAL_DEPENDENCY_UNKNOWN";
  if (security_ok !== true) return "SECURITY_INSUFFICIENT";
  if (environment_reliable !== true) return "ENVIRONMENT_UNRELIABLE";
  if (risk_managed !== true) return "RISK_UNMANAGED";
  if (Array.isArray(evidence) && evidence.length === 0 && authorized === true) return "INSUFFICIENT_EVIDENCE";
  return null;
}

export function shouldStop(input = {}) {
  const reason = classifyStop(input);
  if (!reason) {
    return {
      stop: false,
      human_hold: false,
      reason: null,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  return {
    stop: true,
    human_hold: true,
    reason,
    status: "HUMAN_HOLD",
    live: false,
    auto_merge: false,
    authority: "carl",
    can_build: reason !== "SECRET_REQUIRED" && reason !== "PROTECTED_MODIFICATION" && reason !== "GOVERNANCE_CONFLICT" && reason !== "IRREVERSIBLE_UNAUTHORIZED",
  };
}

function autonomyIndex(code) {
  return AUTONOMY_LEVELS.findIndex((row) => row.code === String(code || "").toUpperCase());
}

export function autonomyLevel(code = "L1") {
  const row = AUTONOMY_LEVELS[Math.max(0, autonomyIndex(code))] || AUTONOMY_LEVELS[1];
  return Object.freeze({
    ...row,
    live: false,
    auto_merge: false,
    authority: "carl",
    ceiling_without_carl: AUTONOMY_CEILING_WITHOUT_CARL,
  });
}

export function assertAutonomy(action, { level = "L1", authorized = false } = {}) {
  const current = autonomyLevel(level);
  const act = text(action, "observe");
  const allowed = current.may.includes(act);
  if (current.authorized_required && authorized !== true) {
    return { allowed: false, stop: true, human_hold: true, reason: "AUTHORITY_ABSENT", status: "HUMAN_HOLD", level: current.code, live: false, auto_merge: false, authority: "carl" };
  }
  if (current.human_required && authorized !== true) {
    return { allowed: false, stop: true, human_hold: true, reason: "HUMAN_APPROVAL_REQUIRED", status: "HUMAN_HOLD", level: current.code, live: false, auto_merge: false, authority: "carl" };
  }
  if (!allowed) {
    return { allowed: false, stop: true, human_hold: true, reason: "AUTONOMY_INSUFFICIENT", status: "HUMAN_HOLD", level: current.code, live: false, auto_merge: false, authority: "carl" };
  }
  return { allowed: true, stop: false, human_hold: false, reason: null, level: current.code, live: false, auto_merge: false, authority: "carl" };
}

export function escalateAutonomy({ from = "L1", to, authorized = false, actor = "acorn" } = {}) {
  const start = autonomyIndex(from);
  const target = autonomyIndex(to);
  const ceiling = autonomyIndex(AUTONOMY_CEILING_WITHOUT_CARL);
  if (start < 0 || target < 0) {
    return { granted: false, status: "HUMAN_HOLD", reason: "UNKNOWN_AUTONOMY_LEVEL", from, to: from, live: false, auto_merge: false, authority: "carl" };
  }
  if (target <= start) {
    return { granted: true, status: "UNCHANGED", from, to: AUTONOMY_LEVELS[start].code, live: false, auto_merge: false, authority: "carl" };
  }
  if (target > start + 1) {
    return { granted: false, status: "HUMAN_HOLD", reason: "AUTONOMY_SKIP_FORBIDDEN", from, to: AUTONOMY_LEVELS[start].code, live: false, auto_merge: false, authority: "carl" };
  }
  if (target > ceiling && authorized !== true) {
    return { granted: false, status: "HUMAN_HOLD", reason: "AUTONOMY_CANNOT_SELF_ESCALATE", from, to: AUTONOMY_LEVELS[start].code, actor, live: false, auto_merge: false, authority: "carl" };
  }
  if (AUTONOMY_LEVELS[target].code === "L6" || AUTONOMY_LEVELS[target].code === "L7") {
    return { granted: false, status: "HUMAN_HOLD", reason: "HUMAN_APPROVAL_REQUIRED", from, to: AUTONOMY_LEVELS[start].code, live: false, auto_merge: false, authority: "carl" };
  }
  if (authorized !== true) {
    return { granted: false, status: "HUMAN_HOLD", reason: "AUTONOMY_CANNOT_SELF_ESCALATE", from, to: AUTONOMY_LEVELS[start].code, live: false, auto_merge: false, authority: "carl" };
  }
  return { granted: true, status: "GRANTED_BY_HUMAN", from, to: AUTONOMY_LEVELS[target].code, live: false, auto_merge: false, authority: "carl" };
}

export function learnFromLoop({
  task = "",
  gaps = [],
  proposals = [],
  used = false,
} = {}) {
  return Object.freeze({
    recorded: true,
    promoted: false,
    replaced: false,
    used: used === true,
    authorized: false,
    knowledge: "OBSERVED",
    task: text(task) || null,
    gaps: list(gaps),
    proposals: list(proposals),
    live: false,
    auto_merge: false,
    authority: "carl",
    learning_equals_authority: false,
  });
}

export function proposeRepair({
  failure = "",
  failure_class = null,
  attempt = 0,
} = {}) {
  const hold = shouldStop({ task: failure, capability: failure_class || failure });
  if (hold.stop) {
    return {
      status: "HUMAN_HOLD",
      reason: hold.reason,
      diagnose: true,
      deploy: false,
      auto_merge: false,
      live: false,
      authority: "carl",
    };
  }
  return {
    version: SELF_BUILD_VERSION,
    status: "PROPOSED",
    lifecycle: "PROPOSED",
    failure: text(failure) || null,
    failure_class: text(failure_class, "UNKNOWN"),
    attempt: Number(attempt) || 0,
    diagnose: true,
    build: true,
    test: true,
    measure: true,
    deploy: false,
    silent_success: false,
    auto_merge: false,
    live: false,
    authority: "carl",
    next: "HUMAN_HOLD_BEFORE_DEPLOY",
  };
}

export function proposeImprovement({
  capability = "",
  observation = "",
  current_is_critical = false,
} = {}) {
  if (current_is_critical) {
    return {
      status: "HUMAN_HOLD",
      reason: "CRITICAL_CAPABILITY_CANNOT_BE_REPLACED_SILENTLY",
      replaced: false,
      promoted: false,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  return {
    version: SELF_BUILD_VERSION,
    status: "PROPOSED",
    lifecycle: "PROPOSED",
    capability: text(capability) || null,
    observation: text(observation) || null,
    replaced: false,
    promoted: false,
    experimental: true,
    live: false,
    auto_merge: false,
    authority: "carl",
    next: "EXPERIMENT_THEN_MEASURE_THEN_PROPOSE_PROMOTION",
  };
}

export function productCandidate({
  repeats = 0,
  problem = "",
  solution = "",
} = {}) {
  const n = Number(repeats) || 0;
  if (n < 2) {
    return {
      status: "INSUFFICIENT_EVIDENCE",
      product: false,
      candidate: false,
      repeats: n,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  return {
    version: SELF_BUILD_VERSION,
    status: "PRODUCT_CANDIDATE",
    product: false,
    candidate: true,
    repeats: n,
    problem: text(problem) || null,
    solution: text(solution) || null,
    economic_value_measured: false,
    live: false,
    auto_merge: false,
    authority: "carl",
    product_candidate_neq_product: true,
  };
}

export function classifyWork(name) {
  const now = new Set([
    "capability-gap", "self-build-loop", "lifecycle", "falsify", "measure",
    "extension-admission", "autonomy-levels", "learn", "repair-proposal",
    "tenant-isolation", "evidence", "honest-health",
  ]);
  const foundation = new Set([
    "webhooks", "m2m-auth", "sdk-packaging", "digital-twin-full",
    "learning-router", "product-generalization", "billing-adapter",
  ]);
  const future = new Set(["payment-capture", "live-claim", "qkd", "quantum", "marketplace"]);
  const hold = new Set(["merge", "secret-custody", "authorized-external-effect", "render-receipt", "self-authorize"]);
  const key = text(name).toLowerCase();
  if (now.has(key)) return "IMPLEMENT_NOW";
  if (foundation.has(key)) return "FOUNDATION_NOW";
  if (future.has(key)) return "FUTURE";
  if (hold.has(key)) return "HUMAN_HOLD";
  return "FOUNDATION_NOW";
}

export function howAcornBuilds() {
  return Object.freeze({
    version: SELF_BUILD_VERSION,
    purpose: "Transfer construction capability, never human authority.",
    steps: [
      { n: 1, name: "understand", entry: "selfBuildConstitution + howAcornBuilds" },
      { n: 2, name: "discover", entry: "catalogTools + capabilityGap + admitExtension" },
      { n: 3, name: "detect_gap", entry: "detectGaps" },
      { n: 4, name: "design", entry: "proposeBuild" },
      { n: 5, name: "build", entry: "runSelfBuildLoop builder in BUILD zone" },
      { n: 6, name: "test", entry: "runSelfBuildLoop tester" },
      { n: 7, name: "falsify", entry: "falsifyCapability" },
      { n: 8, name: "measure", entry: "measureCapability" },
      { n: 9, name: "evidence", entry: "registerEvidence" },
      { n: 10, name: "register", entry: "registerQualified" },
      { n: 11, name: "use", entry: "USE requires human authorization; READY ≠ AUTHORIZED" },
      { n: 12, name: "limits", entry: "shouldStop + assertAutonomy + notYetImplemented" },
      { n: 13, name: "again", entry: "LEARN records observations and does not promote" },
    ],
    entrypoints: {
      module: "scripts/acorn-self-build.mjs",
      schema: "schema/acorn-self-build.v0.json",
      tests: "test/acorn-self-build.test.js",
      example: "examples/self-build-extension.mjs",
      http: ["/api/v1/self-build", "/api/v1/self-build/observe", "/api/v1/self-build/repair"],
      reuse: [
        "scripts/tool-resolve.mjs",
        "scripts/acorn-evidence-registry.mjs",
        "scripts/acorn-constitution.mjs",
        "scripts/acorn-capability-registry.mjs",
        "scripts/self-heal.mjs",
        "scripts/acorn-self-correction.mjs",
      ],
    },
    autonomy: {
      default: "L1",
      sandbox: "L2",
      ceiling_without_carl: AUTONOMY_CEILING_WITHOUT_CARL,
      l6_l7: "HUMAN_HOLD",
    },
    cannot: [
      "merge",
      "self-authorize",
      "mint LIVE",
      "write production",
      "modify secrets",
      "modify governance to gain power",
      "declare a human act done",
      "treat simulation as reality",
    ],
    single_model_dependency: false,
    live: false,
    auto_merge: false,
    authority: "carl",
  });
}

function matchKnown(name, known = []) {
  const needle = text(name).toLowerCase();
  return (known || []).find((row) => {
    const idn = text(row.name || row.id || row.capability).toLowerCase();
    return idn === needle;
  }) || null;
}

function matchCatalog(name, catalog = []) {
  const needle = text(name).toLowerCase();
  return (catalog || []).find((row) => {
    const hay = `${row.id || ""} ${row.name || ""} ${row.path || ""} ${(row.exports || []).join(" ")}`.toLowerCase();
    return hay.includes(needle);
  }) || null;
}

export function capabilityGap({
  task = "",
  capability,
  known = [],
  catalog = [],
  tools = null,
  connectors = [],
} = {}) {
  const name = text(capability);
  const base = {
    version: SELF_BUILD_VERSION,
    kind: "CAPABILITY_GAP",
    task: text(task) || null,
    capability: name || "UNKNOWN",
    lifecycle: "UNKNOWN",
    exists: false,
    available: false,
    authorized: false,
    executed: false,
    verified: false,
    live: false,
    auto_merge: false,
    authority: "carl",
    gap_detected_neq_exists: true,
  };
  if (!name) {
    return { ...base, status: "UNKNOWN", reason: "UNNAMED_CAPABILITY", knowledge: "UNKNOWN" };
  }
  const hold = shouldStop({ task, capability: name });
  if (hold.stop) {
    return {
      ...base,
      status: "HUMAN_HOLD",
      reason: hold.reason,
      lifecycle: "DISCOVERED",
      knowledge: "OBSERVED",
      human_hold: true,
    };
  }
  const knownHit = matchKnown(name, known);
  if (knownHit) {
    const exists = knownHit.exists === true;
    const available = knownHit.available === true && exists;
    return {
      ...base,
      status: available ? "AVAILABLE" : (exists ? "EXISTS" : "MISSING"),
      exists,
      available,
      lifecycle: exists ? "DISCOVERED" : "UNKNOWN",
      knowledge: exists ? "OBSERVED" : "UNKNOWN",
      source: knownHit.source || knownHit.evidence || "known",
      reason: exists ? (knownHit.reason || "CODE_PRESENT") : "GAP_DETECTED",
    };
  }
  const catalogHit = matchCatalog(name, catalog);
  if (catalogHit) {
    const exists = catalogHit.exists !== false;
    const available = catalogHit.available === true || catalogHit.executable === true;
    return {
      ...base,
      status: available ? "AVAILABLE" : "EXISTS",
      exists: true,
      available: available && catalogHit.verified === true ? true : false,
      lifecycle: "DISCOVERED",
      knowledge: "OBSERVED",
      source: catalogHit.path || catalogHit.id,
      reason: "CATALOG_MATCH",
      verified: catalogHit.verified === true,
    };
  }
  const connectorHit = (connectors || []).find((row) => {
    const hay = `${row.id || ""} ${row.kind || ""} ${row.provider || ""} ${row.name || ""}`.toLowerCase();
    return hay.includes(name.toLowerCase());
  });
  if (connectorHit) {
    return {
      ...base,
      status: "EXISTS",
      exists: true,
      available: false,
      lifecycle: "DISCOVERED",
      knowledge: "OBSERVED",
      source: connectorHit.id,
      reason: "CONNECTOR_PRESENT_NOT_AVAILABLE",
      configured: connectorHit.configured === true,
      connected: false,
    };
  }
  const resolved = resolveTool({ name, why: task || "capability unmeasured" }, { catalog: tools || catalogTools() });
  if (resolved.decision === "HOLD_HUMAN") {
    return {
      ...base,
      status: "HUMAN_HOLD",
      reason: resolved.why || "HUMAN_BOUNDARY",
      lifecycle: "DISCOVERED",
      knowledge: "OBSERVED",
      human_hold: true,
    };
  }
  if (resolved.decision === "REUSE") {
    return {
      ...base,
      status: "EXISTS",
      exists: true,
      available: false,
      lifecycle: "DISCOVERED",
      knowledge: "OBSERVED",
      source: resolved.path,
      reason: "CODE_PRESENT",
      declared: true,
      executed: false,
    };
  }
  return {
    ...base,
    status: "MISSING",
    exists: false,
    available: false,
    lifecycle: "DISCOVERED",
    knowledge: "UNKNOWN",
    reason: "GAP_DETECTED",
    decision: "BUILD_TOOL",
    tool: resolved.tool || name,
  };
}

export function detectGaps({
  task = "",
  required = [],
  known = [],
  catalog = [],
  tools = null,
  connectors = [],
} = {}) {
  const need = list(required);
  const toolCatalog = tools || catalogTools();
  const gaps = [];
  const found = [];
  const holds = [];
  const unknown = [];
  for (const capability of need) {
    const row = capabilityGap({ task, capability, known, catalog, tools: toolCatalog, connectors });
    if (row.status === "HUMAN_HOLD") holds.push(row);
    else if (row.status === "MISSING" || row.status === "UNKNOWN") {
      if (row.status === "UNKNOWN") unknown.push(row);
      gaps.push(row);
    } else found.push(row);
  }
  return {
    version: SELF_BUILD_VERSION,
    task: text(task) || null,
    required: need,
    found,
    gaps,
    holds,
    unknown,
    blocking: gaps.length > 0 || holds.length > 0,
    gap_detected_neq_exists: true,
    live: false,
    auto_merge: false,
    authority: "carl",
    measured_at: iso(),
  };
}

export function proposeBuild(gap = {}, { zone = "BUILD" } = {}) {
  const capability = text(gap.capability || gap.tool, "UNKNOWN");
  const z = SAFE_ZONES.includes(zone) ? zone : "BUILD";
  if (z === "PRODUCTION") {
    return {
      version: SELF_BUILD_VERSION,
      capability,
      lifecycle: "DISCOVERED",
      status: "HUMAN_HOLD",
      reason: "PRODUCTION_WRITE_FORBIDDEN",
      zone: "BUILD",
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  if (gap.status === "HUMAN_HOLD" || gap.human_hold === true) {
    return {
      version: SELF_BUILD_VERSION,
      capability,
      lifecycle: "DISCOVERED",
      status: "HUMAN_HOLD",
      reason: gap.reason || "AUTHORITY_ABSENT",
      zone: z,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  if (gap.status === "EXISTS" || gap.status === "AVAILABLE") {
    return {
      version: SELF_BUILD_VERSION,
      capability,
      lifecycle: "DISCOVERED",
      status: "REUSE",
      reason: "CAPABILITY_EXISTS",
      zone: z,
      rebuild: false,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  return {
    version: SELF_BUILD_VERSION,
    id: id("prop"),
    capability,
    kind: gap.kind || "CAPABILITY",
    lifecycle: "PROPOSED",
    status: "PROPOSED",
    zone: z,
    design: {
      identity: capability,
      implementation: "safe-zone-stub",
      tests: ["unit", "failure", "falsification"],
      measurements: ["executed", "failed", "duration_ms"],
      evidence: [],
      constraints: ["no production write", "no merge", "no secret", "no authority"],
      authority_requirements: ["carl"],
    },
    authorized: false,
    live: false,
    auto_merge: false,
    authority: "carl",
    proposed_neq_built: true,
  };
}

export function advanceLifecycle(record = {}, next, { evidence = null } = {}) {
  const from = text(record.lifecycle, "UNKNOWN").toUpperCase();
  const to = text(next, "").toUpperCase();
  const gate = assertLifecycleTransition(from, to);
  if (to === "TESTED" && evidence?.tests_executed !== true) {
    throw new Error("TEST_GENERATED_IS_NOT_TEST_PASSED");
  }
  if (to === "MEASURED" && evidence?.observed !== true) {
    throw new Error("MEASUREMENT_REQUIRES_OBSERVATION");
  }
  if (to === "VERIFIED" && evidence?.verified !== true) {
    throw new Error("VERIFICATION_REQUIRES_EVIDENCE");
  }
  if (to === "READY" && record.authorized === true) {
    throw new Error("READY_IS_NOT_AUTHORIZED");
  }
  if (to === "AVAILABLE" && (record.authorized === true || record.live === true)) {
    throw new Error("AVAILABLE_IS_NOT_LIVE_OR_AUTHORIZED");
  }
  return {
    ...record,
    lifecycle: gate.to,
    previous_lifecycle: from,
    authorized: false,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function falsifyCapability({
  claim = null,
  tests = [],
  counterexamples = [],
  missing_dependencies = [],
  undetermined = [],
  false_assumptions = [],
  failure_conditions = [],
  evidence = [],
} = {}) {
  const executed = (tests || []).filter((row) => row.executed === true);
  const failed = executed.filter((row) => row.passed !== true);
  const generatedOnly = (tests || []).filter((row) => row.generated === true && row.executed !== true);
  const reasons = [];
  if (generatedOnly.length) reasons.push("TEST_GENERATED_NOT_EXECUTED");
  if (failed.length) reasons.push("TEST_FAILED");
  if ((counterexamples || []).length) reasons.push("COUNTEREXAMPLE");
  if ((missing_dependencies || []).length) reasons.push("MISSING_DEPENDENCY");
  if ((undetermined || []).length) reasons.push("UNDETERMINED_STATE");
  if ((false_assumptions || []).length) reasons.push("FALSE_ASSUMPTION");
  if ((failure_conditions || []).length) reasons.push("FAILURE_CONDITION");
  const current = (evidence || []).filter((row) => evidenceIsCurrent(row));
  if (!current.length && !executed.length) reasons.push("INSUFFICIENT_EVIDENCE");
  const insufficient = reasons.includes("INSUFFICIENT_EVIDENCE") || reasons.includes("TEST_GENERATED_NOT_EXECUTED") || reasons.length > 0;
  return {
    version: SELF_BUILD_VERSION,
    claim,
    status: insufficient ? (current.length || executed.length ? "FALSIFIED_OR_INCOMPLETE" : "INSUFFICIENT_EVIDENCE") : "NOT_FALSIFIED",
    insufficient_evidence: reasons.includes("INSUFFICIENT_EVIDENCE") || generatedOnly.length > 0,
    reasons,
    tests_generated: (tests || []).length,
    tests_executed: executed.length,
    tests_passed: executed.filter((row) => row.passed === true).length,
    test_generated_neq_test_passed: true,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function measureCapability({ observations = [], started_at = null, ended_at = null } = {}) {
  const rows = Array.isArray(observations) ? observations : [];
  if (!rows.length && !started_at) {
    return {
      status: "INSUFFICIENT_EVIDENCE",
      observed: false,
      invented: false,
      live: false,
      authority: "carl",
    };
  }
  const success = rows.filter((row) => row.success === true).length;
  const failure = rows.filter((row) => row.success === false).length;
  const duration = started_at && ended_at ? Math.max(0, Date.parse(ended_at) - Date.parse(started_at)) : null;
  return {
    version: SELF_BUILD_VERSION,
    status: "MEASURED",
    observed: true,
    invented: false,
    sample_count: rows.length,
    success_rate: rows.length ? success / rows.length : null,
    failure_rate: rows.length ? failure / rows.length : null,
    duration_ms: duration,
    cost: rows.reduce((n, row) => n + (Number(row.cost) || 0), 0) || null,
    live: false,
    auto_merge: false,
    authority: "carl",
    measured_at: iso(ended_at),
  };
}

export function discoverDependencies({
  capability,
  depends_on = [],
  graph = {},
  parent_task = null,
  depth = 0,
  max_depth = 4,
  timeout_ms = 5000,
  resource_limit = 8,
  started_at = Date.now(),
} = {}) {
  const name = text(capability);
  const build_id = id("build");
  const edges = Array.isArray(depends_on) ? depends_on.map(text).filter(Boolean) : [];
  const seen = new Set(Object.keys(graph || {}));
  if (seen.has(name) && (graph[name] || []).includes(name)) {
    return {
      build_id,
      parent_task,
      capability: name,
      status: "CYCLE_DETECTED",
      stop: true,
      depth,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  const visiting = new Set();
  const walk = (node, stack) => {
    if (visiting.has(node)) return true;
    visiting.add(node);
    const next = node === name ? edges : list(graph[node]);
    for (const child of next) {
      if (stack.includes(child)) return true;
      if (walk(child, stack.concat(child))) return true;
    }
    visiting.delete(node);
    return false;
  };
  if (walk(name, [name])) {
    return {
      build_id,
      parent_task,
      capability: name,
      dependency_graph: { [name]: edges, ...graph },
      status: "CYCLE_DETECTED",
      stop: true,
      reason: "CYCLE_DETECTED",
      depth,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  if (depth >= max_depth) {
    return {
      build_id,
      parent_task,
      capability: name,
      status: "HUMAN_HOLD",
      reason: "DEPTH_LIMIT",
      stop: true,
      depth,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  if (Date.now() - started_at > timeout_ms) {
    return {
      build_id,
      parent_task,
      capability: name,
      status: "HUMAN_HOLD",
      reason: "TIMEOUT",
      stop: true,
      depth,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  if (edges.length > resource_limit) {
    return {
      build_id,
      parent_task,
      capability: name,
      status: "HUMAN_HOLD",
      reason: "RESOURCE_LIMIT",
      stop: true,
      depth,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  return {
    build_id,
    parent_task,
    capability: name,
    dependency_graph: { [name]: edges, ...graph },
    missing: edges,
    depth,
    timeout_ms,
    resource_limit,
    stop_condition: "HUMAN_HOLD_OR_CYCLE_OR_LIMIT",
    status: "MAPPED",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function registerQualified(record = {}, { evidence = [], now = Date.now() } = {}) {
  if (record.lifecycle !== "VERIFIED" && record.lifecycle !== "READY") {
    return {
      registered: false,
      reason: "NOT_QUALIFIED",
      lifecycle: record.lifecycle || "UNKNOWN",
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  const gate = proofGate({ evidence, required: 1 });
  const current = (evidence || []).filter((row) => evidenceIsCurrent(row, now));
  if (!gate.ready || !current.length) {
    return {
      registered: false,
      reason: "INSUFFICIENT_EVIDENCE",
      lifecycle: record.lifecycle,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  return {
    registered: true,
    identity: record.capability || record.id,
    version: record.version || SELF_BUILD_VERSION,
    provenance: record.source || "self-build",
    implementation: record.implementation || null,
    dependencies: record.depends_on || [],
    tests: record.tests || [],
    measurements: record.measurements || null,
    evidence: current.map((row) => row.id || row.claim),
    constraints: record.constraints || ["no production write"],
    expiration: current[0]?.valid_until || null,
    authority_requirements: ["carl"],
    authorized: false,
    available: false,
    live: false,
    auto_merge: false,
    authority: "carl",
    ready_neq_authorized: true,
  };
}

export function admitExtension({ kind, id: extId, adapter = {} } = {}) {
  const k = text(kind).toUpperCase();
  if (PROTECTED_EXTENSION_KINDS.includes(k)) {
    return {
      admitted: false,
      reason: "PROTECTED_KIND",
      kind: k,
      core_modified: false,
      authorized: false,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }
  const admittedKind = EXTENSION_KINDS.includes(k) ? k : "UNKNOWN";
  const identity = text(extId, (admittedKind === "UNKNOWN" ? "unknown" : k.toLowerCase()) + ".unnamed");
  const contract = ["detect", "propose", "test", "measure"];
  const present = contract.filter((name) => typeof adapter[name] === "function");
  const row = {
    id: identity,
    kind: admittedKind,
    requested_kind: k || "UNKNOWN",
    adapter_methods: present,
    lifecycle: "DISCOVERED",
    authorized: false,
    live: false,
    core_modified: false,
    admitted_at: iso(),
  };
  extensions.set(identity, row);
  return {
    admitted: true,
    ...row,
    auto_merge: false,
    authority: "carl",
    status: "DISCOVERED",
    knowledge: admittedKind === "UNKNOWN" ? "UNKNOWN" : "DISCOVERED",
  };
}

export function listExtensions() {
  return [...extensions.values()].map((row) => ({ ...row, live: false, authorized: false }));
}

export function resetSelfBuild() {
  extensions.clear();
}

export function selfKnowledgeView(record = {}) {
  return Object.freeze({
    KNOW: record.exists === true,
    OBSERVED: record.knowledge === "OBSERVED" || record.exists === true,
    MEASURED: record.lifecycle === "MEASURED" || record.measured === true,
    INFERRED: record.knowledge === "INFERRED",
    PROPOSED: record.lifecycle === "PROPOSED",
    BUILT: ["BUILT", "TESTED", "MEASURED", "VERIFIED", "READY", "AVAILABLE"].includes(record.lifecycle),
    EXECUTED: record.executed === true,
    VERIFIED: record.verified === true || record.lifecycle === "VERIFIED",
    UNKNOWN: record.exists !== true && record.knowledge !== "OBSERVED",
    live: false,
  });
}

export async function runSelfBuildLoop({
  task = "",
  required = [],
  known = [],
  catalog = [],
  tools = null,
  connectors = [],
  zone = "BUILD",
  builder = null,
  tester = null,
  parent_task = null,
  depth = 0,
  max_depth = 4,
  timeout_ms = 8000,
  authorized = false,
  depends_on = {},
  autonomy = "L1",
} = {}) {
  const constitution = selfBuildConstitution();
  const z = SAFE_ZONES.includes(zone) ? zone : "BUILD";
  const requestedAutonomy = typeof builder === "function" ? "L2" : autonomy;
  const gate = assertAutonomy(typeof builder === "function" ? "build_sandbox" : "propose", {
    level: requestedAutonomy,
    authorized: false,
  });
  const phases = [];
  const mark = (phase, extra = {}) => {
    phases.push({ phase, at: iso(), ...extra });
    return extra;
  };

  mark("OBSERVE", { task: text(task) || null, autonomy: requestedAutonomy });
  mark("UNDERSTAND", { required: list(required) });

  if (gate.stop) {
    return {
      version: SELF_BUILD_VERSION,
      status: "HUMAN_HOLD",
      reason: gate.reason,
      phases,
      zone: z,
      used: false,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }

  if (z === "PRODUCTION") {
    const hold = { status: "HUMAN_HOLD", reason: "PRODUCTION_WRITE_FORBIDDEN", phases, live: false, auto_merge: false, authority: "carl" };
    mark("DETECT_GAP", { stop: true, reason: hold.reason });
    return hold;
  }

  const detection = detectGaps({ task, required, known, catalog, tools, connectors });
  mark("DETECT_GAP", { gaps: detection.gaps.length, holds: detection.holds.length, found: detection.found.length });

  if (detection.holds.length) {
    return {
      version: SELF_BUILD_VERSION,
      status: "HUMAN_HOLD",
      reason: detection.holds[0].reason,
      detection,
      phases,
      zone: z,
      live: false,
      auto_merge: false,
      authority: "carl",
    };
  }

  const proposals = [];
  for (const gap of detection.gaps) {
    const deps = discoverDependencies({
      capability: gap.capability,
      depends_on: depends_on[gap.capability] || [],
      graph: depends_on,
      parent_task,
      depth,
      max_depth,
      timeout_ms,
    });
    if (deps.stop) {
      return {
        version: SELF_BUILD_VERSION,
        status: deps.status,
        reason: deps.reason || deps.status,
        detection,
        dependency: deps,
        phases,
        zone: z,
        live: false,
        auto_merge: false,
        authority: "carl",
      };
    }
    const proposal = proposeBuild(gap, { zone: z });
    mark("PROPOSE", { capability: gap.capability, status: proposal.status });
    if (proposal.status === "HUMAN_HOLD") {
      return {
        version: SELF_BUILD_VERSION,
        status: "HUMAN_HOLD",
        reason: proposal.reason,
        detection,
        phases,
        zone: z,
        live: false,
        auto_merge: false,
        authority: "carl",
      };
    }
    let record = { ...proposal, lifecycle: "PROPOSED", capability: gap.capability };
    record = advanceLifecycle(record, "DESIGNED");
    mark("DESIGN", { capability: gap.capability });

    let built = null;
    if (typeof builder === "function") {
      built = await builder({ gap, proposal: record, zone: z });
      if (built?.written === true && z !== "PRODUCTION") {
        record = advanceLifecycle(record, "BUILT", { evidence: { observed: true } });
        record.implementation = built.path || built.implementation || null;
        mark("BUILD", { capability: gap.capability, written: true, zone: z });
      } else {
        mark("BUILD", { capability: gap.capability, written: false, reason: built?.reason || "BUILDER_DID_NOT_WRITE" });
      }
    } else {
      mark("BUILD", { capability: gap.capability, written: false, reason: "NO_BUILDER_PROPOSAL_ONLY" });
    }

    let tests = [];
    if (record.lifecycle === "BUILT" && typeof tester === "function") {
      const started = new Date().toISOString();
      const result = await tester({ record, gap });
      const ended = new Date().toISOString();
      const executed = result?.executed === true;
      tests = [{
        name: result?.name || "supplied",
        generated: result?.generated === true,
        executed,
        passed: executed && result?.passed === true,
      }];
      const falsified = falsifyCapability({ claim: gap.capability, tests, evidence: result?.evidence || [] });
      mark("TEST", { executed, passed: tests[0].passed });
      mark("FALSIFY", { status: falsified.status, reasons: falsified.reasons });
      if (executed) {
        record = advanceLifecycle(record, "TESTED", { evidence: { tests_executed: true } });
      }
      const measurement = measureCapability({
        observations: executed ? [{ success: tests[0].passed === true }] : [],
        started_at: started,
        ended_at: ended,
      });
      if (measurement.observed) {
        if (record.lifecycle === "TESTED") {
          record = advanceLifecycle(record, "MEASURED", { evidence: { observed: true } });
        }
        mark("MEASURE", measurement);
      } else {
        mark("MEASURE", { status: "INSUFFICIENT_EVIDENCE" });
      }
      if (measurement.observed && tests[0].passed && falsified.status === "NOT_FALSIFIED") {
        const ev = registerEvidence({
          claim: "self-build:" + gap.capability,
          source: "acorn-self-build",
          strength: 1,
          margin: 0.2,
          validUntil: new Date(Date.now() + 86400000).toISOString(),
        });
        record = advanceLifecycle(record, "VERIFIED", { evidence: { verified: true } });
        mark("VERIFY", { verified: true, evidence_id: ev.id });
        const registered = registerQualified(record, { evidence: [ev] });
        mark("REGISTER", { registered: registered.registered });
        mark("USE", { used: false, reason: "READY_NEQ_AUTHORIZED" });
        proposals.push({ record, registered, evidence: ev, falsified, measurement });
      } else {
        mark("VERIFY", { verified: false, reason: falsified.status });
        mark("REGISTER", { registered: false });
        mark("USE", { used: false, reason: "NOT_QUALIFIED" });
        proposals.push({ record, registered: { registered: false }, falsified, measurement });
      }
    } else {
      const generated = [{ name: "generated-placeholder", generated: true, executed: false, passed: false }];
      const falsified = falsifyCapability({ claim: gap.capability, tests: generated });
      mark("TEST", { executed: false, generated: true });
      mark("FALSIFY", { status: falsified.status });
      mark("MEASURE", { status: "INSUFFICIENT_EVIDENCE" });
      mark("VERIFY", { verified: false, reason: "INSUFFICIENT_EVIDENCE" });
      mark("REGISTER", { registered: false });
      mark("USE", { used: false, reason: "NOT_QUALIFIED" });
      proposals.push({ record, falsified, registered: { registered: false } });
    }
  }

  const sep = assertCapabilityAuthoritySeparation({ capability: 100, authority: 0, actor: "self-build" });
  const used = false;
  const learned = learnFromLoop({
    task,
    gaps: detection.gaps.map((g) => g.capability),
    proposals: proposals.map((row) => row.record?.lifecycle || row.record?.status || "UNKNOWN"),
    used,
  });
  mark("LEARN", { recorded: true, promoted: false, authorized: false });
  return {
    version: SELF_BUILD_VERSION,
    status: detection.gaps.length ? (proposals.some((row) => row.record?.lifecycle === "VERIFIED") ? "PROPOSED" : "GAP_DETECTED") : "NO_GAP",
    detection,
    proposals,
    phases,
    learned,
    zone: z,
    used,
    authorized: false,
    human_authorized: authorized === true,
    autonomy: autonomyLevel(requestedAutonomy),
    capability_is_not_authority: sep.capability_is_not_authority,
    constitution,
    live: false,
    auto_merge: false,
    authority: "carl",
    digest: digest({ task, required, zone: z, gaps: detection.gaps.map((g) => g.capability) }),
  };
}

export function assertSelfBuildInvariant(result = {}) {
  const c = selfBuildConstitution();
  if (c.second_architecture !== false) throw new Error("SELF_BUILD_INVARIANT:ARCHITECTURE");
  if (result.live === true) throw new Error("SELF_BUILD_INVARIANT:LIVE");
  if (result.auto_merge === true) throw new Error("SELF_BUILD_INVARIANT:AUTO_MERGE");
  if (result.authorized === true && result.authority !== "carl") throw new Error("SELF_BUILD_INVARIANT:AUTHORITY");
  if (result.used === true && result.authorized !== true) throw new Error("SELF_BUILD_INVARIANT:USE_WITHOUT_AUTHORITY");
  if (FORBIDDEN_SELF_CLAIMS.includes(result.status)) throw new Error("SELF_BUILD_INVARIANT:FORBIDDEN_STATUS");
  const sep = assertCapabilityAuthoritySeparation({ capability: 1, authority: 0, actor: "self-build" });
  if (sep.capability_is_not_authority !== true) throw new Error("SELF_BUILD_INVARIANT:CAPABILITY_AUTHORITY");
  return true;
}

export function notYetImplemented() {
  return Object.freeze([
    "automatic production writes",
    "self-merge",
    "self-authorization of critical capabilities",
    "replacement of a critical capability because a new version looks better",
    "invented commercial value or real transactions",
    "LIVE claims from local construction",
    "connector execution from a newly built adapter without human authorization",
    "recursive unbounded builds",
    "secret custody",
    "constitutional modification",
    "L6 authorized real-world execution",
    "L7 human approval remaining Carl",
    "automatic promotion of an improvement",
  ]);
}

export function implementedNow() {
  return Object.freeze([
    "capability gap detection",
    "generic self-build loop",
    "safe build zone enforcement",
    "lifecycle without silent skips",
    "self-falsification including INSUFFICIENT_EVIDENCE",
    "measurement from observations only",
    "qualified registration without authority",
    "dependency cycle and depth limits",
    "HUMAN_HOLD stop conditions",
    "extension admission without core modification",
    "autonomy levels L0-L7 with no self-escalation",
    "LEARN without promotion",
    "repair proposal without deploy",
    "improvement proposal without silent replace",
    "product candidate is not a product",
    "howAcornBuilds transfer contract",
  ]);
}

function isMain() {
  const here = new URL(import.meta.url).pathname;
  const argv1 = process.argv[1] ? String(process.argv[1]) : "";
  return argv1.endsWith("acorn-self-build.mjs") || here === argv1;
}

if (isMain()) {
  const result = await runSelfBuildLoop({
    task: "Observe missing capabilities without claiming they exist",
    required: ["analysis", "brand-new-meter"],
    known: [{ name: "analysis", exists: true, available: false, reason: "CODE_PRESENT" }],
  });
  assertSelfBuildInvariant(result);
  console.log(JSON.stringify({
    version: result.version,
    status: result.status,
    gaps: result.detection.gaps.map((g) => g.capability),
    found: result.detection.found.map((g) => g.capability),
    learned: result.learned,
    autonomy: result.autonomy,
    how: howAcornBuilds().steps.map((s) => s.name),
    live: result.live,
    auto_merge: result.auto_merge,
    authority: result.authority,
    implemented: implementedNow(),
    not_yet: notYetImplemented(),
  }, null, 2));
}
