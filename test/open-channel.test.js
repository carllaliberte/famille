import { test } from "node:test";
import assert from "node:assert/strict";
import { intelligenceAdapter } from "../sdk/open-intelligence.js";
import { considerUnknownChannel, advanceChannel, classifyProbe } from "../sdk/open-channel.js";

test("unknown provider name is DISCOVERED not CONNECTED", () => {
  const c = considerUnknownChannel({ id: "not-in-inventory-xyz", provider: "not-in-inventory-xyz" });
  assert.equal(c.status, "DISCOVERED");
  assert.equal(c.presence, "DECLARED");
  assert.equal(c.live, false);
  assert.equal(c.closed_list, false);
  assert.equal(c.next, "HOLD_HUMAN");
});

test("adapter invoke without channel stays CHANNEL_NOT_PRESENT", () => {
  const a = intelligenceAdapter({ id: "future-z", provider: "not-in-inventory-xyz" });
  const r = a.invoke({ capability: "READ" });
  assert.equal(r.invoked, false);
  assert.equal(r.reason, "CHANNEL_NOT_PRESENT");
  assert.equal(r.live, false);
});

test("invented response cannot skip to MEASURED", () => {
  const r = advanceChannel({ invented_response: true, real_call: false });
  assert.equal(r.status, "NOT_EXECUTED");
  assert.equal(r.reason, "INVENTED_RESPONSE");
});

test("no real call stays NOT_EXECUTED even if name known", () => {
  const r = advanceChannel({ provider: "openai", real_call: false });
  assert.equal(r.status, "NOT_EXECUTED");
  assert.equal(r.next, "NOT_EXECUTED");
});

test("401 means VERIFIED host not AUTHENTICATED", () => {
  const r = classifyProbe({ url: "https://api.openai.com/v1/models", http: 401 });
  assert.equal(r.status, "VERIFIED");
  assert.equal(r.authenticated, false);
  assert.equal(r.live, false);
  assert.equal(r.failure, "MISSING_SECRET");
  assert.equal(r.next, "HOLD_HUMAN");
});

test("directory 200 is not a completion REAL_CALL", () => {
  const r = classifyProbe({ url: "https://openrouter.ai/api/v1/models", http: 200 });
  assert.equal(r.status, "VERIFIED");
  assert.equal(r.directory_reachable, true);
  assert.equal(r.completion, false);
  assert.equal(r.live, false);
});
