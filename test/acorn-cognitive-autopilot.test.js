import test from "node:test";
import assert from "node:assert/strict";
import {buildCognitiveAutopilot,requestNextStep,assertCognitiveAutopilotConstitution} from "../scripts/acorn-cognitive-autopilot.mjs";

test("autopilot composes self-model, knowledge and optimization",()=>{const a=buildCognitiveAutopilot({capabilities:["read"],requirements:["write"],observations:[],errors:[{kind:"NO_EVIDENCE"}]});assert.ok(a.self);assert.ok(a.knowledge);assert.ok(a.optimization);assert.ok(a.selected);assert.equal(a.authority,false);});
test("autopilot can prepare an authorization request without authorizing",()=>{const a=buildCognitiveAutopilot({capabilities:["read"],requirements:["write"]});const r=requestNextStep(a);assert.equal(r.state,"AUTHORIZATION_REQUEST_CANDIDATE");assert.equal(r.request.requires_human_authorization,true);assert.equal(r.authority,false);});
test("candidate experiment is integrated without execution",()=>{const a=buildCognitiveAutopilot({candidate:{kind:"SYNAPSE",id:"s1"},baseline:{quality:.8}});assert.equal(a.experiment.state,"PLANNED");assert.equal(a.external_effect,false);});
test("no option means monitoring only",()=>{const a=buildCognitiveAutopilot({});assert.equal(a.state,"NEXT_STEP_SELECTED");});
test("constitution blocks authority and bypass",()=>{assert.equal(assertCognitiveAutopilotConstitution({authority:true}).valid,false);assert.equal(assertCognitiveAutopilotConstitution({breaker_bypass:true}).valid,false);assert.equal(assertCognitiveAutopilotConstitution({}).valid,true);});
