import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("PR architecture contract exists and encodes the tree principle", () => {
  const text = fs.readFileSync("docs/acorn-pr-architecture.md", "utf8");
  assert.match(text, /MINIMUM PR COUNT/);
  assert.match(text, /one PR = one durable branch/i);
  assert.match(text, /Cortex closure rule/i);
  assert.match(text, /PERCEIVE → CONTEXTUALIZE/);
  assert.match(text, /CAPABILITY ≠ AUTHORITY/);
  assert.match(text, /Carl = human merge authority/);
});

test("temporary Cortex layers are explicitly rejected by architecture policy", () => {
  const text = fs.readFileSync("docs/acorn-pr-architecture.md", "utf8");
  assert.match(text, /temporary.*Cortex modules/i);
  assert.match(text, /current canonical contract/i);
});

test("stale Cortex proposals are treated as source material, not merge targets", () => {
  const text = fs.readFileSync("docs/acorn-pr-architecture.md", "utf8");
  for (const pr of ["#1038", "#1039", "#1040", "#1041", "#1042", "#1048", "#1049"]) {
    assert.match(text, new RegExp(pr.replace("#","\\#")));
  }
});
