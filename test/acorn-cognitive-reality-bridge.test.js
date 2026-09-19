import test from "node:test";
import assert from "node:assert/strict";
import {buildRealityBridge,routeRealityToCortex,selectNextObservation,assertRealityBridgeConstitution} from "../scripts/acorn-cognitive-reality-bridge.mjs";

test("bridge preserves non-live state without physical proof",()=>{const b=buildRealityBridge({connector_id:"github",capability:"read_repository",observation:{observed:true}});assert.equal(b.live,false);assert.equal(b.authority,false);assert.equal(b.state,"OBSERVED");});
test("bridge carries verified connector observation into reality and world model",()=>{const b=buildRealityBridge({connector_id:"gmail",capability:"read_mail",source:"gmail",observation:{physically_observed:true,authenticated:true,usable:true,evidence:[{at:"2026-09-19T00:00:00Z"}]}});assert.equal(b.live,true);assert.equal(b.reality.counts.observations,1);assert.equal(b.world.authority,false);});
test("cortex routing requires connectivity verification",()=>{const b=buildRealityBridge({connector_id:"drive",capability:"read_files",observation:{physically_observed:true,authenticated:true,usable:true,evidence:[1]}});assert.equal(routeRealityToCortex(b,{connectivity:{state:"CONNECTED",live:true}}).ok,false);assert.equal(routeRealityToCortex(b,{connectivity:{state:"LIVE_VERIFIED",live:true},nervous:{signal_id:"n1"}}).ok,true);});
test("bridge chooses explicit re-observation when gaps exist",()=>{const b=buildRealityBridge({connector_id:"x",capability:"read",observation:{observed:true}});const n=selectNextObservation(b);assert.equal(n.action,"REOBSERVE_GAPS");assert.equal(n.auto_execute,false);});
test("constitution prevents bypass",()=>{assert.equal(assertRealityBridgeConstitution({bypass_connectivity:true}).valid,false);assert.equal(assertRealityBridgeConstitution({}).valid,true);});
