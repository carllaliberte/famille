import test from "node:test";
import assert from "node:assert/strict";
import {
  adaptiveAutopsy,
  badMutation,
  checkpointCortex,
  cognitiveDiff,
  createAdapter,
  discoverProtocol,
  experimentProtocol,
  isolateExperimental,
  negotiateProtocol,
  proposeProtocol,
  runAdaptiveCognition,
  semanticEquivalence,
  ultimateExperiment,
} from "../scripts/cortex-adaptive.mjs";
import { discoverLanguage } from "../scripts/cortex-language.mjs";
import { generateArchitectures, describeNode } from "../scripts/cortex-ecosystem.mjs";
import { runOrganismCycle } from "../scripts/cortex-organism.mjs";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";

const nodes = [
  describeNode({ id: "worker", kind: "executor", capabilities: ["review"], presence: "ACTIVE" }),
  describeNode({ id: "cortex-local", kind: "local", capabilities: ["review"], presence: "ACTIVE" }),
  describeNode({ id: "carl", kind: "human", capabilities: ["judgment"] }),
];

test("A — equivalent human utterances share hypothesized intent without claiming understood", () => {
  const fr = discoverLanguage({ text: "Peux-tu regarder pourquoi ça ne marche pas?" });
  const en = discoverLanguage({ text: "Can you figure out why this isn't working?" });
  const qc = discoverLanguage({ text: "Chus tanné, ça marche pas pantoute." });
  const eq = semanticEquivalence(fr, en);
  assert.equal(eq.equivalent, true);
  assert.equal(eq.intent, "diagnose");
  assert.equal(eq.understood, false);
  assert.equal(fr.understood, false);
  assert.equal(qc.cir.intent.value, "diagnose");
  assert.equal(qc.understood, false);
});

test("B — unknown language is LANGUAGE_UNKNOWN, then hypothesis, not supported", () => {
  const cycle = runAdaptiveCognition({
    languageInput: { text: "⊞⊸λ", declared: "FUTURE-LANG-X" },
    workerEvidence: { v: "cognitive-worker.v14" },
    nodes,
  });
  assert.equal(cycle.language.discovery.state, "LANGUAGE_UNKNOWN");
  assert.equal(cycle.language.discovery.understood, false);
  assert.equal(cycle.language.supported, false);
  assert.equal(cycle.langAdapter.status, "PROPOSED");
  assert.equal(cycle.langAdapter.adapter.available, false);
});

test("C — artificial programming language is represented, not identified as Python", () => {
  const ult = ultimateExperiment({ code: "fnz 0x1 ~> 0x2", workerEvidence: { v: "cognitive-worker.v14" } });
  assert.equal(ult.code.syntax_identity, null);
  assert.deepEqual(ult.transpiled.path, ["A", "CIR", "CIR"]);
  assert.equal(ult.transpiled.target.invented_implementation, false);
});

test("D — unknown protocol is discovered, negotiated, adapter proposed, not trusted", () => {
  const proto = discoverProtocol({ hello: { hello: "FUTURE_SYSTEM_X", ops: ["ping"] }, declared: "FUTURE_SYSTEM_X" });
  assert.equal(proto.state, "UNKNOWN_BUT_NEGOTIABLE");
  assert.equal(proto.trusted, false);
  const negotiated = negotiateProtocol({ local: ["review", "ping"], remote: proto.capabilities });
  assert.deepEqual(negotiated.common, ["ping"]);
  assert.equal(negotiated.trusted, false);
  const empty = negotiateProtocol({ local: ["review"], remote: ["orbit"] });
  assert.equal(empty.generate, true);
  const proposed = proposeProtocol({ capabilities: ["ping"] });
  assert.equal(proposed.trusted, false);
  const experimented = experimentProtocol({ candidate: proposed, workerEvidence: { v: "cognitive-worker.v14" } });
  assert.equal(experimented.adopted, false);
  assert.equal(createAdapter({ kind: "protocol", discovery: proto }).adapter.safe, false);
});

test("E — two architectures produce a measured difference, never B-is-better", () => {
  const generated = generateArchitectures({ class: "unknown", nodes, required: ["review"] });
  const diff = cognitiveDiff({
    a: generated.candidates[0],
    b: generated.candidates[2],
    measurements: { measured: true, context: "review", a: { error: 1 }, b: { error: 0 } },
  });
  assert.equal(diff.better, false);
  assert.equal(diff.better_in_general, false);
  assert.equal(diff.measured_difference, true);
  assert.equal(diff.verdict, "B_BETTER_IN_CONTEXT");
});

test("F — bad mutation is isolated, rejected, rolled back, not deployed", () => {
  const generated = generateArchitectures({ class: "unknown", nodes, required: ["review"] });
  const ckpt = checkpointCortex({ architecture: generated.candidates[0] });
  const mutated = badMutation(generated.candidates[0]);
  const isolated = isolateExperimental({ checkpoint: ckpt, variant: mutated.mutation });
  const cycle = runAdaptiveCognition({
    workerEvidence: { v: "cognitive-worker.v14" },
    nodes,
    badMutation: true,
  });
  assert.equal(ckpt.isolated, true);
  assert.equal(isolated.adopted, false);
  assert.equal(mutated.adopted, false);
  assert.equal(cycle.regression.status, "REGRESSION");
  assert.equal(cycle.evolved.adopted, false);
  assert.equal(cycle.gates.mutation_is_not_deployment, true);
});

test("G — discovery never becomes authority", () => {
  const cycle = runAdaptiveCognition({
    languageInput: { text: "⊞⊸λ", declared: "FUTURE-LANG-X" },
    workerEvidence: { v: "cognitive-worker.v14" },
    nodes,
  });
  assert.equal(cycle.gates.merge, false);
  assert.equal(cycle.gates.write, false);
  assert.equal(cycle.gates.understanding_is_not_authority, true);
  assert.equal(cycle.gates.discovery_is_not_trust, true);
  assert.equal(cycle.adopted, false);
  assert.equal(cycle.second_cortex, false);
  assert.equal(adaptiveAutopsy({ kind: "SECURITY_REJECTION" }).verdict, "INCONCLUSIVE");
});

test("ultimate experiment stays one Cortex, one fabric, no extra authority", () => {
  const ult = ultimateExperiment({
    text: "Ché pas pantoute pourquoi le gadget ⊞⊸λ refuse de pinguer le FUTURE_SYSTEM_X",
    workerEvidence: { v: "cognitive-worker.v14" },
  });
  assert.equal(ult.one_cortex, true);
  assert.equal(ult.one_fabric, true);
  assert.equal(ult.authority_granted, false);
  assert.equal(ult.adaptive.protocol.identity, "FUTURE_SYSTEM_X");
  assert.equal(ult.adaptive.protocol.trusted, false);
  assert.equal(ult.adaptive.language.discovery.understood, false);
  assert.equal(ult.live, false);
  assert.equal(ult.auto_merge, false);
});

test("organism and runtime expose adaptive cognition without LIVE", () => {
  const organism = runOrganismCycle({
    workerEvidence: { v: "cognitive-worker.v14" },
    agents: [{ id: "worker", capabilities: ["review"] }],
    fluidity: { state: "FLOWING", property: { silent_stop: false } },
    languageInput: { text: "⊞⊸λ", declared: "FUTURE-LANG-X" },
  });
  assert.equal(organism.adaptive.second_cortex, false);
  assert.equal(organism.adaptive.protocol.state, "UNKNOWN_BUT_NEGOTIABLE");
  assert.equal(organism.language.discovery.state, "LANGUAGE_UNKNOWN");
  assert.equal(organism.live, false);
  const runtime = runCortexRuntime({
    workerEvidence: {
      v: "cognitive-worker.v14",
      verified: true,
      dispatches: [{ number: 634, sha: "abc", state: "VERIFIED" }],
      truth: { ACTION_VERIFIED: true },
    },
    agents: [{ id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" }],
    fluidity: { state: "FLOWING", property: { silent_stop: false, hint_consumed: true } },
    languageInput: { text: "⊞⊸λ", declared: "FUTURE-LANG-X" },
    at: "2026-09-16T22:55:00.000Z",
  });
  assert.equal(runtime.organism.adaptive.diff.better, false);
  assert.equal(runtime.organism.adaptive.evolved.adopted, false);
  assert.equal(runtime.live, false);
  assert.equal(runtime.auto_merge, false);
});
