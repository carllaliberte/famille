import pg from "pg";
import crypto from "node:crypto";
import { customerServiceCycle } from "../scripts/acorn-customer-service.mjs";

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_REQUIRED");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

const WORKER_ID = process.env.WORKER_ID || `acorn-worker-${crypto.randomUUID()}`;
const POLL_MS = Math.max(250, Number(process.env.WORKER_POLL_MS || 1000));
const LEASE_MS = Math.max(5000, Number(process.env.WORKER_LEASE_MS || 60000));
const now = () => new Date().toISOString();
const lease = () => new Date(Date.now() + LEASE_MS).toISOString();
let stopping = false;

async function migrate() {
  await pool.query(`CREATE TABLE IF NOT EXISTS acorn_jobs(
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    state TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    worker_id TEXT,
    lease_until TIMESTAMPTZ,
    result JSONB,
    error TEXT,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ
  )`);
  await pool.query(`ALTER TABLE acorn_jobs ADD COLUMN IF NOT EXISTS lease_until TIMESTAMPTZ`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_acorn_jobs_claim ON acorn_jobs(state,created_at)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_acorn_jobs_lease ON acorn_jobs(state,lease_until)`);
}

async function recoverStaleJobs() {
  const t = now();
  const result = await pool.query(
    `UPDATE acorn_jobs
     SET state=CASE WHEN attempts < max_attempts THEN 'QUEUED' ELSE 'FAILED' END,
         worker_id=NULL,
         lease_until=NULL,
         error=CASE WHEN attempts < max_attempts THEN error ELSE COALESCE(error,'LEASE_EXPIRED') END,
         updated_at=$1,
         finished_at=CASE WHEN attempts < max_attempts THEN NULL ELSE $1 END
     WHERE state='RUNNING' AND lease_until IS NOT NULL AND lease_until < $1
     RETURNING id,state,attempts`,
    [t],
  );
  if (result.rowCount) {
    console.log(JSON.stringify({
      service: "acorn-live-worker",
      event: "STALE_JOBS_RECOVERED",
      count: result.rowCount,
      worker_id: WORKER_ID,
      authority: false,
      external_effect: false,
    }));
  }
}

async function ingest() {
  await pool.query(`INSERT INTO acorn_jobs(
    id,tenant_id,kind,payload,state,attempts,max_attempts,created_at,updated_at
  )
  SELECT
    'job_'||r.id,r.customer_id,'CUSTOMER_REQUEST',
    jsonb_build_object('request_id',r.id),'QUEUED',0,3,r.created_at,r.updated_at
  FROM requests r
  LEFT JOIN acorn_jobs j ON j.id='job_'||r.id
  WHERE j.id IS NULL
  ON CONFLICT DO NOTHING`);
}

async function claim() {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const q = await c.query(
      `SELECT id
       FROM acorn_jobs
       WHERE state='QUEUED' AND attempts<max_attempts
       ORDER BY created_at
       FOR UPDATE SKIP LOCKED
       LIMIT 5`,
    );
    const jobs = [];
    for (const row of q.rows) {
      const r = await c.query(
        `UPDATE acorn_jobs
         SET state='RUNNING',worker_id=$1,attempts=attempts+1,lease_until=$2,updated_at=$3
         WHERE id=$4 AND state='QUEUED'
         RETURNING *`,
        [WORKER_ID, lease(), now(), row.id],
      );
      if (r.rows[0]) jobs.push(r.rows[0]);
    }
    await c.query("COMMIT");
    return jobs;
  } catch (error) {
    await c.query("ROLLBACK");
    throw error;
  } finally {
    c.release();
  }
}

async function heartbeat(jobId) {
  await pool.query(
    `UPDATE acorn_jobs SET lease_until=$1,updated_at=$2
     WHERE id=$3 AND state='RUNNING' AND worker_id=$4`,
    [lease(), now(), jobId, WORKER_ID],
  );
}

async function execute(job) {
  const requestId = job.payload?.request_id;
  const request = await pool.query(
    "SELECT * FROM requests WHERE id=$1 AND customer_id=$2",
    [requestId, job.tenant_id],
  );

  if (!request.rows[0]) {
    await pool.query(
      "UPDATE acorn_jobs SET state='FAILED',error=$1,lease_until=NULL,updated_at=$2,finished_at=$2 WHERE id=$3",
      ["REQUEST_NOT_FOUND", now(), job.id],
    );
    return;
  }

  try {
    await heartbeat(job.id);
    const body = request.rows[0].body || {};
    const cycle = customerServiceCycle({
      customer: { customer_id: job.tenant_id },
      request: String(body.request || ""),
      capabilities: ["general"],
      solution: "Acorn intake and qualification",
      deliverables: ["qualified request", "execution plan"],
      evidence_plan: ["worker execution evidence"],
      usage_rights: ["CUSTOMER_USE_PENDING_HUMAN_AUTHORIZATION"],
      tasks: ["qualify", "plan", "verify"],
      intelligence: ["acorn"],
      human_authorized: false,
    });
    const t = now();

    await pool.query(
      "UPDATE requests SET status=$1,updated_at=$2 WHERE id=$3 AND customer_id=$4",
      [cycle.stage, t, requestId, job.tenant_id],
    );

    const existing = await pool.query(
      "SELECT 1 FROM events WHERE request_id=$1 AND type='WORKER_EXECUTION_COMPLETED' AND payload->>'job_id'=$2 LIMIT 1",
      [requestId, job.id],
    );
    if (!existing.rows[0]) {
      await pool.query(
        "INSERT INTO events(request_id,type,payload,created_at) VALUES($1,$2,$3,$4)",
        [requestId, "WORKER_EXECUTION_COMPLETED", JSON.stringify({
          job_id: job.id,
          worker_id: WORKER_ID,
          stage: cycle.stage,
          human_authorized: false,
          authority: false,
          external_effect: false,
        }), t],
      );
    }

    await pool.query(
      `UPDATE acorn_jobs
       SET state='SUCCEEDED',result=$1,evidence=$2,lease_until=NULL,updated_at=$3,finished_at=$3
       WHERE id=$4 AND worker_id=$5`,
      [
        JSON.stringify({ stage: cycle.stage }),
        JSON.stringify([{ kind: "runtime", measured_at: t, worker_id: WORKER_ID }]),
        t,
        job.id,
        WORKER_ID,
      ],
    );
  } catch (error) {
    const t = now();
    const retry = job.attempts < job.max_attempts;
    await pool.query(
      `UPDATE acorn_jobs
       SET state=$1,error=$2,lease_until=NULL,updated_at=$3,finished_at=$4
       WHERE id=$5 AND worker_id=$6`,
      [retry ? "QUEUED" : "FAILED", String(error?.message || error), t, retry ? null : t, job.id, WORKER_ID],
    );
  }
}

async function shutdown() {
  if (stopping) return;
  stopping = true;
  try {
    await pool.query(
      `UPDATE acorn_jobs
       SET state='QUEUED',worker_id=NULL,lease_until=NULL,updated_at=$1
       WHERE state='RUNNING' AND worker_id=$2`,
      [now(), WORKER_ID],
    );
  } finally {
    await pool.end();
    process.exit(0);
  }
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

await migrate();
console.log(JSON.stringify({
  service: "acorn-live-worker",
  worker_id: WORKER_ID,
  status: "READY",
  authority: false,
  external_effect: false,
  lease_ms: LEASE_MS,
}));

while (!stopping) {
  try {
    await recoverStaleJobs();
    await ingest();
    for (const job of await claim()) {
      if (!stopping) await execute(job);
    }
  } catch (error) {
    console.error("WORKER_TICK_ERROR", error?.message || error);
  }
  await new Promise((resolve) => setTimeout(resolve, POLL_MS));
}
