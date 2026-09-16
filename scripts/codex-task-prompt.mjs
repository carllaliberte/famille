/** Compact Codex task prompt. Read docs in-repo; do not paste them. */
export const PROMPT_TOKEN_MARGIN_LIMIT = 7000;
export const TASK_BODY_CHAR_LIMIT = 1600;

export function estimateTokens(text) {
  return Math.ceil(String(text || "").length / 4);
}

export function excerptTaskBody(body, url = "") {
  const raw = String(body || "").trim() || "(no body)";
  if (raw.length <= TASK_BODY_CHAR_LIMIT) return raw;
  const cut = raw.slice(0, TASK_BODY_CHAR_LIMIT);
  const at = url ? ` Full text: ${url}` : " Full text is the GitHub issue; read it in the repository context.";
  return `${cut}\n…[truncated; do not guess the rest.]${at}`;
}

export function continuityBrief(memory = {}) {
  const measurements = (memory.measurements || []).slice(-3);
  const errors = (memory.error_signatures || []).slice(-3);
  const failed = (memory.failed || memory.failed_tasks || []).slice(-3);
  const completed = (memory.completed || memory.completed_tasks || []).slice(-3);
  const human = (memory.human_required || memory.human_actions_required || []).slice(-2);
  const last = measurements[measurements.length - 1] || {};
  const lines = [
    "ACORN CONTINUITY (measured; do not repeat completed or known-failed work):",
    `last_status: ${last.status || memory.state || "IDLE"}`,
    `last_sha: ${memory.last_main_sha || last.sha || "unknown"}`,
    `last_patch_source: ${last.patch_source || "none"}`,
    `last_model: ${memory.last_model || "unknown"}`,
  ];
  if (memory.carl_request) lines.push(`carl_request: ${String(memory.carl_request).slice(0, 200)}`);
  if (completed.length) {
    lines.push(`completed: ${completed.map((t) => `#${t.number || t.id || "?"}`).join(" ")}`);
  }
  if (failed.length) {
    lines.push(`failed: ${failed.map((t) => `#${t.number || t.id || "?"} ${t.reason || t.status || ""}`.trim()).join("; ")}`);
  }
  if (errors.length) {
    lines.push(`error_signatures: ${errors.map((e) => `${e.category || "CODEX"}:${String(e.message || e.signature || "").replace(/\s+/g, " ").slice(0, 48)} x${e.count || 1}`).join("; ")}`);
  }
  if (human.length) {
    lines.push(`human_required: ${human.map((h) => String(h.exact_human_action || h.action || h.reason || "").slice(0, 120)).join("; ")}`);
  }
  if (memory.next_candidate?.title) lines.push(`next_candidate: ${memory.next_candidate.title}`);
  return lines.join("\n");
}

export function memoryHasContinuity(memory) {
  if (!memory || typeof memory !== "object") return false;
  return Boolean(
    (memory.measurements || []).length
    || (memory.error_signatures || []).length
    || (memory.completed || memory.completed_tasks || []).length
    || (memory.failed || memory.failed_tasks || []).length
    || memory.last_main_sha
    || memory.carl_request
  );
}

export function taskPrompt(task, correction = "", memory = null) {
  const brief = memory && memoryHasContinuity(memory) ? continuityBrief(memory) : "";
  const body = excerptTaskBody(task.body, task.url);
  return `You are Astra Codex, operating through Acorn. Repository is in scope.\nRead in-repo (do not expect them pasted here): docs/ASTRA-CODEX.md, docs/WORK-RECORD.md, docs/live.md.\nCODE ≠ TESTED ≠ EXECUTED ≠ MEASURED ≠ VERIFIED ≠ LIVE.\nMissing tool → BUILD_TOOL then test. Human secret → HOLD_HUMAN.\nNever merge. Never auto_merge. Never claim LIVE without LIVE_VERIFIED.\nNever apply Grok Build App Builder product contracts (8080, startup.sh, TanStack) inside famille.\nAuthority is Carl.\n\nTask #${task.number}: ${task.title}\nURL: ${task.url || ""}\n\nTASK BODY:\n${body}\n${brief ? `\n${brief}\n` : ""}\nAct: smallest evidence-justified change; focused tests; one PR for Carl. No secrets, no LIVE, no extra architecture.\nIf unsafe or a human secret is required, stop without source changes.\n${correction ? `\nIMMEDIATE DEBUG/REPAIR:\n${String(correction).slice(0, 800)}\n` : ""}`;
}
