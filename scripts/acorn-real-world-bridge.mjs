/** ACORN — REAL-WORLD BRIDGE
 * Provider-neutral HTTP execution for measured external systems.
 * Credentials are referenced by environment-variable name and never persisted.
 * Client HTTP fields never grant authority or scope.
 * CAPABILITY != AUTHORITY.
 */
import crypto from "node:crypto";
import dns from "node:dns/promises";

const ISO = () => new Date().toISOString();
const uid = (p) => `${p}_${crypto.randomUUID()}`;
const hash = (value) => crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
const SERVER_AUTHORITY = Symbol("acorn.server-authority");
const MAX_RESPONSE_BYTES = 1_048_576;
const idempotencyStore = new Map();

export const EFFECTS = Object.freeze(["READ", "WRITE", "MONEY", "PUBLISH", "SIGN", "DELETE", "MERGE", "UNKNOWN"]);
export const CONSEQUENTIAL_EFFECTS = Object.freeze(["WRITE", "MONEY", "PUBLISH", "SIGN", "DELETE", "MERGE", "UNKNOWN"]);
const READ_METHODS = new Set(["GET", "HEAD"]);
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH"]);
const DELETE_METHODS = new Set(["DELETE"]);
const POST_METHODS = new Set(["POST"]);
const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "metadata.goog",
  "0.0.0.0"
]);

function effectGuard(effect) {
  const value = String(effect || "UNKNOWN").toUpperCase();
  if (!EFFECTS.includes(value)) throw new Error("UNKNOWN_EFFECT");
  return value;
}

export function isConsequentialEffect(effect) {
  return CONSEQUENTIAL_EFFECTS.includes(effectGuard(effect));
}

export function grantServerAuthority({ actor } = {}) {
  if (String(actor || "").toLowerCase() !== "carl") return null;
  return Object.freeze({
    [SERVER_AUTHORITY]: true,
    source: "server",
    actor: "carl",
    granted_at: ISO()
  });
}

export function isServerAuthority(authority) {
  return Boolean(authority && authority[SERVER_AUTHORITY] === true && authority.actor === "carl" && authority.source === "server");
}

function blockedHost(hostname) {
  const h = String(hostname || "").toLowerCase().replace(/\.$/, "");
  if (!h) return true;
  if (BLOCKED_HOSTS.has(h)) return true;
  if (h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal") || h.endsWith(".lan")) return true;
  if (h === "127.0.0.1" || h === "::1" || h === "[::1]") return true;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return true;
  if (h.includes(":")) return true;
  return false;
}

export function assertPublicHttpsUrl(raw) {
  let url;
  try { url = new URL(String(raw || "")); } catch { throw new Error("URL_OUT_OF_SCOPE"); }
  if (url.protocol !== "https:") throw new Error("URL_OUT_OF_SCOPE");
  if (url.username || url.password) throw new Error("URL_OUT_OF_SCOPE");
  if (url.port && url.port !== "443") throw new Error("URL_OUT_OF_SCOPE");
  if (blockedHost(url.hostname)) throw new Error("URL_OUT_OF_SCOPE");
  return url;
}

export function resolveSafeExternalUrl(base, path = "") {
  const baseUrl = assertPublicHttpsUrl(base);
  const rawPath = String(path || "");
  if (!rawPath || rawPath === "." || rawPath === "/") return baseUrl.toString();
  if (/^[a-z][a-z0-9+.-]*:/i.test(rawPath) || rawPath.startsWith("//") || rawPath.includes("\\")) {
    throw new Error("URL_OUT_OF_SCOPE");
  }
  if (/%2f|%5c|%00/i.test(rawPath)) throw new Error("URL_OUT_OF_SCOPE");
  const relative = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
  const resolved = new URL(relative, baseUrl.href.endsWith("/") ? baseUrl.href : `${baseUrl.href}/`);
  assertPublicHttpsUrl(resolved.toString());
  if (resolved.origin !== baseUrl.origin) throw new Error("URL_OUT_OF_SCOPE");
  if (resolved.pathname.includes("..")) throw new Error("URL_OUT_OF_SCOPE");
  const prefix = baseUrl.pathname === "/" ? "/" : (baseUrl.pathname.endsWith("/") ? baseUrl.pathname : `${baseUrl.pathname}/`);
  if (prefix !== "/" && !resolved.pathname.startsWith(prefix.slice(0, -1))) throw new Error("URL_OUT_OF_SCOPE");
  return resolved.toString();
}

function methodAllowed(effect, method) {
  const m = String(method || "").toUpperCase();
  if (effect === "READ") return READ_METHODS.has(m);
  if (effect === "WRITE") return WRITE_METHODS.has(m);
  if (effect === "DELETE") return DELETE_METHODS.has(m);
  if (effect === "MONEY" || effect === "PUBLISH" || effect === "SIGN" || effect === "MERGE") return POST_METHODS.has(m);
  return false;
}

function isPrivateOrBlockedIp(addr) {
  const h = String(addr || "").toLowerCase();
  if (!h) return true;
  if (h === "::1" || h.startsWith("fe80:") || h.startsWith("fc") || h.startsWith("fd")) return true;
  const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 10 || a === 0 || a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

async function assertResolvedPublic(hostname, lookupImpl) {
  if (typeof lookupImpl !== "function") return;
  const result = await lookupImpl(hostname, { all: true });
  const addresses = Array.isArray(result) ? result : [result];
  for (const row of addresses) {
    const addr = String(row?.address || row || "");
    if (isPrivateOrBlockedIp(addr)) throw new Error("URL_OUT_OF_SCOPE");
  }
}

function descriptorFromEnv(raw) {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("CONNECTORS_MUST_BE_ARRAY");
  return parsed.map((x) => {
    let in_scope = true;
    try { assertPublicHttpsUrl(x.base_url); } catch { in_scope = false; }
    return {
      id: String(x.id || ""),
      provider: String(x.provider || ""),
      kind: String(x.kind || "http"),
      base_url: String(x.base_url || ""),
      effect: effectGuard(x.effect),
      capabilities: Array.isArray(x.capabilities) ? [...new Set(x.capabilities.map(String))] : [],
      credential_env: x.credential_env ? String(x.credential_env) : null,
      timeout_ms: Math.min(Math.max(Number(x.timeout_ms || 15000), 1000), 60000),
      headers: x.headers && typeof x.headers === "object" ? x.headers : {},
      in_scope
    };
  });
}

export function loadRealWorldConnectors(raw = process.env.ACORN_REAL_WORLD_CONNECTORS) {
  return descriptorFromEnv(raw).filter((x) => x.id && x.provider && x.base_url && x.in_scope);
}

export function connectorSnapshotMeasured(connectors = loadRealWorldConnectors()) {
  return {
    count: connectors.length,
    providers: [...new Set(connectors.map((x) => x.provider))],
    configured: connectors.filter((x) => x.credential_env ? Boolean(process.env[x.credential_env]) : true).length,
    effects: [...new Set(connectors.map((x) => x.effect))],
    secret_custody: false,
    measured_at: ISO()
  };
}

function credentialValue(connector) {
  if (!connector.credential_env) return null;
  return process.env[connector.credential_env] || null;
}

function blockedCall({ effect, reason, extra = {} }) {
  return {
    id: uid("ext"),
    state: "BLOCKED",
    reason,
    effect,
    external_effect: false,
    authority: false,
    human_authorized: false,
    client_authorization_ignored: true,
    ...extra
  };
}

export function publicExternalResult(result = {}) {
  const out = { ...result };
  delete out.credential;
  delete out.credential_env;
  delete out.output;
  delete out.headers;
  delete out.authorization;
  return out;
}

export function buildExternalCall({
  connector,
  path = "",
  method = "GET",
  body = null,
  human_authorized = false,
  authorized = false,
  authority = null,
  source = "library",
  idempotency_key = null
} = {}) {
  void human_authorized;
  void authorized;
  if (!connector?.id) throw new Error("CONNECTOR_REQUIRED");
  const effect = effectGuard(connector.effect);
  if (effect === "UNKNOWN") return blockedCall({ effect, reason: "UNKNOWN_EFFECT_LOCKED" });
  const consequential = isConsequentialEffect(effect);
  if (consequential && !isServerAuthority(authority)) {
    return blockedCall({ effect, reason: "HUMAN_AUTHORIZATION_REQUIRED", extra: { source } });
  }
  if (source === "http" && consequential) {
    return blockedCall({ effect, reason: "HUMAN_AUTHORIZATION_REQUIRED", extra: { source } });
  }
  if (!methodAllowed(effect, method)) {
    return blockedCall({ effect, reason: "METHOD_NOT_ALLOWED", extra: { source } });
  }
  let url;
  try {
    url = resolveSafeExternalUrl(connector.base_url, path);
  } catch {
    return blockedCall({ effect, reason: "URL_OUT_OF_SCOPE", extra: { source } });
  }
  const credential = credentialValue(connector);
  if (connector.credential_env && !credential) {
    return blockedCall({ effect, reason: "CREDENTIAL_NOT_CONFIGURED", extra: { source, credential_present: false } });
  }
  return {
    id: uid("ext"),
    state: "AUTHORIZED",
    effect,
    url,
    method: String(method).toUpperCase(),
    body,
    credential_present: Boolean(credential),
    credential_env: connector.credential_env || null,
    idempotency_key: idempotency_key || uid("idem"),
    connector_id: connector.id,
    human_authorized: false,
    client_authorization_ignored: true,
    authority: isServerAuthority(authority),
    source,
    timeout_ms: connector.timeout_ms || 15000,
    external_effect: false,
    created_at: ISO()
  };
}

async function readCappedText(response, maxBytes = MAX_RESPONSE_BYTES) {
  if (typeof response.text === "function" && response.body == null) {
    const text = await response.text();
    if (Buffer.byteLength(text) > maxBytes) throw new Error("RESPONSE_TOO_LARGE");
    return text;
  }
  if (!response.body || typeof response.body.getReader !== "function") {
    const text = await response.text();
    if (Buffer.byteLength(text) > maxBytes) throw new Error("RESPONSE_TOO_LARGE");
    return text;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let n = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    n += value.length;
    if (n > maxBytes) throw new Error("RESPONSE_TOO_LARGE");
    chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}

export async function executeExternalCall(call, {
  fetchImpl = globalThis.fetch,
  credential = null,
  lookupImpl = null,
  idempotency = idempotencyStore
} = {}) {
  if (call?.state !== "AUTHORIZED") return { ...call, completed_at: ISO() };
  if (call.source === "http" && isConsequentialEffect(call.effect)) {
    return { ...call, state: "BLOCKED", reason: "HUMAN_AUTHORIZATION_REQUIRED", completed_at: ISO(), external_effect: false };
  }
  if (typeof fetchImpl !== "function") return { ...call, state: "BLOCKED", reason: "FETCH_UNAVAILABLE", completed_at: ISO() };
  const cacheKey = `${call.connector_id || ""}:${call.idempotency_key || ""}`;
  if (cacheKey !== ":" && idempotency?.has?.(cacheKey)) {
    return { ...idempotency.get(cacheKey), idempotent_replay: true, completed_at: ISO() };
  }
  try {
    if (fetchImpl === globalThis.fetch) {
      const hostname = new URL(call.url).hostname;
      await assertResolvedPublic(hostname, lookupImpl || dns.lookup);
    }
  } catch {
    return { ...call, state: "BLOCKED", reason: "URL_OUT_OF_SCOPE", completed_at: ISO(), external_effect: false };
  }
  const started = ISO();
  const headers = {
    accept: "application/json",
    ...(call.body ? { "content-type": "application/json" } : {}),
    "x-acorn-execution-id": call.id,
    "idempotency-key": call.idempotency_key
  };
  if (credential) headers.authorization = `Bearer ${credential}`;
  let response;
  try {
    response = await fetchImpl(call.url, {
      method: call.method,
      headers,
      body: call.body ? JSON.stringify(call.body) : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(Number(call.timeout_ms || 15000))
    });
  } catch (error) {
    const reason = String(error?.name || error?.message || error).includes("Timeout") ? "TIMEOUT" : "FETCH_FAILED";
    return { ...call, state: "FAILED", reason, error: reason, started_at: started, completed_at: ISO(), external_effect: false };
  }
  if (response.status >= 300 && response.status < 400) {
    return {
      ...call,
      state: "BLOCKED",
      reason: "REDIRECT_FORBIDDEN",
      http_status: response.status,
      started_at: started,
      completed_at: ISO(),
      external_effect: false
    };
  }
  let text;
  try {
    text = await readCappedText(response);
  } catch (error) {
    const reason = String(error?.message || error) === "RESPONSE_TOO_LARGE" ? "RESPONSE_TOO_LARGE" : "FETCH_FAILED";
    return { ...call, state: "FAILED", reason, error: reason, started_at: started, completed_at: ISO(), external_effect: false };
  }
  let output = text;
  try { output = JSON.parse(text); } catch {}
  const measured_at = ISO();
  const day = measured_at.slice(0, 10);
  const result = {
    ...call,
    state: response.ok ? "SUCCEEDED" : "FAILED",
    http_status: response.status,
    output_hash: hash(output),
    error: response.ok ? null : "EXTERNAL_HTTP_ERROR",
    started_at: started,
    completed_at: measured_at,
    measured_at,
    external_effect: call.effect !== "READ",
    evidence: {
      origin: "external_http",
      status: response.status,
      ok: response.ok,
      measured_at,
      valid_until: `${day}T23:59:59.000Z`,
      horizon: day,
      strength: response.ok ? 1 : 0,
      margin: response.ok ? 0.1 : 0,
      label: "OBSERVED",
      verified: false,
      live: false
    }
  };
  delete result.output;
  if (cacheKey !== ":" && idempotency?.set) idempotency.set(cacheKey, publicExternalResult(result));
  return result;
}

export function buildExternalIntelligenceAdapter({ connector, requestBuilder, authority = null } = {}) {
  return async (invocation) => {
    const body = typeof requestBuilder === "function" ? requestBuilder(invocation) : { input: invocation.input || invocation.task_id || "" };
    const call = buildExternalCall({
      connector,
      path: "",
      method: connector?.effect === "READ" ? "GET" : "POST",
      body,
      authority,
      source: "adapter",
      idempotency_key: invocation.id
    });
    return executeExternalCall(call);
  };
}

export function realWorldBridgeSnapshot(connectors = loadRealWorldConnectors()) {
  return {
    bridge: "ACORN_REAL_WORLD_BRIDGE",
    connectors: connectorSnapshotMeasured(connectors),
    policy: {
      capability_is_not_authority: true,
      human_authorization_for_consequential_effects: true,
      client_authorization_ignored: true,
      secret_custody: false,
      persist_raw_credentials: false,
      persist_raw_secrets: false,
      measured_only: true,
      external_effects_observed: true,
      http_200_is_not_verified: true,
      http_cannot_grant_authority: true,
      consequential_effects_server_locked: CONSEQUENTIAL_EFFECTS.slice(),
      untrusted_client_fields: ["base_url", "path", "method", "human_authorized", "authority", "authorized"]
    },
    measured_at: ISO()
  };
}
