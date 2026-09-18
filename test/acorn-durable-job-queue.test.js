import test from "node:test";
import assert from "node:assert/strict";
import {createJob,claimJob,succeedJob,failJob,blockJob,cancelJob,queueSnapshot} from "../scripts/acorn-durable-job-queue.mjs";
test("job lifecycle is explicit",()=>{let j=createJob({tenantId:"t",kind:"CONNECTOR_READ"});j=claimJob(j,{workerId:"w"});j=succeedJob(j,{result:{ok:true},evidence:["e1"]});assert.equal(j.state,"SUCCEEDED");assert.equal(j.authority,false)});
test("bounded retry",()=>{let j=createJob({tenantId:"t",kind:"x",maxAttempts:1});j=claimJob(j,{workerId:"w"});j=failJob(j,{error:"x"});assert.equal(j.state,"FAILED")});
test("blocked and cancelled remain explicit",()=>{const j=createJob({tenantId:"t",kind:"x"});assert.equal(blockJob(j,{reason:"HUMAN_AUTHORIZATION_REQUIRED"}).state,"BLOCKED");assert.equal(cancelJob(j).state,"CANCELLED")});
test("snapshot measures states",()=>{const j=createJob({tenantId:"t",kind:"x"});assert.equal(queueSnapshot([j]).queued,1)});
