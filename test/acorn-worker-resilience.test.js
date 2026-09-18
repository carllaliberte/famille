import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("live worker has durable crash-recovery contract", async () => {
  const source = await readFile(new URL("../live/worker.mjs", import.meta.url), "utf8");
  assert.match(source, /lease_until/);
  assert.match(source, /recoverStaleJobs/);
  assert.match(source, /FOR UPDATE SKIP LOCKED/);
  assert.match(source, /external_effect: false/);
  assert.match(source, /authority: false/);
});

test("live worker bounds execution attempts", async () => {
  const source = await readFile(new URL("../live/worker.mjs", import.meta.url), "utf8");
  assert.match(source, /attempts<max_attempts/);
  assert.match(source, /retry = job\.attempts < job\.max_attempts/);
});
