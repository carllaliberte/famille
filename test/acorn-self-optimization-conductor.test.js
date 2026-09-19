import test from "node:test";
import assert from "node:assert/strict";
import {buildOptimizationCycle,proposeAdoption,assertSelfOptimizationConstitution} from "../scripts/acorn-self-optimization-conductor.mjs";

test("conductor composes the existing cognitive fabrics",()=>{const c=buildOptimizationCycle({capability:"knowledge"});assert.equal(c.contract,"acorn.self-optimization-conductor.v1");assert.ok(c.knowledge&&c.learning&&c.synaptic&&c.metabolism);});
test("optimization produces candidates, not authority",()=>{const c=buildOptimizationCycle({capability:"knowledge"});assert.equal(c.authority,false);assert.equal(c.auto_execute,false);assert.equal(c.adoption,"CANDIDATE_ONLY");});
test("adoption remains blocked until simulation, retest and reverification",()=>{const c=buildOptimizationCycle({capability:"knowledge"});const p=proposeAdoption(c);assert.equal(p.state,"HOLD_FOR_VALIDATION");const q=proposeAdoption(c,{simulation_passed:true,retest_passed:true,reverified:true});assert.equal(q.state,"ADOPTION_CANDIDATE");assert.equal(q.human_authorization_required,true);assert.equal(q.auto_adopt,false);});
test("constitution rejects autonomous consequential behavior",()=>{assert.equal(assertSelfOptimizationConstitution({auto_adopt:true}).valid,false);assert.equal(assertSelfOptimizationConstitution({auto_spend:true}).valid,false);assert.equal(assertSelfOptimizationConstitution({skip_retest:true}).valid,false);assert.equal(assertSelfOptimizationConstitution({}).valid,true);});
