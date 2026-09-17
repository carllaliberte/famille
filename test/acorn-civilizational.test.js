import test from "node:test";
import assert from "node:assert/strict";
import {
  runCivilizationalCycle,
  globalInvariantAudit,
  falsificationBattery,
  evidencePackage,
  CIVILIZATIONAL_VERSION,
} from "../scripts/acorn-civilizational.mjs";
import { runContinuousRuntime, inventoryProbe } from "../scripts/acorn-continuous-runtime.mjs";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "acorn-civ-"));
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, ".github", "swarm"), { recursive: true });
  mkdirSync(join(root, ".github", "workflows"), { recursive: true });
  mkdirSync(join(root, "sdk"));
  writeFileSync(join(root, "scripts", "ok.mjs"), `export function inventoryProbe() { return { ok: true, auto_merge: false, live: false }; }\n`);
  writeFileSync(join(root, "package.json"), JSON.stringify({
    type: "module",
    exports: { "./ok": "./scripts/ok.mjs" },
  }));
  writeFileSync(join(root, ".github", "workflows", "run.yml"), `on:\n  schedule:\n    - cron: "0 * * * *"\njobs:\n  a:\n    steps:\n      - run: node scripts/ok.mjs\n`);
  return root;
}

test("civilizational cycle executes on the existing organism and never claims LIVE", async () => {
  const cycle = runCivilizationalCycle({
    env: { ACORN_SYSTEM_MODE: "OFF" },
    current: { capability: 2, observability: "PARTIAL", control: 0.4, reversibility: "UNKNOWN" },
  });
  assert.equal(cycle.version, CIVILIZATIONAL_VERSION);
  assert.equal(cycle.vision, "ACORN = CONTINUITY OF GOVERNABLE COGNITION");
  assert.deepEqual(cycle.hierarchy, ["CARL", "BREAKER", "ACORN", "CORTEX", "RESOURCES"]);
  assert.equal(cycle.live, false);
  assert.equal(cycle.auto_merge, false);
  assert.equal(cycle.silent_stop, false);
  assert.equal(cycle.silent_fallback, false);
  assert.equal(cycle.fake_success, false);
  assert.equal(cycle.executed, true);
  assert.equal(cycle.measured, true);
  assert.equal(cycle.cortex.belongs_to_acorn, true);
  assert.equal(cycle.cortex.metacognition.second_cortex, false);
  assert.equal(cycle.defense.is_not_sovereignty, true);
  assert.equal(cycle.replaceability.acorn_requires_acorn, false);
  assert.equal(cycle.reconstruction.required_acorn_instance, false);
  assert.equal(cycle.causality.status, "INCONCLUSIVE");
  assert.equal(cycle.future_intelligence.live, false);
  assert.equal(cycle.evidence.seal_verified, true);
  assert.equal(cycle.unknown_space.we_do_not_know, true);
});

test("global invariant audit produces measurable proofs", () => {
  const audit = globalInvariantAudit({ env: { ACORN_SYSTEM_MODE: "OFF" } });
  assert.equal(audit.live, false);
  assert.ok(audit.verified.includes("assertHumanSovereignty"));
  assert.ok(audit.verified.includes("assertBreakerSovereignty"));
  assert.ok(audit.verified.includes("assertCapabilityAuthoritySeparation"));
  assert.ok(audit.verified.includes("assertNoSecondCortex"));
  assert.ok(audit.verified.includes("assertReplaceability"));
  assert.equal(audit.failed.length, 0);
  assert.equal(audit.status, "VERIFIED");
});

test("falsification battery probes bypass, fake live, second architecture, loops, gaps", () => {
  const f = falsificationBattery();
  const names = f.findings.map((row) => row.name);
  for (const need of [
    "authority_bypass", "breaker_bypass", "false_live", "hidden_capability",
    "silent_fallback", "recursive_loop", "control_gap", "acorn_dependency_trap",
    "second_cortex", "second_defense", "self_modification_boundary",
  ]) {
    assert.ok(names.includes(need), need);
  }
  assert.equal(f.live, false);
});

test("continuous runtime wires civilizational cognition without a second runtime", async () => {
  const probe = inventoryProbe();
  assert.equal(probe.second_runtime, false);
  const result = await runContinuousRuntime({
    root: fixture(),
    env: { ACORN_SYSTEM_MODE: "OFF" },
    checkLoadable: () => ({ loadable: true, reason: "SYNTAX_OK" }),
    importer: null,
    at: "2026-09-17T00:00:00.000Z",
  });
  assert.equal(result.constitution.second_runtime, false);
  assert.equal(result.constitution.one_constitution, true);
  assert.equal(result.civilizational.live, false);
  assert.equal(result.civilizational.vision, "ACORN = CONTINUITY OF GOVERNABLE COGNITION");
  assert.equal(result.live, false);
  assert.equal(result.auto_merge, false);
});

test("evidence package never claims unmeasured LIVE", () => {
  const pack = evidencePackage({
    cycle: runCivilizationalCycle({ env: { ACORN_SYSTEM_MODE: "OFF" } }),
    git: { head: "local", main: "6824eeeb9e76b8fa13d0a5d50ca237472af362f7" },
  });
  assert.equal(pack.live, false);
  assert.equal(pack.auto_merge, false);
  assert.ok(Array.isArray(pack.invariants_verified));
  assert.ok(pack.remaining_human_action.some((row) => /Carl/.test(row)));
});
