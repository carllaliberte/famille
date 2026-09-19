import test from "node:test";
import assert from "node:assert/strict";
import {
  conductMission,
  assertMissionConstitution
} from "../scripts/acorn-cortex-mission-conductor.mjs";

const participants=[
  {identity:"reasoner-A",provider:"provider-A",capabilities:["reasoning"],evidence:["e1"]},
  {identity:"coder-B",provider:"provider-B",capabilities:["coding"],evidence:["e2"]}
];

test("conductMission composes a provider-neutral cognitive mission",()=>{
  const r=conductMission({
    goal:"build a verified solution",
    required_capabilities:["reasoning","coding"],
    participants,
    steps:["reason","implement","verify"]
  });
  assert.equal(r.state,"MISSION_COMPOSABLE");
  assert.deepEqual(r.team.assignments.map(x=>x.capability),["reasoning","coding"]);
  assert.equal(r.plan.auto_execute,false);
  assert.equal(r.external_effect,false);
  assert.equal(r.authority,false);
  assert.equal(r.breaker_touched,false);
  assert.equal(r.learning_boundary,"OUTCOMES_MUST_BE_MEASURED_AND_VERIFIED_BEFORE_LEARNING");
});

test("capability gaps remain explicit",()=>{
  const r=conductMission({
    goal:"solve",
    required_capabilities:["reasoning","vision"],
    participants,
  });
  assert.equal(r.state,"CAPABILITY_GAP");
  assert.deepEqual(r.composition.gaps,["vision"]);
});

test("action planning creates trace without external effect",()=>{
  const r=conductMission({
    goal:"propose a bounded action",
    required_capabilities:["coding"],
    participants,
    action:{
      actor:"cortex",
      capability:"coding",
      intent:"prepare change",
      proposal:"create a patch"
    }
  });
  assert.equal(r.action.status,"PROPOSED");
  assert.equal(r.execution_trace.external_effect,false);
  assert.equal(r.execution_trace.authority,false);
});

test("constitution forbids authority or effect escalation",()=>{
  assert.equal(assertMissionConstitution({
    authority:false,
    breaker_touched:false,
    external_effect:false,
    auto_authorize:false,
    auto_execute:false,
    learning_boundary:"OUTCOMES_MUST_BE_MEASURED_AND_VERIFIED_BEFORE_LEARNING"
  }),true);
  assert.throws(()=>assertMissionConstitution({authority:true}),/CANNOT_GRANT_AUTHORITY/);
  assert.throws(()=>assertMissionConstitution({external_effect:true}),/MUST_NOT_PERFORM_EXTERNAL_EFFECT/);
});
