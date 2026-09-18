import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExternalCall,
  executeExternalCall,
  loadRealWorldConnectors,
  realWorldBridgeSnapshot,
  grantServerAuthority,
  isServerAuthority,
  CONSEQUENTIAL_EFFECTS,
} from "../scripts/acorn-real-world-bridge.mjs";

test("real-world bridge blocks consequential effects without human authorization",()=>{
 const c={id:"stripe",provider:"stripe",base_url:"https://example.test/",effect:"MONEY",credential_env:"ACORN_TEST_SECRET"};
 const call=buildExternalCall({connector:c,path:"charges",method:"POST",body:{amount:1}});
 assert.equal(call.state,"BLOCKED"); assert.equal(call.reason,"HUMAN_AUTHORIZATION_REQUIRED");
 assert.equal("credential" in call,false);
});

test("real-world bridge requires configured credentials but never exposes them",()=>{
 process.env.ACORN_TEST_SECRET="secret";
 const c={id:"write-api",provider:"test",base_url:"https://example.test/",effect:"WRITE",credential_env:"ACORN_TEST_SECRET"};
 const spoof=buildExternalCall({connector:c,path:"write",method:"POST",body:{ok:true},human_authorized:true});
 assert.equal(spoof.state,"BLOCKED");
 assert.equal(spoof.reason,"HUMAN_AUTHORIZATION_REQUIRED");
 assert.equal(spoof.client_authorization_ignored,true);
 const forged=buildExternalCall({connector:c,path:"write",method:"POST",body:{ok:true},authority:{source:"server",actor:"carl"}});
 assert.equal(forged.state,"BLOCKED");
 assert.equal(isServerAuthority({source:"server",actor:"carl"}),false);
 const call=buildExternalCall({connector:c,path:"write",method:"POST",body:{ok:true},authority:grantServerAuthority({actor:"carl"})});
 assert.equal(call.state,"AUTHORIZED"); assert.equal(call.credential_present,true); assert.equal(call.credential_env,"ACORN_TEST_SECRET"); assert.equal("credential" in call,false);
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
 assert.equal(realWorldBridgeSnapshot(xs).policy.http_cannot_grant_authority,true);
});

test("WRITE MONEY PUBLISH SIGN DELETE MERGE stay locked without a server grant",()=>{
  for (const effect of CONSEQUENTIAL_EFFECTS) {
    const call=buildExternalCall({
      connector:{id:effect.toLowerCase(),provider:"test",base_url:"https://example.test/",effect},
      path:"act",
      method:"POST",
      human_authorized:true,
      authority:{source:"server",actor:"carl"},
      source:"http",
    });
    assert.equal(call.state,"BLOCKED",effect);
    assert.equal(call.reason,"HUMAN_AUTHORIZATION_REQUIRED",effect);
    assert.equal(call.human_authorized,false,effect);
  }
});

test("client path method and base_url cannot escape the configured connector",()=>{
  const c={id:"read-api",provider:"test",base_url:"https://example.test/api/",effect:"READ"};
  const absolute=buildExternalCall({connector:c,path:"https://evil.example/steal",method:"GET"});
  assert.equal(absolute.state,"BLOCKED");
  assert.equal(absolute.reason,"URL_OUT_OF_SCOPE");
  const proto=buildExternalCall({connector:c,path:"//169.254.169.254/latest/meta-data",method:"GET"});
  assert.equal(proto.state,"BLOCKED");
  assert.equal(proto.reason,"URL_OUT_OF_SCOPE");
  const escape=buildExternalCall({connector:c,path:"../admin",method:"GET"});
  assert.equal(escape.state,"BLOCKED");
  assert.equal(escape.reason,"URL_OUT_OF_SCOPE");
  const loopback=buildExternalCall({connector:{...c,base_url:"https://127.0.0.1/"},path:"secrets",method:"GET"});
  assert.equal(loopback.state,"BLOCKED");
  assert.equal(loopback.reason,"URL_OUT_OF_SCOPE");
  const writeMethod=buildExternalCall({connector:c,path:"health",method:"POST"});
  assert.equal(writeMethod.state,"BLOCKED");
  assert.equal(writeMethod.reason,"METHOD_NOT_ALLOWED");
  const ok=buildExternalCall({connector:c,path:"health",method:"GET"});
  assert.equal(ok.state,"AUTHORIZED");
  assert.equal(ok.url,"https://example.test/api/health");
});

test("unsafe or unauthorized connectors never load from the environment",()=>{
  const xs=loadRealWorldConnectors(JSON.stringify([
    {id:"local",provider:"test",base_url:"http://127.0.0.1/",effect:"READ"},
    {id:"meta",provider:"test",base_url:"https://169.254.169.254/",effect:"READ"},
    {id:"ok",provider:"test",base_url:"https://example.test/",effect:"READ"},
  ]));
  assert.deepEqual(xs.map((x)=>x.id),["ok"]);
});
