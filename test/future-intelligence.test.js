import { test } from "node:test";
import assert from "node:assert/strict";
import {
  intelligenceAdapter, routeByCapability, futureIntelligenceCycle,
  declareIntelligence, mayJudge, consensusToTruth,
} from "../sdk/open-intelligence.js";

test("pas de liste fermée de fournisseurs", () => {
  const a = intelligenceAdapter({ id: "future-x", provider: "UNKNOWN", capabilities: ["CAPABILITY_NEW"] });
  assert.equal(a.provider, "UNKNOWN");
  assert.equal(a.live, false);
  assert.equal(a.authority, false);
});

test("capability inconnue reste représentable", () => {
  const a = intelligenceAdapter({ id: "z-new", capabilities: [] });
  assert.equal(a.capabilities.includes("CAPABILITY_UNKNOWN"), true);
});

test("invoke sans canal ≠ LIVE", () => {
  const a = intelligenceAdapter({ id: "future-x" });
  assert.equal(a.invoke().live, false);
  assert.equal(a.invoke().reason, "CHANNEL_NOT_PRESENT");
});

test("routage par capacité, pas par nom", () => {
  const a = intelligenceAdapter({ id: "x-new", capabilities: ["CAPABILITY_NEW"] });
  const r = routeByCapability({ need: "CAPABILITY_NEW" }, [a]);
  assert.equal(r[0].id, "x-new");
  assert.equal(r[0].authority, false);
});

test("cycle futur : entrer, router, partir, isoler", () => {
  const c = futureIntelligenceCycle();
  assert.equal(c.closed_list, false);
  assert.equal(c.authority, false);
  assert.equal(c.invoked.live, false);
  assert.equal(c.gone.presence, "DISCONNECTED");
  assert.equal(c.isolated.presence, "REVOKED");
  assert.equal(c.mode, "COLLECTIVE_COGNITION");
});

test("nouvelle IA n'est pas juge", () => {
  assert.equal(mayJudge("future-x"), false);
  assert.equal(consensusToTruth([1, 1]), false);
  const r = declareIntelligence({ agents: [] }, { id: "newbot", role: "guest" });
  assert.equal(r.agents.length, 1);
});
