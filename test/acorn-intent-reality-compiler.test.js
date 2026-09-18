import test from "node:test";
import assert from "node:assert/strict";
import { compileHumanIntent, compileProject, recordReality, closeAndLearn, compileIntentToReality } from "../scripts/acorn-intent-reality-compiler.mjs";

const future="2099-01-01T00:00:00.000Z";
const cap=(id,quality=90)=>({id,tags:["robotics","automation"],provider:id,method:"measured",measured_at:"2026-09-18T12:00:00.000Z",valid_until:future,metrics:{quality},evidence:["proof:"+id],constraints:[],reusable:true});

test("human intent compiles into a discovered capability set",()=>{
  const r=compileHumanIntent({intent:"automate robotics operations",requirements:["robotics"],capabilities:[cap("a",90),cap("b",95)]});
  assert.equal(r.state,"DISCOVERED"); assert.equal(r.discovered.length,2); assert.equal(r.authority,"human");
});

test("capability gap is explicit instead of invented",()=>{
  const r=compileHumanIntent({intent:"quantum ocean mining",requirements:["unknown"],capabilities:[]});
  assert.equal(r.state,"DISCOVERED"); assert.equal(r.reason,"CAPABILITY_GAP"); assert.equal(r.discovered.length,0);
});

test("project compilation never bypasses composition proof",()=>{
  const r=compileProject({intent:"automation",requirements:["robotics"],capabilities:[cap("a")],evidence:[]});
  assert.equal(r.state,"HUMAN_HOLD"); assert.equal(r.reason,"COMPOSITION_NOT_PROVEN");
});

test("reality is measured only from an actual execution record",()=>{
  const r=recordReality({project:{id:"p1"},execution:{id:"x1",state:"OBSERVED"},evidence:[{id:"e1",valid_until:future}],measurements:[{metric:"success",value:1}],customerValidation:{validated:true}});
  assert.equal(r.state,"MEASURED"); assert.equal(r.reality.nodes.length,3);
});

test("measured reality can become reusable capability and adaptation signal",()=>{
  const r=closeAndLearn({
    project:{id:"p1"},outcome:{id:"o1"},capabilities:[cap("a")],rights:["CUSTOMER_LICENSE"],
    evidence:[{id:"e1",valid_until:future}],marketSignals:[{id:"m1",observed_at:future,evidence:["m"]}]
  });
  assert.equal(r.state,"CAPABILITY_DERIVED"); assert.equal(r.reuse.state,"REUSABLE"); assert.equal(r.adaptation.changes.length,1);
});

test("compiler preserves human authority",()=>{
  const r=compileIntentToReality({intent:"build",requirements:[],capabilities:[]});
  assert.equal(r.authority,"human"); assert.equal(r.auto_merge,false);
});
