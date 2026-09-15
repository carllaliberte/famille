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

test("overnight next cycle reads the previous sealed record", async () => {
  let clock = 0;
  const seen = [];
  const gh = (_bin, args) => {
    if (args[0] === "pr") return "1\tsha-a\tfalse\t2026-09-15T00:00:00Z\n";
    return "";
  };
  const run = (opts) => {
    seen.push({
      previous: opts.previousMeasurementRecord?.seal?.digest || null,
      memory_cycles: opts.memory?.cycles ?? 0,
    });
    const n = seen.length;
    return {
      dispatch_failed: 0,
      dispatched: 1,
      cycle_state: {
        memory: { v: "synaptic-memory.v1", cycles: n },
        ranking: { seal: { digest: `rank-${n}` } },
        record: { seal: { digest: `rec-${n}` } },
      },
    };
  };
  const sleep = async (ms) => { clock += ms; };
  const env = {
    GITHUB_REPOSITORY: "carllaliberte/famille",
    ACORN_SYSTEM_MODE: "RUN",
    OVERNIGHT_SLOT_MINUTES: "1",
    OVERNIGHT_BASE_DELAY_MS: "1000",
  };
  const result = await runOvernightSlot({ env, gh, run, sleep, now: () => clock });
  assert.ok(result.cycles.length >= 2);
  assert.equal(seen[0].previous, null);
  assert.equal(seen[1].previous, "rec-1");
  assert.equal(seen[1].memory_cycles, 1);
  assert.equal(result.cycles[1].predecessor_digest, "rec-1");
  assert.equal(result.auto_merge, false);
  assert.equal(result.live, false);
});
