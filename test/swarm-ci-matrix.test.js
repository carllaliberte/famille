import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { matrix } from "../scripts/swarm-ci-matrix.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("swarm-ci-matrix — presence only, exit 0", () => {
  it("never dumps secrets and skips missing keys", () => {
    const m = matrix({
      OPENAI_API_KEY: "sk-test-should-never-appear",
      GEMINI_API_KEY: "AIza-fake",
    });
    assert.equal(m.ok, true);
    assert.equal(m.live, false);
    assert.equal(m.auto_merge, false);
    assert.ok(m.run.includes("chatgpt"));
    assert.ok(m.run.includes("gemini"));
    assert.ok(m.skip.includes("sonnet"));
    const blob = JSON.stringify(m);
    assert.doesNotMatch(blob, /sk-test-should-never-appear/);
    assert.doesNotMatch(blob, /AIza-fake/);
    assert.ok(m.rows.every((r) => r.connected === false));
    const proc = spawnSync(process.execPath, ["scripts/swarm-ci-matrix.mjs"], {
      cwd: ROOT,
      env: { ...process.env, OPENAI_API_KEY: "sk-spawn-secret" },
      encoding: "utf8",
    });
    assert.equal(proc.status, 0);
    assert.doesNotMatch(proc.stdout + proc.stderr, /sk-spawn-secret/);
  });
});
