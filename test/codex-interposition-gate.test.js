import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const gate = resolve("scripts/codex-interposition-gate.mjs");

test("Codex write execution crosses the Acorn interposition gate", () => {
  const r = spawnSync(process.execPath, [gate, "exec", "--sandbox", "danger-full-access", "task"], {
    encoding: "utf8",
    env: { ...process.env, ACORN_SYSTEM_MODE: "RUN", GITHUB_REPOSITORY: "carllaliberte/famille" },
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /ACORN_CODEX_INTERPOSITION decision=ALLOW/);
  assert.match(r.stderr, /authority_granted=false/);
});

test("Codex execution is fail-closed when the Breaker is not RUN", () => {
  const r = spawnSync(process.execPath, [gate, "exec", "--sandbox", "danger-full-access", "task"], {
    encoding: "utf8",
    env: { ...process.env, ACORN_SYSTEM_MODE: "UNKNOWN", GITHUB_REPOSITORY: "carllaliberte/famille" },
  });
  assert.equal(r.status, 126);
  assert.match(r.stderr, /decision=DENY reason=BREAKER_NOT_RUN/);
});

test("read-only Codex discovery is interposed through the same choke point", () => {
  const r = spawnSync(process.execPath, [gate, "exec", "--sandbox", "read-only", "inspect"], {
    encoding: "utf8",
    env: { ...process.env, ACORN_SYSTEM_MODE: "RUN", GITHUB_REPOSITORY: "carllaliberte/famille" },
  });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stderr, /capability=codex\.exec\.discovery/);
});
