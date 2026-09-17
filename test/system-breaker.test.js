import test from "node:test";
import assert from "node:assert/strict";
import { commandMode, controlState, normalizeCommand } from "../.github/swarm/system-breaker.mjs";

const env = (mode) => ({ ACORN_SYSTEM_MODE: mode });

test("OFF/STOP/ARRÊT are case-insensitive global cutoff commands", () => {
  for (const value of ["OFF", "off", "STOP", "stop", "ARRÊT", "arrêt", "ARRET", "arret", " off "]) {
    assert.equal(commandMode(value), "OFF");
  }
});

test("DEBUG and diagnostic synonyms select diagnostic restart", () => {
  for (const value of ["DEBUG", "debug", "DIAGNOSTIC", "diagnostique", "DEBUG TOUT", "DIAGNOSTIC TOUT RELANCER"]) {
    assert.equal(commandMode(value), "DEBUG");
  }
});

test("RUN resumes normal operation without enabling production authority", () => {
  assert.equal(commandMode("run"), "RUN");
  const state = controlState(env("RUN"));
  assert.equal(state.normal, true);
  assert.equal(state.production_write_allowed, false);
  assert.equal(state.auto_merge, false);
});

test("OFF is fail-closed and invalid persisted state also becomes OFF", () => {
  assert.equal(controlState(env("OFF")).breaker_closed, true);
  assert.equal(controlState(env("garbage")).mode, "OFF");
  assert.equal(controlState({}).mode, "OFF");
  assert.equal(controlState({}).assumed_open, false);
});

test("DEBUG is restart/diagnostic, not a bypass of human sovereignty", () => {
  const state = controlState(env("DEBUG"));
  assert.equal(state.diagnostic, true);
  assert.equal(state.production_write_allowed, false);
  assert.equal(state.auto_merge, false);
  assert.equal(state.live, false);
});

test("normalization removes accents, case and command punctuation", () => {
  assert.equal(normalizeCommand("  arrêt!!! "), "ARRET");
});
