import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { matrix } from "../scripts/swarm-ci-matrix.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("swarm-ci-matrix — présence booléenne, skip silencieux, exit 0", () => {
  it("present is boolean; missing keys skip silently; connected stays false", () => {
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
    assert.doesNotMatch(blob, /API_KEY|missing /);
    assert.ok(m.rows.every((r) => r.connected === false));
    assert.ok(m.rows.every((r) => typeof r.present === "boolean"));
    const chatgpt = m.rows.find((r) => r.id === "chatgpt");
    assert.equal(chatgpt.present, true);
    assert.equal(chatgpt.connected, false);
    const sonnet = m.rows.find((r) => r.id === "sonnet");
    assert.equal(sonnet.present, false);
    assert.equal(sonnet.connected, false);
  });

  it("CLI: empty env skips silently, exit 0, no secret names", () => {
    const proc = spawnSync(process.execPath, ["scripts/swarm-ci-matrix.mjs"], {
      cwd: ROOT,
      env: { PATH: process.env.PATH },
      encoding: "utf8",
    });
    assert.equal(proc.status, 0);
    assert.equal(proc.stderr, "");
    assert.doesNotMatch(proc.stdout, /API_KEY|missing |sk-/);
    const out = JSON.parse(proc.stdout);
    assert.ok(out.rows.every((r) => r.present === false));
    assert.ok(out.rows.every((r) => r.connected === false));
  });

  it("CLI: key present is not connected; never dumps the value", () => {
    const proc = spawnSync(process.execPath, ["scripts/swarm-ci-matrix.mjs"], {
      cwd: ROOT,
      env: { PATH: process.env.PATH, OPENAI_API_KEY: "sk-spawn-secret" },
      encoding: "utf8",
    });
    assert.equal(proc.status, 0);
    assert.doesNotMatch(proc.stdout + proc.stderr, /sk-spawn-secret/);
    const out = JSON.parse(proc.stdout);
    const chatgpt = out.rows.find((r) => r.id === "chatgpt");
    assert.equal(chatgpt.present, true);
    assert.equal(chatgpt.connected, false);
  });
});
