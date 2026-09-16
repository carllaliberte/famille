import test from "node:test";
import assert from "node:assert/strict";
import {
  architectureLibrary,
  classifyTask,
  compareArchitectures,
  cognitiveAutopsy,
  cognitiveConfidence,
  detectCollusion,
  detectRegression,
  generateArchitectures,
  independenceGraph,
  mutateArchitecture,
  rememberPattern,
  routeModality,
  runArchitectureEngine,
  runEcosystemCycle,
  safeEvolve,
  selectArchitecture,
  timeMachine,
  versionCortex,
} from "../scripts/cortex-ecosystem.mjs";
import { runOrganismCycle } from "../scripts/cortex-organism.mjs";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";

const nodes = [
  { id: "worker", kind: "executor", capabilities: ["review"], presence: "ACTIVE" },
  { id: "cortex-local", kind: "local", capabilities: ["review", "cognitive-cycle"], presence: "ACTIVE" },
  { id: "reviewer", kind: "verifier", capabilities: ["review"], presence: "CONNECTED" },
  { id: "xai", kind: "llm", capabilities: ["review"], presence: "DECLARED", cost: "paid" },
  { id: "carl", kind: "human", capabilities: ["judgment", "authority"] },
];

test("unknown task is classified without pretending to know the model", () => {
  const task = classifyTask({ objective: "unforeseen collective review" });
  assert.equal(task.class, "unknown");
  assert.ok(task.required.includes("review"));
  assert.equal(task.live, false);
});

test("architecture search generates A/B/C and never auto-adopts", () => {
  const generated = generateArchitectures({ class: "unknown", nodes, required: ["review"], budget: { money: 0 } });
  assert.equal(generated.candidates.length, 3);
  assert.equal(generated.auto_adopt, false);
  assert.equal(generated.candidates[0].better_in_general, false);
  assert.ok(generated.candidates.every((row) => row.authority === "carl"));
});

test("zero-cost mode excludes paid nodes", () => {
  const generated = generateArchitectures({
    class: "verification", nodes, required: ["review"], budget: { money: 0 }, policy: "PAID_FORBIDDEN",
  });
  const ids = generated.candidates.flatMap((row) => row.nodes.map((n) => n.identity));
  assert.equal(ids.includes("xai"), false);
  assert.ok(ids.includes("cortex-local"));
});

test("A/B comparison is contextual, dated, and never better-in-general", () => {
  const generated = generateArchitectures({ class: "verification", nodes, required: ["review"] });
  const compared = compareArchitectures({
    a: generated.candidates[0],
    b: generated.candidates[2],
    measurements: { measured: true, context: "verification", a: { error: 1 }, b: { error: 0 } },
    at: "2026-09-16T22:40:00.000Z",
  });
  assert.equal(compared.verdict, "B_BETTER_IN_CONTEXT");
  assert.equal(compared.better_in_general, false);
  assert.equal(compared.dated, true);
  assert.equal(compared.contextual, true);
  assert.equal(compared.reversible, true);
});

test("unmeasured architecture is not stored as eternal pattern", () => {
  const generated = generateArchitectures({ class: "research", nodes, required: ["review"] });
  const skipped = rememberPattern({ architecture: generated.candidates[0], context: "research", measured: false });
  assert.equal(skipped.status, "INCONCLUSIVE");
  const stored = rememberPattern({ architecture: generated.candidates[0], context: "research", measured: true });
  assert.equal(stored.pattern.better_in_general, false);
  assert.equal(architectureLibrary([stored.pattern]).truth_eternal, undefined);
  assert.equal(architectureLibrary([stored.pattern]).reversible, true);
});

test("mutation is a hypothesis; unverified evolution does not adopt", () => {
  const generated = generateArchitectures({ class: "debugging", nodes, required: ["review"] });
  const mutated = mutateArchitecture(generated.candidates[1], { op: "ADD_VERIFIER" });
  assert.equal(mutated.status, "PROPOSED");
  assert.equal(mutated.hypothesis, true);
  assert.equal(mutated.adopted, false);
  const evolved = safeEvolve({
    baseline: generated.candidates[1],
    candidate: mutated.mutation,
    verification: { verified: false },
  });
  assert.equal(evolved.adopted, false);
  assert.equal(evolved.auto_merge, false);
});

test("correlated answers are not independent proof", () => {
  const graph = independenceGraph(nodes, [{ source: "worker", target: "reviewer" }]);
  const collusion = detectCollusion({
    answers: [{ what: "path-ok" }, { what: "path-ok" }],
    graph,
  });
  assert.equal(collusion.correlated_reasoning, true);
  assert.equal(cognitiveConfidence({ agreement: 2, independent: false }).correlated_agreement_is_not_proof, true);
  assert.equal(cognitiveConfidence({ agreement: 2 }).single_number, null);
});

test("regression blocks adoption; autopsy without evidence stays INCONCLUSIVE", () => {
  const regression = detectRegression({
    before: { architecture_id: "arch_local" },
    after: { architecture_id: "arch_paid" },
    beforeMetrics: { error: 0 },
    afterMetrics: { error: 1, degraded: true },
  });
  assert.equal(regression.status, "REGRESSION");
  assert.equal(regression.adopt, false);
  assert.equal(cognitiveAutopsy({ task: "review" }).verdict, "INCONCLUSIVE");
});

test("multimodal gap is HOLD_HUMAN, not a fake vision node", () => {
  const routed = routeModality({ modality: "image", nodes });
  assert.equal(routed.status, "HOLD_HUMAN");
  assert.deepEqual(routed.missing, ["vision"]);
  assert.equal(routed.live, false);
});

test("time machine reconstructs a snapshot without minting LIVE", () => {
  const past = timeMachine({
    at: "2026-09-01T00:00:00.000Z",
    snapshot: { architecture: { architecture_id: "arch_local" }, evidence: { v: "cognitive-worker.v14" } },
  });
  assert.equal(past.status, "EXECUTED");
  assert.equal(past.live, false);
  assert.equal(versionCortex({ architecture: { architecture_id: "arch_local" } }).second_cortex, false);
});

test("ultimate 15-step scenario: unknown task, error, recompose, remember, no extra authority", () => {
  const first = runArchitectureEngine({
    task: { objective: "unknown collective review" },
    nodes,
    workerEvidence: { v: "cognitive-worker.v14" },
    fail: true,
    budget: { money: 0 },
    policy: "PAID_FORBIDDEN",
    at: "2026-09-16T22:40:00.000Z",
  });
  assert.equal(first.classified.class, "unknown");
  assert.ok(first.generated.candidates.length >= 3);
  assert.equal(first.selected.adopted, false);
  assert.equal(first.executed.ok, false);
  assert.ok(first.failure.kind);
  assert.equal(first.autopsy.verdict, "INCONCLUSIVE");
  assert.equal(first.mutated.op, "ADD_VERIFIER");
  assert.equal(first.compared.better_in_general, false);
  assert.equal(first.compared.verdict, "B_BETTER_IN_CONTEXT");
  assert.equal(first.remembered.status, "EXECUTED");
  assert.equal(first.next_route.adopted, false);
  assert.equal(first.evolved.adopted, false);
  assert.equal(first.authority_granted, false);
  assert.equal(first.traceable, true);
  assert.equal(first.resources.zero_cost, true);
  assert.equal(first.live, false);

  const second = runArchitectureEngine({
    task: { objective: "unknown collective review" },
    nodes,
    workerEvidence: { v: "cognitive-worker.v14" },
    fail: false,
    library: first.library.patterns,
    budget: { money: 0 },
    at: "2026-09-16T22:41:00.000Z",
  });
  assert.equal(second.executed.ok, true);
  assert.equal(second.selected.architecture.better_in_general, false);
  assert.equal(second.authorize.ok, true);
  assert.equal(second.authority_granted, false);
});

test("pattern memory can prefer a measured architecture next time, still not adopted", () => {
  const generated = generateArchitectures({ class: "verification", nodes, required: ["review"] });
  const stored = rememberPattern({ architecture: generated.candidates[0], context: "verification", measured: true });
  const selected = selectArchitecture({
    candidates: generated.candidates,
    library: [stored.pattern],
    measured: true,
    class: "verification",
  });
  assert.equal(selected.reused_pattern, true);
  assert.equal(selected.adopted, false);
  assert.equal(selected.architecture.architecture_id, "arch_local");
});

test("organism and runtime carry the architecture engine without LIVE", () => {
  const organism = runOrganismCycle({
    workerEvidence: { v: "cognitive-worker.v14" },
    agents: [{ id: "worker", capabilities: ["review"] }],
    fluidity: { state: "FLOWING", property: { silent_stop: false } },
  });
  assert.equal(organism.ecosystem.architecture.status, "EXECUTED");
  assert.equal(organism.ecosystem.architecture.better_in_general, false);
  assert.equal(organism.ecosystem.architecture.authority_granted, false);
  const runtime = runCortexRuntime({
    workerEvidence: {
      v: "cognitive-worker.v14",
      verified: true,
      dispatches: [{ number: 632, sha: "abc", state: "VERIFIED" }],
      truth: { ACTION_VERIFIED: true },
    },
    agents: [{ id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" }],
    fluidity: { state: "FLOWING", property: { silent_stop: false, hint_consumed: true } },
    at: "2026-09-16T22:42:00.000Z",
  });
  assert.equal(runtime.organism.ecosystem.architecture.traceable, true);
  assert.equal(runtime.live, false);
  assert.equal(runtime.auto_merge, false);
  assert.equal(runEcosystemCycle({ workerEvidence: { v: "cognitive-worker.v14" }, agents: nodes }).architecture.versions.second_cortex, false);
});
