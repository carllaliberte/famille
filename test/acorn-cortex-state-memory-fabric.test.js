import test from "node:test";
import assert from "node:assert/strict";
import {
  createStateRecord,buildStateSnapshot,detectStateConflicts,
  createOutcomeMemory,buildCortexMemoryCycle,assertStateMemoryConstitution
} from "../scripts/acorn-cortex-state-memory-fabric.mjs";

test("builds temporal snapshot and excludes expired state",()=>{
  const records=[
    createStateRecord({id:"a",kind:"CAPABILITY",value:"reasoning"}),
    createStateRecord({id:"old",kind:"CAPABILITY",value:"stale",valid_until:"2000-01-01T00:00:00Z"})
  ];
  const s=buildStateSnapshot(records,Date.parse("2026-09-19T00:00:00Z"));
  assert.equal(s.records.length,1);
  assert.equal(s.by_kind.CAPABILITY[0].value,"reasoning");
  assert.equal(s.authority,false);
});

test("detects contradictory observations instead of silently choosing one",()=>{
  const a=createStateRecord({id:"x",kind:"WORLD",value:"A"});
  const b=createStateRecord({id:"x",kind:"WORLD",value:"B"});
  assert.equal(detectStateConflicts([a,b]).state,"CONFLICTS_FOUND");
});

test("outcome memory only becomes reusable after measured verified evidence",()=>{
  const blocked=createOutcomeMemory({id:"o",verified:false,measured:false});
  assert.equal(blocked.reusable,false);
  const valid=createOutcomeMemory({id:"o",verified:true,measured:true,evidence:["e1"]});
  assert.equal(valid.reusable,true);
});

test("integrates mission, state and outcome without authority escalation",()=>{
  const result=buildCortexMemoryCycle({
    mission:{goal:"solve",required_capabilities:[],participants:[]},
    records:[createStateRecord({id:"r1",kind:"CONTEXT",value:"known"})],
    outcome:{id:"o1",verified:true,measured:true,evidence:["e1"],metrics:{quality:1}}
  });
  assert.equal(result.memory.authority,false);
  assert.equal(result.memory.live,false);
  assert.equal(result.next_state,"REUSE_ELIGIBLE");
  assertStateMemoryConstitution(result.memory);
});

test("constitution rejects authority or live claims",()=>{
  assert.throws(()=>assertStateMemoryConstitution({authority:true}),/MEMORY_CANNOT_GRANT_AUTHORITY/);
  assert.throws(()=>assertStateMemoryConstitution({live:true}),/MEMORY_CANNOT_CLAIM_LIVE/);
});
