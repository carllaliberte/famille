/** ACORN LIVE — worker job helpers.
 * Postgres-only execution helpers. The process entry still requires DATABASE_URL.
 * Capability is not authority. Crash recovery requeues stale RUNNING jobs.
 * Commercial ingest stays on MAIN tables (commercial_orders), not a second layer.
 */
export const STALE_RUNNING_MS = 120000;

export function jobRetryState({ attempts = 0, max_attempts = 3 } = {}) {
  return attempts < max_attempts ? "QUEUED" : "FAILED";
}

export async function reclaimStaleJobs(query, {
  nowIso = new Date().toISOString(),
  staleMs = STALE_RUNNING_MS
} = {}) {
  const cutoff = new Date(Date.parse(nowIso) - staleMs).toISOString();
  const result = await query(
    "UPDATE acorn_jobs SET state='QUEUED',worker_id=NULL,updated_at=$1 WHERE state='RUNNING' AND updated_at<$2 RETURNING id",
    [nowIso, cutoff]
  );
  return (result?.rows || []).map((row) => row.id);
}

export async function ingestPersistedRequests(query) {
  await query("INSERT INTO acorn_jobs(id,tenant_id,kind,payload,state,attempts,max_attempts,created_at,updated_at) SELECT 'job_'||r.id,r.customer_id,'CUSTOMER_REQUEST',jsonb_build_object('request_id',r.id),'QUEUED',0,3,r.created_at,r.updated_at FROM requests r LEFT JOIN acorn_jobs j ON j.id='job_'||r.id WHERE j.id IS NULL ON CONFLICT DO NOTHING");
  await query("INSERT INTO acorn_jobs(id,tenant_id,kind,payload,state,attempts,max_attempts,created_at,updated_at) SELECT 'job_order_'||o.id,o.tenant_id,'COMMERCIAL_ORDER',jsonb_build_object('order_id',o.id,'project_id',o.project_id,'live',false,'paid',false),'QUEUED',0,5,o.created_at,o.updated_at FROM commercial_orders o LEFT JOIN acorn_jobs j ON j.id='job_order_'||o.id WHERE j.id IS NULL ON CONFLICT DO NOTHING");
}
