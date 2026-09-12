import { test } from "node:test";
import assert from "node:assert/strict";
import {
  unauthorizedProbe, disclose, isolateCompromised,
  authorize, executionRequest, grokExecutor, mayJudge, consensusToTruth,
} from "../sdk/open-intelligence.js";

test("probe non autorisé : aucune topologie", () => {
  const p = unauthorizedProbe();
  assert.equal(p.status, "BLOCKED");
  assert.equal(p.topology, undefined);
  assert.equal(p.nodes, undefined);
  assert.equal(p.capabilities, undefined);
});

test("divulgation : seul carl reçoit le payload", () => {
  assert.equal(disclose("stranger", { nodes: ["A"] }).disclosed, false);
  assert.equal(disclose("carl", { ok: true }).disclosed, false);
  assert.equal(disclose("carl", { ok: true }, true).disclosed, true);
});

test("compromission isolée sans détruire le fabric", () => {
  const r = isolateCompromised("future-x");
  assert.equal(r.isolated, true);
  assert.equal(r.evidence_kept, true);
  assert.equal(r.fabric_intact, true);
});

test("WRITE sans permission = BLOCKED", () => {
  const a = authorize(executionRequest({ requester: "x", capability: "github.write", permissions: ["READ"] }));
  assert.equal(a.status, "BLOCKED");
});

test("Grok n'est pas autorité ; consensus ≤ vérité", () => {
  assert.equal(grokExecutor().authority, false);
  assert.equal(mayJudge("grok"), false);
  assert.equal(consensusToTruth([1]), false);
});
