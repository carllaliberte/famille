import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it } from "node:test";
import {
  AGENTS,
  FLUX_VERSION,
  accept,
  connectAgent,
  formatEnvelope,
  gradesFor,
  isAgent,
  lookup,
  resetGuests,
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
});
