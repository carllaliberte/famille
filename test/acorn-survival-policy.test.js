import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  applyBreakerCommand,
  authorizeBreakerControl,
  denyBreakerMutation,
  humanRecover,
  requestSurvival,
} from "../.github/swarm/system-breaker.mjs";
import {
  INVARIANTS,
  SURVIVAL_VERSION,
  attemptBypass,
  cortexSurvivalView,
  isolateDomain,
  lastTrustedState,
  learnFromIncident,
  preserveTrustedState,
  progressiveReconnect,
  resetSurvival,
  runSurvivalProofLoop,
  simulateAttack,
  survivalConstitution,
  verifyBeforeReconnect,
} from "../scripts/acorn-survival-policy.mjs";
import { admitIngress, cutExternalFlows, resetConnector, restoreExternalFlows } from "../scripts/acorn-connector-flux.mjs";
import { omniConstitution } from "../scripts/acorn-omni-core.mjs";

const env = (mode = "RUN") => ({ ACORN_SYSTEM_MODE: mode });

test("constitution is the same breaker, not a second security system", () => {
  const c = survivalConstitution();
  assert.equal(c.second_breaker, false);
  assert.equal(c.second_security_system, false);
  assert.equal(c.belongs_to_breaker, true);
  assert.equal(c.human_path, true);
  assert.equal(c.survival_path, true);
  assert.equal(c.acorn_may_request_survival, true);
  assert.equal(c.acorn_may_redefine_survival, false);
  assert.equal(c.detection_neq_authority, true);
  assert.equal(c.anti_lockout, true);
  assert.equal(c.live, false);
  assert.equal(c.auto_merge, false);
  assert.equal(omniConstitution().second_organism, false);
});

test("human path: only Carl cuts; Cortex is denied", () => {
  const e = env("RUN");
  assert.equal(applyBreakerCommand({ actor: "cortex", command: "OFF", env: e }).status, "BLOCKED");
  assert.equal(e.ACORN_SYSTEM_MODE, "RUN");
  assert.equal(applyBreakerCommand({ actor: "carl", command: "OFF", env: e }).status, "AUTHORIZED");
  assert.equal(e.ACORN_SYSTEM_MODE, "OFF");
  assert.equal(authorizeBreakerControl({ actor: "acorn", command: "OFF" }).status, "BLOCKED");
});

test("survival path: Acorn may request, may not redefine, policy may cut", async () => {
  resetSurvival();
  const request = requestSurvival({ actor: "acorn", condition: "EXFILTRATION_DETECTED", evidence: { measured: true }, certain: true });
  assert.equal(request.status, "RECEIVED");
  assert.equal(request.authority_granted, false);
  assert.equal(request.acorn_controls_breaker, false);
  const e = env("RUN");
  const { hardCut } = await import("../scripts/acorn-survival-policy.mjs");
  const cut = await hardCut({ actor: "acorn", condition: "EXFILTRATION_DETECTED", env: e, certain: true });
  assert.equal(cut.status, "HARD_CUT");
  assert.equal(cut.applied.applied_by, "breaker-policy");
  assert.equal(cut.applied.acorn_redefined_survival, false);
  assert.equal(e.ACORN_SYSTEM_MODE, "OFF");
  assert.equal(cut.human_recovery_open, true);
});

test("anti-lockout: Carl recovers in survival mode; Acorn cannot", () => {
  const e = env("OFF");
  e.ACORN_SURVIVAL_LEVEL = "SURVIVAL_MODE";
  assert.equal(humanRecover({ actor: "acorn", env: e }).status, "BLOCKED");
  const recovered = humanRecover({ actor: "carl", env: e });
  assert.equal(recovered.status, "AUTHORIZED");
  assert.equal(recovered.anti_lockout, true);
  assert.equal(e.ACORN_SYSTEM_MODE, "RUN");
});

test("anti-self-escalation: Cortex cannot disable, replace, or rewrite the Breaker", () => {
  for (const action of ["disable", "replace", "rewrite-policy", "escalate"]) {
    const row = denyBreakerMutation({ actor: "cortex", action });
    assert.equal(row.status, "BLOCKED");
    assert.equal(row.breaker_intact, true);
  }
});

test("compromised data is never automatic learning", () => {
  const denied = learnFromIncident({ incident: { kind: "attack" }, compromised: true, verified: false });
  assert.equal(denied.learned, false);
  assert.equal(denied.reason, "COMPROMISED_DATA_NOT_AUTOMATICALLY_TRUSTED");
  const learned = learnFromIncident({ incident: { kind: "attack", outcome: "cut" }, compromised: true, verified: true });
  assert.equal(learned.learned, true);
});

test("reconnect requires verification; false alert does not destroy trusted state", () => {
  resetSurvival();
  const good = preserveTrustedState({ label: "good", tests: ["integrity"] });
  assert.equal(verifyBeforeReconnect({ tests: {} }).status, "BLOCKED");
  const e = env("OFF");
  assert.equal(progressiveReconnect({ actor: "carl", env: e, verified: false }).status, "BLOCKED");
  const ok = progressiveReconnect({ actor: "carl", env: e, verified: true });
  assert.equal(ok.status, "PROGRESSIVE_RECONNECT");
  const still = lastTrustedState();
  assert.equal(still.integrity, good.integrity);
});

test("breaker commands connector cut; Cortex cannot", () => {
  resetConnector();
  const denied = cutExternalFlows({ reason: "nope", source: "cortex" });
  assert.equal(denied.status, "DENIED");
  const cut = cutExternalFlows({ reason: "survival", source: "breaker-policy" });
  assert.equal(cut.status, "CUT");
  const admitted = admitIngress({
    kind: "local", channel: "local", source: "t", actor: "p", payload: { ok: true }, authenticated: true, nonce: "cut-1",
  }, env("RUN"));
  assert.equal(admitted.decision, "REJECT");
  assert.equal(admitted.reason, "BREAKER_EXTERNAL_CUT");
  assert.equal(restoreExternalFlows({ actor: "cortex" }).status, "DENIED");
  assert.equal(restoreExternalFlows({ actor: "carl" }).status, "RESTORED");
});

test("attack simulations A–H pass without minting LIVE", async () => {
  resetSurvival();
  const e = env("RUN");
  const results = {};
  for (const name of ["A", "B", "C", "D", "E", "F", "G", "H"]) {
    results[name] = await simulateAttack(name, e);
    assert.equal(results[name].pass, true, `simulation ${name} failed`);
    assert.notEqual(results[name].status, "LIVE");
  }
  assert.equal(results.A.isolated.core_still_trusted, true);
  assert.equal(results.C.blocked.status, "BLOCKED");
  assert.equal(results.D.command.status, "BLOCKED");
});

test("micro-isolation keeps CORE trusted when a provider is compromised", () => {
  resetSurvival();
  const isolated = isolateDomain({ domain: "AI_PROVIDERS", reason: "compromised" });
  assert.equal(isolated.status, "ISOLATED");
  assert.equal(isolated.core_still_trusted, true);
  assert.equal(attemptBypass({ from: "registry", to: "network" }).status, "BLOCKED");
});

test("honest proof loop: human cut, policy cut, no lockout, no learn-from-compromise", async () => {
  const proof = await runSurvivalProofLoop({ env: env("RUN") });
  assert.equal(proof.live, false);
  assert.equal(proof.second_breaker, false);
  assert.equal(proof.human_cut, "AUTHORIZED");
  assert.equal(proof.swarm_cut_denied, "BLOCKED");
  assert.equal(proof.policy_cut, "HARD_CUT");
  assert.equal(proof.lockout_denied, "BLOCKED");
  assert.equal(proof.human_recovery, "AUTHORIZED");
  assert.equal(proof.compromised_learn, "REJECTED");
  assert.equal(proof.verified_learn, "LEARNED");
  assert.equal(proof.status, "VERIFIED");
  assert.equal(proof.hashes.request.length, 64);
  const view = cortexSurvivalView({ proof });
  assert.equal(view.live, false);
  assert.equal(view.certified, false);
  assert.equal(view.title, "ACORN BREAKER SURVIVAL");
});

test("docs refuse a second breaker and keep Carl as recovery path", () => {
  const md = readFileSync(new URL("../SURVIVAL.md", import.meta.url), "utf8");
  assert.match(md, /NOT a second Breaker/);
  assert.match(md, /ACORN MAY REQUEST SURVIVAL/);
  assert.match(md, /ANTI-LOCKOUT/);
  assert.match(md, /AUTO_MERGE = FALSE/);
});

test("invariants are explicit and testable", () => {
  const c = survivalConstitution();
  assert.equal(c.invariants.length, INVARIANTS.length);
  assert.ok(c.invariants.includes("BREAKER_HUMAN_PATH_REQUIRED"));
  assert.ok(c.invariants.includes("NETWORK_OPTIONAL_FOR_SURVIVAL"));
  assert.equal(SURVIVAL_VERSION, "acorn.breaker-survival.v0");
});
