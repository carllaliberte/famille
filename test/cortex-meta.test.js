import test from "node:test";
import assert from "node:assert/strict";
import {
  cognitiveSelfModel,
  knowledgeVsExperience,
  metaHomeostasis,
  proposeCuriousExperiment,
  representUnknown,
  runCognitiveExperiment,
  runMetaEvolution,
  searchArchitectureSpace,
  selfDiagnostic,
  selfImprove,
  slot,
  whatIf,
} from "../scripts/cortex-meta.mjs";
import { runOrganismCycle } from "../scripts/cortex-organism.mjs";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";

test("self-model uses epistemic slots and never auto-promotes UNKNOWN to KNOWN", () => {
  const model = cognitiveSelfModel({ adaptive: { protocol: { state: "UNKNOWN" }, adapter: { status: "PROPOSED" } } });
  assert.equal(model.state.authority.epistemic, "KNOWN");
  assert.equal(model.state.authority.value, "carl");
  assert.equal(model.state.live_claim.value, false);
  assert.equal(model.promotions_forbidden.unknown_to_known, false);
  assert.equal(model.promotions_forbidden.inferred_to_fact, false);
  assert.equal(slot(null, "UNKNOWN").epistemic, "UNKNOWN");
  assert.equal(model.live, false);
});

test("self-diagnostic is evidence-linked, not a narrative opinion", () => {
  const diag = selfDiagnostic(cognitiveSelfModel({}));
  assert.equal(diag.narrative, false);
  assert.ok(diag.questions.WHAT_CAN_I_NOT_VERIFY.answer.includes("paid_http"));
  assert.equal(diag.questions.WHERE_AM_I_DEPENDENT.answer.includes("merge"), true);
  assert.equal(diag.questions.WHAT_CAN_I_VERIFY.epistemic, "MEASURED");
});

test("unknown space types an unknown without forcing a classification", () => {
  const u = representUnknown({ kind: "UNKNOWN_PROTOCOL", what: "FUTURE-PROTOCOL-X" });
  assert.equal(u.kind, "UNKNOWN_PROTOCOL");
  assert.equal(u.forced, false);
  assert.equal(u.unknown_is_not_failure, true);
  assert.equal(representUnknown({ kind: "not-a-kind" }).kind, "UNKNOWN_DIMENSION");
});

test("architecture search adds candidates D–G and declares no winner", () => {
  const search = searchArchitectureSpace({ class: "unknown" });
  assert.ok(search.candidates.length >= 7);
  assert.ok(search.candidates.some((row) => row.architecture_id === "arch_simulate_learn"));
  assert.equal(search.winner, null);
  assert.equal(search.auto_adopt, false);
});

test("cognitive experiment failure is data and is not adopted", () => {
  const search = searchArchitectureSpace({});
  const ran = runCognitiveExperiment({
    experiment: {
      experiment_id: "exp_test",
      baseline_architecture: search.candidates[0],
      candidate_architecture: search.candidates[1],
      task: "review",
    },
    workerEvidence: { v: "cognitive-worker.v14" },
    fail: true,
  });
  assert.equal(ran.adopted, false);
  assert.equal(ran.rejected, true);
  assert.equal(ran.failure_is_data, true);
  assert.equal(ran.fake_success, false);
});

test("counterfactual is not observed reality", () => {
  const cf = whatIf({ question: "what if verifier unavailable", snapshot: { architecture: { architecture_id: "arch_local" } } });
  assert.equal(cf.counterfactual, true);
  assert.equal(cf.observed_reality, false);
});

test("curiosity proposal does not claim usefulness without justification", () => {
  const p = proposeCuriousExperiment({ unknowns: [{ region: "UNKNOWN", kind: "UNKNOWN_CAUSALITY" }], cost: 0 });
  assert.equal(p.useful_claimed_without_justification, false);
  assert.equal(p.status, "PROPOSED");
});

test("self-improvement can be rejected; self-propose is not self-authorize", () => {
  const loop = selfImprove({ limitation: "prediction_error_high", workerEvidence: { v: "cognitive-worker.v14" } });
  assert.equal(loop.self_propose, true);
  assert.equal(loop.self_authorize, false);
  assert.equal(loop.rejected, true);
  assert.equal(loop.adopted, false);
  assert.equal(loop.learned.status, "LEARNED");
});

test("knowledge is not experience; homeostasis slows too many experiments", () => {
  const kx = knowledgeVsExperience({ beliefs: [{ value: "x", epistemic: "HYPOTHESIZED" }], events: [{ what: "cycle" }] });
  assert.equal(kx.belief_is_not_experience, true);
  assert.equal(kx.experience_is_not_causality, true);
  assert.equal(metaHomeostasis({ experiments: 9 }).state, "UNSTABLE");
  assert.equal(metaHomeostasis({ experiments: 9 }).slow, true);
});

test("meta evolution on organism/runtime stays zero-cost, no second Cortex, no LIVE", () => {
  const meta = runMetaEvolution({
    workerEvidence: { v: "cognitive-worker.v14" },
    adaptive: { protocol: { state: "UNKNOWN_BUT_NEGOTIABLE" }, immune: { untrusted: true, healthy: true } },
  });
  assert.equal(meta.winner, null);
  assert.equal(meta.second_cortex, false);
  assert.equal(meta.gates.merge, false);
  assert.equal(meta.gates.self_authorize, false);
  assert.equal(meta.improved.rejected, true);
  assert.equal(meta.counterfactual.counterfactual, true);
  assert.equal(meta.zero_cost, true);
  assert.equal(meta.live, false);
  const organism = runOrganismCycle({
    workerEvidence: { v: "cognitive-worker.v14" },
    agents: [{ id: "worker", capabilities: ["review"] }],
    fluidity: { state: "FLOWING", property: { silent_stop: false } },
    languageInput: { text: "⊞⊸λ", declared: "FUTURE-LANG-X" },
  });
  assert.equal(organism.meta.unknown.kind, "UNKNOWN_DIMENSION");
  assert.equal(organism.meta.model.state.live_claim.value, false);
  assert.equal(organism.live, false);
  const runtime = runCortexRuntime({
    workerEvidence: {
      v: "cognitive-worker.v14",
      verified: true,
      dispatches: [{ number: 635, sha: "abc", state: "VERIFIED" }],
      truth: { ACTION_VERIFIED: true },
    },
    agents: [{ id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" }],
    fluidity: { state: "FLOWING", property: { silent_stop: false, hint_consumed: true } },
    languageInput: { text: "⊞⊸λ", declared: "FUTURE-LANG-X" },
    at: "2026-09-16T23:00:00.000Z",
  });
  assert.equal(runtime.organism.meta.improved.self_authorize, false);
  assert.equal(runtime.organism.meta.diff.better, false);
  assert.equal(runtime.live, false);
  assert.equal(runtime.auto_merge, false);
});
