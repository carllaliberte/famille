#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { customerServiceCycle } from "../scripts/acorn-customer-service.mjs";
import { createConnection, createIntelligenceAdapter, createEnterpriseCycle, enterpriseSnapshot, measureConnection } from "../scripts/acorn-real-world-enterprise-os.mjs";
import { createTask, buildExecutionPlan, executionSnapshot, runSyntheticExecution } from "../scripts/acorn-execution-fabric.mjs";
import { createLiveDatabase, now, makeId, parseJson, encodeJson } from "./database.mjs";
import { buildRuntimePlan, verifyRuntimePlan } from "../scripts/acorn-runtime-orchestrator.mjs";
import { createExecutionRun, executionLoopSnapshot } from "../scripts/acorn-execution-evidence-loop.mjs";
import { createConnectorExecutor, executeConnector } from "../scripts/acorn-connector-execution-fabric.mjs";
import { assessRuntimeStatus } from "./runtime-status.mjs";
import { persistState, persistEnterpriseEvent, persistEvidence, loadTenantState, loadTenantEvidence } from "./enterprise-store.mjs";

const MAX_BODY = Number(process.env.MAX_BODY_BYTES || 262144);
const json = (res, status, body) => {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "x-frame-options": "DENY",
    "content-length": Buffer.byteLength(data)
  });
  res.end(data);
};
const readBody = async (req) => {
  let n = 0;
  const chunks = [];
  for await (const c of req) {
    n += c.length;
    if (n > MAX_BODY) throw Object.assign(new Error("BODY_TOO_LARGE"), { status: 413 });
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

const APP_HTML = "<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>ACORN LIVE</title><style>body{font-family:system-ui;margin:0;background:#0d0d0d;color:#f4ead7}main{max-width:760px;margin:auto;padding:32px}section{background:#171717;padding:22px;border-radius:16px;margin:16px 0}input,textarea,button{width:100%;box-sizing:border-box;margin:7px 0;padding:12px;border-radius:9px;border:1px solid #555;background:#111;color:#fff}button{cursor:pointer;background:#c9a86a;color:#111;font-weight:700}pre{white-space:pre-wrap}</style></head><body><main><h1>ACORN LIVE</h1><section id='auth'><h2>Start</h2><input id='name' placeholder='Name'><input id='email' placeholder='Email'><input id='password' type='password' placeholder='Password (10+ characters)'><button onclick='register()'>Create account</button><button onclick='login()'>Sign in</button><pre id='authout'></pre></section><section id='work' style='display:none'><h2>New request</h2><textarea id='request' rows='6' placeholder='Describe the problem you want Acorn to solve…'></textarea><button onclick='submitRequest()'>Send to Acorn</button><button onclick='loadRequests()'>Refresh</button><pre id='out'></pre></section><script>let T=localStorage.acornToken||'';const out=x=>document.getElementById('out').textContent=JSON.stringify(x,null,2);async function call(path,method='GET',body){const r=await fetch(path,{method,headers:{'content-type':'application/json',...(T?{authorization:'Bearer '+T}:{})},body:body?JSON.stringify(body):undefined});const j=await r.json();if(!r.ok)throw j;return j}async function register(){try{const j=await call('/api/v1/register','POST',{name:name.value,email:email.value,password:password.value});T=j.token;localStorage.acornToken=T;auth.style.display='none';work.style.display='block';loadRequests()}catch(e){authout.textContent=JSON.stringify(e,null,2)}}async function login(){try{const j=await call('/api/v1/login','POST',{email:email.value,password:password.value});T=j.token;localStorage.acornToken=T;auth.style.display='none';work.style.display='block';loadRequests()}catch(e){authout.textContent=JSON.stringify(e,null,2)}}async function submitRequest(){try{out(await call('/api/v1/requests','POST',{request:document.getElementById('request').value}))}catch(e){out(e)}}async function loadRequests(){try{out(await call('/api/v1/requests'))}catch(e){out(e)}}if(T){auth.style.display='none';work.style.display='block';loadRequests()}</script></main></body></html>";

export async function createLiveServer({ env = process.env, db } = {}) {
  const database = db || await createLiveDatabase({ env });
  const requireAuth = async (req) => {
    const h = req.headers.authorization || "";
    if (!h.startsWith("Bearer ")) return null;
    const row = await database.get("SELECT customer_id,expires_at FROM sessions WHERE token_hash=$1", [tokenHash(h.slice(7))]);
    return row && Date.parse(row.expires_at) > Date.now() ? row.customer_id : null;
  };
  const event = async (id, type, payload) => database.run(
    "INSERT INTO events(request_id,type,payload,created_at) VALUES($1,$2,$3,$4)",
    [id, type, encodeJson(database.mode, payload), now()]
  );
  const publicRequest = (r) => r ? { id: r.id, status: r.status, created_at: r.created_at, updated_at: r.updated_at, ...parseJson(r.body, {}) } : null;
  const connections = () => {
    try { return parseJson(env.ACORN_CONNECTIONS || "[]", []).map(createConnection); }
    catch { return []; }
  };
  const intelligences = () => {
    try { return parseJson(env.ACORN_INTELLIGENCES || "[]", []).map(createIntelligenceAdapter); }
    catch { return []; }
  };
  const runtimeStatus = async () => {
    let dbHealthy = false;
    try { dbHealthy = await database.health(); } catch { dbHealthy = false; }
    const evidence = [];
    return assessRuntimeStatus({ processBound: true, dbHealthy, evidence });
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
    await database.run("INSERT INTO customers(id,email,name,password_hash,created_at) VALUES($1,$2,$3,$4,$5)", [cid, email, name, ph, created]);
    await database.run("INSERT INTO sessions(token_hash,customer_id,expires_at,created_at) VALUES($1,$2,$3,$4)", [tokenHash(t), cid, expires, created]);
    await persistState(database, stateCustomer(cid, email, name, created));
    await persistEnterpriseEvent(database, { tenantId: cid, entityId: cid, type: "CUSTOMER_CREATED", payload: { email, name }, actor: "acorn-live", authority: "none" });
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
      ledger: { currency_default: "CAD", entries: [], balance: 0, reserved: 0, available: 0 },
      connections: connections(),
      intelligences: intelligences(),
      assets: states.filter((s) => s.entity === "ASSET"),
      products: states.filter((s) => s.entity === "PRODUCT")
    };
  }

  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, "http://localhost");
      if (req.method === "GET" && u.pathname === "/") {
        const status = await runtimeStatus();
        return json(res, 200, { service: "ACORN LIVE", status: status.status, live: false, verified: false, storage: database.mode, customer_entry: "/app", health: "/healthz", ready: "/readyz", proof: "measured_only", external_deployment_evidence: status.external_deployment_evidence });
      }
      if (req.method === "GET" && u.pathname === "/healthz") {
        try {
          await database.health();
          const status = await runtimeStatus();
          return json(res, 200, { ok: true, status: status.status, live: false, verified: false, storage: database.mode, time: now() });
        } catch {
          return json(res, 503, { ok: false, status: "DEGRADED", live: false, storage: database.mode });
        }
      }
      if (req.method === "GET" && u.pathname === "/readyz") {
        try {
          await database.health();
          return json(res, 200, { ok: true, db: true, status: "READY", live: false, storage: database.mode, time: now() });
        } catch {
          return json(res, 503, { ok: false, db: false, status: "CODE_PRESENT", live: false });
        }
      }
      if (req.method === "GET" && u.pathname === "/app") {
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "x-frame-options": "DENY" });
        return res.end(APP_HTML);
      }
      if (req.method === "POST" && u.pathname === "/api/v1/register") {
        const r = await register(await readBody(req));
        return json(res, r.status, r.body);
      }
      if (req.method === "POST" && u.pathname === "/api/v1/login") {
        const r = await login(await readBody(req));
        return json(res, r.status, r.body);
      }
      const cid = await requireAuth(req);
      if (!cid) return json(res, 401, { error: "UNAUTHORIZED" });
      if (req.method === "GET" && u.pathname === "/api/v1/me") {
        return json(res, 200, { customer: await database.get("SELECT id,email,name,created_at FROM customers WHERE id=$1", [cid]) });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/enterprise") {
        return json(res, 200, enterpriseSnapshot(await enterpriseData(cid)));
      }
      if (req.method === "GET" && u.pathname === "/api/v1/connections") {
        return json(res, 200, { connections: connections().map((c) => ({ ...c, secret_custody: false, credentials_present: false })) });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/intelligences") {
        return json(res, 200, { intelligences: intelligences().map((i) => ({ ...i, authority: false })) });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/connections/measure") {
        const b = await readBody(req);
        const c = createConnection(b);
        const m = measureConnection(c, { reachable: Boolean(b.reachable), capabilities: Array.isArray(b.capabilities) ? b.capabilities : [] });
        return json(res, 200, { connection: { ...m, credentials_present: false, secret_custody: false }, proof: { measured_at: m.measured_at, live: false, external_effect: false } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/runtime/plan") {
        const b = await readBody(req);
        const plan = buildRuntimePlan({ requestId: String(b.request_id || ""), problem: String(b.problem || ""), requiredCapabilities: Array.isArray(b.required_capabilities) ? b.required_capabilities : [], intelligences: intelligences(), connectors: connections() });
        return json(res, 201, { plan, verification: verifyRuntimePlan(plan), proof: { measured_at: now(), external_effect: false, human_authorization_required: true, live: false } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/runtime/run") {
        const b = await readBody(req);
        const plan = buildRuntimePlan({ requestId: String(b.request_id || ""), problem: String(b.problem || ""), requiredCapabilities: Array.isArray(b.required_capabilities) ? b.required_capabilities : [], intelligences: intelligences(), connectors: connections() });
        const run = createExecutionRun({ requestId: String(b.request_id || ""), plan, authorized: false });
        await persistState(database, { entity: "EXECUTION", id: run.id, tenant_id: cid, state: run.state, data: { request_id: run.request_id, human_authorized: false, external_effect: false, client_authorization_ignored: true } });
        return json(res, 201, { run, snapshot: executionLoopSnapshot(run), proof: { planning_measured: true, execution_performed: false, external_effect: false, live: false, human_authorization_required: true } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/connectors/execute") {
        const b = await readBody(req);
        const connection = createConnection({ id: String(b.connection_id || "unspecified"), provider: String(b.provider || "none"), kind: String(b.kind || "capability") });
        const executor = createConnectorExecutor({ connection, execute: async () => ({ synthetic: true }) });
        const result = await executeConnector(executor, { task: parseJson(b.task, {}), authorized: false });
        await persistEnterpriseEvent(database, { tenantId: cid, entityId: connection.id, type: "CONNECTOR_EXECUTION", payload: { state: result.state, external_effect_claimed: false }, actor: "acorn-live", authority: "none" });
        return json(res, result.state === "BLOCKED" ? 403 : 200, { result, proof: { live: false, external_effect: false, human_authorization_required: true } });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/runtime") {
        const jobs = await database.all("SELECT state,COUNT(*) AS count FROM acorn_jobs WHERE tenant_id=$1 GROUP BY state", [cid]).catch(() => []);
        const evidence = await loadTenantEvidence(database, cid);
        const requests = await database.all("SELECT status,COUNT(*) AS count FROM requests WHERE customer_id=$1 GROUP BY status", [cid]);
        const status = await runtimeStatus();
        return json(res, 200, {
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
        return json(res, 200, { requests: rows.map(publicRequest) });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/enterprise/execution") {
        return json(res, 200, { fabric: "ACORN_EXECUTION_FABRIC", policy: "HUMAN_AUTHORIZATION_REQUIRED", synthetic: runSyntheticExecution({ projectId: "live-probe", authorized: false }), proof: { live: false, executed: false, external_effect: false } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/enterprise/execution/plan") {
        const b = await readBody(req);
        const tasks = (Array.isArray(b.tasks) ? b.tasks : []).map((t) => createTask({ ...t, projectId: t.projectId || b.project_id }));
        const plan = buildExecutionPlan({ projectId: b.project_id, tasks, authorized: false });
        return json(res, 201, { execution: plan, snapshot: executionSnapshot(plan), proof: { live: false, external_effect: false, human_authorization_required: true } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/enterprise/cycle") {
        const b = await readBody(req);
        const cycle = createEnterpriseCycle({ ...b, customer: cid });
        return json(res, 201, { cycle, proof: { live: false, reason: "cycle_is_a_plan_until_human_authorization_and_external_evidence" } });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/requests") {
        const b = await readBody(req);
        const request = String(b.request || "").trim();
        if (!request) return json(res, 400, { error: "REQUEST_REQUIRED" });
        const safeBody = { ...b };
        for (const k of ["password", "token", "authorization", "secret", "connectionString", "database_url", "DATABASE_URL"]) delete safeBody[k];
        const rid = makeId("req");
        const t = now();
        const cycle = customerServiceCycle({
          customer: { customer_id: cid },
          request,
          capabilities: ["general"],
          solution: "Acorn intake and qualification",
          deliverables: ["qualified request", "execution plan"],
          evidence_plan: ["runtime evidence", "automated tests"],
          usage_rights: ["CUSTOMER_USE_PENDING_HUMAN_AUTHORIZATION"],
          tasks: ["qualify", "plan", "verify"],
          intelligence: ["acorn"],
          human_authorized: false
        });
        await database.run(
          "INSERT INTO requests(id,customer_id,body,status,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6)",
          [rid, cid, encodeJson(database.mode, { ...safeBody, request, customer_id: cid }), cycle.stage, t, t]
        );
        await event(rid, "REQUEST_CREATED", { stage: cycle.stage });
        await persistState(database, {
          entity: "PROJECT",
          id: rid,
          tenant_id: cid,
          state: cycle.stage,
          data: { request_id: rid, customer_id: cid, stage: cycle.stage, delivered: false, payment: false, live: false }
        });
        await persistEnterpriseEvent(database, { tenantId: cid, entityId: rid, type: "REQUEST_CREATED", payload: { stage: cycle.stage }, actor: "acorn-live", authority: "none" });
        const horizon = new Date(Date.now() + 86400000).toISOString();
        const evidence = await persistEvidence(database, {
          tenantId: cid,
          claim: "request_persisted",
          source: "acorn-live",
          kind: "OBSERVATION",
          strength: 1,
          margin: 0.1,
          validUntil: horizon
        }, rid);
        const row = await database.get("SELECT * FROM requests WHERE id=$1 AND customer_id=$2", [rid, cid]);
        return json(res, 201, {
          request: publicRequest(row),
          cycle: { stage: cycle.stage, live: false, delivered: false },
          evidence: { id: evidence.id, claim: evidence.claim, status: evidence.status, source: evidence.source, measured_at: evidence.measured_at, valid_until: evidence.valid_until },
          proof: { live: false, verified: false, delivered: false, storage: database.mode, measured_at: t, human_authorization_required: true }
        });
      }
      const m = u.pathname.match(/^\/api\/v1\/requests\/([^/]+)$/);
      if (req.method === "GET" && m) {
        const row = await database.get("SELECT * FROM requests WHERE id=$1 AND customer_id=$2", [m[1], cid]);
        if (!row) return json(res, 404, { error: "NOT_FOUND" });
        const events = await database.all("SELECT type,payload,created_at FROM events WHERE request_id=$1 ORDER BY id", [row.id]);
        const state = await database.get("SELECT * FROM acorn_state WHERE id=$1 AND tenant_id=$2", [row.id, cid]);
        const evidence = (await database.all("SELECT * FROM acorn_evidence WHERE request_id=$1 AND tenant_id=$2", [row.id, cid]));
        return json(res, 200, {
          request: publicRequest(row),
          project: state ? { id: state.id, entity: state.entity, state: state.state } : null,
          events: events.map((e) => ({ ...e, payload: parseJson(e.payload, {}) })),
          evidence: evidence.map((e) => ({ id: e.id, claim: e.claim, source: e.source || e.origin, status: e.status, measured_at: e.measured_at, valid_until: e.valid_until })),
          proof: { live: false, delivered: false }
        });
      }
      return json(res, 404, { error: "NOT_FOUND" });
    } catch (e) {
      const status = e.status || 500;
      if (status >= 500) console.error("LIVE_INTERNAL_ERROR");
      return json(res, status, { error: status === 413 ? "BODY_TOO_LARGE" : (e.code || (status === 400 ? "BAD_REQUEST" : "INTERNAL_ERROR")) });
    }
  });
  return { server, db: database };
}

function stateCustomer(cid, email, name, created) {
  return { entity: "CUSTOMER", id: cid, tenant_id: cid, state: "ACTIVE", data: { email, name }, created_at: created, updated_at: created, version: 1, provenance: "acorn" };
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
    server.close();
    await db.close();
    process.exit(0);
  }
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
