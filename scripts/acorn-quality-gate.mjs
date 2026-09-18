#!/usr/bin/env node
import fs from "node:fs";
import { REQUIRED_QUALITY_DIMENSIONS, VISIONARY_BENCHMARKS } from "./acorn-visionary-quality.mjs";
import { QUALITY_DIMENSIONS, QUALITY_INVARIANTS, ACORN_QUALITY_FABRIC_VERSION } from "./acorn-quality-fabric.mjs";

const failures=[];
const tracePath=".acorn/quality-trace.json";
const fabricPath=".acorn/quality-fabric.json";

if(!fs.existsSync(tracePath)) failures.push("QUALITY_TRACE_MISSING");
else {
  const trace=JSON.parse(fs.readFileSync(tracePath,"utf8"));
  if(trace.contract!=="acorn.quality-trace.v1") failures.push("QUALITY_TRACE_CONTRACT_MISMATCH");
  if(trace.expiry_required!==true) failures.push("QUALITY_TRACE_EXPIRY_REQUIREMENT_MISSING");
  if(trace.auto_merge===true) failures.push("QUALITY_TRACE_AUTO_MERGE_FORBIDDEN");
  if(trace.principles?.authority!=="CAPABILITY != AUTHORITY") failures.push("QUALITY_TRACE_AUTHORITY_RULE_MISSING");
}

if(!fs.existsSync(fabricPath)) failures.push("QUALITY_FABRIC_MANIFEST_MISSING");
else {
  const fabric=JSON.parse(fs.readFileSync(fabricPath,"utf8"));
  if(fabric.contract!==ACORN_QUALITY_FABRIC_VERSION) failures.push("QUALITY_FABRIC_CONTRACT_MISMATCH");
  if(fabric.expiry_required!==true) failures.push("QUALITY_FABRIC_EXPIRY_REQUIREMENT_MISSING");
  if(fabric.authority!=="human") failures.push("QUALITY_FABRIC_AUTHORITY_RULE_MISSING");
  if(fabric.auto_merge===true) failures.push("QUALITY_FABRIC_AUTO_MERGE_FORBIDDEN");
}

if(VISIONARY_BENCHMARKS.length<8) failures.push("VISIONARY_BENCHMARK_SET_TOO_SMALL");
if(REQUIRED_QUALITY_DIMENSIONS.length<20) failures.push("QUALITY_DIMENSIONS_INCOMPLETE");
if(QUALITY_DIMENSIONS.length<26) failures.push("QUALITY_FABRIC_DIMENSIONS_INCOMPLETE");
for(const invariant of QUALITY_INVARIANTS) {
  if(typeof invariant!=="string" || !invariant.startsWith("NO_")) failures.push("QUALITY_INVARIANT_INVALID");
}

const result={
  contract:"acorn.quality-gate.v2",
  quality_fabric:ACORN_QUALITY_FABRIC_VERSION,
  benchmarks:VISIONARY_BENCHMARKS.length,
  visionary_dimensions:REQUIRED_QUALITY_DIMENSIONS.length,
  fabric_dimensions:QUALITY_DIMENSIONS.length,
  invariants:QUALITY_INVARIANTS.length,
  trace:tracePath,
  fabric:fabricPath,
  failures,
  status:failures.length===0?"PASS":"FAIL",
  truth:"CODE_PRESENT != TESTED != EXECUTED != MEASURED != VERIFIED != LIVE",
  human_authority:true,
  auto_merge:false
};
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exit(1);
