import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  announce, negotiateCapability, formCollaboration, dissolveCollaboration,
  reference, revoke, stale, measureEmergence, experiment, learningEvent,
  metaLearn, unknown, reconfigure, partition, versionMismatch,
  provenanceIncomplete, census, e2e,
} from "../sdk/omni-ecosystem.js";
import { declareOrganism, discover, handshake, expose, memoryRef } from "../sdk/inter-organism.js";
import { consensusToTruth } from "../sdk/open-intelligence.js";

test("A B — discovery / declared ≠ connected", () => {
  const B = declareOrganism("B");
  assert.equal(discover([B], "B").trusted, false);
  assert.equal(announce(B).connected, false);
});

test("C D E — handshake / caps / permissions", () => {
  assert.equal(handshake(declareOrganism("A"), declareOrganism("B")).trusted, false);
  const n = negotiateCapability(declareOrganism("B", { capabilities: ["measure"] }), "measure", { available: false });
  assert.equal(n.available, false);
  assert.equal(expose(memoryRef("m", "PRIVATE"), "PUBLIC").denied, true);
});

test("F G H I — synapse / degrade / recover", () => {
  const m = e2e();
  assert.equal(m.syn.presence, "CHANNEL_NOT_PRESENT");
  assert.equal(m.dropped.presence, "DEGRADED");
  assert.equal(reconfigure(m.syn, "REROUTE").trace, true);
});

test("J K L M N — memory / revoke / stale", () => {
  const r = reference("MEMORY_REFERENCE", "m1", { source: "A" });
  assert.equal(revoke(r).erased, false);
  assert.equal(stale(r).state, "STALE");
  assert.equal(provenanceIncomplete({}).status, "PROVENANCE_INCOMPLETE");
});

test("O P Q R — no centre / emergence", () => {
  const m = e2e();
  assert.equal(m.mode, "COLLECTIVE_COGNITION");
  assert.equal(m.central, true);
  assert.equal(m.em.consciousness, false);
});

test("S T U V W — unknown / experiment / learn", () => {
  assert.equal(unknown("INTELLIGENCE", "x").forced_category, false);
  assert.equal(experiment("q").constitution_changed, false);
  assert.equal(metaLearn([1]).authority, false);
  assert.equal(learningEvent({}).revisable, true);
});

test("X Y Z AA AB AC AD — résilience / collab", () => {
  assert.equal(partition([declareOrganism("A"), declareOrganism("B")], ["A"]).kept.length, 1);
  assert.equal(versionMismatch({ version: "1" }, { version: "2" }).mismatch, true);
  assert.equal(dissolveCollaboration(formCollaboration(["A"], "t")).dissolved, true);
});

test("AE AF AG AH AI AJ AK AL", () => {
  assert.equal(consensusToTruth([1]), false);
  assert.equal(census([{ presence: "DECLARED" }]).LIVE_VERIFIED, 0);
  assert.equal(e2e().loop_final, false);
  JSON.parse(readFileSync(new URL("../schema/mesh.v0.json", import.meta.url)));
  assert.match(readFileSync(new URL("../COGNITION.md", import.meta.url), "utf8"), /COLLECTIVE_COGNITION/);
});
