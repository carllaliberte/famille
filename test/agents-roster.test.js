import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it } from "node:test";
import {
  AGENTS,
  FLUX_VERSION,
  OWNER_ACTOR,
  accept,
  connectAgent,
  focusOf,
  formatEnvelope,
  gradesFor,
  isAgent,
  isModel,
  lookup,
  resetGuests,
  roster,
  runPass,
  speakerAllowed,
  suggestContribution,
} from "../.github/swarm/flux.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

afterEach(() => {
  resetGuests();
});

function loadMeshSchema() {
  return JSON.parse(read("schema/mesh.v0.json"));
}

function loadAiSchema() {
  return JSON.parse(read("schema/agents.v0.json"));
}

function loadRoster() {
  return JSON.parse(read("schema/agents.json"));
}

/** Focused checker — famille tests stay dependency-free. additionalProperties is true. */
function meshErrors(packet, schema) {
  const errs = [];
  for (const key of schema.required) {
    if (packet[key] == null || packet[key] === "") errs.push(`missing ${key}`);
  }
  if (Object.hasOwn(packet, "next")) errs.push("next");
  if (Object.hasOwn(packet, "instruction")) errs.push("instruction");
  const fromRe = new RegExp(schema.properties.from.pattern);
  const toRe = new RegExp(schema.properties.to.pattern);
  if (!fromRe.test(String(packet.from || ""))) errs.push("from");
  if (!toRe.test(String(packet.to || ""))) errs.push("to");
  if (!schema.properties.act.enum.includes(packet.act)) errs.push("act");
  if (!schema.properties.mode.enum.includes(packet.mode)) errs.push("mode");
  if (!schema.properties.grade.enum.includes(packet.grade)) errs.push("grade");
  if (typeof packet.body !== "string" || packet.body.length < 1) errs.push("body");
  if (packet.flux != null && packet.flux !== schema.properties.flux.const) {
    errs.push("flux");
  }
  if (packet.preview != null && packet.preview !== true) errs.push("preview");
  if (packet.receipt != null && packet.receipt !== false) errs.push("receipt");
  if (schema.not?.anyOf) {
    for (const clause of schema.not.anyOf) {
      for (const key of clause.required || []) {
        if (Object.hasOwn(packet, key)) errs.push(`not ${key}`);
      }
    }
  }
  return errs;
}

function agentSchemaErrors(row, schema) {
  const def = schema.$defs.agent;
  const errs = [];
  for (const key of def.required) {
    if (row[key] == null || row[key] === "") errs.push(`missing ${key}`);
  }
  const idRe = new RegExp(def.properties.id.pattern);
  if (!idRe.test(String(row.id || ""))) errs.push("id");
  if (Object.hasOwn(row, "next")) errs.push("next");
  if (Object.hasOwn(row, "instruction")) errs.push("instruction");
  return errs;
}

describe("mesh roster — open ids, not an enum", () => {
  it("mesh.v0 from/to stay an open pattern; no agent enum; no next/instruction", () => {
    const mesh = loadMeshSchema();
    const raw = read("schema/mesh.v0.json");
    assert.equal(mesh.title, "famille.mesh.v0");
    assert.equal(mesh.properties.from.enum, undefined);
    assert.equal(mesh.properties.to.enum, undefined);
    assert.equal(mesh.properties.from.pattern, "^[a-z][a-z0-9-]{1,24}$");
    assert.equal(mesh.properties.to.pattern, "^(\\*|[a-z][a-z0-9-]{1,24})$");
    assert.equal(mesh.properties.next, false);
    assert.equal(mesh.properties.instruction, false);
    assert.ok(mesh.not.anyOf.some((c) => c.required?.includes("next")));
    assert.ok(mesh.not.anyOf.some((c) => c.required?.includes("instruction")));
    assert.doesNotMatch(raw, /"astra"/);
    assert.doesNotMatch(raw, /"codex"/);
    assert.doesNotMatch(raw, /"nouvelle-ia"/);
    const fromRe = new RegExp(mesh.properties.from.pattern);
    assert.equal(fromRe.test("astra"), true);
    assert.equal(fromRe.test("codex"), true);
    assert.equal(fromRe.test("nouvelle-ia"), true);
    assert.equal(fromRe.test("grok"), true);
    assert.equal(fromRe.test("arbitre"), true);
  });

  it("agents.v0 does not enumerate IA ids; pattern matches mesh.v0 from", () => {
    const ai = loadAiSchema();
    const mesh = loadMeshSchema();
    assert.equal(ai.title, "famille.agents.v0");
    assert.equal(ai.$defs.agent.properties.id.enum, undefined);
    assert.equal(
      ai.$defs.agent.properties.id.pattern,
      mesh.properties.from.pattern,
    );
    assert.doesNotMatch(read("schema/agents.v0.json"), /"astra"/);
    assert.doesNotMatch(read("schema/agents.v0.json"), /"codex"/);
  });

  it("roster file lists locked seats plus declared guests; astra is a guest, not a judge", () => {
    const roster = loadRoster();
    const ai = loadAiSchema();
    assert.equal(roster.version, "agents.v0");
    assert.equal(roster.id_pattern, loadMeshSchema().properties.from.pattern);
    const ids = roster.agents.map((a) => a.id);
    assert.ok(ids.includes("grok"));
    assert.ok(ids.includes("carl"));
    assert.ok(ids.includes("astra"));
    assert.ok(ids.includes("codex"));
    const astra = roster.agents.find((a) => a.id === "astra");
    const llama = roster.agents.find((a) => a.id === "llama");
    assert.equal(astra.kind, "guest");
    assert.equal(astra.kind, llama.kind);
    assert.equal(astra.locked, false);
    assert.ok(astra.capabilities.includes("flux"));
    assert.ok(!astra.capabilities.includes("juge"));
    assert.notEqual(astra.kind, "juge");
    assert.notEqual(astra.role, "juge");
    for (const row of roster.agents) {
      assert.deepEqual(agentSchemaErrors(row, ai), []);
      assert.notEqual(row.kind, "juge");
      assert.ok(!(row.capabilities || []).includes("juge"));
    }
    const carl = roster.agents.find((a) => a.id === "carl");
    assert.equal(carl.locked, true);
    assert.equal(gradesFor("carl").includes("LIVE VERIFIED"), true);
    assert.equal(gradesFor("astra").includes("LIVE VERIFIED"), false);
    assert.equal(gradesFor("grok").includes("LIVE VERIFIED"), false);
  });

  it("registers astra (roster file) and accepts a mesh.v0 envelope from astra", () => {
    assert.equal(isAgent("astra"), true);
    assert.equal(lookup("astra").kind, "guest");
    assert.equal(lookup("astra").locked, false);
    const already = connectAgent({ id: "astra", name: "Astra" });
    assert.equal(already.ok, false);
    assert.equal(already.code, "ALREADY");

    const r = accept({
      from: "astra",
      to: "grok",
      act: "HANDOFF",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: "Astra on the mesh. Never QUANTUM.",
    });
    assert.equal(r.ok, true);
    assert.equal(r.packet.from, "astra");
    assert.equal(r.packet.to, "grok");
    assert.equal(r.packet.flux, FLUX_VERSION);
    assert.equal(r.packet.preview, true);
    assert.equal(r.packet.receipt, false);
    assert.equal(Object.hasOwn(r.packet, "next"), false);
    assert.equal(Object.hasOwn(r.packet, "instruction"), false);
    assert.match(formatEnvelope(r.packet), /^FLUX from:astra to:grok/);
    assert.deepEqual(meshErrors(r.packet, loadMeshSchema()), []);
  });

  it("adds nouvelle-ia without modifying mesh.v0 or agents.v0", () => {
    const meshBefore = read("schema/mesh.v0.json");
    const aiBefore = read("schema/agents.v0.json");
    const added = connectAgent({
      id: "nouvelle-ia",
      name: "Nouvelle IA",
      capabilities: ["lu", "flux"],
    });
    assert.equal(added.ok, true);
    assert.equal(added.agent.kind, "guest");
    assert.equal(isAgent("nouvelle-ia"), true);
    const r = accept({
      from: "nouvelle-ia",
      to: "github",
      act: "FINDING",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: "Joined by identifier. Never QUANTUM.",
    });
    assert.equal(r.ok, true);
    assert.equal(r.packet.from, "nouvelle-ia");
    assert.deepEqual(meshErrors(r.packet, loadMeshSchema()), []);
    assert.equal(read("schema/mesh.v0.json"), meshBefore);
    assert.equal(read("schema/agents.v0.json"), aiBefore);
    const fromRe = new RegExp(loadMeshSchema().properties.from.pattern);
    assert.equal(fromRe.test("nouvelle-ia"), true);
  });

  it("no model may claim LIVE VERIFIED; next and instruction stay forbidden", () => {
    const live = accept({
      from: "astra",
      to: "grok",
      act: "RESULT",
      mode: "ECHANGE",
      grade: "LIVE VERIFIED",
      body: "no",
    });
    assert.equal(live.ok, false);
    assert.equal(live.code, "LIVE_NOT_CARL");

    const next = accept({
      from: "astra",
      to: "grok",
      act: "HANDOFF",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: "no",
      next: "do-this",
    });
    assert.equal(next.ok, false);
    assert.equal(next.code, "FORBIDDEN_NEXT");

    const instruction = accept({
      from: "codex",
      to: "grok",
      act: "HANDOFF",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: "no",
      instruction: "do-this",
    });
    assert.equal(instruction.ok, false);
    assert.equal(instruction.code, "FORBIDDEN_NEXT");
  });

  it("core seats still load from the roster; Grok remains chef", () => {
    assert.equal(AGENTS.grok.kind, "chef");
    assert.equal(AGENTS.carl.kind, "seat");
    assert.equal(isAgent("grok"), true);
    assert.equal(isAgent("chatgpt"), true);
    const r = accept({
      from: "grok",
      to: "chatgpt",
      act: "HANDOFF",
      mode: "PROPOSITION",
      grade: "PROPOSED",
      body: "Never QUANTUM. FILE.md is state.",
    });
    assert.equal(r.ok, true);
    assert.deepEqual(meshErrors(r.packet, loadMeshSchema()), []);
  });

  it("expanded roster: unique ids, generalists and specialists are guests like astra", () => {
    const roster = loadRoster();
    const ids = roster.agents.map((a) => a.id);
    assert.equal(new Set(ids).size, ids.length);
    const generalists = [
      "llama",
      "mistral",
      "qwen",
      "claude",
      "astra",
      "cohere",
      "nova",
      "mixtral",
      "phi",
      "gemma",
      "yi",
      "glm",
      "kimi",
      "use-ai",
    ];
    const specialists = [
      "copilot",
      "opus",
      "codex",
      "claude-code",
      "cline",
      "aider",
      "continue",
      "windsurf",
      "zed",
      "goose",
      "composer",
    ];
    for (const id of [...generalists, ...specialists]) {
      const row = roster.agents.find((a) => a.id === id);
      assert.ok(row, id);
      assert.equal(row.kind, "guest", id);
      assert.equal(row.locked, false, id);
      assert.ok(!(row.capabilities || []).includes("juge"), id);
      assert.notEqual(row.role, "juge", id);
      assert.equal(isAgent(id), true, id);
      assert.equal(gradesFor(id).includes("LIVE VERIFIED"), false, id);
    }
    const kimi = roster.agents.find((a) => a.id === "kimi");
    const cline = roster.agents.find((a) => a.id === "cline");
    const astra = roster.agents.find((a) => a.id === "astra");
    const llama = roster.agents.find((a) => a.id === "llama");
    const claude = roster.agents.find((a) => a.id === "claude");
    assert.equal(kimi.lane, "generalist");
    assert.equal(cline.lane, "specialist");
    assert.equal(astra.lane, "generalist");
    assert.equal(claude.kind, llama.kind);
    assert.equal(claude.locked, false);
    assert.equal(claude.lane, "generalist");
    assert.equal(astra.kind, llama.kind);
    assert.equal(astra.kind, kimi.kind);
    assert.equal(astra.kind, cline.kind);
    assert.ok(kimi.capabilities.includes("lu"));
    assert.ok(kimi.capabilities.includes("flux"));
    assert.ok(cline.capabilities.includes("build"));
    const ai = loadAiSchema();
    assert.equal(ai.$defs.agent.properties.lane, undefined);
    assert.equal(ai.$defs.agent.properties.id.enum, undefined);
    const fluxSrc = read(".github/swarm/flux.mjs");
    assert.doesNotMatch(fluxSrc, /id === ["']astra["']/);
    assert.doesNotMatch(fluxSrc, /id === ["']codex["']/);
    assert.doesNotMatch(fluxSrc, /id === ["']kimi["']/);
    assert.doesNotMatch(fluxSrc, /id === ["']claude["']/);
    assert.doesNotMatch(read("schema/mesh.v0.json"), /"kimi"/);
    assert.doesNotMatch(read("schema/mesh.v0.json"), /"cline"/);
    assert.doesNotMatch(read("schema/mesh.v0.json"), /"claude"/);
  });

  it("accepts envelopes from kimi and cline without touching mesh.v0", () => {
    const meshBefore = read("schema/mesh.v0.json");
    const aiBefore = read("schema/agents.v0.json");
    const fromKimi = accept({
      from: "kimi",
      to: "grok",
      act: "HANDOFF",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: "Kimi on the mesh. Never QUANTUM.",
    });
    assert.equal(fromKimi.ok, true);
    assert.equal(fromKimi.packet.from, "kimi");
    assert.equal(Object.hasOwn(fromKimi.packet, "next"), false);
    assert.deepEqual(meshErrors(fromKimi.packet, loadMeshSchema()), []);

    const fromCline = accept({
      from: "cline",
      to: "github",
      act: "FINDING",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: "Cline on the mesh. Never QUANTUM.",
    });
    assert.equal(fromCline.ok, true);
    assert.equal(fromCline.packet.from, "cline");
    assert.deepEqual(meshErrors(fromCline.packet, loadMeshSchema()), []);
    assert.equal(read("schema/mesh.v0.json"), meshBefore);
    assert.equal(read("schema/agents.v0.json"), aiBefore);

    const already = connectAgent({ id: "kimi", name: "Kimi" });
    assert.equal(already.ok, false);
    assert.equal(already.code, "ALREADY");
  });

  it("LIVE VERIFIED stays Carl-only for new guests; next/instruction stay forbidden", () => {
    const live = accept({
      from: "kimi",
      to: "grok",
      act: "RESULT",
      mode: "ECHANGE",
      grade: "LIVE VERIFIED",
      body: "no",
    });
    assert.equal(live.ok, false);
    assert.equal(live.code, "LIVE_NOT_CARL");

    const liveCline = accept({
      from: "cline",
      to: "grok",
      act: "RESULT",
      mode: "ECHANGE",
      grade: "LIVE VERIFIED",
      body: "no",
    });
    assert.equal(liveCline.ok, false);
    assert.equal(liveCline.code, "LIVE_NOT_CARL");

    const next = accept({
      from: "goose",
      to: "grok",
      act: "HANDOFF",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: "no",
      next: "do-this",
    });
    assert.equal(next.ok, false);
    assert.equal(next.code, "FORBIDDEN_NEXT");

    const instruction = accept({
      from: "cohere",
      to: "grok",
      act: "HANDOFF",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: "no",
      instruction: "do-this",
    });
    assert.equal(instruction.ok, false);
    assert.equal(instruction.code, "FORBIDDEN_NEXT");
  });

  it("GUEST_CAP counts runtime extras only; declared guests do not fill the cap", () => {
    assert.equal(isAgent("kimi"), true);
    assert.equal(isAgent("goose"), true);
    for (let i = 0; i < 8; i++) {
      const r = connectAgent({ id: `extra-${i}`, name: `Extra ${i}` });
      assert.equal(r.ok, true, r.error);
    }
    const full = connectAgent({ id: "overflow-ia", name: "Overflow" });
    assert.equal(full.ok, false);
    assert.equal(full.code, "ROSTER_FULL");
    const fromDeclared = accept({
      from: "kimi",
      to: "grok",
      act: "HANDOFF",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: "Declared guests stay addressable. Never QUANTUM.",
    });
    assert.equal(fromDeclared.ok, true);
    const tomorrow = accept({
      from: "extra-0",
      to: "github",
      act: "FINDING",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: "Runtime guest. Never QUANTUM.",
    });
    assert.equal(tomorrow.ok, true);
  });

  it("ai/ branch prefix is allowed; mesh.v0 stays an open pattern", () => {
    const branche = read(".github/workflows/branche.yml");
    const branches = read("BRANCHES.md");
    const hook = read(".githooks/pre-push");
    assert.match(branche, /ai\/\[a-z0-9-\]\+/);
    assert.match(branche, /une tête/);
    assert.match(branche, /une PR ouverte max/);
    assert.match(branches, /ai\/<piece>/);
    assert.match(hook, /ai\/\*/);
    const mesh = loadMeshSchema();
    assert.equal(mesh.properties.from.enum, undefined);
    assert.equal(mesh.properties.next, false);
    assert.equal(mesh.properties.instruction, false);
  });

  it("rejects invalid ids, reserved juge, and juge capability", () => {
    assert.equal(connectAgent({ id: "Astra" }).ok, false);
    assert.equal(connectAgent({ id: "" }).code, "BAD_ID");
    assert.equal(connectAgent({ id: "1kimi" }).code, "BAD_ID");
    assert.equal(connectAgent({ id: "juge" }).code, "RESERVED_ID");
    assert.equal(connectAgent({ id: "quantum" }).code, "RESERVED_ID");
    assert.equal(connectAgent({ id: "arbitre" }).code, "RESERVED_ID");
    const asJudge = connectAgent({
      id: "shadow-ia",
      name: "Shadow",
      capabilities: ["lu", "flux", "juge"],
    });
    assert.equal(asJudge.ok, false);
    assert.equal(asJudge.code, "NO_JUGE");
    const unknown = accept({
      from: "not-an-agent",
      to: "grok",
      act: "HANDOFF",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: "no",
    });
    assert.equal(unknown.ok, false);
    assert.equal(unknown.code, "UNKNOWN_AGENT");
  });

  it("guests are not models; keyed auto stays roster status=auto", () => {
    assert.equal(isModel("chatgpt"), true);
    assert.equal(isModel("fable"), true);
    assert.equal(isModel("kimi"), false);
    assert.equal(isModel("cline"), false);
    assert.equal(isModel("astra"), false);
    assert.equal(isModel("carl"), false);
    assert.equal(lookup("chatgpt").kind, "model");
    assert.equal(lookup("kimi").kind, "guest");
  });

  it("locked seats cannot be impersonated; guests still join by id", () => {
    assert.equal(speakerAllowed("carl", ""), true);
    assert.equal(speakerAllowed("carl", OWNER_ACTOR), true);
    assert.equal(speakerAllowed("grok", OWNER_ACTOR), true);
    assert.equal(speakerAllowed("carl", "stranger"), false);
    assert.equal(speakerAllowed("grok", "eve"), false);
    assert.equal(speakerAllowed("kimi", "eve"), true);
    assert.equal(speakerAllowed("cline", "anyone"), true);

    const spoof = accept({
      from: "carl",
      to: "grok",
      act: "RESULT",
      mode: "ECHANGE",
      grade: "LIVE VERIFIED",
      body: "no",
      actor: "stranger",
    });
    assert.equal(spoof.ok, false);
    assert.ok(spoof.code === "FROM_NOT_ACTOR" || spoof.code === "LIVE_NOT_CARL");

    const chefSpoof = accept({
      from: "grok",
      to: "chatgpt",
      act: "HANDOFF",
      mode: "PROPOSITION",
      grade: "PROPOSED",
      body: "Never QUANTUM.",
      actor: "stranger",
    });
    assert.equal(chefSpoof.ok, false);
    assert.equal(chefSpoof.code, "FROM_NOT_ACTOR");

    const guestOk = accept({
      from: "kimi",
      to: "grok",
      act: "HANDOFF",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: "Joined by identifier. Never QUANTUM.",
      actor: "stranger",
    });
    assert.equal(guestOk.ok, true);

    const carlLive = accept({
      from: "carl",
      to: "grok",
      act: "RESULT",
      mode: "ECHANGE",
      grade: "LIVE VERIFIED",
      body: "Carl on the thread.",
      actor: OWNER_ACTOR,
    });
    assert.equal(carlLive.ok, true);
  });

  it("declared is not connected; capabilities are not privileges; no secrets in git", () => {
    const roster = loadRoster();
    const raw = read("schema/agents.json");
    assert.doesNotMatch(raw, /sk-[a-zA-Z0-9]/);
    assert.doesNotMatch(raw, /"status"\s*:\s*"(connected|available|live)"/i);
    assert.match(roster.note, /not a connection/);
    assert.match(roster.note, /never write connected/);

    for (const row of roster.agents) {
      const status = String(row.status || "").toLowerCase();
      assert.notEqual(status, "connected", row.id);
      assert.notEqual(status, "available", row.id);
      assert.notEqual(status, "live", row.id);
      assert.notEqual(row.status, "LIVE VERIFIED", row.id);
    }

    for (const id of ["chatgpt", "gemini", "deepseek", "sonnet", "claude"]) {
      assert.equal(isAgent(id), true, id);
      assert.equal(gradesFor(id).includes("LIVE VERIFIED"), false, id);
      const live = accept({
        from: id,
        to: "grok",
        act: "RESULT",
        mode: "ECHANGE",
        grade: "LIVE VERIFIED",
        body: "no",
      });
      assert.equal(live.ok, false, id);
      assert.equal(live.code, "LIVE_NOT_CARL", id);
      const handoff = accept({
        from: id,
        to: "grok",
        act: "HANDOFF",
        mode: "ECHANGE",
        grade: "PROPOSED",
        body: "Declared identity. Never QUANTUM.",
      });
      assert.equal(handoff.ok, true, id);
    }

    const claude = lookup("claude");
    assert.equal(claude.kind, "guest");
    assert.equal(claude.locked, false);
    assert.equal(claude.status, "declared");
    assert.equal(isModel("claude"), false);

    for (const id of ["chatgpt", "deepseek", "sonnet"]) {
      const row = lookup(id);
      assert.equal(row.kind, "model", id);
      assert.equal(row.locked, true, id);
      assert.equal(row.status, "on-demand", id);
      assert.equal(isModel(id), true, id);
    }
    const gemini = lookup("gemini");
    assert.equal(gemini.kind, "model");
    assert.equal(gemini.locked, true);
    assert.equal(gemini.status, "auto");
    assert.equal(isModel("gemini"), true);

    const chatgpt = lookup("chatgpt");
    assert.ok(chatgpt.capabilities.includes("review"));
    assert.equal(gradesFor("chatgpt").includes("LIVE VERIFIED"), false);
    assert.equal(gradesFor("chatgpt").includes("CODE VERIFIED"), false);

    const reviewSrc = read(".github/swarm/review.mjs");
    assert.doesNotMatch(reviewSrc, /MODELS\.claude\b/);
    assert.doesNotMatch(reviewSrc, /id === ["']claude["']/);

    const meshBefore = read("schema/mesh.v0.json");
    assert.equal(read("schema/mesh.v0.json"), meshBefore);
  });

  it("runPass: every identity helps from specialty; same shape, same gesture; never LIVE", () => {
    const fluxSrc = read(".github/swarm/flux.mjs");
    assert.match(fluxSrc, /function focusOf/);
    assert.match(fluxSrc, /function runPass/);
    assert.doesNotMatch(fluxSrc, /id === ["']claude["']/);
    assert.doesNotMatch(fluxSrc, /id === ["']astra["']/);

    assert.equal(focusOf(lookup("llama")), "lu");
    assert.equal(focusOf(lookup("claude")), focusOf(lookup("llama")));
    assert.equal(focusOf(lookup("astra")), focusOf(lookup("llama")));
    assert.equal(focusOf(lookup("kimi")), focusOf(lookup("llama")));
    assert.equal(focusOf(lookup("cline")), "implement");
    assert.equal(focusOf(lookup("goose")), focusOf(lookup("cline")));
    assert.equal(focusOf(lookup("codex")), focusOf(lookup("cline")));
    assert.equal(focusOf(lookup("copilot")), "review");
    assert.equal(focusOf(lookup("opus")), focusOf(lookup("copilot")));
    assert.equal(focusOf(lookup("chatgpt")), "review");
    assert.equal(focusOf(lookup("gemini")), focusOf(lookup("chatgpt")));
    assert.equal(focusOf(lookup("deepseek")), focusOf(lookup("chatgpt")));
    assert.equal(focusOf(lookup("sonnet")), focusOf(lookup("chatgpt")));
    assert.equal(focusOf(lookup("grok")), "decide");
    assert.equal(focusOf(lookup("carl")), "judge");
    assert.equal(focusOf(lookup("ci")), "verify");
    assert.equal(lookup("codex").specialty, "agent");

    const empty = runPass({ topic: "  " });
    assert.equal(empty.ok, false);
    assert.equal(empty.code, "BODY_MISSING");

    const pass = runPass({ topic: "optimize the mesh", actor: OWNER_ACTOR });
    assert.equal(pass.ok, true, pass.error);
    const all = roster();
    assert.deepEqual(pass.skipped, ["carl"]);
    assert.equal(pass.packets.length, all.length - 1);
    const froms = pass.packets.map((p) => p.from);
    assert.equal(new Set(froms).size, froms.length);
    for (const id of ["claude", "chatgpt", "gemini", "deepseek", "astra", "cline", "codex"]) {
      assert.ok(froms.includes(id), id);
    }
    assert.equal(froms.includes("carl"), false);
    for (const p of pass.packets) {
      assert.notEqual(p.grade, "LIVE VERIFIED", p.from);
      assert.equal(p.preview, true);
      assert.equal(p.receipt, false);
      assert.equal(Object.hasOwn(p, "next"), false);
      assert.match(p.body, /Never QUANTUM/);
    }

    const claudeDraft = suggestContribution(lookup("claude"), "optimize the mesh");
    const llamaDraft = suggestContribution(lookup("llama"), "optimize the mesh");
    assert.equal(claudeDraft.act, llamaDraft.act);
    assert.equal(claudeDraft.mode, llamaDraft.mode);
    assert.equal(claudeDraft.grade, llamaDraft.grade);

    const meshBefore = read("schema/mesh.v0.json");
    assert.equal(read("schema/mesh.v0.json"), meshBefore);
  });
});
