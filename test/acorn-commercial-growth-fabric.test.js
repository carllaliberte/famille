import test from "node:test"; import assert from "node:assert/strict";
import {discoverOpportunity,qualifyOpportunity,createOfferCandidate,createDistributionPlan,marketplaceMatch,companyCandidate,growthSnapshot} from "../scripts/acorn-commercial-growth-fabric.mjs";
test("discovery becomes qualified only with explicit measured criteria",()=>{const o=qualifyOpportunity(discoverOpportunity({problem:"complex workflow"}),{solvable:true,payable:true,repeatable:true});assert.equal(o.state,"QUALIFIED")});
test("offer preserves human publication gate",()=>{const o=createOfferCandidate({opportunity:{id:"o"},solution:"turnkey"});assert.equal(o.human_publish_required,true)});
test("distribution and company remain proposals",()=>{const o=createOfferCandidate({opportunity:{id:"o"},solution:"x"});const d=createDistributionPlan({offer:o,subscription:true});const c=companyCandidate({validatedProblem:"p",offer:o,distribution:d});assert.equal(c.auto_incorporation,false)});
test("marketplace matches by capability without granting authority",()=>{const m=marketplaceMatch({problem:"p",requirements:["analysis"],providers:[{id:"a",capabilities:["analysis"]}]});assert.equal(m.matches[0].coverage,1);assert.equal(m.contract_required,true)});
test("growth snapshot is measured state",()=>{assert.equal(growthSnapshot({opportunities:[1],offers:[1]}).opportunities,1)});
