import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startLiveServer } from "../live/server.mjs";

async function req(base, path, {method="GET",token,body}={}) {
  const headers={"content-type":"application/json"};
  if(token) headers.authorization="Bearer "+token;
  const r=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,json:await r.json()};
}

test("live customer reality endpoint reports the next real-world action without inventing connectivity", async () => {
  const dir=mkdtempSync(join(tmpdir(),"acorn-reality-"));
  const env={ACORN_DB_ADAPTER:"sqlite",ACORN_DB:join(dir,"state.db"),NODE_ENV:"test",HOST:"127.0.0.1",PORT:"0"};
  const started=await startLiveServer({env});
  const base="http://127.0.0.1:"+started.port;
  try {
    const created=await req(base,"/api/v1/register",{method:"POST",body:{name:"Reality",email:"reality@example.com",password:"correct-horse"}});
    assert.equal(created.status,201);
    const reality=await req(base,"/api/v1/reality",{token:created.json.token});
    assert.equal(reality.status,200);
    assert.equal(reality.json.live,false);
    assert.equal(reality.json.verified,false);
    assert.equal(reality.json.authority,"carl");
    assert.ok(Array.isArray(reality.json.blockers));
    assert.equal(reality.json.next_action,"DESCRIBE_PROJECT");
  } finally {
    started.server.close();
    await started.db.close();
  }
});
