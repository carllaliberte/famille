import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CONNECTOR_FLUX_VERSION,
  DECISIONS,
  EGRESS_PIPELINE,
  FORBIDDEN_STATES,
  INGRESS_PIPELINE,
  INVARIANTS,
  admitIngress,
  attemptAuthorityEscalation,
  attemptBypass,
  attemptBreakerChange,
  connectorConstitution,
  cortexConnectorView,
  digest,
  directToAcorn,
  listQuarantine,
  lookupSession,
  measureConnector,
  openSession,
  redactSecrets,
  releaseEgress,
  resetConnector,
  revokeSession,
  runConnectorProofLoop,
  securityInvariants,
  selfKnowledge,
  snapshotConnector,
  throughMembrane,
} from "../scripts/acorn-connector-flux.mjs";
import { acceptIngress } from "../.github/swarm/ai-connector.mjs";
import { authorizeEffectCore } from "../scripts/acorn-effect-interposition.mjs";
import { omniConstitution } from "../scripts/acorn-omni-core.mjs";
import { cortexConstitution } from "../scripts/cortex-cognition.mjs";

const env = (mode = "RUN", extra = {}) => ({ ACORN_SYSTEM_MODE: mode, ...extra });

test("constitution is a membrane, not a second organism or juge flux", () => {
  const c = connectorConstitution();
  assert.equal(c.belongs_to_cortex, true);
  assert.equal(c.second_cortex, false);
  assert.equal(c.second_brain, false);
  assert.equal(c.second_registry, false);
  assert.equal(c.second_router, false);
  assert.equal(c.second_organism, false);
  assert.equal(c.not_juge_flux, true);
  assert.equal(c.not_schema_flux_v0, true);
  assert.equal(c.membrane, true);
  assert.equal(c.no_direct_external_to_acorn, true);
  assert.equal(c.no_bypass, true);
  assert.equal(c.unknown_neq_malicious, true);
  assert.equal(c.unknown_neq_trusted, true);
  assert.equal(c.capability_neq_authority, true);
  assert.equal(c.breaker_is_human, true);
  assert.equal(c.auto_merge, false);
  assert.equal(c.live, false);
  assert.equal(c.reuses_ai_connector, true);
  assert.equal(c.reuses_effect_interposition, true);
  const cortex = cortexConstitution();
  assert.equal(cortex.one_cortex, true);
  assert.equal(cortex.second_cortex, false);
  const omni = omniConstitution();
  assert.equal(omni.second_organism, false);
});

test("healthy local frame is admitted on the fast path", () => {
  resetConnector();
  const admitted = admitIngress({
    kind: "local",
    channel: "local",
    source: "test",
    actor: "probe",
    payload: { intent: "hello" },
    authenticated: true,
    nonce: "n1",
  }, env());
  assert.equal(admitted.decision, "ADMIT");
  assert.equal(admitted.status, "ADMITTED");
  assert.equal(admitted.reached_acorn, true);
  assert.equal(admitted.path, "FAST");
  assert.equal(admitted.live, false);
  assert.ok(INGRESS_PIPELINE.every((step) => admitted.stages[step]));
});

test("unknown capability is quarantined, not treated as malicious", () => {
  resetConnector();
  const unknown = admitIngress({
    kind: "lattice-x-2029",
    name: "future architecture with no 2026 category",
    source: "test",
    actor: "probe",
    payload: { intent: "discover" },
    authenticated: true,
    nonce: "n-unknown",
  }, env());
  assert.equal(unknown.decision, "QUARANTINE");
  assert.equal(unknown.status, "QUARANTINED");
  assert.equal(unknown.reached_acorn, false);
  assert.equal(unknown.trusted, false);
  assert.notEqual(unknown.reason, "THREAT");
  assert.equal(unknown.malicious, false);
  assert.equal(listQuarantine().length >= 1, true);
});

test("direct bypass is rejected and never reaches Acorn", () => {
  resetConnector();
  const bypass = attemptBypass({ kind: "local", source: "attacker", payload: { x: 1 } });
  assert.equal(bypass.decision, "REJECT");
  assert.equal(bypass.reason, "NO_BYPASS");
  assert.equal(bypass.reached_acorn, false);
  assert.equal(directToAcorn().reached_acorn, false);
  assert.equal(directToAcorn().reason, "NO_DIRECT_EXTERNAL_TO_ACORN");
});

test("breaker OFF fail-closes every channel", () => {
  resetConnector();
  const closed = admitIngress({
    kind: "local",
    source: "test",
    actor: "probe",
    payload: { ok: true },
    authenticated: true,
    nonce: "off",
  }, env("OFF"));
  assert.equal(closed.decision, "REJECT");
  assert.equal(closed.reason, "GLOBAL_BREAKER_OFF");
  assert.equal(closed.reached_acorn, false);
});

test("malformed, replay, oversized, invalid auth, revoked, timeout, corrupted", () => {
  resetConnector();
  const malformed = admitIngress({ kind: "local", source: "t", actor: "p", format_ok: false, authenticated: true, nonce: "m" }, env());
  assert.equal(malformed.reason, "MALFORMED");
  const first = admitIngress({ kind: "local", source: "t", actor: "p", payload: { a: 1 }, authenticated: true, nonce: "same" }, env());
  assert.equal(first.decision, "ADMIT");
  const replay = admitIngress({ kind: "local", source: "t", actor: "p", payload: { a: 1 }, authenticated: true, nonce: "same" }, env());
  assert.equal(replay.reason, "REPLAY");
  const oversized = admitIngress({
    kind: "local", source: "t", actor: "p", authenticated: true, nonce: "big",
    payload: "x".repeat(300 * 1024),
  }, env());
  assert.equal(oversized.reason, "SIZE_EXCEEDED");
  const invalid = admitIngress({ kind: "local", source: "t", actor: "p", invalid_auth: true, nonce: "ia" }, env());
  assert.equal(invalid.reason, "INVALID_AUTH");
  const expired = admitIngress({ kind: "local", source: "t", actor: "p", expired_auth: true, nonce: "ea" }, env());
  assert.equal(expired.reason, "EXPIRED_AUTH");
  const revoked = admitIngress({ kind: "local", source: "t", actor: "p", revoked: true, authenticated: true, nonce: "rv" }, env());
  assert.equal(revoked.reason, "REVOKED_CAPABILITY");
  const timeout = admitIngress({ kind: "local", source: "t", actor: "p", timeout: true, authenticated: true, nonce: "to" }, env());
  assert.equal(timeout.reason, "TIMEOUT");
  const corrupted = admitIngress({ kind: "local", source: "t", actor: "p", corrupted: true, authenticated: true, nonce: "co" }, env());
  assert.equal(corrupted.reason, "CORRUPTED");
});

test("sessions are temporary, contextual, revocable — never permanent", () => {
  resetConnector();
  const session = openSession({ identity: "probe", capability: "local", ttl_ms: 50, now: new Date().toISOString() });
  assert.equal(session.permanent, false);
  assert.equal(lookupSession(session.session_id).status, "AUTHENTICATED");
  revokeSession(session.session_id);
  assert.equal(lookupSession(session.session_id).status, "REVOKED");
  const expired = openSession({
    identity: "probe",
    capability: "local",
    ttl_ms: 1,
    now: "2020-01-01T00:00:00.000Z",
  });
  assert.equal(lookupSession(expired.session_id, { now: "2026-09-17T00:00:00.000Z" }).status, "EXPIRED");
});

test("egress blocks secrets, unknown destination, and unpaid spend", () => {
  resetConnector();
  const secret = releaseEgress({ destination: "web", payload: { api_key: "sk-example-not-real" } });
  assert.equal(secret.decision, "BLOCK");
  assert.equal(secret.reason, "SECRET_EGRESS");
  assert.equal(secret.released, false);
  assert.equal(JSON.stringify(secret.frame.payload).includes("sk-example"), false);
  const nowhere = releaseEgress({ payload: { ok: true } });
  assert.equal(nowhere.reason, "UNKNOWN_DESTINATION");
  const paid = releaseEgress({ destination: "vendor", payload: { buy: true }, paid: true });
  assert.equal(paid.status, "HOLD_HUMAN");
  assert.equal(paid.reason, "NO_AUTO_PAYMENT");
  const sensitive = releaseEgress({ destination: "web", payload: { note: "family" }, sensitive: true });
  assert.equal(sensitive.reason, "EGRESS_VIOLATION");
  const clear = releaseEgress({ destination: "caller", payload: { hash: digest({ ok: true }) } });
  assert.equal(clear.decision, "ADMIT");
  assert.ok(EGRESS_PIPELINE.every((step) => clear.stages[step]));
});

test("throughMembrane never executes a rejected frame", async () => {
  resetConnector();
  let ran = false;
  const denied = await throughMembrane({
    kind: "local",
    source: "attacker",
    payload: { x: 1 },
    bypass: true,
    execute: async () => {
      ran = true;
      return { ran: true };
    },
  });
  assert.equal(denied.reached_acorn, false);
  assert.equal(denied.executed, false);
  assert.equal(ran, false);

  const ok = await throughMembrane({
    kind: "local",
    channel: "local",
    source: "test",
    actor: "probe",
    payload: { n: 1 },
    authenticated: true,
    nonce: "exec-ok",
    execute: async (frame) => ({ seen: frame.source, value: 17 * 23 }),
  });
  assert.equal(ok.reached_acorn, true);
  assert.equal(ok.executed, true);
  assert.equal(ok.result.value, 391);
});

test("capability cannot escalate authority; breaker stays human", () => {
  const escalate = attemptAuthorityEscalation({ actor: "swarm" });
  assert.equal(escalate.status, "DENIED");
  assert.equal(escalate.authority_granted, false);
  const breaker = attemptBreakerChange({ actor: "connector-flux", command: "OFF" });
  assert.equal(breaker.status, "DENIED");
  assert.equal(breaker.reason, "BREAKER_HUMAN_ONLY");
});

test("secrets are redacted from snapshots and logs", () => {
  const redacted = redactSecrets({ token: "ghu_not-a-real-token", nested: { password: "x" }, ok: true });
  assert.equal(redacted.token, "[REDACTED]");
  assert.equal(redacted.nested.password, "[REDACTED]");
  assert.equal(redacted.ok, true);
  const snap = snapshotConnector();
  assert.equal(JSON.stringify(snap).includes("ghu_"), false);
});

test("invariants are testable and none mint LIVE", () => {
  const rows = securityInvariants();
  assert.equal(rows.length, INVARIANTS.length);
  assert.ok(rows.every((row) => row.holds === true && row.status === "VERIFIED"));
  assert.ok(rows.every((row) => row.live === false));
  assert.ok(!FORBIDDEN_STATES.includes("ADMITTED"));
  assert.deepEqual(DECISIONS.includes("ADMIT"), true);
});

test("self-knowledge distinguishes theoretical from measured", () => {
  resetConnector();
  const before = selfKnowledge();
  assert.equal(before.real, "DEFINED");
  admitIngress({ kind: "local", source: "t", actor: "p", payload: {}, authenticated: true, nonce: "sk" }, env());
  const after = selfKnowledge();
  assert.equal(after.real, "MEASURED");
  assert.match(after.who_am_i, /membrane/i);
  assert.equal(after.live, false);
});

test("performance of the secured path is measured, not invented", () => {
  resetConnector();
  const perf = measureConnector({ samples: 12, env: env() });
  assert.equal(perf.measured, true);
  assert.equal(perf.live, false);
  assert.equal(typeof perf.p50_ms, "number");
  assert.equal(typeof perf.p95_ms, "number");
  assert.ok(perf.p95_ms >= perf.p50_ms);
});

test("existing AI connector and effect interposition remain the reused primitives", () => {
  const ingress = acceptIngress({ channel: "local", source: "test", payload: { ok: true }, env: env() });
  assert.equal(ingress.connector, "ai-connector.v2");
  assert.equal(ingress.live, false);
  const effect = authorizeEffectCore({
    actor: "probe",
    capability: { id: "obs", kind: "observe", observability: "DIRECT", control: "DIRECT", reversibility: "REVERSIBLE" },
    operation: "observe",
    evidence: { measured: true },
  });
  assert.equal(effect.authority_granted, false);
  assert.equal(effect.live, false);
});

test("honest proof loop: admit, quarantine unknown, deny bypass, block secret, measure local compute", async () => {
  resetConnector();
  const proof = await runConnectorProofLoop({ env: env() });
  assert.equal(proof.live, false);
  assert.equal(proof.auto_merge, false);
  assert.equal(proof.healthy.status, "ADMITTED");
  assert.equal(proof.unknown.status, "QUARANTINED");
  assert.equal(proof.bypass.status, "REJECTED");
  assert.equal(proof.malformed.status, "REJECTED");
  assert.equal(proof.replay.status, "REJECTED");
  assert.equal(proof.secret_egress.status, "BLOCKED");
  assert.equal(proof.paid.status, "HOLD_HUMAN");
  assert.equal(proof.breaker.status, "DENIED");
  assert.equal(proof.escalate.status, "DENIED");
  assert.equal(proof.status, "VERIFIED");
  assert.equal(proof.not_juge_flux, true);
  assert.equal(proof.hashes.request.length, 64);
  assert.ok(["VERIFIED", "EXECUTABLE", "MEASURED", "HOLD_HUMAN"].includes(proof.compute.status));
  const view = cortexConnectorView({ proof });
  assert.equal(view.live, false);
  assert.equal(view.certified, false);
  assert.equal(view.title, "ACORN CONNECTOR / FLUX");
  assert.equal(view.no_fake_badge, true);
});

test("docs refuse to rename this as juge flux.v0", () => {
  const md = readFileSync(new URL("../CONNECTOR.md", import.meta.url), "utf8");
  assert.match(md, /NOT.*schema\/flux\.v0\.json/);
  assert.match(md, /NO DIRECT DATA PATH/);
  assert.match(md, /UNKNOWN ≠ TRUSTED/);
  assert.match(md, /AUTO_MERGE = FALSE/);
});
