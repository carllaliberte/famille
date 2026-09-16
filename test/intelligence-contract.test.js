import test from "node:test";
import assert from "node:assert/strict";
import { intelligenceAdapter } from "../sdk/open-intelligence.js";
import { considerUnknownChannel } from "../sdk/open-channel.js";
import {
  COST_POLICIES,
  applyCostPolicy,
  describeIntelligence,
  discoverAvailability,
  discoverCatalog,
  discoverIntelligences,
  learnFromProviderFailure,
  registerCompatibleIntelligence,
  rememberIntelligenceExperience,
  routeTask,
  runIntelligenceContract,
} from "../scripts/intelligence-contract.mjs";
import { runCortexRuntime } from "../scripts/cortex-runtime.mjs";
import { MODELS } from "../.github/swarm/review.mjs";

test("identity is not model is not channel", () => {
  const d = describeIntelligence({ id: "reviewer", provider: "openrouter", model: "orfree", capabilities: ["review"] });
  assert.equal(d.identity_is_not_model, true);
  assert.equal(d.authority, false);
  assert.equal(d.live, false);
  assert.ok(COST_POLICIES.includes("PAID_FORBIDDEN"));
});

test("adapter describe exists without changing Cortex", () => {
  const a = intelligenceAdapter({ id: "tomorrowx", provider: "UNKNOWN", capabilities: ["CAPABILITY_NEW"] });
  const described = a.describe();
  assert.equal(described.identity, "tomorrowx");
  assert.equal(described.live, false);
  assert.equal(a.invoke({ capability: "review" }).reason, "CHANNEL_NOT_PRESENT");
});

test("discovery uses roster as cache; cortex-local is callable without keys", () => {
  const found = discoverIntelligences({
    env: {},
    agents: [
      { id: "chatgpt", capabilities: ["review"], presence: "DECLARED" },
      { id: "worker", capabilities: ["review"], presence: "DECLARED" },
    ],
    canals: MODELS,
    workerEvidence: { v: "cognitive-worker.v14" },
  });
  assert.equal(found.closed_list, false);
  assert.ok(found.callable >= 1);
  assert.ok(found.entries.some((row) => row.identity === "cortex-local" && row.state === "CALLABLE"));
  assert.equal(found.entries.find((row) => row.identity === "chatgpt").state, "DEFINED");
  assert.equal(found.live, false);
});

test("PAID_FORBIDDEN never selects a paid native", () => {
  const found = discoverIntelligences({
    env: { XAI_API_KEY: "x" },
    agents: [{ id: "xai", capabilities: ["review"] }],
    canals: { xai: MODELS.xai },
  });
  const routed = routeTask({ need: "review", discovered: found, env: { XAI_API_KEY: "x" }, policy: "PAID_FORBIDDEN" });
  assert.notEqual(routed.selected?.lane, "paid");
  assert.equal(routed.silent_paid_fallback, false);
  assert.ok(["cortex-local", "xai"].includes(routed.selected?.identity || "cortex-local"));
  if (routed.selected?.identity === "xai") assert.equal(routed.status, "HOLD_HUMAN");
});

test("FREE_FIRST skips paid when a keyless candidate exists", () => {
  const found = discoverIntelligences({
    env: { GITHUB_TOKEN: "ghs", XAI_API_KEY: "x" },
    agents: [{ id: "ghmodels", capabilities: ["review"] }, { id: "xai", capabilities: ["review"] }],
    canals: { ghmodels: MODELS.ghmodels, xai: MODELS.xai },
  });
  const routed = routeTask({ need: "review", discovered: found, env: { GITHUB_TOKEN: "ghs", XAI_API_KEY: "x" }, policy: "FREE_FIRST" });
  assert.equal(routed.silent_paid_fallback, false);
  assert.equal(routed.selected?.identity === "xai", false);
});

test("unknown provider is DISCOVERED not CONNECTED", () => {
  const c = considerUnknownChannel({ id: "brand-new", provider: "not-a-catalog" });
  assert.equal(c.status, "DISCOVERED");
  const reg = registerCompatibleIntelligence({ agents: [] }, { id: "brandnew", provider: "not-a-catalog", capabilities: ["CAPABILITY_NEW"] });
  assert.equal(reg.cortex_modified, false);
  assert.equal(reg.channel.live, false);
});

test("provider failure becomes a measured reroute, never fake success", () => {
  const learned = learnFromProviderFailure({ http: 429, intelligence: "orfree", policy: "PAID_ALLOWED" });
  assert.equal(learned.fake_success, false);
  assert.equal(learned.reroute, true);
  assert.equal(learned.next_policy, "FREE_FIRST");
  const mem = rememberIntelligenceExperience({ intelligence: "orfree", capability: "review", failure: "429" });
  assert.equal(mem.entry.constraint, true);
  assert.equal(mem.live, false);
});

test("catalog without key stays INCONCLUSIVE", async () => {
  const catalog = await discoverCatalog({ env: {}, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ data: [] }) }) });
  assert.equal(catalog.status, "INCONCLUSIVE");
  assert.equal(catalog.reason, "CHANNEL_NOT_PRESENT");
});

test("mocked catalog fetch is MEASURED not LIVE", async () => {
  const catalog = await discoverCatalog({
    env: { OPENROUTER_API_KEY: "or" },
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ data: [{ id: "google/gemma-3-1b:free" }] }) }),
  });
  assert.equal(catalog.status, "MEASURED");
  assert.equal(catalog.live, false);
  assert.ok(catalog.models.length >= 1);
});

test("runtime wires discovery, routing and reality learning without LIVE", () => {
  const result = runCortexRuntime({
    workerEvidence: {
      v: "cognitive-worker.v14",
      verified: true,
      dispatches: [{ number: 627, sha: "abc", state: "VERIFIED" }],
      truth: { ACTION_VERIFIED: true },
    },
    agents: [{ id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" }],
    fluidity: { state: "FLOWING", property: { silent_stop: false, hint_consumed: true } },
    env: { ACORN_COST_POLICY: "FREE_FIRST" },
    at: "2026-09-16T22:10:00.000Z",
  });
  assert.equal(result.intelligence.closed_list, false);
  assert.equal(result.intelligence.consensus_is_truth, false);
  assert.notEqual(result.intelligence.routed.selected?.lane, "paid");
  assert.ok(["CALLABLE", "EXECUTED"].includes(
    result.intelligence.discovered.entries.find((row) => row.identity === result.intelligence.routed.selected?.identity)?.state
    || "",
  ));
  assert.equal(result.learning.status, "LEARNED");
  assert.equal(result.live, false);
  assert.equal(result.intelligence.live, false);
});

test("GH_TOKEN does not make OpenRouter free seats CALLABLE", () => {
  const found = discoverIntelligences({
    env: { GH_TOKEN: "ghs_actions" },
    agents: [{ id: "orfree", capabilities: ["review"] }, { id: "ghmodels", capabilities: ["review"] }],
    canals: { orfree: MODELS.orfree, ghmodels: MODELS.ghmodels },
  });
  assert.equal(found.entries.find((row) => row.identity === "orfree").state, "DEFINED");
  assert.equal(found.entries.find((row) => row.identity === "ghmodels").state, "CALLABLE");
  const available = discoverAvailability({
    env: { GH_TOKEN: "ghs_actions" },
    agents: [{ id: "orfree", capabilities: ["review"] }, { id: "ghmodels", capabilities: ["review"] }],
    canals: { orfree: MODELS.orfree, ghmodels: MODELS.ghmodels },
  });
  assert.equal(available.callable.includes("orfree"), false);
  assert.equal(available.callable.includes("ghmodels"), true);
  const routed = routeTask({
    need: "review",
    discovered: found,
    env: { GH_TOKEN: "ghs_actions" },
    policy: "FREE_FIRST",
  });
  assert.notEqual(routed.selected?.identity, "orfree");
  assert.notEqual(routed.selected?.lane, "paid");
  assert.ok(["ghmodels", "cortex-local"].includes(routed.selected?.identity));
});

test("worker evidence is keyless EXECUTED, never a paid seat", () => {
  const found = discoverIntelligences({
    env: {},
    agents: [{ id: "worker", capabilities: ["review"] }],
    canals: {},
    workerEvidence: { v: "cognitive-worker.v14" },
  });
  const worker = found.entries.find((row) => row.identity === "worker");
  assert.equal(worker.lane, "keyless");
  assert.equal(worker.state, "EXECUTED");
  const routed = routeTask({ need: "review", discovered: found, env: {}, policy: "FREE_FIRST" });
  assert.notEqual(routed.selected?.lane, "paid");
});

test("OPENROUTER_API_KEY is required before orfree is CALLABLE", () => {
  const without = discoverIntelligences({
    env: {},
    agents: [{ id: "orfree", capabilities: ["review"] }],
    canals: { orfree: MODELS.orfree },
  });
  assert.equal(without.entries.find((row) => row.identity === "orfree").state, "DEFINED");
  const withKey = discoverIntelligences({
    env: { OPENROUTER_API_KEY: "or" },
    agents: [{ id: "orfree", capabilities: ["review"] }],
    canals: { orfree: MODELS.orfree },
  });
  assert.equal(withKey.entries.find((row) => row.identity === "orfree").state, "CALLABLE");
  assert.equal(withKey.entries.find((row) => row.identity === "orfree").lane, "free");
});

test("canal-only GitHub Models is review-capable without a roster row", () => {
  const found = discoverIntelligences({
    env: { GH_TOKEN: "ghs_actions" },
    agents: [{ id: "worker", capabilities: ["review"] }],
    canals: { ghmodels: MODELS.ghmodels },
    workerEvidence: { v: "cognitive-worker.v14" },
  });
  const gh = found.entries.find((row) => row.identity === "ghmodels");
  assert.equal(gh.state, "CALLABLE");
  assert.equal(gh.lane, "keyless");
  assert.ok(gh.capabilities.includes("review"));
  const routed = routeTask({ need: "review", discovered: found, env: { GH_TOKEN: "ghs_actions" }, policy: "FREE_FIRST" });
  assert.ok(["ghmodels", "worker", "cortex-local"].includes(routed.selected?.identity));
  assert.ok(routed.candidates.includes("ghmodels"));
});
