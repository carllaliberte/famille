import assert from "node:assert/strict";
import {buildGrowthSystem,assertGrowthSystemConstitution,summarizeGrowthSystem} from "../scripts/acorn-growth-system-integration.mjs";
const input={
 capabilities:[{id:"c1"},{id:"c2"},{id:"c3"}],
 connections:[{id:"x",verified:true}],
 verifiedOutcomes:[{measured:true,verified:true,evidence:["e"],learning:"reuse"}],
 reusableExpansions:[{id:"r1"}],
 experiments:[{id:"e1"}],
 unknowns:[{id:"u1"}],
 gaps:[{id:"g1"}],
 measurements:[{candidate_id:"compound-2-0-1",score:5,evidence:["e"],measured:true,verified:true}],
 outcomes:[{measured:true,verified:true,evidence:["e"],learning:"L"}],
 budget:10,maxBatch:5
};
const r=buildGrowthSystem(input);
assert.equal(r.authority,false); assert.equal(r.auto_execute,false);
assert.equal(r.integration.single_growth_loop,true);
assert.ok(r.unified_frontier.size>0);
assert.equal(assertGrowthSystemConstitution({auto_execute:true}).valid,false);
assert.equal(summarizeGrowthSystem(r).live,false);
