#!/usr/bin/env node
/**
 * ACORN CORTEX — universal language adaptation, owned by the organism.
 * CIR separates FORM ≠ MEANING. LANGUAGE ≠ INTENT. SYNTAX ≠ SEMANTICS.
 * Not a translator farm. Not a second Cortex. No allowlist ceiling.
 * LANGUAGE_UNKNOWN is not failure. CAPABILITY ≠ AUTHORITY. live=false.
 */
import { packLieu } from "../sdk/pack-lieu.js";
import { considerUnknownChannel } from "../sdk/open-channel.js";
import { intelligenceAdapter } from "../sdk/open-intelligence.js";
import { authorizeCapability } from "../.github/swarm/cortex.mjs";
import { learnFromExperience } from "./reality-learning-engine.mjs";

export const CIR_VERSION = "cir.v0";
export const FORM_KINDS = Object.freeze([
  "HUMAN_LANGUAGE", "DIALECT", "SCRIPT", "PROGRAMMING_LANGUAGE", "DATA_LANGUAGE",
  "QUERY_LANGUAGE", "PROTOCOL_LANGUAGE", "DSL", "FORMAL_LANGUAGE",
  "UNKNOWN_LANGUAGE", "UNKNOWN_SYMBOLIC_SYSTEM",
]);
export const LANGUAGE_STATES = Object.freeze([
  "KNOWN", "PARTIALLY_KNOWN", "UNKNOWN_BUT_LEARNABLE", "UNKNOWN_AND_INCONCLUSIVE",
  "AMBIGUOUS", "UNSAFE", "LANGUAGE_UNKNOWN",
]);
export const MODALITIES = Object.freeze([
  "TEXT", "VOICE", "AUDIO", "IMAGE", "VIDEO", "GESTURE", "SYMBOL", "CODE",
  "GRAPH", "STRUCTURE", "SPATIAL", "TEMPORAL", "MACHINE_PROTOCOL",
]);
export const FAILURE_KINDS = Object.freeze([
  "UNKNOWN", "AMBIGUITY", "ADAPTER_ERROR", "SEMANTIC_ERROR", "CONTEXT_ERROR", "EXECUTION_ERROR",
]);

function text(v) { return String(v ?? "").trim(); }
function digest(value) {
  const raw = JSON.stringify(value ?? null);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

function unknown(field) {
  return { field, value: null, state: "UNKNOWN" };
}

export function hypothesizeScript(sample = "") {
  const s = String(sample);
  if (/[\u0600-\u06FF]/.test(s)) return { family: "ARABIC_FAMILY", state: "HYPOTHESIS" };
  if (/[\u4E00-\u9FFF]/.test(s)) return { family: "HAN_FAMILY", state: "HYPOTHESIS" };
  if (/[\u0400-\u04FF]/.test(s)) return { family: "CYRILLIC_FAMILY", state: "HYPOTHESIS" };
  if (/[\u3040-\u30FF]/.test(s)) return { family: "KANA_FAMILY", state: "HYPOTHESIS" };
  if (/[\uAC00-\uD7AF]/.test(s)) return { family: "HANGUL_FAMILY", state: "HYPOTHESIS" };
  if (/[\u0900-\u097F]/.test(s)) return { family: "DEVANAGARI_FAMILY", state: "HYPOTHESIS" };
  if (/[\u2200-\u22FF\u27C0-\u27EF\u2A00-\u2AFF\u2190-\u21FF]/.test(s)) return { family: "SYMBOLIC", state: "HYPOTHESIS" };
  if (/[A-Za-zÀ-ÿ]/.test(s)) return { family: "LATIN_FAMILY", state: "HYPOTHESIS" };
  if (!s) return { family: "UNKNOWN_SCRIPT", state: "LANGUAGE_UNKNOWN" };
  return { family: "UNKNOWN_SCRIPT", state: "HYPOTHESIS" };
}

export function hypothesizeForm(sample = "") {
  const s = String(sample);
  const mixed = /[A-Za-zÀ-ÿ]/.test(s) && /[\u0400-\u04FF\u4E00-\u9FFF\u0600-\u06FF]/.test(s);
  const query = /\b(SELECT|FROM|WHERE|INSERT)\b/i.test(s);
  const code = query || /[{;]|=>|\b(fn|def|func|function|impl|class)\s+\w+/i.test(s) || /^\s*#!/.test(s);
  const protocol = /^\s*\{[\s\S]*"\w+"\s*:/.test(s) || /\b(GET|POST|HELLO|CAPABILITIES)\b/.test(s);
  let kind = "UNKNOWN_LANGUAGE";
  if (/[\u2200-\u22FF\u27C0-\u27EF]/.test(s) && !/[A-Za-z]{4,}/.test(s)) kind = "UNKNOWN_SYMBOLIC_SYSTEM";
  else if (query) kind = "QUERY_LANGUAGE";
  else if (code) kind = "PROGRAMMING_LANGUAGE";
  else if (protocol) kind = "PROTOCOL_LANGUAGE";
  else if (/[A-Za-zÀ-ÿ\u0400-\u04FF\u4E00-\u9FFF]/.test(s)) kind = "HUMAN_LANGUAGE";
  return {
    kind,
    mixed,
    code_switching: mixed || (
      /\b(le|la|les|des|une|pas|pourquoi|peux|tu|ça|chus|marche)\b/i.test(s)
      && /\b(the|and|why|this|isn'?t|watch|can|you|working)\b/i.test(s)
    ),
    script: hypothesizeScript(s),
    identity: null,
    allowlist: false,
    live: false,
  };
}

export function describeCIR({
  intent, meaning, structure, relation, constraint, state, action,
  temporality, provenance, uncertainty, authority, context, form,
} = {}) {
  const slot = (value, name) => (value == null || value === "" ? unknown(name) : { field: name, value, state: "HYPOTHESIS" });
  return {
    version: CIR_VERSION,
    intent: slot(intent, "intent"),
    meaning: slot(meaning, "meaning"),
    structure: slot(structure, "structure"),
    relation: slot(relation, "relation"),
    constraint: slot(constraint, "constraint"),
    state: slot(state, "state"),
    action: slot(action, "action"),
    temporality: slot(temporality, "temporality"),
    provenance: provenance || { source: "cortex-language", at: new Date().toISOString() },
    uncertainty: uncertainty || "UNKNOWN",
    authority: authority === true ? "HOLD_HUMAN" : false,
    context: context ?? null,
    form: form || { kind: "UNKNOWN_LANGUAGE" },
    form_is_not_meaning: true,
    language_is_not_intent: true,
    syntax_is_not_semantics: true,
    live: false,
  };
}

export function meaningOf(cir) {
  return {
    intent: cir?.intent?.value ?? null,
    meaning: cir?.meaning?.value ?? null,
    uncertainty: cir?.uncertainty || "UNKNOWN",
    invented: false,
  };
}

export function surfaceOf(cir) {
  return cir?.form || { kind: "UNKNOWN_LANGUAGE" };
}

export function hypothesizeIntent(sample = "") {
  const s = String(sample).toLowerCase();
  if (/pourquoi|why|ne (marche|fonctionne) pas|isn'?t working|pas pantoute|figure out/.test(s)) {
    return { value: "diagnose", object: "system", action: "analyze", state: "HYPOTHESIS" };
  }
  if (/peux-tu|can you|please/.test(s)) {
    return { value: "request", state: "HYPOTHESIS" };
  }
  return { value: null, object: null, action: null, state: "UNKNOWN" };
}

export function classifyLanguageState({ form, declared, evidence, measured } = {}) {
  if (form?.kind === "UNKNOWN_SYMBOLIC_SYSTEM" && !measured) return "LANGUAGE_UNKNOWN";
  if (!declared && !measured && form?.kind === "UNKNOWN_LANGUAGE") return "LANGUAGE_UNKNOWN";
  if (form?.mixed || form?.code_switching) return "AMBIGUOUS";
  if (declared && evidence?.connu === true && !measured) return "PARTIALLY_KNOWN";
  if (measured === true && evidence?.verified === true) return "KNOWN";
  if (form?.kind && form.kind !== "UNKNOWN_LANGUAGE" && form.kind !== "UNKNOWN_SYMBOLIC_SYSTEM") return "UNKNOWN_BUT_LEARNABLE";
  return "UNKNOWN_AND_INCONCLUSIVE";
}

export function discoverLanguage({ text: sample, declared, modality = "TEXT" } = {}) {
  const form = hypothesizeForm(sample || "");
  form.modality = MODALITIES.includes(modality) ? modality : "TEXT";
  form.declared = declared || null;
  const pack = declared ? packLieu(declared) : null;
  const state = classifyLanguageState({
    form,
    declared,
    evidence: pack ? { connu: pack.connu === true } : null,
    measured: false,
  });
  const channel = state === "LANGUAGE_UNKNOWN" || state === "UNKNOWN_AND_INCONCLUSIVE"
    ? considerUnknownChannel({ id: declared || "unknown-language", provider: "UNKNOWN", protocol: form.kind })
    : null;
  const units = String(sample || "").split(/\s+/).filter(Boolean);
  const guessed = hypothesizeIntent(sample || "");
  const cir = describeCIR({
    intent: guessed.value,
    meaning: guessed.value,
    action: guessed.action,
    structure: { units: units.length, tokens: units.slice(0, 12) },
    form,
    uncertainty: state,
    context: { declared: declared || null, pack_tag: pack?.connu ? pack.tag : null, object: guessed.object || null },
  });
  return {
    status: "EXECUTED",
    state,
    form,
    cir,
    pack: pack && pack.connu ? { tag: pack.tag, cache: true, ceiling: false } : null,
    channel,
    unknown_is_not_failure: true,
    understood: false,
    supported: false,
    universal: false,
    live: false,
  };
}

export function languageContract(input = {}) {
  const fields = [
    "identity", "version", "syntax", "semantics", "types", "effects",
    "execution_model", "resource_model", "error_model", "security_model",
    "interoperability", "limitations", "provenance",
  ];
  const body = {};
  for (const field of fields) {
    body[field] = input[field] == null ? { state: "UNKNOWN", value: null } : { state: "DECLARED", value: input[field] };
  }
  return {
    status: "DEFINED",
    contract: body,
    unknown_is_not_false: true,
    unknown_is_not_supported: true,
    unknown_is_not_verified: true,
    live: false,
  };
}

export function adaptLanguage({ discovery, target, register = "plain" } = {}) {
  const meaning = meaningOf(discovery?.cir);
  const adapter = {
    adapter_id: `lang_${digest({ kind: discovery?.form?.kind, target, register })}`,
    kind: discovery?.form?.kind || "UNKNOWN_LANGUAGE",
    target: target || null,
    register,
    provenance: { discovered: true, verified: false },
    evidence: null,
    confidence: "unscored",
    limitations: ["meaning not invented", "no N×M translator"],
    expiry: null,
    safe: false,
    live: false,
  };
  if (!discovery || discovery.understood === true && discovery.cir?.intent?.state === "UNKNOWN") {
    return { status: "INCONCLUSIVE", adapter, expression: null, live: false };
  }
  if (target && packLieu(target).connu && meaning.intent == null) {
    return {
      status: "PROPOSED",
      adapter: { ...adapter, surface_cache: packLieu(target).tag },
      expression: null,
      reason: "pack-lieu is a surface cache, not a translator",
      live: false,
    };
  }
  return { status: "PROPOSED", adapter, expression: { cir: discovery?.cir, target: target || "CIR" }, live: false };
}

export function expressMeaning({ cir, language, dialect, register = "plain", formality = "neutral" } = {}) {
  const meaning = meaningOf(cir);
  return {
    status: meaning.intent || meaning.meaning ? "PROPOSED" : "INCONCLUSIVE",
    pipeline: ["MEANING", language || "CIR", dialect || null, register, "EXPRESSION"],
    expression: meaning.intent || meaning.meaning
      ? { meaning, language: language || null, dialect: dialect || null, register, formality, live: false }
      : null,
    string_to_string: false,
    live: false,
  };
}

export function describeProgram(sample = "") {
  const src = String(sample);
  const functions = [...src.matchAll(/\b(?:fn|def|function|func)\s+(\w+)/g)].map((m) => m[1]);
  return {
    status: functions.length ? "HYPOTHESIS" : "LANGUAGE_UNKNOWN",
    ir: {
      program: true,
      module: unknown("module"),
      function: functions.length ? { state: "HYPOTHESIS", value: functions } : unknown("function"),
      type: unknown("type"),
      value: unknown("value"),
      state: unknown("state"),
      control_flow: /if|else|match|for|while/.test(src) ? { state: "HYPOTHESIS", value: "branch-or-loop" } : unknown("control_flow"),
      data_flow: unknown("data_flow"),
      effect: unknown("effect"),
      resource: unknown("resource"),
      constraint: unknown("constraint"),
      dependency: unknown("dependency"),
      error: unknown("error"),
      side_effect: unknown("side_effect"),
      security_property: unknown("security_property"),
    },
    syntax_identity: null,
    live: false,
  };
}

export function transpileViaCIR({ source, target = "CIR" } = {}) {
  const discovered = discoverLanguage({ text: source, modality: "CODE" });
  const program = describeProgram(source || "");
  const cir = describeCIR({
    intent: "transform",
    meaning: null,
    structure: program.ir.function,
    form: discovered.form,
    uncertainty: discovered.state,
  });
  return {
    status: "PROPOSED",
    path: ["A", "CIR", target],
    not_pairwise: true,
    source: discovered,
    cir,
    target: { language: target, program, invented_implementation: false },
    semantic_preservation: "UNMEASURED",
    live: false,
  };
}

export function languageDiff({ meaningA, expressionA, meaningB, expressionB } = {}) {
  const loss = JSON.stringify(meaningA) !== JSON.stringify(meaningB) && meaningB == null;
  const addition = meaningB != null && meaningA != null && JSON.stringify(meaningA) !== JSON.stringify(meaningB);
  return {
    status: "EXECUTED",
    semantic_loss: Boolean(loss),
    semantic_addition: Boolean(addition),
    ambiguity: meaningA == null || meaningB == null,
    register_change: (expressionA?.register || null) !== (expressionB?.register || null),
    cultural_shift: (expressionA?.dialect || null) !== (expressionB?.dialect || null),
    technical_shift: (expressionA?.formality || null) !== (expressionB?.formality || null),
    translation_uncertainty: true,
    live: false,
  };
}

export function behavioralDiff({ sourceIR, targetIR } = {}) {
  return {
    status: "INCONCLUSIVE",
    source: sourceIR || null,
    target: targetIR || null,
    behavior_verified: false,
    live: false,
  };
}

export function rememberLanguage({ discovery, at, expires } = {}) {
  return {
    status: "EXECUTED",
    memory: {
      how: discovery?.form?.kind || "UNKNOWN_LANGUAGE",
      where: discovery?.form?.script?.family || null,
      when: at || new Date().toISOString(),
      means: discovery?.cir?.meaning || unknown("meaning"),
      ambiguous: discovery?.state === "AMBIGUOUS",
      unknown: discovery?.cir?.intent || unknown("intent"),
      discovered_at: at || new Date().toISOString(),
      verified_at: null,
      last_confirmed: null,
      expires_at: expires || null,
      truth_eternal: false,
      live: false,
    },
    live: false,
  };
}

export function languageEvolution({ previous, current } = {}) {
  return {
    status: "EXECUTED",
    version_change: JSON.stringify(previous) !== JSON.stringify(current),
    dated: true,
    eternal: false,
    live: false,
  };
}

export function negotiateLanguage({ state, form } = {}) {
  if (state === "LANGUAGE_UNKNOWN") {
    return { status: "EXECUTED", message: "unknown form; hypothesizing structure", offer: null, live: false };
  }
  if (state === "AMBIGUOUS" || state === "PARTIALLY_KNOWN") {
    return { status: "EXECUTED", message: "partially understood; two interpretations possible", offer: form?.kind || null, live: false };
  }
  return { status: "EXECUTED", message: "can respond in CIR; target surface is a proposal", offer: "CIR", live: false };
}

export function languageHandshake({ who, what, language, semantics, version, context, constraints } = {}) {
  return {
    status: "DEFINED",
    hello: {
      who: who || "cortex",
      what: what || "language-adapt",
      capability: "language-discover",
      language: language || "UNKNOWN",
      semantics: semantics || CIR_VERSION,
      version: version || CIR_VERSION,
      context: context || null,
      constraints: constraints || ["zero-cost", "no-authority"],
      authority: "carl",
      provenance: { method: "cortex-language", live: false },
    },
    live: false,
    auto_merge: false,
  };
}

export function cognitiveCompile({ intent, target = "CIR" } = {}) {
  return {
    status: "PROPOSED",
    pipeline: ["INTENT", "SEMANTIC_PLAN", "COGNITIVE_ARCHITECTURE", target, "EXPRESSION"],
    intent: intent || null,
    executable: false,
    live: false,
  };
}

export function languageAutopsy({ error, kind } = {}) {
  const classified = FAILURE_KINDS.includes(kind) ? kind : "UNKNOWN";
  return { status: "EXECUTED", kind: classified, error: error || null, root_cause: null, verdict: "INCONCLUSIVE", live: false };
}

export function languageRegression({ before, after, cases = [] } = {}) {
  const degraded = cases.some((row) => row.degraded === true);
  return {
    status: degraded ? "REGRESSION" : "EXECUTED",
    before, after, cases,
    adopt: false,
    live: false,
  };
}

export function languageRegistry(entries = []) {
  return {
    status: "EXECUTED",
    entries: entries || [],
    cache: true,
    ceiling: false,
    allowlist_architecture: false,
    live: false,
  };
}

export function learnLanguage({ sample, expected, actual, at } = {}) {
  return learnFromExperience({
    hypothesis: { kind: "language-form", sample: String(sample || "").slice(0, 80) },
    expected: expected ?? { state: "LANGUAGE_UNKNOWN" },
    actual: actual ?? { state: "LANGUAGE_UNKNOWN" },
    context: { engine: "cortex-language" },
    observedAt: at,
    model: { version: 1 },
    verification: { verified: false },
  });
}

export function runLanguageCycle(input = {}) {
  const sample = input.text ?? input.sample ?? "";
  const declared = input.declared || input.tag || null;
  const discovery = discoverLanguage({ text: sample, declared, modality: input.modality || "TEXT" });
  const program = discovery.form.kind === "PROGRAMMING_LANGUAGE" || discovery.form.kind === "QUERY_LANGUAGE"
    ? describeProgram(sample)
    : null;
  const adapted = adaptLanguage({ discovery, target: input.target || "CIR", register: input.register || "plain" });
  const expressed = expressMeaning({ cir: discovery.cir, language: input.target, dialect: input.dialect, register: input.register });
  const transpiled = input.transpileTo ? transpileViaCIR({ source: sample, target: input.transpileTo }) : null;
  const diff = languageDiff({
    meaningA: meaningOf(discovery.cir),
    expressionA: { register: input.register || "plain", dialect: input.dialect || null },
    meaningB: expressed.expression?.meaning || null,
    expressionB: expressed.expression,
  });
  const memory = rememberLanguage({ discovery, at: input.at });
  const learned = learnLanguage({
    sample, expected: { state: "LANGUAGE_UNKNOWN" }, actual: { state: discovery.state }, at: input.at,
  });
  const handshake = languageHandshake({
    who: input.who || "cortex",
    language: declared || discovery.form.kind,
    context: input.context,
  });
  const compiled = cognitiveCompile({ intent: discovery.cir.intent.value, target: input.target || "CIR" });
  const autopsy = discovery.understood ? { status: "NOT_APPLICABLE" } : languageAutopsy({ kind: "UNKNOWN" });
  const regression = languageRegression({ before: null, after: discovery.state, cases: [] });
  const contract = languageContract({ identity: declared || null, provenance: "discoverLanguage" });
  const negotiation = negotiateLanguage({ state: discovery.state, form: discovery.form });
  const registry = languageRegistry(input.registry || []);
  const understand = authorizeCapability({ capabilities: ["language-understand"], allowed: true, authority: "network" });
  const execute = authorizeCapability({ capabilities: ["execute"], allowed: false, authority: "network" });
  const merge = authorizeCapability({ capabilities: ["merge"], allowed: false, authority: "network" });
  const adapter = intelligenceAdapter({ id: declared || "unknown-language", provider: "UNKNOWN", capabilities: ["language-discover"] });
  return {
    status: "EXECUTED",
    discovery,
    program,
    adapted,
    expressed,
    transpiled,
    diff,
    memory,
    learned: { status: learned.status, live: false, authority: learned.authority },
    handshake,
    compiled,
    autopsy,
    regression,
    contract,
    negotiation,
    registry,
    gates: {
      understand: understand.ok,
      execute: execute.ok,
      merge: merge.ok,
      discovery_is_not_authority: true,
      adapter_is_not_merge: true,
      understanding_is_not_execution: true,
      execution_is_not_write: true,
    },
    invoke: adapter.invoke({ capability: "language-discover" }),
    zero_cost: true,
    paid_required: false,
    live: false,
    auto_merge: false,
    authority: "carl",
    supported: false,
    universal: false,
  };
}
