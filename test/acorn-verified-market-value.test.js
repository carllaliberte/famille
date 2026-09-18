import test from "node:test";import assert from "node:assert/strict";
import {qualifyDemand,qualifyOffer,chooseVerifiedOpportunities,measureUnitEconomics,rankVerifiedValue,createCommercialDecision} from "../scripts/acorn-verified-market-value.mjs";
test("unverified demand stays exploratory",()=>assert.equal(qualifyDemand({verified:false,evidence:[]}).state,"EXPLORATORY"));
test("verified demand requires evidence",()=>assert.equal(qualifyDemand({verified:true,evidence:["e"]}).state,"EVIDENCE_BACKED"));
test("verified boolean alone cannot verify offer",()=>assert.equal(qualifyOffer({verified:true,evidence:[]}).state,"UNVERIFIED"));
test("opportunities require verified evidence",()=>assert.deepEqual(chooseVerifiedOpportunities([{id:"a",verified:false,evidence:["e"]},{id:"b",verified:true,evidence:["e"]}]).map(x=>x.id),["b"]));
test("unit economics are measured only from numbers",()=>{const r=measureUnitEconomics({revenue:100,cost:40});assert.equal(r.margin,60);assert.equal(r.margin_rate,.6)});
test("value ranking excludes unsupported candidates",()=>assert.equal(rankVerifiedValue([{id:"a",verified:true,evidence:["e"],value:100,cost:10},{id:"b",verified:true,evidence:[],value:100,cost:1}])[0].id,"a"));
test("commercial decisions stay human gated",()=>{const r=createCommercialDecision({verified:true,evidence:["e"]});assert.equal(r.state,"WAITING_HUMAN");assert.equal(r.auto_spend,false);assert.equal(r.auto_contract,false);});