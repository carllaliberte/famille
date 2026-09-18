import test from "node:test";
import assert from "node:assert/strict";
import {
  buildDeveloperConnectManifest,
  negotiateDeveloperSession,
  createUsageMeter,
  gatewayPolicy,
} from "../scripts/acorn-developer-gateway.mjs";
import {
  runMarketCycle,
  diversifyOffer,
  billingFromMeasuredUsage,
} from "../scripts/acorn-market-engine.mjs";

test("developer gateway is open, automatic and authority-safe", () => {
  const manifest = buildDeveloperConnectManifest({ capabilities:["evidence","cognition"], protocols:["connector-flux"] });
  assert.equal(manifest.automatic_onboarding, true);
  assert.equal(manifest.automatic_connection, true);
  assert.equal(manifest.connector_flux_required, true);
  assert.equal(manifest.private_keys_in_acorn, false);
  assert.equal(manifest.live, false);

  const session = negotiateDeveloperSession({
    capabilities:["evidence"],
    proof:{ verified:true },
  });
  assert.equal(session.state, "CONNECTED");
  assert.equal(session.no_authority_transfer, true);

  const meter = createUsageMeter({ audience:"BUSINESS", units:3 });
  assert.equal(meter.billable, true);
  assert.equal(meter.automatic_collection_requested, true);
  assert.equal(gatewayPolicy().auto_spend, false);
});

test("market engine turns one demand into a diversified measured offer set", () => {
  const result = runMarketCycle({
    signals:[{
      id:"d1",
      problem:"evidence verification",
      audience:"business",
      observed:true,
      evidence:[{id:"e1"}],
      confidence:0.9,
    }],
    capabilityIndex:[{id:"evidence",name:"evidence",tags:["evidence","verification"]}],
  });
  assert.equal(result.public_access, true);
  assert.equal(result.developer_access, true);
  assert.ok(result.offer_count > 1);
  assert.equal(result.no_fake_capability, true);
  assert.equal(result.no_auto_contract, true);
});

test("commercial settlement is based on measured published usage", () => {
  const [offer] = diversifyOffer({
    demand:{id:"d2",audience:"BUSINESS"},
    capabilityIds:["evidence"],
    evidence:[{id:"verified-evidence"}],
  }).filter((x) => x.id.includes("evidence"));
  offer.billable = true;
  const billing = billingFromMeasuredUsage({ offer, units:10, unit_price:0.5, currency:"USD" });
  assert.equal(billing.amount_due, 5);
  assert.equal(billing.automatic_collection_requested, true);
  assert.equal(billing.no_custody, true);
});
