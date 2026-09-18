import test from "node:test";import assert from "node:assert/strict";
import {normalizeOutcome,scoreProductCandidate,buildProductCandidate,createOfferTemplate,buildCatalogEntry,buildSalesAsset,buildPortfolio} from "../scripts/acorn-business-product-factory.mjs";
test("verified project becomes reusable commercial product candidate",()=>{
 const o=normalizeOutcome({customer:"ACME",problem:"Complex automation",solution:{id:"s1"},delivery:{state:"ACCEPTED"},value:{status:"MEASURED"},evidence:[{status:"MEASURED"}]});
 assert.equal(o.verified,true);
 const s=scoreProductCandidate({outcomes:[o],reuseRate:1,deliveryTimeReduction:.8,grossMargin:.7,demandSignals:.6,standardization:.9});
 assert.ok(s.score>0);
 const p=buildProductCandidate({name:"Turnkey Automation",problemClass:"AUTOMATION",outcomes:[o],deliverables:["implementation","handoff"],score:s});
 assert.equal(p.state,"CANDIDATE");
 const offer=createOfferTemplate(p,{price:15000,scope:["implementation"],acceptanceCriteria:["verified tests"]});
 assert.equal(offer.state,"HUMAN_REVIEW_REQUIRED");
 const c=buildCatalogEntry({product:p,offerTemplate:offer,proofs:[o]});
 assert.equal(c.state,"READY_FOR_HUMAN_PUBLISH");
 const a=buildSalesAsset({catalogEntry:c,problemStatement:"Complex workflow",outcomeStatement:"Measured outcome",proofSummary:"One dated proof"});
 assert.equal(a.human_publish_required,true);
 const port=buildPortfolio({outcomes:[o],products:[p],offers:[offer],catalog:[c],salesAssets:[a]});
 assert.equal(port.products.candidates,1);
 assert.equal(port.catalog.ready,1);
});
test("no evidence means no product",()=>{
 const p=buildProductCandidate({name:"X",problemClass:"X",outcomes:[]});
 assert.equal(p.state,"INSUFFICIENT_EVIDENCE");
 assert.equal(createOfferTemplate(p,{price:1,scope:["x"],acceptanceCriteria:["x"]}).state,"BLOCKED");
 assert.equal(buildPortfolio().policy.auto_publish,false);
});
