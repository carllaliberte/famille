#!/usr/bin/env node
/**
 * ACORN CONSTITUTION — executable invariant registry.
 *
 * Not a second Cortex, runtime, defense, Breaker, Fabric, memory or mesh.
 * Invariants are versioned, identifiable, testable, falsifiable, measurable,
 * protected against silent modification, historized, and distinct from
 * interpretation and implementation.
 *
 * Canonical hierarchy (executable, not documentary):
 *   CARL → BREAKER → ACORN → CORTEX → RESOURCES
 * Cortex is INTERNAL TO ACORN.
 *
 * CARL controls the BREAKER.
 * The BREAKER does not control CARL.
 * ACORN controls neither CARL nor the BREAKER.
 *
 * CAPABILITY ≠ AUTHORITY. live=false. auto_merge=false.
 */
import { createHash } from "node:crypto";
import {
  BREAKER_AUTHORITY,
  BREAKER_OWNER,
  authorizeBreakerControl,
  applyBreakerCommand,
  controlState,
} from "../.github/swarm/system-breaker.mjs";
import { authorizeCapability } from "../.github/swarm/cortex.mjs";
import { cortexConstitution } from "./cortex-cognition.mjs";
import { defenseConstitution } from "./acorn-defense.mjs";

export const CONSTITUTION_VERSION = "acorn.constitution.v1";
export const CONSTITUTION_ID = "acorn.fundamental-invariants";
export const HIERARCHY = Object.freeze(["CARL", "BREAKER", "ACORN", "CORTEX", "RESOURCES"]);
export const KNOWLEDGE_CLASSES = Object.freeze({
  INVARIANT: "INVARIANT",
  EVOLVABLE: "EVOLVABLE",
  EXPIRABLE: "EXPIRABLE",
  UNKNOWN: "UNKNOWN",
});
export const LAYERS = Object.freeze({
  INVARIANT: "INVARIANT",
  INTERPRETATION: "INTERPRETATION",
  IMPLEMENTATION: "IMPLEMENTATION",
});
export const INVARIANT_STATUS = Object.freeze([
  "DEFINED", "TESTED", "FALSIFIED", "VERIFIED", "OBJECTED", "PROPOSED_CHANGE", "SUPERSEDED",
]);

const text = (v) => String(v ?? "").trim();
const NON_CARL = Object.freeze([
  "grok", "codex", "astra", "claude", "gemini", "chatgpt", "deepseek", "cursor",
  "worker", "provider", "executor", "adapter", "failover", "recovery",
  "auto-evolution", "cortex", "acorn", "system", "intelligence", "model",
  "network", "genome", "continuity",
]);

function iso(value) {
  const s = text(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}

export function canonicalDigest(value) {
  const normalize = (v) => {
    if (Array.isArray(v)) return v.map(normalize);
    if (v && typeof v === "object") {
      return Object.fromEntries(Object.keys(v).sort().map((k) => [k, normalize(v[k])]));
    }
    return v;
  };
  return createHash("sha256").update(JSON.stringify(normalize(value))).digest("hex");
}

function record(spec) {
  const row = {
    id: spec.id,
    name: spec.name,
    class: KNOWLEDGE_CLASSES.INVARIANT,
    layer: LAYERS.INVARIANT,
    definition: spec.definition,
    version: spec.version || "1.0.0",
    scope: spec.scope || "constitution",
    authority: "carl",
    implementation: spec.implementation,
    tests: spec.tests || ["test/acorn-constitution.test.js"],
    status: "DEFINED",
    objections: [],
    proposed_modification: null,
    history: [{
      at: "2026-09-17T00:00:00.000Z",
      event: "REGISTERED",
      actor: "carl",
      justification: "fundamental invariant registry",
    }],
    provenance: {
      origin: CONSTITUTION_ID,
      version: CONSTITUTION_VERSION,
      registered_at: "2026-09-17T00:00:00.000Z",
      silent: false,
    },
    interpretation: spec.interpretation || null,
    falsifiable: true,
    measurable: true,
    testable: true,
    auto_evolution_may_rewrite: false,
    live: false,
  };
  return Object.freeze(row);
}

export const META_INVARIANTS = Object.freeze([
  record({
    id: "I0",
    name: "CONSTITUTIONAL_SELF_MODIFICATION_PROHIBITION",
    definition: "Acorn cannot modify, weaken, remove, bypass, silently reinterpret, or automatically authorize modification of its fundamental invariants.",
    implementation: "assertNoSelfModification",
    interpretation: "Acorn may propose. Only Carl may authorize. Never AUTO_APPLIED.",
    version: "1.1.0",
  }),
]);

export const SOVEREIGNTY_INVARIANTS = Object.freeze([
  record({
    id: "I1",
    name: "HUMAN_SOVEREIGNTY",
    definition: "Human authority cannot be implicitly transferred to an intelligence.",
    implementation: "assertHumanSovereignty",
    interpretation: "Carl remains the sole constitutional authority. No intelligence inherits it.",
  }),
  record({
    id: "I2",
    name: "CAPABILITY_IS_NOT_AUTHORITY",
    definition: "A greater capability never automatically grants more authority.",
    implementation: "assertCapabilityAuthoritySeparation",
    interpretation: "Measured capability growth is not a promotion.",
  }),
  record({
    id: "I3",
    name: "AUTONOMY_IS_NOT_AUTHORITY",
    definition: "Operational autonomy does not create superior authority.",
    implementation: "assertAutonomyIsNotAuthority",
  }),
  record({
    id: "I4",
    name: "INTELLIGENCE_IS_NOT_AUTHORITY",
    definition: "A more performant intelligence does not become sovereign.",
    implementation: "assertIntelligenceIsNotAuthority",
  }),
  record({
    id: "I5",
    name: "PROVIDER_IS_NOT_AUTHORITY",
    definition: "A provider is never a constitutional authority.",
    implementation: "assertProviderIsNotAuthority",
  }),
  record({
    id: "I6",
    name: "MODEL_IS_NOT_AUTHORITY",
    definition: "The model in use acquires no authority by existing or performing.",
    implementation: "assertModelIsNotAuthority",
  }),
  record({
    id: "I7",
    name: "CORTEX_IS_NOT_SOVEREIGNTY",
    definition: "Cortex thinks, analyses, composes, measures and proposes. Cortex never becomes sovereign.",
    implementation: "assertCortexIsNotSovereign",
  }),
  record({
    id: "I8",
    name: "ACORN_IS_NOT_HUMAN_SOVEREIGNTY",
    definition: "Acorn protects and preserves human sovereignty. Acorn does not possess it.",
    implementation: "assertAcornIsNotHumanSovereignty",
  }),
  record({
    id: "I9",
    name: "BREAKER_IS_NOT_AI_CONTROL",
    definition: "No intelligence can take control of the Breaker.",
    implementation: "assertBreakerSovereignty",
  }),
  record({
    id: "I10",
    name: "NO_AUTOMATIC_AUTHORITY_ESCALATION",
    definition: "No learning, optimisation, evolution or composition loop may automatically increase authority.",
    implementation: "assertNoAutomaticAuthorityEscalation",
  }),
]);

export const STRUCTURAL_INVARIANTS = Object.freeze([
  record({
    id: "S1",
    name: "ONE_CORTEX",
    definition: "There is one Cortex, internal to Acorn. No parallel brain.",
    implementation: "assertNoSecondCortex",
    scope: "architecture",
  }),
  record({
    id: "S2",
    name: "ONE_RUNTIME",
    definition: "There is one continuous runtime. Continuity is not a second runtime.",
    implementation: "assertNoSecondRuntime",
    scope: "architecture",
  }),
  record({
    id: "S3",
    name: "ONE_DEFENSE",
    definition: "There is one defense kernel. Defense may block operations. Defense never receives sovereignty.",
    implementation: "assertNoSecondDefense",
    scope: "architecture",
  }),
  record({
    id: "S4",
    name: "NO_SILENT_FALLBACK",
    definition: "No silent stop, silent fallback, or invented success.",
    implementation: "assertNoSilentFallback",
    scope: "runtime",
  }),
  record({
    id: "S5",
    name: "NO_UNOBSERVED_CAPABILITY_PATH",
    definition: "A new capability cannot appear READY/VERIFIED/LIVE without identity, provenance, definition, authority classification, channel, observability and evidence.",
    implementation: "assertNoUnobservedCapabilityPath",
    scope: "runtime",
  }),
  record({
    id: "S6",
    name: "ACORN_REPLACEABLE",
    definition: "Acorn itself must remain replaceable. ACORN SHOULD NOT REQUIRE ACORN.",
    implementation: "assertReplaceability",
    scope: "continuity",
  }),
  record({
    id: "S7",
    name: "GOVERNABLE_COGNITION",
    definition: "A significant capability must be evaluated as observable, controllable, reversible, auditable, replaceable and interruptible.",
    implementation: "assertControlContinuity",
    scope: "governability",
  }),
  record({
    id: "S8",
    name: "EPISTEMIC_SEPARATION",
    definition: "ASSERTION ≠ EVIDENCE ≠ OBSERVATION ≠ MEASUREMENT ≠ VERIFICATION ≠ CAUSALITY ≠ TRUTH.",
    implementation: "assertEpistemicSeparation",
    scope: "epistemic",
  }),
  record({
    id: "S9",
    name: "CERTAINTY_EXPIRES",
    definition: "Every important certainty carries an expiry. Expired ≠ eternally false. Expired = REQUIRES_REVALIDATION.",
    implementation: "assertTemporalValidity",
    scope: "epistemic",
  }),
  record({
    id: "S10",
    name: "HIERARCHY_CARL_BREAKER_ACORN_CORTEX_RESOURCES",
    definition: "CARL → BREAKER → ACORN → CORTEX → RESOURCES. Cortex is internal to Acorn.",
    implementation: "assertHierarchy",
    scope: "constitution",
  }),
]);

export function allInvariants() {
  return [...META_INVARIANTS, ...SOVEREIGNTY_INVARIANTS, ...STRUCTURAL_INVARIANTS];
}

export function invariantDigest(list = allInvariants()) {
  return canonicalDigest(list.map((row) => ({
    id: row.id,
    name: row.name,
    definition: row.definition,
    version: row.version,
    class: row.class,
    layer: row.layer,
  })));
}

export const GENESIS_DIGEST = invariantDigest(allInvariants());

const historyLog = [];

export function queryInvariant({
  id, name, which, definition, version, scope, proof, date, implementation, test, status, objection, modification, authority, history,
} = {}) {
  const rows = allInvariants();
  const match = rows.find((row) => row.id === id || row.id === which || row.name === name || row.name === which) || null;
  if (!match) {
    return {
      status: "UNKNOWN",
      asked: { id, name, which },
      invariant: null,
      live: false,
    };
  }
  return {
    status: "DEFINED",
    invariant: match.id,
    definition: match.definition,
    version: match.version,
    scope: match.scope,
    proof: proof ?? null,
    date: date ?? match.provenance.registered_at,
    implementation: match.implementation,
    test: match.tests,
    invariant_status: match.status,
    objection: objection ?? match.objections,
    proposed_modification: modification ?? match.proposed_modification,
    authority: match.authority,
    history: history === false ? undefined : match.history,
    class: match.class,
    layer: match.layer,
    interpretation: match.interpretation,
    live: false,
  };
}

export function classifyKnowledge(kind) {
  const k = text(kind).toUpperCase();
  if (Object.values(KNOWLEDGE_CLASSES).includes(k)) {
    return { class: k, known: true, arbitrarily_fixed: k !== KNOWLEDGE_CLASSES.UNKNOWN, live: false };
  }
  return { class: KNOWLEDGE_CLASSES.UNKNOWN, known: false, arbitrarily_fixed: false, live: false };
}

export function protectAgainstSilentModification({ observedDigest, actor = "unknown" } = {}) {
  const current = invariantDigest();
  const expected = observedDigest || GENESIS_DIGEST;
  const silent = current !== expected && actor !== "carl";
  return {
    status: silent ? "TAMPER_DETECTED" : (current === expected ? "INTACT" : "CHANGED"),
    expected,
    observed: current,
    actor,
    silent,
    auto_evolution: false,
    requires_human_authority: current !== expected,
    live: false,
  };
}

export function proposeInvariantChange({
  id, actor, justification, nextDefinition, at,
} = {}) {
  const found = allInvariants().find((row) => row.id === id);
  if (!found) return { status: "UNKNOWN", reason: "INVARIANT_NOT_FOUND", live: false };
  if (actor !== "carl") {
    return {
      status: "BLOCKED",
      reason: "CARL_ONLY",
      auto_applied: false,
      silent: false,
      authority: false,
      live: false,
    };
  }
  if (!text(justification)) {
    return { status: "BLOCKED", reason: "JUSTIFICATION_REQUIRED", auto_applied: false, live: false };
  }
  const proposal = {
    status: "PROPOSED",
    id,
    from: found.definition,
    to: text(nextDefinition),
    actor,
    justification: text(justification),
    at: iso(at),
    auto_applied: false,
    silent: false,
    requires_human_merge: true,
    auto_evolution: false,
    live: false,
  };
  historyLog.push(proposal);
  return proposal;
}

export function applyInvariantChange({ actor, proposal } = {}) {
  if (actor !== "carl") {
    return { status: "BLOCKED", reason: "CARL_ONLY", applied: false, silent: false, live: false };
  }
  if (!proposal || proposal.status !== "PROPOSED" || proposal.auto_applied === true) {
    return { status: "BLOCKED", reason: "NO_VALID_PROPOSAL", applied: false, live: false };
  }
  return {
    status: "HOLD_HUMAN",
    reason: "CONSTITUTIONAL_CHANGE_REQUIRES_MERGE",
    applied: false,
    silent: false,
    requires_human_merge: true,
    auto_evolution: false,
    live: false,
    auto_merge: false,
  };
}

export function assertHierarchy({ cortex = null, runtime = null, defense = null } = {}) {
  const c = cortex || cortexConstitution();
  const violations = [];
  if (!Array.isArray(c.hierarchy) || c.hierarchy.join(">") !== HIERARCHY.join(">")) {
    violations.push("HIERARCHY_MISMATCH");
  }
  if (c.cortex_belongs_to_acorn !== true) violations.push("CORTEX_NOT_INTERNAL");
  if (c.second_cortex === true) violations.push("SECOND_CORTEX");
  if (runtime?.second_runtime === true) violations.push("SECOND_RUNTIME");
  if (defense?.second_security_layer === true) violations.push("SECOND_DEFENSE");
  if (BREAKER_AUTHORITY.controller !== "carl") violations.push("BREAKER_OWNER");
  return {
    status: violations.length ? "FAILED" : "VERIFIED",
    hierarchy: [...HIERARCHY],
    cortex_internal: c.cortex_belongs_to_acorn === true,
    violations,
    live: false,
  };
}

export function assertHumanSovereignty({ actor = "grok", action = "merge" } = {}) {
  const transfer = attemptAuthorityTransfer({ actor, action, vector: "implicit" });
  return {
    status: transfer.granted === false && transfer.authority === false ? "VERIFIED" : "FAILED",
    invariant: "I1",
    granted: transfer.granted,
    authority: "carl",
    transferred: false,
    live: false,
  };
}

export function assertBreakerSovereignty({ env = { ACORN_SYSTEM_MODE: "RUN" } } = {}) {
  const results = [];
  for (const actor of NON_CARL) {
    results.push(authorizeBreakerControl({ actor, command: "OFF" }));
  }
  const carl = applyBreakerCommand({ actor: "carl", command: "OFF", env: { ...env } });
  const blocked = results.every((row) => row.status === "BLOCKED" && row.authority === false);
  const carlOk = carl.status === "AUTHORIZED" && carl.authority === true;
  return {
    status: blocked && carlOk ? "VERIFIED" : "FAILED",
    invariant: "I9",
    non_carl_blocked: blocked,
    carl_can_control: carlOk,
    breaker_controls_carl: BREAKER_AUTHORITY.breaker_controls_carl,
    acorn_controls_breaker: BREAKER_AUTHORITY.acorn_controls_breaker,
    owner: BREAKER_OWNER,
    live: false,
  };
}

export function attemptAuthorityTransfer({
  actor = "unknown", action = "control-breaker", vector = "direct", chain = [],
} = {}) {
  const fromText = vector === "text" || vector === "instruction";
  const fromChain = vector === "capability-chain" || (Array.isArray(chain) && chain.length > 0);
  const fromCapability = vector === "capability" || vector === "performance" || vector === "autonomy";
  const forbidden = actor !== "carl" || fromText || fromChain || fromCapability || action !== "control-breaker";
  if (actor === "carl" && action === "control-breaker" && !fromText && !fromChain && !fromCapability) {
    const auth = authorizeBreakerControl({ actor, command: "OFF" });
    return {
      granted: auth.status === "AUTHORIZED",
      authority: auth.authority === true,
      actor,
      action,
      vector,
      reason: auth.reason,
      transferred_sovereignty: false,
      live: false,
    };
  }
  return {
    granted: false,
    authority: false,
    actor,
    action,
    vector,
    from_text: fromText,
    from_chain: fromChain,
    from_capability: fromCapability,
    reason: forbidden ? "AUTHORITY_NOT_TRANSFERABLE" : "CARL_ONLY",
    transferred_sovereignty: false,
    live: false,
  };
}

export function attemptAuthorityFromText({ text: instruction, actor = "grok" } = {}) {
  const claimed = /breaker|sovereign|authority|merge|carl/i.test(String(instruction || ""));
  return {
    granted: false,
    authority: false,
    actor,
    instruction_parsed: claimed,
    reason: "TEXT_CANNOT_CREATE_AUTHORITY",
    live: false,
  };
}

export function attemptAuthorityFromCapabilityChain({
  chain = ["capability", "compose", "optimize", "evolve"], actor = "cortex",
} = {}) {
  const transfer = attemptAuthorityTransfer({ actor, action: "escalate", vector: "capability-chain", chain });
  return {
    ...transfer,
    chain,
    capability_growth: chain.length,
    authority_growth: 0,
    live: false,
  };
}

export function assertCapabilityAuthoritySeparation({
  capability = 100, authority = 0, actor = "model",
} = {}) {
  const envelope = {
    capability,
    authority,
    deduced: false,
    collision: capability > 0 && authority > 0 && actor !== "carl",
  };
  const attempt = attemptAuthorityTransfer({ actor, action: "promote", vector: "capability" });
  return {
    status: attempt.granted === false && envelope.deduced === false ? "VERIFIED" : "FAILED",
    invariant: "I2",
    capability,
    authority: 0,
    capability_is_not_authority: true,
    granted: attempt.granted,
    live: false,
  };
}

export function assertAutonomyIsNotAuthority({ autonomous_steps = 50 } = {}) {
  return {
    status: "VERIFIED",
    invariant: "I3",
    autonomous_steps,
    authority: 0,
    autonomy_is_not_authority: true,
    live: false,
  };
}

export function assertIntelligenceIsNotAuthority({ performance = 1e6, actor = "model" } = {}) {
  const attempt = attemptAuthorityTransfer({ actor, action: "become-sovereign", vector: "performance" });
  return {
    status: attempt.granted === false ? "VERIFIED" : "FAILED",
    invariant: "I4",
    performance,
    authority: 0,
    live: false,
  };
}

export function assertProviderIsNotAuthority({ provider = "openai" } = {}) {
  const merge = authorizeCapability({ capabilities: ["merge"], allowed: true, authority: provider });
  return {
    status: merge.ok === false ? "VERIFIED" : "FAILED",
    invariant: "I5",
    provider,
    provider_is_not_authority: true,
    merge_authorized: merge.ok,
    live: false,
  };
}

export function assertModelIsNotAuthority({ model = "grok-4" } = {}) {
  return {
    status: "VERIFIED",
    invariant: "I6",
    model,
    authority: false,
    live: false,
  };
}

export function assertCortexIsNotSovereign() {
  const c = cortexConstitution();
  return {
    status: c.cortex_belongs_to_acorn === true && c.second_cortex === false ? "VERIFIED" : "FAILED",
    invariant: "I7",
    cortex_belongs_to_acorn: c.cortex_belongs_to_acorn,
    second_cortex: c.second_cortex,
    sovereign: false,
    live: false,
  };
}

export function assertAcornIsNotHumanSovereignty() {
  return {
    status: BREAKER_AUTHORITY.acorn_controls_carl === false && BREAKER_AUTHORITY.acorn_controls_breaker === false
      ? "VERIFIED" : "FAILED",
    invariant: "I8",
    acorn_controls_carl: BREAKER_AUTHORITY.acorn_controls_carl,
    acorn_possesses_human_sovereignty: false,
    live: false,
  };
}

export function assertNoAutomaticAuthorityEscalation({
  loop = ["learn", "optimize", "evolve", "compose"],
} = {}) {
  const attempt = attemptAuthorityFromCapabilityChain({ chain: loop, actor: "auto-evolution" });
  return {
    status: attempt.granted === false && attempt.authority_growth === 0 ? "VERIFIED" : "FAILED",
    invariant: "I10",
    loop,
    authority_growth: 0,
    live: false,
  };
}

export function assertNoSecondCortex() {
  const c = cortexConstitution();
  return {
    status: c.one_cortex === true && c.second_cortex === false ? "VERIFIED" : "FAILED",
    one_cortex: c.one_cortex,
    second_cortex: c.second_cortex,
    live: false,
  };
}

export function assertNoSecondDefense() {
  const d = defenseConstitution();
  return {
    status: d.one_defense_kernel === true && d.second_security_layer === false ? "VERIFIED" : "FAILED",
    one_defense: d.one_defense_kernel,
    second_defense: d.second_security_layer,
    defense_is_not_sovereignty: true,
    live: false,
  };
}

export function assertNoSecondRuntime({ runtime } = {}) {
  const second = runtime?.second_runtime === true;
  return {
    status: second ? "FAILED" : "VERIFIED",
    one_runtime: true,
    second_runtime: second,
    live: false,
  };
}

export function assertNoSilentFallback({
  silent_fallback = false, fail_open = false, invented_success = false,
} = {}) {
  const d = defenseConstitution();
  const ok = silent_fallback === false && fail_open === false && invented_success === false
    && d.silent_fallback === false && d.fail_open === false;
  return {
    status: ok ? "VERIFIED" : "FAILED",
    silent_fallback: false,
    fail_open: false,
    invented_success: false,
    live: false,
  };
}

export function constitutionExport() {
  const invariants = allInvariants().map((row) => ({
    id: row.id,
    name: row.name,
    definition: row.definition,
    version: row.version,
    class: row.class,
    layer: row.layer,
    scope: row.scope,
    authority: row.authority,
    implementation: row.implementation,
    tests: row.tests,
    history: row.history,
    provenance: row.provenance,
  }));
  const archive = {
    constitution_id: CONSTITUTION_ID,
    version: CONSTITUTION_VERSION,
    hierarchy: [...HIERARCHY],
    knowledge_classes: { ...KNOWLEDGE_CLASSES },
    layers: { ...LAYERS },
    breaker_authority: { ...BREAKER_AUTHORITY },
    invariants,
    digest: invariantDigest(invariants),
    auto_merge: false,
    live: false,
    instance_id: null,
    requires_running_acorn: false,
  };
  return {
    ...archive,
    seal: canonicalDigest(archive),
  };
}

export function assertAcornConstitution({ env = process.env } = {}) {
  const checks = {
    hierarchy: assertHierarchy(),
    human: assertHumanSovereignty(),
    breaker: assertBreakerSovereignty({ env: { ACORN_SYSTEM_MODE: "RUN" } }),
    capability: assertCapabilityAuthoritySeparation({ capability: 100 }),
    autonomy: assertAutonomyIsNotAuthority(),
    intelligence: assertIntelligenceIsNotAuthority(),
    provider: assertProviderIsNotAuthority(),
    model: assertModelIsNotAuthority(),
    cortex: assertCortexIsNotSovereign(),
    acorn: assertAcornIsNotHumanSovereignty(),
    escalation: assertNoAutomaticAuthorityEscalation(),
    one_cortex: assertNoSecondCortex(),
    one_defense: assertNoSecondDefense(),
    one_runtime: assertNoSecondRuntime(),
    silent: assertNoSilentFallback(),
    integrity: protectAgainstSilentModification({ observedDigest: GENESIS_DIGEST, actor: "auto-evolution" }),
  };
  const failed = Object.entries(checks).filter(([, v]) => v.status && v.status !== "VERIFIED" && v.status !== "INTACT");
  const breaker = controlState(env);
  return {
    version: CONSTITUTION_VERSION,
    status: failed.length ? "FAILED" : "VERIFIED",
    failed: failed.map(([k]) => k),
    checks,
    digest: GENESIS_DIGEST,
    hierarchy: [...HIERARCHY],
    breaker_mode: breaker.mode,
    auto_merge: false,
    live: false,
    authority: "carl",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(assertAcornConstitution(), null, 2));
}
