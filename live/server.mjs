#!/usr/bin/env node
import http from "node:http";
import crypto from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { customerServiceCycle } from "../scripts/acorn-customer-service.mjs";

const PORT = Number(process.env.PORT || 10000);
const HOST = process.env.HOST || "0.0.0.0";
const DB_PATH = resolve(process.env.ACORN_DB || "./live/acorn-live.db");
mkdirSync(dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS customers(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password_hash TEXT NOT NULL,created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,expires_at TEXT NOT NULL,created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,body TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT,request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,type TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL); CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions(customer_id); CREATE INDEX IF NOT EXISTS idx_requests_customer ON requests(customer_id); CREATE INDEX IF NOT EXISTS idx_events_request ON events(request_id);");

const now=()=>new Date().toISOString();
const json=(res,status,body)=>{const data=JSON.stringify(body);res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","referrer-policy":"no-referrer","content-length":Buffer.byteLength(data)});res.end(data)};
const readBody=async req=>{const chunks=[];for await(const c of req)chunks.push(c);if(!chunks.length)return{};return JSON.parse(Buffer.concat(chunks).toString("utf8"))};
const hashPassword=(password,salt=crypto.randomBytes(16))=>new Promise((ok,bad)=>crypto.scrypt(password,salt,64,(e,k)=>e?bad(e):ok(salt.toString("hex")+":"+k.toString("hex"))));
const verifyPassword=(password,stored)=>new Promise((ok,bad)=>{const [s,h]=String(stored).split(":");if(!s||!h)return ok(false);crypto.scrypt(password,Buffer.from(s,"hex"),64,(e,k)=>{if(e)return bad(e);const a=Buffer.from(h,"hex"),b=Buffer.from(k);ok(a.length===b.length&&crypto.timingSafeEqual(a,b))})});
const token=()=>crypto.randomBytes(32).toString("base64url");
const tokenHash=t=>crypto.createHash("sha256").update(t).digest("hex");
const id=prefix=>prefix+"_"+crypto.randomUUID();
const requireAuth=req=>{const h=req.headers.authorization||"";if(!h.startsWith("Bearer "))return null;const t=h.slice(7),row=db.prepare("SELECT customer_id,expires_at FROM sessions WHERE token_hash=?").get(tokenHash(t));if(!row||Date.parse(row.expires_at)<=Date.now())return null;return row.customer_id};
const event=(requestId,type,payload)=>db.prepare("INSERT INTO events(request_id,type,payload,created_at) VALUES(?,?,?,?)").run(requestId,type,JSON.stringify(payload),now());
const publicRequest=row=>row?{id:row.id,status:row.status,created_at:row.created_at,updated_at:row.updated_at,...JSON.parse(row.body)}:null;

async function register(body){
 const email=String(body.email||"").trim().toLowerCase(),name=String(body.name||"").trim(),password=String(body.password||"");
 if(!email.includes("@")||!name||password.length<10)return{status:400,body:{error:"VALIDATION",message:"name, valid email and password >= 10 characters are required"}};
 if(db.prepare("SELECT id FROM customers WHERE email=?").get(email))return{status:409,body:{error:"ACCOUNT_EXISTS"}};
 const customerId=id("cus"),passwordHash=await hashPassword(password),created=now();
 db.prepare("INSERT INTO customers(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?)").run(customerId,email,name,passwordHash,created);
 const t=token(),expires=new Date(Date.now()+2592000000).toISOString();
 db.prepare("INSERT INTO sessions(token_hash,customer_id,expires_at,created_at) VALUES(?,?,?,?)").run(tokenHash(t),customerId,expires,created);
 return{status:201,body:{customer:{id:customerId,email,name},token:t,expires_at:expires}};
}
async function login(body){
 const email=String(body.email||"").trim().toLowerCase(),password=String(body.password||""),c=db.prepare("SELECT * FROM customers WHERE email=?").get(email);
 if(!c||!(await verifyPassword(password,c.password_hash)))return{status:401,body:{error:"INVALID_CREDENTIALS"}};
 const t=token(),expires=new Date(Date.now()+2592000000).toISOString();
 db.prepare("INSERT INTO sessions(token_hash,customer_id,expires_at,created_at) VALUES(?,?,?,?)").run(tokenHash(t),c.id,expires,now());
 return{status:200,body:{customer:{id:c.id,email:c.email,name:c.name},token:t,expires_at:expires}};
}

const APP_HTML=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ACORN LIVE</title><style>body{font-family:system-ui;margin:0;background:#0d0d0d;color:#f4ead7}main{max-width:760px;margin:auto;padding:32px}h1{letter-spacing:.08em}section{background:#171717;padding:22px;border-radius:16px;margin:16px 0}input,textarea,button{width:100%;box-sizing:border-box;margin:7px 0;padding:12px;border-radius:9px;border:1px solid #555;background:#111;color:#fff}button{cursor:pointer;background:#c9a86a;color:#111;font-weight:700}pre{white-space:pre-wrap}.muted{color:#aaa}</style></head><body><main><h1>ACORN LIVE</h1><p class="muted">Collective cognition infrastructure — customer self-service entry.</p><section id="auth"><h2>Start</h2><input id="name" placeholder="Name"><input id="email" placeholder="Email"><input id="password" type="password" placeholder="Password (10+ characters)"><button onclick="register()">Create account</button><button onclick="login()">Sign in</button><pre id="authout"></pre></section><section id="work" style="display:none"><h2>New request</h2><textarea id="request" rows="6" placeholder="Describe the problem you want Acorn to solve…"></textarea><button onclick="submitRequest()">Send to Acorn</button><button onclick="loadRequests()">Refresh</button><pre id="out"></pre></section><script>let T=localStorage.acornToken||"";const out=x=>document.getElementById("out").textContent=JSON.stringify(x,null,2);async function call(path,method="GET",body){const r=await fetch(path,{method,headers:{"content-type":"application/json",...(T?{authorization:"Bearer "+T}:{})},body:body?JSON.stringify(body):undefined});const j=await r.json();if(!r.ok)throw j;return j}async function register(){try{const j=await call("/api/v1/register","POST",{name:name.value,email:email.value,password:password.value});T=j.token;localStorage.acornToken=T;auth.style.display="none";work.style.display="block";loadRequests()}catch(e){authout.textContent=JSON.stringify(e,null,2)}}async function login(){try{const j=await call("/api/v1/login","POST",{email:email.value,password:password.value});T=j.token;localStorage.acornToken=T;auth.style.display="none";work.style.display="block";loadRequests()}catch(e){authout.textContent=JSON.stringify(e,null,2)}}async function submitRequest(){try{out(await call("/api/v1/requests","POST",{request:document.getElementById("request").value}))}catch(e){out(e)}}async function loadRequests(){try{out(await call("/api/v1/requests"))}catch(e){out(e)}}if(T){auth.style.display="none";work.style.display="block";loadRequests()}</script></main></body></html>`;

const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,"http://"+(req.headers.host||"localhost"));
  if(req.method==="GET"&&url.pathname==="/")return json(res,200,{service:"ACORN LIVE",version:"acorn.live.v1",status:"LIVE",customer_entry:"/app",health:"/healthz",api:"/api/v1",sovereignty:"human_authority_preserved",proof:"measured_only"});
  if(req.method==="GET"&&url.pathname==="/healthz")return json(res,200,{ok:true,status:"LIVE",service:"acorn-live",time:now()});
  if(req.method==="GET"&&url.pathname==="/readyz")return json(res,200,{ok:true,db:true,api:true,time:now()});
  if(req.method==="GET"&&url.pathname==="/app"){res.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store"});return res.end(APP_HTML)}
  if(req.method==="POST"&&url.pathname==="/api/v1/register"){const r=await register(await readBody(req));return json(res,r.status,r.body)}
  if(req.method==="POST"&&url.pathname==="/api/v1/login"){const r=await login(await readBody(req));return json(res,r.status,r.body)}
  const customerId=requireAuth(req);if(!customerId)return json(res,401,{error:"UNAUTHORIZED"});
  if(req.method==="GET"&&url.pathname==="/api/v1/me"){return json(res,200,{customer:db.prepare("SELECT id,email,name,created_at FROM customers WHERE id=?").get(customerId)})}
  if(req.method==="POST"&&url.pathname==="/api/v1/requests"){
   const body=await readBody(req),request=String(body.request||"").trim();if(!request)return json(res,400,{error:"REQUEST_REQUIRED"});
   const rid=id("req"),t=now();
   const cycle=customerServiceCycle({customer:{customer_id:customerId},request,capabilities:["general"],solution:"Acorn intake and qualification",deliverables:["qualified request","execution plan"],evidence_plan:["runtime evidence","automated tests"],usage_rights:["CUSTOMER_USE_PENDING_HUMAN_AUTHORIZATION"],tasks:["qualify","plan","verify"],intelligence:["acorn"],human_authorized:false});
   const stored={...body,request,customer_id:customerId};
   db.prepare("INSERT INTO requests(id,customer_id,body,status,created_at,updated_at) VALUES(?,?,?,?,?,?)").run(rid,customerId,JSON.stringify(stored),cycle.stage,t,t);
   event(rid,"REQUEST_CREATED",{stage:cycle.stage});
   return json(res,201,{request:publicRequest(db.prepare("SELECT * FROM requests WHERE id=?").get(rid)),proof:{live:true,measured_at:t}});
  }
  const m=url.pathname.match(/^\/api\/v1\/requests\/([^/]+)$/);
  if(req.method==="GET"&&m){const row=db.prepare("SELECT * FROM requests WHERE id=? AND customer_id=?").get(m[1],customerId);if(!row)return json(res,404,{error:"NOT_FOUND"});const events=db.prepare("SELECT type,payload,created_at FROM events WHERE request_id=? ORDER BY id").all(row.id).map(e=>({...e,payload:JSON.parse(e.payload)}));return json(res,200,{request:publicRequest(row),events})}
  if(req.method==="GET"&&url.pathname==="/api/v1/requests"){const rows=db.prepare("SELECT * FROM requests WHERE customer_id=? ORDER BY created_at DESC").all(customerId);return json(res,200,{requests:rows.map(publicRequest)})}
  return json(res,404,{error:"NOT_FOUND"});
 }catch(e){console.error(e);return json(res,500,{error:"INTERNAL_ERROR"})}
});
server.listen(PORT,HOST,()=>console.log("ACORN LIVE listening on "+HOST+":"+PORT));
