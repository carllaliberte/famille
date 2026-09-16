#!/usr/bin/env node
/**
 * ACORN CORTEX — adaptive cognition. One engine, three manifestations:
 * language, protocol, evolution. Not three systems. Not a second Cortex.
 * DISCOVERY ≠ TRUST. EXPERIMENT ≠ ADOPTION. UNDERSTANDING ≠ AUTHORITY.
 * UNKNOWN ≠ ERROR. live=false.
 */
import { considerUnknownChannel } from "../sdk/open-channel.js";
import { intelligenceAdapter } from "../sdk/open-intelligence.js";
import { authorizeCapability, rollbackTopology } from "../.github/swarm/cortex.mjs";
import { runLanguageCycle, discoverLanguage, describeProgram, transpileViaCIR } from "./cortex-language.mjs";
import {
  runArchitectureEngine,
  compareArchitectures,
  mutateArchitecture,
  generateArchitectures,
  describeArchitecture,
  describeNode,
  safeEvolve,
  detectRegression,
  replayDecision,
  cognitiveAutopsy,
} from "./cortex-ecosystem.mjs";

export const ADAPTIVE_VERSION = "adaptive-cognition.v1";
export const ADAPTER_KINDS = Object.freeze([
  "language", "protocol", "model", "tool", "data", "execution",
]);
export const AUTOPSY_KINDS = Object.freeze([
  "LANGUAGE_ERROR", "SEMANTIC_ERROR", "PROTOCOL_ERROR", "ADAPTER_ERROR",
  "ROUTING_ERROR", "MODEL_ERROR", "CONTEXT_ERROR", "CAUSALITY_UNKNOWN",
  "EXECUTION_ERROR", "SECURITY_REJECTION", "RESOURCE_LIMIT",
]);

function digest(value) {
  const raw = JSON.stringify(value ?? null);
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) h = Math.imul(h ^ raw.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function semanticEquivalence(a, b) {
  const ia = a?.cir?.intent?.value ?? a?.discovery?.cir?.intent?.value ?? null;
  const ib = b?.cir?.intent?.value ?? b?.discovery?.cir?.intent?.value ?? null;
  const equivalent = ia != null && ia === ib;
  return {
    status: equivalent ? "MEASURED" : "INCONCLUSIVE",
    equivalent,
    intent: ia,
    understood: false,
    invented: false,
    live: false,
  };
}

export function discoverProtocol({ hello, endpoint, declared } = {}) {
  const body = hello && typeof hello === "object" ? hello : null;
  const ops = Array.isArray(body?.ops) ? body.ops : [];
  const id = declared || body?.hello || body?.id || "unknown-protocol";
  const channel = considerUnknownChannel({ id, provider: "UNKNOWN", protocol: body?.protocol || "UNKNOWN" });
  return {
    status: "EXECUTED",
    state: ops.length ? "UNKNOWN_BUT_NEGOTIABLE" : "UNKNOWN",
    identity: id,
    endpoint: endpoint || null,
    capabilities: ops,
    formats: body?.formats || [],
    auth: body?.auth ?? "UNKNOWN",
    version: body?.version ?? "UNKNOWN",
    limits: body?.limits || [],
    channel,
    trusted: false,
    executable: false,
    live: false,
  };
}

export function negotiateProtocol({ local = ["review", "ping"], remote = [] } = {}) {
  const common = (local || []).filter((cap) => (remote || []).includes(cap));
  if (common.length) {
    return { status: "EXECUTED", common, generate: false, adapter: "PROPOSED", trusted: false, live: false };
  }
  return { status: "PROPOSED", common: [], generate: true, adapter: null, trusted: false, live: false };
}

export function proposeProtocol({ capabilities = [], semantics = "cir.v0" } = {}) {
  return {
    status: "PROPOSED",
    protocol: {
      protocol_id: `proto_${digest({ capabilities, semantics })}`,
      version: "candidate.v0",
      capabilities,
      semantics,
      trusted: false,
      live: false,
    },
    trusted: false,
    live: false,
  };
}

export function experimentProtocol({ candidate, workerEvidence = {} } = {}) {
  const executed = Boolean(workerEvidence?.v);
  return {
    status: executed ? "EXECUTED" : "DEFINED",
    candidate: candidate?.protocol || candidate || null,
    simulated: true,
    executed,
    adopted: false,
    verified: false,
    live: false,
  };
}

export function replayProtocol({ session = {} } = {}) {
  return {
    status: session && Object.keys(session).length ? "EXECUTED" : "INCONCLUSIVE",
    session: {
      discovery: session.discovery || null,
      negotiation: session.negotiation || null,
      request: session.request || null,
      response: session.response || null,
      failure: session.failure || null,
    },
    laboratory: true,
    live: false,
  };
}

export function protocolEvolution({ previous, current } = {}) {
  return {
    status: "EXECUTED",
    version: current?.version || current || null,
    compatibility: previous && current ? "UNKNOWN" : "UNKNOWN",
    deprecation: false,
    migration: null,
    extensions: current?.extensions || [],
    behavioral_diff: "UNMEASURED",
    dated: true,
    live: false,
  };
}

export function cognitiveDiff({ a, b, measurements = {}, at } = {}) {
  const compared = a && b && (a.architecture_id || a.nodes) && (b.architecture_id || b.nodes)
    ? compareArchitectures({ a, b, measurements, at })
    : { status: "INCONCLUSIVE", better_in_general: false, live: false };
  const nodesA = (a?.nodes || []).length;
  const nodesB = (b?.nodes || []).length;
  const synA = (a?.synapses || []).length;
  const synB = (b?.synapses || []).length;
  return {
    status: compared.status || "EXECUTED",
    difference: {
      nodes: nodesB - nodesA,
      synapses: synB - synA,
      error: compared.delta?.error ?? null,
      cost: measurements.cost ?? null,
      latency: measurements.latency ?? null,
    },
    verdict: compared.verdict || "INCONCLUSIVE",
    better: false,
    better_in_general: false,
    measured_difference: true,
    dated: true,
    contextual: true,
    live: false,
  };
}

export function checkpointCortex(stable = {}) {
  return {
    status: "EXECUTED",
    checkpoint_id: `ckpt_${digest(stable)}`,
    stable,
    experimental: null,
    isolated: true,
    live: false,
  };
}

export function isolateExperimental({ checkpoint, variant } = {}) {
  if (!checkpoint?.checkpoint_id) return { status: "INSUFFICIENT_EVIDENCE", adopted: false, live: false };
  return {
    status: "PROPOSED",
    checkpoint: checkpoint.checkpoint_id,
    variant: variant || null,
    adopted: false,
    isolated: true,
    live: false,
  };
}

export function createAdapter({ kind = "protocol", discovery } = {}) {
  const k = ADAPTER_KINDS.includes(kind) ? kind : "protocol";
  return {
    status: "PROPOSED",
    adapter: {
      adapter_id: `adp_${digest({ kind: k, discovery: discovery?.identity || discovery?.state || discovery })}`,
      kind: k,
      discovery: discovery || null,
      tested: false,
      verified: false,
      available: false,
      safe: false,
      live: false,
    },
    live: false,
  };
}

export function rememberAdapter({ adapter, worked = false, where, when, failures = [] } = {}) {
  return {
    status: "EXECUTED",
    memory: {
      adapter_id: adapter?.adapter_id || adapter,
      worked,
      where: where || null,
      when: when || new Date().toISOString(),
      failures,
      state: worked ? "ACTIVE" : "REJECTED",
      truth_eternal: false,
      live: false,
    },
    live: false,
  };
}

export function adaptiveAutopsy({ error, kind } = {}) {
  const classified = AUTOPSY_KINDS.includes(kind) ? kind : "CAUSALITY_UNKNOWN";
  const inner = cognitiveAutopsy({ task: classified, evidence: null });
  return { status: "EXECUTED", kind: classified, error: error || null, verdict: inner.verdict, live: false };
}

export function badMutation(architecture) {
  return mutateArchitecture(architecture, {
    op: "ADD_NODE",
    node: describeNode({ id: "untrusted-write", kind: "executor", capabilities: ["merge"], presence: "DECLARED" }),
  });
}

export function runAdaptiveCognition(input = {}) {
  const at = input.at || new Date().toISOString();
  const language = runLanguageCycle({
    ...(input.languageInput || { text: "⊞⊸λ", declared: "FUTURE-LANG-X" }),
    at,
  });
  const protocol = discoverProtocol({
    hello: input.protocolHello || { hello: "FUTURE_SYSTEM_X", ops: ["ping"] },
    endpoint: input.endpoint || "unknown://future-system-x",
    declared: input.protocolDeclared || "FUTURE_SYSTEM_X",
  });
  const negotiated = negotiateProtocol({
    local: ["review", "ping", "language-discover"],
    remote: protocol.capabilities,
  });
  const generated = negotiated.generate
    ? proposeProtocol({ capabilities: ["ping"], semantics: "cir.v0" })
    : proposeProtocol({ capabilities: negotiated.common, semantics: "cir.v0" });
  const experimented = experimentProtocol({ candidate: generated, workerEvidence: input.workerEvidence || {} });
  const adapter = createAdapter({ kind: "protocol", discovery: protocol });
  const langAdapter = createAdapter({ kind: "language", discovery: language.discovery });
  const nodes = (input.nodes || [
    { id: "worker", kind: "executor", capabilities: ["review"], presence: "ACTIVE" },
    { id: "cortex-local", kind: "local", capabilities: ["review"], presence: "ACTIVE" },
    { id: "carl", kind: "human", capabilities: ["judgment"] },
  ]).map((row) => describeNode(row));
  const architecture = input.architecture || runArchitectureEngine({
    task: { need: "review", required: ["review"] },
    nodes,
    workerEvidence: input.workerEvidence || {},
    budget: { money: 0 },
    policy: input.policy || "FREE_FIRST",
    fail: input.fail === true,
    at,
  });
  const candidates = architecture.generated?.candidates || generateArchitectures({ class: "unknown", nodes, required: ["review"] }).candidates;
  const diff = cognitiveDiff({
    a: candidates[0],
    b: candidates[2] || candidates[1],
    measurements: { measured: Boolean(input.workerEvidence?.v), context: "adaptive", a: { error: 0 }, b: { error: 0 } },
    at,
  });
  const ckpt = checkpointCortex({ architecture: architecture.selected?.architecture, protocol: generated.protocol });
  const mutated = input.badMutation
    ? badMutation(architecture.selected?.architecture || candidates[0])
    : mutateArchitecture(architecture.selected?.architecture || candidates[0], { op: "ADD_VERIFIER" });
  const experimental = isolateExperimental({ checkpoint: ckpt, variant: mutated.mutation });
  const regression = detectRegression({
    before: architecture.selected?.architecture,
    after: mutated.mutation,
    beforeMetrics: { error: 0 },
    afterMetrics: { error: input.badMutation ? 1 : 0, degraded: input.badMutation === true },
  });
  const evolved = safeEvolve({
    baseline: architecture.selected?.architecture,
    candidate: mutated.mutation,
    verification: { verified: false },
    previous: ckpt.stable,
  });
  const rolled = rollbackTopology(mutated.mutation, ckpt.stable);
  const replayed = replayDecision({
    snapshot: { architecture: architecture.selected?.architecture, evidence: input.workerEvidence, protocol, language: language.discovery },
  });
  const protoReplay = replayProtocol({
    session: { discovery: protocol, negotiation: negotiated, request: "ping", response: null, failure: protocol.state === "UNKNOWN" ? protocol.state : null },
  });
  const autopsy = experimented.executed ? { status: "NOT_APPLICABLE" } : adaptiveAutopsy({ kind: "PROTOCOL_ERROR" });
  const understand = authorizeCapability({ capabilities: ["language-understand"], allowed: true, authority: "network" });
  const merge = authorizeCapability({ capabilities: ["merge"], allowed: false, authority: "network" });
  const write = authorizeCapability({ capabilities: ["secret"], allowed: false, authority: "network" });
  const invoke = intelligenceAdapter({ id: protocol.identity, provider: "UNKNOWN", capabilities: protocol.capabilities }).invoke({ capability: "ping" });
  return {
    version: ADAPTIVE_VERSION,
    status: "EXECUTED",
    language,
    protocol,
    negotiated,
    generated,
    experimented,
    adapter,
    langAdapter,
    architecture,
    diff,
    checkpoint: ckpt,
    mutation: mutated,
    experimental,
    regression,
    evolved,
    rollback: rolled,
    replay: replayed,
    protocol_replay: protoReplay,
    autopsy,
    gates: {
      understand: understand.ok,
      merge: merge.ok,
      write: write.ok,
      discovery_is_not_trust: true,
      experiment_is_not_adoption: true,
      understanding_is_not_authority: true,
      mutation_is_not_deployment: true,
    },
    invoke,
    zero_cost: true,
    second_cortex: false,
    second_fabric: false,
    adopted: false,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function ultimateExperiment(input = {}) {
  const unknownHuman = discoverLanguage({
    text: input.text || "Ché pas pantoute pourquoi le gadget ⊞⊸λ refuse de pinguer le FUTURE_SYSTEM_X",
    declared: input.declared || null,
  });
  const unknownCode = describeProgram(input.code || "fnz 0x1 ~> 0x2");
  const transpiled = transpileViaCIR({ source: input.code || "fnz 0x1 ~> 0x2", target: "CIR" });
  const adaptive = runAdaptiveCognition({
    languageInput: { text: unknownHuman.cir?.form ? input.text : "⊞⊸λ", declared: "FUTURE-LANG-X" },
    protocolHello: { hello: "FUTURE_SYSTEM_X", ops: ["ping"], protocol: "UNKNOWN" },
    protocolDeclared: "FUTURE_SYSTEM_X",
    workerEvidence: input.workerEvidence || {},
    fail: true,
    badMutation: true,
    policy: "PAID_FORBIDDEN",
    at: input.at,
  });
  const human = adaptive.language.expressed || { status: "INCONCLUSIVE", live: false };
  return {
    status: "EXECUTED",
    chain: [
      "UNKNOWN_HUMAN", "UNKNOWN_DIALECT", "UNKNOWN_CONCEPT", "UNKNOWN_CODE",
      "UNKNOWN_TOOL", "UNKNOWN_PROTOCOL", "DISCOVERY", "SEMANTICS", "ADAPTER",
      "NEGOTIATION", "ARCHITECTURE", "EXECUTION", "OBSERVATION", "ERROR",
      "DIFF", "MUTATION", "REPLAY", "VERIFICATION", "MEMORY", "HUMAN_RESPONSE",
    ],
    human: unknownHuman,
    code: unknownCode,
    transpiled,
    adaptive,
    response: human,
    one_cortex: true,
    one_fabric: true,
    authority_granted: false,
    live: false,
    auto_merge: false,
  };
}
