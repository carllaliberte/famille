import { test } from "node:test";
import assert from "node:assert/strict";
import { intelligenceAdapter } from "../sdk/open-intelligence.js";
import { considerUnknownChannel, advanceChannel } from "../sdk/open-channel.js";

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
