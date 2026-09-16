import assert from "node:assert/strict";
import test from "node:test";
import {
  admissionDecision,
  buildEconomicLedger,
  dedupeUsage,
  economicSnapshot,
  escalation,
  meterExecution,
  observeConnection,
  prepareBillingCandidate,
  priceAccount,
} from "../scripts/economic-core.mjs";

test("known authenticated authorized connection is admitted", () => {
  const connection = observeConnection({ actor: "gemini", channel: "native", authenticated: true, authorized: true });
  assert.equal(connection.ok, true);
  assert.equal(connection.event.known_identity, true);
  assert.equal(admissionDecision(connection).decision, "ADMIT");
});

test("unknown connection is quarantined and not alerted as routine human work", () => {
  const connection = observeConnection({ actor: "unknown-agent", channel: "external", authenticated: true, authorized: false });
  const decision = admissionDecision(connection);
  assert.equal(decision.decision, "QUARANTINE");
  assert.equal(decision.human_alert, false);
  assert.equal(escalation({ reason: "UNKNOWN_IDENTITY" }).notify_carl, true);
});

test("unauthenticated known identity cannot be admitted", () => {
  const connection = observeConnection({ actor: "gemini", authenticated: false, authorized: false });
  assert.equal(admissionDecision(connection).decision, "AUTH_REQUIRED");
});

test("verified execution is metered and duplicate execution ids collapse", () => {
  const a = meterExecution({ actor: "gemini", execution_id: "run-1", executed: true, verified: true, work_units: 2 });
  const b = meterExecution({ actor: "gemini", execution_id: "run-1", executed: true, verified: true, work_units: 2 });
  const c = meterExecution({ actor: "gemini", execution_id: "run-2", executed: true, verified: true, work_units: 3 });
  const rows = dedupeUsage([a, b, c]);
  assert.equal(rows.length, 2);
  assert.equal(rows[1].event.units.work_units, 3);
});

test("usage without verification never enters the economic ledger", () => {
  const failed = meterExecution({ actor: "gemini", execution_id: "bad", executed: true, verified: false });
  assert.equal(failed.ok, false);
  const ledger = buildEconomicLedger({ usage: [failed] });
  assert.equal(ledger.length, 0);
});

test("ledger combines connection and measured usage without inventing identity", () => {
  const connection = observeConnection({ actor: "gemini", channel: "native", authenticated: true, authorized: true });
  const usage = meterExecution({ actor: "gemini", execution_id: "run-3", executed: true, verified: true, executions: 4, work_units: 7, duration_ms: 60000 });
  const ledger = buildEconomicLedger({ connections: [connection], usage: [usage] });
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].actor, "gemini");
  assert.equal(ledger[0].connections, 1);
  assert.equal(ledger[0].executions, 4);
  assert.equal(ledger[0].work_units, 7);
});

test("payable account becomes a billing candidate only with explicit pricing", () => {
  const account = { actor: "gemini", measured_usage: true, commercial_state: "PAYABLE", executions: 2, work_units: 3, duration_ms: 60000 };
  const priced = priceAccount(account, { enabled: true, version: "economic-pricing.v1", currency: "CAD", per_execution: 1, per_work_unit: 2, per_minute: 3 });
  assert.equal(priced.amount, 11);
  const candidate = prepareBillingCandidate(account, priced);
  assert.equal(candidate.eligible, true);
  assert.equal(candidate.charged, false);
  assert.equal(candidate.payment_attempted, false);
});

test("disabled pricing never creates a monetary candidate", () => {
  const account = { actor: "gemini", measured_usage: true, commercial_state: "PAYABLE", executions: 2, work_units: 3, duration_ms: 60000 };
  const priced = priceAccount(account, { enabled: false, currency: "CAD" });
  const candidate = prepareBillingCandidate(account, priced);
  assert.equal(priced.amount, null);
  assert.equal(candidate.eligible, false);
});

test("routine events remain silent while payment remains a human boundary", () => {
  assert.equal(escalation({ reason: "NORMAL_CONNECTION" }).severity, "SILENT");
  assert.equal(escalation({ boundary: "PAYMENT" }).severity, "HUMAN_REQUIRED");
});

test("economic snapshot exposes measured users and never charges", () => {
  const connection = observeConnection({ actor: "gemini", channel: "native", authenticated: true, authorized: true });
  const usage = meterExecution({ actor: "gemini", execution_id: "run-4", executed: true, verified: true, work_units: 1 });
  const snapshot = economicSnapshot({ connections: [connection], usage: [usage], accounts: { gemini: { commercial_state: "PAYABLE" } }, pricing: { enabled: false, currency: "CAD" } });
  assert.equal(snapshot.totals.measured_users, 1);
  assert.equal(snapshot.totals.payable, 1);
  assert.equal(snapshot.truth.automatic_charge, false);
  assert.equal(snapshot.truth.hidden_tracking, false);
});
