import test from "node:test";
import assert from "node:assert/strict";
import {buildDependencyGraph,analyzeCriticalPaths,calculateBlastRadius,analyzeCapabilityReuse,identifyEvidenceGaps,buildSystemIntelligence,assertSystemIntelligenceConstitution} from "../scripts/acorn-system-intelligence-layer.mjs";

test("maps dependencies and critical path",()=>{const nodes=[{id:"a"},{id:"b"},{id:"c"}],edges=[{from:"a",to:"b"},{from:"b",to:"c"}];assert.equal(buildDependencyGraph({nodes,edges})[2].depends_on[0],"b");assert.deepEqual(analyzeCriticalPaths({nodes,edges}).critical_nodes,["c"]);});
test("measures blast radius",()=>{const nodes=["a","b","c"].map(id=>({id})),edges=[{from:"a",to:"b"},{from:"b",to:"c"}];assert.equal(calculateBlastRadius({node_id:"a",nodes,edges}).blast_radius,2);});
test("detects capability reuse",()=>{const r=analyzeCapabilityReuse({capabilities:[{id:"x"},{id:"y"}],routes:[{id:"r",capabilities:["x"]},{id:"s",capabilities:["x"]}]});assert.equal(r.find(x=>x.id==="x").uses,2);assert.equal(r.find(x=>x.id==="y").underused,true);});
test("requires verified evidence",()=>{const gaps=identifyEvidenceGaps({claims:[{id:"c",evidence_ids:["e"]}],evidence:[{id:"e",measured:false,verified:true,evidence:["x"]}]});assert.equal(gaps[0].type,"UNSUPPORTED_CLAIM");});
test("system intelligence exposes gaps and never grants authority",()=>{const s=buildSystemIntelligence({forest:{nodes:[{id:"a"}],edges:[],gaps:[{id:"g"}]}});assert.equal(s.state,"INTELLIGENCE_GAPS_MEASURED");assert.equal(s.auto_execute,false);assert.equal(s.live,false);assert.doesNotThrow(()=>assertSystemIntelligenceConstitution(s));});
test("constitution rejects escalation",()=>assert.throws(()=>assertSystemIntelligenceConstitution({authority:"carl",auto_execute:true,auto_authorize:false,external_effect:false,live:false})));
