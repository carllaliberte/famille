import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  catalogExpired,
  inspectSurface,
  keyPresent,
  loadCatalog,
  monitor,
} from "../scripts/xai-surface-monitor.mjs";

describe("xai-surface-monitor", () => {
  it("loads a dated catalog that cannot claim LIVE", () => {
    const catalog = loadCatalog();
    assert.equal(catalog.version, "xai-surface.v0");
    assert.equal(catalog.live, false);
    assert.equal(catalog.auto_merge, false);
    assert.equal(catalog.human_authority, "carl");
    assert.equal(catalog.kernel.required_for_run, false);
    assert.equal(catalog.kernel.inseparable, true);
    assert.match(catalog.measured_on, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(catalog.horizon, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("treats missing key as configuration error, not xAI absent", () => {
    const env = { ACORN_SYSTEM_MODE: "RUN" };
    const row = inspectSurface(
      { id: "grok", status: "shipping", runtime: "chef", slug: "grok-4.6", roster_id: "grok" },
      env,
    );
    assert.equal(keyPresent(env), false);
    assert.equal(row.state, "CONFIGURATION_ERROR");
    assert.equal(row.api_call, "NOT_EXECUTED");
    assert.equal(row.live, false);
  });

  it("marks slug+key as CONFIGURED without calling the API", () => {
    const row = inspectSurface(
      { id: "grok", status: "shipping", runtime: "chef", slug: "grok-4.6", roster_id: "grok" },
      { ACORN_SYSTEM_MODE: "RUN", XAI_API_KEY: "sk-test-present-xxxx" },
    );
    assert.equal(row.state, "CONFIGURED");
    assert.equal(row.key_present, true);
    assert.equal(row.api_call, "NOT_EXECUTED");
  });

  it("keeps Tesla and Neuralink out of the runtime", () => {
    const tesla = inspectSurface(
      { id: "tesla", status: "not-canal", runtime: "forbidden", slug: null, roster_id: null },
      { ACORN_SYSTEM_MODE: "RUN", XAI_API_KEY: "sk-test" },
    );
    assert.equal(tesla.state, "OUT_OF_RUNTIME");
  });

  it("blocks evaluation writes conceptually when breaker is OFF", () => {
    const row = inspectSurface(
      { id: "grok", status: "shipping", runtime: "chef", slug: "grok-4.6", roster_id: "grok" },
      { ACORN_SYSTEM_MODE: "OFF", XAI_API_KEY: "sk-test" },
    );
    assert.equal(row.state, "BLOCKED_BY_BREAKER");
    assert.equal(row.api_call, "NOT_EXECUTED");
  });

  it("expires the catalog after horizon — eternity is a lie", () => {
    const catalog = loadCatalog();
    assert.equal(catalogExpired(catalog, new Date("2026-09-15T12:00:00Z")), false);
    assert.equal(catalogExpired(catalog, new Date("2027-01-01T00:00:01Z")), true);
  });

  it("monitor report never sets live or auto_merge", () => {
    const report = monitor({ ACORN_SYSTEM_MODE: "RUN" });
    assert.equal(report.live, false);
    assert.equal(report.auto_merge, false);
    assert.equal(report.truth.LIVE_API_CALLED, false);
    assert.equal(report.truth.ETERNAL_LABEL, false);
    assert.ok(report.rows.some((r) => r.id === "grok"));
    assert.ok(report.rows.some((r) => r.id === "tesla" && r.state === "OUT_OF_RUNTIME"));
  });
});
