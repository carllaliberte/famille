import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("complete runtime exposes durable control plane", async () => {
  const server = await readFile(new URL("../live/server.mjs", import.meta.url), "utf8");
  const db = await readFile(new URL("../live/database.mjs", import.meta.url), "utf8");
  const worker = await readFile(new URL("../live/worker.mjs", import.meta.url), "utf8");
  assert.match(server, /\/api\/v1\/runtime/);
  assert.match(server, /\/api\/v1\/connections/);
  assert.match(server, /\/api\/v1\/intelligences/);
  assert.match(server, /human_required:true/);
  assert.match(db, /acorn_evidence/);
  assert.match(worker, /acorn_evidence/);
  assert.match(worker, /authority:false/);
  assert.match(worker, /external_effect:false/);
});

test("complete runtime keeps human and effect boundaries explicit", async () => {
  const source = await readFile(new URL("../live/server.mjs", import.meta.url), "utf8");
  for (const token of ["auto_contract:false","auto_payment:false","auto_spend:false","secret_custody:false","auto_merge:false"]) {
    assert.match(source, new RegExp(token.replaceAll("_","_")));
  }
});
