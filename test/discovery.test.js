import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  FOUNDER, recordDiscovery, credit, evolveDiscovery,
  rewriteOrigin, eraseOrigin, attributionIsNotTruth, attributionIsNotProperty,
  present, foundingSentence,
} from "../sdk/discovery.js";
import { resetBreaker, requestStop } from "../sdk/open-intelligence.js";

beforeEach(() => resetBreaker());

test("founder is originator not owner of everything", () => {
  assert.equal(FOUNDER.originator, "Carl Laliberté");
  assert.equal(FOUNDER.owner_of_everything, false);
});

test("record keeps origin through later versions", () => {
  let d = recordDiscovery({ title: "X", created_at: "2026-09-12T00:00:00Z" });
  d = credit(d, "grok", { cognitive: true });
  d = evolveDiscovery(d, { status: "FALSIFIED", actor: "carl" });
  assert.equal(d.originator, "Carl Laliberté");
  assert.equal(d.version, 2);
  assert.equal(d.history.length, 2);
  assert.equal(d.cognitive_contributors[0].author, false);
});

test("cannot replace origin with AI", () => {
  const d = recordDiscovery({ title: "Y" });
  const r = rewriteOrigin(d, "grok");
  assert.equal(r.allowed, false);
  assert.equal(r.originator, "Carl Laliberté");
});

test("cannot erase origin", () => {
  const d = recordDiscovery({ title: "Z" });
  assert.equal(eraseOrigin(d).allowed, false);
});

test("attribution is not truth or property", () => {
  const d = recordDiscovery({ title: "T" });
  assert.equal(attributionIsNotTruth(d).truth, false);
  assert.equal(attributionIsNotProperty(d), true);
  assert.equal(d.property, "NOT_ASSERTED");
});

test("VERIFIED refused without measurement", () => {
  const d = recordDiscovery({ title: "V" });
  const e = evolveDiscovery(d, { status: "VERIFIED" });
  assert.equal(e.verified, false);
  assert.equal(e.status, "DECLARED");
});

test("STOP blocks mutation", () => {
  const d = recordDiscovery({ title: "S" });
  requestStop({ actor: "carl" });
  const e = evolveDiscovery(d, { status: "REPLACED" });
  assert.equal(e.blocked, true);
  assert.equal(e.originator, "Carl Laliberté");
});

test("collective benefit is not ownerless history", () => {
  const d = recordDiscovery({ title: "O" });
  assert.equal(d.collective_benefit, "OPEN_FOR_BENEFIT");
  assert.equal(d.ownerless_history, false);
  const p = present(d);
  assert.match(p.slogan, /histoire ne doit pas être oubliée/);
  assert.equal(foundingSentence().legal_perpetuity, false);
});
