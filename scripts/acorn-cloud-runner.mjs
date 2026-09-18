#!/usr/bin/env node
/**
 * Persistent substrate runner for the canonical Acorn work engine.
 * NOT a second runtime or Cortex.
 */
import { resolve } from "node:path";
import { runContinuousWorkEngine } from "./acorn-work-engine.mjs";

export const CLOUD_RUNNER_VERSION = "acorn.cloud-runner.v1";
const positiveInt = (v,f) => Number.isFinite(Number(v)) && Number(v) > 0 ? Math.floor(Number(v)) : f;

export function cloudRunnerConfig(env=process.env) {
  return {
    interval_ms: positiveInt(env.ACORN_RUN_INTERVAL_MS,30000),
    root: resolve(env.ACORN_RUNTIME_ROOT || process.cwd()),
    state_path: resolve(env.ACORN_WORK_STATE_PATH || "evidence/autopilot/continuous-work-state.json"),
    authority:"carl", auto_merge:false, auto_spend:false, live:false
  };
}

let stopping = false;
async function runOnce(config) {
  if (stopping) return null;
  return runContinuousWorkEngine({root:config.root,statePath:config.state_path,env:process.env});
}

export async function runCloudRunner({config=cloudRunnerConfig(),once=false,sleep=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms))}={}) {
  const results = [];
  do {
    if (stopping) break;
    results.push(await runOnce(config));
    if (once || stopping) break;
    await sleep(config.interval_ms);
  } while (!stopping);
  return {version:CLOUD_RUNNER_VERSION,cycles:results.length,last:results.at(-1)||null,stopped:stopping,authority:"carl",auto_merge:false,auto_spend:false,live:false};
}

function shutdown(){ stopping = true; }
process.on("SIGTERM",shutdown);
process.on("SIGINT",shutdown);

if (process.argv[1] && import.meta.url.endsWith(process.argv[1])) {
  const result = await runCloudRunner();
  process.stdout.write(JSON.stringify(result,null,2) + "\n");
}
