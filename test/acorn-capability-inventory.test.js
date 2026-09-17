import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  LIFECYCLE,
  appendEvidence,
  availabilityFromInventory,
  coverageMetrics,
  deploymentIntegrity,
  detectDrift,
  inventoryConstitution,
  organOf,
  runInventory,
  selectExecutableCapabilities,
  verifyEvidenceChain,
} from "../scripts/acorn-capability-inventory.mjs";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "acorn-inventory-"));
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, ".github", "swarm"), { recursive: true });
  mkdirSync(join(root, ".github", "workflows"), { recursive: true });
  mkdirSync(join(root, "sdk"));
  mkdirSync(join(root, "test"));
  writeFileSync(join(root, "scripts", "real.mjs"), `export function inventoryProbe() { return { ok: true, auto_merge: false, live: false }; }\n`);
  writeFileSync(join(root, "scripts", "silent.mjs"), `const x = 1;\n`);
  writeFileSync(join(root, "scripts", "broken.mjs"), `export function broken( { ;\n`);
  writeFileSync(join(root, "scripts", "orphan.mjs"), `export function capabilityProbe() { return { ok: true, auto_merge: false, live: false }; }\n`);
  writeFileSync(join(root, ".github", "swarm", "nerve.mjs"), `export const KERNEL_VERSION = "k";\nexport function controlState() { return { auto_merge: false, live: false }; }\n`);
  writeFileSync(join(root, "sdk", "tool.js"), `export function ping() { return true; }\n`);
  writeFileSync(join(root, "package.json"), JSON.stringify({
    type: "module",
    exports: { "./real": "./scripts/real.mjs" },
    scripts: { "real:run": "node scripts/real.mjs" },
  }, null, 2));
  writeFileSync(join(root, ".github", "workflows", "cycle.yml"), `on:\n  schedule:\n    - cron: "0 * * * *"\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node scripts/real.mjs\n`);
  writeFileSync(join(root, "test", "real.test.js"), `import { inventoryProbe } from "../scripts/real.mjs";\n`);
  return root;
}

const loadable = (abs) => {
  if (abs.endsWith("broken.mjs")) return { loadable: false, failed: true, reason: "SYNTAX_FAILED" };
  return { loadable: true, reason: "SYNTAX_OK" };
};

test("constitution refuses a second architecture and keeps Carl as authority", () => {
  const c = inventoryConstitution();
  assert.equal(c.second_runtime, false);
  assert.equal(c.second_cortex, false);
  assert.equal(c.second_defense, false);
  assert.equal(c.second_breaker, false);
  assert.equal(c.second_fabric, false);
  assert.equal(c.no_script_allowlist, true);
  assert.equal(c.auto_merge, false);
  assert.equal(c.live, false);
  assert.equal(c.authority, "carl");
  assert.ok(LIFECYCLE.includes("DISCOVERED"));
  assert.ok(LIFECYCLE.includes("LIVE"));
  assert.ok(LIFECYCLE.includes("DRIFTED"));
});

test("discovers a real script and distinguishes script from capability", async () => {
  const inventory = await runInventory({ root: fixture(), checkLoadable: loadable });
  const real = inventory.entries.find((row) => row.path === "scripts/real.mjs");
  const silent = inventory.entries.find((row) => row.path === "scripts/silent.mjs");
  assert.equal(real.states.discovered, true);
  assert.equal(real.script, true);
  assert.equal(real.capability, true);
  assert.equal(silent.states.discovered, true);
  assert.equal(silent.capability, false);
  assert.equal(silent.script, true);
});

test("inexportable script stays discovered without being defined as a capability", async () => {
  const inventory = await runInventory({ root: fixture(), checkLoadable: loadable });
  const silent = inventory.entries.find((row) => row.path === "scripts/silent.mjs");
  assert.equal(silent.states.defined, false);
  assert.equal(silent.capability, false);
  assert.notEqual(silent.lifecycle, "LIVE");
});

test("syntax-broken script is failed, not silently loadable", async () => {
  const inventory = await runInventory({ root: fixture(), checkLoadable: loadable });
  const broken = inventory.entries.find((row) => row.path === "scripts/broken.mjs");
  assert.equal(broken.states.loadable, false);
  assert.equal(broken.states.failed, true);
  assert.equal(broken.lifecycle, "FAILED");
});

test("exported and workflow-invoked script is wired and deployed", async () => {
  const inventory = await runInventory({ root: fixture(), checkLoadable: loadable });
  const real = inventory.entries.find((row) => row.path === "scripts/real.mjs");
  assert.equal(real.states.wired, true);
  assert.equal(real.states.deployed, true);
  assert.equal(real.package_export, "./real");
});

test("orphan exported function is loadable but absent from runtime wiring", async () => {
  const inventory = await runInventory({ root: fixture(), checkLoadable: loadable });
  const orphan = inventory.entries.find((row) => row.path === "scripts/orphan.mjs");
  assert.equal(orphan.states.discovered, true);
  assert.equal(orphan.states.defined, true);
  assert.equal(orphan.states.loadable, true);
  assert.equal(orphan.states.wired, false);
  assert.equal(orphan.states.deployed, false);
  assert.equal(orphan.lifecycle, "LOADABLE");
});

test("execution evidence is required; existence is not execution", async () => {
  const inventory = await runInventory({ root: fixture(), checkLoadable: loadable });
  const real = inventory.entries.find((row) => row.path === "scripts/real.mjs");
  assert.equal(real.states.executed, false);
  const executed = await runInventory({
    root: fixture(),
    checkLoadable: loadable,
    executions: { "scripts/real.mjs": { executed: true, measured: false, verified: false, reason: "RAN" } },
  });
  const row = executed.entries.find((item) => item.path === "scripts/real.mjs");
  assert.equal(row.states.executed, true);
  assert.equal(row.states.measured, false);
  assert.equal(row.states.verified, false);
  assert.equal(row.states.live, false);
});

test("LIVE is refused unless every operational proof is present", async () => {
  const inventory = await runInventory({
    root: fixture(),
    checkLoadable: loadable,
    executions: { "scripts/real.mjs": { executed: true, measured: true, verified: true, reason: "PROVED" } },
  });
  const real = inventory.entries.find((row) => row.path === "scripts/real.mjs");
  assert.equal(real.live_word_earned, true);
  assert.equal(real.live, false);
  assert.equal(real.auto_merge, false);
  const silent = inventory.entries.find((row) => row.path === "scripts/silent.mjs");
  assert.equal(silent.live_word_earned, false);
});

test("coverage uses UNKNOWN instead of a fake zero when the denominator is missing", () => {
  const empty = coverageMetrics([]);
  assert.equal(empty.deployment_coverage, "UNKNOWN");
  assert.equal(empty.runtime_wiring_coverage, "UNKNOWN");
  assert.equal(empty.execution_coverage, "UNKNOWN");
  assert.equal(empty.verification_coverage, "UNKNOWN");
  assert.equal(empty.discovered_count, 0);
});

test("drift produces a falsifiable proof when wiring disappears", () => {
  const previous = [{
    id: "scripts/real",
    lifecycle: "WIRED",
    states: { discovered: true, defined: true, loadable: true, wired: true, deployed: true, exported: true },
  }];
  const current = [{
    id: "scripts/real",
    lifecycle: "LOADABLE",
    states: { discovered: true, defined: true, loadable: true, wired: false, deployed: false, exported: false, drifted: false },
  }];
  const events = detectDrift(previous, current, "2026-09-17T00:00:00.000Z");
  assert.equal(events.length, 1);
  assert.equal(events[0].event, "DRIFT_DETECTED");
  assert.equal(events[0].subject, "scripts/real");
  assert.equal(events[0].expected, "WIRED");
  assert.equal(events[0].observed, "LOADABLE");
  assert.match(events[0].reason, /wiring/);
  assert.equal(current[0].states.drifted, true);
});

test("evidence chain detects a broken digest", () => {
  const a = appendEvidence({ sequence: 0, event: "A", subject: "x", result: { ok: true }, timestamp: "2026-09-17T00:00:00.000Z" });
  const b = appendEvidence({ sequence: 1, previousDigest: a.current_digest, event: "B", subject: "x", result: { ok: true }, timestamp: "2026-09-17T00:00:01.000Z" });
  assert.equal(verifyEvidenceChain([a, b]).status, "VERIFIED");
  const broken = { ...b, current_digest: "0".repeat(64) };
  assert.equal(verifyEvidenceChain([a, broken]).status, "BROKEN");
  assert.equal(verifyEvidenceChain([]).status, "UNKNOWN");
});

test("Cortex must not treat roster presence as availability", () => {
  const missing = availabilityFromInventory(null);
  assert.equal(missing.executable, false);
  assert.equal(missing.roster_is_not_availability, true);
  const declared = availabilityFromInventory({
    lifecycle: "DISCOVERED",
    states: { discovered: true, loadable: false, wired: false, verified: false },
  });
  assert.equal(declared.exists, true);
  assert.equal(declared.executable, false);
  assert.equal(declared.healthy, false);
});

test("quarantined capability is excluded from executable selection", () => {
  const inventory = {
    entries: [
      { id: "scripts/bad", path: "scripts/bad.mjs", exports: ["defenseConstitution"], states: { loadable: true, wired: true, quarantined: true, failed: false } },
      { id: "scripts/good", path: "scripts/good.mjs", exports: ["defenseConstitution"], states: { loadable: true, wired: true, quarantined: false, failed: false, verified: true } },
    ],
  };
  const selected = selectExecutableCapabilities(inventory, ["defense"]);
  assert.deepEqual(selected.selected, ["scripts/good"]);
  assert.equal(selected.roster_used, false);
});

test("real famille tree discovers defense without an allowlist", async () => {
  const inventory = await runInventory({ root: join(import.meta.dirname, "..") });
  const defense = inventory.entries.find((row) => row.path === "scripts/acorn-defense.mjs");
  assert.ok(defense, "defense script must be discovered from conventions");
  assert.equal(defense.states.discovered, true);
  assert.equal(defense.states.defined, true);
  assert.equal(defense.package_export, "./acorn-defense");
  assert.equal(defense.live, false);
  assert.equal(inventory.constitution.no_script_allowlist, true);
  assert.ok(inventory.coverage.discovered_count > 1);
});

test("organism inventory discovers contracts, workflows and tests without claiming LIVE", async () => {
  const inventory = await runInventory({ root: join(import.meta.dirname, "..") });
  const schema = inventory.entries.find((row) => row.path === "schema/acorn-capability.v0.json");
  const workflow = inventory.entries.find((row) => row.path === ".github/workflows/acorn-autopilot.yml");
  const testFile = inventory.entries.find((row) => row.path === "test/acorn-capability-inventory.test.js");
  assert.ok(schema, "capability schema must be discovered");
  assert.equal(schema.kind, "contract");
  assert.equal(schema.organ, "schema");
  assert.equal(schema.states.defined, true);
  assert.equal(schema.states.loadable, true);
  assert.equal(schema.live, false);
  assert.ok(workflow, "autopilot workflow must be discovered");
  assert.equal(workflow.kind, "workflow");
  assert.equal(workflow.states.wired, true);
  assert.equal(workflow.live, false);
  assert.ok(testFile, "inventory test must be discovered as a test surface");
  assert.equal(testFile.kind, "test");
  assert.equal(testFile.live, false);
  assert.ok(inventory.organs.schema >= 1);
  assert.ok(inventory.organs.workflow >= 1);
  assert.ok(inventory.organs.test >= 1);
  assert.equal(inventory.integrity.live, false);
  assert.ok(["ALIGNED", "DIVERGENT"].includes(inventory.integrity.status));
  assert.equal(organOf("scripts/acorn-defense.mjs", "script"), "defense");
  const integrity = deploymentIntegrity(inventory.entries);
  assert.equal(integrity.auto_merge, false);
});

test("autonomous-runtime is wired through package export, not merely present in git", async () => {
  const inventory = await runInventory({ root: join(import.meta.dirname, "..") });
  const runtime = inventory.entries.find((row) => row.path === "scripts/autonomous-runtime.mjs");
  assert.ok(runtime, "autonomous-runtime must be discovered");
  assert.equal(runtime.states.discovered, true);
  assert.equal(runtime.states.defined, true);
  assert.equal(runtime.states.loadable, true);
  assert.equal(runtime.states.wired, true);
  assert.equal(runtime.states.deployed, true);
  assert.equal(runtime.package_export, "./autonomous-runtime");
  assert.equal(runtime.live, false);
});
