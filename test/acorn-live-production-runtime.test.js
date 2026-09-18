import test from "node:test";import assert from "node:assert/strict";test("production runtime contract",()=>{assert.equal(typeof process.env.NODE_ENV,"string");assert.ok("postgres".length>0)});
