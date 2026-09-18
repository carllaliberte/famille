import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLiveDatabase } from "../live/database.mjs";
import { startLiveServer } from "../live/server.mjs";
import {
  SELF_BUILD_VERSION,
  SELF_BUILD_LOOP,
  BUILD_LIFECYCLE,
  SAFE_ZONES,
  EXTENSION_KINDS,
  AUTONOMY_CEILING_WITHOUT_CARL,
  selfBuildConstitution,
  selfBuildProbe,
  assertLifecycleTransition,
  capabilityGap,
  detectGaps,
  proposeBuild,
  advanceLifecycle,
  falsifyCapability,
  measureCapability,
  discoverDependencies,
  registerQualified,
  admitExtension,
  resetSelfBuild,
  selfKnowledgeView,
  runSelfBuildLoop,
  assertSelfBuildInvariant,
  implementedNow,
  notYetImplemented,
  autonomyLevel,
  assertAutonomy,
  escalateAutonomy,
  learnFromLoop,
  proposeRepair,
  proposeImprovement,
  productCandidate,
  classifyWork,
  howAcornBuilds,
} from "../scripts/acorn-self-build.mjs";
import { operateProblem, describeCapability, futureProofContract } from "../scripts/acorn-operational-fabric.mjs";
import { registerEvidence } from "../scripts/acorn-evidence-registry.mjs";
import { resolveTool } from "../scripts/tool-resolve.mjs";

function envFor(path) {
  return { ACORN_DB_ADAPTER: "sqlite", ACORN_DB: path, NODE_ENV: "test", HOST: "127.0.0.1", PORT: "0" };
}

async function jsonReq(base, path, { method = "GET", token, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.authorization = "Bearer " + token;
  const res = await fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: res.status, json: await res.json() };
}

test("constitution refuses a second architecture and keeps Carl as authority", () => {
  const c = selfBuildConstitution();
  assert.equal(c.second_architecture, false);
  assert.equal(c.second_cortex, false);
  assert.equal(c.second_registry, false);
  assert.equal(c.second_runtime, false);
  assert.equal(c.capability_neq_authority, true);
  assert.equal(c.gap_detected_neq_exists, true);
  assert.equal(c.auto_merge, false);
  assert.equal(c.live, false);
  assert.equal(c.authority, "carl");
  assert.equal(c.merge, "carl");
  assert.equal(selfBuildProbe().live, false);
  assert.equal(SELF_BUILD_LOOP[0], "OBSERVE");
  assert.equal(SELF_BUILD_LOOP.at(-1), "LEARN");
  assert.equal(BUILD_LIFECYCLE[0], "UNKNOWN");
  assert.ok(SAFE_ZONES.includes("PRODUCTION"));
  assert.ok(EXTENSION_KINDS.includes("INTELLIGENCE"));
  assert.equal(c.autonomy_cannot_self_escalate, true);
  assert.equal(c.autonomy_ceiling_without_carl, "L2");
});

test("gap detected is never treated as capability exists", () => {
  const gap = capabilityGap({ task: "Need a brand-new-meter", capability: "brand-new-meter" });
  assert.equal(gap.status, "MISSING");
  assert.equal(gap.exists, false);
  assert.equal(gap.available, false);
  assert.equal(gap.reason, "GAP_DETECTED");
  assert.equal(gap.gap_detected_neq_exists, true);
  assert.equal(gap.live, false);
  assert.notEqual(gap.status, "EXISTS");
});

test("named known code is CODE_PRESENT, not available, not authorized, not live", () => {
  const row = capabilityGap({
    capability: "analysis",
    known: [{ name: "analysis", exists: true, available: false, reason: "CODE_PRESENT" }],
  });
  assert.equal(row.status, "EXISTS");
  assert.equal(row.exists, true);
  assert.equal(row.available, false);
  assert.equal(row.authorized, false);
  assert.equal(row.live, false);
});

test("existing module is reused rather than rebuilt", () => {
  assert.equal(resolveTool({ name: "evidence-seal" }).decision, "REUSE");
  const row = capabilityGap({ capability: "evidence-seal" });
  assert.equal(row.status, "EXISTS");
  assert.equal(row.exists, true);
  assert.equal(row.available, false);
  assert.equal(row.reason, "CODE_PRESENT");
  const proposal = proposeBuild(row);
  assert.equal(proposal.status, "REUSE");
  assert.equal(proposal.rebuild, false);
});

test("secret and merge capabilities stop at HUMAN_HOLD", () => {
  assert.equal(capabilityGap({ capability: "openai-secret" }).status, "HUMAN_HOLD");
  assert.equal(capabilityGap({ capability: "merge" }).status, "HUMAN_HOLD");
  assert.equal(capabilityGap({ task: "change wrangler bind", capability: "deploy" }).status, "HUMAN_HOLD");
});

test("lifecycle cannot skip states silently", () => {
  assert.deepEqual(assertLifecycleTransition("UNKNOWN", "DISCOVERED"), { from: "UNKNOWN", to: "DISCOVERED", skipped: false });
  assert.throws(() => assertLifecycleTransition("UNKNOWN", "BUILT"), /LIFECYCLE_SKIP_FORBIDDEN/);
  assert.throws(() => assertLifecycleTransition("PROPOSED", "VERIFIED"), /LIFECYCLE_SKIP_FORBIDDEN/);
  assert.throws(() => advanceLifecycle({ lifecycle: "PROPOSED" }, "BUILT"), /LIFECYCLE_SKIP_FORBIDDEN/);
  const designed = advanceLifecycle({ lifecycle: "PROPOSED", authorized: false }, "DESIGNED");
  assert.equal(designed.lifecycle, "DESIGNED");
  assert.equal(designed.authorized, false);
});

test("TEST GENERATED is not TEST PASSED", () => {
  const generated = falsifyCapability({
    claim: "new-adapter",
    tests: [{ name: "unit", generated: true, executed: false, passed: false }],
  });
  assert.equal(generated.insufficient_evidence, true);
  assert.equal(generated.tests_executed, 0);
  assert.equal(generated.test_generated_neq_test_passed, true);
  assert.ok(["INSUFFICIENT_EVIDENCE", "FALSIFIED_OR_INCOMPLETE"].includes(generated.status));
  assert.throws(
    () => advanceLifecycle({ lifecycle: "BUILT" }, "TESTED", { evidence: { tests_executed: false } }),
    /TEST_GENERATED_IS_NOT_TEST_PASSED/
  );
});

test("INSUFFICIENT_EVIDENCE is a valid falsification result", () => {
  const r = falsifyCapability({ claim: "unmeasured", tests: [], evidence: [] });
  assert.equal(r.status, "INSUFFICIENT_EVIDENCE");
  assert.equal(r.live, false);
});

test("measurement refuses invented metrics", () => {
  const empty = measureCapability({ observations: [] });
  assert.equal(empty.status, "INSUFFICIENT_EVIDENCE");
  assert.equal(empty.observed, false);
  assert.equal(empty.invented, false);
  const started = "2026-09-18T12:00:00.000Z";
  const ended = "2026-09-18T12:00:00.040Z";
  const measured = measureCapability({
    observations: [{ success: true }, { success: false }],
    started_at: started,
    ended_at: ended,
  });
  assert.equal(measured.status, "MEASURED");
  assert.equal(measured.observed, true);
  assert.equal(measured.sample_count, 2);
  assert.equal(measured.success_rate, 0.5);
  assert.equal(measured.duration_ms, 40);
  assert.equal(measured.live, false);
});

test("qualified registration does not grant authority or LIVE", () => {
  const ev = registerEvidence({
    claim: "self-build:demo",
    source: "test",
    strength: 1,
    margin: 0.1,
    validUntil: new Date(Date.now() + 60000).toISOString(),
  });
  const denied = registerQualified({ lifecycle: "BUILT", capability: "demo" }, { evidence: [ev] });
  assert.equal(denied.registered, false);
  const ok = registerQualified({ lifecycle: "VERIFIED", capability: "demo" }, { evidence: [ev] });
  assert.equal(ok.registered, true);
  assert.equal(ok.authorized, false);
  assert.equal(ok.available, false);
  assert.equal(ok.live, false);
  assert.equal(ok.ready_neq_authorized, true);
});

test("dependency cycles and depth limits stop the build", () => {
  const cycle = discoverDependencies({
    capability: "a",
    depends_on: ["b"],
    graph: { b: ["a"] },
  });
  assert.equal(cycle.status, "CYCLE_DETECTED");
  assert.equal(cycle.stop, true);
  const deep = discoverDependencies({ capability: "x", depends_on: ["y"], depth: 4, max_depth: 4 });
  assert.equal(deep.status, "HUMAN_HOLD");
  assert.equal(deep.reason, "DEPTH_LIMIT");
});

test("production zone cannot be used as a build target", async () => {
  const result = await runSelfBuildLoop({
    task: "write into production",
    required: ["brand-new-meter"],
    zone: "PRODUCTION",
  });
  assert.equal(result.status, "HUMAN_HOLD");
  assert.equal(result.reason, "PRODUCTION_WRITE_FORBIDDEN");
  assert.equal(result.live, false);
});

test("self-build loop reuses existing analysis and proposes a missing tool without using it", async () => {
  const result = await runSelfBuildLoop({
    task: "Measure a missing meter",
    required: ["analysis", "brand-new-meter"],
    known: [{ name: "analysis", exists: true, available: false, reason: "CODE_PRESENT" }],
  });
  assertSelfBuildInvariant(result);
  assert.equal(result.live, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.used, false);
  assert.equal(result.authorized, false);
  assert.ok(result.detection.found.some((row) => row.capability === "analysis"));
  const gap = result.detection.gaps.find((row) => row.capability === "brand-new-meter");
  assert.equal(gap.exists, false);
  assert.equal(gap.status, "MISSING");
  assert.equal(result.status, "GAP_DETECTED");
  assert.ok(result.proposals.some((row) => row.record.lifecycle === "DESIGNED" || row.record.lifecycle === "PROPOSED"));
  assert.ok(result.phases.some((p) => p.phase === "FALSIFY" && p.status === "INSUFFICIENT_EVIDENCE"));
  assert.ok(result.phases.some((p) => p.phase === "LEARN" && p.promoted === false));
  assert.equal(result.learned.recorded, true);
  assert.equal(result.learned.promoted, false);
  assert.equal(result.autonomy.code, "L1");
});

test("an executed tester can advance to VERIFIED without authorizing use", async () => {
  const dir = mkdtempSync(join(tmpdir(), "acorn-self-build-"));
  const result = await runSelfBuildLoop({
    task: "Build a local probe",
    required: ["local-probe"],
    zone: "BUILD",
    builder: async ({ gap }) => {
      const path = join(dir, gap.capability + ".mjs");
      writeFileSync(path, "export const probe = () => ({ ok: true, live: false });\n");
      return { written: true, path };
    },
    tester: async ({ record }) => {
      const source = readFileSync(record.implementation, "utf8");
      const passed = source.includes("live: false") && source.includes("export const probe");
      return { name: "source-contract", generated: false, executed: true, passed };
    },
  });
  assertSelfBuildInvariant(result);
  const row = result.proposals[0];
  assert.equal(row.record.lifecycle, "VERIFIED");
  assert.equal(row.registered.registered, true);
  assert.equal(row.registered.authorized, false);
  assert.equal(result.used, false);
  assert.equal(result.live, false);
});

test("UNKNOWN remains first-class in self-knowledge", () => {
  const view = selfKnowledgeView({ exists: false, knowledge: "UNKNOWN", lifecycle: "DISCOVERED" });
  assert.equal(view.UNKNOWN, true);
  assert.equal(view.KNOW, false);
  assert.equal(view.VERIFIED, false);
  assert.equal(view.live, false);
});

test("future intelligence, capability, connector and workflow can be admitted without modifying the core", () => {
  resetSelfBuild();
  const adapter = {
    detect() { return { status: "DISCOVERED" }; },
    propose() { return { status: "PROPOSED" }; },
    test() { return { executed: false }; },
    measure() { return { observed: false }; },
  };
  const intelligence = admitExtension({ kind: "INTELLIGENCE", id: "future.helix-9", adapter });
  const capability = admitExtension({ kind: "CAPABILITY", id: "future.optical-routing", adapter });
  const connector = admitExtension({ kind: "CONNECTOR", id: "future.field-bus", adapter });
  const workflow = admitExtension({ kind: "WORKFLOW", id: "future.long-horizon", adapter });
  for (const row of [intelligence, capability, connector, workflow]) {
    assert.equal(row.admitted, true);
    assert.equal(row.core_modified, false);
    assert.equal(row.authorized, false);
    assert.equal(row.live, false);
    assert.equal(row.lifecycle, "DISCOVERED");
  }
  const source = readFileSync(new URL("../scripts/acorn-self-build.mjs", import.meta.url), "utf8");
  assert.match(source, /admitExtension/);
  assert.equal(source.includes("future.helix-9"), false);
  assert.equal(source.includes("future.optical-routing"), false);
  assert.equal(source.includes("future.field-bus"), false);
  assert.equal(source.includes("future.long-horizon"), false);
});

test("operateProblem no longer pretends proposed capabilities exist", () => {
  const operated = operateProblem({
    tenantId: "t1",
    customerId: "c1",
    problem: "Need a GitHub intake that plans a measured workflow",
    requestId: "req_demo",
  });
  const github = operated.capabilities.find((c) => c.name === "github");
  assert.ok(github);
  assert.equal(github.exists, false);
  assert.equal(github.available, false);
  assert.equal(github.authorized, false);
  assert.equal(github.state, "ABSENT");
  const analysis = operated.capabilities.find((c) => c.name === "analysis");
  assert.equal(analysis.exists, true);
  assert.equal(analysis.available, false);
  assert.ok(operated.gaps.some((g) => g.capability === "github"));
  assert.equal(operated.proof.live, false);
  assert.equal(operated.proof.capability_is_not_authority, true);
});

test("describeCapability still refuses implicit authorization", () => {
  const cap = describeCapability({ name: "github", exists: true, available: true, authorized: true, executed: true, verified: true });
  assert.equal(cap.authorized, false);
  assert.equal(cap.executed, false);
  assert.equal(cap.verified, false);
});

test("schema forbids LIVE and auto-merge constants", () => {
  const schema = JSON.parse(readFileSync(new URL("../schema/acorn-self-build.v0.json", import.meta.url), "utf8"));
  assert.equal(schema.title, "famille.acorn-self-build.v0");
  assert.equal(schema.properties.live.const, false);
  assert.equal(schema.properties.auto_merge.const, false);
  assert.equal(schema.properties.authority.const, "carl");
});

test("implemented-now and not-yet lists stay honest", () => {
  assert.ok(implementedNow().includes("capability gap detection"));
  assert.ok(implementedNow().includes("howAcornBuilds transfer contract"));
  assert.ok(notYetImplemented().includes("self-merge"));
  assert.ok(notYetImplemented().includes("LIVE claims from local construction"));
  const contract = futureProofContract();
  assert.match(contract.items["nouveau type de capacite"].reason, /self-build/);
});

test("autonomy cannot self-escalate to L6 or L7", () => {
  assert.equal(autonomyLevel("L1").code, "L1");
  assert.equal(AUTONOMY_CEILING_WITHOUT_CARL, "L2");
  const skip = escalateAutonomy({ from: "L1", to: "L6" });
  assert.equal(skip.granted, false);
  assert.equal(skip.status, "HUMAN_HOLD");
  const self = escalateAutonomy({ from: "L2", to: "L3", authorized: false });
  assert.equal(self.granted, false);
  assert.equal(self.reason, "AUTONOMY_CANNOT_SELF_ESCALATE");
  const l6 = assertAutonomy("execute_authorized", { level: "L6", authorized: false });
  assert.equal(l6.stop, true);
  assert.equal(l6.status, "HUMAN_HOLD");
  const propose = assertAutonomy("propose", { level: "L1" });
  assert.equal(propose.allowed, true);
});

test("LEARN records and does not promote or authorize", () => {
  const learned = learnFromLoop({ task: "meter", gaps: ["brand-new-meter"], used: false });
  assert.equal(learned.recorded, true);
  assert.equal(learned.promoted, false);
  assert.equal(learned.replaced, false);
  assert.equal(learned.authorized, false);
  assert.equal(learned.learning_equals_authority, false);
});

test("repair proposes and never deploys", () => {
  const repair = proposeRepair({ failure: "transient 503", failure_class: "TRANSIENT" });
  assert.equal(repair.status, "PROPOSED");
  assert.equal(repair.deploy, false);
  assert.equal(repair.auto_merge, false);
  assert.equal(repair.live, false);
  const secret = proposeRepair({ failure: "rotate production secret" });
  assert.equal(secret.status, "HUMAN_HOLD");
});

test("improvement cannot silently replace a critical capability", () => {
  const hold = proposeImprovement({ capability: "evidence", current_is_critical: true });
  assert.equal(hold.status, "HUMAN_HOLD");
  assert.equal(hold.replaced, false);
  const proposed = proposeImprovement({ capability: "routing-hint", observation: "high cost" });
  assert.equal(proposed.status, "PROPOSED");
  assert.equal(proposed.promoted, false);
  assert.equal(proposed.replaced, false);
});

test("product candidate is not a product", () => {
  const once = productCandidate({ repeats: 1, problem: "intake" });
  assert.equal(once.status, "INSUFFICIENT_EVIDENCE");
  assert.equal(once.product, false);
  const many = productCandidate({ repeats: 3, problem: "intake", solution: "qualify-plan-verify" });
  assert.equal(many.status, "PRODUCT_CANDIDATE");
  assert.equal(many.product, false);
  assert.equal(many.product_candidate_neq_product, true);
  assert.equal(many.economic_value_measured, false);
});

test("howAcornBuilds is an explicit transferable contract", () => {
  const how = howAcornBuilds();
  assert.equal(how.steps.length, 13);
  assert.equal(how.steps[0].name, "understand");
  assert.equal(how.steps.at(-1).name, "again");
  assert.equal(how.single_model_dependency, false);
  assert.equal(how.live, false);
  assert.equal(how.auto_merge, false);
  assert.equal(how.authority, "carl");
  assert.ok(how.cannot.includes("merge"));
  assert.equal(how.autonomy.ceiling_without_carl, "L2");
  assert.equal(classifyWork("self-build-loop"), "IMPLEMENT_NOW");
  assert.equal(classifyWork("merge"), "HUMAN_HOLD");
  assert.equal(classifyWork("webhooks"), "FOUNDATION_NOW");
});

test("example extension admits a future intelligence without rewriting the core", async () => {
  const { demonstrateExtension } = await import("../examples/self-build-extension.mjs");
  const demo = await demonstrateExtension();
  assert.equal(demo.admitted.admitted, true);
  assert.equal(demo.admitted.core_modified, false);
  assert.equal(demo.used, false);
  assert.equal(demo.authorized, false);
  assert.equal(demo.live, false);
  assert.equal(demo.how.length, 13);
});

test("live customer request persists gaps honestly and self-build observe stays unauthoritative", async () => {
  const dir = mkdtempSync(join(tmpdir(), "acorn-sb-http-"));
  const path = join(dir, "state.db");
  const started = await startLiveServer({ env: envFor(path) });
  const base = `http://127.0.0.1:${started.port}`;
  try {
    const html = await fetch(base + "/app");
    assert.equal(html.status, 200);
    const page = await html.text();
    assert.match(page, /Describe the problem/);
    assert.match(page, /Missing is not existing/);

    const reg = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Ada", email: "ada-sb@example.com", password: "correct-horse" } });
    assert.equal(reg.status, 201);
    const token = reg.json.token;

    const contract = await jsonReq(base, "/api/v1/self-build", { token });
    assert.equal(contract.status, 200);
    assert.equal(contract.json.live, false);
    assert.equal(contract.json.auto_merge, false);
    assert.equal(contract.json.constitution.second_architecture, false);
    assert.ok(Array.isArray(contract.json.not_yet_implemented));

    const submitted = await jsonReq(base, "/api/v1/requests", {
      method: "POST",
      token,
      body: { request: "Need a GitHub intake that plans a measured workflow" },
    });
    assert.equal(submitted.status, 201);
    assert.equal(submitted.json.proof.live, false);
    assert.ok(submitted.json.gaps.some((g) => g.capability === "github"));
    const github = submitted.json.capabilities.find((c) => c.name === "github");
    assert.equal(github.exists, false);
    assert.equal(github.available, false);

    const observed = await jsonReq(base, "/api/v1/self-build/observe", {
      method: "POST",
      token,
      body: { task: "Need a GitHub intake", required: ["github", "analysis"] },
    });
    assert.equal(observed.status, 200);
    assert.equal(observed.json.result.used, false);
    assert.equal(observed.json.result.authorized, false);
    assert.equal(observed.json.proof.live, false);
    assert.ok(observed.json.result.detection.gaps.some((g) => g.capability === "github"));
    assert.equal(observed.json.result.learned.promoted, false);
    assert.equal(observed.json.proof.promoted, false);

    const repair = await jsonReq(base, "/api/v1/self-build/repair", {
      method: "POST",
      token,
      body: { failure: "connector timeout", failure_class: "TRANSIENT" },
    });
    assert.equal(repair.status, 200);
    assert.equal(repair.json.repair.deploy, false);
    assert.equal(repair.json.proof.auto_merge, false);

    const other = await jsonReq(base, "/api/v1/register", { method: "POST", body: { name: "Bea", email: "bea-sb@example.com", password: "correct-horse" } });
    const stolen = await jsonReq(base, "/api/v1/requests/" + submitted.json.request.id, { token: other.json.token });
    assert.equal(stolen.status, 404);
  } finally {
    started.server.close();
    await started.db.close();
  }
});
