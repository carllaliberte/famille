import test from "node:test";
import assert from "node:assert/strict";
import { cloudRunnerConfig } from "../scripts/acorn-cloud-runner.mjs";

test("cloud runner is a substrate, not a second authority", () => {
  const config = cloudRunnerConfig({
    ACORN_RUN_INTERVAL_MS:"5000",
    ACORN_RUNTIME_ROOT:"/tmp/acorn",
    ACORN_WORK_STATE_PATH:"/tmp/acorn/state.json"
  });
  assert.equal(config.interval_ms,5000);
  assert.equal(config.root,"/tmp/acorn");
  assert.equal(config.state_path,"/tmp/acorn/state.json");
  assert.equal(config.authority,"carl");
  assert.equal(config.auto_merge,false);
  assert.equal(config.auto_spend,false);
});
