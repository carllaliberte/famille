import test from"node:test";import assert from"node:assert/strict";import{classifyOpenWork,buildConvergencePortfolio}from"../scripts/acorn-open-work-convergence.mjs";
test("stale useful work is reconstructed",()=>assert.equal(classifyOpenWork({number:917,body:"divergent capability security runtime"}).recommendation,"RECONSTRUCT_ON_MAIN"));
test("stale useless work is deferred",()=>assert.equal(classifyOpenWork({number:1,body:"divergent stale"}).recommendation,"DEFER"));
test("current useful work is audited",()=>assert.equal(classifyOpenWork({number:2,body:"capability"}).recommendation,"AUDIT_CURRENT"));
test("portfolio never auto merges",()=>assert.equal(buildConvergencePortfolio([]).auto_merge,false));