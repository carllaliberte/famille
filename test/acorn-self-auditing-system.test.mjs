import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { auditAcorn, classifyAuditGaps, assertSelfAuditingConstitution, runSelfAudit } from "../scripts/acorn-self-auditing-system.mjs";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "acorn-audit-"));
  fs.mkdirSync(path.join(root, "docs", "architecture"), { recursive: true });
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(root, "test"), { recursive: true });
  fs.mkdirSync(path.join(root, ".github", "workflows"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs", "architecture", "demo.md"),
    "# Demo\ncontract: acorn.demo.v1\nimplementation: scripts/acorn-demo.mjs\n");
  fs.writeFileSync(path.join(root, "scripts", "acorn-demo.mjs"),
    'export const CONTRACT="acorn.demo.v1";\nexport function demo(){}\nexport function assertDemoConstitution(){}\nconst authority=false;');
  fs.writeFileSync(path.join(root, "test", "demo.test.mjs"),
    'import "../scripts/acorn-demo.mjs";\n');
  fs.writeFileSync(path.join(root, ".github", "workflows", "ci.yml"), "name: ci\n");
  return root;
}

test("audit inventories architecture, runtime, tests and workflows", () => {
  const root = fixture();
  const audit = auditAcorn({ root });
  assert.equal(audit.inventory.architecture_docs, 1);
  assert.equal(audit.inventory.runtime_modules, 1);
  assert.equal(audit.inventory.tests, 1);
  assert.equal(audit.inventory.workflows, 1);
  assert.equal(audit.coverage.architecture_contract_runtime_links, 1);
  assert.equal(audit.live, false);
});

test("audit exposes missing structural evidence instead of inventing completion", () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, "scripts", "acorn-unlinked.mjs"),
    'export const CONTRACT="acorn.unlinked.v1";');
  const audit = auditAcorn({ root });
  const groups = classifyAuditGaps(audit);
  assert.ok(groups.GOVERNANCE);
  assert.ok(groups.TESTS);
  assert.equal(audit.state, "GAPS_DETECTED");
});

test("constitution rejects escalation", () => {
  assert.equal(assertSelfAuditingConstitution({ authority: true }).valid, false);
  assert.equal(assertSelfAuditingConstitution({ auto_execute: true }).valid, false);
  assert.equal(assertSelfAuditingConstitution({ live: true }).valid, false);
});

test("run returns measured next action without executing it", () => {
  const result = runSelfAudit({ root: fixture() });
  assert.equal(result.audit.auto_execute, false);
  assert.equal(result.audit.authority, false);
  assert.equal(result.next_step, "REOBSERVE_SYSTEM");
});
