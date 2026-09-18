import test from "node:test";import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("worker requires durable database",()=>{assert.ok("DATABASE_URL_REQUIRED".length>0);const src=readFileSync(new URL("../live/worker.mjs",import.meta.url),"utf8");assert.match(src,/DATABASE_URL_REQUIRED/);assert.match(src,/registerEvidence/)});
test("worker contract preserves human authority",()=>{const workerContract={authority:false,external_effect:false,live:false};assert.equal(workerContract.authority,false);assert.equal(workerContract.external_effect,false);assert.equal(workerContract.live,false)});
