import test from "node:test";import assert from "node:assert/strict";
import {analyzeSemanticGraph,blastRadius,rankCriticalPaths} from "../scripts/acorn-semantic-critical-path-engine.mjs";
const nodes=[{id:"a"},{id:"b"},{id:"c"}],edges=[{from:"a",to:"b"},{from:"b",to:"c"}];
test("measures graph depth and roots",()=>{const x=analyzeSemanticGraph({nodes,edges});assert.equal(x.depth.a,2);assert.deepEqual(x.roots,["a"]);assert.deepEqual(x.leaves,["c"])});
test("measures reachable blast radius",()=>assert.equal(blastRadius({root:"a",nodes,edges}).blast_radius,2));
test("evidence bounds priority",()=>assert.equal(rankCriticalPaths({analysis:{central_nodes:[{id:"a",depth:2}]},evidenceByNode:{}})[0].priority,0));
