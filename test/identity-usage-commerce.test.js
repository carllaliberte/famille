import assert from "node:assert/strict";
import test from "node:test";
import { buildAccount, commercialReview, recordUsage } from "../scripts/identity-usage-commerce.mjs";

test("declared roster identity is not usage without execution", () => {
  const r = recordUsage({ actor: "gemini", executed: false, verified: false });
  assert.equal(r.ok, false);
  assert.equal(r.code, "NOT_EXECUTED");
});

test("unknown identity cannot create commercial usage", () => {
  const r = recordUsage({ actor: "unknown-agent", executed: true, verified: true });
  assert.equal(r.ok, false);
  assert.equal(r.code, "UNKNOWN_IDENTITY");
});

test("verified execution creates measured usage", () => {
  const r = recordUsage({
    actor: "gemini",
    executed: true,
    verified: true,
    execution_id: "cycle-1",
    work_units: 3,
    duration_ms: 1200,
    commercial_state: "PAYABLE",
  });
  assert.equal(r.ok, true);
  assert.equal(r.event.event, "USAGE_MEASURED");
  assert.equal(r.event.actor, "gemini");
  assert.equal(r.event.units.work_units, 3);
  assert.equal(r.event.commercial.charged, false);
});

test("accounts aggregate only verified usage", () => {
  const a = recordUsage({ actor: "gemini", executed: true, verified: true, work_units: 2 });
  const b = recordUsage({ actor: "gemini", executed: true, verified: true, work_units: 4 });
  const accounts = buildAccount([a, b]);
  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].work_units, 6);
  assert.equal(accounts[0].executions, 2);
});

test("payable status exposes review but never charges", () => {
  const r = commercialReview({ actor: "gemini", executions: 2, work_units: 6, commercial_state: "PAYABLE" });
  assert.equal(r.ok, true);
  assert.equal(r.commercial_review, true);
  assert.equal(r.billing_action, "HUMAN_OR_BILLING_SYSTEM");
  assert.equal(r.charged, false);
});
