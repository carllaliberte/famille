#!/usr/bin/env node
/**
 * Un modèle à la fois. Séquentiel A puis B puis C.
 * TRANSFER = le texte de i est dans le prompt de i+1.
 * Daemon DOWN → skip (exit 0 en --ci). Jamais 3 POST simultanés.
 */
import { ifDaemonDown, siege } from "./siege.mjs";

export const RECIPE = Object.freeze(["gemma2:2b", "qwen2.5:1.5b", "llama3.2"]);
export const DEFAULT_HOST = "http://127.0.0.1:11434";

export function presentOf(wanted, have) {
  const names = (have || []).map((n) => String(n).replace(/:latest$/, ""));
  return (wanted || []).filter((w) =>
    names.some((h) => h === w || h.startsWith(`${w}:`)),
  );
}

export function transferPrompt(prevText, user = "présent") {
  const prev = String(prevText || "").trim();
  const ask = String(user || "présent");
  if (!prev) return ask;
  return `Précédent:\n${prev}\n\n${ask}`;
}

export async function listTags(host = DEFAULT_HOST, fetchFn = fetch) {
  try {
    const res = await fetchFn(new URL("/api/tags", host).href, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return { up: false, models: [] };
    const json = await res.json();
    return {
      up: true,
      models: (json.models || []).map((m) => m.name || m.model).filter(Boolean),
    };
  } catch {
    return { up: false, models: [] };
  }
}

export async function chatOne(host, model, prompt, fetchFn = fetch) {
  const t0 = Date.now();
  try {
    const res = await fetchFn(new URL("/api/chat", host).href, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [{ role: "user", content: prompt }],
        options: { num_predict: 32 },
      }),
      signal: AbortSignal.timeout(180000),
    });
    const json = await res.json().catch(() => ({}));
    const text = json?.message?.content || "";
    const loadMs = (json.load_duration || 0) / 1e6;
    return siege({
      nom: model,
      present: true,
      chaud: loadMs > 0 && loadMs < 100,
      http: res.status,
      text,
      ms: Date.now() - t0,
    });
  } catch (err) {
    return siege({
      nom: model,
      present: true,
      http: 0,
      skipped: true,
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - t0,
    });
  }
}

export async function recette({
  host = DEFAULT_HOST,
  wanted = RECIPE,
  fetchFn = fetch,
  tagsFn,
  chatFn,
} = {}) {
  const listed = tagsFn
    ? await tagsFn(host)
    : await listTags(host, fetchFn);
  const down = ifDaemonDown(Boolean(listed.up));
  if (down.skipped) {
    return { skipped: true, reason: down.reason, seats: [], transfer: false };
  }
  const models = presentOf(wanted, listed.models);
  if (!models.length) {
    return {
      skipped: true,
      reason: "aucun modèle visé présent",
      seats: [],
      transfer: false,
    };
  }
  const seats = [];
  let prev = "";
  let transfer = false;
  for (const model of models) {
    const prompt = transferPrompt(prev);
    if (prev && prompt.includes(prev)) transfer = true;
    const seat = chatFn
      ? await chatFn(host, model, prompt)
      : await chatOne(host, model, prompt, fetchFn);
    seats.push(seat);
    if (seat.real === 1) prev = seat.text;
  }
  return { skipped: false, reason: "", seats, transfer };
}

const isMain =
  Boolean(process.argv[1]) &&
  process.argv[1].endsWith("warm-one.mjs");
if (isMain) {
  const ci = process.argv.includes("--ci");
  recette().then((out) => {
    console.log(JSON.stringify(out, null, 2));
    if (out.skipped && ci) process.exit(0);
    if (out.skipped) process.exit(1);
    process.exit(0);
  });
}
