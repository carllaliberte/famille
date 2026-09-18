#!/usr/bin/env node
/**
 * ACORN — OPENAI DEVELOPER TRIBUTE / CAPABILITY BRIDGE
 *
 * A spectacular, provider-specific developer experience built on the
 * provider-neutral Acorn fabric.
 *
 * IMPORTANT:
 * - Never stores or prints an API secret.
 * - Never claims affiliation, endorsement, sponsorship, or official status.
 * - A developer key proves only that a developer supplied credentials.
 * - API access/capability != Acorn authority.
 * - DISCOVERED != CONNECTED != MEASURED != VERIFIED != LIVE.
 */
import crypto from "node:crypto";

export const OPENAI_TRIBUTE_VERSION = "acorn.openai-developer-tribute.v1";

const clean = (v) => String(v ?? "").trim();

export function keyFingerprint(secret) {
  const value = clean(secret);
  if (!value) return null;
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function createDeveloperTribute({ developer = {}, keyPresent = false, model = null } = {}) {
  return {
    version: OPENAI_TRIBUTE_VERSION,
    experience: "OPENAI_DEVELOPER_TRIBUTE",
    message: "Thank you to the developers who make intelligent systems usable in the real world.",
    provider: "openai",
    identity: {
      developer_id: developer.id ? clean(developer.id) : null,
      organization: developer.organization ? clean(developer.organization) : null,
    },
    credential: {
      present: Boolean(keyPresent),
      stored: false,
      logged: false,
      fingerprint: null,
    },
    model: model ? clean(model) : null,
    claims: {
      official_openai_affiliation: false,
      endorsement: false,
      sponsorship: false,
      partnership: false,
    },
    acorn: {
      capability_is_not_authority: true,
      human_authority: "carl",
      live: false,
      verified: false,
    },
  };
}

export function buildOpenAIRequest({ apiKey, path = "/v1/models", method = "GET", body = undefined } = {}) {
  const secret = clean(apiKey);
  if (!secret) throw new Error("OPENAI_API_KEY_REQUIRED");
  if (!path.startsWith("/v1/")) throw new Error("OPENAI_PATH_OUTSIDE_V1");

  const headers = {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
  return {
    url: `https://api.openai.com${path}`,
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  };
}

export async function discoverOpenAICapability({ apiKey, fetchImpl = fetch } = {}) {
  const request = buildOpenAIRequest({ apiKey });
  const response = await fetchImpl(request.url, {
    method: request.method,
    headers: request.headers,
  });
  const text = await response.text();

  let payload = null;
  try { payload = JSON.parse(text); } catch {}

  return {
    version: OPENAI_TRIBUTE_VERSION,
    provider: "openai",
    state: response.ok ? "CONNECTED" : "CONNECTION_FAILED",
    http_status: response.status,
    capability: response.ok ? "MODEL_DISCOVERY" : null,
    model_count: Array.isArray(payload?.data) ? payload.data.length : null,
    secret_exposed: false,
    verified: false,
    live: false,
    evidence: response.ok ? "HTTP_RESPONSE_OBSERVED" : "HTTP_ERROR_OBSERVED",
  };
}

export function createThankYouArtifact({ capability, developer = {}, fingerprint = null } = {}) {
  return {
    version: OPENAI_TRIBUTE_VERSION,
    artifact: "DEVELOPER_THANK_YOU",
    title: "ACORN × OPENAI DEVELOPER",
    subtitle: "One key. One capability discovery. A thousand possible realities.",
    thank_you: "Thank you for building the substrate that lets developers turn ideas into working systems.",
    developer: {
      id: developer.id ? clean(developer.id) : null,
      organization: developer.organization ? clean(developer.organization) : null,
    },
    credential_fingerprint: fingerprint,
    capability,
    next: [
      "DISCOVER capabilities",
      "COMPARE measurable options",
      "COMPOSE a solution",
      "EXECUTE only when authorized",
      "MEASURE the real outcome",
      "REGISTER what was learned",
      "REUSE the capability",
    ],
    truth: {
      key_value_never_persisted: true,
      key_value_never_rendered: true,
      affiliation_not_claimed: true,
      payment_not_inferred: true,
      customer_value_not_inferred: true,
      authority_not_transferred: true,
    },
  };
}

export async function runOpenAIDeveloperTribute({ apiKey = process.env.OPENAI_API_KEY, developer = {}, fetchImpl = fetch } = {}) {
  const fingerprint = keyFingerprint(apiKey);
  const tribute = createDeveloperTribute({ developer, keyPresent: Boolean(apiKey) });
  tribute.credential.fingerprint = fingerprint;

  if (!apiKey) {
    return {
      ...tribute,
      state: "WAITING_HUMAN",
      reason: "OPENAI_API_KEY_NOT_PRESENT",
      artifact: createThankYouArtifact({ capability: null, developer }),
    };
  }

  const capability = await discoverOpenAICapability({ apiKey, fetchImpl });
  return {
    ...tribute,
    state: capability.state,
    capability,
    artifact: createThankYouArtifact({ capability, developer, fingerprint }),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runOpenAIDeveloperTribute()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(JSON.stringify({
        version: OPENAI_TRIBUTE_VERSION,
        state: "ERROR",
        error: error instanceof Error ? error.message : String(error),
        secret_exposed: false,
      }, null, 2));
      process.exitCode = 1;
    });
}
