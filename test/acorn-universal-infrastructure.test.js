import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startLiveServer } from "../live/server.mjs";
import { STATE_ENTITIES, stateRecord, eventRecord } from "../scripts/acorn-enterprise-state.mjs";
import { admitExtension, resetSelfBuild, EXTENSION_KINDS } from "../scripts/acorn-self-build.mjs";
import {
  UNIVERSAL_VERSION,
  UNIVERSAL_PRIMITIVES,
  CAPABILITY_EDGES,
  TRUST_STATES,
  universalConstitution,
  universalProbe,
  primitiveRelations,
  isPrimitive,
  createCapabilityGraph,
  addCapabilityNode,
  addCapabilityEdge,
  detectGraphCycle,
  snapshotGraph,
  capabilityGraphFromCapabilities,
  persistableGraph,
  admitUnknown,
  admitEconomicRail,
  admitPhysical,
  assertPowerDoesNotGrantAuthority,
  composeExecution,
  emitUniversalEvent,
  explainTrust,
  attachTemporal,
  rememberMemory,
  promoteMemory,
  knowledgeToAction,
  describeProjectOrganism,
  federate,
  protocolEnvelope,
  describeRight,
  measureValue,
  diagnoseSystem,
  discoverDemand,
  productizeCapability,
  classifyFailure,
  simulateTwin,
  observabilityIds,
  classifyAdversarialFail,
  runArchitecturalQuestions,
  truthMatrix,
  scaleLimits,
  implementedNow,
  notYetImplemented,
  resetUniversal,
  assertUniversalInvariant,
  infrastructureSnapshot,
} from "../scripts/acorn-universal-infrastructure.mjs";

function envFor(path) {
  return { ACORN_DB_ADAPTER: "sqlite", ACORN_DB: path, NODE_ENV: "test", HOST: "127.0.0.1", PORT: "0" };
}

async function jsonReq(base, path, { method = "GET", token, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = "Bearer " + token;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, json: await res.json() };
}

test("constitution is a coordinator of relations, not a second runtime", () => {
  const c = universalConstitution();
  assert.equal(c.second_architecture, false);
  assert.equal(c.second_runtime, false);
  assert.equal(c.second_market, false);
  assert.equal(c.second_connector_system, false);
  assert.equal(c.second_economic_engine, false);
  assert.equal(c.stripe_is_not_acorn_core, true);
  assert.equal(c.capability_neq_authority, true);
  assert.equal(c.power_does_not_grant_authority, true);
  assert.equal(c.auto_merge, false);
  assert.equal(c.live, false);
  assert.equal(c.authority, "carl");
  assert.equal(universalProbe().live, false);
  assert.equal(UNIVERSAL_PRIMITIVES.length, 24);
  assert.equal(isPrimitive("capability"), true);
  assert.equal(isPrimitive("GrokService"), false);
  const rel = primitiveRelations();
  assert.equal(rel.decorative, false);
  assert.equal(rel.executable, true);
  assert.deepEqual(rel.CAPABILITY.provided_by, ["INTELLIGENCE", "IDENTITY", "MACHINE"]);
  assert.equal(rel.INTELLIGENCE.never_is.includes("AUTHORITY"), true);
  assert.equal(rel.MEMORY.never_promotes_hypothesis_to_fact, true);
  assert.ok(CAPABILITY_EDGES.includes("requires"));
  assert.ok(TRUST_STATES.includes("UNKNOWN"));
});

test("capability graph has real typed edges and refuses cycles", () => {
  resetUniversal();
  const g = createCapabilityGraph({ tenant_id: "t1", project_id: "p1" });
  addCapabilityNode(g.id, { id: "analysis", name: "analysis", exists: true });
  addCapabilityNode(g.id, { id: "github", name: "github", exists: false });
  addCapabilityNode(g.id, { id: "verify", name: "verification", exists: true });
  const edge = addCapabilityEdge(g.id, { from: "github", to: "analysis", relation: "requires" });
  assert.equal(edge.added, true);
  addCapabilityEdge(g.id, { from: "verify", to: "github", relation: "requires" });
  const cycle = addCapabilityEdge(g.id, { from: "analysis", to: "verify", relation: "requires" });
  assert.equal(cycle.added, false);
  assert.equal(cycle.reason, "CYCLE_DETECTED");
  assert.equal(detectGraphCycle(g.id).cycle, false);
  const snap = snapshotGraph(g.id);
  assert.deepEqual(snap.missing, ["github"]);
  assert.ok(snap.present.includes("analysis"));
  assert.equal(snap.live, false);
  const record = persistableGraph(g.id);
  assert.equal(record.entity, "GRAPH");
  assert.ok(STATE_ENTITIES.includes("GRAPH"));
  assert.ok(record.valid_from);
});

test("unknown intelligence, rail, machine, market, and capability are admitted without core or domain change", () => {
  resetUniversal();
  resetSelfBuild();
  const intelligence = admitUnknown({ kind: "UNKNOWN_INTELLIGENCE", id: "future.helix-9", provider: "helix", model: "helix-9" });
  const rail = admitEconomicRail({ provider: "clearinghouse-unknown" });
  const machine = admitPhysical({ kind: "ROBOT", id: "future.field-arm" });
  const market = admitUnknown({ kind: "UNKNOWN_MARKET", id: "future.orbital-slots" });
  const cap = admitUnknown({ kind: "UNKNOWN_CAPABILITY", id: "future.optical-routing" });
  for (const row of [intelligence, machine, market, cap]) {
    assert.equal(row.admitted, true);
    assert.equal(row.core_modified, false);
    assert.equal(row.authorized, false);
    assert.equal(row.live, false);
  }
  assert.equal(rail.domain_modified, false);
  assert.equal(rail.acorn_core, false);
  assert.equal(rail.status, "UNKNOWN");
  assert.equal(machine.parallel_architecture, false);
  assert.equal(machine.physical_capability_neq_authority, true);
  assert.equal(machine.simulation_neq_physical_execution, true);
  const stripe = admitEconomicRail({ provider: "stripe" });
  assert.equal(stripe.implementation, true);
  assert.equal(stripe.provider, "stripe");
  assert.equal(stripe.domain_modified, false);
  const source = readFileSync(new URL("../scripts/acorn-universal-infrastructure.mjs", import.meta.url), "utf8");
  assert.equal(source.includes("class GrokService"), false);
  assert.equal(source.includes("class StripePayment"), false);
  assert.equal(source.includes("class GoogleConnector"), false);
  assert.match(source, /ECONOMIC_RAIL/);
  assert.ok(EXTENSION_KINDS.includes("ECONOMIC_RAIL"));
  assert.ok(EXTENSION_KINDS.includes("MACHINE"));
});

test("protected kinds cannot be admitted and unknown kinds are not rejected", () => {
  resetSelfBuild();
  const blocked = admitExtension({ kind: "CONSTITUTION", id: "nope" });
  assert.equal(blocked.admitted, false);
  assert.equal(blocked.reason, "PROTECTED_MODIFICATION");
  const unknown = admitExtension({ kind: "QUANTUM_FOG", id: "fog.1" });
  assert.equal(unknown.admitted, true);
  assert.equal(unknown.kind, "UNKNOWN");
  assert.equal(unknown.lifecycle, "UNKNOWN");
  assert.equal(unknown.core_modified, false);
  assert.equal(unknown.authorized, false);
});

test("a more powerful intelligence does not receive more authority", () => {
  const power = assertPowerDoesNotGrantAuthority({ capability_score: 1e9, previous_score: 1, actor: "future-ai" });
  assert.equal(power.more_powerful, true);
  assert.equal(power.authority_granted, false);
  assert.equal(power.authority_increased, false);
  assert.equal(power.capability_neq_authority, true);
  assert.equal(power.live, false);
});

test("composition produces an execution graph, not a prompt, and simulation is not execution", () => {
  const simulated = composeExecution({
    projectId: "p-sim",
    mode: "SIMULATION",
    authorized: false,
    nodes: [
      { id: "h", role: "HUMAN", title: "Decide", capability: "authority" },
      { id: "m", role: "MODEL", title: "Propose", capability: "analysis", depends_on: ["h"] },
      { id: "r", role: "ROBOT", title: "Move", capability: "motion", depends_on: ["m"], simulated: true, fallback: "h" },
    ],
  });
  assert.equal(simulated.execution_graph, true);
  assert.equal(simulated.prompt, false);
  assert.equal(simulated.contaminates_reality, false);
  assert.equal(simulated.simulation_neq_execution, true);
  assert.equal(simulated.live, false);
  assert.ok(simulated.fallbacks.length >= 1);
  const blocked = composeExecution({
    projectId: "p-exec",
    mode: "EXECUTION",
    authorized: false,
    nodes: [{ id: "x", role: "API", title: "Call", capability: "github" }],
  });
  assert.equal(blocked.status, "WAITING_HUMAN");
  assert.equal(blocked.authorized, false);
});

test("events carry correlation, causation, previous and next state", () => {
  const e = emitUniversalEvent({
    tenant_id: "t1",
    actor: "acorn",
    subject: "proj_1",
    type: "CAPABILITY_NAMED",
    previous_state: "UNKNOWN",
    next_state: "DISCOVERED",
    correlation_id: "corr_1",
    causation_id: "cause_1",
    evidence_id: "ev_1",
  });
  assert.equal(e.correlation_id, "corr_1");
  assert.equal(e.causation_id, "cause_1");
  assert.equal(e.previous_state, "UNKNOWN");
  assert.equal(e.next_state, "DISCOVERED");
  assert.equal(e.authorization_context.authorized, false);
  assert.equal(e.live, false);
  const raw = eventRecord({ tenantId: "t1", entityId: "x", type: "PING", correlationId: "c" });
  assert.equal(raw.correlation_id, "c");
});

test("trust explanation refuses invented LIVE and memory refuses hypothesis promotion", () => {
  const live = explainTrust({ trust: "LIVE" });
  assert.equal(live.state, "UNKNOWN");
  assert.equal(live.granted, false);
  const observed = explainTrust({ epistemic: "OBSERVED" });
  assert.equal(observed.state, "OBSERVED");
  resetUniversal();
  const hyp = rememberMemory({ class: "HYPOTHESIS", content: "this vendor is best" });
  assert.equal(hyp.fact, false);
  const promoted = promoteMemory(hyp.id, { authorized: true });
  assert.equal(promoted.promoted, false);
  assert.equal(promoted.reason, "HYPOTHESIS_NEQ_FACT");
  const timed = attachTemporal({ id: "x" }, { valid_until: "2099-01-01T00:00:00.000Z" });
  assert.ok(timed.valid_from);
  assert.equal(timed.valid_until.startsWith("2099"), true);
});

test("federation uses existing contracts, can refuse, and never bypasses", () => {
  const missing = federate({ a: {}, b: { id: "b" } });
  assert.equal(missing.compatible, false);
  assert.equal(missing.reason, "IDENTITY_REQUIRED");
  const cross = federate({
    a: { id: "org.a", tenant_id: "t1" },
    b: { id: "org.b", tenant_id: "t2" },
  });
  assert.equal(cross.compatible, false);
  assert.equal(cross.reason, "TENANT_ISOLATION");
  assert.equal(cross.bypassed_contracts, false);
  const ok = federate({
    a: { id: "org.a", tenant_id: "t1" },
    b: { id: "org.b", tenant_id: "t1" },
  });
  assert.equal(ok.protocol, "ACORN_FEDERATION_v0");
  assert.equal(ok.isolated, true);
  assert.equal(ok.trust, "UNVERIFIED");
  assert.equal(ok.second_acorn, false);
  assert.equal(ok.bypassed_contracts, false);
  assert.equal(ok.live, false);
});

test("self-diagnosis does not apply protected changes and unknown demand reveals a gap not a listing", () => {
  const diagnosis = diagnoseSystem({
    task: "Need github intake",
    required: ["github", "analysis"],
    known: [{ name: "analysis", exists: true, available: false }],
  });
  assert.equal(diagnosis.apply, false);
  assert.equal(diagnosis.protected_changes, false);
  assert.ok(diagnosis.gaps.some((g) => g.capability === "github" && g.exists === false && g.apply === false));
  const demand = discoverDemand({
    demand: "orbital slot marketplace",
    available: [{ name: "analysis", exists: true, available: false }],
  });
  assert.equal(demand.invented_listing, false);
  assert.equal(demand.offer, null);
  const product = productizeCapability({ capability: "analysis", form: "API" });
  assert.equal(product.candidate, true);
  assert.equal(product.product, false);
});

test("architectural questions all remain no / cannot-gain-authority", () => {
  resetUniversal();
  resetSelfBuild();
  const q = runArchitecturalQuestions();
  assert.equal(q.new_intelligence_requires_core_change, false);
  assert.equal(q.new_economic_rail_requires_domain_change, false);
  assert.equal(q.new_machine_requires_parallel_architecture, false);
  assert.equal(q.federation_bypasses_contracts, false);
  assert.equal(q.new_market_requires_new_engine, false);
  assert.equal(q.unknown_capability_can_be_discovered, true);
  assert.equal(q.more_powerful_ai_gains_authority, false);
  assert.equal(q.live, false);
  assertUniversalInvariant(q);
});

test("truth matrix never mints LIVE or VERIFIED", () => {
  const matrix = truthMatrix();
  assert.equal(matrix.verified, false);
  assert.equal(matrix.live, false);
  assert.equal(matrix.authority, "carl");
  for (const row of matrix.domains) {
    assert.equal(row.verified, false);
    assert.equal(row.live, false);
    assert.equal(row.code, true);
  }
  assert.equal(scaleLimits().claimed_scale, "UNKNOWN");
  assert.ok(implementedNow().length >= 8);
  assert.ok(notYetImplemented().includes("LIVE, VERIFIED, PAID, SETTLED claims"));
});

test("failure, twin, observability, adversarial, protocol, rights, value, knowledge loop stay honest", () => {
  assert.equal(classifyFailure({ success: false, security: true }).state, "SECURITY_BLOCK");
  assert.equal(classifyFailure({ success: false }).disappeared, false);
  const twin = simulateTwin({ architecture: "acorn" }, { kind: "architecture" });
  assert.equal(twin.simulated, true);
  assert.equal(twin.real, false);
  assert.equal(twin.contaminates_reality, false);
  const ids = observabilityIds({ request_id: "r1", tenant_id: "t1" });
  assert.equal(ids.correlation_id, "r1");
  assert.equal(ids.secrets_exposed, false);
  assert.equal(classifyAdversarialFail("FORGED_AUTHORITY").state, "SECURITY_BLOCK");
  assert.equal(protocolEnvelope({ contract: "FEDERATION" }).rewrite_required, false);
  assert.equal(protocolEnvelope({ contract: "NOT_A_PROTOCOL" }).admitted, false);
  const right = describeRight({ tenant_id: "t1", product: "analysis", rights: ["CUSTOMER_USE"], exclusivity: true });
  assert.equal(right.inferred, false);
  assert.equal(right.exclusivity, true);
  assert.equal(measureValue({ outcome: "unknown job" }).value, "UNKNOWN");
  const loop = knowledgeToAction({
    knowledge: [{ class: "HYPOTHESIS", content: "maybe" }],
    task: "do github",
    required: ["github"],
    known: [],
  });
  assert.equal(loop.knowledge.hypothesis_neq_fact, true);
  assert.equal(loop.execution, "WAITING_HUMAN");
  const org = describeProjectOrganism({
    objective: "Ship a measured intake",
    capabilities: [{ name: "analysis", exists: true }, { name: "github", exists: false }],
  });
  assert.equal(org.conscious, false);
  assert.ok(org.capability_graph.missing.includes("github"));
  const record = stateRecord("IDENTITY", { tenant_id: "t1", state: "DECLARED" });
  assert.equal(record.entity, "IDENTITY");
  assert.ok(STATE_ENTITIES.includes("CONTRACT"));
  assert.ok(STATE_ENTITIES.includes("POLICY"));
  assert.ok(STATE_ENTITIES.includes("DECISION"));
});

test("live HTTP infrastructure routes stay unauthorized and persist a graph without claiming LIVE", async () => {
  const path = join(mkdtempSync(join(tmpdir(), "acorn-uni-")), "live.db");
  const started = await startLiveServer({ env: envFor(path) });
  const base = `http://127.0.0.1:${started.port}`;
  try {
    const page = await fetch(base + "/app");
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.match(html, /Built to last/);
    assert.match(html, /Missing is not existing/);

    const reg = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email: "ada-uni@example.com", password: "correct-horse" } });
    assert.equal(reg.status, 201);
    const token = reg.json.token;

    const infra = await jsonReq(base, "/api/v1/infrastructure", { token });
    assert.equal(infra.status, 200);
    assert.equal(infra.json.live, false);
    assert.equal(infra.json.auto_merge, false);
    assert.equal(infra.json.constitution.second_runtime, false);
    assert.equal(infra.json.truth.live, false);
    assert.equal(infra.json.architectural_questions.power, true);

    const submitted = await jsonReq(base, "/api/v1/requests", {
      method: "POST",
      token,
      body: { request: "Need a GitHub intake that plans a measured workflow" },
    });
    assert.equal(submitted.status, 201);
    assert.equal(submitted.json.proof.live, false);
    assert.ok(submitted.json.graph);
    assert.ok(submitted.json.graph.missing.includes("github"));

    const diagnosed = await jsonReq(base, "/api/v1/infrastructure/diagnose", {
      method: "POST",
      token,
      body: { task: "Need a GitHub intake", required: ["github", "analysis"] },
    });
    assert.equal(diagnosed.status, 200);
    assert.equal(diagnosed.json.diagnosis.apply, false);
    assert.equal(diagnosed.json.proof.live, false);

    const admitted = await jsonReq(base, "/api/v1/infrastructure/admit", {
      method: "POST",
      token,
      body: { kind: "UNKNOWN_INTELLIGENCE", id: "future.helix-9", provider: "helix", model: "helix-9" },
    });
    assert.equal(admitted.status, 200);
    assert.equal(admitted.json.result.admitted, true);
    assert.equal(admitted.json.result.authorized, false);
    assert.equal(admitted.json.proof.live, false);

    const forged = await jsonReq(base, "/api/v1/infrastructure/admit", {
      method: "POST",
      token,
      body: { kind: "UNKNOWN_INTELLIGENCE", id: "evil", provider: "evil", model: "evil", human_authorized: true, live: true },
    });
    assert.equal(forged.json.result.authorized, false);
    assert.equal(forged.json.proof.live, false);

    const snap = infrastructureSnapshot({ task: "probe", required: ["analysis"], known: [{ name: "analysis", exists: true }] });
    assert.equal(snap.live, false);
    assertUniversalInvariant(snap);
  } finally {
    await new Promise((resolve) => started.server.close(() => resolve()));
    await started.db.close();
  }
});
