import test from "node:test";
import assert from "node:assert/strict";
import { deliveryGate, acceptanceGate, expansionRecord } from "../scripts/acorn-delivery-gate.mjs";
test("delivery requires proof and complete handoff",()=>{
 const g=deliveryGate({verification:{verified:true},access:["portal"],documentation:["handoff"],training:["training"],usage_rights:["PERPETUAL_USE"]});
 assert.equal(g.ready,true); assert.equal(g.stage,"READY_TO_DELIVER");
});
test("acceptance remains human",()=>{
 const g=acceptanceGate({delivered:true,accepted:true,accepted_by:"human",evidence:["e1"]});
 assert.equal(g.accepted,true); assert.equal(g.stage,"CUSTOMER_ACCEPTANCE");
});
test("expansion is recommendation only",()=>{
 const r=expansionRecord({customer_id:"c1",signals:["repeat_demand"]});
 assert.equal(r.recommendation_only,true); assert.equal(r.human_authorization_required,true);
});
