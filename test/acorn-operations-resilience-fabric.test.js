import test from "node:test";import assert from "node:assert/strict";
import {createSla,observeService,createIncident,resolveIncident,capacityPlan,resilienceSnapshot} from "../scripts/acorn-operations-resilience-fabric.mjs";
test("operations are measured",()=>{const o=observeService({service:"acorn",health:"READY",latencyMs:100});assert.equal(o.health,"READY")});
test("incident resolution carries evidence",()=>{let i=createIncident({service:"acorn"});i=resolveIncident(i,{resolution:"restored",evidence:["e1"]});assert.equal(i.state,"RESOLVED")});
test("capacity never grants scaling authority",()=>{const p=capacityPlan({resources:[{id:"r"}]});assert.equal(p.auto_scaling_authority,false)});
test("resilience snapshot exposes open incidents",()=>{const i=createIncident({service:"x"});assert.equal(resilienceSnapshot({incidents:[i]}).open_incidents,1)});
