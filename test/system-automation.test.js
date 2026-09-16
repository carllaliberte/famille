import test from "node:test";
import assert from "node:assert/strict";
import { credentialAction, inspectSystems, planSystems, routeSystem } from "../.github/swarm/system-automation.mjs";

const env = (extra = {}) => ({ XAI_API_KEY: "secret", OPENROUTER_API_KEY: "fallback-secret", ...extra });

test("system automation detects configured credentials without exposing values", () => {
  const result = inspectSystems({ env: env() });
  assert.deepEqual(result.configured, ["openrouter", "xai"]);
  const xai = result.systems.find((row) => row.id === "xai");
  assert.equal(xai.credential.value_exposed, false);
  assert.equal(xai.credential.key_name, "XAI_API_KEY");
  assert.equal(result.ready_for_execution, false);
  assert.equal(result.live, false);
});

test("system automation routes to the first configured capable system", () => {
  const result = routeSystem({ capability: "build", env: env() });
  assert.equal(result.selected.id, "xai");
  assert.equal(result.fallback_available, false);
  assert.equal(result.execution_requires_breaker, true);
});

test("system automation plans multiple capabilities deterministically", () => {
  const result = planSystems({ capabilities: ["build", "lu", "build"], env: env() });
  assert.deepEqual(result.requested_capabilities, ["build", "lu"]);
  assert.equal(result.routes[0].selected.id, "xai");
  assert.equal(result.production_write_allowed, false);
});

test("missing credentials produce a human configuration requirement", () => {
  const result = credentialAction({ system: "xai", env: {} });
  assert.equal(result.configured, false);
  assert.equal(result.action, "HUMAN_CONFIGURATION_REQUIRED");
  assert.equal(result.automated_provisioning, false);
  assert.equal(result.value_exposed, false);
});

test("lu prefers unpaid OpenRouter over paid xAI when both keys exist", () => {
  const result = routeSystem({ capability: "lu", env: env() });
  assert.equal(result.selected.id, "openrouter");
});

test("github-models is preferred for lu when GITHUB_TOKEN is present", () => {
  const result = routeSystem({ capability: "lu", env: { GITHUB_TOKEN: "ghs_test", XAI_API_KEY: "x" } });
  assert.equal(result.selected.id, "github-models");
});
