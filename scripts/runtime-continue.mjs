#!/usr/bin/env node
/**
 * Decide whether the Codex worker may dispatch one bounded follow-up.
 * Reads worker evidence. Writes runtime-diagnosis.json and GITHUB_OUTPUT.
 * File/job success is not proof. Evidence status is.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { decideContinuation } from "./self-heal.mjs";

const evidencePath = process.env.CODEX_WORKER_EVIDENCE || "codex-worker-evidence.json";
const outPath = process.env.RUNTIME_DIAGNOSIS || "runtime-diagnosis.json";
const evidence = existsSync(evidencePath) ? JSON.parse(readFileSync(evidencePath, "utf8")) : {};
const continueRuntime = !["false", "0", "no"].includes(String(process.env.CONTINUE_RUNTIME ?? "true").toLowerCase());
const decision = decideContinuation({
  evidence,
  env: process.env,
  eventName: process.env.EVENT_NAME || "schedule",
  depth: process.env.CONTINUATION_DEPTH || "0",
  continueRuntime,
  runId: process.env.GITHUB_RUN_ID || "",
});
writeFileSync(outPath, `${JSON.stringify(decision, null, 2)}\n`);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `continue=${decision.continue ? "true" : "false"}`,
      `next=${decision.next}`,
      `next_depth=${decision.next_depth}`,
      `self_test=${decision.self_test ? "true" : "false"}`,
      `reason=${String(decision.reason || "").replace(/\n/g, " ").slice(0, 200)}`,
      "",
    ].join("\n"),
  );
}
console.log(JSON.stringify(decision, null, 2));
