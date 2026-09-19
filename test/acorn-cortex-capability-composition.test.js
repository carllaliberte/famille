import test from "node:test";
import assert from "node:assert/strict";
import { intelligenceAdapter, qualifyIntelligence, selectRoute } from "../scripts/acorn-cortex-intelligence-adapter.mjs";
import { composeCapabilityTeam, selectTeam, buildCognitivePlan, assertCapabilityCompositionConstitution } from "../scripts/acorn-cortex-capability-composition.mjs";

const intel=[
  qualifyIntelligence(intelligenceAdapter({identity:"reasoner",provider:"future-a",capabilities:["reasoning"],evidence:["e1"]}),{required_capabilities:["reasoning"],min_evidence:1}),
  qualifyIntelligence(intelligenceAdapter({identity:"coder",provider:"future-b",capabilities:["coding"],evidence:["e2"]}),{required_capabilities:["coding"],min_evidence:1})
];

test("composes multiple provider-neutral intelligences by capability",()=>{
  const team=composeCapabilityTeam({goal:"solve",required_capabilities:["reasoning","coding"],intelligences:intel,min_evidence:1});
  assert.equal(team.complete,true);
  assert.equal(team.assignments.length,2);
});

test("composition exposes capability gaps instead of inventing coverage",()=>{
  const team=composeCapabilityTeam({goal:"solve",required_capabilities:["reasoning","vision"],intelligences:intel,min_evidence:1});
  assert.deepEqual(team.gaps,["vision"]);
  assert.equal(team.complete,false);
});

test("team selection remains explicit and authorized",()=>{
  const team=composeCapabilityTeam({goal:"solve",required_capabilities:["reasoning"],intelligences:intel,min_evidence:1});
  const selected=selectTeam(team);
  assert.equal(selected.state,"TEAM_SELECTED");
  assert.equal(selected.requires_authorization,true);
  assert.equal(selected.authority,false);
});

test("cognitive plan is a proposal, not execution",()=>{
  const team=composeCapabilityTeam({goal:"solve",required_capabilities:["reasoning"],intelligences:intel,min_evidence:1});
  const plan=buildCognitivePlan({team,steps:["reason"]});
  assert.equal(plan.state,"PROPOSED");
  assert.equal(plan.auto_execute,false);
  assert.equal(plan.external_effect,false);
});

test("constitution blocks authority and effects",()=>{
  assert.doesNotThrow(()=>assertCapabilityCompositionConstitution({authority:false,breaker_touched:false,auto_authorize:false,auto_execute:false,external_effect:false}));
  assert.throws(()=>assertCapabilityCompositionConstitution({authority:true}),/CANNOT_GRANT_AUTHORITY/);
  assert.throws(()=>assertCapabilityCompositionConstitution({breaker_touched:true}),/BREAKER/);
  assert.throws(()=>assertCapabilityCompositionConstitution({auto_execute:true}),/AUTO_EXECUTION/);
});
