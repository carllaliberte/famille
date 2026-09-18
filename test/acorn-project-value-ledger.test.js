import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeValueRecord,
  buildProjectValueLedger,
  buildAssetEconomics,
  buildEconomicProof,
  ledgerPolicy,
} from "../scripts/acorn-project-value-ledger.mjs";

test("ledger normalizes monetary records without inventing amounts", () => {
  const x = normalizeValueRecord({
    id: "r1",
    project_id: "p1",
    kind: "revenue",
    status: "realized",
    amount: 1250,
    currency: "usd",
    source: "verified-payment-event",
  });
  assert.equal(x.kind, "REVENUE");
  assert.equal(x.status, "REALIZED");
  assert.equal(x.amount, 1250);
  assert.equal(x.currency, "USD");
});

test("project ledger separates projected revenue from realized revenue and reconciles records", () => {
  const x = buildProjectValueLedger({
    project_id: "p1",
    projected_revenue: 5000,
    realized_revenue: 1200,
    delivery_cost: 400,
    measured_value: 10000,
    evidence_verified: true,
    records: [
      { id: "rev", kind: "REVENUE", status: "REALIZED", amount: 1200 },
      { id: "cost", kind: "COST", status: "REALIZED", amount: 400 },
    ],
  });
  assert.equal(x.projected_revenue, 5000);
  assert.equal(x.realized_revenue, 1200);
  assert.equal(x.realized_cost, 400);
  assert.equal(x.realized_net_value, 800);
  assert.equal(x.projected_net_value, 4600);
  assert.equal(x.revenue_realization_ratio, .24);
  assert.equal(x.measured_value, 10000);
});

test("unverified value cannot become measured economic proof", () => {
  const x = buildProjectValueLedger({
    project_id: "p2",
    measured_value: 99999,
    evidence_verified: false,
  });
  assert.equal(x.measured_value, 0);
  assert.equal(x.evidence_verified, false);
});

test("asset economics exposes reuse and perpetual-use intent without auto-contracting", () => {
  const x = buildAssetEconomics({
    asset_id: "asset-1",
    project_id: "p3",
    verified: true,
    reusable_uses: 5,
    similar_demand: 3,
    measured_value: 20000,
    creation_cost: 2000,
    realized_revenue: 6000,
  });
  assert.equal(x.reuse_evidence, true);
  assert.equal(x.productization_evidence, true);
  assert.equal(x.realized_net_value, 4000);
  assert.equal(x.usage_right, "PERPETUAL_USE");
  assert.equal(x.auto_contract, false);
});

test("economic proof distinguishes realized evidence from a merely verified payment rail", () => {
  const ledger = buildProjectValueLedger({
    project_id: "p4",
    realized_revenue: 1000,
    delivery_cost: 250,
    evidence_verified: true,
  });
  const x = buildEconomicProof({
    ledger,
    payment_rail: { verified: true },
  });
  assert.equal(x.commercial_state, "REALIZED_AND_EVIDENCED");
  assert.equal(x.proof_state, "EVIDENCED");
  assert.equal(x.payment_state, "RAIL_VERIFIED");
  assert.equal(x.no_receipt_claim, true);
  assert.equal(x.no_live_claim, true);
});

test("policy preserves human authority and forbids autonomous economic authority", () => {
  const p = ledgerPolicy();
  assert.equal(p.human_authority, "carl");
  assert.equal(p.measured_only, true);
  assert.equal(p.invented_revenue, false);
  assert.equal(p.no_auto_contract, true);
  assert.equal(p.no_auto_spend, true);
  assert.equal(p.no_private_key_custody, true);
});
