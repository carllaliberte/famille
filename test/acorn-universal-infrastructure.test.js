import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  OBJECT_KINDS,
  TRUTH_STATES,
  PUBLIC_API_VERSION,
  adversarialCognition,
  composeProblem,
  connectorAsCapability,
  createDurableExecution,
  createUniversalAdapter,
  datedEvidence,
  digitalTwin,
  economicCycle,
  fabricSnapshot,
  ignoreClientAuthority,
  infrastructureConstitution,
  makeObject,
  measureValue,
  publicContract,
  recall,
  refuseFakeLabel,
  remember,
  resetUniversalInfrastructure,
  resourceCost,
  resumeExecution,
  routeAdaptive,
  runComposition,
  runUniversalInfrastructureCycle,
  selfBuildCycle,
  sensitiveAction,
  temporalObservation,
  transitionTruth,
} from "../scripts/acorn-universal-infrastructure.mjs";
import { executeWorkTask, canonicalWorkFromRuntime } from "../scripts/acorn-work-engine.mjs";
import { intelligenceAdapter, routeByCapability } from "../sdk/open-intelligence.js";

test("generic objects carry identity provenance version time capability and authority boundary", () => {
  const obj = makeObject("Capability", {
    identity: "arith-local",
    capabilities: ["arithmetic"],
    source: "registry",
    margin: 0.1,
    valid_until: "2099-01-01T00:00:00Z",
  });
  assert.equal(obj.kind, "Capability");
  assert.equal(obj.identity, "arith-local");
  assert.equal(obj.authority_boundary.authority, false);
  assert.equal(obj.distinctions.identity_is_not_capability, true);
  assert.equal(obj.distinctions.capability_is_not_authority, true);
  assert.equal(obj.distinctions.provenance_is_not_trust, true);
  assert.equal(obj.measurement.status, "NOT_MEASURED");
  assert.equal(obj.live, false);
  assert.equal(OBJECT_KINDS.length, 16);
});

test("fake LIVE READY PAID VERIFIED labels do not become truth", () => {
  assert.equal(refuseFakeLabel("LIVE"), "UNKNOWN");
  assert.equal(refuseFakeLabel("READY"), "DEFINED");
  assert.equal(refuseFakeLabel("CERTIFIED"), "UNKNOWN");
  assert.equal(refuseFakeLabel("PAID"), "UNKNOWN");
  assert.equal(refuseFakeLabel("VERIFIED"), "UNKNOWN");
  assert.equal(refuseFakeLabel("DEPLOYED"), "UNKNOWN");
  assert.equal(refuseFakeLabel("VERIFIED", { evidence: { independent: true }, event: { type: "REVIEW" } }), "VERIFIED");
});

test("truth transitions require grounded events and never mint LIVE", () => {
  const live = transitionTruth("VERIFIED", "LIVE", { actor: "acorn" });
  assert.equal(live.accepted, false);
  assert.equal(live.reason, "LIVE_IS_CARL_ONLY");
  const self = transitionTruth("MEASURED", "VERIFIED", { independent: false });
  assert.equal(self.accepted, false);
  const sim = transitionTruth("TESTED", "EXECUTED", { mode: "SIMULATION" });
  assert.equal(sim.accepted, false);
  const expired = transitionTruth("VERIFIED", "EXPIRED", { type: "VALID_UNTIL" });
  assert.equal(expired.accepted, true);
  assert.equal(expired.false_forever, false);
  const ok = transitionTruth("DEFINED", "CODE_PRESENT", { type: "FILE_PRESENT" });
  assert.equal(ok.accepted, true);
  assert.ok(TRUTH_STATES.includes("UNKNOWN"));
});

test("intelligence adapter is provider-neutral and authority-false", () => {
  const src = readFileSync(new URL("../scripts/acorn-universal-infrastructure.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(src, /if\s*\(\s*provider\s*===\s*"grok"/);
  assert.doesNotMatch(src, /if\s*\(\s*provider\s*===\s*"openai"/);
  const future = createUniversalAdapter({ id: "future-z", provider: "not-invented-yet", capabilities: ["compose"] });
  assert.equal(future.authority, false);
  assert.equal(future.live, false);
  assert.equal(future.declare().authorized, false);
  assert.equal(future.invoke().reason, "CHANNEL_NOT_PRESENT");
  assert.equal(future.invoke({ timeout_ms: 0 }).reason, "TIMEOUT");
  assert.equal(future.retry({}).retries >= 1, true);
  assert.equal(future.cancel().status, "CANCELLED");
  assert.equal(future.invoke().reason, "CANCELLED");
  assert.equal(future.cost().amount, "NOT_MEASURED");
  assert.equal(future.provenance().authority, false);
  const routed = routeByCapability({ need: "compose" }, [future]);
  assert.equal(routed[0].id, "future-z");
  assert.equal(routed[0].authority, false);
  const paid = intelligenceAdapter({ id: "paid-x", capabilities: ["compose"], cost: { class: "PAID", amount: 1, currency: "USD" } });
  const blocked = routeByCapability({ need: "compose" }, [future, paid], { policy: "PAID_FORBIDDEN" });
  assert.equal(blocked.some((row) => row.id === "paid-x"), false);
});

test("adaptive routing cannot cross a paid-forbidden policy", () => {
  const free = createUniversalAdapter({ id: "local-math", capabilities: ["arithmetic"] });
  const paid = intelligenceAdapter({ id: "remote-paid", capabilities: ["arithmetic"], cost: { class: "PAID" } });
  const routed = routeAdaptive({
    need: "arithmetic",
    required: ["arithmetic"],
    adapters: [paid, free],
    policy: "PAID_FORBIDDEN",
  });
  assert.equal(routed.selected.id, "local-math");
  assert.equal(routed.crossed_policy, false);
  assert.equal(routed.optimization_is_not_authority, true);
  assert.equal(routed.authority, false);
});

test("composition does not invent an equivalent for a missing capability", async () => {
  resetUniversalInfrastructure();
  const plan = composeProblem({ problem: "need a photonic lattice that does not exist", required: ["photonic_lattice_2055"] });
  assert.equal(plan.unavailable_is_not_equivalent, true);
  assert.ok(plan.missing.includes("photonic_lattice_2055"));
  assert.equal(plan.steps[0].primary, null);
  assert.equal(plan.steps[0].equivalent_invented, false);
  const run = await runComposition({ problem: "need a photonic lattice that does not exist", required: ["photonic_lattice_2055"] });
  assert.equal(run.executed, false);
  assert.equal(run.steps[0].equivalent_invented, false);
  assert.equal(run.live, false);
});

test("composition executes a local arithmetic capability and keeps provenance", async () => {
  resetUniversalInfrastructure();
  const run = await runComposition({ problem: "17 * 23", required: ["arithmetic"] });
  assert.equal(run.executed, true);
  assert.equal(run.simulated, false);
  assert.equal(run.steps[0].executed, true);
  assert.ok(run.steps[0].provenance.capability_id);
  assert.equal(run.live, false);
  const again = await runComposition({ problem: "17 * 23", required: ["arithmetic"], idempotency_key: "same-1" });
  const replay = await runComposition({ problem: "17 * 23", required: ["arithmetic"], idempotency_key: "same-1" });
  assert.equal(replay.execution_id, again.execution_id);
});

test("simulation never becomes executed", async () => {
  resetUniversalInfrastructure();
  const twin = digitalTwin({ subject: "customer-project" });
  assert.equal(twin.simulated, true);
  assert.equal(twin.executed, false);
  const run = await runComposition({ problem: "17 * 23", required: ["arithmetic"], mode: "SIMULATION" });
  assert.equal(run.status, "SIMULATED");
  assert.equal(run.executed, false);
  assert.equal(run.simulated, true);
});

test("durable execution survives resume and stays blocked without human authority", () => {
  const first = createDurableExecution({
    mode: "multi-step",
    project_id: "proj-1",
    idempotency_key: "dur-1",
    steps: [{ title: "analyze", required: ["analysis"] }],
  });
  assert.equal(first.state, "AWAITING_AUTHORIZATION");
  const blocked = resumeExecution(first.id, { authorized: false });
  assert.equal(blocked.tasks[0].state, "BLOCKED");
  const same = createDurableExecution({ mode: "queued", idempotency_key: "dur-1" });
  assert.equal(same.id, first.id);
});

test("value and resource costs stay UNKNOWN when not instrumented", () => {
  const value = measureValue({});
  assert.equal(value.measured_net_value.status, "NOT_MEASURED");
  assert.equal(value.invented, false);
  const costs = resourceCost({});
  assert.equal(costs.ENERGY, "NOT_MEASURED");
  assert.equal(costs.MONEY, "NOT_MEASURED");
});

test("memory is tenant-isolated and an assertion is not truth", () => {
  remember({ tenant_id: "t1", kind: "project", subject: "alpha", assertion: "worked" });
  remember({ tenant_id: "t2", kind: "project", subject: "beta", assertion: "secret" });
  const a = recall({ tenant_id: "t1" });
  const leak = recall({ tenant_id: "t1", other_tenant_id: "t2" });
  assert.equal(a.records.some((row) => row.subject === "alpha"), true);
  assert.equal(a.records[0].truth, false);
  assert.equal(leak.leaked, false);
  assert.equal(leak.records.length, 0);
});

test("adversarial cognition refuses self-verification as independent proof", () => {
  const self = adversarialCognition({
    claim: "this is proven",
    proposer: "model-a",
    reviews: [{ actor: "model-a", verify: true }],
  });
  assert.equal(self.self_validation_is_not_proof, true);
  assert.equal(self.roles.VERIFY.independent, false);
  const other = adversarialCognition({
    claim: "this is proven",
    proposer: "model-a",
    reviews: [{ actor: "model-b", falsify: true, verify: true }],
  });
  assert.equal(other.roles.VERIFY.independent, true);
  assert.equal(other.consensus_is_not_truth, true);
});

test("self-build cannot amend the constitution or grant authority", () => {
  const cycle = selfBuildCycle({ gap: "missing adapter" });
  assert.equal(cycle.can_amend_constitution, false);
  assert.equal(cycle.can_grant_authority, false);
  assert.equal(cycle.self_build_neq_self_authority, true);
  assert.equal(sensitiveAction("MERGE", { actor: "acorn" }).allowed, false);
  assert.equal(sensitiveAction("MONEY", { actor: "acorn" }).ai_write, "DENIED");
});

test("HTTP client fields cannot mint authority", () => {
  const ignored = ignoreClientAuthority({
    problem: "help",
    human_authorized: true,
    authority: { actor: "carl" },
    live: true,
    paid: true,
  });
  assert.equal(ignored.sanitized.human_authorized, undefined);
  assert.equal(ignored.sanitized.authority, undefined);
  assert.equal(ignored.authority, false);
  assert.equal(ignored.live, false);
});

test("expired evidence is expired, not false forever", () => {
  const rec = datedEvidence({
    subject: "old measure",
    source: "test",
    strength: 2,
    margin: 0.4,
    valid_until: "2000-01-01T00:00:00Z",
  });
  assert.equal(rec.status, "MEASURED");
  assert.equal(rec.current, false);
  assert.equal(rec.expired_is_not_false_forever, true);
  const t = temporalObservation({
    what: "capability",
    source: "registry",
    when: "2026-09-18T12:00:00Z",
    margin: 0.2,
    until: "2001-01-01T00:00:00Z",
  });
  assert.equal(t.expired, true);
  assert.equal(t.expired_is_not_false_forever, true);
  assert.equal(t.margin, 0.2);
});

test("connectors reuse flux honesty and market stays unpaid", () => {
  const connector = connectorAsCapability({ id: "crm", capabilities: ["contacts"], state: "LIVE" });
  assert.equal(connector.kind, "Connector");
  assert.equal(connector.live, false);
  const economy = economicCycle({
    signals: [{ id: "d1", problem: "evidence", audience: "business", observed: true, evidence: [{ id: "e1" }] }],
    capabilityIndex: [{ id: "evidence", name: "evidence", tags: ["evidence"] }],
  });
  assert.equal(economy.paid, false);
  assert.equal(economy.live, false);
  assert.equal(economy.stripe_is_not_brain, true);
  assert.equal(publicContract().version, PUBLIC_API_VERSION);
});

test("work engine runs the universal infrastructure cycle", async () => {
  const rows = canonicalWorkFromRuntime({ unified: { evolution: {}, learning: {}, metabolism: {} }, coverage: {} });
  const row = rows.find((item) => item.execution_kind === "universal-infrastructure");
  assert.ok(row);
  const executed = await executeWorkTask({ root: process.cwd(), task: row, env: process.env });
  assert.equal(executed.executor, "universal-infrastructure");
  assert.equal(executed.infrastructure.live, false);
  assert.equal(executed.infrastructure.snapshot.constitution.second_architecture, false);
});

test("constitution snapshot and cycle stay classic / not LIVE", async () => {
  const snap = fabricSnapshot();
  assert.equal(snap.live, false);
  assert.equal(snap.constitution.capability_neq_authority, true);
  assert.equal(infrastructureConstitution().ai_merge, "DENIED");
  const cycle = await runUniversalInfrastructureCycle({ problem: "17 * 23", required: ["arithmetic"] });
  assert.equal(cycle.live, false);
  assert.equal(cycle.composition.executed, true);
});
