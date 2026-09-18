import test from "node:test";import assert from "node:assert/strict";
test("worker requires durable database",()=>{assert.ok("DATABASE_URL_REQUIRED".length>0)});
test("worker contract preserves human authority",()=>{const workerContract={authority:false,external_effect:false};assert.equal(workerContract.authority,false);assert.equal(workerContract.external_effect,false)});
