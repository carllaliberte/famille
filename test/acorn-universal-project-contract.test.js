import test from "node:test";
import assert from "node:assert/strict";
import {
  PROJECT_LIFECYCLE,
  createUniversalProject,
  validateUniversalProject,
  canTransition,
  advanceProject,
  projectTruth,
  connectorState,
  universalProjectContract
} from "../scripts/acorn-universal-project-contract.mjs";

test("universal project contract covers the full lifecycle", () => {
  assert.equal(PROJECT_LIFECYCLE[0], "INTAKE");
  assert.equal(PROJECT_LIFECYCLE.at(-1), "LEARNING");
  assert.ok(PROJECT_LIFECYCLE.includes("EXECUTION"));
  assert.ok(PROJECT_LIFECYCLE.includes("VALIDATION"));
  assert.ok(PROJECT_LIFECYCLE.includes("VALUE_MEASUREMENT"));
});

test("project creation is tenant-safe and explicit", () => {
  const p = createUniversalProject({id:"p1", tenantId:"t1", problem:"build a system"});
  assert.equal(p.tenant_id, "t1");
  assert.equal(p.execution_state, "INTAKE");
  assert.equal(p.live, false);
  assert.equal(validateUniversalProject(p).valid, true);
});

test("critical transitions remain gated", () => {
  assert.equal(canTransition("INTAKE","EXECUTION").allowed, false);
  assert.equal(canTransition("INTAKE","AUTHORIZATION").allowed, false);
  assert.equal(canTransition("PAYMENT","AUTHORIZATION",{paymentObserved:true}).allowed, true);
  assert.equal(canTransition("AUTHORIZATION","EXECUTION",{authorized:true}).allowed, true);
  assert.equal(canTransition("EXECUTION","VERIFICATION",{verified:false}).allowed, false);
  assert.equal(canTransition("EXECUTION","VERIFICATION",{verified:true}).allowed, true);
});

test("advance never turns a plan into execution", () => {
  const p = createUniversalProject({id:"p2", problem:"test"});
  const blocked = advanceProject(p,"EXECUTION",{authorized:false});
  assert.equal(blocked.execution_state,"INTAKE");
  assert.equal(blocked.transition.reason,"EXECUTION_AUTHORIZATION_REQUIRED");
  const ready = advanceProject(p,"QUALIFICATION");
  assert.equal(ready.execution_state,"QUALIFICATION");
});

test("truth ladder never invents LIVE", () => {
  const truth = projectTruth({},{codePresent:true,tested:true,executed:true,measured:true,verified:true,liveObserved:false});
  assert.equal(truth.epistemic.LIVE,false);
  assert.equal(truth.status,"MEASURED");
});

test("connector LIVE requires observed and verified", () => {
  assert.equal(connectorState({state:"LIVE",observed:false,verified:true}).live,false);
  assert.equal(connectorState({state:"LIVE",observed:true,verified:true}).live,true);
});

test("contract is a composition layer, not a second runtime", () => {
  const c = universalProjectContract();
  assert.ok(c.fields.includes("project"));
  assert.equal(c.policy.no_auto_merge,true);
  assert.equal(c.policy.capability_is_not_authority,true);
});
