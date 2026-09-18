import test from "node:test";
import assert from "node:assert/strict";
import {stateRecord,eventRecord,evidenceRecord,assertTenantAccess,stateSnapshot} from "../scripts/acorn-enterprise-state.mjs";
import {registerEvidence,evidenceIsCurrent,proofGate} from "../scripts/acorn-evidence-registry.mjs";
import {createConnectorExecutor,executeConnector} from "../scripts/acorn-connector-execution-fabric.mjs";
test("state model is typed and tenant bounded",()=>{const r=stateRecord("PROJECT",{tenant_id:"t1",data:{name:"x"}});assert.equal(r.entity,"PROJECT");assert.doesNotThrow(()=>assertTenantAccess(r,"t1"));assert.throws(()=>assertTenantAccess(r,"t2"),/TENANT_ISOLATION/);assert.equal(stateSnapshot([r]).count,1)});
test("evidence requires strength and margin",()=>{const e=evidenceRecord({claim:"x",source:"test",strength:1,margin:.1});assert.equal(e.status,"MEASURED");assert.equal(evidenceIsCurrent(e),true);assert.equal(proofGate({evidence:[e]}).ready,true)});
test("event carries provenance and authority",()=>{const e=eventRecord({tenantId:"t",entityId:"p",type:"CREATED"});assert.equal(e.authority,"none")});
test("connector execution is blocked without human authorization",async()=>{const x=createConnectorExecutor({connection:{id:"c"},execute:async()=>({ok:true})});assert.equal((await executeConnector(x,{task:{},authorized:false})).state,"BLOCKED");assert.equal((await executeConnector(x,{task:{},authorized:true})).state,"SUCCEEDED")});
