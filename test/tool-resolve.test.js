import test from "node:test";
import assert from "node:assert/strict";
import { catalogTools, resolveTool } from "../scripts/tool-resolve.mjs";
import { measureBuildPresence, CONTINUES_WITHOUT_BUILD } from "../scripts/build-presence.mjs";
import { serveClientProblem, resetCognition } from "../.github/swarm/cognition.mjs";
import { resetGuests } from "../.github/swarm/flux.mjs";
import { classifyFailure, selfHealDecision } from "../scripts/self-heal.mjs";
import { runAutonomousRuntime } from "../scripts/autonomous-runtime.mjs";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("catalog lists declared modules without promoting them to LIVE", () => {
  const tools = catalogTools();
  assert.ok(tools.some((row) => row.id === "evidence-seal"));
  assert.ok(tools.some((row) => row.id === "self-heal"));
  assert.ok(tools.every((row) => row.declared === true && row.live === false && row.executed === false));
});

test("existing module is reused; unknown module is BUILD_TOOL", () => {
  assert.equal(resolveTool({ name: "evidence-seal" }).decision, "REUSE");
  const missing = resolveTool({ name: "missing-external-probe", why: "capability unmeasured" });
  assert.equal(missing.decision, "BUILD_TOOL");
  assert.match(missing.then, /reuse/);
  assert.equal(missing.live, false);
  assert.equal(missing.auto_merge, false);
});

test("secret or QPU needs stay HOLD_HUMAN", () => {
  assert.equal(resolveTool({ name: "openai-secret" }).decision, "HOLD_HUMAN");
  assert.equal(resolveTool({ name: "qpu-lease" }).decision, "HOLD_HUMAN");
  assert.equal(resolveTool({ name: "wrangler-bind" }).decision, "HOLD_HUMAN");
});

test("BUILD unavailable does not stop cognition, Codex, or self-heal", () => {
  const presence = measureBuildPresence({ ACORN_BUILD_AVAILABLE: "false" });
  assert.equal(presence.available, false);
  assert.equal(presence.live, false);
  assert.ok(presence.continues_without_build.includes("scripts/cognitive-worker.mjs"));
  assert.ok(CONTINUES_WITHOUT_BUILD.includes(".github/swarm/cognition.mjs"));
  resetCognition();
  resetGuests();
  const served = serveClientProblem({
    client: "demo",
    problem: "Continue without Build.",
    ts: "2026-09-16T18:40:00.000Z",
  });
  assert.equal(served.ok, true);
  assert.equal(served.completeness.EXECUTED, true);
  assert.equal(served.live, false);
  assert.equal(selfHealDecision({ reason: "timeout 503" }).action, "RETRY");
});

test("failure catalog: 429 retries, 401 holds, missing tool builds", () => {
  assert.equal(classifyFailure({ status: 429 }), "TRANSIENT");
  assert.equal(classifyFailure({ status: 401, reason: "unauthorized" }), "AUTH_BOUNDARY");
  assert.equal(selfHealDecision({ status: 401, reason: "unauthorized" }).action, "HOLD_HUMAN");
  assert.equal(resolveTool({ name: "brand-new-meter" }).decision, "BUILD_TOOL");
});

test("runtime retries a transient worker failure and holds on secrets", async () => {
  const dir = mkdtempSync(join(tmpdir(), "acorn-runtime-"));
  const env = {
    ACORN_SYSTEM_MODE: "RUN",
    ACORN_RUNTIME_MINUTES: "1",
    ACORN_RUNTIME_MAX_CYCLES: "1",
    ACORN_RUNTIME_EVIDENCE_DIR: join(dir, "evidence"),
    ACORN_RUNTIME_CHECKPOINT: join(dir, "checkpoint.json"),
    ACORN_RUNTIME_JOURNAL: join(dir, "journal.jsonl"),
  };
  let calls = 0;
  const recovered = await runAutonomousRuntime({
    env,
    worker: () => {
      calls += 1;
      if (calls === 1) throw new Error("timeout 503");
      return { verified: false, dispatches: [] };
    },
    sleepFn: async () => {},
  });
  assert.equal(recovered.state, "TIME_SLICE_COMPLETE");
  assert.ok(calls >= 2);

  const held = await runAutonomousRuntime({
    env: { ...env, ACORN_RUNTIME_CHECKPOINT: join(dir, "checkpoint-hold.json"), ACORN_RUNTIME_JOURNAL: join(dir, "journal-hold.jsonl") },
    worker: () => { throw new Error("missing API secret"); },
    sleepFn: async () => {},
  });
  assert.equal(held.state, "HOLD_HUMAN");
  assert.equal(held.heal.action, "HOLD_HUMAN");
  assert.equal(held.live, false);
  assert.equal(held.auto_merge, false);
});
