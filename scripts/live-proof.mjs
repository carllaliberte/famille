#!/usr/bin/env node
/**
 * ACORN LIVE PROOF
 * External probe + evaluator. LIVE_VERIFIED is not a flag.
 * Preview ≠ receipt. A 200 is not LIVE. Carl merges. auto_merge=false.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { sealEvidence } from "./evidence-seal.mjs";

export const LIVE_CONTRACT_VERSION = "live-proof.v1";
export const VITRINE = "https://acorn-royal-dune-blend.grok.me";
export const CANAL = "https://acorn-juge.laliberte22.workers.dev";
export const CRITICAL_PATH = "/juge?quelle=os&temoin=aucun&epsilon=0.1&horizon=2027-12-31";
export const EPSILON_ZERO_PATH = "/juge?quelle=os&temoin=aucun&epsilon=0&horizon=2027-12-31";
export const MISSING_EPSILON_PATH = "/juge?quelle=os&temoin=aucun&horizon=2027-12-31";

const HEADER_KEEP = new Set(["content-type", "server", "x-acorn-sha", "x-git-sha", "x-commit-sha", "x-vercel-id", "cache-control"]);

function isFakeClaim(json, text) {
  const status = String(json?.status || json?.mode || "");
  if (status === "QUANTUM" || status === "CERTIFIED") return true;
  if (json?.qkd === true) return true;
  if (/\bCERTIFIED\b/.test(text) && json?.status !== "CLASSIQUE") return true;
  if (/S\s*=\s*2\.420/.test(text)) return true;
  if (/\bPRÉSENT\b/.test(text)) return true;
  return false;
}

export function classifyError(error) {
  const text = String(error?.cause?.code || error?.code || error?.message || error);
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo|nodename/i.test(text)) return "DNS_FAILURE";
  if (/CERT|SSL|TLS|UNABLE_TO_VERIFY/i.test(text)) return "TLS_FAILURE";
  if (/ABORT|TIMEOUT|ETIMEDOUT|ECONNRESET|ECONNREFUSED|fetch failed/i.test(text)) return "NETWORK_FAILURE";
  return "NETWORK_FAILURE";
}

export function extractSha(probe) {
  const headers = probe?.headers || {};
  for (const key of ["x-acorn-sha", "x-git-sha", "x-commit-sha"]) {
    const value = headers[key];
    if (value && /^[0-9a-f]{40}$/i.test(String(value).trim())) return String(value).trim().toLowerCase();
  }
  const json = probe?.json;
  for (const key of ["git_sha", "source_sha", "sha", "tested_sha"]) {
    const value = json?.[key];
    if (value && /^[0-9a-f]{40}$/i.test(String(value).trim())) return String(value).trim().toLowerCase();
  }
  return null;
}

export async function probeUrl(url, { method = "GET", body, headers, fetchImpl = fetch, timeoutMs = 15000 } = {}) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method,
      body,
      headers: { "user-agent": "acorn-live-probe/1", ...(headers || {}) },
      signal: controller.signal,
    });
    const raw = Buffer.from(await response.arrayBuffer()).subarray(0, 8192);
    const text = raw.toString("utf8");
    const headerMap = {};
    response.headers.forEach((value, key) => {
      const name = key.toLowerCase();
      if (HEADER_KEEP.has(name)) headerMap[name] = value;
    });
    let json = null;
    if ((headerMap["content-type"] || "").includes("application/json")) {
      try { json = JSON.parse(text); } catch { json = null; }
    }
    return {
      url,
      method,
      class: response.status >= 500 ? "HTTP_FAILURE" : (response.status >= 400 ? "HTTP_FAILURE" : "OK"),
      status: response.status,
      content_type: headerMap["content-type"] || null,
      latency_ms: Date.now() - started,
      headers: headerMap,
      json,
      body_prefix: text.slice(0, 500),
      sha: extractSha({ headers: headerMap, json }),
    };
  } catch (error) {
    return {
      url,
      method,
      class: classifyError(error),
      status: null,
      latency_ms: Date.now() - started,
      error: String(error?.message || error).slice(0, 240),
      json: null,
      sha: null,
    };
  } finally {
    clearTimeout(timer);
  }
}

function statusOf(ok) {
  return ok ? "VERIFIED" : "BLOCKED";
}

function block(reason, observed, expected, extra = {}) {
  return { overall_status: "LIVE_BLOCKED", blocking_reason: reason, observed_value: observed, expected_value: expected, ...extra };
}

export function evaluateLive(input) {
  const testedSha = String(input?.tested_sha || "").trim().toLowerCase();
  const source = input?.source || "unknown";
  const authority = input?.authority || "carl";
  const autoMerge = input?.auto_merge === true;
  const vitrine = input?.vitrine_home;
  const privacy = input?.vitrine_privacy;
  const canalHome = input?.canal_home;
  const critical = input?.critical_juge;
  const epsilonZero = input?.epsilon_zero;
  const missingEpsilon = input?.missing_epsilon;
  const runtime = input?.runtime || {};

  const base = {
    live_contract_version: LIVE_CONTRACT_VERSION,
    tested_sha: testedSha || null,
    tested_at: input?.tested_at || null,
    public_entrypoint: VITRINE,
    critical_endpoint: CANAL + CRITICAL_PATH,
    source,
    authority,
    auto_merge: false,
    live: false,
    fake_certified: false,
    fake_quantum: false,
    fake_qkd: false,
  };

  if (source !== "external_probe") {
    return { ...base, ...block("FIXTURE_FORBIDDEN", source, "external_probe"), live: false };
  }
  if (autoMerge) {
    return { ...base, ...block("AUTO_MERGE_FORBIDDEN", true, false) };
  }
  if (authority !== "carl") {
    return { ...base, ...block("AUTHORITY_NOT_CARL", authority, "carl") };
  }
  if (!testedSha || !/^[0-9a-f]{40}$/.test(testedSha)) {
    return { ...base, ...block("SHA_UNKNOWN", testedSha || null, "40-char git sha") };
  }

  const code = Boolean(testedSha);
  const publicOk = vitrine?.class === "OK" && vitrine?.status === 200 && String(vitrine.content_type || "").includes("text/html");
  const privacyOk = privacy?.status === 200;
  const canalReachable = ["OK", "HTTP_FAILURE"].includes(canalHome?.class);
  const criticalJson = critical?.status === 200 && critical?.json && typeof critical.json === "object";
  const previewFlag = critical?.json?.preview;
  const receipt = critical?.json?.receipt;
  const fake = isFakeClaim(critical?.json, `${critical?.json?.phrase || ""} ${critical?.body_prefix || ""}`);
  const epsilonZeroRefused = epsilonZero?.status === 400 && (epsilonZero?.json?.error === "lie" || /lie/i.test(String(epsilonZero?.json?.phrase || "")));
  const missingRefused = missingEpsilon?.status === 400;
  const deployedSha = extractSha(critical) || extractSha(vitrine);
  const provenanceOk = Boolean(deployedSha);
  const versionOk = provenanceOk && deployedSha === testedSha;
  const runtimeOk = runtime?.runtime_active === true && runtime?.auto_merge === false;
  const securityOk = !autoMerge && authority === "carl" && !String(JSON.stringify(input)).includes("sk-") && !String(JSON.stringify(input)).includes("Bearer ");

  const codeStatus = statusOf(code);
  const publicStatus = statusOf(publicOk && canalReachable);
  const criticalStatus = statusOf(criticalJson && epsilonZeroRefused && missingRefused && !fake);
  const provenanceStatus = statusOf(versionOk);
  const runtimeStatus = statusOf(runtimeOk);
  const securityStatus = statusOf(securityOk);
  const continuityStatus = statusOf(runtime?.continuity === true);

  let blocked = null;
  if (!publicOk) blocked = block("PUBLIC_ENTRYPOINT_MISSING", vitrine?.status ?? vitrine?.class, 200);
  else if (!criticalJson) blocked = block("CRITICAL_FLOW_FAILURE", { status: critical?.status, class: critical?.class, type: critical?.content_type }, "GET /juge JSON 200");
  else if (fake) blocked = block("CONTRACT_FAILURE", (critical?.body_prefix || "").slice(0, 160), "no CERTIFIED/QUANTUM/QKD/PRÉSENT");
  else if (!epsilonZeroRefused) blocked = block("EPSILON_ZERO_ACCEPTED", epsilonZero?.status, 400);
  else if (!missingRefused) blocked = block("CONTRACT_FAILURE", missingEpsilon?.status, "400 missing epsilon");
  else if (previewFlag !== false) blocked = block("PREVIEW_NOT_RECEIPT", { preview: previewFlag, receipt }, "preview=false with provenance sha");
  else if (receipt === true) blocked = block("CONTRACT_FAILURE", { receipt }, "receipt is not a quittance this canal may mint");
  else if (!provenanceOk) blocked = block("PROVENANCE_FAILURE", deployedSha, "deployed git sha");
  else if (!versionOk) blocked = block("VERSION_MISMATCH", deployedSha, testedSha);
  else if (critical?.json?.live === true && (previewFlag !== false || !versionOk)) {
    blocked = block("LIVE_FLAG_WITHOUT_PROOF", critical.json.live, false);
  }

  const overall = blocked ? "LIVE_BLOCKED" : "LIVE_VERIFIED";
  return sealEvidence({
    ...base,
    live: overall === "LIVE_VERIFIED",
    overall_status: overall,
    blocking_reason: blocked?.blocking_reason || null,
    observed_value: blocked?.observed_value || null,
    expected_value: blocked?.expected_value || null,
    deployed_sha: deployedSha,
    http_status: critical?.status ?? vitrine?.status ?? null,
    application_status: criticalJson ? (previewFlag === false ? "APPLICATION" : "PREVIEW") : "UNAVAILABLE",
    critical_flow_status: criticalStatus,
    runtime_status: runtimeStatus,
    provenance_status: provenanceStatus,
    security_status: securityStatus,
    continuity_status: continuityStatus,
    public_access_status: publicStatus,
    code_status: codeStatus,
    deployment_status: statusOf(publicOk && canalReachable),
    privacy_status: statusOf(privacyOk),
    next_action: blocked
      ? nextAction(blocked.blocking_reason)
      : "none",
  });
}

function nextAction(reason) {
  switch (reason) {
    case "PREVIEW_NOT_RECEIPT":
      return "HOLD_HUMAN: Carl wrangler deploy + bind grok.me /juge, stamp git sha, preview=false only after provenance exists";
    case "PROVENANCE_FAILURE":
    case "VERSION_MISMATCH":
      return "HOLD_HUMAN: expose x-acorn-sha (or json.git_sha) of the deployed worker matching main";
    case "PUBLIC_ENTRYPOINT_MISSING":
      return "HOLD_HUMAN: vitrine DNS/TLS/app must answer GET /";
    default:
      return "DEBUG: re-probe and repair the named blocking_reason";
  }
}

export async function runLiveProof({ fetchImpl = fetch, tested_sha, runtime, now = new Date().toISOString() } = {}) {
  const vitrine_home = await probeUrl(VITRINE + "/", { fetchImpl });
  const vitrine_privacy = await probeUrl(VITRINE + "/privacy", { fetchImpl });
  const vitrine_juge = await probeUrl(VITRINE + "/juge", { fetchImpl });
  const canal_home = await probeUrl(CANAL + "/", { fetchImpl });
  const canal_privacy = await probeUrl(CANAL + "/privacy", { fetchImpl });
  const critical_juge = await probeUrl(CANAL + CRITICAL_PATH, { fetchImpl });
  const epsilon_zero = await probeUrl(CANAL + EPSILON_ZERO_PATH, { fetchImpl });
  const missing_epsilon = await probeUrl(CANAL + MISSING_EPSILON_PATH, { fetchImpl });

  const probes = {
    vitrine_home,
    vitrine_privacy,
    vitrine_juge,
    canal_home,
    canal_privacy,
    critical_juge,
    epsilon_zero,
    missing_epsilon,
  };
  const proof = evaluateLive({
    source: "external_probe",
    tested_sha,
    tested_at: now,
    authority: "carl",
    auto_merge: false,
    runtime,
    ...probes,
  });
  return { probes, proof };
}

export function writeLiveEvidence(result, dir = "evidence/live") {
  mkdirSync(dir, { recursive: true });
  const proof = result.proof;
  writeFileSync(`${dir}/live-proof.json`, JSON.stringify(proof, null, 2) + "\n");
  writeFileSync(`${dir}/live-probe.json`, JSON.stringify(sealEvidence({
    v: "live-probe.v1",
    tested_at: proof.tested_at,
    tested_sha: proof.tested_sha,
    probes: result.probes,
    auto_merge: false,
    live: false,
  }), null, 2) + "\n");
  writeFileSync(`${dir}/live-runtime.json`, JSON.stringify(sealEvidence({
    v: "live-runtime.v1",
    tested_at: proof.tested_at,
    tested_sha: proof.tested_sha,
    ...(result.runtime || {}),
    auto_merge: false,
    live: false,
  }), null, 2) + "\n");
  writeFileSync(`${dir}/live-critical-flow.json`, JSON.stringify(sealEvidence({
    v: "live-critical-flow.v1",
    tested_at: proof.tested_at,
    tested_sha: proof.tested_sha,
    critical: result.probes.critical_juge,
    epsilon_zero: result.probes.epsilon_zero,
    missing_epsilon: result.probes.missing_epsilon,
    auto_merge: false,
    live: false,
  }), null, 2) + "\n");
  writeFileSync(`${dir}/live-provenance.json`, JSON.stringify(sealEvidence({
    v: "live-provenance.v1",
    tested_at: proof.tested_at,
    tested_sha: proof.tested_sha,
    deployed_sha: proof.deployed_sha,
    provenance_status: proof.provenance_status,
    auto_merge: false,
    live: false,
  }), null, 2) + "\n");
  const summary = [
    `# Acorn live proof`,
    ``,
    `tested_at: ${proof.tested_at}`,
    `tested_sha: ${proof.tested_sha}`,
    `overall: ${proof.overall_status}`,
    `blocker: ${proof.blocking_reason || "none"}`,
    `vitrine: ${VITRINE}`,
    `canal: ${CANAL}`,
    `live: ${proof.live}`,
    `auto_merge: false`,
    `authority: carl`,
    `next_action: ${proof.next_action}`,
    ``,
  ].join("\n");
  writeFileSync(`${dir}/live-summary.md`, summary);
  return proof;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tested_sha = process.env.GITHUB_SHA || process.argv[2] || "";
  const result = await runLiveProof({ tested_sha, runtime: { runtime_active: process.env.ACORN_RUNTIME_ACTIVE === "true", auto_merge: false, continuity: process.env.ACORN_RUNTIME_CONTINUITY === "true" } });
  result.runtime = {
    runtime_active: process.env.ACORN_RUNTIME_ACTIVE === "true",
    auto_merge: false,
    continuity: process.env.ACORN_RUNTIME_CONTINUITY === "true",
    authority: "carl",
  };
  const proof = writeLiveEvidence(result);
  console.log(JSON.stringify({ overall_status: proof.overall_status, blocking_reason: proof.blocking_reason, live: proof.live, tested_sha: proof.tested_sha }, null, 2));
  if (proof.overall_status !== "LIVE_VERIFIED" && proof.overall_status !== "LIVE_BLOCKED") process.exit(1);
}
