import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  INTELLIGENCE_FAMILIES,
  capabilityAdapter,
  channelAdapter,
  connectionOpportunity,
  discoverIntelligenceChannels,
  federateChannels,
  intelligenceDiscoveryLoop,
  intelligenceFamilies,
  intelligenceResource,
  measureWorld,
  protocolAdapter,
  routeByDiscoveredCapability,
  runtimeAdapter,
  summarizeOpportunity,
} from "../scripts/intelligence-ecosystem.mjs";
import { registerCompatibleIntelligence } from "../scripts/intelligence-contract.mjs";
import { probeAccelerator } from "../scripts/cortex-acceleration.mjs";

function world(partial = {}) {
  return measureWorld({
    env: partial.env || {},
    root: partial.root || "/tmp/famille-main",
    binaries: partial.binaries || [],
    endpoints: partial.endpoints || {},
    sessions: partial.sessions || {},
    executed: partial.executed || {},
    verified: partial.verified || {},
    callable: partial.callable || {},
    files: partial.files || { mcp: false },
  });
}

test("registry is knowledge, not an allowlist, and does not mint LIVE", () => {
  const registry = intelligenceFamilies();
  assert.equal(registry.closed_list, false);
  assert.equal(registry.allowlist, false);
  assert.equal(registry.named_is_not_connected, true);
  assert.equal(registry.live, false);
  assert.ok(registry.count >= 20);
  assert.ok(INTELLIGENCE_FAMILIES.some((row) => row.id === "unknown"));
  const named = intelligenceResource({ id: "claude", provider: "anthropic", family: "anthropic" });
  assert.equal(named.named_is_not_discovered, true);
  assert.equal(named.live, false);
  assert.equal(named.authority_ceiling, 0);
});

test("generic adapters do not branch Cortex on provider names", () => {
  const ch = channelAdapter({ kind: "local_endpoint", present: true, provider: "UNKNOWN" });
  assert.equal(ch.cortex_modified, false);
  assert.equal(ch.live, false);
  assert.equal(protocolAdapter({ protocol: "openai-compatible" }).live, false);
  assert.equal(runtimeAdapter({ runtime: "vllm" }).live, false);
  assert.equal(capabilityAdapter({ need: "reasoning" }).kind, "capability");
  const src = readFileSync(new URL("../scripts/intelligence-ecosystem.mjs", import.meta.url), "utf8");
  assert.equal(/if\s*\(\s*(provider|family|vendor)\s*===\s*["']NVIDIA["']/i.test(src), false);
  assert.equal(/if\s*\(\s*(provider|family)\s*===\s*["']OpenAI["']/i.test(src), false);
});

test("CUDA env configures any accelerator, not only a NVIDIA name", () => {
  const amd = probeAccelerator({ identity: "gpu-x", vendor: "AMD", env: { CUDA_VISIBLE_DEVICES: "0" } });
  assert.equal(amd.state, "CONFIGURED");
  assert.equal(amd.live, false);
  const empty = probeAccelerator({ identity: "nvidia-gpu", vendor: "NVIDIA", env: {} });
  assert.equal(empty.state, "CHANNEL_NOT_PRESENT");
});

const scenarios = [
  ["1 NVIDIA", {
    resource: { family: "nvidia" },
    world: world({}),
    check(row) {
      assert.equal(row.state, "CHANNEL_NOT_PRESENT");
      assert.equal(row.live, false);
      assert.equal(row.executed, false);
      const card = summarizeOpportunity(row);
      assert.equal(card.GPU, "ABSENT");
      assert.equal(card.CLI, "ABSENT");
      assert.equal(card.state, "CHANNEL_NOT_PRESENT");
    },
  }],
  ["2 OpenAI/Codex", {
    resource: { family: "openai", id: "openai" },
    world: world({}),
    check(row) {
      assert.equal(row.named, true);
      assert.equal(row.authenticated, false);
      assert.equal(row.live, false);
      assert.ok(["NAMED", "CHANNEL_NOT_PRESENT", "CHANNEL_DISCOVERED"].includes(row.state));
    },
  }],
  ["3 Gemini", {
    resource: { family: "google" },
    world: world({ sessions: { gemini_native: true } }),
    check(row) {
      assert.equal(row.authenticated, true);
      assert.equal(row.executed, false);
      assert.equal(row.state, "AUTHENTICATED");
      assert.ok(row.channels.some((ch) => ch.kind === "native_session"));
    },
  }],
  ["4 Grok", {
    resource: { family: "xai" },
    world: world({ env: { XAI_API_KEY: "x" } }),
    check(row) {
      assert.equal(row.authenticated, true);
      assert.equal(row.callable, false);
      assert.equal(row.executed, false);
      assert.equal(row.live, false);
      assert.equal(row.state, "AUTHENTICATED");
    },
  }],
  ["5 Claude", {
    resource: { family: "anthropic" },
    world: world({ env: { ANTHROPIC_API_KEY: "x" } }),
    check(row) {
      assert.equal(row.authenticated, true);
      assert.equal(row.live, false);
    },
  }],
  ["6 Llama", {
    resource: { family: "meta", id: "llama" },
    world: world({ binaries: ["ollama"], endpoints: { "127.0.0.1:11434": true } }),
    check(row) {
      assert.equal(row.callable, true);
      assert.equal(row.state, "CALLABLE");
      assert.equal(row.live, false);
    },
  }],
  ["7 Mistral", {
    resource: { family: "mistral" },
    world: world({}),
    check(row) {
      assert.equal(row.state, "CHANNEL_NOT_PRESENT");
      assert.equal(row.live, false);
    },
  }],
  ["8 DeepSeek", {
    resource: { family: "deepseek" },
    world: world({ env: { OPENROUTER_API_KEY: "or" } }),
    check(row) {
      assert.equal(row.authenticated, true);
      assert.ok(row.channels.some((ch) => ch.kind === "configured_gateway"));
      assert.equal(row.live, false);
    },
  }],
  ["9 Qwen", {
    resource: { family: "qwen" },
    world: world({}),
    check(row) {
      assert.equal(row.present, false);
      assert.equal(row.live, false);
    },
  }],
  ["10 local model", {
    resource: { family: "local", id: "local" },
    world: world({ binaries: ["ollama"], endpoints: { "127.0.0.1:11434": true } }),
    check(row) {
      assert.equal(row.callable, true);
      assert.equal(row.state, "CALLABLE");
      assert.equal(row.live, false);
      const opp = connectionOpportunity(row);
      assert.equal(opp.least_cost_path, "local_model_runtime");
    },
  }],
  ["11 unknown resource", {
    resource: { provider: "UNKNOWN", model: "UNKNOWN", channel: "UNKNOWN", id: "newai" },
    world: world({}),
    check(row) {
      assert.equal(row.unknown, true);
      assert.equal(row.cortex_modified, false);
      assert.equal(row.unknown_channel.status, "DISCOVERED");
      assert.equal(row.live, false);
      const admitted = registerCompatibleIntelligence({ agents: [] }, { id: "newai", provider: "UNKNOWN" });
      assert.equal(admitted.cortex_modified, false);
    },
  }],
  ["12 resource without channel", {
    resource: { family: "cohere" },
    world: world({}),
    check(row) {
      assert.equal(row.state, "CHANNEL_NOT_PRESENT");
      assert.equal(row.present, false);
      assert.equal(row.authenticated, false);
    },
  }],
  ["13 channel without authentication", {
    resource: { family: "openai", id: "openai" },
    world: world({ endpoints: { "127.0.0.1:8000": true } }),
    check(row) {
      assert.equal(row.present, true);
      assert.equal(row.authenticated, false);
      assert.equal(row.callable, false);
      assert.notEqual(row.state, "LIVE");
    },
  }],
  ["14 authenticated but not executable", {
    resource: { family: "anthropic" },
    world: world({ env: { ANTHROPIC_API_KEY: "x" } }),
    check(row) {
      assert.equal(row.authenticated, true);
      assert.equal(row.callable, false);
      assert.equal(row.executed, false);
      assert.equal(row.state, "AUTHENTICATED");
    },
  }],
  ["15 executable then verifiable", {
    resource: { family: "local", id: "local" },
    world: world({
      binaries: ["ollama"],
      endpoints: { "127.0.0.1:11434": true },
      executed: { local: true },
      verified: { local: true },
    }),
    check(row) {
      assert.equal(row.executed, true);
      assert.equal(row.verified, true);
      assert.equal(row.state, "VERIFIED");
      assert.equal(row.live, false);
    },
  }],
];

for (const [name, { resource, world: w, check }] of scenarios) {
  test(`ecosystem ${name}`, () => {
    const row = discoverIntelligenceChannels(resource, w);
    assert.equal(row.live, false);
    assert.equal(row.allowlist, false);
    assert.equal(row.second_cortex, false);
    check(row);
  });
}

test("states stay strictly separated", () => {
  const named = discoverIntelligenceChannels({ family: "mistral" }, world({}));
  const authed = discoverIntelligenceChannels({ family: "xai" }, world({ env: { XAI_API_KEY: "x" } }));
  const local = discoverIntelligenceChannels({ family: "local" }, world({
    binaries: ["ollama"],
    endpoints: { "127.0.0.1:11434": true },
  }));
  assert.notEqual(named.state, authed.state);
  assert.notEqual(authed.state, local.state);
  assert.equal(named.live, false);
  assert.equal(authed.executed, false);
  assert.equal(local.verified, false);
});

test("federation lists multiple paths without a hardcoded vendor", () => {
  const llama = discoverIntelligenceChannels({ family: "meta" }, world({
    binaries: ["ollama"],
    endpoints: { "127.0.0.1:11434": true },
    env: { OPENROUTER_API_KEY: "or" },
  }));
  const fed = federateChannels([llama]);
  assert.equal(fed.federated[0].hardcoded_vendor, false);
  assert.equal(fed.federated[0].provider_preference, null);
  assert.ok(fed.federated[0].paths.length >= 2);
});

test("capability routing ignores brand", () => {
  const local = discoverIntelligenceChannels({ family: "local", id: "local" }, world({
    binaries: ["ollama"],
    endpoints: { "127.0.0.1:11434": true },
  }));
  const routed = routeByDiscoveredCapability({ need: "reasoning", discoveries: [local] });
  assert.equal(routed.by_brand, false);
  assert.equal(routed.provider_preference, null);
  assert.equal(routed.selected.id, "local");
});

test("discovery loop composes existing organs and never claims LIVE", () => {
  const loop = intelligenceDiscoveryLoop({
    world: world({ env: { XAI_API_KEY: "x" } }),
    need: "review",
    env: { XAI_API_KEY: "x" },
  });
  assert.equal(loop.second_cortex, false);
  assert.equal(loop.live, false);
  assert.equal(loop.closed_list, false);
  assert.equal(loop.admitted.cortex_modified, false);
  assert.equal(loop.counts.live, 0);
  assert.equal(loop.unknown.unknown, true);
  assert.ok(loop.stages.some((row) => row.stage === "FIND_CHANNELS"));
  assert.equal(loop.nvidia.state, "CHANNEL_NOT_PRESENT");
  const grok = loop.discoveries.find((row) => row.family === "xai");
  assert.equal(grok.state, "AUTHENTICATED");
  assert.equal(grok.executed, false);
});
