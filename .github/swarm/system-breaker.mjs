#!/usr/bin/env node
/**
 * ACORN GLOBAL SYSTEM BREAKER
 *
 * Global execution gate between the AI/Cognitive Connector and the protected
 * Acorn execution/source-of-record domain.
 *
 * RUN   = normal operation
 * OFF   = total fail-closed cut-off
 * DEBUG = diagnostic restart; execution may be relaunched, but production
 *         authority rules remain intact (no merge, no fake LIVE, no bypass).
 *
 * The persistent control value is supplied by the GitHub Actions repository
 * variable ACORN_SYSTEM_MODE. It stays outside the source tree so OFF can be
 * activated without a source-of-record write.
 */

export const MODES = Object.freeze({ RUN: "RUN", OFF: "OFF", DEBUG: "DEBUG" });
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
export function resolveMode(env = process.env) {
  const raw = String(env.ACORN_SYSTEM_MODE ?? "RUN").trim().toUpperCase();
  return Object.values(MODES).includes(raw) ? raw : MODES.OFF;
}
export function controlState(env = process.env) {
  const mode = resolveMode(env);
  return { mode, breaker_closed: mode === MODES.OFF, diagnostic: mode === MODES.DEBUG, normal: mode === MODES.RUN, ai_ingress_allowed: mode !== MODES.OFF, production_write_allowed: false, auto_merge: false, live: false, human_authority: "carl" };
}
export function assertSystemMayProceed({ env = process.env, origin = "unknown", action = "execute" } = {}) {
  const state = controlState(env);
  if (state.mode === MODES.OFF) {
    const error = new Error(`GLOBAL_BREAKER_OFF: ${action} blocked for origin=${origin}. No execution, dispatch, write, merge, or downstream propagation is permitted.`);
    error.code = "GLOBAL_BREAKER_OFF";
    error.state = state;
    throw error;
  }
  return state;
}
export function commandResult(command, currentEnv = process.env) {
  const mode = commandMode(command);
  if (!mode) return { recognized: false, mode: resolveMode(currentEnv), command: normalizeCommand(command) };
  return { recognized: true, mode, command: normalizeCommand(command), semantics: mode === MODES.OFF ? "TOTAL_CUTOFF" : mode === MODES.DEBUG ? "DIAGNOSTIC_RESTART" : "NORMAL_RESUME" };
}
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv.slice(2).join(" ");
  console.log(JSON.stringify(command ? commandResult(command) : controlState(), null, 2));
}
