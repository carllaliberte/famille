import test from "node:test";
import assert from "node:assert/strict";
import {
  AI_PROVIDERS, HARVEST_VERSION, MISSING_ROSTER_IDS, XAI_STALE_SLUGS,
  secretNameFor, channelState, tagAiCatalog, proposeRosterDelta,
  probeKeyless, snapshotHarvest, harvestBundle
} from "../scripts/acorn-api-harvest.mjs";

test("harvest contract never claims live or authority", () => {
  const snap = snapshotHarvest({ env: {}, roster: [] });
  assert.equal(snap.contract, HARVEST_VERSION);
  assert.equal(snap.authority, false);
  assert.equal(snap.live, false);
  assert.equal(snap.auto_merge, false);
  assert.equal(snap.writes_schema_agents, false);
  assert.ok(snap.total_ai_surfaces > 0);
  assert.ok(AI_PROVIDERS.includes("groq"));
});

test("OPENROUTER_API_KEY absent is measured skip not stall", () => {
  const ch = channelState({ id: "orfree", env: {} });
  assert.equal(ch.state, "CHANNEL_NOT_PRESENT");
  assert.equal(ch.reason, "OPENROUTER_API_KEY_ABSENT");
  assert.equal(ch.stall, false);
  const probe = probeKeyless({ env: {} });
  const or = probe.probes.find((x) => x.surface === "openrouter-models");
  assert.equal(or.state, "CHANNEL_NOT_PRESENT");
  assert.equal(probe.stall, false);
  assert.equal(probe.paid_api_required, false);
});

test("secret map is table-driven not naive keyName", () => {
  assert.equal(secretNameFor("chatgpt"), "OPENAI_API_KEY");
  assert.equal(secretNameFor("sonnet"), "ANTHROPIC_API_KEY");
  assert.equal(secretNameFor("haiku"), "HAIKU_API_KEY");
  assert.equal(secretNameFor("gemini"), "GEMINI_API_KEY");
  assert.equal(secretNameFor("orfree"), "OPENROUTER_API_KEY");
  assert.equal(secretNameFor("qwen3c"), "OPENROUTER_API_KEY");
  assert.equal(secretNameFor("groq"), "GROQ_API_KEY");
});

test("READY only when mapped secret is present", () => {
  const ready = channelState({ id: "gemini", env: { GEMINI_API_KEY: "x".repeat(16) } });
  assert.equal(ready.state, "READY");
  const absent = channelState({ id: "gemini", env: { GEMINI_API_KEY: "short" } });
  assert.equal(absent.state, "CHANNEL_NOT_PRESENT");
});

test("delta proposes missing AI ids without mutating roster", () => {
  const roster = [{ id: "gemini", status: "auto" }, { id: "groq", status: "declared" }];
  const delta = proposeRosterDelta({ roster });
  assert.equal(delta.some((x) => x.id === "groq"), false);
  assert.equal(delta.some((x) => x.id === "cerebras"), true);
  assert.equal(delta.every((x) => x.connected === false && x.live === false && x.authority === false), true);
  assert.ok(MISSING_ROSTER_IDS.length >= 10);
});

test("ai catalog tag does not grant authority", () => {
  const tagged = tagAiCatalog();
  assert.ok(tagged.length > 0);
  assert.equal(tagged.every((x) => x.metadata.ai === true), true);
  assert.equal(tagged.every((x) => x.metadata.surface_kind === "ai-api"), true);
  assert.equal(tagged.every((x) => x.authority === false), true);
  assert.equal(tagged.some((x) => x.provider === "stripe"), false);
});

test("xAI stale slugs stay documented not executed", () => {
  assert.ok(XAI_STALE_SLUGS.includes("grok-2"));
  const probe = probeKeyless({ env: {} });
  const xai = probe.probes.find((x) => x.surface === "xai-models");
  assert.equal(xai.state, "CHANNEL_NOT_PRESENT");
  assert.deepEqual(xai.stale_slugs, ["grok-2", "grok-2-mini"]);
});

test("bundle is a proposal not a live write", () => {
  const bundle = harvestBundle({ env: {}, roster: [] });
  assert.equal(bundle.doctrine.auto_merge, false);
  assert.equal(bundle.doctrine.live, false);
  assert.equal(bundle.doctrine.secret_material_present, false);
  assert.match(bundle.doctrine.schema_agents_json, /HOLD_HUMAN/);
});
