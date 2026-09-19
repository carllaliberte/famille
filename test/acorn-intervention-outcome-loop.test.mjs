import test from "node:test";import assert from "node:assert/strict";import {recordInterventionOutcome,evaluateInterventionOutcome,buildInterventionLearning} from "../scripts/acorn-intervention-outcome-loop.mjs";
test("verified evidence closes an outcome",()=>assert.equal(recordInterventionOutcome({before:{x:1},after:{x:3},evidence:[{measured:true,verified:true}]}).state,"VERIFIED_OUTCOME"));
test("targets remain reviewable",()=>assert.equal(evaluateInterventionOutcome({outcome:{measured:true,verified:true,after:{x:3},delta:{x:2}},targets:{x:4}}).decision,"RETAIN_OR_REVIEW"));
test("learning requires verified outcomes",()=>assert.equal(buildInterventionLearning({outcomes:[{state:"VERIFIED_OUTCOME"}]}).verified_outcomes,1));
