import fs from "node:fs";
import path from "node:path";
import { measureArchitecture, convergenceVerdict } from "./acorn-measured-global-convergence.mjs";

export const CONTRACT = "acorn.self-auditing-system.v1";
export const AUDIT_VERSION = "1.0.0";

const A = v => Array.isArray(v) ? v : [];
const exists = p => fs.existsSync(p);

function walk(root, dir, predicate) {
  const base = path.join(root, dir);
  if (!exists(base)) return [];
  const out = [];
  const visit = current => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (predicate(entry.name, full)) out.push(path.relative(root, full).split(path.sep).join("/"));
    }
  };
  visit(base);
  return out.sort();
}

function readText(root, relativePath) {
  try { return fs.readFileSync(path.join(root, relativePath), "utf8"); }
  catch { return ""; }
}

function unique(values) { return [...new Set(values)]; }

function architectureRecords(root) {
  const docs = walk(root, "docs/architecture", n => n.endsWith(".md"));
  return docs.map(file => {
    const text = readText(root, file);
    const contract = (text.match(/acorn\.[A-Za-z0-9._-]+\.v\d+/) || [null])[0];
    const runtimeHints = unique([...text.matchAll(/(?:scripts\/)?acorn-[a-z0-9-]+\.mjs/g)].map(m => m[0].replace(/^scripts\//, "")));
    return { file, contract, runtimeHints };
  });
}

function runtimeRecords(root) {
  return walk(root, "scripts", n => n.startsWith("acorn-") && n.endsWith(".mjs")).map(file => {
    const text = readText(root, file);
    const contracts = unique([...text.matchAll(/acorn\.[A-Za-z0-9._-]+\.v\d+/g)].map(m => m[0]));
    return {
      file,
      contracts,
      exports: [...text.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)/g)].map(m => m[1]),
      hasConstitution: /assert[A-Za-z0-9_]*Constitution/.test(text),
      hasAuthorityBoundary: /authority|auto_authorize|auto_execute|human_authoriz/i.test(text)
    };
  });
}

function testRecords(root) {
  return walk(root, "test", n => /(?:test|spec)\.(?:mjs|js|cjs)$/.test(n))
    .concat(walk(root, "tests", n => /(?:test|spec)\.(?:mjs|js|cjs)$/.test(n)));
}

function workflowRecords(root) {
  return walk(root, ".github/workflows", n => /\.(?:yml|yaml)$/.test(n));
}

function governanceSignals(root, runtime) {
  const all = runtime.map(r => readText(root, r.file)).join("\n");
  return {
    capabilityAuthorityBoundary: /CAPABILITY\s*[≠!=]+\s*AUTHORITY|authority\s*[:=]\s*["']?false/i.test(all),
    autoMergeDisabled: /auto[_-]?merge\s*[:=]\s*["']?false/i.test(all),
    breakerAware: /breaker/i.test(all),
    humanGateAware: /human[_-]?authoriz|carl/i.test(all),
    liveEvidenceAware: /LIVE_VERIFIED|live.*evidence|physical.*observation/i.test(all)
  };
}

function issue(id, kind, detail, evidence = []) {
  return { id, kind, detail, evidence };
}

function buildGapInventory(root, arch, runtime, tests, workflows) {
  const runtimeByFile = new Map(runtime.map(r => [r.file, r]));
  const testText = tests.map(f => readText(root, f)).join("\n");
  const gaps = [];

  for (const a of arch) {
    const hints = a.runtimeHints;
    const candidates = hints.length ? hints.filter(h => runtimeByFile.has("scripts/" + h)) : [];
    if (!candidates.length) {
      gaps.push(issue(a.file + ":IMPLEMENTATION", "IMPLEMENTATION", "Architecture declaration has no directly referenced runtime module.", [a.file]));
    }
    if (a.contract && !runtime.some(r => r.contracts.includes(a.contract))) {
      gaps.push(issue(a.file + ":CONTRACT_RUNTIME_LINK", "INTEGRATION", "Declared contract was not found in an Acorn runtime module.", [a.file]));
    }
  }

  for (const r of runtime) {
    const directTest = tests.some(t => {
      const tText = readText(root, t);
      return tText.includes(path.basename(r.file)) || r.contracts.some(c => tText.includes(c));
    });
    if (!directTest) gaps.push(issue(r.file + ":TEST_COVERAGE", "TESTS", "No directly attributable test reference was detected.", [r.file]));
    if (!r.contracts.length) gaps.push(issue(r.file + ":CONTRACT", "CONTRACT", "Runtime module exposes no detectable versioned Acorn contract.", [r.file]));
    if (!r.hasConstitution) gaps.push(issue(r.file + ":CONSTITUTION", "GOVERNANCE", "No detectable constitution assertion was found.", [r.file]));
  }

  if (!workflows.length) gaps.push(issue("ci:WORKFLOWS", "CI", "No GitHub Actions workflow files were detected.", []));
  if (!testText.trim() && runtime.length) gaps.push(issue("tests:DISCOVERY", "TEST_DISCOVERY", "Runtime exists but no test corpus was discovered in test/ or tests/.", []));

  return gaps;
}

export function auditAcorn({
  root = process.cwd(),
  evidence = [],
  contracts = []
} = {}) {
  const architecture = architectureRecords(root);
  const runtime = runtimeRecords(root);
  const tests = testRecords(root);
  const workflows = workflowRecords(root);
  const governance = governanceSignals(root, runtime);
  const convergence = measureArchitecture({ root, contracts, runtime: runtime.map(r => path.basename(r.file)), evidence });
  const gaps = buildGapInventory(root, architecture, runtime, tests, workflows);

  const contractCoverage = architecture.filter(a => a.contract && runtime.some(r => r.contracts.includes(a.contract))).length;
  const audit = {
    contract: CONTRACT,
    version: AUDIT_VERSION,
    generated_at: new Date().toISOString(),
    state: gaps.length ? "GAPS_DETECTED" : "NO_STRUCTURAL_GAPS_DETECTED",
    truth: "STRUCTURAL_AUDIT_NOT_LIVE_PROOF",
    inventory: {
      architecture_docs: architecture.length,
      runtime_modules: runtime.length,
      tests: tests.length,
      workflows: workflows.length
    },
    coverage: {
      architecture_contract_runtime_links: contractCoverage,
      architecture_contracts_declared: architecture.filter(a => a.contract).length,
      convergence_verified_coverage: convergence.coverage
    },
    governance,
    architecture,
    runtime,
    gaps,
    convergence: {
      state: convergence.state,
      missing: convergence.missing,
      counts: convergence.counts
    },
    authority: false,
    auto_authorize: false,
    auto_execute: false,
    live: false
  };
  return audit;
}

export function classifyAuditGaps(audit = {}) {
  const groups = {};
  for (const gap of A(audit.gaps)) {
    groups[gap.kind] ??= [];
    groups[gap.kind].push(gap.id);
  }
  return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)));
}

export function buildAuditActions(audit = {}) {
  const groups = classifyAuditGaps(audit);
  return Object.entries(groups).map(([kind, ids]) => ({
    kind,
    count: ids.length,
    action: kind === "IMPLEMENTATION" ? "IMPLEMENT_AND_REAUDIT"
      : kind === "TESTS" ? "ADD_TEST_COVERAGE_AND_REAUDIT"
      : kind === "GOVERNANCE" ? "REVIEW_CONSTITUTION_BOUNDARY_AND_REAUDIT"
      : kind === "CI" ? "RESTORE_OR_ADD_CI_AND_REAUDIT"
      : "REPAIR_LINKAGE_AND_REAUDIT",
    evidence: ids
  }));
}

export function assertSelfAuditingConstitution(audit = {}) {
  const violations = [];
  if (audit.authority === true) violations.push("AUTHORITY_ESCALATION");
  if (audit.auto_authorize === true) violations.push("AUTO_AUTHORIZATION");
  if (audit.auto_execute === true) violations.push("AUTO_EXECUTION");
  if (audit.live === true) violations.push("FAKE_LIVE");
  if (audit.gaps?.some(g => g.kind === "PRIORITY" && !g.evidence?.length)) violations.push("UNSUPPORTED_PRIORITY");
  return { contract: CONTRACT, valid: violations.length === 0, violations };
}

export function runSelfAudit(options = {}) {
  const audit = auditAcorn(options);
  const actions = buildAuditActions(audit);
  const constitution = assertSelfAuditingConstitution(audit);
  const convergenceVerdictResult = convergenceVerdict({
    ...audit.convergence,
    authority: audit.authority,
    auto_authorize: audit.auto_authorize,
    auto_execute: audit.auto_execute
  });
  return {
    contract: CONTRACT,
    audit,
    actions,
    constitution,
    convergence_verdict: convergenceVerdictResult,
    next_step: actions.length ? "CLOSE_MEASURED_GAPS" : "REOBSERVE_SYSTEM"
  };
}
