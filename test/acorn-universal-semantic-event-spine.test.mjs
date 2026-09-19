import test from "node:test";import assert from "node:assert/strict";import {createSemanticEvent,appendEvent,replayEvents,buildEventLineage} from "../scripts/acorn-universal-semantic-event-spine.mjs";
const e=createSemanticEvent({type:"OBSERVATION",payload:{x:1},source:"sensor",timestamp:"2026-01-01T00:00:00Z"});
test("events are deterministic and append idempotently",()=>{const a=appendEvent({log:[],event:e}),b=appendEvent({log:a.log,event:e});assert.equal(a.log.length,1);assert.equal(b.log.length,1);assert.equal(b.duplicate,true)});
test("events replay by time",()=>assert.equal(replayEvents({log:[e],from_timestamp:"2026-01-01T00:00:00Z"}).length,1));
test("lineage exposes unresolved causation",()=>{const x=createSemanticEvent({type:"OUTCOME",causation_id:"missing",source:"runtime"});assert.equal(buildEventLineage({log:[x]})[0].causation_resolved,false)});
