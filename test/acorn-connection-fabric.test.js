import test from "node:test";
import assert from "node:assert/strict";
import {
  CONNECTION_OPERATIONS,
  connectionConstitution,
  registerAdapter,
  discoverAdapters,
  identifyAdapter,
  authenticateAdapter,
  capabilities,
  connect,
  health,
  measureConnection,
  verifyConnection,
  request,
  receive,
  send,
  observe,
  cancel,
  disconnect,
  revoke,
  resetConnectionFabric,
  runConnectionSweep,
  snapshotConnections,
} from "../scripts/acorn-connection-fabric.mjs";

test.beforeEach(() => resetConnectionFabric());

function adapter(overrides = {}) {
  return {
    id: "test-adapter",
    name: "test",
    kind: "generic-ai",
    capabilities: ["request", "send", "receive"],
    authenticate: async () => ({ status: "AUTHENTICATED", authenticated: true }),
    connect: async () => ({ status: "CONNECTED" }),
    health: async () => ({ status: "HEALTHY", healthy: true }),
    capabilities: () => ["request", "send", "receive"],
    request: async (payload) => ({ status: "HEALTHY", echo: payload }),
    send: async () => ({ status: "HEALTHY", accepted: true }),
    receive: async (payload) => ({ status: "HEALTHY", echo: payload }),
    observe: async () => ({ status: "HEALTHY", observed: true }),
    cancel: async () => ({ status: "HEALTHY", cancelled: true }),
    disconnect: async () => ({ status: "DISCONNECTED" }),
    ...overrides,
  };
}

test("one connection fabric owns the complete connection lifecycle", () => {
  const c = connectionConstitution();
  assert.equal(c.one_connection_fabric, true);
  assert.equal(c.external_boundary, "connector-flux");
  assert.equal(c.provider_neutral, true);
  assert.equal(c.capability_routed, true);
  assert.equal(c.auto_spend, false);
  assert.equal(c.auto_merge, false);
  assert.equal(c.authority, "carl");
  assert.deepEqual(CONNECTION_OPERATIONS, [
    "discover","identify","authenticate","health","capabilities","connect",
    "disconnect","send","receive","request","observe","cancel","measure","verify","revoke",
  ]);
});

test("adapter discovery does not claim connection", () => {
  registerAdapter(adapter());
  const d = discoverAdapters();
  assert.equal(d.count, 1);
  assert.equal(d.adapters[0].state, "DISCOVERED");
  assert.equal(d.adapters[0].authority, false);
  assert.equal(d.adapters[0].live, false);
});

test("connect, health, measure, verify, request and disconnect all execute through the canonical fabric", async () => {
  registerAdapter(adapter());
  const connected = await connect({
    adapter_id: "test-adapter",
    identity: "test-runtime",
    capability: "request",
    authenticated: true,
  });
  assert.equal(connected.status, "CONNECTED");
  const id = connected.connection.connection_id;
  const h = await health(id);
  assert.equal(h.healthy, true);
  const m = await measureConnection(id);
  assert.equal(m.measured, true);
  const v = verifyConnection(id, { verified: true });
  assert.equal(v.status, "VERIFIED");
  const r = await request(id, { ping: true });
  assert.equal(r.executed, true);
  assert.deepEqual(r.result.echo, { ping: true });
  const identified = identifyAdapter("test-adapter");
  assert.equal(identified.status, "IDENTIFIED");
  const authenticated = await authenticateAdapter("test-adapter", { identity: "test-runtime" });
  assert.equal(authenticated.authenticated, true);
  const caps = await capabilities("test-adapter");
  assert.ok(caps.capabilities.includes("request"));
  const sent = await send(id, { ping: true });
  assert.equal(sent.executed, true);
  const received = await receive(id, { pong: true });
  assert.equal(received.executed, true);
  const observed = await observe(id);
  assert.equal(observed.observed, true);
  const cancelled = await cancel(id, "op-1");
  assert.equal(cancelled.cancelled, true);
  const d = await disconnect(id);
  assert.equal(d.status, "DISCONNECTED");
  assert.equal((await request(id, {})).executed, false);
});

test("paid connection remains a human boundary and is never auto-spent", async () => {
  registerAdapter(adapter());
  const result = await connect({
    adapter_id: "test-adapter",
    identity: "business",
    capability: "request",
    authenticated: true,
    metadata: { paid: true },
    human_authorization: false,
  });
  assert.equal(result.status, "HOLD_HUMAN");
  assert.equal(result.connected, false);
});

test("unknown adapter and revoked connection fail closed", async () => {
  assert.equal((await connect({ adapter_id: "missing", identity: "x", authenticated: true })).status, "UNKNOWN");
  registerAdapter(adapter());
  const c = await connect({ adapter_id: "test-adapter", identity: "x", capability: "request", authenticated: true });
  const r = revoke(c.connection.connection_id, "test");
  assert.equal(r.status, "REVOKED");
  assert.equal((await health(c.connection.connection_id)).healthy, false);
});

test("connection sweep proves the mechanism with a local self-test without inventing external connectivity", async () => {
  registerAdapter(adapter());
  const result = await runConnectionSweep();
  assert.equal(result.local_self_test.connected, true);
  assert.equal(result.local_self_test.measured, "MEASURED");
  assert.equal(result.local_self_test.verified, "VERIFIED");
  assert.equal(result.constitution.external_boundary, "connector-flux");
  assert.equal(result.proof.status, "VERIFIED");
  assert.equal(result.live, false);
  assert.equal(result.auto_spend, false);
  assert.ok(result.metrics.discovered_adapters >= 1);
});

test("snapshot contains no credentials and preserves authority boundaries", () => {
  registerAdapter(adapter());
  const snap = snapshotConnections();
  assert.equal(snap.live, false);
  assert.equal(snap.auto_spend, false);
  assert.equal(snap.authority, "carl");
  assert.doesNotMatch(JSON.stringify(snap), /sk-[A-Za-z0-9]/);
});
