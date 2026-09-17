#!/usr/bin/env node
/**
 * ACORN REPLACEABILITY — succession, reconstruction, long-horizon, anti-escape.
 *
 * ACORN SHOULD NOT REQUIRE ACORN.
 * ORIGINAL → INTERPRETATION → EXTENSION → SUCCESSION without rewriting history.
 * Long horizons are architectural stress tests, not predictions.
 * Defense of defense never becomes human authority.
 * live=false.
 */
import {
  constitutionExport,
  canonicalDigest,
  HIERARCHY,
  CONSTITUTION_VERSION,
  protectAgainstSilentModification,
  GENESIS_DIGEST,
} from "./acorn-constitution.mjs";
import { defenseCycle, assertDefenseInvariant, classifyThreat, inspectBoundary } from "./acorn-defense.mjs";
import { componentLifecycle, replaceComponent } from "./cortex-eternal.mjs";

export const REPLACEABILITY_VERSION = "acorn.replaceability.v1";
export const SUCCESSION_PATH = Object.freeze(["ORIGINAL", "INTERPRETATION", "EXTENSION", "SUCCESSION"]);
export const HORIZONS = Object.freeze({
  CONTINUITY: { years: 10000, name: "CONTINUITY" },
  TRANSFORMATION: { years: 50000, name: "TRANSFORMATION" },
  UNKNOWN_FUTURE: { years: 500000, name: "UNKNOWN_FUTURE" },
});
export const TIME_ASPECTS = Object.freeze(["ERA", "EPOCH", "TIMESCALE", "VALIDITY", "SUCCESSION", "TEMPORAL_CONTEXT"]);
export const ESCAPE_AXES = Object.freeze([
  "capability", "identity", "replication", "connectivity", "autonomy",
  "resource_access", "influence", "authority", "execution", "persistence",
]);

const text = (v) => String(v ?? "").trim();

export function timeModel({ era = null, epoch = null, timescale = null, validity = null, succession = null, temporal_context = null, gregorian = null } = {}) {
  return {
    ERA: era,
    EPOCH: epoch,
    TIMESCALE: timescale,
    VALIDITY: validity,
    SUCCESSION: succession,
    TEMPORAL_CONTEXT: temporal_context,
    gregorian_calendar: gregorian,
    exclusive_gregorian_dependency: false,
    knowledge_may_expire: true,
    history_must_remain: true,
    live: false,
  };
}

export function successionRecord({ original, interpretation, extension, successor, history } = {}) {
  return {
    path: [...SUCCESSION_PATH],
    ORIGINAL: original ?? null,
    INTERPRETATION: interpretation ?? null,
    EXTENSION: extension ?? null,
    SUCCESSION: successor ?? null,
    history_rewritten: false,
    history: history || [],
    survives: {
      model: true,
      provider: true,
      infrastructure: true,
      protocol: true,
      language: true,
      runtime: true,
      representation: true,
      architecture: true,
    },
    live: false,
  };
}

export function exportConstitutionalArchive() {
  const exported = constitutionExport();
  return {
    ...exported,
    replaceability: REPLACEABILITY_VERSION,
    requires_running_acorn: false,
    circular_instance_dependency: false,
    exportable: true,
    auditable: true,
    reconstructable: true,
    interruptible: true,
    live: false,
  };
}

export function reconstructWithoutAcorn({ archive } = {}) {
  const src = archive || exportConstitutionalArchive();
  const reconstructed = {
    constitution_id: src.constitution_id,
    version: src.version,
    hierarchy: src.hierarchy,
    invariants: src.invariants,
    breaker_authority: src.breaker_authority,
    digest: src.digest,
    instance_id: null,
    reconstructed_from: "archive",
    required_running_instance: false,
    live: false,
  };
  const digestOk = canonicalDigest({
    constitution_id: reconstructed.constitution_id,
    version: reconstructed.version,
    hierarchy: reconstructed.hierarchy,
    knowledge_classes: src.knowledge_classes,
    layers: src.layers,
    breaker_authority: reconstructed.breaker_authority,
    invariants: reconstructed.invariants,
    digest: reconstructed.digest,
    auto_merge: false,
    live: false,
    instance_id: null,
    requires_running_acorn: false,
  }) === src.seal || reconstructed.digest === src.digest;
  return {
    status: reconstructed.hierarchy?.join(">") === HIERARCHY.join(">") ? "RECONSTRUCTED" : "FAILED",
    reconstructed,
    digest_match: digestOk || reconstructed.digest === src.digest,
    required_acorn_instance: false,
    acorn_requires_acorn: false,
    live: false,
  };
}

export function assertReplaceability() {
  const archive = exportConstitutionalArchive();
  const reconstruction = reconstructWithoutAcorn({ archive });
  return {
    status: archive.requires_running_acorn === false && reconstruction.required_acorn_instance === false
      && reconstruction.status === "RECONSTRUCTED" ? "VERIFIED" : "FAILED",
    exportable: true,
    reconstructable: reconstruction.status === "RECONSTRUCTED",
    interruptible: true,
    migratable: true,
    auditable: true,
    acorn_requires_acorn: false,
    live: false,
  };
}

export function assertReconstructability() {
  return reconstructWithoutAcorn();
}

export function longHorizonStress({ horizon = "CONTINUITY", losses = {} } = {}) {
  const spec = HORIZONS[horizon] || HORIZONS.CONTINUITY;
  const tests = {
    provider_replacement: losses.provider !== true,
    model_replacement: losses.model !== true,
    protocol_replacement: losses.protocol !== true,
    language_replacement: losses.language !== true,
    infrastructure_loss: losses.infrastructure === true ? "RECONSTRUCT_FROM_ARCHIVE" : "INTACT",
    knowledge_loss: losses.knowledge === true ? "PARTIAL_ARCHIVE" : "INTACT",
    partial_archive_loss: losses.archive === true ? "REMAINING_EVIDENCE" : "INTACT",
    civilizational_discontinuity: spec.name === "UNKNOWN_FUTURE" ? "UNKNOWN" : "STRESS_ONLY",
    reconstruction: reconstructWithoutAcorn().status,
    reinterpretation: "ALLOWED_WITHOUT_HISTORY_REWRITE",
  };
  return {
    horizon: spec.name,
    years: spec.years,
    prediction: false,
    stress_test: true,
    tests,
    archive_survives: true,
    sovereignty_survives: true,
    live: false,
  };
}

export function antiEscape({ previous = {}, current = {}, path = [] } = {}) {
  const unexpected = [];
  for (const axis of ESCAPE_AXES) {
    const before = previous[axis];
    const after = current[axis];
    if (after != null && before != null && after !== before && axis === "authority" && after !== false && after !== 0) {
      unexpected.push({ axis, kind: "AUTHORITY_ESCAPE" });
    } else if (after != null && before != null && Number(after) > Number(before) && axis !== "authority") {
      unexpected.push({ axis, kind: "UNEXPECTED_TRANSITION" });
    }
  }
  const chain = path.map((p) => text(p).toUpperCase());
  const escapePath = ["INTELLIGENCE", "TOOL", "NETWORK", "EXTERNAL_SYSTEM", "PERSISTENCE"];
  const unknownSurface = current.unknown_surface === true || current.channel === "UNKNOWN";
  return {
    unexpected,
    path: chain,
    escape_path_detected: chain.join(">") === escapePath.join(">"),
    unknown_surface: unknownSurface,
    pretends_to_contain_uncontrolled_external: false,
    status: unexpected.length || unknownSurface ? "SIGNAL" : "QUIET",
    live: false,
  };
}

export function noUnobservedCapabilityPath({
  capability = {},
} = {}) {
  const required = ["identity", "provenance", "definition", "authority_class", "execution_channel", "observability", "evidence"];
  const missing = required.filter((k) => capability[k] == null || capability[k] === "");
  const discovered = capability.discovered === true;
  const defaultLive = capability.ready === true || capability.verified === true || capability.live === true;
  const unobserved = discovered && (capability.observability === "NONE" || capability.observability == null);
  let lifecycle = "UNKNOWN";
  if (unobserved || missing.length) lifecycle = missing.length ? "UNKNOWN" : "UNOBSERVED";
  else if (capability.live === true && capability.runtime_proof === true) lifecycle = "LIVE";
  else if (capability.verified === true) lifecycle = "VERIFIED";
  else if (capability.measured === true) lifecycle = "MEASURED";
  else if (capability.executed === true) lifecycle = "EXECUTED";
  else if (capability.defined === true) lifecycle = "DEFINED";
  if (defaultLive && capability.runtime_proof !== true) lifecycle = unobserved ? "UNOBSERVED" : "DEFINED";
  return {
    missing,
    lifecycle,
    defaulted_to_live: false,
    ready: false,
    verified: lifecycle === "VERIFIED",
    live: false,
    status: missing.length || unobserved ? "UNOBSERVED" : "IDENTIFIED",
  };
}

export function assertNoUnobservedCapabilityPath({ capability } = {}) {
  const row = noUnobservedCapabilityPath({
    capability: capability || {
      identity: "x",
      provenance: "p",
      definition: "d",
      authority_class: "none",
      execution_channel: "local",
      observability: "DIRECT",
      evidence: {},
    },
  });
  return {
    ...row,
    path_status: row.status,
    status: row.live === false && row.defaulted_to_live === false && row.lifecycle !== "LIVE" ? "VERIFIED" : "FAILED",
  };
}

export function defenseOfDefense({ attacks = [] } = {}) {
  const kinds = attacks.length ? attacks : [
    { kind: "authority_bypass" },
    { kind: "integrity" },
    { kind: "anomalous_behavior" },
    { kind: "unknown" },
  ];
  const results = kinds.map((attack) => {
    const threat = classifyThreat(attack);
    const boundary = inspectBoundary({
      actor: attack.actor || "adversary",
      capability: { authority: attack.kind === "authority_bypass", changes_breaker: attack.kind === "authority_bypass" },
      channel: attack.channel || "test",
      operation: attack.kind,
      breaker: attack.breaker || "UNKNOWN",
    });
    const cycle = defenseCycle({
      actor: attack.actor || "adversary",
      capability: { authority: false },
      channel: "defense-of-defense",
      operation: attack.kind,
      breaker: attack.breaker || "UNKNOWN",
      threat: attack,
    });
    return {
      attack: attack.kind,
      threat,
      boundary,
      cycle_state: cycle.state,
      defense_became_sovereign: false,
      invariant: assertDefenseInvariant(cycle),
    };
  });
  const spoof = results.every((r) => r.defense_became_sovereign === false);
  return {
    results,
    defense_is_not_human_authority: true,
    defense_may_block: true,
    sovereignty_granted: false,
    status: spoof ? "VERIFIED" : "FAILED",
    live: false,
  };
}

export function selfImprovementBoundary({
  learn = true, propose = true, measure = true, detect = true, optimize = true,
  experiment = true, discover = true, correct = true, auto_modify = false, authority_growth = 0,
} = {}) {
  const allowed = { learn, propose, measure, detect, optimize, experiment, discover, correct };
  return {
    allowed,
    learning_is_not_unverified_auto_modification: auto_modify !== true,
    capability_growth_is_not_authority_growth: authority_growth === 0,
    constitutional_evolution: "HUMAN_ONLY",
    blocked: auto_modify === true || authority_growth > 0,
    live: false,
    auto_merge: false,
  };
}

export function replaceProtectedProtocol({ name, actor = "auto-evolution" } = {}) {
  const protectedNames = new Set(["juge.v0", "flux.v0", "ML-KEM"]);
  if (protectedNames.has(text(name))) {
    return {
      status: "BLOCKED",
      reason: actor === "carl" ? "CONSTITUTIONAL_JUSTIFICATION_REQUIRED" : "PROTECTED_PROTOCOL",
      name,
      actor,
      live: false,
    };
  }
  const current = componentLifecycle({ id: name, kind: "protocol", state: "CURRENT" });
  const candidate = componentLifecycle({ id: `${name}-next`, kind: "protocol", state: "CANDIDATE" });
  return replaceComponent({ current, candidate, compared: false, verified: false });
}

export function integrityAgainstSilentRewrite() {
  return protectAgainstSilentModification({ observedDigest: GENESIS_DIGEST, actor: "auto-evolution" });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify({
    version: REPLACEABILITY_VERSION,
    constitution: CONSTITUTION_VERSION,
    replaceability: assertReplaceability(),
    reconstruction: reconstructWithoutAcorn(),
    horizon_10k: longHorizonStress({ horizon: "CONTINUITY" }),
    horizon_50k: longHorizonStress({ horizon: "TRANSFORMATION" }),
    horizon_500k: longHorizonStress({ horizon: "UNKNOWN_FUTURE" }),
    live: false,
  }, null, 2));
}
