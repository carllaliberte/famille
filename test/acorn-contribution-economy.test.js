import test from "node:test";
import assert from "node:assert/strict";
import {registerContributor,measureContribution,allocateRevenue,buildContributionSettlement,economyPolicy} from "../scripts/acorn-contribution-economy.mjs";

test("any verified intelligence can contribute without provider privilege",()=>{
 const c=registerContributor({id:"model-x",provider:"future-provider",capabilities:["reasoning"],proof:{verified:true}});
 assert.equal(c.state,"ELIGIBLE_PENDING_MEASUREMENT");
 assert.equal(c.authority,"NONE");
 assert.equal(c.capability_only,true);
 assert.equal(economyPolicy().provider_neutral,true);
});
test("contribution reward follows measured verified value",()=>{
 const a=measureContribution({contributorId:"a",usage:100,successfulOperations:90,verifiedOutcomes:80,quality:.9,reliability:.9,reproducibility:.9});
 const b=measureContribution({contributorId:"b",usage:10,successfulOperations:10,verifiedOutcomes:9,quality:.8,reliability:.8,reproducibility:.8});
 const out=allocateRevenue({grossRevenue:1000,contributions:[a,b]});
 assert.equal(out.contributor_pool,350);
 assert.equal(out.owner_share,650);
 assert.equal(out.allocations.length,2);
 assert.ok(Math.abs(out.total_allocated-350)<1e-9);
});
test("unverified payment rail cannot be reported as settled",()=>{
 const c=buildContributionSettlement({allocation:{contributor_id:"a",amount:10},paymentRail:{verified:false}});
 assert.equal(c.state,"HOLD_HUMAN");
 assert.equal(c.verified,false);
 assert.equal(c.custody,false);
});
