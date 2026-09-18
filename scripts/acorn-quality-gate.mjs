#!/usr/bin/env node
import fs from "node:fs";
import { REQUIRED_QUALITY_DIMENSIONS, VISIONARY_BENCHMARKS } from "./acorn-visionary-quality.mjs";

const failures=[];
const tracePath=".acorn/quality-trace.json";
if(!fs.existsSync(tracePath)) failures.push("QUALITY_TRACE_MISSING");
else {
  const trace=JSON.parse(fs.readFileSync(tracePath,"utf8"));
  if(trace.contract!=="acorn.quality-trace.v1") failures.push("QUALITY_TRACE_CONTRACT_MISMATCH");
  if(trace.expiry_required!==true) failures.push("QUALITY_TRACE_EXPIRY_REQUIREMENT_MISSING");
  if(trace.auto_merge===true) failures.push("QUALITY_TRACE_AUTO_MERGE_FORBIDDEN");
  if(trace.principles?.authority!=="CAPABILITY != AUTHORITY") failures.push("QUALITY_TRACE_AUTHORITY_RULE_MISSING");
}
if(VISIONARY_BENCHMARKS.length < 8) failures.push("VISIONARY_BENCHMARK_SET_TOO_SMALL");
if(REQUIRED_QUALITY_DIMENSIONS.length < 20) failures.push("QUALITY_DIMENSIONS_INCOMPLETE");

const result={
  contract:"acorn.quality-gate.v1",
  benchmarks:VISIONARY_BENCHMARKS.length,
  dimensions:REQUIRED_QUALITY_DIMENSIONS.length,
  trace:tracePath,
  failures,
  status:failures.length===0?"PASS":"FAIL",
  truth:"CODE_PRESENT != TESTED != EXECUTED != MEASURED != VERIFIED != LIVE",
  human_authority:true,
  auto_merge:false
};
console.log(JSON.stringify(result,null,2));
if(failures.length) process.exit(1);
