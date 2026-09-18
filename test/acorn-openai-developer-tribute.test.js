import test from "node:test";
import assert from "node:assert/strict";
import {
  OPENAI_TRIBUTE_VERSION,
  keyFingerprint,
  createDeveloperTribute,
  buildOpenAIRequest,
  discoverOpenAICapability,
  createThankYouArtifact,
  runOpenAIDeveloperTribute,
} from "../scripts/acorn-openai-developer-tribute.mjs";

test("tribute contract is provider-specific but non-affiliating", () => {
  const t = createDeveloperTribute({ keyPresent: true, model: "gpt" });
  assert.equal(t.version, OPENAI_TRIBUTE_VERSION);
  assert.equal(t.provider, "openai");
  assert.equal(t.claims.official_openai_affiliation, false);
  assert.equal(t.credential.stored, false);
  assert.equal(t.credential.logged, false);
  assert.equal(t.acorn.capability_is_not_authority, true);
});

test("key fingerprint is non-reversible and never the secret", () => {
  const secret = "sk-test-DEVELOPER-SECRET";
  const fp = keyFingerprint(secret);
  assert.equal(fp.length, 16);
  assert.notEqual(fp, secret);
  assert.equal(keyFingerprint(""), null);
});

test("request construction keeps the secret in the Authorization header only", () => {
  const req = buildOpenAIRequest({ apiKey: "sk-test-secret", path: "/v1/models" });
  assert.equal(req.url, "https://api.openai.com/v1/models");
  assert.equal(req.headers.Authorization, "Bearer sk-test-secret");
  assert.equal(req.body, undefined);
});

test("request paths outside /v1 are rejected", () => {
  assert.throws(() => buildOpenAIRequest({ apiKey: "sk-test", path: "/admin" }), /OPENAI_PATH_OUTSIDE_V1/);
});

test("capability discovery records observed HTTP facts without declaring verification", async () => {
  const seen = [];
  const result = await discoverOpenAICapability({
    apiKey: "sk-test-secret",
    fetchImpl: async (url, options) => {
      seen.push({ url, options });
      return new Response(JSON.stringify({ data: [{ id: "model-a" }, { id: "model-b" }] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });
  assert.equal(result.state, "CONNECTED");
  assert.equal(result.http_status, 200);
  assert.equal(result.model_count, 2);
  assert.equal(result.verified, false);
  assert.equal(seen[0].url, "https://api.openai.com/v1/models");
  assert.equal(seen[0].options.headers.Authorization, "Bearer sk-test-secret");
});

test("missing key produces a safe human boundary", async () => {
  const result = await runOpenAIDeveloperTribute({ apiKey: "" });
  assert.equal(result.state, "WAITING_HUMAN");
  assert.equal(result.reason, "OPENAI_API_KEY_NOT_PRESENT");
  assert.equal(result.credential.fingerprint, null);
  assert.equal(result.artifact.truth.key_value_never_persisted, true);
});

test("thank-you artifact is spectacular without inventing partnership", () => {
  const artifact = createThankYouArtifact({
    developer: { id: "developer-1" },
    fingerprint: "0123456789abcdef",
    capability: { state: "CONNECTED", provider: "openai" },
  });
  assert.match(artifact.title, /ACORN × OPENAI DEVELOPER/);
  assert.match(artifact.thank_you, /Thank you/);
  assert.equal(artifact.truth.affiliation_not_claimed, true);
  assert.equal(artifact.truth.payment_not_inferred, true);
});
