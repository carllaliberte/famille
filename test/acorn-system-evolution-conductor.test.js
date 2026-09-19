import test from "node:test";
import assert from "node:assert/strict";
import { runSystemEvolution, assertSystemEvolutionConstitution } from "../scripts/acorn-system-evolution-conductor.mjs";

test("system evolution measures contradictions, interoperability and implementation gaps", () => {
  const s = runSystemEvolution({
    events: [
      { id:"a", entity_id:"x", value:1, timestamp:"2026-01-01T00:00:00Z" },
      { id:"b", entity_id:"x", value:2, timestamp:"2026-01-02T00:00:00Z" }
    ],
    nodes:[{id:"x"},{id:"orphan"}],
    edges:[{from:"x",to:"x"}],
    contracts:["missing-contract"],
    runtime:[],
    evidence:[],
    root:"/tmp/nonexistent"
  });
  assert.ok(s.gaps.length > 0);
  assert.equal(s.authority,false);
  assert.equal(s.next_action,"CLOSE_MEASURED_GAPS");
  assert.ok(s.context.contradictions.length > 0);
});

test("system evolution cannot self-authorize or self-adopt", () => {
  assert.equal(assertSystemEvolutionConstitution({auto_adopt:true}).valid,false);
  assert.equal(assertSystemEvolutionConstitution({auto_authorize:true}).valid,false);
  assert.equal(assertSystemEvolutionConstitution({}).valid,true);
});
