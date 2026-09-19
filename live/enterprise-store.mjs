/** ACORN LIVE — persist existing enterprise state into the live database.
 * Connects the durable enterprise model to the customer/request runtime.
 * Does not invent a second state model.
 */
import {
  stateRecord,
  eventRecord,
  evidenceRecord,
  assertTenantAccess
} from "../scripts/acorn-enterprise-state.mjs";
import { registerEvidence, evidenceIsCurrent } from "../scripts/acorn-evidence-registry.mjs";
import { encodeJson, parseJson } from "./database.mjs";

function rowState(row) {
  if (!row) return null;
  const data = parseJson(row.data, {});
  return {
    id: row.id,
    entity: row.entity,
    version: Number(row.version || 1),
    state: row.state,
    tenant_id: row.tenant_id,
    provenance: row.provenance,
    data,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function rowEvidence(row) {
  if (!row) return null;
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    request_id: row.request_id || null,
    claim: row.claim || row.kind,
    source: row.source || row.origin,
    kind: row.kind,
    strength: Number(row.strength || row.confidence || 0),
    margin: Number(row.margin || 0),
    valid_until: row.valid_until || null,
    status: row.status,
    measured_at: row.measured_at,
    payload: parseJson(row.payload, {})
  };
}

export async function persistState(db, input) {
  const record = stateRecord(input.entity, {
    id: input.id,
    tenant_id: input.tenant_id,
    state: input.state,
    version: input.version,
    provenance: input.provenance,
    created_at: input.created_at,
    ...(input.data && typeof input.data === "object" ? input.data : {})
  });
  if (!record.created_at) record.created_at = new Date().toISOString();
  if (!record.updated_at) record.updated_at = record.created_at;
  if (!record.provenance) record.provenance = "acorn";
  if (!record.version) record.version = 1;
  await db.run(
    "INSERT INTO acorn_state(id,entity,version,state,tenant_id,provenance,data,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(id) DO UPDATE SET version=$3,state=$4,data=$7,updated_at=$9",
    [
      record.id,
      record.entity,
      record.version,
      record.state,
      record.tenant_id,
      record.provenance,
      encodeJson(db.mode, record.data || {}),
      record.created_at,
      record.updated_at
    ]
  );
  return record;
}

export async function persistEnterpriseEvent(db, input) {
  const record = eventRecord(input);
  await db.run(
    "INSERT INTO acorn_events(id,tenant_id,entity_id,type,payload,actor,authority,measured_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      record.id,
      record.tenant_id,
      record.entity_id,
      record.type,
      encodeJson(db.mode, record.payload || {}),
      record.actor,
      record.authority,
      record.measured_at
    ]
  );
  return record;
}

export async function persistEvidence(db, input, requestId = null) {
  const record = input.status ? input : registerEvidence(input);
  await db.run(
    "INSERT INTO acorn_evidence(id,tenant_id,request_id,claim,source,kind,status,origin,measured_at,valid_until,strength,margin,confidence,payload) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT(id) DO NOTHING",
    [
      record.id,
      record.tenant_id,
      requestId,
      record.claim,
      record.source,
      record.kind,
      record.status,
      record.source,
      record.measured_at,
      record.valid_until,
      Number(record.strength || 0),
      Number(record.margin || 0),
      Number(record.strength || 0),
      encodeJson(db.mode, record.payload || {})
    ]
  );
  return record;
}

export async function loadTenantState(db, tenantId, entity = null) {
  const rows = entity
    ? await db.all("SELECT * FROM acorn_state WHERE tenant_id=$1 AND entity=$2", [tenantId, entity])
    : await db.all("SELECT * FROM acorn_state WHERE tenant_id=$1", [tenantId]);
  return rows.map(rowState);
}

export async function loadTenantEvidence(db, tenantId) {
  const rows = await db.all(
    "SELECT * FROM acorn_evidence WHERE tenant_id=$1 ORDER BY measured_at DESC LIMIT 100",
    [tenantId]
  );
  return rows.map(rowEvidence);
}

export async function getTenantState(db, id, tenantId) {
  const row = await db.get("SELECT * FROM acorn_state WHERE id=$1 AND tenant_id=$2", [id, tenantId]);
  if (!row) return null;
  const record = rowState(row);
  assertTenantAccess(record, tenantId);
  return record;
}

export async function loadTenantAsOf(db, tenantId, at) {
  const ts = new Date(at).toISOString();
  const [events, evidence, state] = await Promise.all([
    db.all("SELECT * FROM acorn_events WHERE tenant_id=$1 AND measured_at<=$2 ORDER BY measured_at", [tenantId, ts]),
    db.all("SELECT * FROM acorn_evidence WHERE tenant_id=$1 AND measured_at<=$2 ORDER BY measured_at", [tenantId, ts]),
    db.all("SELECT * FROM acorn_state WHERE tenant_id=$1 AND created_at<=$2", [tenantId, ts])
  ]);
  return {
    at: ts,
    tenant_id: tenantId,
    events: events.map((e) => ({ ...e, payload: parseJson(e.payload, {}) })),
    evidence: evidence.map((row) => {
      const rec = rowEvidence(row);
      const expired = rec.valid_until && Date.parse(rec.valid_until) < Date.parse(ts);
      return { ...rec, epistemic: expired ? "EXPIRED" : (rec.payload?.epistemic || rec.status), expired: Boolean(expired), false_because_expired: false };
    }),
    state: state.map(rowState),
    live: false,
    proof: "as_of_is_historical_not_truth"
  };
}

export async function loadIdempotentResult(db, { tenantId, connectorId, idempotencyKey } = {}) {
  if (!tenantId || !connectorId || !idempotencyKey) return null;
  const row = await db.get(
    "SELECT result FROM acorn_idempotency WHERE tenant_id=$1 AND connector_id=$2 AND idempotency_key=$3",
    [tenantId, connectorId, idempotencyKey]
  );
  return row ? parseJson(row.result, null) : null;
}

export async function persistIdempotentResult(db, { tenantId, connectorId, idempotencyKey, requestHash, result } = {}) {
  if (!tenantId || !connectorId || !idempotencyKey) return null;
  const id = `idem_${tenantId}_${connectorId}_${idempotencyKey}`.slice(0, 180);
  await db.run(
    "INSERT INTO acorn_idempotency(id,tenant_id,connector_id,idempotency_key,request_hash,result,created_at) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(tenant_id,connector_id,idempotency_key) DO NOTHING",
    [id, tenantId, connectorId, idempotencyKey, requestHash || "", encodeJson(db.mode, result || {}), new Date().toISOString()]
  );
  return loadIdempotentResult(db, { tenantId, connectorId, idempotencyKey });
}

export { evidenceRecord, evidenceIsCurrent, registerEvidence, assertTenantAccess };
