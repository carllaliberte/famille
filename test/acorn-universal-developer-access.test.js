import test from "node:test";
import assert from "node:assert/strict";
import {
  DEVELOPER_ECOSYSTEMS,seedDeveloperCatalog,discoverDeveloperSurfaces,
  chooseDeveloperRoute,registerFutureDeveloperSurface,redactDeveloperAccess,snapshotDeveloperAccess
} from "../scripts/acorn-universal-developer-access.mjs";

test("catalog spans major developer ecosystems without granting authority",()=>{
  const catalog=seedDeveloperCatalog();
  assert.ok(DEVELOPER_ECOSYSTEMS.length>=25);
  assert.ok(catalog.length>100);
  assert.equal(catalog.every(x=>x.authority===false),true);
  assert.equal(catalog.every(x=>x.auth.secret_material_present===false),true);
});

test("free-first routing prefers explicit free access over paid access",()=>{
  const candidates=[
    {id:"paid",provider:"x",capability:"inference",access_class:"PAID",state:"MEASURED",economics:{cost:1}},
    {id:"free",provider:"y",capability:"inference",access_class:"FREE_PERMANENT",state:"DISCOVERED",economics:{cost:0}}
  ];
  assert.equal(chooseDeveloperRoute({candidates,requirements:["inference"]}).selected.id,"free");
});

test("unknown future surfaces remain discoverable but untrusted",()=>{
  const future=registerFutureDeveloperSurface({provider:"future-ai",name:"quantum-agent",capabilities:["reasoning"]});
  assert.equal(future.state,"DISCOVERED");
  assert.equal(future.metadata.future_compatible,true);
  assert.equal(future.authority,false);
});

test("runtime discovery extends catalog without replacing provider neutrality",()=>{
  const found=discoverDeveloperSurfaces({surfaces:[{provider:"newco",capability:"new_tool",access_class:"FREE_TRIAL"}]});
  assert.ok(found.some(x=>x.provider==="newco"&&x.capability==="new_tool"));
});

test("redaction never exposes secret material",()=>{
  const x=redactDeveloperAccess({id:"x",auth:{key:"SECRET",secret_material_present:true},authority:true});
  assert.equal(x.auth.secret_material_present,false);
  assert.equal(x.authority,false);
});

test("snapshot is measured, not a live claim",()=>{
  const s=snapshotDeveloperAccess({access:seedDeveloperCatalog({providers:["openai","google"]})});
  assert.ok(s.total>0);
  assert.equal(s.authority,false);
  assert.equal(typeof s.measured_at,"string");
});
