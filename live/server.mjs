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
import { loadRealWorldConnectors, buildExternalCall, executeExternalCall, realWorldBridgeSnapshot, isConsequentialEffect, publicExternalResult } from "../scripts/acorn-real-world-bridge.mjs";
import { assessRuntimeStatus } from "./runtime-status.mjs";
import { persistState, persistEnterpriseEvent, persistEvidence, loadTenantState, loadTenantEvidence, loadIdempotentResult, persistIdempotentResult } from "./enterprise-store.mjs";
import {
  loadStripeConfig,
  publicStripeConfig,
  stripeWebhookSecret,
  verifyStripeSignature,
  rejectClientPrice,
  createCheckoutSession,
  createBillingPortalSession,
  enterpriseDocument,
  usageBasedExtension,
} from "../scripts/acorn-stripe-adapter.mjs";
import {
  publicCatalog,
  serverPriceTable,
  qualifyCommercialDemand,
  createProject,
  createVersionedOffer,
  createOrder,
  becomeCustomer,
  createDemand,
} from "../scripts/acorn-commercial-runtime.mjs";
import { persistOffer, persistOrder, applyVerifiedStripeEvent, persistStripeEvent, loadTenantCommerce } from "./commerce-store.mjs";
import { authorizeCustomerOrder } from "../scripts/acorn-customer-service.mjs";
import {
  composeProblem,
  fabricSnapshot,
  ignoreClientAuthority,
  publicContract,
} from "../scripts/acorn-universal-infrastructure.mjs";

const APP_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ACORN LIVE</title><style>body{font-family:system-ui;margin:0;background:#0d0d0d;color:#f4ead7}main{max-width:760px;margin:auto;padding:32px}section{background:#171717;padding:22px;border-radius:16px;margin:16px 0}input,textarea,button{width:100%;box-sizing:border-box;margin:7px 0;padding:12px;border-radius:9px;border:1px solid #555;background:#111;color:#fff}button{cursor:pointer;background:#c9a86a;color:#111;font-weight:700}pre{white-space:pre-wrap}p.note{opacity:.8;font-size:.95rem}.row{display:flex;gap:8px}small{opacity:.7}</style></head><body><main><h1>ACORN</h1><p class="note">Customer entry. HTTP availability is not LIVE proof. Plans are not delivery. Payment and contracts are not claimed.</p><section id="auth"><h2>Start</h2><input id="name" placeholder="Name"><input id="email" placeholder="Email"><input id="password" type="password" placeholder="Password (10+ characters)"><button onclick="register()">Create account</button><button onclick="login()">Sign in</button><pre id="authout"></pre></section><section id="work" style="display:none"><div class="row"><button onclick="logout()">Sign out</button></div><h2>New request</h2><textarea id="request" rows="6" placeholder="Describe the problem you want Acorn to solve…"></textarea><button onclick="submitRequest()">Send to Acorn</button><button onclick="loadRequests()">Refresh</button><p class="note">Status values come from persisted state: received, awaiting human authorization, planned, blocked. Delivered/verified/LIVE only appear with evidence.</p><pre id="out"></pre></section><script>
let T=localStorage.acornToken||"";
const out=x=>document.getElementById("out").textContent=JSON.stringify(x,null,2);
function label(status){
  if(status==="HOLD_HUMAN_AUTHORIZATION") return "received / awaiting human authorization";
  if(status==="HOLD_HUMAN") return "received / human hold";
  if(status==="INTAKE"||status==="QUALIFY") return "received";
  if(status==="PLANNED"||status==="READY") return "planned";
  if(status==="BLOCKED") return "blocked";
  return status||"received";
}
async function call(path,method="GET",body){
  const r=await fetch(path,{method,headers:{"content-type":"application/json",...(T?{authorization:"Bearer "+T}:{})},body:body?JSON.stringify(body):undefined});
  const j=await r.json();
  if(!r.ok) throw j;
  return j;
}
async function register(){
  try{
    const j=await call("/api/v1/register","POST",{name:name.value,email:email.value,password:password.value});
    T=j.token; localStorage.acornToken=T; auth.style.display="none"; work.style.display="block"; loadRequests();
  }catch(e){authout.textContent=JSON.stringify(e,null,2)}
}
async function login(){
  try{
    const j=await call("/api/v1/login","POST",{email:email.value,password:password.value});
    T=j.token; localStorage.acornToken=T; auth.style.display="none"; work.style.display="block"; loadRequests();
  }catch(e){authout.textContent=JSON.stringify(e,null,2)}
}
async function logout(){
  try{ await call("/api/v1/logout","POST"); }catch(e){}
  T=""; localStorage.removeItem("acornToken"); auth.style.display="block"; work.style.display="none";
}
async function submitRequest(){
  try{
    const j=await call("/api/v1/requests","POST",{request:document.getElementById("request").value});
    out({...j, display_status:label(j.request&&j.request.status), live:false, delivered:false});
  }catch(e){out(e)}
}
async function loadRequests(){
  try{
    const j=await call("/api/v1/requests");
    out({...j, requests:(j.requests||[]).map(r=>({id:r.id,status:r.status,display_status:label(r.status),created_at:r.created_at,request:r.request})), live:false});
  }catch(e){out(e)}
}
if(T){auth.style.display="none";work.style.display="block";loadRequests()}
</script></main></body></html>`;

function logEvent(entry) {
  const row = {
    request_id: entry.request_id,
    method: entry.method,
    path: entry.path,
    status: entry.status,
    duration_ms: entry.duration_ms,
    error_class: entry.error_class || null
  };
  console.log(JSON.stringify(row));
}

export async function createLiveServer({ env = process.env, db, stripeFetch } = {}) {
  const database = db || await createLiveDatabase({ env });
  const MAX_BODY = Number(env.MAX_BODY_BYTES || process.env.MAX_BODY_BYTES || 262144);
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
  const readRawBody = async (req) => {
    let n = 0;
    const chunks = [];
    for await (const c of req) {
      n += c.length;
      if (n > MAX_BODY) throw Object.assign(new Error("BODY_TOO_LARGE"), { status: 413, code: "BODY_TOO_LARGE" });
      chunks.push(c);
    }
    return Buffer.concat(chunks);
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
      ledger: { currency_default: "CAD", entries: (await loadTenantCommerce(database, cid)).ledger, balance: null, reserved: null, available: null, invented: false },
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
    const send = (code, body) => {
      statusCode = code;
      return json(res, code, body, { "x-request-id": requestId });
    };
    try {
      const u = new URL(req.url, "http://localhost");
      if (req.method === "GET" && u.pathname === "/") {
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
        res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "x-frame-options": "DENY", "x-request-id": requestId });
        return res.end(APP_HTML);
      }
      if (req.method === "GET" && u.pathname === "/api/v1/commerce/catalog") {
        return send(200, {
          catalog: publicCatalog(env),
          price_source: "SERVER_CATALOG",
          client_price_accepted: false,
          stripe: publicStripeConfig(loadStripeConfig(env)),
          checkout_is_not_payment: true,
          live: false
        });
      }
      if (req.method === "POST" && u.pathname === "/webhooks/stripe") {
        const raw = await readRawBody(req);
        const text = raw.toString("utf8");
        const config = loadStripeConfig(env);
        let event = null;
        try { event = text ? JSON.parse(text) : null; }
        catch { return send(400, { error: "INVALID_JSON", webhook_is_not_receipt: true, live: false }); }
        if (!event || !event.id) return send(400, { error: "EVENT_ID_MISSING", webhook_is_not_receipt: true, live: false });
        const secret = stripeWebhookSecret(config, { live: config.mode === "live" });
        const signature = verifyStripeSignature({
          payload: text,
          header: req.headers["stripe-signature"],
          secret
        });
        if (event.livemode === true && config.mode !== "live") {
          await persistStripeEvent(database, { event, signature: { verified: false, reason: "LIVE_STRIPE_EVENT_HOLD" }, tenantId: event.data?.object?.metadata?.tenant_id || null });
          return send(202, { ok: false, state: "HOLD_HUMAN", reason: "LIVE_STRIPE_EVENT_HOLD", webhook_is_not_receipt: true, live: false });
        }
        const result = await applyVerifiedStripeEvent(database, { event, signature });
        const status = signature.verified ? 200 : 400;
        return send(status, {
          ok: result.accepted === true,
          duplicate: result.duplicate === true,
          replay_protected: result.replay_protected === true || result.duplicate === true,
          payment_state: result.payment_state || null,
          checkout_is_not_payment: true,
          webhook_is_not_receipt: true,
          reason: result.reason || null,
          live: false
        });
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
      if (req.method === "POST" && u.pathname === "/api/v1/logout") {
        await database.run("DELETE FROM sessions WHERE token_hash=$1 AND customer_id=$2", [session.token_hash, cid]);
        return send(200, { ok: true, revoked: true });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/me") {
        return send(200, { customer: await database.get("SELECT id,email,name,created_at FROM customers WHERE id=$1", [cid]) });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/enterprise") {
        const data = await enterpriseData(cid);
        return send(200, { ...enterpriseSnapshot(data), commerce: await loadTenantCommerce(database, cid), live: false });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/connections") {
        return send(200, { connections: connections().map((c) => ({ ...c, secret_custody: false, credentials_present: false, authority: false })), proof: { connected: false, live: false } });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/intelligences") {
        return send(200, { intelligences: intelligences().map((i) => ({ ...i, authority: false })), proof: { executed: false, live: false } });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/capabilities") {
        return send(200, {
          contract: publicContract(),
          snapshot: fabricSnapshot({ env }),
          proof: { live: false, verified: false, executed: false, authority: false },
        });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/compose") {
        const raw = await readBody(req);
        const b = ignoreClientAuthority(raw).sanitized;
        const plan = composeProblem({
          problem: String(b.problem || ""),
          required: Array.isArray(b.required_capabilities) ? b.required_capabilities : [],
          policy: "FREE_FIRST",
          human_authorization: false,
          mode: b.mode === "SIMULATION" || b.mode === "DRY_RUN" || b.mode === "PLAN" ? b.mode : "PLAN",
        });
        return send(200, {
          plan,
          proof: {
            live: false,
            executed: false,
            verified: false,
            client_authorization_ignored: true,
            human_authorization_required: true,
          },
        });
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
        const idempotencyKey = b.idempotency_key ? String(b.idempotency_key) : null;
        if (idempotencyKey) {
          const cached = await loadIdempotentResult(database, { tenantId: cid, connectorId: connector.id, idempotencyKey });
          if (cached) {
            return send(cached.state === "SUCCEEDED" ? 200 : (cached.state === "BLOCKED" ? 403 : 502), {
              result: publicExternalResult(cached),
              proof: {
                live: false,
                verified: false,
                secret_custody: false,
                human_authorization_required: true,
                client_authorization_ignored: true,
                idempotent_replay: true,
                external_call_measured: cached.state === "SUCCEEDED",
                external_effect: cached.external_effect === true,
                measured_at: now()
              }
            });
          }
        }
        const call = buildExternalCall({
          connector,
          path: String(b.path || ""),
          method: String(b.method || "GET"),
          body: b.body ?? null,
          source: "http",
          idempotency_key: idempotencyKey
        });
        if (isConsequentialEffect(connector.effect) && call.state === "AUTHORIZED") {
          call.state = "BLOCKED";
          call.reason = "HUMAN_AUTHORIZATION_REQUIRED";
        }
        const credential = connector.credential_env ? env[connector.credential_env] || process.env[connector.credential_env] || null : null;
        const result = await executeExternalCall(call, { credential });
        const publicResult = publicExternalResult(result);
        if (idempotencyKey) {
          await persistIdempotentResult(database, {
            tenantId: cid,
            connectorId: connector.id,
            idempotencyKey,
            requestHash: `${connector.id}:${String(b.method || "GET")}:${String(b.path || "")}`,
            result: publicResult
          });
        }
        await persistEnterpriseEvent(database, {
          tenantId: cid,
          entityId: requestId,
          type: "REAL_WORLD_EXECUTION",
          payload: { execution_id: result.id, connector_id: connector.id, state: result.state, effect: connector.effect, external_effect: result.external_effect === true, reason: result.reason || null },
          actor: "acorn-live",
          authority: "none"
        });
        if (result.state === "SUCCEEDED") {
          await persistEvidence(database, {
            tenantId: cid,
            claim: "external_http_observed",
            source: "external_http",
            kind: "OBSERVATION",
            strength: 1,
            margin: 0.1,
            validUntil: result.evidence?.valid_until || `${new Date().toISOString().slice(0, 10)}T23:59:59.000Z`
          }, requestId);
        }
        await persistState(database, {
          entity: "EXECUTION",
          id: result.id,
          tenant_id: cid,
          state: result.state,
          data: { request_id: requestId, connector_id: connector.id, effect: connector.effect, human_authorized: false, external_effect: result.external_effect === true, client_authorization_ignored: true }
        });
        return send(result.state === "SUCCEEDED" ? 200 : (result.state === "BLOCKED" ? 403 : 502), {
          result: publicResult,
          proof: {
            live: false,
            secret_custody: false,
            human_authorization_required: true,
            client_authorization_ignored: true,
            external_call_measured: result.state === "SUCCEEDED",
            external_effect: result.external_effect === true,
            verified: false,
            live: false,
            measured_at: now()
          }
        });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/commerce/journey") {
        const commerce = await loadTenantCommerce(database, cid);
        const customer = await database.get("SELECT id,email,name FROM customers WHERE id=$1", [cid]);
        return send(200, {
          customer: { customer_id: cid, email: customer?.email || null, name: customer?.name || null },
          ...commerce,
          stripe: publicStripeConfig(loadStripeConfig(env)),
          checkout_is_not_payment: true,
          live: false
        });
      }
      if (req.method === "GET" && u.pathname === "/api/v1/commerce/ledger") {
        const commerce = await loadTenantCommerce(database, cid);
        return send(200, {
          entries: commerce.ledger,
          invented: false,
          reconciliation: "OBSERVED_ONLY",
          live: false
        });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/commerce/offers") {
        const b = await readBody(req);
        const rejected = rejectClientPrice(b);
        if (!rejected.ok) return send(400, { error: "CLIENT_PRICE_REJECTED", attempted: rejected.attempted, live: false });
        const prices = serverPriceTable(env);
        const catalogId = String(b.catalog_id || "custom");
        const priced = prices[catalogId];
        if (!priced || priced.unit_amount == null) return send(409, { error: "SERVER_PRICE_MISSING", hold_human: true, live: false });
        const customer = becomeCustomer({ prospect_id: cid }, { customer_id: cid, tenant_id: cid });
        const demand = createDemand({ customer, problem: String(b.problem || b.request || "commercial demand"), audience: "BUSINESS", evidence: [{ verified: true }] });
        const qualification = qualifyCommercialDemand({ demand, capabilities: ["general"] });
        const project = createProject({ customer, demand, qualification });
        const offer = createVersionedOffer({
          catalog_id: catalogId,
          customer,
          project,
          qualification,
          currency: priced.currency,
          unit_amount: priced.unit_amount,
          interval: b.interval || null
        });
        if (!offer.ok) return send(409, { error: "OFFER_NOT_READY", offer, live: false });
        await persistOffer(database, offer);
        return send(201, { offer: { ...offer, kernel: undefined }, price_source: "SERVER_CATALOG", client_price_accepted: false, live: false });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/commerce/checkout") {
        const b = await readBody(req);
        const rejected = rejectClientPrice(b);
        if (!rejected.ok) return send(400, { error: "CLIENT_PRICE_REJECTED", attempted: rejected.attempted, live: false });
        const prices = serverPriceTable(env);
        const catalogId = String(b.catalog_id || "custom");
        const priced = prices[catalogId];
        if (!priced || priced.unit_amount == null) return send(409, { error: "SERVER_PRICE_MISSING", hold_human: true, live: false });
        const config = loadStripeConfig(env);
        if (b.live === true || b.livemode === true) {
          return send(409, { error: "LIVE_STRIPE_HOLD", state: "HOLD_HUMAN", live: false });
        }
        const customerRow = await database.get("SELECT id,email,name FROM customers WHERE id=$1", [cid]);
        const customer = becomeCustomer({ prospect_id: cid }, { customer_id: cid, tenant_id: cid, contact: customerRow?.email, name: customerRow?.name });
        const demand = createDemand({ customer, problem: String(b.problem || "checkout"), audience: "BUSINESS", evidence: [{ verified: true }] });
        const qualification = qualifyCommercialDemand({ demand, capabilities: ["general"] });
        const project = createProject({ customer, demand, qualification });
        const offer = createVersionedOffer({
          catalog_id: catalogId,
          customer,
          project,
          qualification,
          currency: priced.currency,
          unit_amount: priced.unit_amount,
          interval: b.mode === "subscription" ? (b.interval || "month") : null
        });
        const authorization = authorizeCustomerOrder({
          offer: offer.kernel,
          authorized: true,
          authorized_by: "server-catalog"
        });
        const order = createOrder({ offer, authorization, customer });
        await persistOffer(database, offer);
        await persistOrder(database, order);
        const checkout = await createCheckoutSession({
          config,
          offer,
          order,
          customer: { ...customer, email: customerRow?.email },
          checkoutMode: b.mode === "subscription" ? "subscription" : "payment",
          liveMode: false,
          client: {},
          fetchImpl: stripeFetch || globalThis.fetch
        });
        if (checkout.ok && checkout.session_id) {
          await persistState(database, {
            entity: "MONEY_CLAIM",
            id: order.order_id,
            tenant_id: cid,
            state: checkout.state,
            data: { session_id: checkout.session_id, checkout_is_not_payment: true, live: false }
          });
        }
        return send(checkout.ok ? 201 : (checkout.state === "HOLD_HUMAN" ? 409 : 503), {
          order: { order_id: order.order_id, offer_id: offer.offer_id, payment_state: checkout.state || "UNPAID" },
          checkout,
          checkout_is_not_payment: true,
          live: false
        });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/commerce/portal") {
        const b = await readBody(req);
        if (b.live === true) return send(409, { error: "LIVE_STRIPE_HOLD", state: "HOLD_HUMAN", live: false });
        const portal = await createBillingPortalSession({
          config: loadStripeConfig(env),
          stripeCustomerId: b.stripe_customer_id,
          liveMode: false,
          fetchImpl: stripeFetch || globalThis.fetch
        });
        return send(portal.ok ? 201 : (portal.state === "HOLD_HUMAN" ? 409 : 503), { portal, live: false });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/commerce/invoice") {
        const b = await readBody(req);
        const rejected = rejectClientPrice(b);
        if (!rejected.ok) return send(400, { error: "CLIENT_PRICE_REJECTED", attempted: rejected.attempted, live: false });
        return send(200, {
          document: enterpriseDocument({ kind: b.kind || "invoice", customer: { customer_id: cid } }),
          hold_human: true,
          live_document_created: false,
          live: false
        });
      }
      if (req.method === "POST" && u.pathname === "/api/v1/commerce/usage") {
        const b = await readBody(req);
        return send(200, { usage: usageBasedExtension({ offer: { offer_id: b.offer_id }, units: b.units }), live: false });
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
        const persisted = await database.tx(async (tx) => {
          await tx.run(
            "INSERT INTO requests(id,customer_id,body,status,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6)",
            [rid, cid, encodeJson(tx.mode, { ...safeBody, request, customer_id: cid }), cycle.stage, t, t]
          );
          await tx.run("INSERT INTO events(request_id,type,payload,created_at) VALUES($1,$2,$3,$4)", [rid, "REQUEST_CREATED", encodeJson(tx.mode, { stage: cycle.stage }), t]);
          await persistState(tx, {
            entity: "PROJECT",
            id: rid,
            tenant_id: cid,
            state: cycle.stage,
            data: { request_id: rid, customer_id: cid, stage: cycle.stage, delivered: false, payment: false, live: false }
          });
          await persistEnterpriseEvent(tx, { tenantId: cid, entityId: rid, type: "REQUEST_CREATED", payload: { stage: cycle.stage }, actor: "acorn-live", authority: "none" });
          const horizon = new Date(Date.now() + 86400000).toISOString();
          const evidence = await persistEvidence(tx, {
            tenantId: cid,
            claim: "request_persisted",
            source: "acorn-live",
            kind: "OBSERVATION",
            strength: 1,
            margin: 0.1,
            validUntil: horizon
          }, rid);
          const row = await tx.get("SELECT * FROM requests WHERE id=$1 AND customer_id=$2", [rid, cid]);
          return { row, evidence };
        });
        return send(201, {
          request: publicRequest(persisted.row),
          cycle: { stage: cycle.stage, live: false, delivered: false },
          evidence: { id: persisted.evidence.id, claim: persisted.evidence.claim, status: persisted.evidence.status, source: persisted.evidence.source, measured_at: persisted.evidence.measured_at, valid_until: persisted.evidence.valid_until },
          proof: { live: false, verified: false, delivered: false, storage: database.mode, measured_at: t, human_authorization_required: true }
        });
      }
      const m = u.pathname.match(/^\/api\/v1\/requests\/([^/]+)$/);
      if (req.method === "GET" && m) {
        const row = await database.get("SELECT * FROM requests WHERE id=$1 AND customer_id=$2", [m[1], cid]);
        if (!row) return send(404, { error: "NOT_FOUND" });
        const events = await database.all("SELECT type,payload,created_at FROM events WHERE request_id=$1 ORDER BY id", [row.id]);
        const state = await database.get("SELECT * FROM acorn_state WHERE id=$1 AND tenant_id=$2", [row.id, cid]);
        const evidence = await database.all("SELECT * FROM acorn_evidence WHERE request_id=$1 AND tenant_id=$2", [row.id, cid]);
        return send(200, {
          request: publicRequest(row),
          project: state ? { id: state.id, entity: state.entity, state: state.state } : null,
          events: events.map((e) => ({ ...e, payload: parseJson(e.payload, {}) })),
          evidence: evidence.map((e) => ({ id: e.id, claim: e.claim, source: e.source || e.origin, status: e.status, measured_at: e.measured_at, valid_until: e.valid_until })),
          proof: { live: false, delivered: false }
        });
      }
      return send(404, { error: "NOT_FOUND" });
    } catch (e) {
      const status = e.status || 500;
      errorClass = e.code || (status === 413 ? "BODY_TOO_LARGE" : (status >= 500 ? "INTERNAL_ERROR" : "BAD_REQUEST"));
      if (status >= 500) console.error("LIVE_INTERNAL_ERROR");
      return send(status, { error: status === 413 ? "BODY_TOO_LARGE" : (e.code || (status === 400 ? "BAD_REQUEST" : "INTERNAL_ERROR")) });
    } finally {
      logEvent({ request_id: requestId, method: req.method, path: (req.url || "").split("?")[0], status: statusCode, duration_ms: Date.now() - started, error_class: errorClass });
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
