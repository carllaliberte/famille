#!/usr/bin/env node
/**
 * Decide whether the Codex worker may dispatch one bounded follow-up.
 * Reads worker evidence. Writes runtime-diagnosis.json and GITHUB_OUTPUT.
 * File/job success is not proof. Evidence status is.
 * Prior fluidity HOLD_HUMAN remains a pause until a human event.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { decideContinuation } from "./self-heal.mjs";
import { applyFluidityHint, measureFluidity } from "./cognitive-fluidity.mjs";

const evidencePath = process.env.CODEX_WORKER_EVIDENCE || "codex-worker-evidence.json";
const outPath = process.env.RUNTIME_DIAGNOSIS || "runtime-diagnosis.json";
const priorPath = process.env.FLUIDITY_PRIOR || "cognitive-fluidity-prior.json";
const evidence = existsSync(evidencePath) ? JSON.parse(readFileSync(evidencePath, "utf8")) : {};
const prior = existsSync(priorPath) ? JSON.parse(readFileSync(priorPath, "utf8")) : {};
const applied = applyFluidityHint(prior);
const continueRuntime = !["false", "0", "no"].includes(String(process.env.CONTINUE_RUNTIME ?? "true").toLowerCase());
let decision;
if (applied.hold) {
  decision = {
    v: "runtime-continue.v1",
    continue: false,
    next: "HOLD_HUMAN",
    reason: "PRIOR_FLUIDITY_HOLD_HUMAN",
    next_depth: Number(process.env.CONTINUATION_DEPTH || 0) + 1,
    live: false,
    auto_merge: false,
    authority: "carl",
    diagnosis_executed: true,
    fluidity_hint: applied,
  };
} else {
  decision = decideContinuation({
    evidence,
    env: process.env,
    eventName: process.env.EVENT_NAME || "schedule",
    depth: process.env.CONTINUATION_DEPTH || "0",
    continueRuntime,
    runId: process.env.GITHUB_RUN_ID || "",
  });
  decision.diagnosis_executed = true;
  decision.skipped_without_diagnosis = false;
  decision.fluidity_hint = applied;
}
const fluidity = measureFluidity({
  workerEvidence: evidence,
  continuation: decision,
  prior,
  applied,
});
decision.fluidity = { state: fluidity.state, property: fluidity.property, mode: fluidity.mode };
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
      `fluidity=${fluidity.state}`,
      "",
    ].join("\n"),
  );
}
console.log(JSON.stringify(decision, null, 2));
