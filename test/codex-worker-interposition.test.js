import test from "node:test";
import assert from "node:assert/strict";
import { authorizeRuntimeEffect } from "../scripts/acorn-runtime-interposition.mjs";

test("Codex write capability is governed before execution", () => {
  const result = authorizeRuntimeEffect({ actor:"acorn.codex-worker", capability:{ id:"codex.exec.write", kind:"CODE_EXECUTION", observability:"VERIFIED", control:"VERIFIED", reversibility:"REVERSIBLE", epistemic:"MEASURED" }, operation:"codex exec --write", evidence:{ measured:true, verified:true }, policy:{ requireVerified:true } });
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.authority_granted, false);
});

test("Codex execution is denied when the execution path is not governable", () => {
  const result = authorizeRuntimeEffect({ actor:"acorn.codex-worker", capability:{ id:"codex.exec.write", kind:"CODE_EXECUTION", observability:"NONE", control:"NONE", reversibility:"UNKNOWN" }, operation:"codex exec --write", evidence:{ measured:false, verified:false } });
  assert.notEqual(result.decision, "ALLOW");
  assert.equal(result.authority_granted, false);
});

test("read-only Codex discovery remains an explicitly governed capability", () => {
  const result = authorizeRuntimeEffect({ actor:"acorn.codex-worker", capability:{ id:"codex.exec.discovery", kind:"CODE_DISCOVERY", observability:"VERIFIED", control:"VERIFIED", reversibility:"REVERSIBLE", epistemic:"MEASURED" }, operation:"codex exec --sandbox read-only", evidence:{ measured:true, verified:true }, policy:{ requireVerified:true } });
  assert.equal(result.decision, "ALLOW");
  assert.equal(result.authority_granted, false);
});
