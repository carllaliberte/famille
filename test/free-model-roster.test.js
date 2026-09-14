import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const roster = JSON.parse(readFileSync("schema/agents.json", "utf8"));
const canals = JSON.parse(readFileSync("schema/canals-free.json", "utf8"));
const free = canals.filter((row) => row.provider === "openrouter");


test("every free OpenRouter canal has a roster identity", () => {
  const ids = new Set(roster.agents.map((row) => row.id));
  for (const row of free) assert.ok(ids.has(row.id), `missing roster identity: ${row.id}`);
});

test("free OpenRouter routes remain explicitly key-gated", () => {
  for (const row of free) assert.equal(row.secret, "OPENROUTER_API_KEY");
});

test("free models never imply LIVE presence", () => {
  const ids = new Set(free.map((row) => row.id));
  for (const row of roster.agents.filter((item) => ids.has(item.id))) {
    assert.notEqual(row.status, "live");
    assert.notEqual(row.status, "connected");
    assert.notEqual(row.status, "present");
  }
});
