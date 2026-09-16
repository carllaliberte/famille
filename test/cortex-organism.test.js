import test from "node:test";
import assert from "node:assert/strict";
import {
  ORGANISM_LOOP,
  UNCERTAINTY_STATES,
  assertConstitution,
  avoidKnownBad,
  comparePrediction,
  composeCapabilities,
  consolidateMemory,
  contributeKnowledge,
  detectContradiction,
  diagnoseOrganism,
  falsifyCause,
  genomeOf,
  hypothesizeCause,
  immuneDetect,
  isolateAndRecover,
  measureSynapse,
  metabolismOf,
  metacognitionOf,
  mutationCandidate,
  presenceFromRuntime,
  proposeSynapse,
  runOrganismCycle,
  simulateOrganism,
  storePrediction,
  synthesizeKnowledge,
  uncertaintyOf,
} from "../scripts/cortex-organism.mjs";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";

test("organism loop and uncertainty states are explicit", () => {
  assert.equal(ORGANISM_LOOP[0], "PERCEIVE");
  assert.equal(ORGANISM_LOOP.at(-1), "REUSE");
  assert.ok(UNCERTAINTY_STATES.includes("INSUFFICIENT_EVIDENCE"));
});

test("roster status is not presence; worker evidence makes worker ACTIVE", () => {
  assert.equal(presenceFromRuntime({ id: "chatgpt" }, { workerEvidence: { v: "cognitive-worker.v14" } }), "DECLARED");
  assert.equal(presenceFromRuntime({ id: "worker" }, { workerEvidence: { v: "cognitive-worker.v14" } }), "ACTIVE");
});

test("knowledge fabric preserves disagreement and refuses consensus-as-truth", () => {
  const a = contributeKnowledge({ who: "reviewer", what: "path-ok", channel: "ci", context: "cycle", kind: "claim" });
  const b = contributeKnowledge({ who: "challenger", what: "path-bad", channel: "model", context: "cycle", kind: "claim" });
  const fabric = synthesizeKnowledge([a.entry, b.entry]);
  assert.equal(fabric.consensus_is_truth, false);
  assert.equal(detectContradiction([a.entry, b.entry]).disagreement_preserved, true);
});

test("uncertainty does not mint confidence", () => {
  assert.equal(uncertaintyOf({}).state, "UNKNOWN");
  assert.equal(uncertaintyOf({ what: "x" }).state, "INSUFFICIENT_EVIDENCE");
  assert.equal(uncertaintyOf({ what: "x", evidence: {}, verified: true }).state, "KNOWN");
});

test("predictions are stored before compare and never rewritten", () => {
  const stored = storePrediction({ hypothesis: "worker runs", expected: { ok: true }, at: "2026-09-16T21:00:00.000Z" });
  assert.equal(stored.prediction.rewritten, false);
  const compared = comparePrediction(stored.prediction, { actual: { ok: false } });
  assert.equal(compared.status, "MEASURED");
  assert.equal(compared.match, false);
  assert.equal(compared.causal, false);
  assert.equal(compared.error, 1);
});

test("causal claims stay INCONCLUSIVE without intervention evidence", () => {
  const causal = hypothesizeCause({ observation: { stalled: true }, cause: "unread hint" });
  assert.equal(causal.status, "PROPOSED");
  assert.equal(falsifyCause({ causal: causal.causal, effect: { stalled: true } }).verdict, "INCONCLUSIVE");
  assert.equal(falsifyCause({ causal: causal.causal, counterexample: true }).verdict, "INCONCLUSIVE");
});

test("synapse and composed capability stay PROPOSED until executed", () => {
  const syn = proposeSynapse({ from: "worker", to: "ci" });
  assert.equal(syn.status, "PROPOSED");
  assert.equal(measureSynapse({ synapse: syn.synapse, executed: false }).verdict, "INCONCLUSIVE");
  const worse = measureSynapse({
    synapse: syn.synapse,
    executed: true,
    fluidityBefore: { state: "FLOWING" },
    fluidityAfter: { state: "FRICTION" },
  });
  assert.equal(worse.verdict, "INCONCLUSIVE");
  const composed = composeCapabilities({ parts: [{ name: "A" }, { name: "B" }] });
  assert.equal(composed.status, "PROPOSED");
  assert.equal(composed.capability.active, false);
});

test("memory consolidates, expires, supersedes; rejected paths constrain similar context only", () => {
  const now = "2026-09-16T21:00:00.000Z";
  const old = { kind: "claim", what: "x", at: "2020-01-01T00:00:00.000Z" };
  const cur = { kind: "claim", what: "x", at: now };
  const consolidated = consolidateMemory([old, cur], { now, maxAgeMs: 1000 });
  assert.ok(consolidated.expired.length >= 1);
  const avoid = avoidKnownBad([{ constraint: true, statement: "rejected in context: compose_synapse" }], { kind: "compose_synapse", statement: "compose" });
  assert.equal(avoid.avoid, true);
  assert.equal(avoid.context_matters, true);
});

test("metabolism does not invent cost; immune isolates without self-authorization", () => {
  const meta = metabolismOf({ timing: {}, fluidity: { state: "STALLED" } });
  assert.equal(meta.cost, null);
  assert.equal(meta.stalls, true);
  const immune = immuneDetect({ fluidity: { property: { silent_stop: true }, state: "STALLED" }, constitution: { auto_merge: true } });
  assert.equal(immune.healthy, false);
  assert.ok(immune.findings.some((row) => row.kind === "authority_violation"));
  const recovered = isolateAndRecover({ kind: "secret" });
  assert.ok(["HOLD_HUMAN", "PROPOSED"].includes(recovered.status));
  assert.equal(recovered.recovered, false);
});

test("genome is versioned; mutation is a candidate; twin is not reality", () => {
  const genome = genomeOf({ topology: { version: 2, paths: ["a"] }, intelligences: [{ id: "worker", presence: "ACTIVE" }] });
  assert.equal(genome.genome.version, 2);
  assert.equal(genome.genome.live, false);
  const mutation = mutationCandidate(genome.genome, { paths: ["b"] });
  assert.equal(mutation.status, "PROPOSED");
  const twin = simulateOrganism({ ok: true }, { ok: true });
  assert.equal(twin.is_proof_of_reality, false);
});

test("constitution rejects live, auto-merge and self-authorization", () => {
  assert.throws(() => assertConstitution({ live: true }), /CONSTITUTION_LIVE_FORBIDDEN/);
  assert.throws(() => assertConstitution({ auto_merge: true }), /CONSTITUTION_AUTO_MERGE/);
  assert.throws(() => assertConstitution({ self_authorization: true }), /CONSTITUTION_SELF_AUTHORIZATION/);
  const ok = assertConstitution({ live: false, auto_merge: false, authority: "carl" });
  assert.equal(ok.capability_is_not_authority, true);
});

test("metacognition records disagreement without ranking models", () => {
  const meta = metacognitionOf({
    contributions: [{ intelligence: "worker" }, { intelligence: "ci" }],
    disagreements: [{ a: "1", b: "2" }],
    fluidity: { state: "FLOWING" },
  });
  assert.equal(meta.disagreement, 1);
  assert.equal(meta.ranking, null);
});

test("unavailable adapter stays CHANNEL_NOT_PRESENT", () => {
  const cycle = runOrganismCycle({
    workerEvidence: { v: "cognitive-worker.v14" },
    agents: [{ id: "worker", capabilities: ["lu"], presence: "DECLARED" }],
    fluidity: { state: "FLOWING", property: { silent_stop: false, hint_consumed: true } },
    futureProvider: "not-in-inventory",
  });
  assert.equal(cycle.adapter.reason, "CHANNEL_NOT_PRESENT");
  assert.equal(cycle.live, false);
  assert.equal(cycle.self_authorization, false);
  assert.equal(cycle.operational, false);
  assert.equal(cycle.prediction.prediction.rewritten, false);
  assert.equal(cycle.diagnosis.executed_repair, false);
});

test("runtime organism cycle executes locally without claiming LIVE", () => {
  const result = runCortexRuntime({
    workerEvidence: {
      v: "cognitive-worker.v14",
      discovered: 3,
      routed: 2,
      verified: true,
      dispatches: [{ number: 620, sha: "abc", state: "VERIFIED" }],
      truth: { ACTION_VERIFIED: true },
    },
    agents: [{ id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" }],
    fluidity: { state: "FLOWING", mode: "PARALLEL_PREP", property: { silent_stop: false, hint_consumed: true } },
    at: "2026-09-16T21:30:00.000Z",
  });
  assert.equal(result.session.state, "DONE");
  assert.equal(result.organism.perceive.status, "EXECUTED");
  assert.equal(result.organism.genome.status, "MEASURED");
  assert.equal(result.live, false);
  assert.equal(result.organism.constitution.capability_is_not_authority, true);
});
