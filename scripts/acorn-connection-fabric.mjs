#!/usr/bin/env node
/**
 * ACORN CONNECTION FABRIC
 *
 * One canonical connection lifecycle for the whole organism.
 *
 * INTERNAL:
 *   organ/fabric -> connection fabric -> target capability
 *
 * EXTERNAL:
 *   world -> Connector AI / Flux -> adapter -> Acorn
 *   Acorn -> Connector AI / Flux -> adapter -> world
 *
 * A connector is a transport boundary. An adapter is a capability implementation.
 * A connection is a measured session. None of these is authority.
 *
 * DISCOVERED != CONNECTED != EXECUTABLE != MEASURED != VERIFIED != LIVE
 * Unknown is investigated/quarantined, never silently trusted.
 * No provider allowlist is required: adapters are registered by capability.
 * Credentials are never returned, logged, or persisted by this fabric.
 *
 * CARL = human authority. AUTO_MERGE = false. AUTO_SPEND = false. LIVE = false.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  admitIngress,
  releaseEgress,
  redactSecrets,
  resetConnector,
  connectorConstitution,
} from "./acorn-connector-flux.mjs";

export const CONNECTION_FABRIC_VERSION = "acorn.connection-fabric.v1";

export const CONNECTION_STATES = Object.freeze([
  "DISCOVERED",
  "IDENTIFIED",
  "AUTHENTICATED",
  "CONNECTING",
  "CONNECTED",
  "HEALTHY",
  "DEGRADED",
  "QUARANTINED",
  "DISCONNECTED",
  "REVOKED",
  "FAILED",
  "HOLD_HUMAN",
  "UNKNOWN",
]);

export const CONNECTION_OPERATIONS = Object.freeze([
  "discover",
  "identify",
  "authenticate",
  "health",
  "capabilities",
  "connect",
  "disconnect",
  "send",
  "receive",
  "request",
  "observe",
  "cancel",
  "measure",
  "verify",
  "revoke",
]);

export const CONNECTION_INVARIANTS = Object.freeze([
  "ONE_CONNECTION_FABRIC",
  "ALL_EXTERNAL_FLOWS_USE_CONNECTOR_FLUX",
  "NO_DIRECT_EXTERNAL_TO_ACORN",
  "NO_DIRECT_ACORN_TO_EXTERNAL",
  "ADAPTER_IS_NOT_CONNECTION",
  "CONNECTION_IS_NOT_PROOF",
  "CAPABILITY_IS_NOT_AUTHORITY",
  "UNKNOWN_IS_NOT_TRUSTED",
  "NO_IMPLICIT_TRUST",
  "NO_SECRET_LOGGING",
  "NO_AUTO_SPEND",
  "NO_AUTO_MERGE",
  "HUMAN_AUTHORITY_CARL",
  "REVOKABLE_CONNECTIONS",
  "MEASURE_BEFORE_PROMOTION",
]);

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const adapters = new Map();
const connections = new Map();
const observations = [];
const proofs = [];

function text(value) { return String(value ?? "").trim(); }
function nowIso(value) {
  const s = text(value);
  return /^\d{4}-\d{2}-\d{2}T/.test(s) ? s : new Date().toISOString();
}
function digest(value) {
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}
function id(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
function safeState(state) {
  const value = text(state).toUpperCase() || "UNKNOWN";
  return CONNECTION_STATES.includes(value) ? value : "UNKNOWN";
}
function record(row) {
  const out = {
    ...redactSecrets(row),
    live: false,
    auto_merge: false,
    auto_spend: false,
    authority: "carl",
    observed_at: nowIso(row.observed_at),
  };
  observations.push(out);
  if (observations.length > 300) observations.shift();
  return out;
}

export function connectionConstitution() {
  return Object.freeze({
    version: CONNECTION_FABRIC_VERSION,
    owner: "acorn",
    one_connection_fabric: true,
    second_connection_fabric: false,
    second_connector: false,
    second_registry: false,
    belongs_to_cortex: true,
    connector_flux_version: connectorConstitution().version,
    external_boundary: "connector-flux",
    provider_neutral: true,
    capability_routed: true,
    no_provider_allowlist: true,
    adapter_is_not_connection: true,
    connection_is_not_proof: true,
    capability_is_not_authority: true,
    unknown_is_not_trusted: true,
    human_authority: "carl",
    authority: "carl",
    auto_merge: false,
    auto_spend: false,
    live: false,
    invariants: [...CONNECTION_INVARIANTS],
  });
}

export function resetConnectionFabric() {
  adapters.clear();
  connections.clear();
  observations.length = 0;
  proofs.length = 0;
  resetConnector();
}

function validateAdapter(adapter) {
  if (!adapter || typeof adapter !== "object") throw new TypeError("ADAPTER_REQUIRED");
  if (!text(adapter.id)) throw new TypeError("ADAPTER_ID_REQUIRED");
  if (typeof adapter.capabilities !== "function" && !Array.isArray(adapter.capabilities)) {
    throw new TypeError("ADAPTER_CAPABILITIES_REQUIRED");
  }
  return adapter;
}

export function registerAdapter(adapter) {
  const value = validateAdapter(adapter);
  const idValue = text(value.id);
  adapters.set(idValue, {
    ...value,
    id: idValue,
    authority: false,
    live: false,
    registered_at: nowIso(value.registered_at),
  });
  return adapterCard(idValue);
}

function adapterCard(idValue) {
  const adapter = adapters.get(idValue);
  if (!adapter) return {
    id: idValue,
    state: "UNKNOWN",
    adapter_defined: false,
    live: false,
    authority: false,
  };
  const capabilities = typeof adapter.capabilities === "function"
    ? adapter.capabilities()
    : adapter.capabilities;
  return {
    id: idValue,
    name: text(adapter.name) || idValue,
    kind: text(adapter.kind) || "generic",
    capabilities: Array.isArray(capabilities) ? [...new Set(capabilities.map(text).filter(Boolean))] : [],
    adapter_defined: true,
    state: "DISCOVERED",
    live: false,
    authority: false,
  };
}

export function discoverAdapters({ filter = null } = {}) {
  const rows = [...adapters.keys()]
    .map(adapterCard)
    .filter((row) => !filter || row.kind === filter || row.id === filter);
  return {
    status: rows.length ? "DISCOVERED" : "UNKNOWN",
    count: rows.length,
    adapters: rows,
    live: false,
    authority: "carl",
  };
}

async function callAdapter(adapter, operation, payload = {}, context = {}) {
  const fn = adapter[operation];
  if (typeof fn !== "function") {
    return { supported: false, status: "UNKNOWN", reason: `OPERATION_NOT_IMPLEMENTED:${operation}` };
  }
  try {
    const result = await fn(payload, {
      ...context,
      connection_fabric: CONNECTION_FABRIC_VERSION,
      authority: "carl",
    });
    return {
      supported: true,
      status: safeState(result?.status || "HEALTHY"),
      result: redactSecrets(result),
    };
  } catch (error) {
    return {
      supported: true,
      status: "FAILED",
      reason: text(error?.message || error).slice(0, 240),
    };
  }
}

export function identifyAdapter(adapter_id) {
  const card = adapterCard(text(adapter_id));
  return {
    status: card.adapter_defined ? "IDENTIFIED" : "UNKNOWN",
    identified: card.adapter_defined,
    adapter: card,
    live: false,
    authority: "carl",
  };
}

export async function authenticateAdapter(adapter_id, context = {}) {
  const adapter = adapters.get(text(adapter_id));
  if (!adapter) return { status: "UNKNOWN", authenticated: false, reason: "ADAPTER_NOT_DISCOVERED", live: false, authority: "carl" };
  const result = await callAdapter(adapter, "authenticate", context, context);
  return {
    status: result.status,
    authenticated: result.status === "AUTHENTICATED" || result.result?.authenticated === true,
    result: result.result || null,
    live: false,
    authority: "carl",
  };
}

export async function capabilities(adapter_id, context = {}) {
  const adapter = adapters.get(text(adapter_id));
  if (!adapter) return { status: "UNKNOWN", capabilities: [], live: false, authority: "carl" };
  const result = await callAdapter(adapter, "capabilities", {}, context);
  const values = Array.isArray(result.result) ? result.result : (Array.isArray(result.result?.capabilities) ? result.result.capabilities : []);
  return {
    status: result.status,
    capabilities: [...new Set(values.map(text).filter(Boolean))],
    live: false,
    authority: "carl",
  };
}

export async function observe(connection_id, options = {}) {
  const connection = connections.get(text(connection_id));
  if (!connection || connection.revoked) return { status: "REVOKED", observed: false, live: false };
  const adapter = adapters.get(connection.adapter_id);
  if (!adapter) return { status: "UNKNOWN", observed: false, live: false };
  const result = await callAdapter(adapter, "observe", { connection_id }, { ...options, connection });
  const observed = result.supported && result.status !== "FAILED" && result.status !== "UNKNOWN";
  record({ type: "connection", operation: "observe", connection_id, observed, state: connection.state });
  return { ...result, observed, connection: { ...connection }, live: false, authority: "carl" };
}

export async function cancel(connection_id, operation_id = null, options = {}) {
  const connection = connections.get(text(connection_id));
  if (!connection || connection.revoked) return { status: "REVOKED", cancelled: false, live: false };
  const adapter = adapters.get(connection.adapter_id);
  if (!adapter) return { status: "UNKNOWN", cancelled: false, live: false };
  const result = await callAdapter(adapter, "cancel", { connection_id, operation_id }, { ...options, connection });
  const cancelled = result.supported && result.status !== "FAILED" && result.status !== "UNKNOWN";
  record({ type: "connection", operation: "cancel", connection_id, cancelled });
  return { ...result, cancelled, live: false, authority: "carl" };
}

export async function connect({
  adapter_id,
  identity = "UNKNOWN",
  capability = UNKNOWN,
  provenance = null,
  authenticated = false,
  credential_present = false,
  human_authorization = false,
  env = process.env,
  now = new Date().toISOString(),
  metadata = {},
} = {}) {
  const adapter = adapters.get(text(adapter_id));
  if (!adapter) {
    return { status: "UNKNOWN", reason: "ADAPTER_NOT_DISCOVERED", connected: false, live: false, authority: "carl" };
  }
  const started = Date.now();
  const ingress = admitIngress({
    kind: text(adapter.kind) || "generic-ai",
    channel: "connection",
    source: adapter.id,
    actor: identity,
    payload: { capability, metadata },
    authenticated,
    at: now,
  }, env);
  if (ingress.decision !== "ADMIT") {
    const status = ingress.status === "QUARANTINED" ? "QUARANTINED" : "FAILED";
    return {
      status,
      reason: ingress.reason,
      connected: false,
      adapter_id: adapter.id,
      ingress,
      duration_ms: Date.now() - started,
      live: false,
      authority: "carl",
    };
  }
  if (credential_present && !authenticated) {
    return {
      status: "HOLD_HUMAN",
      reason: "CREDENTIAL_PRESENT_BUT_NOT_AUTHENTICATED",
      connected: false,
      adapter_id: adapter.id,
      ingress,
      live: false,
      authority: "carl",
    };
  }
  if (metadata.paid === true && human_authorization !== true) {
    return {
      status: "HOLD_HUMAN",
      reason: "PAID_CONNECTION_REQUIRES_HUMAN_AUTHORIZATION",
      connected: false,
      adapter_id: adapter.id,
      ingress,
      live: false,
      authority: "carl",
    };
  }

  const auth = authenticated
    ? { status: "AUTHENTICATED", authenticated: true }
    : await callAdapter(adapter, "authenticate", { identity, capability, metadata }, { env, now });
  if (auth.status === "FAILED" || auth.status === "UNKNOWN") {
    return {
      status: auth.status,
      reason: auth.reason || "AUTHENTICATION_UNPROVEN",
      connected: false,
      adapter_id: adapter.id,
      ingress,
      authentication: auth,
      live: false,
      authority: "carl",
    };
  }

  const connected = await callAdapter(adapter, "connect", {
    identity,
    capability,
    provenance,
    metadata,
  }, { env, now });

  if (connected.status === "FAILED" || connected.status === "UNKNOWN") {
    return {
      status: "FAILED",
      reason: connected.reason || "CONNECTION_FAILED",
      connected: false,
      adapter_id: adapter.id,
      ingress,
      authentication: auth,
      connection: connected,
      live: false,
      authority: "carl",
    };
  }

  const connection = {
    connection_id: id("conn"),
    adapter_id: adapter.id,
    identity: text(identity) || UNKNOWN,
    capability: text(capability) || UNKNOWN,
    provenance,
    state: "CONNECTED",
    authenticated: auth.authenticated === true || auth.status === "AUTHENTICATED",
    opened_at: nowIso(now),
    last_seen_at: nowIso(now),
    metadata: redactSecrets(metadata),
    expires_at: connected.result?.expires_at || null,
    revoked: false,
    measured: false,
    verified: false,
    live: false,
  };
  connections.set(connection.connection_id, connection);
  record({
    type: "connection",
    operation: "connect",
    connection_id: connection.connection_id,
    adapter_id: adapter.id,
    state: connection.state,
    duration_ms: Date.now() - started,
  });
  return {
    status: "CONNECTED",
    connected: true,
    connection,
    ingress,
    authentication: auth,
    adapter: adapterCard(adapter.id),
    duration_ms: Date.now() - started,
    live: false,
    authority: "carl",
  };
}

export async function disconnect(connection_id, { reason = "requested", env = process.env, now = new Date().toISOString() } = {}) {
  const connection = connections.get(text(connection_id));
  if (!connection) return { status: "UNKNOWN", disconnected: false, live: false, authority: "carl" };
  const adapter = adapters.get(connection.adapter_id);
  if (adapter) await callAdapter(adapter, "disconnect", { connection_id, reason }, { env, now });
  connection.state = "DISCONNECTED";
  connection.revoked = true;
  connection.last_seen_at = nowIso(now);
  record({ type: "connection", operation: "disconnect", connection_id, state: connection.state, reason });
  return { status: "DISCONNECTED", disconnected: true, connection: { ...connection }, live: false, authority: "carl" };
}

export function revoke(connection_id, reason = "revoked") {
  const connection = connections.get(text(connection_id));
  if (!connection) return { status: "UNKNOWN", revoked: false, live: false, authority: "carl" };
  connection.revoked = true;
  connection.state = "REVOKED";
  connection.revoke_reason = reason;
  record({ type: "connection", operation: "revoke", connection_id, state: "REVOKED", reason });
  return { status: "REVOKED", revoked: true, connection: { ...connection }, live: false, authority: "carl" };
}

export async function health(connection_id, { env = process.env, now = new Date().toISOString() } = {}) {
  const connection = connections.get(text(connection_id));
  if (!connection || connection.revoked) return { status: "REVOKED", healthy: false, live: false };
  const adapter = adapters.get(connection.adapter_id);
  if (!adapter) return { status: "UNKNOWN", healthy: false, live: false };
  const result = await callAdapter(adapter, "health", { connection_id }, { env, now });
  const healthy = result.status === "HEALTHY" || result.status === "CONNECTED" || result.result?.healthy === true;
  connection.state = healthy ? "HEALTHY" : (result.status === "FAILED" ? "FAILED" : "DEGRADED");
  connection.last_seen_at = nowIso(now);
  record({ type: "connection", operation: "health", connection_id, state: connection.state });
  return { ...result, healthy, connection: { ...connection }, live: false, authority: "carl" };
}

async function externalCall(connection, operation, payload, { env, now, human_authorization = false } = {}) {
  const adapter = adapters.get(connection.adapter_id);
  if (!adapter) return { status: "UNKNOWN", reason: "ADAPTER_NOT_FOUND", executed: false, live: false };
  const input = {
    kind: adapter.kind || "generic-ai",
    channel: "connection",
    source: adapter.id,
    actor: connection.identity,
    payload,
    authenticated: connection.authenticated,
    session_id: null,
    at: now,
  };
  if (operation === "receive") {
    const ingress = admitIngress(input, env);
    if (ingress.decision !== "ADMIT") return { status: ingress.status, reason: ingress.reason, executed: false, ingress, live: false };
    const result = typeof adapter.receive === "function"
      ? await callAdapter(adapter, "receive", payload, { env, now, connection })
      : { supported: false, status: "UNKNOWN", reason: "RECEIVE_NOT_IMPLEMENTED" };
    return { status: result.status, result: result.result, executed: result.supported && result.status !== "FAILED", ingress, live: false, authority: "carl" };
  }

  const egress = releaseEgress({
    kind: connection.capability || adapter.kind || "generic",
    channel: "connection",
    source: "acorn",
    destination: adapter.id,
    actor: connection.identity,
    payload,
    human_authorization,
    paid: payload?.paid === true,
  }, env);
  if (egress.decision !== "ADMIT") return { status: egress.status, reason: egress.reason, executed: false, egress, live: false, authority: "carl" };

  const result = typeof adapter[operation] === "function"
    ? await callAdapter(adapter, operation, payload, { env, now, connection })
    : { supported: false, status: "UNKNOWN", reason: `OPERATION_NOT_IMPLEMENTED:${operation}` };
  return {
    status: result.status,
    result: result.result,
    executed: result.supported && !["FAILED", "UNKNOWN"].includes(result.status),
    egress,
    live: false,
    authority: "carl",
  };
}

export async function send(connection_id, payload, options = {}) {
  const connection = connections.get(text(connection_id));
  if (!connection || connection.revoked) return { status: "REVOKED", executed: false, live: false };
  return externalCall(connection, "send", payload, options);
}
export async function request(connection_id, payload, options = {}) {
  const connection = connections.get(text(connection_id));
  if (!connection || connection.revoked) return { status: "REVOKED", executed: false, live: false };
  return externalCall(connection, "request", payload, options);
}
export async function receive(connection_id, payload = {}, options = {}) {
  const connection = connections.get(text(connection_id));
  if (!connection || connection.revoked) return { status: "REVOKED", executed: false, live: false };
  return externalCall(connection, "receive", payload, options);
}

export async function measureConnection(connection_id, { env = process.env, now = new Date().toISOString() } = {}) {
  const connection = connections.get(text(connection_id));
  if (!connection || connection.revoked) return { status: "REVOKED", measured: false, live: false };
  const started = Date.now();
  const healthResult = await health(connection_id, { env, now });
  const adapter = adapters.get(connection.adapter_id);
  const capabilities = adapter
    ? await callAdapter(adapter, "capabilities", { connection_id }, { env, now })
    : { status: "UNKNOWN", result: null };
  const measured = healthResult.healthy === true && capabilities.status !== "FAILED";
  connection.measured = measured;
  record({
    type: "measurement",
    operation: "measure",
    connection_id,
    measured,
    duration_ms: Date.now() - started,
  });
  return {
    status: measured ? "MEASURED" : "UNVERIFIED",
    measured,
    health: healthResult,
    capabilities,
    live: false,
    authority: "carl",
  };
}

export function verifyConnection(connection_id, evidence = {}) {
  const connection = connections.get(text(connection_id));
  if (!connection || connection.revoked) return { status: "REVOKED", verified: false, live: false };
  const measured = connection.measured === true;
  const evidenceOk = evidence && evidence.verified === true;
  connection.verified = measured && evidenceOk;
  const status = connection.verified ? "VERIFIED" : "UNVERIFIED";
  const proof = {
    proof_id: id("proof"),
    connection_id,
    status,
    measured,
    evidence: redactSecrets(evidence),
    digest: digest({ connection, evidence }),
    observed_at: nowIso(),
    live: false,
    authority: "carl",
  };
  proofs.push(proof);
  record({ type: "verification", operation: "verify", connection_id, status, proof_id: proof.proof_id });
  return proof;
}

export async function runConnectionSweep({
  env = process.env,
  now = new Date().toISOString(),
  adapterFactory = null,
} = {}) {
  resetConnector();
  const discovered = discoverAdapters();
  const rows = [];
  for (const card of discovered.adapters) {
    const adapter = adapters.get(card.id);
    const capabilities = await callAdapter(adapter, "capabilities", {}, { env, now });
    const auth = await callAdapter(adapter, "authenticate", { probe: true }, { env, now });
    rows.push({
      ...card,
      capabilities: capabilities.result || card.capabilities,
      authentication: {
        status: auth.status,
        authenticated: auth.result?.authenticated === true,
      },
      connection: "NOT_ATTEMPTED",
      reason: "SWEEP_DISCOVERS_AND_MEASURES; CONNECTION_REQUIRES_CONTEXT",
      live: false,
    });
  }

  const localAdapter = {
    id: "local-self-test",
    name: "Acorn local connection self-test",
    kind: "local",
    capabilities: ["health", "capabilities", "request", "send", "receive"],
    authenticate: async () => ({ status: "AUTHENTICATED", authenticated: true }),
    connect: async () => ({ status: "CONNECTED" }),
    health: async () => ({ status: "HEALTHY", healthy: true }),
    capabilities: () => ["health", "capabilities", "request", "send", "receive"],
    request: async (payload) => ({ status: "HEALTHY", echo: payload }),
    send: async (payload) => ({ status: "HEALTHY", accepted: true, digest: digest(payload) }),
    receive: async (payload) => ({ status: "HEALTHY", echo: payload }),
    disconnect: async () => ({ status: "DISCONNECTED" }),
  };
  adapters.set(localAdapter.id, localAdapter);
  const connected = await connect({
    adapter_id: localAdapter.id,
    identity: "acorn-runtime",
    capability: "local",
    authenticated: true,
    now,
    env,
  });
  const conn = connected.connection;
  let measured = { status: "UNVERIFIED", measured: false };
  let verified = { status: "UNVERIFIED", verified: false };
  if (conn) {
    measured = await measureConnection(conn.connection_id, { env, now });
    verified = verifyConnection(conn.connection_id, { verified: measured.measured });
    await request(conn.connection_id, { operation: "connection-self-test", probe: true }, { env, now });
  }

  const result = {
    version: CONNECTION_FABRIC_VERSION,
    constitution: connectionConstitution(),
    operations: [...CONNECTION_OPERATIONS],
    discovered,
    local_self_test: {
      connected: connected.status === "CONNECTED",
      connection: conn ? { connection_id: conn.connection_id, state: conn.state } : null,
      measured: measured.status,
      verified: verified.status,
    },
    active_connections: [...connections.values()].map((row) => ({
      connection_id: row.connection_id,
      adapter_id: row.adapter_id,
      capability: row.capability,
      state: safeState(row.state),
      authenticated: row.authenticated,
      measured: row.measured,
      verified: row.verified,
      live: false,
    })),
    metrics: {
      discovered_adapters: discovered.count,
      active_connections: [...connections.values()].filter((row) => !row.revoked).length,
      measured_connections: [...connections.values()].filter((row) => row.measured).length,
      verified_connections: [...connections.values()].filter((row) => row.verified).length,
      observation_count: observations.length,
    },
    proof: {
      status: connected.status === "CONNECTED" && measured.measured && verified.verified ? "VERIFIED" : "INCONCLUSIVE",
      digest: digest({ rows, connected: connected.status, measured: measured.status, verified: verified.status }),
    },
    rows,
    live: false,
    auto_merge: false,
    auto_spend: false,
    authority: "carl",
    observed_at: nowIso(now),
  };
  proofs.push(result.proof);
  return result;
}

export function snapshotConnections() {
  return {
    version: CONNECTION_FABRIC_VERSION,
    constitution: connectionConstitution(),
    adapters: discoverAdapters(),
    connections: [...connections.values()].map((row) => ({ ...row })),
    observations: observations.slice(-32),
    proofs: proofs.slice(-8),
    live: false,
    auto_merge: false,
    auto_spend: false,
    authority: "carl",
  };
}

export function builtInConnectionAdapters() {
  return [...adapters.values()].map((row) => adapterCard(row.id));
}

export function selfKnowledge() {
  return {
    identity: "ACORN CONNECTION FABRIC",
    can: [...CONNECTION_OPERATIONS],
    adapters: adapters.size,
    connections: connections.size,
    verified_connections: [...connections.values()].filter((row) => row.verified).length,
    unknown: [...connections.values()].filter((row) => row.state === "UNKNOWN").length,
    live: false,
    authority: "carl",
  };
}

export function connectionDigest(value) { return digest(value); }

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await runConnectionSweep();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
