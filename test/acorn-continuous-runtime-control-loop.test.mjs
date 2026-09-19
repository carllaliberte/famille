import test from "node:test";import assert from "node:assert/strict";
import {assessRuntimeState,detectRuntimeDrift,scheduleRuntimeCycle} from "../scripts/acorn-continuous-runtime-control-loop.mjs";
test("runtime state remains evidence bounded",()=>assert.equal(assessRuntimeState({runs:[{status:"SUCCEEDED"}]}).successful_runs,0));
test("drift is measured without causal overclaim",()=>assert.equal(detectRuntimeDrift({baseline:{successful_runs:1},current:{successful_runs:2}}).state,"DRIFT_MEASURED"));
test("continuous cycle preserves human gate",()=>assert.equal(scheduleRuntimeCycle({}).requires_human_gate,true));
