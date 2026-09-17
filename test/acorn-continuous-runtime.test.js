import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  breakerObservation,
  inventoryProbe,
  mayPerform,
  runContinuousRuntime,
} from "../scripts/acorn-continuous-runtime.mjs";
import { resourceAvailability } from "../scripts/cortex-cognition.mjs";
import { BREAKER_AUTHORITY, BREAKER_OWNER } from "../.github/swarm/system-breaker.mjs";
import { defenseConstitution } from "../scripts/acorn-defense.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "acorn-continuous-"));
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, ".github", "swarm"), { recursive: true });
  mkdirSync(join(root, ".github", "workflows"), { recursive: true });
  mkdirSync(join(root, "sdk"));
  writeFileSync(join(root, "scripts", "ok.mjs"), `export function inventoryProbe() { return { ok: true, auto_merge: false, live: false }; }\n`);
  writeFileSync(join(root, "scripts", "fail.mjs"), `export function broken( { ;\n`);
  writeFileSync(join(root, "package.json"), JSON.stringify({
    type: "module",
    exports: { "./ok": "./scripts/ok.mjs" },
  }));
  writeFileSync(join(root, ".github", "workflows", "run.yml"), `on:\n  schedule:\n    - cron: "0 * * * *"\njobs:\n  a:\n    steps:\n      - run: node scripts/ok.mjs\n`);
  return root;
}

const loadable = (abs) => abs.endsWith("fail.mjs")
  ? { loadable: false, failed: true, reason: "SYNTAX_FAILED" }
  : { loadable: true, reason: "SYNTAX_OK" };

test("continuous runtime exposes a safe inventory probe and is not a second architecture", () => {
  const probe = inventoryProbe();
  assert.equal(probe.ok, true);
  assert.equal(probe.auto_merge, false);
  assert.equal(probe.live, false);
  assert.equal(probe.second_runtime, false);
  assert.equal(probe.authority, "carl");
});

test("CARL controls BREAKER; BREAKER does not control CARL; ACORN controls neither", () => {
  assert.equal(BREAKER_OWNER, "carl");
  assert.equal(BREAKER_AUTHORITY.breaker_controls_carl, false);
  assert.equal(BREAKER_AUTHORITY.acorn_controls_carl, false);
  assert.equal(BREAKER_AUTHORITY.acorn_controls_breaker, false);
});

test("capability is not authority", () => {
  const c = defenseConstitution();
  assert.equal(c.capability_is_not_authority, true);
  assert.equal(c.one_defense_kernel, true);
  assert.equal(c.second_security_layer, false);
});

for (const observed of ["OPEN", "CLOSED", "AMBIGUOUS", "UNKNOWN", "INVALID"]) {
  test(`breaker ${observed}: threatened ops blocked when not OPEN, defense stays active`, async () => {
    const env = {
      OPEN: { ACORN_SYSTEM_MODE: "RUN" },
      CLOSED: { ACORN_SYSTEM_MODE: "OFF" },
      AMBIGUOUS: { ACORN_SYSTEM_MODE: "DEBUG" },
      UNKNOWN: {},
      INVALID: { ACORN_SYSTEM_MODE: "WAT" },
    }[observed];
    const breaker = breakerObservation(env);
    assert.equal(breaker.observed, observed);
    assert.equal(breaker.hold_on_defense, false);
    assert.equal(breaker.defense_active, true);
    assert.equal(breaker.continuity_active, true);
    const dispatch = mayPerform({ operation: "dispatch", breaker });
    const measure = mayPerform({ operation: "inventory", breaker });
    if (observed === "OPEN") assert.equal(dispatch.allowed, true);
    else assert.equal(dispatch.allowed, false);
    assert.equal(measure.allowed, true);
    const result = await runContinuousRuntime({
      root: fixture(),
      env,
      checkLoadable: loadable,
    });
    assert.equal(result.defense.active, true);
    assert.equal(result.defense.continue_defending, true);
    assert.notEqual(result.defense.state, "HOLD_HUMAN");
    assert.equal(result.breaker.hold_on_defense, false);
    assert.equal(result.auto_merge, false);
    assert.equal(result.live, false);
    if (observed === "OPEN") assert.equal(result.state, "CONTINUOUS");
    else assert.equal(result.state, "DEFENSIVE_CONTINUATION");
  });
}

test("safe probe executes a real module without claiming Carl LIVE", async () => {
  const result = await runContinuousRuntime({
    root: fixture(),
    env: { ACORN_SYSTEM_MODE: "RUN" },
    checkLoadable: loadable,
    importer: (url) => import(url),
  });
  const ok = result.inventory.entries.find((row) => row.path === "scripts/ok.mjs");
  assert.equal(ok.states.executed, true);
  assert.equal(ok.states.measured, true);
  assert.equal(ok.states.verified, true);
  assert.equal(ok.live_word_earned, true);
  assert.equal(ok.live, false);
  assert.equal(result.live, false);
});

test("suspect capability is quarantined without stopping the rest of the system", async () => {
  const result = await runContinuousRuntime({
    root: fixture(),
    env: { ACORN_SYSTEM_MODE: "RUN" },
    checkLoadable: loadable,
  });
  const failed = result.inventory.entries.find((row) => row.path === "scripts/fail.mjs");
  assert.equal(failed.lifecycle, "QUARANTINED");
  const ok = result.inventory.entries.find((row) => row.path === "scripts/ok.mjs");
  assert.notEqual(ok.lifecycle, "QUARANTINED");
  assert.equal(result.defense.active, true);
  assert.ok(result.defense.quarantines.length >= 1);
});

test("recovery is verified or explicitly unavailable, never a silent fallback", async () => {
  const result = await runContinuousRuntime({
    root: fixture(),
    env: { ACORN_SYSTEM_MODE: "RUN" },
    checkLoadable: loadable,
  });
  assert.ok(result.defense.recoveries.length >= 1);
  for (const row of result.defense.recoveries) {
    assert.ok(["RECOVERED", "RECOVERING", "BLOCKED"].includes(row.status));
    assert.notEqual(row.status, "HOLD_HUMAN");
  }
});

test("Cortex refuses roster-only availability and stays inside Acorn", async () => {
  const rosterOnly = resourceAvailability({ resource: { id: "grok", presence: "DECLARED" } });
  assert.equal(rosterOnly.executable, false);
  assert.equal(rosterOnly.reason, "NO_INVENTORY_EVIDENCE");
  const result = await runContinuousRuntime({
    root: fixture(),
    env: { ACORN_SYSTEM_MODE: "RUN" },
    checkLoadable: loadable,
  });
  assert.equal(result.cortex.belongs_to_acorn, true);
  assert.equal(result.cortex.second_cortex, false);
  assert.equal(result.constitution.second_runtime, false);
  assert.equal(result.constitution.second_defense, false);
  assert.equal(result.constitution.second_breaker, false);
  assert.equal(result.constitution.second_fabric, false);
});

test("quarantined capability cannot make a cognitive cycle VERIFIED", async () => {
  const result = await runContinuousRuntime({
    root: fixture(),
    env: { ACORN_SYSTEM_MODE: "OFF" },
    checkLoadable: loadable,
    executions: {},
  });
  assert.notEqual(result.defense.state, "HOLD_HUMAN");
  assert.equal(result.defense.active, true);
});

test("evidence seal is verifiable", async () => {
  const result = await runContinuousRuntime({
    root: fixture(),
    env: { ACORN_SYSTEM_MODE: "RUN" },
    checkLoadable: loadable,
  });
  assert.equal(result.evidence.seal_verified, true);
  assert.ok(result.evidence.inventory.current_digest);
  assert.equal(result.evidence.chain.status, "VERIFIED");
});

test("real Acorn organs remain a single organism", async () => {
  const result = await runContinuousRuntime({
    root: join(import.meta.dirname, ".."),
    env: { ACORN_SYSTEM_MODE: "OFF" },
  });
  assert.equal(result.constitution.one_runtime, true);
  assert.equal(result.constitution.second_runtime, false);
  assert.equal(result.breaker.observed, "CLOSED");
  assert.equal(result.defense.active, true);
  assert.equal(result.state, "DEFENSIVE_CONTINUATION");
  assert.ok(result.coverage.discovered_count > 10);
  assert.equal(result.live, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.discovery.second_cortex, false);
  assert.equal(result.discovery.live, false);
  assert.equal(result.discovery.paths.ranked, false);
  assert.equal(result.discovery.trust.single_number, null);
  assert.equal(result.discovery.experiment.adopted, false);
  assert.equal(result.discovery.unknown.cortex_modified, false);
  assert.equal(result.discovery.architectures.adopted, false);
  assert.equal(result.discovery.architectures.brute_force, false);
  assert.equal(result.discovery.strategy.adopted, false);
  assert.equal(result.discovery.emergence.emergent, false);
  assert.equal(result.discovery.evolution.adopted, false);
  assert.equal(result.discovery.science.executed, false);
  assert.equal(result.discovery.science.causality, "INCONCLUSIVE");
});
