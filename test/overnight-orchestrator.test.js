import test from "node:test";
import assert from "node:assert/strict";
import { runOvernightSlot } from "../scripts/overnight-orchestrator.mjs";

test("overnight slot is bounded, breaker-aware and does not repeat a front within a slot", async () => {
  let clock = 0;
  const calls = [];
  const gh = (_bin, args) => {
    if (args[0] === "pr") return "1\tsha-a\tfalse\t2026-09-15T00:00:00Z\n2\tsha-b\tfalse\t2026-09-15T00:00:00Z\n";
    return "";
  };
  const run = ({ frontsText }) => {
    calls.push(frontsText);
    return { dispatch_failed: 0, dispatched: frontsText ? frontsText.split("\n").length : 0 };
  };
  const sleep = async (ms) => { clock += ms; };
  const env = { GITHUB_REPOSITORY: "carllaliberte/famille", ACORN_SYSTEM_MODE: "RUN", OVERNIGHT_SLOT_MINUTES: "1" };
  const result = await runOvernightSlot({ env, gh, run, sleep, now: () => clock });
  assert.equal(result.slot_minutes, 1);
  assert.ok(result.cycles.length >= 1);
  assert.equal(result.unique_fronts_dispatched, 2);
  assert.equal(calls.length, 1);
});
