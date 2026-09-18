import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExternalCall,
  executeExternalCall,
  grantServerAuthority,
  loadRealWorldConnectors,
  publicExternalResult,
  realWorldBridgeSnapshot,
  resolveSafeExternalUrl
} from "../scripts/acorn-real-world-bridge.mjs";

test("real-world bridge blocks consequential effects without human authorization", () => {
  const c = { id: "stripe", provider: "stripe", base_url: "https://example.test/", effect: "MONEY", credential_env: "ACORN_TEST_SECRET" };
  const call = buildExternalCall({ connector: c, path: "charges", method: "POST", body: { amount: 1 } });
  assert.equal(call.state, "BLOCKED");
  assert.equal(call.reason, "HUMAN_AUTHORIZATION_REQUIRED");
  assert.equal("credential" in call, false);
});

test("real-world bridge requires configured credentials but never exposes them", () => {
  process.env.ACORN_TEST_SECRET = "secret";
  const c = { id: "write-api", provider: "test", base_url: "https://example.test/", effect: "WRITE", credential_env: "ACORN_TEST_SECRET" };
  const spoof = buildExternalCall({ connector: c, path: "write", method: "POST", body: { ok: true }, human_authorized: true });
  assert.equal(spoof.state, "BLOCKED");
  assert.equal(spoof.reason, "HUMAN_AUTHORIZATION_REQUIRED");
  const call = buildExternalCall({
    connector: c,
    path: "write",
    method: "POST",
    body: { ok: true },
    authority: grantServerAuthority({ actor: "carl" })
  });
  assert.equal(call.state, "AUTHORIZED");
  assert.equal(call.credential_present, true);
  assert.equal(call.credential_env, "ACORN_TEST_SECRET");
  assert.equal("credential" in call, false);
  assert.equal("secret" in publicExternalResult(call), false);
  assert.equal("credential_env" in publicExternalResult(call), false);
  delete process.env.ACORN_TEST_SECRET;
});

test("read connector can be measured and externally observed", async () => {
  const c = { id: "read-api", provider: "test", base_url: "https://example.test/", effect: "READ" };
  const call = buildExternalCall({ connector: c, path: "health" });
  const result = await executeExternalCall(call, { fetchImpl: async () => new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }) });
  assert.equal(result.state, "SUCCEEDED");
  assert.equal(result.external_effect, false);
  assert.ok(result.output_hash);
  assert.equal(result.evidence.origin, "external_http");
  assert.equal(result.evidence.verified, false);
  assert.equal(result.evidence.live, false);
  assert.equal(result.evidence.margin > 0, true);
  assert.equal(result.output, undefined);
});

test("environment connector discovery is provider-neutral", () => {
  const xs = loadRealWorldConnectors(JSON.stringify([{ id: "a", provider: "future-provider", base_url: "https://example.test", effect: "READ", capabilities: ["read"] }]));
  assert.equal(xs[0].provider, "future-provider");
  assert.equal(realWorldBridgeSnapshot(xs).policy.secret_custody, false);
  assert.equal(realWorldBridgeSnapshot(xs).policy.client_authorization_ignored, true);
});

test("client human_authorized and forged server objects never authorize WRITE/MONEY/UNKNOWN", () => {
  const c = { id: "pay", provider: "x", base_url: "https://example.test/", effect: "MONEY", credential_env: "ACORN_TEST_SECRET" };
  process.env.ACORN_TEST_SECRET = "secret";
  for (const payload of [
    { human_authorized: true },
    { authorized: true, authority: { source: "server", actor: "carl" } },
    { source: "http", human_authorized: true }
  ]) {
    const call = buildExternalCall({ connector: c, path: "charges", method: "POST", body: { amount: 1 }, ...payload });
    assert.equal(call.state, "BLOCKED");
  }
  const unknown = buildExternalCall({
    connector: { ...c, effect: "UNKNOWN", id: "unk" },
    path: "x",
    method: "POST",
    authority: grantServerAuthority({ actor: "carl" })
  });
  assert.equal(unknown.state, "BLOCKED");
  assert.equal(unknown.reason, "UNKNOWN_EFFECT_LOCKED");
  delete process.env.ACORN_TEST_SECRET;
});

test("SSRF paths, metadata hosts and prefix escape stay out of scope", () => {
  const c = { id: "read-api", provider: "test", base_url: "https://example.test/api/", effect: "READ" };
  assert.equal(buildExternalCall({ connector: c, path: "https://evil.example/steal" }).reason, "URL_OUT_OF_SCOPE");
  assert.equal(buildExternalCall({ connector: c, path: "//169.254.169.254/meta" }).reason, "URL_OUT_OF_SCOPE");
  assert.equal(buildExternalCall({ connector: c, path: "../admin" }).reason, "URL_OUT_OF_SCOPE");
  assert.equal(buildExternalCall({ connector: { ...c, base_url: "http://127.0.0.1/" } }).reason, "URL_OUT_OF_SCOPE");
  assert.throws(() => resolveSafeExternalUrl("https://169.254.169.254/", "latest"), /URL_OUT_OF_SCOPE/);
  const ok = buildExternalCall({ connector: c, path: "health" });
  assert.equal(ok.state, "AUTHORIZED");
  assert.equal(ok.url, "https://example.test/api/health");
});

test("READ connectors cannot POST and missing credentials stay blocked", () => {
  const read = { id: "read-api", provider: "test", base_url: "https://example.test/", effect: "READ" };
  assert.equal(buildExternalCall({ connector: read, path: "x", method: "POST" }).reason, "METHOD_NOT_ALLOWED");
  const write = { id: "w", provider: "test", base_url: "https://example.test/", effect: "WRITE", credential_env: "MISSING_SECRET" };
  const call = buildExternalCall({ connector: write, path: "x", method: "POST", authority: grantServerAuthority({ actor: "carl" }) });
  assert.equal(call.state, "BLOCKED");
  assert.equal(call.reason, "CREDENTIAL_NOT_CONFIGURED");
});

test("redirects, timeouts, oversized bodies and secrets stay out of evidence", async () => {
  const c = { id: "read-api", provider: "test", base_url: "https://example.test/", effect: "READ" };
  const call = buildExternalCall({ connector: c, path: "health" });
  const redirected = await executeExternalCall(call, { fetchImpl: async () => new Response(null, { status: 302, headers: { location: "http://127.0.0.1/secret" } }) });
  assert.equal(redirected.state, "BLOCKED");
  assert.equal(redirected.reason, "REDIRECT_FORBIDDEN");
  const timed = await executeExternalCall(call, { fetchImpl: async () => { const err = new Error("Timeout"); err.name = "TimeoutError"; throw err; } });
  assert.equal(timed.reason, "TIMEOUT");
  const huge = await executeExternalCall(call, { fetchImpl: async () => new Response("x".repeat(1_048_577), { status: 200 }) });
  assert.equal(huge.reason, "RESPONSE_TOO_LARGE");
  const ok = await executeExternalCall(call, { fetchImpl: async () => new Response(JSON.stringify({ token: "should-not-return" }), { status: 200 }) });
  assert.equal(ok.output, undefined);
  assert.equal(JSON.stringify(ok).includes("should-not-return"), false);
  assert.equal(ok.evidence.verified, false);
});

test("identical idempotency keys do not re-execute the external effect", async () => {
  const c = { id: "read-api", provider: "test", base_url: "https://example.test/", effect: "READ" };
  const store = new Map();
  let hits = 0;
  const fetchImpl = async () => {
    hits += 1;
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  const first = await executeExternalCall(buildExternalCall({ connector: c, path: "health", idempotency_key: "k1" }), { fetchImpl, idempotency: store });
  const second = await executeExternalCall(buildExternalCall({ connector: c, path: "health", idempotency_key: "k1" }), { fetchImpl, idempotency: store });
  assert.equal(first.state, "SUCCEEDED");
  assert.equal(second.idempotent_replay, true);
  assert.equal(hits, 1);
});
