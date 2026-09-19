import test from "node:test";
import assert from "node:assert/strict";
import {createImprovementExperiment,runSimulation,compareWithObservation,retestAndReverify,assertSelfImprovementConstitution} from "../scripts/acorn-self-improvement-laboratory.mjs";

test("candidate becomes an experiment",()=>{const l=createImprovementExperiment({candidate:{kind:"SYNAPSE",id:"s1"},baseline:{quality:0.8}});assert.equal(l.state,"PLANNED");});
test("simulation has no external effect",()=>{let l=createImprovementExperiment({candidate:{kind:"SYNAPSE",id:"s1"}});l=runSimulation(l,{predicted:[{quality:0.9}]});assert.equal(l.state,"SIMULATED");assert.equal(l.external_effect,false);});
test("comparison alone cannot approve improvement",()=>{let l=createImprovementExperiment({candidate:{kind:"SYNAPSE",id:"s1"}});l=runSimulation(l,{predicted:[{quality:0.9}]});l=compareWithObservation(l,{observed:[{quality:0.9}],verified:true});assert.equal(l.state,"COMPARED");});
test("stable retest plus reverification creates only an adoption candidate",()=>{let l=createImprovementExperiment({candidate:{kind:"SYNAPSE",id:"s1"}});l=runSimulation(l,{predicted:[{quality:0.9}]});l=compareWithObservation(l,{observed:[{quality:0.9}],verified:true});l=retestAndReverify(l,{retest_observed:[{quality:0.9}],reverified:true});assert.equal(l.state,"ADOPTION_CANDIDATE");assert.equal(l.adoption.auto_adopt,false);assert.equal(l.authority,false);});
test("constitution blocks self-adoption and execution",()=>{assert.equal(assertSelfImprovementConstitution({auto_adopt:true}).valid,false);assert.equal(assertSelfImprovementConstitution({auto_execute:true}).valid,false);assert.equal(assertSelfImprovementConstitution({}).valid,true);});
