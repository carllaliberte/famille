import test from "node:test";
import assert from "node:assert/strict";
import {createBusinessCase,qualifyBusinessCase,designBusinessSolution,createBusinessOffer,authorizeBusinessOffer,buildBusinessExecution,recordBusinessExecution,verifyBusinessDelivery,acceptBusinessDelivery,measureBusinessValue,captureBusinessAsset,productizeBusinessAsset,businessReadiness,buildBusinessCommandCenter} from "../scripts/acorn-business-operating-system.mjs";
test("business OS carries one case from problem to reusable product",()=>{
 const c=qualifyBusinessCase(createBusinessCase({customer:"ACME",problem:"Complex workflow"}),{capabilities:["automation"],fit:"FIT",risk:"MEASURED"});
 const s=designBusinessSolution(c,{solution:"Turnkey workflow",deliverables:["system","handoff"],acceptanceCriteria:["tests"],implementationPlan:["build","verify"]});
 const o=createBusinessOffer(s,{price:25000,scope:["build","handoff"]});
 const a=authorizeBusinessOffer(o,{humanAuthorized:true,authorizedBy:"carl"});
 const e=buildBusinessExecution(a,{tasks:[{id:"t1",effect:"READ"}],intelligences:["adaptive"],connectors:["provider-neutral"]});
 const x=recordBusinessExecution(e,{results:[{task_id:"t1",status:"SUCCESS"}],evidence:[{status:"MEASURED"}]});
 const d=verifyBusinessDelivery({execution:x,access:true,documentation:true,training:true,usageRights:true,evidence:[{status:"MEASURED"}]});
 const accepted=acceptBusinessDelivery(d,{humanAccepted:true,acceptedBy:"carl"});
 const v=measureBusinessValue({acceptedDelivery:accepted,value:{customer_value:50000},evidence:[{status:"MEASURED"}]});
 const asset=captureBusinessAsset(v,{assetPattern:"workflow-template"});
 const product=productizeBusinessAsset(asset,{name:"Turnkey Workflow",problemClass:"WORKFLOW",deliverables:["implementation"]});
 assert.equal(product.state,"PRODUCT_CANDIDATE");
 assert.equal(businessReadiness({businessCase:c,solution:s,offer:a,execution:e,delivery:d,value:v}).ready,true);
 const center=buildBusinessCommandCenter({cases:[c],offers:[a],executions:[e],deliveries:[d,accepted],values:[v],assets:[asset],products:[product]});
 assert.equal(center.funnel.products,1);
});
test("authority and evidence gates remain hard",()=>{
 const c=createBusinessCase({customer:"X",problem:"Y"}); const s=qualifyBusinessCase(c);
 assert.equal(authorizeBusinessOffer({state:"OFFER_READY",id:"o"}).state,"AWAITING_HUMAN_AUTHORIZATION");
 assert.equal(buildBusinessExecution({state:"OFFER_READY",id:"o"}).state,"BLOCKED");
 const d=verifyBusinessDelivery({execution:{state:"EXECUTED",id:"e"},access:true,documentation:true,training:true,usageRights:true,evidence:[]});
 assert.equal(d.state,"DELIVERY_BLOCKED");
 assert.equal(businessReadiness({businessCase:c,solution:s}).ready,false);
});
