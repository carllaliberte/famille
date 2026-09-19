import test from "node:test";
import assert from "node:assert/strict";
import {
  declareConnector, prepareProbe, recordProbeResult, mergeConnectionEvidence,
  routeConnectivity, governOutboundEffect, buildConnectivitySnapshot,
  assertConnectivityConstitution
} from "../scripts/acorn-real-world-connectivity-fabric.mjs";

test("declared connector is not live", () => {
  const c = declareConnector({name:"gmail",class:"COMMUNICATION",capabilities:["read"]});
  assert.equal(c.state,"DECLARED");
  assert.equal(c.live,false);
});

test("probe without physical evidence cannot become live", () => {
  const c = declareConnector({name:"calendar",class:"PRODUCTIVITY"});
  const p = prepareProbe(c,{capability:"read"});
  const o = recordProbeResult(p,{transport:"https",status:200,authenticated:false,usable:false});
  assert.notEqual(o.state,"LIVE_VERIFIED");
  assert.equal(o.live,false);
});

test("physical authenticated usable evidence can produce live verification", () => {
  const c = declareConnector({name:"github",class:"DEVELOPER"});
  const p = prepareProbe(c,{capability:"read"});
  const o = recordProbeResult(p,{
    transport:"https",status:200,authenticated:true,usable:true,
    physically_observed:true,evidence:["dated-http-200"]
  });
  assert.equal(o.state,"LIVE_VERIFIED");
  assert.equal(o.live,true);
  const merged = mergeConnectionEvidence(c,o);
  assert.equal(merged.state,"LIVE_VERIFIED");
  assert.equal(merged.live,true);
});

test("routing refuses non-live connector", () => {
  const c = declareConnector({name:"drive",class:"DATA"});
  const r = routeConnectivity(c,{signal_id:"s1"},{capability:"read"});
  assert.equal(r.ok,false);
  assert.equal(r.reason,"LIVE_CONNECTION_REQUIRED");
});

test("outbound effect remains bounded by existing governance", () => {
  const blocked = governOutboundEffect({human_authorized:true,effect_governed:false});
  assert.equal(blocked.allowed,false);
  const ready = governOutboundEffect({human_authorized:true,effect_governed:true});
  assert.equal(ready.execution_runtime,"EXISTING_ACORN_EXECUTION_FABRIC");
  assert.equal(ready.external_effect,false);
});

test("snapshot counts only verified live connectors", () => {
  const rows=[
    {state:"LIVE_VERIFIED",live:true},
    {state:"CONNECTED",live:false},
    {state:"DECLARED",live:false}
  ];
  const s=buildConnectivitySnapshot(rows);
  assert.equal(s.connector_count,3);
  assert.equal(s.live_count,1);
  assert.equal(s.verified_count,1);
});

test("constitution rejects invented live state", () => {
  const c=assertConnectivityConstitution({live_without_evidence:true});
  assert.equal(c.valid,false);
  assert.ok(c.violations.includes("LIVE_WITHOUT_PHYSICAL_EVIDENCE"));
});

test("authority never comes from connectivity", () => {
  const c=declareConnector({name:"x"});
  assert.equal(c.authority,false);
  const p=prepareProbe(c);
  const o=recordProbeResult(p,{physically_observed:true,evidence:["e"],authenticated:true,usable:true});
  assert.equal(o.authority,false);
});
