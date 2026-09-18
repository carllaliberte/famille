import test from "node:test";import assert from "node:assert/strict";
import {recordEpisode,extractLessons,validateLesson,recall,consolidate,forgetExpired,assertOperationalMemoryConstitution} from "../scripts/acorn-operational-memory-cortex.mjs";
test("records real episode",()=>{const e=recordEpisode({actor:"acorn",goal:"g",outcomes:["ok"],evidence:["e"]});assert.equal(e.state,"RECORDED");});
test("lessons require validation",()=>{const e=recordEpisode({actor:"a",goal:"g",evidence:["e"]});const l=extractLessons({episode:e,lessons:["l"]})[0];assert.equal(l.requires_validation,true);assert.equal(validateLesson(l).state,"VERIFIED");});
test("recall retrieves relevant knowledge",()=>{const e=recordEpisode({actor:"a",goal:"build network"});assert.equal(recall({episodes:[e],goal:"network"}).results.length,1);});
test("consolidates verified lessons",()=>{const x=validateLesson({lesson:"reuse",evidence:["e"],state:"PROVISIONAL"});assert.equal(consolidate({lessons:[x]}).verified_lessons,1);});
test("expiry is explicit",()=>{assert.equal(forgetExpired([{expires_at:"2000-01-01T00:00:00Z",state:"VERIFIED"}])[0].state,"EXPIRED");});
test("memory never becomes authority",()=>{assert.equal(assertOperationalMemoryConstitution(),true);assert.throws(()=>assertOperationalMemoryConstitution({breaker_touched:true}),/BREAKER/);assert.throws(()=>assertOperationalMemoryConstitution({hidden_memory:true}),/TRACEABLE/);});
