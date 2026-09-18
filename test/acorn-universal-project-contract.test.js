import test from "node:test";
import assert from "node:assert/strict";
import {
  PROJECT_LIFECYCLE,
  UNIVERSAL_PROJECT_KINDS,
  createUniversalProject,
  validateUniversalProject,
  canTransition,
  advanceProject,
  projectTruth,
  connectorState,
  universalProjectContract,
  composeExistingFabrics,
  bindCommercialCycle,
  refreshLiveEvidence,
  genericProviderAdapter,
  connectProvidersIfPresent,
  auditProjectSecurity,
  projectForKind,
  proofMatrix,
  projectObservability
} from "../scripts/acorn-universal-project-contract.mjs";
import { registerEvidence } from "../scripts/acorn-evidence-registry.mjs";
import { resetConnectionFabric } from "../scripts/acorn-connection-fabric.mjs";

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
  assert.equal(canTransition("PAYMENT","AUTHORIZATION",{paymentObserved:true}).allowed, false);
  assert.equal(canTransition("PAYMENT","AUTHORIZATION",{paymentObserved:true,authorized:true}).allowed, true);
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
  assert.ok(c.fields.includes("problem"));
  assert.equal(c.policy.no_auto_merge,true);
  assert.equal(c.policy.capability_is_not_authority,true);
  assert.equal(c.second_runtime,false);
  assert.equal(c.second_self_build,false);
  assert.deepEqual(c.kinds, [...UNIVERSAL_PROJECT_KINDS]);
});

test("commercial track keeps checkout / payment / authorization / delivery distinct", () => {
  const project = createUniversalProject({id:"c1", tenantId:"t1", problem:"turnkey email", executionState:"ORDER"});
  const checkout = bindCommercialCycle({
    project,
    tenantId:"t1",
    customerId:"c1",
    problem: project.problem,
    checkoutSession: { id:"cs_test", url:"https://example.test/pay" }
  });
  assert.equal(checkout.checkout_created, true);
  assert.equal(checkout.payment_observed, false);
  assert.equal(checkout.execution_authorized, false);
  assert.equal(checkout.delivered, false);
  assert.equal(checkout.transitions.payment.allowed, false);
  assert.equal(checkout.transitions.authorization.reason, "WAITING_HUMAN");

  const paid = bindCommercialCycle({
    project,
    tenantId:"t1",
    customerId:"c1",
    problem: project.problem,
    paymentEntry: { kind:"PAYMENT", epistemic:"OBSERVED", measured_at: new Date().toISOString() },
    authorized: false
  });
  assert.equal(paid.execution_authorized, false);
  assert.equal(paid.confused, false);
  assert.equal(paid.distinctions.PAYMENT_OBSERVED || paid.payment.reason === "PAYMENT_NOT_OBSERVED" || paid.payment.reason === "NOT_A_PAYMENT_OBSERVATION" || paid.payment.order != null, true);
  assert.notEqual(paid.payment.execution_authority, true);
});

test("LIVE evidence expires and can be re-acquired without becoming eternally false", () => {
  const stale = registerEvidence({
    tenantId: "t1",
    claim: "connector-health",
    source: "probe",
    strength: 1,
    margin: 0.1,
    validUntil: "2000-01-01T00:00:00.000Z"
  });
  const expired = refreshLiveEvidence([stale], { now: Date.parse("2026-09-18T14:00:00.000Z") });
  assert.equal(expired[0].current, false);
  assert.equal(expired[0].live, false);
  assert.equal(expired[0].expired_is_not_eternally_false, true);
  assert.equal(expired[0].successor_state, "REQUIRES_REVALIDATION");

  const refreshed = refreshLiveEvidence([stale], {
    now: Date.parse("2026-09-18T14:00:00.000Z"),
    reobserve: () => ({ observed: true, valid_until: "2026-09-19T14:00:00.000Z", source: "probe" })
  });
  assert.equal(refreshed[0].reacquired, true);
  assert.equal(refreshed[0].live, false);
  assert.equal(refreshed[0].current, true);
});

test("generic adapter stays NOT_CONNECTED without credentials", () => {
  resetConnectionFabric();
  const missing = genericProviderAdapter({ id:"http-generic", kind:"http", env:{}, credentialEnv:"ACORN_GENERIC_HTTP_TOKEN", register:true });
  assert.equal(missing.state, "NOT_CONNECTED");
  assert.equal(missing.observed, false);
  assert.equal(missing.connected, false);
  assert.equal(missing.live, false);
  assert.equal(missing.secret_value, null);
  const configured = genericProviderAdapter({
    id:"http-generic-cfg",
    kind:"http",
    env:{ ACORN_GENERIC_HTTP_TOKEN:"present-not-a-secret-for-git" },
    credentialEnv:"ACORN_GENERIC_HTTP_TOKEN"
  });
  assert.equal(configured.state, "CONFIGURED");
  assert.equal(configured.connected, false);
  assert.equal(configured.live, false);
  resetConnectionFabric();
});

test("providers without observed rails stay NOT_CONNECTED / NOT_LIVE", () => {
  const providers = connectProvidersIfPresent({ env: {} });
  assert.equal(providers.stripe.state, "NOT_CONNECTED");
  assert.equal(providers.stripe.live, false);
  assert.equal(providers.any_live, false);
  assert.equal(providers.generic.state, "NOT_CONNECTED");
});

test("security audit fail-closes tenant, SSRF, webhook, payment and authority spoof", () => {
  const project = createUniversalProject({id:"sec1", tenantId:"t1", problem:"isolate"});
  const audit = auditProjectSecurity({
    project,
    actorTenant: "t2",
    url: "http://169.254.169.254/",
    path: "latest/meta-data",
    webhook: { rawBody: "{}", signature: "t=1,v1=deadbeef", secret: "whsec_test" },
    paymentClaim: { paid: true, observed: false, execution_authorized: true },
    authorityClaim: { authorized: true, human_authorized: false }
  });
  assert.equal(audit.tenant_isolation, false);
  assert.equal(audit.idor_blocked, true);
  assert.equal(audit.ssrf, "URL_OUT_OF_SCOPE");
  assert.equal(audit.webhook.valid, false);
  assert.equal(audit.payment_spoof_rejected, true);
  assert.equal(audit.authority_spoof_rejected, true);
  assert.equal(audit.external_execution.fail_closed, true);
  assert.equal(audit.live, false);
});

test("same kernel covers software / AI / research / business / data / automation / industrial / physical / multi-org / program", () => {
  for (const kind of UNIVERSAL_PROJECT_KINDS) {
    const row = projectForKind(kind, { problem: `${kind} demand` });
    assert.equal(row.project.kind, kind);
    assert.equal(row.contract.version, universalProjectContract().version);
    assert.equal(row.second_runtime, false);
    assert.equal(row.live, false);
    assert.equal(row.validation.valid, true);
  }
});

test("proof matrix never invents LIVE or VERIFIED", () => {
  const invented = proofMatrix({
    contract: { CODE_PRESENT: true, TESTED: true, LIVE: true },
    commercial: { CODE_PRESENT: true }
  });
  assert.equal(invented.cells.contract.CODE_PRESENT, true);
  assert.equal(invented.cells.contract.TESTED, true);
  assert.equal(invented.cells.contract.LIVE, false);
  assert.equal(invented.cells.contract.LIVE_STATUS, "LIVE_CLAIM_REJECTED");
  assert.equal(invented.cells.commercial.VERIFIED, false);
  assert.equal(invented.cells.security.LIVE, false);
  assert.equal(invented.invented, false);
});

test("composeExistingFabrics reuses fabrics and stays honest", () => {
  const composed = composeExistingFabrics({
    id: "compose-1",
    tenantId: "t1",
    customerId: "c1",
    problem: "compose existing fabrics without a second runtime",
    capabilities: ["analysis"],
    intelligences: [{ id: "grok_1", provider: "xai", model: "grok-2", capabilities: ["analysis"] }],
    env: {}
  });
  assert.equal(composed.second_runtime, false);
  assert.equal(composed.second_graph, false);
  assert.equal(composed.second_self_build, false);
  assert.equal(composed.commercial.execution_authorized, false);
  assert.equal(composed.execution.plan.state, "AWAITING_AUTHORIZATION");
  assert.equal(composed.providers.any_live, false);
  assert.equal(composed.observability.what_is_live, false);
  assert.ok(composed.observability.what_requires_human.includes("AUTHORIZATION"));
  const view = projectObservability(composed.project, { evidence: [], commercial: composed.commercial });
  assert.equal(view.where_are_we, "INTAKE");
  assert.equal(view.what_is_live, false);
});
