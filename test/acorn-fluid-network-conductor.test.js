
import test from "node:test";
import assert from "node:assert/strict";
import {conduct,optimizeFluidContinuously} from "../scripts/acorn-fluid-network-conductor.mjs";
import {registerSubstrate} from "../scripts/acorn-api-optional-fluid-cognition.mjs";

test("whole network can conduct through native substrate with no API",()=>{
 const s=registerSubstrate({id:"local-brain",kind:"IN_PROCESS",capabilities:["reasoning"]});
 const r=conduct({task_id:"t",capability:"reasoning",substrates:[s],connectors:[]});
 assert.equal(r.flow.api_required,false);
 assert.equal(r.api_prerequisite,false);
 assert.equal(r.debug,true);
 assert.equal(r.breaker_touched,false);
});
test("continuous optimization measures without granting authority",()=>{
 const s=registerSubstrate({id:"local",kind:"LOCAL_PROCESS",capabilities:["x"]});
 const r=conduct({task_id:"t2",capability:"x",substrates:[s]});
 const o=optimizeFluidContinuously(r,{measurements:{local:{latency_ms:3,reliability:.99}}});
 assert.equal(o.paths[0].observed_latency_ms,3);
 assert.equal(o.authority,false);
 assert.equal(o.breaker_touched,false);
});
