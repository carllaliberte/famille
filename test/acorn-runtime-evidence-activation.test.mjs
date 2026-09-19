import test from "node:test";import assert from "node:assert/strict";
import {collectRuntimeEvidence,activateMeasuredCapability} from "../scripts/acorn-runtime-evidence-activation.mjs";
import {runRuntimeActivation} from "../scripts/acorn-runtime-activation-conductor.mjs";
test("runtime evidence requires measured verified evidence",()=>assert.equal(collectRuntimeEvidence({runs:[{status:"SUCCEEDED"}]}).state,"RUNTIME_EVIDENCE_GAP"));
test("activation candidate needs real connector and outcome evidence",()=>assert.equal(activateMeasuredCapability({capability:{measured:true,verified:true,evidence:"c"},connector:{state:"LIVE_VERIFIED",evidence:"l"},outcome:{measured:true,verified:true,evidence:"o"}}).state,"ACTIVATION_CANDIDATE"));
test("conductor preserves human gate",()=>assert.equal(runRuntimeActivation({}).human_gate,true));
