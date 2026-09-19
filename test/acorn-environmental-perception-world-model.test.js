import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSignal, perceiveEnvironment, createWorldEntity, buildWorldModel, mergeWorldObservations, worldModelGaps, assertEnvironmentalPerceptionConstitution, CONTRACT } from "../scripts/acorn-environmental-perception-world-model.mjs";

test("contract and normalized perception preserve provenance",()=>{
 const x=normalizeSignal({id:"s1",source:"github",kind:"BUILD",value:{status:"success"},evidence:["run-1"]});
 assert.equal(CONTRACT,"acorn.environmental-perception-world-model.v1");
 assert.equal(x.state,"NORMALIZED"); assert.equal(x.record.authority,false);
 assert.equal(x.provenance.source,"github");
});
test("conflicting observations remain visible",()=>{
 const x=perceiveEnvironment([{id:"same",kind:"STATE",source:"a",value:1},{id:"same",kind:"STATE",source:"b",value:2}]);
 assert.equal(x.state,"CONFLICT"); assert.equal(x.conflicts.conflicts.length,1);
});
test("world model composes entities and only valid relations",()=>{
 const a=createWorldEntity({id:"p1",type:"PERSON"});
 const b=createWorldEntity({id:"c1",type:"PROJECT"});
 const m=buildWorldModel({signals:[{id:"s",source:"test",value:"observed"}],entities:[a,b],relations:[{id:"r",from:"p1",to:"c1",type:"OWNS"},{id:"bad",from:"p1",to:"missing"}]});
 assert.equal(m.entities.length,2); assert.equal(m.relations.length,1); assert.equal(m.coverage.signals,1);
});
test("merge preserves newest records without granting authority",()=>{
 const a=buildWorldModel({entities:[{id:"x",type:"SERVICE",name:"old"}]});
 const b=buildWorldModel({entities:[{id:"x",type:"SERVICE",name:"new"}]});
 const m=mergeWorldObservations(a,b);
 assert.equal(m.entities[0].name,"new"); assert.equal(m.authority,false);
});
test("gaps are explicit rather than invented",()=>{
 const g=worldModelGaps({perception:{records:[],conflicts:{conflicts:[]}},entities:[],relations:[]});
 assert.deepEqual(g.gaps,["NO_ENVIRONMENT_OBSERVATIONS","NO_WORLD_ENTITIES"]);
});
test("constitution blocks authority, LIVE and execution claims",()=>{
 assert.throws(()=>assertEnvironmentalPerceptionConstitution({authority:true}),/AUTHORITY/);
 assert.throws(()=>assertEnvironmentalPerceptionConstitution({live:true}),/LIVE/);
 assert.throws(()=>assertEnvironmentalPerceptionConstitution({external_effect:true}),/EXECUTE/);
 assert.equal(assertEnvironmentalPerceptionConstitution({}),true);
});
