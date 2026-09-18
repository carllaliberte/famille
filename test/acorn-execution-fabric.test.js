import test from "node:test";
import assert from "node:assert/strict";
import {createTask,taskGraph,nextRunnableTasks,startTask,completeTask,buildExecutionPlan,runSyntheticExecution,guardExecutionEffect} from "../scripts/acorn-execution-fabric.mjs";

test("execution fabric creates dependency-aware graph",()=>{
 const a=createTask({projectId:"p",kind:"A",title:"A"});
 const b=createTask({projectId:"p",kind:"B",title:"B",dependsOn:[a.id]});
 const g=taskGraph([a,b]);
 assert.equal(g.find(x=>x.id===a.id).state,"READY");
 assert.equal(g.find(x=>x.id===b.id).state,"PLANNED");
 assert.equal(nextRunnableTasks(g).length,1);
});
test("execution requires human authorization",()=>{
 const t=startTask(createTask({projectId:"p",kind:"A",title:"A"}),{authorized:false});
 assert.equal(t.state,"BLOCKED");
});
test("authorized task can complete only from RUNNING",()=>{
 let t=startTask(createTask({projectId:"p",kind:"A",title:"A"}),{authorized:true});
 t=completeTask(t,{success:true,output:{ok:true},evidenceIds:["e1"]});
 assert.equal(t.state,"SUCCEEDED");
});
test("synthetic cycle remains blocked without authority and runs when authorized",()=>{
 const blocked=runSyntheticExecution({projectId:"p",authorized:false});
 assert.equal(blocked.state,"AWAITING_AUTHORIZATION");
 assert.equal(blocked.snapshot.completion,0);
 const run=runSyntheticExecution({projectId:"p",authorized:true});
 assert.equal(run.snapshot.completion,1);
 assert.equal(run.snapshot.tasks.succeeded,3);
});
test("forbidden effects cannot be silently executed",()=>{
 assert.throws(()=>guardExecutionEffect("AUTO_SPEND"),/FORBIDDEN_AUTOMATIC_EFFECT/);
});
