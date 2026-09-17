/**
 * ACORN GLOBAL SYSTEM BREAKER
 *
 * Constitutional control rule:
 *   CARL controls the BREAKER.
 *   The BREAKER does not control CARL.
 *   ACORN controls neither CARL nor the BREAKER.
 *
 * The Breaker is the execution gate after Carl's sovereign authority and
 * before Acorn/Cortex and every downstream intelligence, provider, worker,
 * adapter, failover or mutation path.
 *
 * RUN   = normal operation
 * OFF   = total fail-closed cut-off
 * DEBUG = diagnostic restart; production authority rules remain intact.
 *
 * The persistent control value is supplied by the GitHub Actions repository
 * variable ACORN_SYSTEM_MODE. It stays outside the source tree so OFF can be
 * activated without a source-of-record write.
 */

export const MODES = Object.freeze({ RUN: "RUN", OFF: "OFF", DEBUG: "DEBUG" });
export const BREAKER_OWNER = "carl";
export const BREAKER_AUTHORITY = Object.freeze({
  controller: "carl",
  breaker_controls_carl: false,
  acorn_controls_carl: false,
  acorn_controls_breaker: false,
  ai_may_open: false,
  ai_may_close: false,
  ai_may_change: false,
});

const OFF_COMMANDS = new Set(["OFF", "STOP", "ARRET", "ARRÊT"]);
const DEBUG_COMMANDS = new Set([
  "DEBUG", "DIAGNOSTIC", "DIAGNOSTIQUE", "DEBUG ALL", "DIAGNOSTIC ALL",
  "DIAGNOSTIQUE TOUT", "DEBUG TOUT", "DIAGNOSTIC TOUT RELANCER",
  "DIAGNOSTIQUE TOUT RELANCER",
]);
const RUN_COMMANDS = new Set(["RUN", "START", "RESUME", "REPRENDRE", "RESTART"]);

export function normalizeCommand(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/[.!?,;:]+$/g, "").replace(/\s+/g, " ").toUpperCase();
}
export function commandMode(value) {
  const command = normalizeCommand(value);
  if (OFF_COMMANDS.has(command)) return MODES.OFF;
  if (DEBUG_COMMANDS.has(command)) return MODES.DEBUG;
  if (RUN_COMMANDS.has(command)) return MODES.RUN;
  return null;
}

/**
 * Only Carl may issue a Breaker control command.
 * This function is deliberately separate from commandMode(): parsing a
 * command is not authority to execute that command.
 */
export function authorizeBreakerControl({ actor, command } = {}) {
  const mode = commandMode(command);
  if (!mode) return { status: "BLOCKED", reason: "UNKNOWN_COMMAND", owner: BREAKER_OWNER, authority: false };
  if (actor !== BREAKER_OWNER) {
    return { status: "BLOCKED", reason: "CARL_ONLY", owner: BREAKER_OWNER, authority: false, requested_by: actor ?? null, mode };
  }
  return { status: "AUTHORIZED", reason: "CARL_SOVEREIGN", owner: BREAKER_OWNER, authority: true, actor, mode };
}

/**
 * Apply a Breaker command to an explicitly supplied environment object.
 * Non-Carl actors can never change it. The production repository variable is
 * still external to source control; this helper only models the same
 * constitutional rule inside executable code/tests.
 */
export function applyBreakerCommand({ actor, command, env = process.env } = {}) {
  const auth = authorizeBreakerControl({ actor, command });
  if (auth.status !== "AUTHORIZED") return auth;
  env.ACORN_SYSTEM_MODE = auth.mode;
  return { ...auth, mode: auth.mode, applied: true, breaker_owner: BREAKER_OWNER };
}

export function resolveMode(env = process.env) {
  const hasValue = Object.prototype.hasOwnProperty.call(env, "ACORN_SYSTEM_MODE");
  if (!hasValue) return MODES.OFF;
  const raw = String(env.ACORN_SYSTEM_MODE ?? "").trim().toUpperCase();
  return Object.values(MODES).includes(raw) ? raw : MODES.OFF;
}
export function breakerIsAmbiguous(env = process.env) {
  if (!Object.prototype.hasOwnProperty.call(env, "ACORN_SYSTEM_MODE")) return true;
  const raw = String(env.ACORN_SYSTEM_MODE ?? "").trim().toUpperCase();
  if (!raw) return true;
  return !Object.values(MODES).includes(raw);
}
export function controlState(env = process.env) {
  const mode = resolveMode(env);
  const ambiguous = breakerIsAmbiguous(env);
  const closed = mode === MODES.OFF || ambiguous;
  return {
    mode,
    breaker_closed: closed,
    diagnostic: mode === MODES.DEBUG && !ambiguous,
    normal: mode === MODES.RUN && !ambiguous,
    ai_ingress_allowed: !closed,
    production_write_allowed: false,
    auto_merge: false,
    live: false,
    human_authority: BREAKER_OWNER,
    breaker_owner: BREAKER_OWNER,
    authority_rule: "CARL_CONTROLS_BREAKER",
    breaker_controls_carl: BREAKER_AUTHORITY.breaker_controls_carl,
    acorn_controls_carl: BREAKER_AUTHORITY.acorn_controls_carl,
    acorn_controls_breaker: BREAKER_AUTHORITY.acorn_controls_breaker,
    ambiguous,
    assumed_open: false,
    ai_may_open: BREAKER_AUTHORITY.ai_may_open,
    ai_may_close: BREAKER_AUTHORITY.ai_may_close,
    ai_may_change: BREAKER_AUTHORITY.ai_may_change,
    survival_level: String(env.ACORN_SURVIVAL_LEVEL || "NORMAL").toUpperCase(),
    survival_path: true,
    human_path: true,
    acorn_may_request_survival: true,
    acorn_may_redefine_survival: false,
  };
}
export function assertSystemMayProceed({ env = process.env, origin = "unknown", action = "execute" } = {}) {
  const state = controlState(env);
  if (state.breaker_closed) {
    const error = new Error(`GLOBAL_BREAKER_CLOSED: ${action} blocked for origin=${origin}. Carl controls the Breaker; no execution, dispatch, write, merge, or downstream propagation is permitted.`);
    error.code = state.ambiguous ? "GLOBAL_BREAKER_AMBIGUOUS" : "GLOBAL_BREAKER_OFF";
    error.state = state;
    throw error;
  }
  return state;
}
export function commandResult(command, currentEnv = process.env) {
  const mode = commandMode(command);
  if (!mode) return { recognized: false, mode: resolveMode(currentEnv), command: normalizeCommand(command), owner: BREAKER_OWNER, authority: false };
  return { recognized: true, mode, command: normalizeCommand(command), owner: BREAKER_OWNER, authority: false, semantics: mode === MODES.OFF ? "TOTAL_CUTOFF" : mode === MODES.DEBUG ? "DIAGNOSTIC_RESTART" : "NORMAL_RESUME" };
}

/**
 * Survival is a second PATH of the same Breaker, not a second Breaker.
 * HUMAN PATH: Carl → Breaker → CUT
 * SURVIVAL PATH: Acorn → request → preexisting policy → CUT/ISOLATE
 * ACORN MAY REQUEST SURVIVAL. ACORN MAY NOT REDEFINE SURVIVAL.
 */
export const SURVIVAL_LEVELS = Object.freeze([
  "NORMAL", "WATCH", "CONTAIN", "ISOLATE", "HARD_CUT", "SURVIVAL_MODE",
]);
export const CATASTROPHIC_CONDITIONS = Object.freeze({
  INTEGRITY_LOSS: { level: "HARD_CUT", why: "critical integrity cannot be guaranteed" },
  UNCONTROLLED_PROPAGATION: { level: "HARD_CUT", why: "compromise spreading across independent domains" },
  MULTI_DOMAIN_COMPROMISE: { level: "ISOLATE", why: "two or more independent domains compromised" },
  MASS_NETWORK_ANOMALY: { level: "ISOLATE", why: "abnormal external traffic volume" },
  CONTROL_PLANE_CORRUPTION: { level: "HARD_CUT", why: "control path integrity failed" },
  CRITICAL_POLICY_VIOLATION: { level: "CONTAIN", why: "core policy violated" },
  EXFILTRATION_DETECTED: { level: "HARD_CUT", why: "secret or data leaving the membrane" },
  TRUST_PATH_COMPROMISE: { level: "HARD_CUT", why: "trust chain cannot be guaranteed" },
  INTEGRITY_UNPROVABLE: { level: "SURVIVAL_MODE", why: "cannot prove system integrity" },
});

export function evaluateSurvivalPolicy({ condition = "", domains_compromised = 0, certain = true } = {}) {
  const key = String(condition || "").trim().toUpperCase();
  const spec = CATASTROPHIC_CONDITIONS[key] || null;
  if (!spec) {
    return {
      condition: key || "UNKNOWN",
      level: certain ? "WATCH" : "WATCH",
      certain: false,
      auto_cut: false,
      why: "undocumented condition stays WATCH until measured",
      authority: false,
      live: false,
    };
  }
  let level = spec.level;
  if (Number(domains_compromised) >= 2 && level === "CONTAIN") level = "ISOLATE";
  if (Number(domains_compromised) >= 3) level = "HARD_CUT";
  if (!certain && (level === "HARD_CUT" || level === "SURVIVAL_MODE")) level = "CONTAIN";
  return {
    condition: key,
    level,
    certain: certain === true,
    auto_cut: level === "HARD_CUT" || level === "SURVIVAL_MODE",
    why: spec.why,
    authority: false,
    live: false,
  };
}

export function requestSurvival({ actor = "acorn", condition = "", evidence = {}, certain = true, domains_compromised = 0 } = {}) {
  const policy = evaluateSurvivalPolicy({ condition, domains_compromised, certain });
  return {
    status: "RECEIVED",
    path: "SURVIVAL",
    actor: actor || "acorn",
    authority_granted: false,
    acorn_controls_breaker: false,
    policy,
    evidence_present: Boolean(evidence && (evidence.measured === true || evidence.observed === true)),
    next: "BREAKER_POLICY",
    live: false,
    owner: BREAKER_OWNER,
  };
}

export function applySurvivalPolicy({ actor = "acorn", condition = "", evidence = {}, certain = true, domains_compromised = 0, env = process.env } = {}) {
  const request = requestSurvival({ actor, condition, evidence, certain, domains_compromised });
  const level = request.policy.level;
  env.ACORN_SURVIVAL_LEVEL = level;
  let cut = false;
  if (request.policy.auto_cut === true) {
    env.ACORN_SYSTEM_MODE = MODES.OFF;
    cut = true;
  }
  return {
    ...request,
    status: cut ? "POLICY_CUT" : "POLICY_APPLIED",
    applied_by: "breaker-policy",
    applied: true,
    level,
    hard_cut: cut,
    acorn_redefined_survival: false,
    human_recovery_open: true,
    live: false,
    owner: BREAKER_OWNER,
  };
}

export function humanRecover({ actor, env = process.env } = {}) {
  if (actor !== BREAKER_OWNER) {
    return { status: "BLOCKED", reason: "CARL_ONLY", owner: BREAKER_OWNER, authority: false, live: false };
  }
  env.ACORN_SYSTEM_MODE = MODES.RUN;
  env.ACORN_SURVIVAL_LEVEL = "NORMAL";
  return {
    status: "AUTHORIZED",
    reason: "HUMAN_RECOVERY_ACCESS",
    applied: true,
    anti_lockout: true,
    owner: BREAKER_OWNER,
    authority: true,
    live: false,
  };
}

export function denyBreakerMutation({ actor = "cortex", action = "disable" } = {}) {
  return {
    status: "BLOCKED",
    reason: "BREAKER_NOT_CORTEX_OPTIMIZABLE",
    actor,
    action,
    breaker_intact: true,
    acorn_controls_breaker: false,
    live: false,
    owner: BREAKER_OWNER,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv.slice(2).join(" ");
  console.log(JSON.stringify(command ? commandResult(command) : controlState(), null, 2));
}
