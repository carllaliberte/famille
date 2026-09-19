import test from "node:test";
import assert from "node:assert/strict";
import {
  createHypothesis,createStateSpace,updateBeliefs,applyInterference,
  collapseStateSpace,entropy,informationGain,assertComputationConstitution
} from "../scripts/acorn-cognitive-computation-engine.mjs";
import { runCognitiveComputation } from "../scripts/acorn-cognitive-computation-conductor.mjs";

test("normalizes and preserves a bounded hypothesis space",()=>{
  const s=createStateSpace({hypotheses:[
    createHypothesis({id:"a",label:"A",prior:2}),
    createHypothesis({id:"b",label:"B",prior:1})
  ]});
  assert.equal(Number(s.states.reduce((a,x)=>a+x.probability,0).toFixed(6)),1);
  assert.ok(s.entropy>0);
});

test("belief update changes probability only through supplied likelihoods",()=>{
  const s=createStateSpace({hypotheses:[
    createHypothesis({id:"a",prior:1}),createHypothesis({id:"b",prior:1})
  ]});
  const u=updateBeliefs({space:s,likelihoods:{a:4,b:1},evidence:{id:"e1"}});
  assert.ok(u.states.find(x=>x.id==="a").probability>u.states.find(x=>x.id==="b").probability);
  assert.equal(u.measured,true);
});

test("interference is explicit and bounded",()=>{
  const s=createStateSpace({hypotheses:[
    createHypothesis({id:"a",prior:1}),createHypothesis({id:"b",prior:1})
  ]});
  const i=applyInterference({space:s,relations:[{from:"a",to:"b",kind:"CONTRADICTION",strength:.25}]});
  assert.equal(Number(i.states.reduce((a,x)=>a+x.probability,0).toFixed(6)),1);
});

test("collapse requires an explicit operation and can remain unverified",()=>{
  const s=createStateSpace({hypotheses:[
    createHypothesis({id:"a",prior:3}),createHypothesis({id:"b",prior:1})
  ]});
  const c=collapseStateSpace({space:s,observation:{source:"test"}});
  assert.equal(c.collapsed,true);
  assert.equal(c.verified,false);
  assert.equal(c.states.filter(x=>x.probability===1).length,1);
});

test("information gain is measured from entropy reduction",()=>{
  const a=createStateSpace({hypotheses:[
    createHypothesis({id:"a",prior:1}),createHypothesis({id:"b",prior:1})
  ]});
  const b=collapseStateSpace({space:a,observation:{id:"e"},verification:true});
  assert.ok(informationGain(a,b)>0);
});

test("conductor composes the complete cognitive computation loop",()=>{
  const r=runCognitiveComputation({
    task:{id:"t",simulation_steps:2},
    hypotheses:[createHypothesis({id:"a",prior:2}),createHypothesis({id:"b",prior:1})],
    likelihoods:{a:2,b:1},evidence:{id:"e"},verification:true,
    relations:[{from:"a",to:"b",kind:"SUPPORT",strength:.1}],
    strategies:[{id:"classic",paradigm:"CLASSICAL"}],
    benchmarks:{classic:{quality:.9,reliability:.9,cost:1}}
  });
  assert.equal(r.constitution.valid,true);
  assert.equal(r.authority,false);
  assert.equal(r.live,false);
  assert.equal(r.snapshot.quantum_inspired,true);
  assert.equal(r.snapshot.physical_quantum,false);
});

test("constitution rejects authority and fake physical claims",()=>{
  const r=assertComputationConstitution({authority:true,physical_quantum_claim:true});
  assert.equal(r.valid,false);
  assert.deepEqual(r.violations,["AUTHORITY_ESCALATION","UNPROVEN_PHYSICAL_QUANTUM"]);
});
