#!/usr/bin/env node
/**
 * Swarm review for famille. Complementary, not a judge.
 * Reviews FILE.md + schema + docs. Fail-closed: missing keys skip.
 * Never merge. Never wrangler. Fable 5 is on-demand (cost).
 * Roster (schema/agents.json) is the join. Canal is optional HTTP.
 * auto = roster status. Future AI: one agents.json row. No mesh.v0 fork.
 */
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  accept as acceptFlux,
  formatEnvelope,
  isMeshEnvelope,
  modelsForDestination,
  parseFlux,
  ROSTER_DOC,
} from "./flux.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");
const PROMPT_PATH = join(HERE, "prompt.md");

export const CANON_PATHS = Object.freeze([
  "FILE.md",
  "AUTOMATION.md",
  "INTEROP-IA.md",
  "schema/juge.v0.json",
  "schema/flux.v0.json",
  "schema/mesh.v0.json",
  "schema/agents.v0.json",
  "schema/agents.json",
  "schema/README.md",
]);

export const OPENROUTER_ROUTES = Object.freeze({
  gemini: "google/gemini-2.5-flash",
});

/** HTTP transport only. Not the join. Join = schema/agents.json. */
export const CANALS = Object.freeze({
  sonnet: {
    provider: "anthropic",
    secret: "ANTHROPIC_API_KEY",
    model: "claude-sonnet-5",
    maxTokens: 2048,
  },
  fable: {
    provider: "anthropic",
    secret: "ANTHROPIC_API_KEY",
    model: "claude-fable-5",
    maxTokens: 8192,
  },
  chatgpt: {
    provider: "openai",
    secret: "OPENAI_API_KEY",
    model: "gpt-5.6-terra",
  },
  deepseek: {
    provider: "deepseek",
    secret: "DEEPSEEK_API_KEY",
    model: "deepseek-v4-flash",
  },
  gemini: {
    provider: "gemini",
    secret: "GEMINI_API_KEY",
    model: "gemini-3.8-flash",
  },
  haiku: {
    provider: "openrouter",
    secret: "HAIKU_API_KEY",
    model: "claude-3-haiku",
    maxTokens: 2048,
  },
  llama: {
    provider: "openrouter",
    secret: "LLAMA_API_KEY",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    maxTokens: 2048,
  },
  qwen: {
    provider: "openrouter",
    secret: "QWEN_API_KEY",
    model: "qwen-2.5-72b-instruct",
    maxTokens: 2048,
  },
  xai: {
    provider: "xai",
    secret: "XAI_API_KEY",
    model: "grok-2",
    maxTokens: 2048,
  },
});

function rosterRow(id) {
  return (ROSTER_DOC.agents || []).find((a) => a.id === id) || null;
}

function specFor(id, canal) {
  const row = rosterRow(id);
  const spec = {
    id,
    label: row?.name || id,
    model: canal.model,
    provider: canal.provider,
    secret: canal.secret,
    auto: row?.status === "auto",
  };
  if (canal.maxTokens) spec.maxTokens = canal.maxTokens;
  return Object.freeze(spec);
}

export const MODELS = Object.freeze(
  Object.fromEntries(
    Object.entries(CANALS).map(([id, canal]) => [id, specFor(id, canal)]),
  ),
);

/** Native xAI cascade. 400/403 on one slug tries the next. */
export const XAI_FALLBACK = Object.freeze(["grok-2", "grok-2-mini"]);

function autoIds() {
  return Object.values(MODELS)
    .filter((m) => m.auto)
    .map((m) => m.id);
}

function buildTriggers() {
  const t = {
    "/swarm": autoIds(),
    "/fabre": ["fable"],
  };
  for (const id of Object.keys(CANALS)) t["/" + id] = [id];
  for (const row of ROSTER_DOC.agents || []) {
    if (row.kind === "model" || row.kind === "guest") {
      t["/" + row.id] = [row.id];
    }
  }
  return Object.freeze(t);
}

const TRIGGERS = buildTriggers();

/** Slash commands as tokens, not path fragments (`.github/swarm/...` is not `/swarm`). */
export function commandsIn(text = "") {
  const wanted = [];
  const seen = new Set();
  const src = String(text || "");
  for (const [cmd, ids] of Object.entries(TRIGGERS)) {
    const escaped = cmd.replace("/", "\\/");
    const re = new RegExp(`(?:^|\\s)${escaped}(?=[\\s,;:!?.)]|$)`, "i");
    if (re.test(src)) {
      for (const id of ids) {
        if (!seen.has(id)) {
          seen.add(id);
          wanted.push(id);
        }
      }
    }
  }
  return wanted;
}

export function parseTrigger(
  commentBody = "",
  labels = [],
  event = "pull_request",
  action = "",
  addedLabel = "",
) {
  const wanted = new Set(commandsIn(commentBody));
  const labelNames = (labels || []).map((l) =>
    String(typeof l === "string" ? l : l.name || "").toLowerCase(),
  );
  const extra = String(addedLabel || "").toLowerCase();
  if (
    labelNames.includes("fable") ||
    labelNames.includes("fabre") ||
    extra === "fable" ||
    extra === "fabre"
  ) {
    wanted.add("fable");
  }
  if (wanted.size > 0) return [...wanted];
  if (action === "labeled") return [];
  if (event === "issue_comment") return [];
  return autoIds();
}


/** Skip swarm's own posts — otherwise FLUX echo loops. Other bots (Copilot, Cursor) may address the mesh. */
export function shouldSkipComment({ actor = "", body = "", comment = "" } = {}) {
  const who = String(actor || "").toLowerCase();
  if (who === "github-actions[bot]") return true;
  const src = String(body || comment || "");
  if (/^## Swarm review\b/m.test(src)) return true;
  return false;
}

export function envelopeAnchor(env = process.env) {
  const sha = String(env.GITHUB_SHA || env.PR_SHA || "").toLowerCase();
  const n = Number(env.PR_NUMBER || "");
  const out = {};
  if (/^[0-9a-f]{40}$/.test(sha)) out.sha = sha;
  if (Number.isInteger(n) && n > 0) out.pr = n;
  return out;
}

/** Flux addressing takes precedence. /flux to:chatgpt runs ChatGPT only. */
export function idsForComment(
  commentBody = "",
  labels = [],
  event = "pull_request",
  action = "",
  addedLabel = "",
) {
  const flux = parseFlux(commentBody);
  if (flux) return { flux, ids: modelsForDestination(flux.to) };
  return {
    flux: null,
    ids: parseTrigger(commentBody, labels, event, action, addedLabel),
  };
}

export function addressResult(result, to = "github", anchor = {}) {
  if (!result || result.skipped || result.error || !result.text) return result;
  const from = result.id;
  const mode = from === "grok" || to === "grok" ? "CHALLENGE" : "ECHANGE";
  const r = acceptFlux({
    from,
    to,
    act: "FINDING",
    mode,
    grade: "PROPOSED",
    body: result.text,
    ...envelopeAnchor(anchor),
  });
  if (!r.ok) return { ...result, text: sanitizeReview(result.text) };
  return { ...result, text: formatEnvelope(r.packet) };
}

/** Peer handoff from a model's raw text. Fable stays on-demand. One extra hop max at the caller. */
export function handoffIds(text = "", selfId = "") {
  const flux = parseFlux(text);
  if (!flux) return [];
  const self = String(selfId || "").toLowerCase();
  return modelsForDestination(flux.to).filter(
    (id) => id && id !== self && id !== "fable",
  );
}

export function meshUser(baseUser, flux) {
  if (!flux) return baseUser;
  const to = flux.to || "github";
  const from = flux.from || "github";
  return (
    `You are addressed on the flux mesh as ${to} by ${from} (${flux.act || "HANDOFF"}, ${flux.grade || "PROPOSED"}). ` +
    `Reply in FINDING / EVIDENCE / RISK / ACTION / TEST / RESULT / HANDOFF. ` +
    `To hand off to one peer, end with \`/flux to:<id> from:${to}\`. One hop. ` +
    `Do not declare LIVE. Do not say QUANTUM. Do not say PRÉSENT. Do not wrangler deploy. ` +
    `Wire is acorn.v0 (schema/mesh.v0.json), not schema/flux.v0.json. Flux is not a Worker canal.\n\n` +
    String(baseUser || "")
  );
}

export function keyedModels(ids, env = process.env) {
  const run = [];
  const skip = [];
  const orKey = String(env.OPENROUTER_API_KEY || "").trim();
  for (const id of ids) {
    const spec = MODELS[id];
    if (!spec) continue;
    const native = String(env[spec.secret] || "").trim();
    if (native) {
      run.push(spec);
      continue;
    }
    if (orKey && OPENROUTER_ROUTES[id]) {
      run.push({
        ...spec,
        via: "openrouter",
        model: OPENROUTER_ROUTES[id],
      });
      continue;
    }
    skip.push({ id, reason: `missing ${spec.secret}` });
  }
  return { run, skip };
}

export function loadPrompt() {
  return readFileSync(PROMPT_PATH, "utf8");
}

export function loadCanon(root = ROOT) {
  return CANON_PATHS.map((path) => {
    try {
      return {
        path,
        text: readFileSync(join(root, path), "utf8").slice(0, 16_000),
      };
    } catch {
      return { path, text: "(missing)" };
    }
  });
}

export function buildUserMessage({ title, body, diff, files, canon }) {
  const fileList = (files || []).map((f) => `- ${f}`).join("\n") || "(none)";
  const clipped = String(diff || "").slice(0, 80_000);
  const parts = [
    `PR title: ${title || "(untitled)"}`,
    "",
    "PR body:",
    body || "(empty)",
    "",
    "Changed files:",
    fileList,
    "",
    "Diff:",
    "```",
    clipped || "(empty diff)",
    "```",
  ];
  if (canon && canon.length) {
    parts.push(
      "",
      "Canon — FILE.md + schema + docs. Review these. Do not wrangler. Do not merge.",
    );
    for (const c of canon) {
      parts.push("", `### ${c.path}`, "```", c.text || "(empty)", "```");
    }
  }
  return parts.join("\n");
}

const FORBIDDEN =
  /\bQUANTUM\b|\bLIVE VERIFIED\b|\bPRÉSENT\b|wrangler deploy|second \*\.grok\.me/i;

export function sanitizeReview(text) {
  const raw = String(text || "").trim() || "(empty review)";
  if (!FORBIDDEN.test(raw)) return raw;
  return (
    raw +
    "\n\n_Swarm note: this canal forbids QUANTUM, LIVE VERIFIED, PRÉSENT, wrangler deploy, and a second grok.me. Carl judges._"
  );
}

/** 400 / 402 / 403 / 404 / 429 / 503: skip silently. Do not dump provider bodies on the PR. */
export function isQuotaOrMissing(err) {
  const m = String(err && err.message ? err.message : err || "");
  return /\b(404|402|429|400|403|503)\b/.test(m);
}

function skipFault(spec, err, via) {
  const reason = isQuotaOrMissing(err)
    ? `skip ${String(err && err.message ? err.message : err).slice(0, 80)}`
    : null;
  if (reason) {
    console.log(`[${spec.id}] ${reason}`);
    return {
      id: spec.id,
      skipped: true,
      reason,
      via,
    };
  }
  return {
    id: spec.id,
    label: spec.label,
    model: spec.model,
    via,
    error: err instanceof Error ? err.message : String(err),
  };
}

async function postJson(url, { headers, body, id }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (id) console.log(`[${id}] HTTP ${res.status}`);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json, text };
}

async function callAnthropic(spec, system, user, key) {
  const { ok, status, json } = await postJson(
    "https://api.anthropic.com/v1/messages",
    {
      id: spec.id,
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: {
        model: spec.model,
        max_tokens: spec.maxTokens || 2048,
        system,
        messages: [{ role: "user", content: user }],
      },
    },
  );
  if (!ok) throw new Error(`anthropic ${status}: ${JSON.stringify(json).slice(0, 400)}`);
  const block = (json.content || []).find((c) => c.type === "text");
  return block?.text || "";
}

async function callOpenAI(spec, system, user, key) {
  const { ok, status, json } = await postJson(
    "https://api.openai.com/v1/chat/completions",
    {
      id: spec.id,
      headers: { authorization: `Bearer ${key}` },
      body: {
        model: spec.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
    },
  );
  if (!ok) throw new Error(`openai ${status}: ${JSON.stringify(json).slice(0, 400)}`);
  return json.choices?.[0]?.message?.content || "";
}

async function callDeepSeek(spec, system, user, key) {
  const { ok, status, json } = await postJson(
    "https://api.deepseek.com/chat/completions",
    {
      id: spec.id,
      headers: { authorization: `Bearer ${key}` },
      body: {
        model: spec.model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
    },
  );
  if (!ok) throw new Error(`deepseek ${status}: ${JSON.stringify(json).slice(0, 400)}`);
  return json.choices?.[0]?.message?.content || "";
}

async function callGemini(spec, system, user, key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${spec.model}:generateContent?key=${encodeURIComponent(key)}`;
  const { ok, status, json } = await postJson(url, {
    id: spec.id,
    body: {
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
    },
  });
  if (!ok) throw new Error(`gemini ${status}: ${JSON.stringify(json).slice(0, 400)}`);
  const parts = json.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || "").join("\n");
}

async function callOpenRouter(spec, system, user, key) {
  const model = OPENROUTER_ROUTES[spec.id] || spec.model;
  const { ok, status, json } = await postJson(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      id: spec.id,
      headers: {
        authorization: `Bearer ${key}`,
        "http-referer": "https://github.com/carllaliberte/famille",
        "x-title": "famille-swarm",
      },
      body: {
        model,
        max_tokens: spec.maxTokens || 2048,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
    },
  );
  if (!ok) {
    const msg = json?.error?.message || JSON.stringify(json).slice(0, 200);
    throw new Error(`openrouter ${spec.id} ${status}: ${msg}`);
  }
  return json.choices?.[0]?.message?.content || "";
}

async function callXai(spec, system, user, key) {
  const chain = [];
  const seen = new Set();
  for (const m of [spec.model, ...XAI_FALLBACK]) {
    if (!m || seen.has(m)) continue;
    seen.add(m);
    chain.push(m);
  }
  let last = new Error("xai: no model tried");
  for (const model of chain) {
    const { ok, status, json } = await postJson(
      "https://api.x.ai/v1/chat/completions",
      {
        id: spec.id,
        headers: { authorization: `Bearer ${key}` },
        body: {
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        },
      },
    );
    if (ok) return json.choices?.[0]?.message?.content || "";
    last = new Error(`xai ${status}: ${JSON.stringify(json).slice(0, 400)}`);
    if (status === 400 || status === 403) {
      console.log(`[${spec.id}] skip ${model} ${status}, next`);
      continue;
    }
    throw last;
  }
  throw last;
}

const CALLERS = {
  anthropic: callAnthropic,
  openai: callOpenAI,
  deepseek: callDeepSeek,
  gemini: callGemini,
  xai: callXai,
};

export async function reviewOne(spec, system, user, env = process.env) {
  const native = String(env[spec.secret] || "").trim();
  const orKey = String(env.OPENROUTER_API_KEY || "").trim();
  const viaOpenRouter = spec.via === "openrouter";
  if (viaOpenRouter && !orKey) {
    return { id: spec.id, skipped: true, reason: "missing OPENROUTER_API_KEY" };
  }
  if (!native && !viaOpenRouter) {
    return { id: spec.id, skipped: true, reason: `missing ${spec.secret}` };
  }
  if (!viaOpenRouter && native) {
    try {
      const text = sanitizeReview(
        await CALLERS[spec.provider](spec, system, user, native),
      );
      return {
        id: spec.id,
        label: spec.label,
        model: spec.model,
        via: spec.provider,
        text,
      };
    } catch (err) {
      // $0 cadence: do not wait on OpenRouter after native 402/403/404/429/503.
      if (orKey && OPENROUTER_ROUTES[spec.id] && !isQuotaOrMissing(err)) {
        try {
          const text = sanitizeReview(
            await callOpenRouter(
              { ...spec, model: OPENROUTER_ROUTES[spec.id] },
              system,
              user,
              orKey,
            ),
          );
          return {
            id: spec.id,
            label: spec.label,
            model: OPENROUTER_ROUTES[spec.id],
            via: "openrouter",
            text,
          };
        } catch (err2) {
          return skipFault(spec, err2, "openrouter");
        }
      }
      return skipFault(spec, err, spec.provider);
    }
  }
  try {
    const text = sanitizeReview(await callOpenRouter(spec, system, user, orKey));
    return {
      id: spec.id,
      label: spec.label,
      model: spec.model,
      via: "openrouter",
      text,
    };
  } catch (err) {
    return skipFault(spec, err, "openrouter");
  }
}

/** Mesh replies are bare acorn.v0 envelopes so guests can LU them. Auto PR review stays wrapped. */
export function commentBodies(kind, payload) {
  if (kind === "mesh") {
    return (payload.results || [])
      .filter((r) => r && r.text && !r.skipped && !r.error)
      .map((r) => r.text);
  }
  return [formatComment(payload)];
}

export function formatComment({ run, skip, results }) {
  const lines = [
    "## Swarm review — complementary, not a judgment",
    "",
    "Carl judges. FILE.md + schema + docs. These models do not merge or wrangler.",
    "CODE VERIFIED ≠ TEST VERIFIED ≠ LIVE VERIFIED.",
    "",
  ];
  for (const r of results) {
    lines.push(`### ${r.label || r.id} (\`${r.model || r.id}\`)`);
    if (r.skipped) lines.push(`Skipped — ${r.reason}`);
    else if (r.error) lines.push(`Provider error — \`${r.error.slice(0, 300)}\``);
    else lines.push(r.text);
    lines.push("");
  }
  if (skip.length) {
    lines.push("### Skipped (fail-closed)");
    for (const s of skip) lines.push(`- \`${s.id}\`: ${s.reason}`);
    lines.push("");
  }
  if (!run.length && skip.length) {
    lines.push(
      "No provider keys in Actions secrets. Swarm stays silent until they exist. Not in git.",
    );
  }
  lines.push(
    "_Prompt: `.github/swarm/prompt.md`. Canal = commentaires PR + FILE.md. Never merge._",
  );
  return lines.join("\n");
}

async function gh(path, { method = "GET", token, body } = {}) {
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
  if (!res.ok) throw new Error(`github ${res.status} ${path}: ${JSON.stringify(json).slice(0, 400)}`);
  return json;
}

async function postComment(body, { token, repo, pr }) {
  if (token && repo && pr) {
    const [owner, name] = repo.split("/");
    await gh(`/repos/${owner}/${name}/issues/${pr}/comments`, {
      method: "POST",
      token,
      body: { body },
    });
  } else {
    console.log(body);
  }
}

function prNumberFromEvent(env = process.env) {
  if (env.PR_NUMBER) return String(env.PR_NUMBER);
  try {
    const ev = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8"));
    return String(
      ev.pull_request?.number ||
        (ev.issue?.pull_request ? ev.issue.number : "") ||
        "",
    );
  } catch {
    return "";
  }
}

export function eventMeta(env = process.env) {
  const fallback = {
    event: env.GITHUB_EVENT_NAME || "pull_request",
    action: "",
    comment: env.SWARM_COMMENT || "",
    actor: env.SWARM_ACTOR || "",
    labels: [],
    label: "",
  };
  try {
    const ev = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8"));
    return {
      event: env.GITHUB_EVENT_NAME || fallback.event,
      action: String(ev.action || ""),
      comment: ev.comment?.body || fallback.comment,
      actor: ev.comment?.user?.login || ev.sender?.login || fallback.actor,
      labels: ev.pull_request?.labels || ev.issue?.labels || [],
      label: ev.label?.name || "",
    };
  } catch {
    return fallback;
  }
}

export async function main(env = process.env) {
  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPOSITORY; // owner/name
  const pr = prNumberFromEvent(env);
  const meta = eventMeta(env);
  const anchor = envelopeAnchor({ ...env, PR_NUMBER: env.PR_NUMBER || pr });
  if (meta.event === "issue_comment" && shouldSkipComment(meta)) {
    console.log("swarm skip (own comment)");
    return 0;
  }
  const routed = idsForComment(
    meta.comment,
    meta.labels,
    meta.event,
    meta.action,
    meta.label,
  );
  const ids = routed.ids;
  if (!ids.length) {
    if (routed.flux) {
      if (isMeshEnvelope(meta.comment)) {
        console.log("flux already stored");
        return 0;
      }
      const accepted = acceptFlux({ ...routed.flux, ...anchor, actor: meta.actor });
      const body = accepted.ok
        ? formatEnvelope(accepted.packet)
        : `FLUX refused: ${accepted.code} — ${accepted.error}`;
      if (token && repo && pr) {
        const [owner, name] = repo.split("/");
        await gh(`/repos/${owner}/${name}/issues/${pr}/comments`, {
          method: "POST",
          token,
          body: { body },
        });
      } else {
        console.log(body);
      }
      console.log("flux stored (no model destination)");
      return 0;
    }
    console.log("swarm skip (no trigger)");
    return 0;
  }
  const { run, skip } = keyedModels(ids, env);

  if (!run.length) {
    // Secrets missing: stay silent. Carl is not the messenger; no collage.
    console.log("swarm skip (no keys)");
    return 0;
  }

  let title = env.PR_TITLE || "";
  let body = env.PR_BODY || "";
  let files = [];
  let diff = env.PR_DIFF || "";

  if (token && repo && pr) {
    const [owner, name] = repo.split("/");
    const pull = await gh(`/repos/${owner}/${name}/pulls/${pr}`, { token });
    title = pull.title || title;
    body = pull.body || body;
    const fileRows = await gh(`/repos/${owner}/${name}/pulls/${pr}/files?per_page=100`, {
      token,
    });
    files = (fileRows || []).map((f) => f.filename);
    diff = (fileRows || [])
      .map((f) => `--- ${f.filename}\n${f.patch || ""}`)
      .join("\n\n");
  }

  const system = loadPrompt();
  const canon = loadCanon();
  const user = buildUserMessage({ title, body, diff, files, canon });
  const dest = routed.flux?.from || "github";
  const results = [];
  const skipAll = [...skip];
  const seen = new Set();

  if (routed.flux) {
    const queue = ids.map((id) => ({ id, replyTo: dest }));
    let extra = 0;
    while (queue.length) {
      const job = queue.shift();
      if (!job?.id || seen.has(job.id)) continue;
      seen.add(job.id);
      const keyed = keyedModels([job.id], env);
      skipAll.push(...keyed.skip);
      for (const spec of keyed.run) {
        const one = await reviewOne(
          spec,
          system,
          meshUser(user, {
            from: job.replyTo,
            to: spec.id,
            act: routed.flux.act,
            grade: routed.flux.grade,
          }),
          env,
        );
        const raw = one.text || "";
        results.push(addressResult(one, job.replyTo, anchor));
        if (extra < 1 && !one.skipped && !one.error) {
          const nid = handoffIds(raw, spec.id).find((id) => !seen.has(id));
          if (nid) {
            extra += 1;
            queue.push({ id: nid, replyTo: spec.id });
          }
        }
      }
    }
  } else {
    const batch = await Promise.all(
      run.map((spec) => reviewOne(spec, system, user, env)),
    );
    results.push(...batch);
  }

  const kind = routed.flux ? "mesh" : "review";
  const bodies = commentBodies(kind, { run, skip: skipAll, results });
  if (!bodies.length) {
    console.log("swarm skip (no bodies)");
    return 0;
  }
  for (const posted of bodies) {
    await postComment(posted, { token, repo, pr });
  }
  return 0;
}

const isMain =
  Boolean(process.argv[1]) &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().then(
    (code) => process.exit(code),
    (err) => {
      console.error(err);
      process.exit(0);
    },
  );
}
