#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { customerServiceCycle } from "../scripts/acorn-customer-service.mjs";
import { createConnection, createIntelligenceAdapter, createEnterpriseCycle, enterpriseSnapshot, measureConnection } from "../scripts/acorn-real-world-enterprise-os.mjs";
import { createTask, buildExecutionPlan, executionSnapshot, runSyntheticExecution } from "../scripts/acorn-execution-fabric.mjs";
import { createLiveDatabase, now, makeId, parseJson, encodeJson } from "./database.mjs";
import { buildRuntimePlan, verifyRuntimePlan } from "../scripts/acorn-runtime-orchestrator.mjs";
import { createExecutionRun, executionLoopSnapshot } from "../scripts/acorn-execution-evidence-loop.mjs";
import { createConnectorExecutor, executeConnector } from "../scripts/acorn-connector-execution-fabric.mjs";
import { loadRealWorldConnectors, buildExternalCall, executeExternalCall, realWorldBridgeSnapshot, isConsequentialEffect, publicExternalResult } from "../scripts/acorn-real-world-bridge.mjs";
import { assessRuntimeStatus } from "./runtime-status.mjs";
import { persistState, persistEnterpriseEvent, persistEvidence, loadTenantState, loadTenantEvidence, loadTenantAsOf } from "./enterprise-store.mjs";
import { operateProblem, discoverUnknownIntelligence, runExecutionMode, futureProofContract, economicRecord, configuredIsNotConnected, providerFailureDoesNotHalt } from "../scripts/acorn-operational-fabric.mjs";

const APP_HTML = readFileSync(new URL("./app.html", import.meta.url), "utf8");

function logEvent(entry) {
  const row = {
    request_id: entry.request_id,
    tenant_id: entry.tenant_id || null,
    method: entry.method,
    path: entry.path,
    status: entry.status,
    duration_ms: entry.duration_ms,
    error_class: entry.error_class || null
  };
  console.log(JSON.stringify(row));
}

export async function createLiveServer({ env = process.env, db } = {}) {
  const database = db || await createLiveDatabase({ env });
  const MAX_BODY = Number(env.MAX_BODY_BYTES || process.env.MAX_BODY_BYTES || 262144);
  const RATE_MAX = Number(env.RATE_LIMIT_MAX || 180);
  const RATE_WINDOW = Number(env.RATE_LIMIT_WINDOW_MS || 60000);
  const hits = new Map();
  const json = (res, status, body, headers = {}) => {
    const data = JSON.stringify(body);
    res.writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "x-frame-options": "DENY",
      "content-length": Buffer.byteLength(data),
      ...headers
    });
    res.end(data);
  };
  const readBody = async (req) => {
    let n = 0;
    const chunks = [];
    for await (const c of req) {
      n += c.length;
      if (n > MAX_BODY) throw Object.assign(new Error("BODY_TOO_LARGE"), { status: 413, code: "BODY_TOO_LARGE" });
      chunks.push(c);
    }
    if (!chunks.length) return {};
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw Object.assign(new Error("INVALID_JSON"), { status: 400, code: "INVALID_JSON" }); }
  };
  const hashPassword = (p, s = crypto.randomBytes(16)) => new Promise((ok, bad) => crypto.scrypt(p, s, 64, (e, k) => e ? bad(e) : ok(s.toString("hex") + ":" + k.toString("hex"))));
  const verifyPassword = (p, v) => new Promise((ok, bad) => {
    const [s, h] = String(v).split(":");
    if (!s || !h) return ok(false);
    crypto.scrypt(p, Buffer.from(s, "hex"), 64, (e, k) => {
      if (e) return bad(e);
      const a = Buffer.from(h, "hex"), b = Buffer.from(k);
      ok(a.length === b.length && crypto.timingSafeEqual(a, b));
    });
  });
  const token = () => crypto.randomBytes(32).toString("base64url");
  const tokenHash = (t) => crypto.createHash("sha256").update(t).digest("hex");
  const bearer = (req) => {
    const h = req.headers.authorization || "";
    if (!h.startsWith("Bearer ")) return null;
    return h.slice(7);
  };
  const requireAuth = async (req) => {
    const raw = bearer(req);
    if (!raw) return null;
    const row = await database.get("SELECT customer_id,expires_at,token_hash FROM sessions WHERE token_hash=$1", [tokenHash(raw)]);
    return row && Date.parse(row.expires_at) > Date.now() ? row : null;
  };
  const publicRequest = (r) => r ? { id: r.id, status: r.status, created_at: r.created_at, updated_at: r.updated_at, ...parseJson(r.body, {}) } : null;
  const connections = () => {
    try { return parseJson(env.ACORN_CONNECTIONS || "[]", []).map(createConnection); }
    catch { return []; }
  };
  const intelligences = () => {
    try { return parseJson(env.ACORN_INTELLIGENCES || "[]", []).map((row) => ({ ...createIntelligenceAdapter(row), authority: false })); }
    catch { return []; }
  };
  const runtimeStatus = async () => {
    let dbHealthy = false;
    try { dbHealthy = await database.health(); } catch { dbHealthy = false; }
    return assessRuntimeStatus({ processBound: true, dbHealthy, evidence: [] });
  };
  const ownRequest = async (cid, requestId) => {
    if (!requestId) return null;
    return database.get("SELECT id FROM requests WHERE id=$1 AND customer_id=$2", [requestId, cid]);
  };
  const rateLimited = (req) => {
    const path = String(req.url || "").split("?")[0];
    if (path === "/healthz" || path === "/readyz") return false;
    const ip = String((req.headers["x-forwarded-for"] || "").toString().split(",")[0] || req.socket?.remoteAddress || "unknown").trim();
    const t = Date.now();
    const next = (hits.get(ip) || []).filter((x) => t - x < RATE_WINDOW);
    next.push(t);
    hits.set(ip, next);
    return next.length > RATE_MAX;
  };
  const readIdempotency = async (cid, key) => {
    if (!cid || !key) return null;
    return database.get("SELECT status,body FROM idempotency_keys WHERE tenant_id=$1 AND key=$2", [cid, key]);
  };
  const writeIdempotency = async (cid, key, method, path, status, body) => {
    if (!cid || !key) return;
    await database.run(
      "INSERT INTO idempotency_keys(tenant_id,key,method,path,status,body,created_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(tenant_id,key) DO NOTHING",
      [cid, key, method, path, status, encodeJson(database.mode, body), now()]
    );
  };

  async function register(b) {
    const email = String(b.email || "").trim().toLowerCase();
    const name = String(b.name || "").trim();
    const password = String(b.password || "");
    if (!email.includes("@") || !name || password.length < 10) return { status: 400, body: { error: "VALIDATION" } };
    if (await database.get("SELECT id FROM customers WHERE email=$1", [email])) return { status: 409, body: { error: "ACCOUNT_EXISTS" } };
    const cid = makeId("cus");
    const ph = await hashPassword(password);
    const created = now();
    const t = token();
    const expires = new Date(Date.now() + 2592000000).toISOString();
    await database.tx(async (tx) => {
      await tx.run("INSERT INTO customers(id,email,name,password_hash,created_at) VALUES($1,$2,$3,$4,$5)", [cid, email, name, ph, created]);
      await tx.run("INSERT INTO sessions(token_hash,customer_id,expires_at,created_at) VALUES($1,$2,$3,$4)", [tokenHash(t), cid, expires, created]);
      await persistState(tx, { entity: "CUSTOMER", id: cid, tenant_id: cid, state: "ACTIVE", data: { email, name }, created_at: created, provenance: "acorn" });
      await persistState(tx, { entity: "ORGANIZATION", id: "org_" + cid, tenant_id: cid, state: "ACTIVE", data: { name, owner: cid }, created_at: created, provenance: "acorn" });
      await persistEnterpriseEvent(tx, { tenantId: cid, entityId: cid, type: "CUSTOMER_CREATED", payload: { email, name }, actor: "acorn-live", authority: "none" });
    });
    return { status: 201, body: { customer: { id: cid, email, name }, token: t, expires_at: expires } };
  }
  async function login(b) {
    const email = String(b.email || "").trim().toLowerCase();
    const c = await database.get("SELECT * FROM customers WHERE email=$1", [email]);
    if (!c || !(await verifyPassword(String(b.password || ""), c.password_hash))) return { status: 401, body: { error: "INVALID_CREDENTIALS" } };
    const t = token();
    const expires = new Date(Date.now() + 2592000000).toISOString();
    await database.run("INSERT INTO sessions(token_hash,customer_id,expires_at,created_at) VALUES($1,$2,$3,$4)", [tokenHash(t), c.id, expires, now()]);
    return { status: 200, body: { customer: { id: c.id, email: c.email, name: c.name }, token: t, expires_at: expires } };
  }
  async function enterpriseData(cid) {
    const states = await loadTenantState(database, cid);
    const projects = states.filter((s) => s.entity === "PROJECT").map((s) => ({ id: s.id, stage: s.state, created_at: s.created_at, updated_at: s.updated_at }));
    const fromRequests = (await database.all("SELECT id,status,created_at,updated_at FROM requests WHERE customer_id=$1", [cid]))
      .filter((r) => !projects.some((p) => p.id === r.id))
      .map((r) => ({ id: r.id, stage: r.status, created_at: r.created_at, updated_at: r.updated_at }));
    return {
      projects: projects.concat(fromRequests),
      offers: states.filter((s) => s.entity === "OFFER"),
      ledger: {
        currency_default: "CAD",
        entries: states.filter((s) => s.entity === "MONEY_CLAIM"),
        balance: 0,
        reserved: 0,
        available: 0,
        billed: false,
        paid: false
      },
      connections: connections(),
      intelligences: intelligences(),
      assets: states.filter((s) => s.entity === "ASSET"),
      products: states.filter((s) => s.entity === "PRODUCT")
    };
  }

  const server = http.createServer(async (req, res) => {
    const started = Date.now();
    const requestId = String(req.headers["x-request-id"] || makeId("http"));
    let statusCode = 500;
    let errorClass = null;
    let tenantId = null;
    const send = (code, body) => {
      statusCode = code;
      return json(res, code, body, { "x-request-id": requestId });
    };
    try {
      if (rateLimited(req)) return send(429, { error: "RATE_LIMITED" });
      const u = new URL(req.url, "http://localhost");
      if (req.method === "GET" && u.pathname === "/") {
        const accept = String(req.headers.accept || "");
        if (/\btext\/html\b/.test(accept)) {
          statusCode = 200;
          res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "x-frame-options": "DENY", "x-request-id": requestId, "content-security-policy": "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'" });
          return res.end(APP_HTML);
        }
        const status = await runtimeStatus();
        return send(200, {
          service: "ACORN LIVE",
          status: status.status,
          live: false,
          verified: false,
          process: status.process,
          database: status.database,
          application: status.application,
          external: status.external,
          storage: database.mode,
          customer_entry: "/app",
          health: "/healthz",
          ready: "/readyz",
          proof: "measured_only",
          external_deployment_evidence: status.external_deployment_evidence,
          render_external_deployment: "NOT_MEASURED"
        });
      }
      if (req.method === "GET" && u.pathname === "/healthz") {
        try {
          await database.health();
          const status = await runtimeStatus();
          return send(200, { ok: true, status: status.status, live: false, verified: false, process: status.process, database: status.database, application: status.application, external: "NOT_OBSERVED", storage: database.mode, time: now() });
        } catch {
          return send(503, { ok: false, status: "DEGRADED", live: false, process: "PROCESS_RUNNING", database: "UNAVAILABLE", application: "DEGRADED", external: "NOT_OBSERVED", storage: database.mode });
        }
      }
      if (req.method === "GET" && u.pathname === "/readyz") {
        try {
          await database.health();
          return send(200, { ok: true, db: true, status: "READY", live: false, process: "PROCESS_RUNNING", database: "READY", application: "READY", external: "NOT_OBSERVED", storage: database.mode, time: now() });
        } catch {
          return send(503, { ok: false, db: false, status: "DEGRADED", live: false, process: "PROCESS_RUNNING", database: "UNAVAILABLE", application: "DEGRADED", external: "NOT_OBSERVED" });
        }
      }
      if (req.method === "GET" && u.pathname === "/app") {
        statusCode = 200;
        res.writeHead(200, {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-content-type-options": "nosniff",
          "referrer-policy": "no-referrer",
          "x-frame-options": "DENY",
          "x-request-id": requestId,
          "content-security-policy": "default-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"
        });
        return res.end(APP_HTML);
      }
      if (req.method === "POST" && u.pathname === "/api/v1/register") {
        const r = await register(await readBody(req));
        return send(r.status, r.body);
      }
      if (req.method === "POST" && u.pathname === "/api/v1/login") {
        const r = await login(await readBody(req));
        return send(r.status, r.body);
      }
      const session = await requireAuth(req);
      if (!session) return send(401, { error: "UNAUTHORIZED" });
      const cid = session.customer_id;
      tenantId = cid;
      const idem = String(req.headers["idempotency-key"] || "").trim().slice(0, 200);
      if (req.method === "POST" && idem) {
        const prev = await readIdempotency(cid, idem);
        if (prev) {
          statusCode = Number(prev.status);
          return json(res, statusCode, parseJson(prev.body, {}), { "x-request-id": requestId, "x-idempotent-replay": "true" });
        }
      }
      const sendPersist = async (code, body) => {
        try {
          if (req.method === "POST" && idem) await writeIdempotency(cid, idem, req.method, u.pathname, code, body);
        } catch {
          /* idempotency persistence must not fail a committed mutation */
        }
        return send(code, body);
      };
      if (req.method === "POST" && u.pathname === "/api/v1/logout") {
        await database.run("DELETE FROM sessions WHERE token_hash=$1 AND customer_id=$2", [session.token_hash, cid]);
        return send(200, { ok: true, revoked: true });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/me") {
        return send(200, { customer: await database.get("SELECT id,email,name,created_at FROM customers WHERE id=$1", [cid]) });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/enterprise") {
        return send(200, enterpriseSnapshot(await enterpriseData(cid)));
      }
      if (req.method === "GET" && u.pathname === "/api/v1/connections") {
        return send(200, { connections: connections().map((c) => ({ ...c, secret_custody: false, credentials_present: false, authority: false })), proof: { connected: false, live: false } });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/intelligences") {
        return send(200, { intelligences: intelligences().map((i) => ({ ...i, authority: false })), proof: { executed: false, live: false } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/connections/measure") {
        const b = await readBody(req);
        const c = createConnection(b);
        const m = measureConnection(c, { reachable: false, capabilities: Array.isArray(c.capabilities) ? c.capabilities : [] });
        await persistState(database, { entity: "CONNECTION", id: m.id, tenant_id: cid, state: "DISCOVERED", data: { provider: m.provider, kind: m.kind, capabilities: m.capabilities, secret_custody: false } });
        return send(200, { connection: { ...m, state: "DISCOVERED", credentials_present: false, secret_custody: false, authority: false }, proof: { measured_at: m.measured_at, live: false, external_effect: false, reachable_claimed_by_client: false } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/runtime/plan") {
        const b = await readBody(req);
        const requestId = String(b.request_id || "");
        if (requestId && !(await ownRequest(cid, requestId))) return send(404, { error: "NOT_FOUND" });
        const plan = buildRuntimePlan({ requestId, problem: String(b.problem || ""), requiredCapabilities: Array.isArray(b.required_capabilities) ? b.required_capabilities : [], intelligences: intelligences(), connectors: connections() });
        await persistState(database, { entity: "EXECUTION", id: plan.id, tenant_id: cid, state: "PLANNED", data: { request_id: requestId, human_authorized: false, external_effect: false } });
        return send(201, { plan, verification: verifyRuntimePlan(plan), proof: { measured_at: now(), external_effect: false, human_authorization_required: true, live: false } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/runtime/run") {
        const b = await readBody(req);
        let runRequestId = String(b.request_id || "");
        if (runRequestId) {
          if (!(await ownRequest(cid, runRequestId))) return send(404, { error: "NOT_FOUND" });
        } else {
          runRequestId = makeId("req");
        }
        const plan = buildRuntimePlan({ requestId: runRequestId, problem: String(b.problem || ""), requiredCapabilities: Array.isArray(b.required_capabilities) ? b.required_capabilities : [], intelligences: intelligences(), connectors: connections() });
        const run = createExecutionRun({ requestId: runRequestId, plan, authorized: false });
        await persistState(database, { entity: "EXECUTION", id: run.id, tenant_id: cid, state: run.state, data: { request_id: run.request_id, human_authorized: false, external_effect: false, client_authorization_ignored: true } });
        return send(201, { run, snapshot: executionLoopSnapshot(run), proof: { planning_measured: true, execution_performed: false, external_effect: false, live: false, human_authorization_required: true } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/connectors/execute") {
        const b = await readBody(req);
        const requestId = String(b.request_id || "");
        if (requestId && !(await ownRequest(cid, requestId))) return send(404, { error: "NOT_FOUND" });
        const connection = createConnection({ id: String(b.connection_id || "unspecified"), provider: String(b.provider || "none"), kind: String(b.kind || "capability") });
        const executor = createConnectorExecutor({ connection, execute: async () => ({ synthetic: true }) });
        const result = await executeConnector(executor, { task: parseJson(b.task, {}), authorized: false });
        await persistEnterpriseEvent(database, { tenantId: cid, entityId: connection.id, type: "CONNECTOR_EXECUTION", payload: { state: result.state, reason: result.reason || "HUMAN_AUTHORIZATION_REQUIRED", external_effect_claimed: false }, actor: "acorn-live", authority: "none" });
        return send(result.state === "BLOCKED" ? 403 : 200, { result, proof: { live: false, external_effect: false, human_authorization_required: true } });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/real-world") {
        const connectors = loadRealWorldConnectors(env.ACORN_REAL_WORLD_CONNECTORS);
        return send(200, {
          bridge: realWorldBridgeSnapshot(connectors),
          proof: { connected: false, live: false, secret_custody: false, executed: false },
          measured_at: now()
        });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/runtime/external") {
        const b = await readBody(req);
        const requestId = String(b.request_id || "");
        if (!requestId || !(await ownRequest(cid, requestId))) return send(404, { error: "NOT_FOUND" });
        const connectors = loadRealWorldConnectors(env.ACORN_REAL_WORLD_CONNECTORS);
        const connector = connectors.find((x) => x.id === String(b.connector_id || ""));
        if (!connector) return send(404, { error: "CONNECTOR_NOT_CONFIGURED" });
        const effect = String(connector.effect || "UNKNOWN").toUpperCase();
        const clientTriedAuthority = b.human_authorized === true || b.authorized === true || Boolean(b.authority);
        const locked = isConsequentialEffect(effect);
        const call = locked ? {
          id: makeId("ext"),
          state: "BLOCKED",
          reason: "HUMAN_AUTHORIZATION_REQUIRED",
          effect,
          external_effect: false,
          human_authorized: false,
          authority: false,
          client_authorization_ignored: true
        } : buildExternalCall({
          connector,
          path: String(b.path || ""),
          method: String(b.method || "GET"),
          body: null,
          source: "http",
          human_authorized: false,
          idempotency_key: typeof b.idempotency_key === "string" ? b.idempotency_key : null
        });
        const credential = (!locked && connector.credential_env) ? env[connector.credential_env] || process.env[connector.credential_env] || null : null;
        const result = locked ? call : await executeExternalCall(call, { credential });
        const publicResult = publicExternalResult(result);
        await persistEnterpriseEvent(database, {
          tenantId: cid,
          entityId: requestId,
          type: "REAL_WORLD_EXECUTION",
          payload: { execution_id: result.id, connector_id: connector.id, state: result.state, effect: connector.effect, external_effect: result.external_effect === true, reason: result.reason || null, client_authorization_ignored: true },
          actor: "acorn-live",
          authority: "none"
        });
        if (result.state === "SUCCEEDED") {
          await persistEvidence(database, {
            tenantId: cid,
            claim: "external_http_observed",
            source: "external_http",
            kind: "EXTERNAL_EXECUTION",
            epistemic: "OBSERVED",
            strength: 1,
            margin: 0.1,
            validUntil: new Date(Date.now() + 86400000).toISOString()
          }, requestId);
        }
        await persistState(database, {
          entity: "EXECUTION",
          id: result.id,
          tenant_id: cid,
          state: result.state,
          data: { request_id: requestId, connector_id: connector.id, effect: connector.effect, human_authorized: false, external_effect: result.external_effect === true, client_authorization_ignored: true, client_tried_authority: clientTriedAuthority }
        });
        return send(result.state === "SUCCEEDED" ? 200 : (result.state === "BLOCKED" ? 403 : 502), {
          result: publicResult,
          proof: {
            live: false,
            verified: false,
            secret_custody: false,
            human_authorization_required: true,
            client_authorization_ignored: true,
            http_cannot_grant_authority: true,
            untrusted_client_fields: ["base_url", "path", "method", "human_authorized", "authority", "authorized"],
            external_call_measured: result.state === "SUCCEEDED",
            external_effect: result.external_effect === true,
            measured_at: now()
          }
        });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/runtime") {
        const jobs = await database.all("SELECT state,COUNT(*) AS count FROM acorn_jobs WHERE tenant_id=$1 GROUP BY state", [cid]).catch(() => []);
        const evidence = await loadTenantEvidence(database, cid);
        const requests = await database.all("SELECT status,COUNT(*) AS count FROM requests WHERE customer_id=$1 GROUP BY status", [cid]);
        const status = await runtimeStatus();
        return send(200, {
          runtime: "ACORN LIVE",
          status: status.status,
          live: false,
          verified: false,
          storage: database.mode,
          requests,
          worker: { jobs },
          evidence,
          authority:{human_required:true,auto_contract:false,auto_payment:false,auto_spend:false,secret_custody:false,auto_merge:false},
          measured_at: now()
        });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/requests") {
        const rows = await database.all("SELECT * FROM requests WHERE customer_id=$1 ORDER BY created_at DESC", [cid]);
        return send(200, { requests: rows.map(publicRequest) });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/enterprise/execution") {
        return send(200, { fabric: "ACORN_EXECUTION_FABRIC", policy: "HUMAN_AUTHORIZATION_REQUIRED", synthetic: runSyntheticExecution({ projectId: "live-probe", authorized: false }), proof: { live: false, executed: false, external_effect: false, synthetic: true } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/enterprise/execution/plan") {
        const b = await readBody(req);
        const projectId = String(b.project_id || "");
        if (projectId && !(await ownRequest(cid, projectId))) return send(404, { error: "NOT_FOUND" });
        const tasks = (Array.isArray(b.tasks) ? b.tasks : []).map((t) => createTask({ ...t, projectId: t.projectId || projectId }));
        const plan = buildExecutionPlan({ projectId, tasks, authorized: false });
        await database.tx(async (tx) => {
          await persistState(tx, { entity: "EXECUTION", id: plan.id, tenant_id: cid, state: plan.state, data: { project_id: projectId, authorized: false, external_effect: false } });
          for (const task of plan.tasks || []) {
            await persistState(tx, { entity: "TASK", id: task.id, tenant_id: cid, state: task.state, data: { execution_id: plan.id, project_id: projectId, kind: task.kind, title: task.title } });
          }
        });
        return send(201, { execution: plan, snapshot: executionSnapshot(plan), proof: { live: false, external_effect: false, human_authorization_required: true } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/enterprise/cycle") {
        const b = await readBody(req);
        const cycle = createEnterpriseCycle({ ...b, customer: cid });
        return send(201, { cycle, proof: { live: false, reason: "cycle_is_a_plan_until_human_authorization_and_external_evidence" } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/requests") {
        const b = await readBody(req);
        const request = String(b.request || "").trim();
        if (!request) return send(400, { error: "REQUEST_REQUIRED" });
        const safeBody = { ...b };
        for (const k of ["password", "token", "authorization", "secret", "connectionString", "database_url", "DATABASE_URL"]) delete safeBody[k];
        const rid = makeId("req");
        const t = now();
        const operated = operateProblem({
          tenantId: cid,
          customerId: cid,
          problem: request,
          requestId: rid,
          intelligences: intelligences(),
          connectors: connections()
        });
        const cycle = operated.cycle;
        const persisted = await database.tx(async (tx) => {
          await tx.run(
            "INSERT INTO requests(id,customer_id,body,status,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6)",
            [rid, cid, encodeJson(tx.mode, { ...safeBody, request, customer_id: cid }), cycle.stage, t, t]
          );
          await tx.run("INSERT INTO events(request_id,type,payload,created_at) VALUES($1,$2,$3,$4)", [rid, "REQUEST_CREATED", encodeJson(tx.mode, { stage: cycle.stage, capabilities: operated.qualification.proposed_capabilities }), t]);
          await persistState(tx, {
            entity: "PROJECT",
            id: rid,
            tenant_id: cid,
            state: cycle.stage,
            data: { request_id: rid, customer_id: cid, stage: cycle.stage, delivered: false, payment: false, live: false, mode: "PLAN" }
          });
          for (const task of operated.execution.tasks || []) {
            await persistState(tx, { entity: "TASK", id: task.id, tenant_id: cid, state: task.state, data: { execution_id: operated.execution.id, project_id: rid, kind: task.kind, title: task.title } });
          }
          for (const cap of operated.capabilities) {
            await persistState(tx, { entity: "CAPABILITY", id: cap.id, tenant_id: cid, state: cap.state, data: { name: cap.name, exists: cap.exists, available: cap.available, authorized: false, executed: false, verified: false, request_id: rid } });
          }
          for (const route of operated.intelligence_routes) {
            await persistState(tx, { entity: "INTELLIGENCE", id: "route_" + rid + "_" + route.id, tenant_id: cid, state: "SELECTABLE", data: { ...route, request_id: rid, authority: false, authorized: false } });
          }
          await persistState(tx, { entity: "MONEY_CLAIM", id: operated.economic.id, tenant_id: cid, state: "ESTIMATED", data: { ...operated.economic, billed: false, paid: false, live: false } });
          await persistState(tx, { entity: "TEMPORAL", id: "tmp_" + rid, tenant_id: cid, state: "OBSERVED", data: operated.temporal[0] || { epistemic: "OBSERVED", request_id: rid } });
          await persistState(tx, { entity: "EXECUTION", id: operated.execution.id, tenant_id: cid, state: operated.execution.state, data: { request_id: rid, mode: "PLAN", human_authorized: false, external_effect: false } });
          await persistEnterpriseEvent(tx, { tenantId: cid, entityId: rid, type: "REQUEST_CREATED", payload: { stage: cycle.stage, mode: "PLAN" }, actor: "acorn-live", authority: "none" });
          const horizon = new Date(Date.now() + 86400000).toISOString();
          const evidence = await persistEvidence(tx, {
            tenantId: cid,
            claim: "request_persisted",
            source: "acorn-live",
            kind: "OBSERVATION",
            epistemic: "OBSERVED",
            strength: 1,
            margin: 0.1,
            validUntil: horizon
          }, rid);
          const row = await tx.get("SELECT * FROM requests WHERE id=$1 AND customer_id=$2", [rid, cid]);
          return { row, evidence };
        });
        return await sendPersist(201, {
          request: publicRequest(persisted.row),
          cycle: { stage: cycle.stage, live: false, delivered: false },
          qualification: operated.qualification,
          capabilities: operated.capabilities,
          intelligence_routes: operated.intelligence_routes,
          execution: { id: operated.execution.id, mode: "PLAN", state: operated.execution.state, tasks: operated.execution.tasks, snapshot: operated.execution.snapshot },
          economic: operated.economic,
          evidence: { id: persisted.evidence.id, claim: persisted.evidence.claim, status: persisted.evidence.status, source: persisted.evidence.source, measured_at: persisted.evidence.measured_at, valid_until: persisted.evidence.valid_until },
          proof: { live: false, verified: false, delivered: false, billed: false, paid: false, storage: database.mode, measured_at: t, human_authorization_required: true, capability_is_not_authority: true }
        });
      }
      const m = u.pathname.match(/^\/api\/v1\/requests\/([^/]+)$/);
      if (req.method === "GET" && m) {
        const row = await database.get("SELECT * FROM requests WHERE id=$1 AND customer_id=$2", [m[1], cid]);
        if (!row) return send(404, { error: "NOT_FOUND" });
        const events = await database.all("SELECT type,payload,created_at FROM events WHERE request_id=$1 ORDER BY id", [row.id]);
        const state = await database.get("SELECT * FROM acorn_state WHERE id=$1 AND tenant_id=$2", [row.id, cid]);
        const evidence = await database.all("SELECT * FROM acorn_evidence WHERE request_id=$1 AND tenant_id=$2", [row.id, cid]);
        const related = await loadTenantState(database, cid);
        return send(200, {
          request: publicRequest(row),
          project: state ? { id: state.id, entity: state.entity, state: state.state } : null,
          capabilities: related.filter((s) => s.entity === "CAPABILITY" && s.data?.request_id === row.id),
          intelligence_routes: related.filter((s) => s.entity === "INTELLIGENCE" && s.data?.request_id === row.id).map((s) => ({ ...s.data, authority: false })),
          execution: related.find((s) => s.entity === "EXECUTION" && s.data?.request_id === row.id) || null,
          tasks: related.filter((s) => s.entity === "TASK" && s.data?.project_id === row.id),
          economic: related.filter((s) => s.entity === "MONEY_CLAIM").map((s) => ({ ...s.data, billed: false, paid: false, live: false })),
          events: events.map((e) => ({ ...e, payload: parseJson(e.payload, {}) })),
          evidence: evidence.map((e) => ({ id: e.id, claim: e.claim, source: e.source || e.origin, status: e.status, measured_at: e.measured_at, valid_until: e.valid_until })),
          proof: { live: false, delivered: false, billed: false, verified: false }
        });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/intelligences/discover") {
        const b = await readBody(req);
        let discovered;
        try { discovered = discoverUnknownIntelligence(b); }
        catch { return send(400, { error: "INTELLIGENCE_PROVIDER_MODEL_REQUIRED" }); }
        await persistState(database, { entity: "INTELLIGENCE", id: discovered.id, tenant_id: cid, state: discovered.state, data: { ...discovered, authority: false, authorized: false } });
        return await sendPersist(201, { intelligence: { ...discovered, authority: false, authorized: false }, proof: { live: false, executed: false, authorized: false } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/runtime/simulate") {
        const b = await readBody(req);
        const requestId = String(b.request_id || "");
        if (requestId && !(await ownRequest(cid, requestId))) return send(404, { error: "NOT_FOUND" });
        const simulated = runExecutionMode("SIMULATION", { projectId: requestId || "sim", authorized: false });
        await persistState(database, { entity: "EXECUTION", id: makeId("sim"), tenant_id: cid, state: "SIMULATED", data: { request_id: requestId || null, mode: "SIMULATION", realm: "SIMULATION", contaminates_reality: false, human_authorized: false } });
        return await sendPersist(200, { simulation: simulated, proof: { live: false, external_effect: false, contaminates_reality: false, simulation_is_not_execution: true } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/runtime/dry-run") {
        const b = await readBody(req);
        const requestId = String(b.request_id || "");
        if (requestId && !(await ownRequest(cid, requestId))) return send(404, { error: "NOT_FOUND" });
        const dry = runExecutionMode("DRY_RUN", { projectId: requestId || "dry", authorized: false });
        return await sendPersist(200, { dry_run: dry, proof: { live: false, external_effect: false, contaminates_reality: false } });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/as-of") {
        const at = u.searchParams.get("at") || now();
        const snapshot = await loadTenantAsOf(database, cid, at);
        return send(200, { ...snapshot, proof: { live: false, as_of: snapshot.at } });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/capabilities") {
        const caps = (await loadTenantState(database, cid, "CAPABILITY")).map((s) => ({ id: s.id, name: s.data?.name, exists: s.data?.exists === true, available: s.data?.available === true, authorized: false, executed: false, verified: false, state: s.state }));
        return send(200, { capabilities: caps, proof: { live: false, authorized: false } });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/economy") {
        const claims = (await loadTenantState(database, cid, "MONEY_CLAIM")).map((s) => economicRecord({ ...s.data, tenant_id: cid, status: "ESTIMATED" }));
        return send(200, { records: claims, billed: false, paid: false, live: false, proof: { billed: false, paid: false, live: false } });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/organization") {
        const orgs = await loadTenantState(database, cid, "ORGANIZATION");
        return send(200, { organization: orgs[0] || { id: "org_" + cid, tenant_id: cid, state: "ACTIVE" }, proof: { live: false } });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/future-proof") {
        return send(200, { contract: futureProofContract(), live: false });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/resilience") {
        return send(200, { resilience: providerFailureDoesNotHalt({ failedId: "grok", intelligences: intelligences(), connectors: connections().map(configuredIsNotConnected), required: ["analysis"] }), proof: { live: false, grok_unavailable_is_not_acorn_unavailable: true } });
      }
      return send(404, { error: "NOT_FOUND" });
    } catch (e) {
      if (res.headersSent) {
        errorClass = e.code || "INTERNAL_ERROR";
        return;
      }
      const status = e.status || 500;
      errorClass = e.code || (status === 413 ? "BODY_TOO_LARGE" : (status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"));
      if (status >= 500) console.error("LIVE_INTERNAL_ERROR", errorClass, String(e?.message || e));
      return send(status, { error: status === 413 ? "BODY_TOO_LARGE" : (e.code || (status === 400 ? "BAD_REQUEST" : "INTERNAL_ERROR")) });
    } finally {
      logEvent({ request_id: requestId, tenant_id: tenantId, method: req.method, path: (req.url || "").split("?")[0], status: statusCode, duration_ms: Date.now() - started, error_class: errorClass });
    }
  });
  return { server, db: database };
}

export async function startLiveServer({ env = process.env, db } = {}) {
  const { server, db: database } = await createLiveServer({ env, db });
  const PORT = Number(env.PORT || 10000);
  const HOST = env.HOST || "0.0.0.0";
  await new Promise((resolve, reject) => {
    server.listen(PORT, HOST, () => resolve());
    server.on("error", reject);
  });
  const addr = server.address();
  return { server, db: database, port: addr.port, host: HOST };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  const { server, db, port, host } = await startLiveServer();
  console.log("ACORN LIVE listening on " + host + ":" + port);
  async function shutdown() {
    await new Promise((resolve) => server.close(() => resolve()));
    await db.close();
    process.exit(0);
  }
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
