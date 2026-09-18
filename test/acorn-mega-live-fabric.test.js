import test from "node:test";
import assert from "node:assert/strict";
import {createIntelligence,measureIntelligence,routeIntelligence,createInvocation} from "../scripts/acorn-intelligence-fabric.mjs";
import {registerConnector,measureConnector,planConnectorExecution} from "../scripts/acorn-connector-registry.mjs";
import {buildRuntimePlan,verifyRuntimePlan} from "../scripts/acorn-runtime-orchestrator.mjs";
test("future intelligence is adapter-neutral and authority-free",()=>{
 const i=measureIntelligence(createIntelligence({id:"future-ai",provider:"future-provider",model:"future-model",capabilities:["reasoning"]}),{reachable:true});
 assert.equal(i.state,"READY"); assert.equal(i.authority,false); assert.equal(routeIntelligence({required_capabilities:["reasoning"]},{intelligences:[i]} )[0].id,"future-ai");
 assert.equal(createInvocation({id:"t"},i).state,"BLOCKED");
});
test("connector registry measures capability without granting authority",()=>{
 const c=measureConnector(registerConnector({id:"crm",provider:"example",kind:"crm",capabilities:["customer.read"]}),{reachable:true});
 assert.equal(c.state,"READY"); assert.equal(c.secret_custody,false);
 assert.equal(planConnectorExecution({task:{id:"t"},connector:c}).state,"BLOCKED");
});
test("runtime plan is automatically auditable but not automatically consequential",()=>{
 const i=measureIntelligence(createIntelligence({id:"ai",provider:"x",model:"m",capabilities:["reasoning"]}),{reachable:true});
 const c=measureConnector(registerConnector({id:"conn",provider:"x",kind:"api",capabilities:["customer.read"]}),{reachable:true});
 const p=buildRuntimePlan({requestId:"r1",problem:"complex problem",intelligences:[i],connectors:[c],requiredCapabilities:["reasoning"]});
 assert.equal(verifyRuntimePlan(p).ready,true); assert.equal(p.authority.human_required,true); assert.equal(p.authority.auto_spend,false);
});
