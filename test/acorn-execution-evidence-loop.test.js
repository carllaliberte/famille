import test from "node:test";
import assert from "node:assert/strict";
import {createExecutionRun,executeRun,closeExecutionRun,executionLoopSnapshot} from "../scripts/acorn-execution-evidence-loop.mjs";
test("end-to-end loop blocks consequential execution without human authorization",async()=>{
 const run=createExecutionRun({requestId:"r",plan:{id:"p",routes:{intelligences:[],connectors:[]}},authorized:false});
 const done=await executeRun(run);
 assert.equal(done.state,"BLOCKED"); assert.equal(done.external_effect,false);
});
test("authorized orchestration records measured evidence without claiming external effect",async()=>{
 const run=createExecutionRun({requestId:"r",plan:{id:"p",routes:{intelligences:[{id:"ai",provider:"x",score:1}],connectors:[{id:"api",provider:"x",score:1}]}},authorized:true});
 const done=await executeRun(run,{intelligenceAdapters:{ai:async()=>({ok:true})},connectorAdapters:{api:async()=>({ok:true})}});
 assert.equal(done.state,"VERIFYING"); assert.equal(done.evidence.length,2);
 const closed=closeExecutionRun(done,{project_id:"p",realized_revenue:0,measured_value:100,currency:"CAD"});
 assert.equal(closed.state,"COMPLETED"); assert.equal(closed.value.evidence_verified,true); assert.equal(closed.proof.external_effect,false);
 assert.equal(executionLoopSnapshot(closed).authority,false);
});
