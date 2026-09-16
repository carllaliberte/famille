import test from "node:test";
import assert from "node:assert/strict";
import {
  CIR_VERSION,
  adaptLanguage,
  behavioralDiff,
  classifyLanguageState,
  cognitiveCompile,
  describeCIR,
  describeProgram,
  discoverLanguage,
  expressMeaning,
  hypothesizeForm,
  languageAutopsy,
  languageContract,
  languageDiff,
  languageHandshake,
  languageRegistry,
  languageRegression,
  meaningOf,
  rememberLanguage,
  runLanguageCycle,
  transpileViaCIR,
} from "../scripts/cortex-language.mjs";
import { runOrganismCycle } from "../scripts/cortex-organism.mjs";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";

test("CIR separates form from meaning and does not invent slots", () => {
  const cir = describeCIR({});
  assert.equal(cir.version, CIR_VERSION);
  assert.equal(cir.intent.state, "UNKNOWN");
  assert.equal(cir.form_is_not_meaning, true);
  assert.equal(cir.language_is_not_intent, true);
  assert.equal(meaningOf(cir).invented, false);
  assert.equal(cir.live, false);
});

test("French, English, Québécois and mixed speech are not an allowlist hit", () => {
  const fr = discoverLanguage({ text: "Peux-tu regarder pourquoi ça ne marche pas?" });
  const en = discoverLanguage({ text: "Can you figure out why this isn't working?" });
  const qc = discoverLanguage({ text: "Chus tanné, ça marche pas pantoute." });
  const mix = discoverLanguage({ text: "Peux-tu watch the chantier pourquoi this isn't working?" });
  assert.equal(fr.form.kind, "HUMAN_LANGUAGE");
  assert.equal(en.form.kind, "HUMAN_LANGUAGE");
  assert.equal(fr.state, "UNKNOWN_BUT_LEARNABLE");
  assert.equal(en.understood, false);
  assert.equal(qc.supported, false);
  assert.equal(mix.state, "AMBIGUOUS");
  assert.equal(fr.form.allowlist, false);
  assert.equal(fr.universal, false);
  assert.equal(fr.live, false);
});

test("declared BCP47 uses pack-lieu as cache, never as cognitive ceiling", () => {
  const tagged = discoverLanguage({ text: "Bonjour", declared: "fr-CA" });
  assert.equal(tagged.pack.cache, true);
  assert.equal(tagged.pack.ceiling, false);
  assert.equal(tagged.state, "PARTIALLY_KNOWN");
  assert.equal(languageRegistry([{ tag: "fr-CA" }]).ceiling, false);
  assert.equal(languageRegistry([]).allowlist_architecture, false);
});

test("unknown script and FUTURE-LANG-X stay LANGUAGE_UNKNOWN", () => {
  const future = discoverLanguage({ text: "⊞⊸λ", declared: "FUTURE-LANG-X" });
  assert.equal(future.state, "LANGUAGE_UNKNOWN");
  assert.equal(future.form.kind, "UNKNOWN_SYMBOLIC_SYSTEM");
  assert.equal(future.understood, false);
  assert.equal(future.channel.status, "DISCOVERED");
  assert.equal(future.unknown_is_not_failure, true);
  const deva = hypothesizeForm("यह एक परीक्षा है");
  assert.equal(deva.script.family, "DEVANAGARI_FAMILY");
  assert.equal(classifyLanguageState({ form: { kind: "UNKNOWN_LANGUAGE" } }), "LANGUAGE_UNKNOWN");
});

test("programming structure is hypothesized without naming the language", () => {
  const py = discoverLanguage({ text: "def foo():\n    return 1", modality: "CODE" });
  assert.equal(py.form.kind, "PROGRAMMING_LANGUAGE");
  assert.equal(py.form.identity, null);
  const ir = describeProgram("def foo():\n    return 1");
  assert.equal(ir.syntax_identity, null);
  assert.deepEqual(ir.ir.function.value, ["foo"]);
  assert.equal(ir.ir.type.state, "UNKNOWN");
});

test("transpile is A → CIR → B, not a pairwise translator, and does not invent an implementation", () => {
  const hop = transpileViaCIR({ source: "fn main() {}", target: "unknown-target" });
  assert.deepEqual(hop.path, ["A", "CIR", "unknown-target"]);
  assert.equal(hop.not_pairwise, true);
  assert.equal(hop.target.invented_implementation, false);
  assert.equal(hop.semantic_preservation, "UNMEASURED");
  assert.equal(behavioralDiff({ sourceIR: hop.cir, targetIR: null }).behavior_verified, false);
});

test("meaning → expression is not string-to-string translation", () => {
  const cir = describeCIR({ intent: "diagnose", meaning: "system-failure", form: { kind: "HUMAN_LANGUAGE" } });
  const spoken = expressMeaning({ cir, language: "fr-CA", dialect: "québécois", register: "familiar" });
  assert.equal(spoken.string_to_string, false);
  assert.equal(spoken.expression.dialect, "québécois");
  const empty = expressMeaning({ cir: describeCIR({}), language: "en" });
  assert.equal(empty.status, "INCONCLUSIVE");
});

test("language diff records uncertainty; autopsy is INCONCLUSIVE without proof", () => {
  const diff = languageDiff({ meaningA: { intent: "diagnose" }, meaningB: null, expressionA: { register: "formal" }, expressionB: { register: "familiar" } });
  assert.equal(diff.semantic_loss, true);
  assert.equal(diff.translation_uncertainty, true);
  assert.equal(languageAutopsy({ kind: "AMBIGUITY" }).verdict, "INCONCLUSIVE");
  assert.equal(languageRegression({ cases: [{ degraded: true }] }).adopt, false);
});

test("adapter is proposed, not safe, not merge; understanding is not execution", () => {
  const cycle = runLanguageCycle({ text: "⊞⊸λ", declared: "FUTURE-LANG-X" });
  assert.equal(cycle.adapted.status, "PROPOSED");
  assert.equal(cycle.adapted.adapter.safe, false);
  assert.equal(cycle.gates.understand, true);
  assert.equal(cycle.gates.execute, false);
  assert.equal(cycle.gates.merge, false);
  assert.equal(cycle.gates.discovery_is_not_authority, true);
  assert.equal(cycle.gates.understanding_is_not_execution, true);
  assert.equal(cycle.zero_cost, true);
  assert.equal(cycle.supported, false);
  assert.equal(cycle.universal, false);
  assert.equal(cycle.live, false);
  assert.equal(cycle.auto_merge, false);
});

test("unknown-language contract fields stay UNKNOWN, not false or supported", () => {
  const contract = languageContract({});
  assert.equal(contract.contract.syntax.state, "UNKNOWN");
  assert.equal(contract.unknown_is_not_false, true);
  assert.equal(contract.unknown_is_not_supported, true);
  assert.equal(contract.unknown_is_not_verified, true);
});

test("memory expires; handshake grants no authority; compiler is not executable", () => {
  const disc = discoverLanguage({ text: "hello" });
  const mem = rememberLanguage({ discovery: disc, at: "2026-09-16T22:50:00.000Z", expires: "2026-10-16T00:00:00.000Z" });
  assert.equal(mem.memory.truth_eternal, false);
  assert.equal(mem.memory.expires_at, "2026-10-16T00:00:00.000Z");
  const hs = languageHandshake({ who: "carl" });
  assert.equal(hs.hello.authority, "carl");
  assert.equal(hs.auto_merge, false);
  assert.equal(cognitiveCompile({ intent: "diagnose" }).executable, false);
  assert.equal(adaptLanguage({ discovery: disc, target: "fr-CA" }).reason.includes("surface cache"), true);
});

test("reality learning records the language hypothesis without minting LIVE", () => {
  const cycle = runLanguageCycle({
    text: "Peux-tu regarder pourquoi ça ne marche pas?",
    at: "2026-09-16T22:50:00.000Z",
  });
  assert.equal(cycle.learned.status, "LEARNED");
  assert.equal(cycle.learned.live, false);
  assert.equal(cycle.learned.authority, "carl");
});

test("organism and runtime carry language cycle; future probe stays unknown", () => {
  const organism = runOrganismCycle({
    workerEvidence: { v: "cognitive-worker.v14" },
    agents: [{ id: "worker", capabilities: ["review"] }],
    fluidity: { state: "FLOWING", property: { silent_stop: false } },
    languageInput: { text: "⊞⊸λ", declared: "FUTURE-LANG-X" },
  });
  assert.equal(organism.language.discovery.state, "LANGUAGE_UNKNOWN");
  assert.equal(organism.language.gates.merge, false);
  assert.equal(organism.live, false);
  const runtime = runCortexRuntime({
    workerEvidence: {
      v: "cognitive-worker.v14",
      verified: true,
      dispatches: [{ number: 633, sha: "abc", state: "VERIFIED" }],
      truth: { ACTION_VERIFIED: true },
    },
    agents: [{ id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" }],
    fluidity: { state: "FLOWING", property: { silent_stop: false, hint_consumed: true } },
    languageInput: { text: "⊞⊸λ", declared: "FUTURE-LANG-X" },
    at: "2026-09-16T22:51:00.000Z",
  });
  assert.equal(runtime.organism.language.discovery.unknown_is_not_failure, true);
  assert.equal(runtime.organism.language.universal, false);
  assert.equal(runtime.live, false);
});
