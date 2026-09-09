import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { cycle } from "../scripts/discover-cycle.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("discover-cycle — DEFINED is not enough; EXECUTED after merge", () => {
  it("wakes, observes, classifies, never merges, same inputs same cycle kind", () => {
    const a = cycle({
      root: ROOT,
      env: {},
      sha: "abc123",
      trigger: "pull_request",
      merged: "291",
    });
    const b = cycle({
      root: ROOT,
      env: {},
      sha: "abc123",
      trigger: "pull_request",
      merged: "291",
    });
    assert.equal(a.ok, true);
    assert.equal(a.executed, true);
    assert.equal(a.live, false);
    assert.equal(a.auto_merge, false);
    assert.equal(a.truth, false);
    assert.equal(a.cycle_id, b.cycle_id);
    assert.equal(a.next, "discover");
    assert.equal(a.brains.blocked, false);
    assert.equal(a.brains.authority, "carl");
    assert.ok(Array.isArray(a.brains.unavailable));
    assert.ok(["KNOWN_CASE", "NOVEL_FRONT_CANDIDATE", "OVERLAP"].includes(a.front.kind));
    const proc = spawnSync(process.execPath, ["scripts/discover-cycle.mjs"], {
      cwd: ROOT,
      env: { ...process.env, DISCOVER_TRIGGER: "workflow_dispatch", GITHUB_SHA: "deadbeef" },
      encoding: "utf8",
    });
    assert.equal(proc.status, 0);
    const json = JSON.parse(proc.stdout);
    assert.equal(json.executed, true);
    assert.equal(json.auto_merge, false);
  });
});
