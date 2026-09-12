import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  recordDiscovery, hashRecord, reanchor, exportPlain, independentRediscovery,
  archiveRef, survivability, rewriteOrigin, FOUNDER,
} from "../sdk/registry.js";
import { resetBreaker, requestStop } from "../sdk/open-intelligence.js";

beforeEach(() => resetBreaker());

test("hash is sha-256 and is not truth", () => {
  const d = hashRecord(recordDiscovery({ title: "H", created_at: "2026-09-12T00:00:00Z", discovery_id: "d-h" }));
  assert.equal(d.hash_algorithm, "sha-256");
  assert.equal(d.content_hash.length, 64);
  assert.equal(d.hash_proves_truth, false);
  assert.equal(d.signature_status, "SIGNATURE_NOT_IMPLEMENTED");
  assert.equal(d.timestamp_status, "UNVERIFIED");
});

test("tamper changes hash", () => {
  const a = hashRecord(recordDiscovery({ title: "A", created_at: "2026-09-12T00:00:00Z", discovery_id: "d-a" }));
  const b = hashRecord(recordDiscovery({ title: "B", created_at: "2026-09-12T00:00:00Z", discovery_id: "d-a" }));
  assert.notEqual(a.content_hash, b.content_hash);
});

test("reanchor keeps original hash", () => {
  const d = hashRecord(recordDiscovery({ title: "R", created_at: "2026-09-12T00:00:00Z", discovery_id: "d-r" }));
  const r = reanchor(d, "future-alg");
  assert.equal(r.content_hash, d.content_hash);
  assert.equal(r.reanchor_history[0].original_untouched, true);
});

test("plain export readable without runtime fields", () => {
  const t = exportPlain(recordDiscovery({ title: "E", created_at: "2026-09-12T00:00:00Z", discovery_id: "d-e" }));
  assert.match(t, /Carl Laliberté/);
  assert.match(t, /ACORN HISTORICAL RECORD/);
  assert.match(t, /SIGNATURE_NOT_IMPLEMENTED/);
});

test("independent rediscovery is not stolen", () => {
  const o = recordDiscovery({ title: "same", created_at: "2026-09-12T00:00:00Z" });
  const n = independentRediscovery(o, { who: "Researcher X", when: "2048-01-01T00:00:00Z" });
  assert.equal(n.independent_origin, "Researcher X");
  assert.equal(n.relation, "INDEPENDENT_REDISCOVERY");
  assert.equal(n.originator, "Researcher X");
  assert.equal(rewriteOrigin(o, "Researcher X").allowed, false);
});

test("archives not connected", () => {
  assert.equal(archiveRef().status, "NOT_CONNECTED");
  const s = survivability();
  assert.equal(s.eternal, false);
  assert.equal(s.carl_required_alive, false);
  assert.equal(s.acorn_runtime_required_to_read_export, false);
});

test("founder stays identifiable", () => {
  assert.equal(FOUNDER.originator, "Carl Laliberté");
  assert.equal(FOUNDER.owner_of_everything, false);
});

test("STOP still blocks via discovery mutate path", () => {
  requestStop({ actor: "carl" });
  const d = recordDiscovery({ title: "S" });
  const r = reanchor(d, "ml-dsa");
  assert.equal(r.blocked, true);
});
