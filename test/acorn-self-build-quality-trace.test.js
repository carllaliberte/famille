import test from "node:test";
import assert from "node:assert/strict";
import { registerQualified } from "../scripts/acorn-self-build.mjs";

test("qualified self-build output carries an Acorn quality trace", () => {
  const result = registerQualified({
    id:"project-1",
    capability:"customer-project",
    version:"1",
    source_revision:"abc123",
    lifecycle:"VERIFIED",
    tests:["unit"],
    security_verified:true,
  }, {
    evidence:[{
      id:"ev-1",
      claim:"project_verified",
      status:"VERIFIED",
      valid_until:"2026-12-31",
    }]
  });
  assert.equal(result.registered,true);
  assert.equal(result.quality_trace.mark,"ACORN_ENGINEERED");
  assert.equal(result.quality_trace.quality_assured,true);
  assert.equal(result.quality_trace.source_revision,"abc123");
});
