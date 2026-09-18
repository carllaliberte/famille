import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import pg from "pg";
const {Pool}=pg;
const schema=`CREATE TABLE IF NOT EXISTS customers(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password_hash TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,expires_at TIMESTAMPTZ NOT NULL,created_at TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,body JSONB NOT NULL,status TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL,updated_at TIMESTAMPTZ NOT NULL);
CREATE TABLE IF NOT EXISTS events(id BIGSERIAL PRIMARY KEY,request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,type TEXT NOT NULL,payload JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL);
CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions(customer_id);CREATE INDEX IF NOT EXISTS idx_requests_customer ON requests(customer_id);CREATE INDEX IF NOT EXISTS idx_events_request ON events(request_id);
CREATE TABLE IF NOT EXISTS acorn_evidence(id TEXT PRIMARY KEY,request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,kind TEXT NOT NULL,status TEXT NOT NULL,origin TEXT NOT NULL,measured_at TIMESTAMPTZ NOT NULL,valid_until TIMESTAMPTZ,confidence DOUBLE PRECISION NOT NULL DEFAULT 0,margin DOUBLE PRECISION NOT NULL DEFAULT 0,payload JSONB NOT NULL DEFAULT '{}'::jsonb);
CREATE INDEX IF NOT EXISTS idx_evidence_request ON acorn_evidence(request_id,measured_at);`;
const sqliteSchema=`PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS customers(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password_hash TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,customer_id TEXT NOT NULL,expires_at TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,customer_id TEXT NOT NULL,body TEXT NOT NULL,status TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT,request_id TEXT NOT NULL,type TEXT NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS acorn_evidence(id TEXT PRIMARY KEY,request_id TEXT NOT NULL,kind TEXT NOT NULL,status TEXT NOT NULL,origin TEXT NOT NULL,measured_at TEXT NOT NULL,valid_until TEXT,confidence REAL NOT NULL DEFAULT 0,margin REAL NOT NULL DEFAULT 0,payload TEXT NOT NULL);`;
const adapt=(sql,params)=>({sql:sql.replace(/\$(\d+)/g,"?"),params});
export async function createLiveDatabase(){
 if(process.env.DATABASE_URL){
  const pool=new Pool({connectionString:process.env.DATABASE_URL,max:Number(process.env.DB_POOL_MAX||5),connectionTimeoutMillis:5000,idleTimeoutMillis:30000});
  await pool.query(schema);
  return {mode:"postgres",async health(){await pool.query("SELECT 1");return true},async close(){await pool.end()},async get(sql,p=[]){const r=await pool.query(sql,p);return r.rows[0]||null},async all(sql,p=[]){const r=await pool.query(sql,p);return r.rows},async run(sql,p=[]){return pool.query(sql,p)}};
 }
 const path=resolve(process.env.ACORN_DB||"./live/acorn-live.db");mkdirSync(dirname(path),{recursive:true});const db=new DatabaseSync(path);db.exec(sqliteSchema);
 return {mode:"sqlite",async health(){db.prepare("SELECT 1").get();return true},async close(){db.close()},async get(sql,p=[]){const q=adapt(sql,p);return db.prepare(q.sql).get(...q.params)},async all(sql,p=[]){const q=adapt(sql,p);return db.prepare(q.sql).all(...q.params)},async run(sql,p=[]){const q=adapt(sql,p);return db.prepare(q.sql).run(...q.params)}};
}
export const now=()=>new Date().toISOString();
export const makeId=p=>p+"_"+crypto.randomUUID();
