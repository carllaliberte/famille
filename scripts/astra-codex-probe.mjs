#!/usr/bin/env node
/**
 * Measure Astra / Codex transport without conflating providers.
 * Never prints secret values. Does not change the Global Breaker.
 * auto_merge=false live=false.
 */
import { writeFileSync } from "node:fs";
import { MODELS } from "../.github/swarm/review.mjs";
import { controlState } from "../.github/swarm/system-breaker.mjs";

const ENDPOINTS = Object.freeze({
  openai: "https://api.openai.com/v1/chat/completions",
  openrouter: "https://openrouter.ai/api/v1/chat/completions",
});
const IDS = ["astra", "codex"];
const CODEX_FREE_FALLBACKS = Object.freeze(["openrouter/free"]);

function redact(text) {
  return String(text || "")
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]");
}

function classifyHttp(status, body) {
  if (status === 401 || status === 403) return "AUTH_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status === 404) return "MODEL_ERROR";
  if (status >= 500) return "API_ERROR";
  if (status >= 400) return "API_ERROR";
  if (body) return "SUCCEEDED";
  return "API_ERROR";
}

export function detectKey(env = process.env, secretName = "OPENAI_API_KEY") {
  const raw = String(env[secretName] || "");
  return raw.trim().length > 8;
}

export function prepareRequest(id, env = process.env, modelOverride = "") {
  const spec = MODELS[id];
  if (!spec) {
    return { ok: false, result: "CONFIGURATION_ERROR", reason: `missing MODELS.${id}` };
  }
  const endpoint = ENDPOINTS[spec.provider];
  if (!endpoint) {
    return { ok: false, result: "CONFIGURATION_ERROR", reason: `unsupported provider ${spec.provider}` };
  }
  return {
    ok: true,
    id,
    provider: spec.provider,
    model: modelOverride || spec.model,
    secret_name: spec.secret,
    endpoint,
    key_detected: detectKey(env, spec.secret),
    auto_merge: false,
    live: false,
  };
}

export async function probeOne(id, env = process.env, fetchFn = fetch, options = {}) {
  const state = controlState(env);
  const prepared = prepareRequest(id, env, options.modelOverride || "");
  const base = {
    id,
    generated_at: new Date().toISOString(),
    sha: env.GITHUB_SHA || "",
    breaker_mode: state.mode,
    breaker_closed: state.breaker_closed,
    key_detected: prepared.key_detected || false,
    model: prepared.model || null,
    provider: prepared.provider || null,
    endpoint: prepared.endpoint || null,
    secret_name: prepared.secret_name || null,
    api_call: "NOT_EXECUTED",
    latency_ms: null,
    http_status: null,
    text_present: false,
    auto_merge: false,
    live: false,
    authority: "carl",
  };
  if (!prepared.ok) return { ...base, result: prepared.result, reason: prepared.reason };
  if (state.mode === "OFF") {
    return { ...base, result: "BLOCKED_BY_BREAKER", reason: "GLOBAL_BREAKER_OFF" };
  }
  if (!base.key_detected) {
    return { ...base, result: "CONFIGURATION_ERROR", reason: `${prepared.secret_name} absent or too short` };
  }
  const key = String(env[prepared.secret_name]).trim();
  const t0 = Date.now();
  try {
    const headers = {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    };
    if (prepared.provider === "openrouter") {
      headers["HTTP-Referer"] = "https://github.com/carllaliberte/famille";
      headers["X-Title"] = "Acorn swarm";
    }
    const res = await fetchFn(prepared.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: prepared.model,
        max_tokens: 16,
        messages: [
          { role: "system", content: "Reply with the single word pong. No LIVE. No merge." },
          { role: "user", content: "ping" },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
    const json = await res.json().catch(() => ({}));
    const text = json?.choices?.[0]?.message?.content || "";
    const result = res.ok ? (text ? "SUCCEEDED" : "API_ERROR") : classifyHttp(res.status, text);
    return {
      ...base,
      api_call: "EXECUTED",
      latency_ms: Date.now() - t0,
      http_status: res.status,
      text_present: Boolean(text),
      result,
      reason: res.ok ? "" : redact(JSON.stringify(json).slice(0, 240)),
    };
  } catch (err) {
    const msg = redact(err instanceof Error ? err.message : String(err));
    const network = /timeout|network|fetch|ECONN|ENOTFOUND/i.test(msg);
    return {
      ...base,
      api_call: "EXECUTED",
      latency_ms: Date.now() - t0,
      result: network ? "NETWORK_ERROR" : "API_ERROR",
      reason: msg.slice(0, 240),
    };
  }
}

export async function probeAstraCodex({ env = process.env, fetchFn = fetch, outPath = "" } = {}) {
  const rows = [];
  rows.push(await probeOne("astra", env, fetchFn));

  const primary = await probeOne("codex", env, fetchFn);
  if (primary.result !== "MODEL_ERROR") {
    rows.push(primary);
  } else {
    const fallbackAttempts = [primary];
    let selected = primary;
    for (const model of CODEX_FREE_FALLBACKS) {
      const fallback = await probeOne("codex", env, fetchFn, { modelOverride: model });
      fallbackAttempts.push(fallback);
      if (fallback.result === "SUCCEEDED") {
        selected = {
          ...fallback,
          fallback_from: primary.model,
          fallback: true,
          attempts: fallbackAttempts.map((a) => ({ model: a.model, result: a.result, http_status: a.http_status })),
        };
        break;
      }
    }
    if (selected === primary) {
      selected = {
        ...primary,
        fallback_attempted: true,
        attempts: fallbackAttempts.map((a) => ({ model: a.model, result: a.result, http_status: a.http_status })),
      };
    }
    rows.push(selected);
  }

  const evidence = {
    v: "astra-codex-probe.v2",
    generated_at: new Date().toISOString(),
    sha: env.GITHUB_SHA || "",
    policy: { merge: false, live: false, breaker_write: false },
    rows,
    verified: rows.every((r) => r.result === "SUCCEEDED" && r.api_call === "EXECUTED"),
  };
  if (outPath) writeFileSync(outPath, `${JSON.stringify(evidence, null, 2)}\n`);
  return evidence;
}

const isMain = Boolean(process.argv[1]) && process.argv[1].endsWith("astra-codex-probe.mjs");
if (isMain) {
  probeAstraCodex({ outPath: process.env.ASTRA_CODEX_EVIDENCE || "astra-codex-evidence.json" }).then((ev) => {
    console.log(JSON.stringify(ev, null, 2));
  });
}
