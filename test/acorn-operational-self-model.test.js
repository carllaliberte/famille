import test from "node:test";
import assert from "node:assert/strict";
import {createOperationalSelfModel,diagnoseSelf,updateOperationalSelfModel,planSelfReobservation,assertOperationalSelfModelConstitution} from "../scripts/acorn-operational-self-model.mjs";

test("self model records measured evidence",()=>{const m=createOperationalSelfModel({capabilities:["read"],outcomes:[{measured:true,verified:true}]});assert.equal(m.evidence.verified_outcomes,1);assert.equal(m.authority,false);});
test("diagnosis exposes missing capabilities and limitations",()=>{const d=diagnoseSelf({model:{capabilities:["read"]},requirements:["read","write"],observed_failures:[{kind:"STALE_DATA"}]});assert.deepEqual(d.missing,["write"]);assert.ok(d.gaps.includes("STALE_DATA"));});
test("update preserves uncertainty instead of hiding gaps",()=>{const m=createOperationalSelfModel({uncertainties:["old"]});const u=updateOperationalSelfModel(m,{gaps:["new"],limitations:[]});assert.ok(u.uncertainties.includes("new"));});
test("reobservation is a plan only",()=>{const p=planSelfReobservation({diagnosis:{gaps:["MISSING_EVIDENCE"]}});assert.equal(p.state,"REOBSERVE_LIMITS");assert.equal(p.auto_execute,false);});
test("constitution blocks authority and execution",()=>{assert.equal(assertOperationalSelfModelConstitution({authority:true}).valid,false);assert.equal(assertOperationalSelfModelConstitution({auto_execute:true}).valid,false);assert.equal(assertOperationalSelfModelConstitution({}).valid,true);});
