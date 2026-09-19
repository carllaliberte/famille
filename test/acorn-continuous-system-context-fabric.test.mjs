import test from "node:test";import assert from "node:assert/strict";import {buildSystemContext,selectContextForTask,buildContextDelta} from "../scripts/acorn-continuous-system-context-fabric.mjs";
const now="2026-01-01T01:00:00Z";
test("context selects latest state",()=>{const x=buildSystemContext({events:[{id:"1",entity_id:"a",value:1,timestamp:"2026-01-01T00:00:00Z"},{id:"2",entity_id:"a",value:2,timestamp:"2026-01-01T00:30:00Z"}],now});assert.equal(x.current[0].value,2)});
test("task context exposes missing and stale state",()=>{const x=selectContextForTask({context:{current:[{entity_id:"a",fresh:false}]},task:{required_entities:["a","b"]}});assert.deepEqual(x.missing,["b"]);assert.deepEqual(x.stale,["a"])});
test("context delta measures changes",()=>assert.deepEqual(buildContextDelta({before:{current:[{entity_id:"a",v:1}]},after:{current:[{entity_id:"a",v:2},{entity_id:"b"}]}}),{changed:["a","b"],added:["b"],removed:[],authority:false}));
