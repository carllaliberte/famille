import test from "node:test";
import assert from "node:assert/strict";
import { buildSystemTree, forestHealth, assertSystemTreeConstitution } from "../scripts/acorn-system-tree-forest.mjs";

test("builds a forest with roots, runtime nodes and test leaves", () => {
  const tree = buildSystemTree({root:process.cwd()});
  assert.ok(tree.nodes.some(n=>n.type==="ROOT"));
  assert.ok(tree.nodes.some(n=>n.type==="LEAF"));
  assert.ok(tree.edges.length > 0);
  assert.equal(tree.live,false);
});

test("forest health exposes measured gaps instead of declaring completion", () => {
  const tree = buildSystemTree({root:process.cwd()});
  const health = forestHealth(tree);
  assert.ok(Number.isInteger(health.measured_gaps));
  assert.equal(health.evidence,"REPOSITORY_STRUCTURAL_EVIDENCE_ONLY");
});

test("constitution blocks authority and execution escalation", () => {
  assert.equal(assertSystemTreeConstitution({authority:true}).valid,false);
  assert.equal(assertSystemTreeConstitution({auto_execute:true}).valid,false);
  assert.equal(assertSystemTreeConstitution({live:true}).valid,false);
});
