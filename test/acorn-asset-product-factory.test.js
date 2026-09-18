import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAssetRecord,
  buildProductCandidate,
  buildCatalogEntry,
  buildFactoryCycle,
  factoryPolicy,
} from "../scripts/acorn-asset-product-factory.mjs";

test("verified delivered work becomes a reusable measured asset", () => {
  const asset = buildAssetRecord({
    asset_id: "a1", project_id: "p1", name: "Workflow system",
    components: ["connector", "workflow", "docs", "connector"],
    evidence: [{ id: "e1", verified: true, source: "test" }],
    measured_value: 42000, creation_cost: 5000,
    usage_rights: ["PERPETUAL_USE"], verified: true,
  });
  assert.equal(asset.state, "VALIDATED");
  assert.equal(asset.verified, true);
  assert.equal(asset.measured_value, 42000);
  assert.deepEqual(asset.components, ["connector", "workflow", "docs"]);
});

test("unverified work cannot become a validated product asset", () => {
  const asset = buildAssetRecord({
    asset_id: "a2", components: ["workflow"], evidence: [],
    measured_value: 99999, verified: true,
  });
  assert.equal(asset.verified, false);
  assert.equal(asset.measured_value, 0);
  assert.equal(asset.state, "CANDIDATE");
});

test("repeat demand plus explicit rights prepares a product offer", () => {
  const asset = buildAssetRecord({
    asset_id: "a3", name: "Turnkey solution", components: ["core"],
    evidence: [{ id: "e3", verified: true }], measured_value: 10000,
    usage_rights: ["PERPETUAL_USE"], verified: true,
  });
  const product = buildProductCandidate({
    asset, repeat_demand: 5, price: 25000,
    revenue_streams: ["PROJECT", "LICENSE"],
  });
  assert.equal(product.state, "READY_FOR_OFFER");
  assert.equal(product.billable_candidate, true);
  assert.equal(product.auto_publish, false);
  assert.equal(product.auto_contract, false);
});

test("catalog stays blocked without proof", () => {
  const product = buildProductCandidate({
    asset: { asset_id: "a4", name: "Unknown", verified: false, reusable: true, usage_rights: [] },
    repeat_demand: 10, price: 100,
  });
  const catalog = buildCatalogEntry({
    asset: { asset_id: "a4", name: "Unknown", verified: false, measured_value: 5000, usage_rights: [] },
    product, proof: [],
  });
  assert.equal(catalog.state, "HOLD_HUMAN");
  assert.equal(catalog.customer_value, 0);
  assert.equal(catalog.published, false);
});

test("factory cycle preserves human publication authority", () => {
  const cycle = buildFactoryCycle({
    asset_id: "a5", project_id: "p5", name: "Reusable solution",
    components: ["core", "adapter"], evidence: [{ id: "e5", verified: true }],
    measured_value: 30000, usage_rights: ["COMMERCIAL_USE"],
    verified: true, repeat_demand: 3, price: 15000,
  });
  assert.equal(cycle.asset.state, "VALIDATED");
  assert.equal(cycle.product.state, "READY_FOR_OFFER");
  assert.equal(cycle.catalog.state, "READY_FOR_OFFER");
  assert.equal(cycle.catalog.published, false);
  assert.equal(cycle.catalog.requires_human_publication, true);
});

test("policy forbids autonomous publishing and contracting", () => {
  const policy = factoryPolicy();
  assert.equal(policy.build_once_sell_many, true);
  assert.equal(policy.evidence_before_productization, true);
  assert.equal(policy.auto_publish, false);
  assert.equal(policy.auto_contract, false);
  assert.equal(policy.no_fake_live, true);
});
