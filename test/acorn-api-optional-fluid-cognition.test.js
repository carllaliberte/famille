
import test from "node:test";
import assert from "node:assert/strict";
import {registerSubstrate,createCognitivePacket,discoverFluidPaths,chooseFluidPath,negotiateIntercompanyLink,composeCapabilityFlow,flowWithoutApi,fluidCognitionSnapshot,assertFluidConstitution} from "../scripts/acorn-api-optional-fluid-cognition.mjs";

test("native substrate carries cognition without an API",async()=>{
 const s=registerSubstrate({id:"mind",kind:"IN_PROCESS",capabilities:["reasoning"]});
 const p=createCognitivePacket({task_id:"t1",capability:"reasoning"});
 const flow=composeCapabilityFlow({packet:p,paths:discoverFluidPaths(p,{substrates:[s]})});
 const r=await flowWithoutApi(flow,{executor:async()=>({ok:true,value:"done"})});
 assert.equal(r.state,"FLOWING"); assert.equal(r.api_required,false);
});
test("API is fallback, not prerequisite",()=>{
 const s=registerSubstrate({id:"remote",kind:"API",capabilities:["reasoning"]});
 const p=createCognitivePacket({task_id:"t2",capability:"reasoning"});
 const flow=composeCapabilityFlow({packet:p,paths:discoverFluidPaths(p,{substrates:[s]})});
 assert.equal(flow.api_required,true); assert.equal(flow.api_fallback,true);
});
test("native path wins over API path",()=>{
 const a=registerSubstrate({id:"local",kind:"LOCAL_PROCESS",capabilities:["vision"]});
 const b=registerSubstrate({id:"remote",kind:"API",capabilities:["vision"]});
 const p=createCognitivePacket({task_id:"t3",capability:"vision"});
 assert.equal(chooseFluidPath(discoverFluidPaths(p,{substrates:[b,a]})).kind,"LOCAL_PROCESS");
});
test("inter-company link aligns incentives without authority transfer",()=>{
 const l=negotiateIntercompanyLink({parties:["acorn","partner"],capabilities:["compute","settlement"],value_exchange:["usage","revenue_share"]});
 assert.equal(l.status,"NEGOTIATION_TEMPLATE"); assert.equal(l.no_lock_in,true); assert.equal(l.no_transfer_of_authority,true); assert.equal(l.human_signature_required,true);
});
test("constitution protects Breaker and API independence",()=>{
 assert.equal(assertFluidConstitution({api_prerequisite:false,breaker_touched:false}),true);
 assert.throws(()=>assertFluidConstitution({api_prerequisite:true,breaker_touched:false}),/API_MUST_NOT/);
 assert.throws(()=>assertFluidConstitution({api_prerequisite:false,breaker_touched:true}),/BREAKER/);
});
test("snapshot is explicit about API optionality",()=>{
 const s=fluidCognitionSnapshot({substrates:[registerSubstrate({id:"a",kind:"IN_PROCESS",capabilities:["x"]}),registerSubstrate({id:"b",kind:"API",capabilities:["x"]})]});
 assert.equal(s.api_optional,true); assert.equal(s.api_prerequisite,false); assert.equal(s.breaker_touched,false);
});
