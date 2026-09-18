import test from "node:test";
import assert from "node:assert/strict";
import {createEconomicSignal,discoverEconomicOpportunities,generateBusinessModels,productizeEconomicAsset,buildEconomicPortfolio,runInfiniteEconomicCycle,INFINITE_ECONOMIC_POLICY} from "../scripts/acorn-infinite-economic-engine.mjs";

test("discovers repeatable economic signals without deciding",()=>{
 const s=[createEconomicSignal({source_id:"p1",problem_class:"automation",value:1000,verified:true,reusable:true,repeat_count:2,customer_count:1}),createEconomicSignal({source_id:"p2",problem_class:"automation",value:1500,verified:true,reusable:true,repeat_count:1,customer_count:1})];
 const o=discoverEconomicOpportunities({signals:s});
 assert.equal(o.length,1); assert.equal(o[0].verified_value,2500); assert.equal(o[0].decision,"HUMAN_REVIEW_REQUIRED");
});
test("generates extensible business models from one asset",()=>{
 const r=generateBusinessModels({asset:{id:"a1",problem_class:"automation"}});
 assert.equal(r.state,"BUSINESS_MODELS_PROPOSED"); assert.ok(r.models.some(x=>x.type==="PROJECT")); assert.ok(r.models.some(x=>x.type==="PLATFORM")); assert.ok(r.models.some(x=>x.type==="MARKETPLACE"));
 assert.equal(r.human_decision_required,true);
});
test("productization requires measured evidence and reuse or demand",()=>{
 const a={id:"a1",problem_class:"automation",reusable:true,evidence:[{status:"MEASURED"}]};
 const r=productizeEconomicAsset({asset:a,evidence:a.evidence,demandSignals:1,customerCount:2});
 assert.equal(r.state,"PRODUCTIZATION_CANDIDATE"); assert.equal(r.human_publish_required,true);
});
test("portfolio keeps projected and realized revenue separate",()=>{
 const p=buildEconomicPortfolio({projects:[{id:"p1",projected_revenue:10000,realized_revenue:2500,delivery_cost:1000,measured_value:9000,evidence_verified:true}]});
 assert.equal(p.realized_revenue,2500); assert.equal(p.projected_revenue,10000); assert.equal(p.realized_net_value,1500);
});
test("full cycle remains human-authorized",()=>{
 const s=[createEconomicSignal({source_id:"p1",problem_class:"data",value:5000,verified:true,reusable:true,customer_count:2,repeat_count:2})];
 const a=[{id:"a1",problem_class:"data",reusable:true,evidence:[{status:"MEASURED"}]}];
 const c=runInfiniteEconomicCycle({signals:s,assets:a});
 assert.equal(c.state,"ECONOMIC_CYCLE_READY"); assert.equal(c.stages.opportunities.length,1); assert.ok(c.stages.business_models.length>0); assert.equal(c.stages.productization[0].state,"PRODUCTIZATION_CANDIDATE");
 assert.equal(c.authority.acorn,"PROPOSE_AND_MEASURE"); assert.equal(c.authority.human,"AUTHORIZE_AND_DECIDE"); assert.equal(INFINITE_ECONOMIC_POLICY.no_auto_contract,true); assert.equal(INFINITE_ECONOMIC_POLICY.no_auto_payment,true);
});
