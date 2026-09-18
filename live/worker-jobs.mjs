/** ACORN LIVE — worker job helpers.
 * Postgres-only execution helpers. The process entry still requires DATABASE_URL.
 * Capability is not authority. Crash recovery requeues stale RUNNING jobs.
 */
export const STALE_RUNNING_MS = 5 * 60 * 1000;

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
}
