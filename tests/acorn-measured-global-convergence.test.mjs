import test from "node:test";
import assert from "node:assert/strict";
import { measureArchitecture, convergenceVerdict } from "../scripts/acorn-measured-global-convergence.mjs";

test("measured convergence exposes gaps instead of inventing completion",()=>{
  const s=measureArchitecture({root:process.cwd(),contracts:["01-demo"],runtime:[],evidence:[]});
  assert.equal(s.state,"GAPS_MEASURED");
  assert.ok(s.missing.some(x=>x.kind==="IMPLEMENTATION"));
  assert.equal(s.completion,"NEVER_ASSUMED");
});
test("constitution rejects authority and execution escalation",()=>{
  const s=convergenceVerdict({authority:true,auto_execute:true,missing:[]});
  assert.equal(s.valid,false);
  assert.ok(s.violations.includes("AUTHORITY_ESCALATION"));
  assert.ok(s.violations.includes("AUTO_EXECUTION"));
});