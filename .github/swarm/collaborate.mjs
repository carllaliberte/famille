#!/usr/bin/env node
/**
 * Turns independent swarm findings into a measured second-pass collaboration.
 * It reads the already-posted Swarm review; it does not re-run providers.
 * No vote, no merge, no LIVE claim. Carl remains the human decision node.
 */
import { reviewOne, idsForDispatch, keyedModels, loadPrompt } from "./review.mjs";
import { synthesisPrompt, collaborationState } from "./collaboration-engine.mjs";

async function gh(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": "2022-11-28",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`github ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

export function parseSwarmComment(body = "") {
  const lines = String(body || "").split(/\r?\n/);
  if (!lines.some((line) => /^## Swarm review\b/.test(line))) return [];
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const heading = lines[i].match(/^### (.+?) \(`([^`]+)`\)$/);
    if (!heading) continue;
    const content = [];
    for (let j = i + 1; j < lines.length; j += 1) {
      if (/^### /.test(lines[j]) || /^_Prompt:/.test(lines[j])) break;
      content.push(lines[j]);
    }
    const text = content.join("\n").trim();
    if (text && !/^Skipped —/i.test(text) && !/^Provider error —/i.test(text)) {
      out.push({ label: heading[1].trim(), model: heading[2].trim(), text });
    }
  }
  return out;
}

export function chooseCoordinator(results, specs) {
  const ids = new Set(results.map((r) => r.id));
  return (specs || []).find((s) => ids.has(s.id)) || null;
}

async function main(env = process.env) {
  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPOSITORY;
  const pr = String(env.PR_NUMBER || "");
  if (!token || !repo || !pr) return 0;

  const [owner, name] = repo.split("/");
  const comments = await gh(`/repos/${owner}/${name}/issues/${pr}/comments?per_page=100`, { token });
  const swarm = [...(comments || [])].reverse().find((c) => /^## Swarm review\b/m.test(c.body || ""));
  if (!swarm) {
    console.log("collaboration skip (no swarm review)");
    return 0;
  }

  const parsed = parseSwarmComment(swarm.body);
  const state = collaborationState(parsed);
  console.log(`collaboration attempted=${state.attempted} successful=${state.successful}`);
  if (!state.collective) {
    console.log("collaboration skip (fewer than two independent findings)");
    return 0;
  }

  const ids = idsForDispatch(env);
  const { run } = keyedModels(ids, env);
  const byModel = new Map(run.map((s) => [s.model, s]));
  const results = parsed.map((r, i) => ({
    ...r,
    id: [...byModel.entries()].find(([, s]) => s.model === r.model)?.[0] || r.model || `source-${i + 1}`,
  }));
  const coordinator = chooseCoordinator(results, run);
  if (!coordinator) {
    console.log("collaboration skip (no keyed coordinator available)");
    return 0;
  }

  const one = await reviewOne(coordinator, loadPrompt(), synthesisPrompt(results), env);
  if (one.skipped || one.error || !one.text) {
    console.log(`collaboration skip (${one.reason || one.error || "empty"})`);
    return 0;
  }

  const sources = state.independent.join(", ");
  const body = [
    "## Swarm collaboration — second pass",
    "",
    "Independent findings were produced first. This pass compares them without voting and preserves disagreement.",
    `Sources: ${sources}`,
    `Coordinator: ${coordinator.id} (${coordinator.model})`,
    "CODE VERIFIED ≠ TEST VERIFIED ≠ LIVE VERIFIED.",
    "",
    one.text,
    "",
    "_Human decision remains Carl. No merge. No LIVE claim._",
  ].join("\n");

  await gh(`/repos/${owner}/${name}/issues/${pr}/comments`, {
    method: "POST",
    token,
    body: { body },
  });
  console.log(`collaboration posted sources=${sources}`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((code) => process.exit(code), (err) => {
    console.error(err);
    process.exit(0);
  });
}
