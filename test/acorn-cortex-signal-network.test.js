import test from "node:test"; import assert from "node:assert/strict";
import {createSignal,qualifySignal,routeSignals,correlateSignals,generateResponseCandidates,recordSignalOutcome,learnSignalPattern,assertSignalConstitution} from "../scripts/acorn-cortex-signal-network.mjs";
test("signals are typed",()=>{const s=createSignal({type:"NEED",source:"customer"});assert.equal(s.state,"OBSERVED");});
test("signals qualify",()=>{const s=qualifySignal(createSignal({type:"SUCCESS",source:"x",evidence:["e"]}),{minimum_evidence:1});assert.equal(s.state,"QUALIFIED");});
test("cortex routes relevant signals",()=>{const a=qualifySignal(createSignal({type:"RISK",source:"a",priority:1}));const b=qualifySignal(createSignal({type:"OPPORTUNITY",source:"b",priority:1}));assert.equal(routeSignals({signals:[a,b],interests:["OPPORTUNITY"]})[0].type,"OPPORTUNITY");});
test("cortex correlates signals",()=>{const a=createSignal({type:"NEED",source:"a",payload:{topic:"x"}});const b=createSignal({type:"CAPABILITY",source:"b",payload:{topic:"x"}});assert.equal(correlateSignals({signals:[a,b]})[0].strength,2);});
test("responses remain proposals",()=>{const r=generateResponseCandidates({correlations:[{topic:"x",strength:2}],capabilities:[{topic:"x"}]})[0];assert.equal(r.state,"PROPOSED");assert.equal(r.requires_validation,true);});
test("outcomes become learning",()=>{const o=recordSignalOutcome({signal_id:"s",outcome:"SUCCESS",evidence:["e"]});assert.equal(learnSignalPattern({outcomes:[o]}).state,"LEARNED");});
test("constitution protects autonomy",()=>{assert.equal(assertSignalConstitution(),true);assert.throws(()=>assertSignalConstitution({breaker_touched:true}),/BREAKER/);assert.throws(()=>assertSignalConstitution({auto_action:true}),/AUTOMATICALLY/);});
