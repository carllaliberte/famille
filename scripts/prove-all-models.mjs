#!/usr/bin/env node
/**
 * Explicit provider proof pass. Bypasses trigger/cadence selection and attempts
 * every roster model with status=auto that has a configured transport in review.mjs.
 * Never merges, never writes source, never claims LIVE.
 */
import { writeFileSync } from "node:fs";
import {
  MODELS,
  reviewOne,
  loadPrompt,
  loadCanon,
  buildUserMessage,
} from "../.github/swarm/review.mjs";

const env = process.env;
const token = String(env.GITHUB_TOKEN || "").trim();
const repo = String(env.GITHUB_REPOSITORY || "").trim();
const pr = String(env.PR_NUMBER || "").trim();

function autoModels() {
  return Object.values(MODELS).filter((spec) => spec.auto);
}

async function github(path, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method: options.method || "GET",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
      ...(options.body ? { "content-type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`github ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  return json;
}

function secretState(spec) {
  return Boolean(String(env[spec.secret] || "").trim());
}

async function main() {
  if (!token || !repo || !pr) throw new Error("GITHUB_TOKEN, GITHUB_REPOSITORY and PR_NUMBER are required");

  const [owner, name] = repo.split("/");
  const pull = await github(`/repos/${owner}/${name}/pulls/${pr}`);
  const fileRows = await github(`/repos/${owner}/${name}/pulls/${pr}/files?per_page=100`);
  const files = (fileRows || []).map((f) => f.filename);
  const diff = (fileRows || []).map((f) => `--- ${f.filename}\n${f.patch || ""}`).join("\n\n");
  const user = buildUserMessage({
    title: pull.title || "",
    body: pull.body || "",
    diff,
    files,
    canon: loadCanon(),
  });
  const system = loadPrompt();

  const specs = autoModels();
  const results = [];
  for (const spec of specs) {
    const started = Date.now();
    const result = await reviewOne(spec, system, user, env);
    results.push({
      id: spec.id,
      model: spec.model,
      provider: spec.provider,
      secret_configured: secretState(spec),
      status: result?.skipped ? "SKIPPED" : result?.error ? "ERROR" : result?.text ? "SUCCEEDED" : "EMPTY",
      reason: result?.reason || result?.error || "",
      via: result?.via || "",
      latency_ms: Date.now() - started,
      text_present: Boolean(result?.text),
    });
  }

  const counts = results.reduce((a, r) => {
    a[r.status] = (a[r.status] || 0) + 1;
    return a;
  }, {});
  const evidence = {
    generated_at: new Date().toISOString(),
    repo,
    ref: env.PROOF_REF || "",
    pr: Number(pr),
    policy: { merge: false, live: false, source_write: false },
    counts,
    results,
  };
  writeFileSync("all-model-proof.json", JSON.stringify(evidence, null, 2) + "\n");

  const lines = [
    "## All-model execution proof",
    "",
    "This is an execution measurement, not a judgment. No merge, no source write, no LIVE claim.",
    "",
    `Auto models attempted: **${results.length}**`,
    `SUCCEEDED: **${counts.SUCCEEDED || 0}** · SKIPPED: **${counts.SKIPPED || 0}** · ERROR: **${counts.ERROR || 0}** · EMPTY: **${counts.EMPTY || 0}**`,
    "",
  ];
  for (const r of results) {
    const marker = r.status === "SUCCEEDED" ? "🟢" : r.status === "SKIPPED" ? "🟡" : "🔴";
    lines.push(`- ${marker} **${r.id}** — ${r.status} — ${r.reason || r.via || "response"}`);
  }
  lines.push("", "`all-model-proof.json` is the machine-readable evidence. Configured ≠ attempted ≠ succeeded ≠ LIVE.");
  await github(`/repos/${owner}/${name}/issues/${pr}/comments`, {
    method: "POST",
    body: { body: lines.join("\n") },
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
