import test from "node:test";
import assert from "node:assert/strict";
import {
  createActionRequest,authorizeAction,beginAction,observeAction,
  measureActionOutcome,learnActionOutcome,assertActionOutcomeConstitution,
  createExecutionTrace
} from "../scripts/acorn-cortex-action-outcome-fabric.mjs";

const base={
  actor:"planner",capability:"analysis",intent:"improve project",
  proposal:"analyze measured outcome",expectedOutcome:{target:"quality"}
};

test("constitution forbids authority and breaker access",()=>assert.equal(assertActionOutcomeConstitution({authority:false,breaker_touched:false}),true));
test("proposal is not execution",()=>assert.equal(createActionRequest(base).status,"PROPOSED"));
test("capability without authorization is denied",()=>{
  const a=authorizeAction(createActionRequest(base),{authorized:false});
  assert.equal(a.status,"DENIED");
  assert.equal(a.authority,false);
});
test("authorized action can enter execution",()=>{
  const a=beginAction(authorizeAction(createActionRequest(base),{authorized:true,source:"human"}));
  assert.equal(a.status,"EXECUTING");
});
test("execution without evidence remains observed",()=>{
  const a=beginAction(authorizeAction(createActionRequest(base),{authorized:true}));
  assert.equal(observeAction(a,{success:true,actualOutcome:{quality:1}}).status,"OBSERVED");
});
test("measured outcome requires verification evidence",()=>{
  const a=beginAction(authorizeAction(createActionRequest(base),{authorized:true}));
  const o=observeAction(a,{success:true,actualOutcome:{quality:1},evidence:["ev-1"]});
  assert.equal(measureActionOutcome(o,{verified:true}).status,"MEASURED");
});
test("measured outcome can produce a traceable learning candidate",()=>{
  const a=beginAction(authorizeAction(createActionRequest(base),{authorized:true}));
  const o=observeAction(a,{success:true,actualOutcome:{quality:1},evidence:["ev-1"]});
  const m=measureActionOutcome(o,{verified:true});
  const l=learnActionOutcome(m,{capability:{id:"analysis"}});
  assert.equal(l.status,"LEARNED");
  assert.equal(l.learning.state,"LEARNED");
  assert.equal(l.capability_revision.authority,"UNCHANGED");
});
test("execution trace never performs an external effect",()=>{
  const a=authorizeAction(createActionRequest(base),{authorized:true});
  const trace=createExecutionTrace(a,{authorized:true});
  assert.equal(trace.external_effect,false);
  assert.equal(trace.authority,false);
  assert.equal(trace.task.state,"RUNNING");
});
