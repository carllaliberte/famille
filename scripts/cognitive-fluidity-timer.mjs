#!/usr/bin/env node
/** Tiny timing primitive used by the canonical cognitive-worker workflow. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const path = process.env.FLUIDITY_TIMING || "cognitive-fluidity-timing.json";
const stage = String(process.env.FLUIDITY_STAGE || "").trim();
const phase = process.env.FLUIDITY_PHASE === "start" ? "start" : "stop";
if (!stage) throw new Error("FLUIDITY_STAGE_REQUIRED");

let data = {};
if (existsSync(path)) {
  try { data = JSON.parse(readFileSync(path, "utf8")); } catch { data = {}; }
}
if (!data || typeof data !== "object" || Array.isArray(data)) data = {};
const now = Date.now();
const row = data[stage] && typeof data[stage] === "object" ? data[stage] : {};
if (phase === "start") row.start_ms = now;
else {
  row.end_ms = now;
  if (Number.isFinite(Number(row.start_ms))) row.duration_ms = Math.max(0, now - Number(row.start_ms));
}
data[stage] = row;
writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
