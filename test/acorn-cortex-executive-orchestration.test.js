import test from "node:test"; import assert from "node:assert/strict";
import {synthesizeSituation,prioritizeSignals,buildActionPortfolio,buildCortexCycle,assertCortexExecutiveConstitution} from "../scripts/acorn-cortex-executive-orchestration.mjs";
test("cortex synthesizes the environment",()=>{const s=synthesizeSituation({signals:[{type:"NEED",state:"OBSERVED"}]});assert.equal(s.state,"OBSERVED");});
test("cortex prioritizes signals",()=>{const p=prioritizeSignals({signals:[{id:"a",impact:2,urgency:2},{id:"b",impact:1,urgency:1}]});assert.equal(p[0].id,"a");});
test("portfolio stays proposed",()=>{const p=buildActionPortfolio({prioritized:[{id:"a",priority:4}]});assert.equal(p[0].requires_human_authorization,true);assert.equal(p[0].auto_execute,false);});
test("full cycle is composable",()=>{const c=buildCortexCycle({signals:[{id:"n",type:"NEED",impact:2,urgency:3}],objectives:[],capabilities:[],knowledge:[]});assert.equal(c.cycle.includes("LEARN"),true);});
test("constitution blocks autonomy escalation",()=>{assert.equal(assertCortexExecutiveConstitution(),true);assert.throws(()=>assertCortexExecutiveConstitution({auto_execute:true}),/EXECUTION/);assert.throws(()=>assertCortexExecutiveConstitution({breaker_touched:true}),/BREAKER/);});
