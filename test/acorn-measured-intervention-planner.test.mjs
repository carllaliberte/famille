import test from "node:test";import assert from "node:assert/strict";
import {identifyInterventions,buildInterventionPlan,compareInterventionPlans} from "../scripts/acorn-measured-intervention-planner.mjs";
test("interventions derive from measured gaps",()=>assert.equal(identifyInterventions({gaps:["x"]}).interventions.length,1));
test("plans require rollback and human authorization",()=>{const p=buildInterventionPlan({});assert.equal(p.rollback_required,true);assert.equal(p.requires_human_authorization,true)});
test("plan comparison does not auto-select",()=>assert.equal(compareInterventionPlans({plans:[{id:"a"}]}).selection,"HUMAN_OR_MEASURED_GATE"));
