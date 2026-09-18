import test from "node:test";
import assert from "node:assert/strict";
import {buildExternalCall,executeExternalCall,loadRealWorldConnectors,realWorldBridgeSnapshot} from "../scripts/acorn-real-world-bridge.mjs";

test("real-world bridge blocks consequential effects without human authorization",()=>{
 const c={id:"stripe",provider:"stripe",base_url:"https://example.test/",effect:"MONEY",credential_env:"ACORN_TEST_SECRET"};
 const call=buildExternalCall({connector:c,path:"charges",method:"POST",body:{amount:1}});
 assert.equal(call.state,"BLOCKED"); assert.equal(call.reason,"HUMAN_AUTHORIZATION_REQUIRED");
 assert.equal("credential" in call,false);
});
test("real-world bridge requires configured credentials but never exposes them",()=>{
 process.env.ACORN_TEST_SECRET="secret";
 const c={id:"write-api",provider:"test",base_url:"https://example.test/",effect:"WRITE",credential_env:"ACORN_TEST_SECRET"};
 const call=buildExternalCall({connector:c,path:"write",method:"POST",body:{ok:true},human_authorized:true});
 assert.equal(call.state,"AUTHORIZED"); assert.equal(call.credential_present,true); assert.equal(call.credential_env,"ACORN_TEST_SECRET"); assert.equal(call.credential,"undefined"===typeof call.credential);
 delete process.env.ACORN_TEST_SECRET;
});
test("read connector can be measured and externally observed",async()=>{
 const c={id:"read-api",provider:"test",base_url:"https://example.test/",effect:"READ"};
 const call=buildExternalCall({connector:c,path:"health"});
 const result=await executeExternalCall(call,{fetchImpl:async()=>new Response(JSON.stringify({ok:true}),{status:200,headers:{"content-type":"application/json"}})});
 assert.equal(result.state,"SUCCEEDED"); assert.equal(result.external_effect,false); assert.ok(result.output_hash); assert.equal(result.evidence.origin,"external_http");
});
test("environment connector discovery is provider-neutral",()=>{
 const xs=loadRealWorldConnectors(JSON.stringify([{id:"a",provider:"future-provider",base_url:"https://example.test",effect:"READ",capabilities:["read"]}]));
 assert.equal(xs[0].provider,"future-provider");
 assert.equal(realWorldBridgeSnapshot(xs).policy.secret_custody,false);
});
