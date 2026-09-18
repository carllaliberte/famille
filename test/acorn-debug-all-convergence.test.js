import test from "node:test"; import assert from "node:assert/strict";
import {classifyOpenWork,buildConvergencePlan,assertDebugConstitution} from "../scripts/acorn-debug-all-convergence.mjs";
test("diverged work is marked for recovery",()=>{const x=classifyOpenWork([{number:1,base_sha:"old",main_sha:"new"}])[0];assert.equal(x.classification,"DIVERGED");assert.equal(x.action,"RECOVER_OR_REBASE");});
test("current work is tested",()=>{const x=classifyOpenWork([{number:1,base_sha:"new",main_sha:"new"}])[0];assert.equal(x.action,"TEST");});
test("plan preserves main as reality",()=>{const p=buildConvergencePlan({main_sha:"new",open_prs:[]});assert.equal(p.main_sha,"new");});
test("constitution protects Breaker and merge authority",()=>{assert.equal(assertDebugConstitution(),true);assert.throws(()=>assertDebugConstitution({breaker_touched:true}),/BREAKER/);assert.throws(()=>assertDebugConstitution({auto_merge:true}),/MERGE/);assert.throws(()=>assertDebugConstitution({main_overridden:true}),/MAIN/);});
