#!/usr/bin/env node
/**
 * ACORN CONTINUOUS MAINTENANCE FABRIC
 *
 * One bounded maintenance organism over the existing Acorn runtime.
 *
 * OBSERVE → AUDIT → CLASSIFY → CONSOLIDATE → REPAIR → TEST → FALSIFY
 * → MEASURE → VERIFY → ONE PR → CARL MERGE → OBSERVE AGAIN
 *
 * It does not create authority, merge, publish, spend, sign, or declare LIVE.
 * It deliberately turns many defects into one coherent repair mandate.
 */
import crypto from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

export const CONTINUOUS_MAINTENANCE_VERSION = "acorn.continuous-maintenance.v1";

export const MAINTENANCE_PHASES = Object.freeze([
  "OBSERVE","AUDIT","CLASSIFY","CONSOLIDATE","REPAIR","TEST","FALSIFY",
  "MEASURE","VERIFY","PR","WAIT_CARL_MERGE","REOBSERVE"
]);

export const FINDING_KINDS = Object.freeze([
  "STALE_PR","DIVERGENT_PR","FAILING_CHECK","REGRESSION","BROKEN_WORKFLOW",
  "MISSING_CAPABILITY","MISSING_EVIDENCE","QUALITY_DRIFT","SECURITY_BOUNDARY",
  "WAITING_HUMAN","ENVIRONMENT_FAILURE","TRANSIENT_FAILURE"
]);

export const HUMAN_BOUNDARIES = new Set([
  "SECRET_REQUIRED","HUMAN_AUTHORITY_REQUIRED","PAYMENT_REQUIRED",
  "MANUAL_APPROVAL_REQUIRED","PROTECTED_BRANCH","MERGE_REQUIRED",
  "PUBLISH_REQUIRED","SIGN_REQUIRED","CONTRACT_REQUIRED"
]);

const clamp = (n) => Math.max(0, Math.min(1, Number.isFinite(Number(n)) ? Number(n) : 0));
const text = (v) => String(v ?? "").trim();

function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function iso(v = Date.now()) {
  return new Date(v).toISOString();
}

export function normalizePullRequest(pr = {}, mainSha = null) {
  const ahead = Number(pr.ahead_by ?? pr.aheadBy ?? 0) || 0;
  const behind = Number(pr.behind_by ?? pr.behindBy ?? 0) || 0;
  const state = text(pr.state).toLowerCase() || "unknown";
  const draft = pr.draft === true;
  const merged = pr.merged === true;
  const mergeable = pr.mergeable === true;
  const head = text(pr.head_sha || pr.headSha || "");
  const base = text(pr.base_sha || pr.baseSha || mainSha || "");
  const divergent = ahead > 0 && behind > 0;
  const stale = behind > 0 || divergent;
  return {
    number: Number(pr.number || 0) || null,
    title: text(pr.title) || "untitled",
    state, draft, merged, mergeable, ahead, behind, divergent, stale,
    head_sha: head || null, base_sha: base || null,
    source: text(pr.head?.ref || pr.head_ref || pr.head || "unknown"),
    base: text(pr.base?.ref || pr.base_ref || pr.base || "main"),
    labels: Array.isArray(pr.labels) ? pr.labels.map(x => text(x?.name || x)).filter(Boolean) : [],
    author: text(pr.user?.login || pr.author || ""),
    url: text(pr.html_url || pr.url || ""),
  };
}

export function classifyPullRequest(pr = {}) {
  if (pr.merged || pr.state === "closed") return null;
  if (pr.base !== "main") return { kind:"STALE_PR", severity:"HIGH", reason:"BASE_NOT_MAIN" };
  if (pr.divergent) return { kind:"DIVERGENT_PR", severity:"HIGH", reason:"AHEAD_AND_BEHIND_MAIN" };
  if (pr.behind > 0) return { kind:"STALE_PR", severity:"HIGH", reason:"BEHIND_MAIN" };
  if (pr.draft) return { kind:"STALE_PR", severity:"MEDIUM", reason:"DRAFT_REQUIRES_REASSESSMENT" };
  if (pr.mergeable === false) return { kind:"STALE_PR", severity:"HIGH", reason:"NOT_MERGEABLE" };
  return null;
}

export function normalizeWorkflowRun(run = {}) {
  const conclusion = text(run.conclusion || "").toLowerCase();
  const status = text(run.status || "").toLowerCase();
  const failed = ["failure","timed_out","cancelled","action_required"].includes(conclusion);
  const transient = /429|502|503|504|timeout|econnreset|etimedout|network/i.test(
    [run.name, run.display_title, run.conclusion, run.failure_reason].filter(Boolean).join(" ")
  );
  return {
    id: Number(run.id || run.databaseId || 0) || null,
    name: text(run.name || run.workflow_name || "unknown"),
    status, conclusion, failed, transient,
    sha: text(run.head_sha || run.headSha || "") || null,
    url: text(run.html_url || run.url || ""),
  };
}

export function classifyWorkflowRun(run = {}) {
  if (!run.failed) return null;
  if (run.transient) return { kind:"TRANSIENT_FAILURE", severity:"MEDIUM", reason:"TRANSIENT_WORKFLOW_FAILURE" };
  return { kind:"BROKEN_WORKFLOW", severity:"HIGH", reason:"WORKFLOW_FAILED" };
}

export function classifyBoundary(row = {}) {
  const hay = [row.reason,row.code,row.message,row.status].filter(Boolean).join(" ").toUpperCase();
  for (const marker of HUMAN_BOUNDARIES) {
    if (hay.includes(marker)) return { kind:"WAITING_HUMAN", severity:"CRITICAL", reason:marker };
  }
  return null;
}

export function auditSnapshot(snapshot = {}) {
  const mainSha = text(snapshot.main_sha || snapshot.mainSha || "");
  const prs = (Array.isArray(snapshot.pull_requests) ? snapshot.pull_requests : [])
    .map(pr => normalizePullRequest(pr, mainSha));
  const runs = (Array.isArray(snapshot.workflow_runs) ? snapshot.workflow_runs : [])
    .map(normalizeWorkflowRun);

  const findings = [];
  for (const pr of prs) {
    const c = classifyPullRequest(pr);
    if (c) findings.push({ ...c, source:"pull_request", number:pr.number, title:pr.title, url:pr.url, behind:pr.behind, ahead:pr.ahead });
  }
  for (const run of runs) {
    const c = classifyWorkflowRun(run);
    if (c) findings.push({ ...c, source:"workflow", id:run.id, title:run.name, url:run.url, sha:run.sha });
  }
  for (const row of (Array.isArray(snapshot.boundaries) ? snapshot.boundaries : [])) {
    const c = classifyBoundary(row);
    if (c) findings.push({ ...c, source:"boundary" });
  }

  return {
    contract: CONTINUOUS_MAINTENANCE_VERSION,
    observed_at: iso(),
    main_sha: mainSha || null,
    open_pr_count: prs.filter(p => p.state === "open").length,
    open_prs: prs,
    workflow_runs: runs,
    findings,
    finding_count: findings.length,
  };
}

function priority(finding) {
  const weights = { CRITICAL:1, HIGH:0.8, MEDIUM:0.5, LOW:0.2 };
  return weights[finding.severity] ?? 0.1;
}

export function consolidateRepairPortfolio(audit) {
  const findings = Array.isArray(audit?.findings) ? audit.findings : [];
  const actionable = findings.filter(f => f.kind !== "WAITING_HUMAN");
  const human = findings.filter(f => f.kind === "WAITING_HUMAN");

  const byKind = {};
  for (const f of actionable) {
    byKind[f.kind] ||= [];
    byKind[f.kind].push(f);
  }

  const ranked = [...actionable].sort((a,b) => priority(b)-priority(a));
  const fingerprint = digest({
    main_sha:audit?.main_sha || null,
    findings:findings.map(f => ({
      kind:f.kind,source:f.source,number:f.number,id:f.id,reason:f.reason
    }))
  });

  const action = human.length && !actionable.length
    ? "HOLD_HUMAN"
    : actionable.length
      ? "REPAIR_PORTFOLIO"
      : "OBSERVE";

  return {
    contract: CONTINUOUS_MAINTENANCE_VERSION,
    action,
    one_coherent_change: actionable.length > 0,
    no_micro_tasks: true,
    portfolio_id: `maintenance:${fingerprint.slice(0,16)}`,
    main_sha: audit?.main_sha || null,
    finding_count: findings.length,
    actionable_count: actionable.length,
    human_count: human.length,
    ranked_findings: ranked,
    by_kind: byKind,
    human_boundaries: human,
    target_lifecycle: actionable.length
      ? ["CURRENT_MAIN","RECOVER_USEFUL_WORK","RECOMPOSE","REPAIR","TEST","FALSIFY","MEASURE","VERIFY","ONE_PR","WAIT_CARL_MERGE","REOBSERVE"]
      : ["OBSERVE","CONTINUE"],
    invariants: [
      "MAIN_IS_REALITY",
      "CURRENT_MAIN_IS_BASE",
      "NO_DIRECT_MERGE_OF_DIVERGENT_BRANCH",
      "ONE_COHERENT_REPAIR_PR",
      "NO_MICRO_TASKS",
      "NO_AUTO_MERGE",
      "NO_AI_AUTHORITY",
      "NO_FAKE_LIVE",
      "NO_FAKE_VERIFIED",
      "NO_FAKE_PAYMENT",
      "CAPABILITY_NE_AUTHORITY",
      "HUMAN_SECRET_BOUNDARY",
      "REPAIR_REQUIRES_TEST",
      "REPAIR_REQUIRES_FALSIFICATION",
      "REPAIR_REQUIRES_MEASUREMENT",
      "REPAIR_REQUIRES_VERIFICATION"
    ],
    priority_score: ranked.reduce((s,f)=>s+priority(f),0),
    generated_at: iso()
  };
}

export function buildRepairMandate({ audit, portfolio, repo="carllaliberte/famille" } = {}) {
  const lines = [
    "# ACORN — CONTINUOUS MAINTENANCE MANDATE",
    "",
    "This is ONE coherent repair/evolution chantier. Do not split it into micro-PRs.",
    "",
    `Repository: ${repo}`,
    `MAIN observed: ${audit?.main_sha || "UNKNOWN"}`,
    `Portfolio: ${portfolio?.portfolio_id || "UNKNOWN"}`,
    "",
    "## Mission",
    "Start from the exact current MAIN. Audit all open PRs, workflow failures, regressions and capability gaps. Recover useful work, discard obsolete work, recompose everything on current MAIN, repair it, test it, falsify it, measure it, verify it, and open ONE clean PR.",
    "",
    "## Mandatory loop",
    "OBSERVE → AUDIT EVERYTHING → CLASSIFY → RECOVER USEFUL WORK → RECOMPOSE ON CURRENT MAIN → REPAIR → TEST → FALSIFY → MEASURE → VERIFY → ONE PR → CARL MERGE → REOBSERVE",
    "",
    "## Findings",
    ...((portfolio?.ranked_findings || []).map((f,i)=>`${i+1}. [${f.severity}] ${f.kind} — ${f.reason} — ${f.source}${f.number ? ` #${f.number}` : ""}`)),
    "",
    "## Non-negotiable boundaries",
    "- Never auto-merge.",
    "- Never grant authority to an AI/provider because it can code or repair.",
    "- Never invent LIVE, VERIFIED, EXECUTED, CONNECTED, PAYMENT, REVENUE or customer value.",
    "- Never merge a stale/divergent branch directly.",
    "- Human secrets, payments, contracts, signatures, publication and merge remain human/server-controlled.",
    "- If a human boundary is reached, preserve the work and report WAITING_HUMAN rather than pretending success.",
    "",
    "## Completion contract",
    "The PR is only ready for Carl when the current-main-derived change has passed repository checks and its evidence distinguishes CODE_PRESENT, TESTED, EXECUTED, MEASURED, VERIFIED and LIVE.",
    ""
  ];
  return lines.join("\n");
}

export function nextAction(snapshot = {}) {
  const audit = auditSnapshot(snapshot);
  const portfolio = consolidateRepairPortfolio(audit);
  return {
    ...portfolio,
    audit,
    mandate: buildRepairMandate({ audit, portfolio, repo:snapshot.repository || "carllaliberte/famille" }),
    auto_merge:false,
    live:false,
    authority:"carl"
  };
}

export function assertMaintenanceContract(result = {}) {
  if (result.auto_merge === true) throw new Error("MAINTENANCE_AUTO_MERGE_FORBIDDEN");
  if (result.live === true) throw new Error("MAINTENANCE_LIVE_CLAIM_FORBIDDEN");
  if (result.authority !== "carl") throw new Error("MAINTENANCE_AUTHORITY_MUST_REMAIN_HUMAN");
  if (result.one_coherent_change === true && result.no_micro_tasks !== true) throw new Error("MAINTENANCE_MICRO_TASK_SPLIT_FORBIDDEN");
  return true;
}

export function writeMandate(path, result) {
  const payload = {
    ...result,
    generated_at: result.generated_at || iso(),
    mandate: result.mandate || ""
  };
  writeFileSync(path, `${JSON.stringify(payload,null,2)}\n`);
  return payload;
}

function loadInput(path) {
  if (path) return JSON.parse(readFileSync(path,"utf8"));
  if (process.env.ACORN_MAINTENANCE_SNAPSHOT) return JSON.parse(process.env.ACORN_MAINTENANCE_SNAPSHOT);
  return {
    repository:process.env.GITHUB_REPOSITORY || "carllaliberte/famille",
    main_sha:process.env.GITHUB_SHA || "",
    pull_requests:[],
    workflow_runs:[]
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = loadInput(process.argv[2]);
  const result = nextAction(input);
  assertMaintenanceContract(result);
  const out = process.env.ACORN_MAINTENANCE_OUTPUT || ".acorn/continuous-maintenance.json";
  writeMandate(out, result);
  console.log(JSON.stringify({
    action:result.action,
    portfolio_id:result.portfolio_id,
    findings:result.finding_count,
    actionable:result.actionable_count,
    output:out,
    auto_merge:false,
    live:false
  },null,2));
}
