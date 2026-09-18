import test from "node:test";
import assert from "node:assert/strict";
import {
  createEnterpriseCycle, createCryptoRail, routeByCapability, createEvidence,
  verifyDelivery, recordMoneyIntent, authorizeInternalMoney, createMoneyLedger,
  captureAsset, productizeAsset, guardEffect, enterpriseSnapshot
} from "../scripts/acorn-real-world-enterprise-os.mjs";

test("enterprise cycle connects cognition, commerce, money, evidence and assets without granting authority", () => {
  const cycle = createEnterpriseCycle({
    customer: "customer-test",
    problem: "Automate a complex business process",
    qualification: { missing: [], complexity: "high", capabilities: ["research","build","verify"] },
    offer: { deliverables: ["working system"], amount: 1000, currency: "CAD" },
    intelligences: [{ id:"grok", provider:"xai", model:"grok", capabilities:["research","build"] }],
    connections: [{ id:"github", provider:"github", kind:"code", capabilities:["repo","ci"] }]
  });
  assert.equal(cycle.stage, "OFFER_READY");
  assert.equal(cycle.policy.capability_is_not_authority, true);
  assert.equal(cycle.offer.human_authorization_required, true);
  assert.equal(cycle.ledger.entries[0].transferred, false);
  assert.equal(cycle.ledger.entries[0].custody, false);
});

test("money remains an internal commercial claim until a measured external settlement exists", () => {
  let l = recordMoneyIntent(createMoneyLedger(), { projectId:"p1", amount:250 });
  assert.equal(l.entries[0].state, "PENDING");
  l = authorizeInternalMoney(l, l.entries[0].id, { authorizedBy:"human" });
  assert.equal(l.entries[0].state, "AUTHORIZED");
  assert.equal(l.entries[0].custody, false);
  assert.equal(l.entries[0].transferred, false);
});

test("crypto rail is adapter-ready without wallet/private-key custody", () => {
  const rail = createCryptoRail({asset:"USDC",network:"BASE"});
  assert.equal(rail.type, "CRYPTO");
  assert.equal(rail.automatic_custody, false);
  assert.equal(rail.automatic_transfer, false);
});

test("routing discovers capability matches without treating a model as authority", () => {
  const r = routeByCapability({required_capabilities:["research","repo"]}, [
    {id:"grok",provider:"xai",capabilities:["research"],state:"READY",authority:false}
  ], [{id:"github",provider:"github",capabilities:["repo"],state:"READY"}]);
  assert.deepEqual(r.map(x=>x.id), ["grok","github"]);
});

test("delivery requires measured evidence and passing tests", () => {
  const project = {id:"p1"};
  const bad = verifyDelivery({project,deliverables:["x"],evidence:[],tests:[{passed:true}]});
  assert.equal(bad.ready,false);
  const good = verifyDelivery({
    project,deliverables:["x"],
    evidence:[createEvidence({kind:"test",source:"ci",claim:"passed",strength:1,margin:1})],
    tests:[{passed:true}]
  });
  assert.equal(good.ready,true);
});

test("validated asset can become a product only after repeat demand", () => {
  const asset = captureAsset({projectId:"p1",assetType:"workflow",reusable:true,evidenceId:"ev1"});
  assert.equal(asset.state,"VALIDATED_ASSET");
  assert.equal(productizeAsset(asset,{repeatDemand:false}).state,"PRODUCT_CANDIDATE");
  assert.equal(productizeAsset(asset,{repeatDemand:true}).state,"PRODUCT_READY");
});

test("forbidden effects never become implicit permissions", () => {
  const r = guardEffect("AUTO_SPEND");
  assert.equal(r.allowed,false);
  assert.throws(()=>guardEffect("AUTO_TRANSFER"),/FORBIDDEN_AUTOMATIC_EFFECT/);
});

test("snapshot never invents LIVE economic settlement", () => {
  const s = enterpriseSnapshot();
  assert.equal(s.money.custody,false);
  assert.equal(s.live_claim,"NOT_ASSERTED_BY_SNAPSHOT");
});
