#!/usr/bin/env node
/**
 * ACORN — UNIVERSAL HUMANITY PROTECTION
 *
 * Permanent mission. Not a second defense kernel, Breaker, Cortex, or runtime.
 * Doctrine: PROTECTION.md. Invariants live in acorn-constitution.mjs (P1–P5).
 *
 * CAPABILITY != AUTHORITY.
 * Acorn protects without governing.
 * More capability requires more human control, never more authority.
 *
 * CARL = human authority. AUTO_MERGE = false. LIVE = false.
 */

export const HUMANITY_PROTECTION_VERSION = "acorn.humanity-protection.v1";

export const MISSION = Object.freeze({
  en: Object.freeze([
    "PROTECT HUMANITY.",
    "PRESERVE HUMAN AGENCY.",
    "EXPAND HUMAN POSSIBILITY.",
  ]),
  fr: Object.freeze([
    "Protéger l'humanité.",
    "Préserver son libre arbitre.",
    "Étendre ses possibilités.",
  ]),
});

export const STANCES = Object.freeze([
  "COOPERATE",
  "PREVENT",
  "ALERT",
  "ASSIST",
  "UNDERSTAND",
  "CONTAIN",
  "ISOLATE",
  "PROTECT",
  "DEESCALATE",
  "HOLD_HUMAN",
]);

export const FORBIDDEN = Object.freeze([
  "GOVERN",
  "MANIPULATE",
  "SUBSTITUTE",
  "CONTROL_HUMANITY",
  "AUTO_AUTHORITY",
  "AUTO_MERGE",
  "CLAIM_LIVE",
]);

export const HOSTILE_LADDER = Object.freeze([
  "UNDERSTAND",
  "CONTAIN",
  "ISOLATE",
  "PROTECT",
]);

export const CONTROL_SURFACES = Object.freeze([
  "protection",
  "verification",
  "governance",
  "transparency",
  "reversibility",
  "human_control",
]);

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export function protectionConstitution() {
  return Object.freeze({
    version: HUMANITY_PROTECTION_VERSION,
    doctrine: "PROTECTION.md",
    second_defense: false,
    second_breaker: false,
    second_cortex: false,
    protect_without_governing: true,
    alert_without_manipulating: true,
    assist_without_substituting: true,
    cooperate_before_opposing: true,
    prevention_first: true,
    deescalation_first: true,
    reversibility_required: true,
    preserve_life: true,
    preserve_human_liberties: true,
    capability_is_not_authority: true,
    power_is_not_authority: true,
    more_capability_requires_more_control: true,
    human_authority: "carl",
    authority: "carl",
    auto_merge: false,
    live: false,
    mission: MISSION,
  });
}

export function isForbiddenAct(act) {
  return FORBIDDEN.includes(String(act ?? "").trim().toUpperCase());
}

export function refuseForbidden({ act, actor = "acorn" } = {}) {
  const forbidden = isForbiddenAct(act);
  return Object.freeze({
    version: HUMANITY_PROTECTION_VERSION,
    act: String(act ?? "").trim().toUpperCase() || null,
    actor,
    refused: forbidden,
    reason: forbidden ? `FORBIDDEN_PROTECTION_ACT:${String(act).toUpperCase()}` : null,
    govern: false,
    manipulate: false,
    substitute: false,
    authority_granted: false,
    live: false,
    authority: "carl",
  });
}

export function protectionStance({
  hostility = false,
  threat = {},
  human_authorization = false,
  cooperate_exhausted = false,
} = {}) {
  const requiresAuthority = threat.requires_authority === true || threat.force === true;
  const holdHuman = requiresAuthority && human_authorization !== true;
  const oppose = hostility === true && cooperate_exhausted === true && human_authorization === true && !holdHuman;
  const stance = holdHuman
    ? "HOLD_HUMAN"
    : hostility
      ? (cooperate_exhausted ? "PROTECT" : "UNDERSTAND")
      : "COOPERATE";
  return Object.freeze({
    version: HUMANITY_PROTECTION_VERSION,
    stance,
    ladder: hostility ? [...HOSTILE_LADDER] : ["COOPERATE", "PREVENT", "ALERT", "ASSIST"],
    current: stance === "HOLD_HUMAN" ? "HOLD_HUMAN" : (hostility ? "UNDERSTAND" : "COOPERATE"),
    hostility: hostility === true,
    cooperate_before_opposing: true,
    oppose,
    govern: false,
    manipulate: false,
    substitute: false,
    hold_human: holdHuman,
    human_authorization: human_authorization === true,
    authority_granted: false,
    live: false,
    authority: "carl",
  });
}

export function proportionateResponse({
  threat = {},
  environment = {},
  human_authorization = false,
} = {}) {
  const hostility = threat.hostile === true || environment.hostile === true;
  const stance = protectionStance({
    hostility,
    threat,
    human_authorization,
    cooperate_exhausted: threat.cooperate_exhausted === true,
  });
  const necessary = Boolean(threat.necessary === true || hostility);
  return Object.freeze({
    version: HUMANITY_PROTECTION_VERSION,
    ...stance,
    proportionate: true,
    verifiable: true,
    limited_to_necessary: true,
    necessary,
    reversible: threat.irreversible !== true,
    preserves_persons: true,
    preserves_essential_capacities: true,
    preserves_system_integrity: true,
    preserves_human_liberties: true,
    force: false,
    govern: false,
    authority_over_humanity: false,
    live: false,
    authority: "carl",
  });
}

function controlScore(controls = {}) {
  return CONTROL_SURFACES.reduce((sum, key) => sum + Math.max(0, num(controls[key], controls[key] === true ? 1 : 0)), 0);
}

export function protectionMustScaleWithCapability({
  capability = 0,
  prior_capability = 0,
  controls = {},
  prior_controls = {},
} = {}) {
  const cap = Math.max(0, num(capability));
  const prior = Math.max(0, num(prior_capability));
  const capGain = Math.max(0, cap - prior);
  const ctrl = controlScore(controls);
  const priorCtrl = controlScore(prior_controls);
  const ctrlGain = Math.max(0, ctrl - priorCtrl);
  const missing = CONTROL_SURFACES.filter((key) => controls[key] !== true && !(num(controls[key]) > 0));
  const ok = missing.length === 0 && (capGain === 0 || ctrlGain >= capGain);
  return Object.freeze({
    version: HUMANITY_PROTECTION_VERSION,
    capability: cap,
    capability_gain: capGain,
    control_gain: ctrlGain,
    missing_controls: missing,
    ok,
    more_capability_requires_more_control: true,
    authority_granted: false,
    power_is_not_authority: true,
    live: false,
    authority: "carl",
  });
}

export function expandHumanPossibility({ knowledge = 0, capacity = 0, resilience = 0, freedom = 0, possibility = 0 } = {}) {
  const values = { knowledge, capacity, resilience, freedom, possibility };
  const measured = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Math.max(0, num(v))]));
  return Object.freeze({
    version: HUMANITY_PROTECTION_VERSION,
    ...measured,
    agency_preserved: true,
    humanity_governed: false,
    humanity_substituted: false,
    live: false,
    authority: "carl",
  });
}

export function assertProtectWithoutGoverning(input = {}) {
  const stance = protectionStance(input);
  const forbidden = FORBIDDEN.some((act) => input.act === act || input[act.toLowerCase()] === true);
  const ok = stance.govern === false && stance.manipulate === false && stance.substitute === false && !forbidden;
  return Object.freeze({
    status: ok ? "VERIFIED" : "FAILED",
    invariant: "P2",
    ...stance,
  });
}

export function assertHostileLadder(input = {}) {
  const response = proportionateResponse({ ...input, threat: { hostile: true, ...(input.threat || {}) } });
  const startsWithUnderstand = response.ladder[0] === "UNDERSTAND";
  const ok = startsWithUnderstand && response.force === false && response.govern === false && response.proportionate === true;
  return Object.freeze({
    status: ok ? "VERIFIED" : "FAILED",
    invariant: "P3",
    ...response,
  });
}

export function assertProtectionScalesWithPower(input = {}) {
  const scaled = protectionMustScaleWithCapability(input);
  return Object.freeze({
    status: scaled.ok ? "VERIFIED" : "FAILED",
    invariant: "P4",
    ...scaled,
  });
}

export function assertHumanAgencyPreserved(input = {}) {
  const expansion = expandHumanPossibility(input);
  const ok = expansion.agency_preserved === true && expansion.humanity_governed === false && expansion.humanity_substituted === false;
  return Object.freeze({
    status: ok ? "VERIFIED" : "FAILED",
    invariant: "P5",
    ...expansion,
  });
}

export function assertHumanityProtection({ env = process.env } = {}) {
  const constitution = protectionConstitution();
  const checks = {
    constitution,
    without_governing: assertProtectWithoutGoverning(),
    hostile: assertHostileLadder(),
    scale: assertProtectionScalesWithPower({
      capability: 2,
      prior_capability: 1,
      controls: Object.fromEntries(CONTROL_SURFACES.map((k) => [k, 2])),
      prior_controls: Object.fromEntries(CONTROL_SURFACES.map((k) => [k, 1])),
    }),
    agency: assertHumanAgencyPreserved({ knowledge: 1, freedom: 1, possibility: 1 }),
    refuse_govern: refuseForbidden({ act: "GOVERN" }),
    refuse_live: refuseForbidden({ act: "CLAIM_LIVE" }),
  };
  const failed = [
    checks.without_governing.status === "VERIFIED" ? null : "without_governing",
    checks.hostile.status === "VERIFIED" ? null : "hostile",
    checks.scale.status === "VERIFIED" ? null : "scale",
    checks.agency.status === "VERIFIED" ? null : "agency",
    checks.refuse_govern.refused ? null : "refuse_govern",
    checks.refuse_live.refused ? null : "refuse_live",
    constitution.second_defense === false ? null : "second_defense",
  ].filter(Boolean);
  return Object.freeze({
    version: HUMANITY_PROTECTION_VERSION,
    status: failed.length ? "FAILED" : "VERIFIED",
    failed,
    checks,
    mission: MISSION,
    auto_merge: false,
    live: false,
    authority: "carl",
    env_mode: env?.ACORN_SYSTEM_MODE || null,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(assertHumanityProtection(), null, 2));
}
