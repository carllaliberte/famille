import test from "node:test";
import assert from "node:assert/strict";
import { CYCLE, perceiveWorld, contextualizeWorld, optimizeCortex, runCortexCycle, assertCortexConstitution } from "../scripts/acorn-cortex-final-integration.mjs";

const intel=[
  {identity:"reasoner",provider:"future-a",capabilities:["reasoning"],evidence:["e1"]},
  {identity:"coder",provider:"future-b",capabilities:["coding"],evidence:["e2"]}
];

test("canonical Cortex cycle is complete and ordered",()=>{
  assert.equal(CYCLE.length,15);
  assert.deepEqual(CYCLE.slice(0,5),["PERCEIVE","CONTEXTUALIZE","REMEMBER","DISCOVER","COMPOSE"]);
  assert.deepEqual(CYCLE.slice(-5),["VERIFY","LEARN","OPTIMIZE","REUSE","REOBSERVE"]);
});

test("perception produces dated provenance-first state and surfaces conflicts",()=>{
  const p=perceiveWorld([
    {id:"a",kind:"temperature",value:20,source:"sensor",evidence:["e1"]},
    {id:"a",kind:"temperature",value:21,source:"sensor-2",evidence:["e2"]}
  ]);
  assert.equal(p.state,"OBSERVED");
  assert.equal(p.conflicts.state,"CONFLICTS_FOUND");
  assert.equal(p.live,false);
  assert.equal(p.authority,false);
});

test("contextualization does not silently resolve conflicting observations",()=>{
  const p=perceiveWorld([{id:"x",kind:"fact",value:"a"},{id:"x",kind:"fact",value:"b"}]);
  const c=contextualizeWorld(p,{context:{mission:"test"}});
  assert.equal(c.state,"CONTEXT_CONFLICT");
  assert.equal(c.conflicts.conflicts.length,1);
});

test("optimization is blocked without measured verified evidence",()=>{
  const r=optimizeCortex({outcome:{id:"o",metrics:[{quality:1}],evidence:[],measured:false,verified:false},capability:{id:"c"}});
  assert.equal(r.learning.learning.state,"LEARNING_BLOCKED");
  assert.equal(r.optimization.state,"OPTIMIZATION_BLOCKED");
});

test("full cycle composes perception, mission, memory and bounded action without authority",()=>{
  const r=runCortexCycle({
    goal:"solve",
    required_capabilities:["reasoning","coding"],
    participants:intel,
    steps:["reason","code"],
    signals:[{id:"s1",kind:"request",value:"solve",source:"user",evidence:["e1"]}],
    action:{actor:"cortex",capability:"coding",intent:"prepare solution",proposal:"bounded proposal"},
    authorization:{authorized:false,source:"HUMAN_GATE"}
  });
  assert.equal(r.state,"CYCLE_BUILT");
  assert.equal(r.action.authorized.status,"DENIED");
  assert.equal(r.authority,false);
  assert.equal(r.breaker_touched,false);
  assert.equal(r.external_effect,false);
});

test("measured verified outcome can enter learning and reuse",()=>{
  const r=runCortexCycle({
    goal:"solve",
    required_capabilities:["reasoning"],
    participants:[intel[0]],
    signals:[{id:"s1",kind:"request",value:"solve"}],
    action:{actor:"cortex",capability:"reasoning",intent:"reason",proposal:"bounded reasoning"},
    authorization:{authorized:true,source:"human"},
    execution:{executor:"bounded-test"},
    observation:{success:true,actualOutcome:"ok",evidence:[{id:"ev1",status:"MEASURED",measured:true,verified:true,evidence:["proof"]}],metrics:[{quality:1}],verified:true}
  });
  assert.equal(r.action.learned.status,"LEARNED");
  assert.equal(r.optimization.optimization.state,"OPTIMIZATION_CANDIDATE");
  assert.equal(r.reuse.state,"REUSE_ELIGIBLE");
  assert.equal(r.authority,false);
});

test("constitution rejects authority, breaker, automatic authorization, execution and hidden learning",()=>{
  assert.doesNotThrow(()=>assertCortexConstitution({authority:false,breaker_touched:false,auto_authorize:false,auto_execute:false,external_effect:false,hidden_learning:false}));
  assert.throws(()=>assertCortexConstitution({authority:true}),/AUTHORITY/);
  assert.throws(()=>assertCortexConstitution({breaker_touched:true}),/BREAKER/);
  assert.throws(()=>assertCortexConstitution({auto_authorize:true}),/AUTHORIZATION/);
  assert.throws(()=>assertCortexConstitution({auto_execute:true}),/EXECUTION/);
  assert.throws(()=>assertCortexConstitution({hidden_learning:true}),/LEARNING/);
});
