import test from "node:test";
import assert from "node:assert/strict";
import {protocolEnvelope,negotiateProtocol,validateMessage,routeByProtocol,assertProtocolConstitution} from "../scripts/acorn-universal-cognitive-protocol.mjs";
import {runUniversalCognitiveProtocol} from "../scripts/acorn-universal-cognitive-protocol-conductor.mjs";

test("creates canonical protocol envelopes",()=>{const e=protocolEnvelope({type:"STATE",payload:{x:1},source:"cortex"});assert.equal(e.authority,false);assert.equal(validateMessage(e).valid,true)});
test("negotiates shared schema and version",()=>{const n=negotiateProtocol({local:{schemas:["STATE","TASK"],versions:["1"],capabilities:["x"]},remote:{schemas:["STATE"],versions:["1"],capabilities:["y"]}});assert.equal(n.compatible,true);assert.deepEqual(n.shared_schemas,["STATE"])});
test("rejects malformed messages",()=>{assert.equal(validateMessage({type:"STATE"}).valid,false)});
test("routes through compatible adapters only",()=>{const e=protocolEnvelope({type:"CAPABILITY",source:"mesh"});const r=routeByProtocol({message:e,adapters:[{id:"a",capabilities:["cap"]}],required_capability:"cap"});assert.equal(r.state,"ROUTED")});
test("conductor keeps governance boundaries",()=>{const r=runUniversalCognitiveProtocol({messages:[{type:"TASK",payload:{id:"1"},source:"cortex"}],local:{schemas:["TASK"],versions:["1"]},remote:{schemas:["TASK"],versions:["1"]}});assert.equal(r.constitution.valid,true);assert.equal(r.auto_execute,false)});
test("constitution rejects authority and breaker bypass",()=>{const r=assertProtocolConstitution({authority:true,breaker_bypass:true});assert.equal(r.valid,false);assert.deepEqual(r.violations,["AUTHORITY_ESCALATION","BREAKER_BYPASS"])});
