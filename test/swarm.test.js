import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  OPENROUTER_ROUTES,
  MODELS,
  XAI_FALLBACK,
  CANON_PATHS,
  commandsIn,
  parseTrigger,
  keyedModels,
  loadPrompt,
  loadCanon,
  buildUserMessage,
  sanitizeReview,
  formatComment,
  commentBodies,
  idsForComment,
  addressResult,
  shouldSkipComment,
  handoffIds,
  meshUser,
  envelopeAnchor,
  isQuotaOrMissing,
} from "../.github/swarm/review.mjs";
import {
  isMeshEnvelope,
  FLUX_VERSION,
  accept,
  formatEnvelope,
  parseFlux,
} from "../.github/swarm/flux.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("swarm roster", () => {
  it("names Sonnet 5, Fable 5, ChatGPT, DeepSeek, Gemini", () => {
    assert.equal(MODELS.sonnet.model, "claude-sonnet-5");
    assert.equal(MODELS.fable.model, "claude-fable-5");
    assert.equal(MODELS.chatgpt.model, "gpt-5.6-terra");
    assert.equal(MODELS.deepseek.model, "deepseek-v4-flash");
    assert.equal(MODELS.gemini.model, "gemini-3.8-flash");
    assert.equal(MODELS.fable.auto, false);
    assert.equal(MODELS.sonnet.auto, false);
    assert.equal(MODELS.haiku.auto, true);
    assert.equal(MODELS.xai.model, "grok-2");
    assert.equal(MODELS.fable.maxTokens, 8192);
    assert.ok(MODELS.fable.maxTokens > MODELS.sonnet.maxTokens);
  });
});

describe("parseTrigger", () => {
  it("defaults to auto models — not Fable", () => {
    const ids = parseTrigger("", []);
    assert.deepEqual(ids, ["gemini", "haiku"]);
    assert.ok(!ids.includes("fable"));
    assert.ok(!ids.includes("xai"));
    assert.ok(!ids.includes("sonnet"));
  });

  it("maps /fable and /fabre and label fable to Fable 5", () => {
    assert.deepEqual(parseTrigger("/fable please", []), ["fable"]);
    assert.deepEqual(parseTrigger("please /fabre", []), ["fable"]);
    assert.deepEqual(parseTrigger("", [{ name: "fable" }]), ["fable"]);
  });

  it("maps /chatgpt /deepseek /gemini /sonnet /swarm", () => {
    assert.deepEqual(parseTrigger("/chatgpt", []), ["chatgpt"]);
    assert.deepEqual(parseTrigger("/deepseek", []), ["deepseek"]);
    assert.deepEqual(parseTrigger("/gemini", []), ["gemini"]);
    assert.deepEqual(parseTrigger("/sonnet", []), ["sonnet"]);
    assert.deepEqual(parseTrigger("/swarm", []), ["gemini", "haiku"]);
  });

  it("does not treat .github/swarm paths as /swarm", () => {
    assert.deepEqual(commandsIn("see .github/swarm/prompt.md"), []);
    assert.deepEqual(commandsIn("https://example.com/swarm.yml"), []);
    assert.deepEqual(
      parseTrigger("see .github/swarm/prompt.md", [], "issue_comment"),
      [],
    );
  });

  it("labeled non-fable does not auto-run; labeled fable is Fable only", () => {
    assert.deepEqual(parseTrigger("", [], "pull_request", "labeled", "docs"), []);
    assert.deepEqual(
      parseTrigger("", [], "pull_request", "labeled", "fable"),
      ["fable"],
    );
  });

  it("issue_comment without a slash token does not default to auto", () => {
    assert.deepEqual(parseTrigger("looks good", [], "issue_comment"), []);
  });
});

describe("flux addressing on comments", () => {
  it("routes /flux to:chatgpt to ChatGPT only", () => {
    const r = idsForComment("/flux to:chatgpt from:grok", [], "issue_comment");
    assert.equal(r.flux.from, "grok");
    assert.equal(r.flux.to, "chatgpt");
    assert.deepEqual(r.ids, ["chatgpt"]);
  });

  it("broadcast /flux to:* is auto models, not Fable", () => {
    const r = idsForComment("/flux to:*", [], "issue_comment");
    assert.deepEqual(r.ids, ["gemini", "haiku"]);
  });

  it("to:carl stores envelope and calls no model", () => {
    const r = idsForComment(
      "FLUX from:grok to:carl act:HANDOFF grade:PROPOSED\nYour merge.",
      [],
      "issue_comment",
    );
    assert.equal(r.flux.to, "carl");
    assert.deepEqual(r.ids, []);
  });

  it("to:kimi (declared guest) stores envelope and calls no keyed model", () => {
    const r = idsForComment(
      "FLUX from:kimi to:grok act:HANDOFF grade:PROPOSED\nJoined by id.",
      [],
      "issue_comment",
    );
    assert.equal(r.flux.from, "kimi");
    assert.equal(r.flux.to, "grok");
    assert.deepEqual(r.ids, []);
  });

  it("FLUX header wins over a /flux example in the body", () => {
    const r = idsForComment(
      "FLUX from:grok to:github act:HANDOFF\n\nexample: /flux to:chatgpt from:grok\n",
      [],
      "issue_comment",
    );
    assert.equal(r.flux.from, "grok");
    assert.equal(r.flux.to, "github");
    assert.deepEqual(r.ids, []);
  });

  it("wraps a model FINDING as a flux envelope back to the speaker", () => {
    const out = addressResult(
      {
        id: "chatgpt",
        label: "ChatGPT",
        model: "gpt-5.6-terra",
        text: "Do not wrangler. Never QUANTUM. FILE.md is the canal.",
      },
      "grok",
    );
    assert.match(
      out.text,
      /^FLUX from:chatgpt to:grok act:FINDING mode:CHALLENGE grade:PROPOSED/m,
    );
    assert.match(out.text, /path: flux\/challenge\/chatgpt-to-grok\.md/);
    assert.match(out.text, /chef: grok/);
    assert.match(out.text, /preview:true/);
  });
});

describe("keyedModels fail-closed", () => {
  it("skips every model when secrets are absent", () => {
    const { run, skip } = keyedModels(
      ["sonnet", "fable", "chatgpt", "deepseek", "gemini"],
      {},
    );
    assert.equal(run.length, 0);
    assert.equal(skip.length, 5);
    assert.ok(skip.every((s) => /missing /.test(s.reason)));
  });

  it("runs Sonnet and Fable from the same Anthropic key", () => {
    const { run, skip } = keyedModels(["sonnet", "fable", "chatgpt"], {
      ANTHROPIC_API_KEY: "sk-ant-test",
    });
    assert.deepEqual(
      run.map((m) => m.id),
      ["sonnet", "fable"],
    );
    assert.equal(skip.length, 1);
    assert.equal(skip[0].id, "chatgpt");
  });

  it("OPENROUTER_API_KEY runs gemini only at $0 cadence", () => {
    const { run, skip } = keyedModels(
      ["sonnet", "fable", "chatgpt", "deepseek", "gemini", "haiku", "llama", "qwen", "xai"],
      { OPENROUTER_API_KEY: "or-test" },
    );
    assert.deepEqual(
      run.map((m) => m.id),
      ["gemini"],
    );
    assert.ok(run.every((m) => m.via === "openrouter"));
    assert.equal(
      skip.map((s) => s.id).join(","),
      "sonnet,fable,chatgpt,deepseek,haiku,llama,qwen,xai",
    );
    assert.equal(OPENROUTER_ROUTES.gemini, "google/gemini-2.5-flash");
    assert.equal(MODELS.llama.auto, false);
    assert.equal(MODELS.deepseek.auto, false);
    assert.equal(MODELS.gemini.auto, true);
    assert.equal(MODELS.sonnet.auto, false);
  });

  it("slash exists for future guests without a canal; HTTP stays skip", () => {
    assert.deepEqual(parseTrigger("/codex", []), ["codex"]);
    assert.deepEqual(parseTrigger("/cline", []), ["cline"]);
    assert.deepEqual(parseTrigger("/goose", []), ["goose"]);
    const { run, skip } = keyedModels(["codex", "cline", "goose"], {
      GEMINI_API_KEY: "gem-test",
    });
    assert.equal(run.length, 0);
    assert.equal(skip.length, 0);
  });

  it("404 and 402 skip silently", () => {
    assert.equal(isQuotaOrMissing(new Error("openrouter llama 404: gone")), true);
    assert.equal(isQuotaOrMissing(new Error("openrouter chatgpt 402: credits")), true);
    assert.equal(isQuotaOrMissing(new Error("xai 400: Model not found")), true);
    assert.equal(isQuotaOrMissing(new Error("xai 403: denied")), true);
    assert.equal(isQuotaOrMissing(new Error("openrouter gemini 503: busy")), true);
    assert.equal(isQuotaOrMissing(new Error("openrouter x 500: boom")), false);
  });

  it("native key wins over OpenRouter", () => {
    const { run, skip } = keyedModels(["gemini", "sonnet"], {
      GEMINI_API_KEY: "gem-test",
      OPENROUTER_API_KEY: "or-test",
    });
    assert.equal(run.find((m) => m.id === "gemini").via, undefined);
    assert.equal(run.find((m) => m.id === "gemini").provider, "gemini");
    assert.equal(run.find((m) => m.id === "sonnet"), undefined);
    assert.match(skip.find((s) => s.id === "sonnet").reason, /ANTHROPIC_API_KEY/);
  });

  it("XAI_API_KEY is an optional native slot, not chef grok", () => {
    assert.equal(MODELS.xai.model, "grok-2");
    assert.deepEqual([...XAI_FALLBACK], ["grok-2", "grok-2-mini"]);
    assert.equal(MODELS.xai.id, "xai");
    assert.equal(MODELS.xai.secret, "XAI_API_KEY");
    assert.equal(MODELS.xai.auto, false);
    const { run, skip } = keyedModels(["xai", "grok"], { XAI_API_KEY: "xai-test" });
    assert.equal(run.length, 1);
    assert.equal(run[0].id, "xai");
    assert.equal(run[0].provider, "xai");
    assert.equal(skip.length, 0);
  });
});

describe("prompt locks", () => {
  it("reviews FILE.md + schema + docs and forbids wrangler, merge, PRÉSENT", () => {
    const p = loadPrompt();
    assert.match(p, /not the judge/i);
    assert.match(p, /Carl/);
    assert.match(p, /FILE\.md/);
    assert.match(p, /schema/);
    assert.match(p, /Never QUANTUM/);
    assert.match(p, /LIVE VERIFIED/);
    assert.match(p, /PRÉSENT/);
    assert.match(p, /acorn-royal-dune-blend\.grok\.me/);
    assert.match(p, /Never wrangler/i);
    assert.match(p, /Never approve merge/);
    assert.match(p, /Collage apps are dead/);
    assert.match(p, /ville\/…/);
    assert.match(p, /cursor\/…/);
    assert.match(p, /Flux is \*\*not\*\* a Worker canal/);
    assert.match(p, /schema\/mesh\.v0\.json/);
    assert.match(p, /Two flux layers/);
    assert.match(p, /One hop/);
    assert.match(p, /bare `FLUX from:`/);
    assert.match(p, /Security flux/);
    assert.match(p, /OPENROUTER_API_KEY/);
    assert.match(p, /XAI_API_KEY/);
    assert.match(p, /grok-2-mini/);
    assert.match(p, /operates\*\* the security system/);
    assert.doesNotMatch(p, /parler à travers cette page/i);
  });
});

describe("canon FILE.md + schema + docs", () => {
  it("lists FILE.md, AUTOMATION.md, and schema files", () => {
    assert.deepEqual(CANON_PATHS, [
      "FILE.md",
      "AUTOMATION.md",
      "INTEROP-IA.md",
      "schema/juge.v0.json",
      "schema/flux.v0.json",
      "schema/mesh.v0.json",
      "schema/agents.v0.json",
      "schema/agents.json",
      "schema/README.md",
      "schema/cognition.v0.json",
      "schema/kernel.v0.json",
      "docs/quantum-bridge.md",
    ]);
  });

  it("loads canon from the repo root", () => {
    const canon = loadCanon(ROOT);
    const map = Object.fromEntries(canon.map((c) => [c.path, c.text]));
    assert.match(map["FILE.md"], /Collage apps = mort/);
    assert.match(map["FILE.md"], /état, pas un canal/);
    assert.match(map["FILE.md"], /schema\/mesh\.v0\.json/);
    assert.match(map["FILE.md"], /schema\/agents\.json/);
    assert.doesNotMatch(map["FILE.md"], /parler à travers cette page/);
    assert.doesNotMatch(map["FILE.md"], /action suivante/);
    assert.match(map["AUTOMATION.md"], /commentaires de PR \+ FILE\.md/);
    assert.match(map["AUTOMATION.md"], /n'est plus le messager/);
    assert.match(map["AUTOMATION.md"], /Vérité structurée/);
    assert.match(map["AUTOMATION.md"], /Un `from` par enveloppe/);
    assert.match(map["schema/juge.v0.json"], /exclusiveMinimum/);
    assert.match(map["schema/flux.v0.json"], /famille\.flux\.v0/);
    assert.match(map["schema/mesh.v0.json"], /acorn\.v0/);
    assert.match(map["schema/agents.v0.json"], /famille\.agents\.v0/);
    assert.match(map["schema/agents.json"], /agents\.v0/);
    assert.match(map["INTEROP-IA.md"], /Deux couches/);
    assert.match(map["INTEROP-IA.md"], /schema\/flux\.v0\.json/);
    assert.match(map["INTEROP-IA.md"], /schema\/mesh\.v0\.json/);
    assert.match(map["INTEROP-IA.md"], /acorn\.v0/);
    assert.match(map["INTEROP-IA.md"], /enveloppe nue/);
    assert.match(map["INTEROP-IA.md"], /en \/ en-CA/);
    assert.doesNotMatch(map["INTEROP-IA.md"], /Packs lieu : `fr-CA` · `en-CA`/);
    assert.match(map["INTEROP-IA.md"], /Toujours ouverts/);
    assert.match(map["INTEROP-IA.md"], /toujours ouverts/);
    assert.match(map["INTEROP-IA.md"], /activer les IA dormantes/);
    assert.match(map["INTEROP-IA.md"], /Ne pas laisser idle/);
    assert.match(map["INTEROP-IA.md"], /Rejoindre le mesh/);
    assert.match(map["INTEROP-IA.md"], /schema\/agents\.json/);
    const assign = readFileSync(join(ROOT, "ASSIGN.md"), "utf8");
    assert.match(assign, /Interop commune/);
    assert.match(assign, /toujours ouverts/);
  });

  it("buildUserMessage includes FILE.md canon and the diff", () => {
    const msg = buildUserMessage({
      title: "docs",
      body: "n",
      files: ["FILE.md", "schema/juge.v0.json"],
      diff: "horizon calendar",
      canon: loadCanon(ROOT),
    });
    assert.match(msg, /FILE\.md/);
    assert.match(msg, /schema\/juge\.v0\.json/);
    assert.match(msg, /horizon calendar/);
    assert.match(msg, /Do not wrangler/);
    assert.match(msg, /Do not merge/);
  });
});

describe("sanitize and format", () => {
  it("annotates a review that says QUANTUM, LIVE VERIFIED, or PRÉSENT", () => {
    const out = sanitizeReview("This is LIVE VERIFIED QUANTUM. PRÉSENT.");
    assert.match(out, /forbids QUANTUM/);
    assert.match(out, /PRÉSENT/);
  });

  it("formatComment stays a comment, not a merge", () => {
    const text = formatComment({
      run: [],
      skip: [{ id: "sonnet", reason: "missing ANTHROPIC_API_KEY" }],
      results: [],
    });
    assert.match(text, /not a judgment/);
    assert.match(text, /FILE\.md \+ schema \+ docs/);
    assert.match(text, /ANTHROPIC_API_KEY/);
    assert.match(text, /Never merge/);
    assert.match(text, /kernel\.v0/);
    assert.match(text, /CHANNEL NOT PRESENT/);
    assert.match(text, /auto_merge false/);
    assert.doesNotMatch(text, /wrangler deploy/);
  });
});

describe("workflow locks", () => {
  it("swarm.yml never merges and never wranglers", () => {
    const yml = readFileSync(join(ROOT, ".github/workflows/swarm.yml"), "utf8");
    assert.match(yml, /Never merge/);
    assert.match(yml, /Never wrangler/);
    assert.match(yml, /FILE\.md \+ schema \+ docs/);
    assert.match(yml, /contents: read/);
    assert.doesNotMatch(yml, /wrangler deploy/);
    assert.doesNotMatch(yml, /gh pr merge/);
    assert.match(yml, /OPENROUTER_API_KEY/);
    assert.match(yml, /XAI_API_KEY/);
    assert.match(yml, /node \.github\/swarm\/review\.mjs/);
    assert.doesNotMatch(yml, /run: node review\.mjs/);
    assert.match(yml, /types: \[opened, synchronize, reopened/);
    assert.match(yml, /steps\.ref\.outputs\.sha/);
  });

  it("branch name cursor/swarm-famille is allowed", () => {
    const re =
      /^(ville\/(juge|conso|preview|sdk|rente|garde)-[a-z0-9-]+|ville\/noms|cursor\/[a-z0-9-]+)$/;
    assert.match("cursor/swarm-famille", re);
    assert.match("ville/juge-swarm", re);
    assert.doesNotMatch("docs/swarm", re);
    assert.doesNotMatch("main", re);
  });
});

describe("mesh interoperability", () => {
  it("shares acorn.v0 with acorn-juge and does not collide with carte flux", () => {
    assert.equal(FLUX_VERSION, "acorn.v0");
    const mesh = JSON.parse(
      readFileSync(join(ROOT, "schema/mesh.v0.json"), "utf8"),
    );
    const carte = JSON.parse(
      readFileSync(join(ROOT, "schema/flux.v0.json"), "utf8"),
    );
    assert.equal(mesh.properties.flux.const, "acorn.v0");
    assert.equal(carte.title, "famille.flux.v0");
    assert.notEqual(mesh.title, carte.title);
  });

  it("skips github-actions bot and own swarm comments (no loop)", () => {
    assert.equal(
      shouldSkipComment({ actor: "github-actions[bot]", comment: "/flux to:chatgpt" }),
      true,
    );
    assert.equal(
      shouldSkipComment({ actor: "carllaliberte", comment: "/flux to:chatgpt from:grok" }),
      false,
    );
    assert.equal(
      shouldSkipComment({
        actor: "Copilot",
        comment: "/flux to:chatgpt from:copilot",
      }),
      false,
    );
    assert.equal(
      shouldSkipComment({
        actor: "copilot-pull-request-reviewer[bot]",
        comment: "/flux to:chatgpt from:copilot",
      }),
      false,
    );
    assert.equal(
      shouldSkipComment({
        actor: "carllaliberte",
        comment: "## Swarm review — complementary, not a judgment\n",
      }),
      true,
    );
  });

  it("does not echo an envelope that is already filed", () => {
    assert.equal(isMeshEnvelope("hello"), false);
    assert.equal(
      isMeshEnvelope("FLUX from:grok to:carl\n\n_flux acorn.v0 · chef:grok_"),
      true,
    );
  });

  it("workflow listens to /flux and ignores the actions bot", () => {
    const yml = readFileSync(join(ROOT, ".github/workflows/swarm.yml"), "utf8");
    assert.match(yml, /\/flux/);
    assert.match(yml, /FLUX from:/);
    assert.match(yml, /github-actions\[bot\]/);
  });

  it("handoffIds reads /flux to:peer from raw review, never fable or self", () => {
    assert.deepEqual(
      handoffIds("FINDING ok\n/flux to:deepseek from:sonnet", "sonnet"),
      ["deepseek"],
    );
    assert.deepEqual(handoffIds("ok\n/flux to:fable from:sonnet", "sonnet"), []);
    assert.deepEqual(handoffIds("/flux to:sonnet from:chatgpt", "sonnet"), []);
    assert.deepEqual(handoffIds("no address here", "sonnet"), []);
  });

  it("mesh comments are bare envelopes; auto review stays wrapped", () => {
    const envBody =
      "FLUX from:chatgpt to:grok act:FINDING mode:CHALLENGE grade:PROPOSED\n\n_flux acorn.v0 · chef:grok_";
    const mesh = commentBodies("mesh", {
      results: [{ id: "chatgpt", text: envBody }],
    });
    assert.equal(mesh.length, 1);
    assert.match(mesh[0], /^FLUX from:chatgpt/);
    assert.doesNotMatch(mesh[0], /## Swarm review/);
    const silent = commentBodies("mesh", {
      results: [{ id: "sonnet", skipped: true, reason: "missing ANTHROPIC_API_KEY" }],
    });
    assert.deepEqual(silent, []);
    const wrapped = commentBodies("review", {
      run: [],
      skip: [],
      results: [
        { id: "chatgpt", label: "ChatGPT", model: "gpt-5.6-terra", text: "hi" },
      ],
    });
    assert.match(wrapped[0], /## Swarm review/);
  });

  it("meshUser names the wire and forbids the carte flux schema", () => {
    const msg = meshUser("PR title: x", {
      from: "grok",
      to: "chatgpt",
      act: "HANDOFF",
      grade: "PROPOSED",
    });
    assert.match(msg, /as chatgpt by grok/);
    assert.match(msg, /schema\/mesh\.v0\.json/);
    assert.match(msg, /not schema\/flux\.v0\.json/);
    assert.match(msg, /One hop/);
  });
});

describe("mesh trace — FILE.md is state, envelope is the log", () => {
  const SHA = "0123456789abcdef0123456789abcdef01234567";

  it("schema names ts, sha, pr and unique from; forbids next and instruction", () => {
    const mesh = JSON.parse(
      readFileSync(join(ROOT, "schema/mesh.v0.json"), "utf8"),
    );
    assert.equal(mesh.properties.from.description.includes("Unique writer"), true);
    assert.ok(mesh.properties.ts);
    assert.ok(mesh.properties.sha);
    assert.ok(mesh.properties.pr);
    assert.equal(mesh.properties.instruction, false);
    assert.equal(mesh.properties.next, false);
    assert.deepEqual(mesh.required, ["from", "to", "act", "mode", "grade", "body"]);
    assert.ok(mesh.not.anyOf.some((c) => c.required?.includes("next")));
    assert.ok(mesh.not.anyOf.some((c) => c.required?.includes("instruction")));
    assert.match(mesh.description, /FILE.md is state/);
    assert.match(mesh.description, /Forbids next and instruction/);
  });

  it("valid envelope with from+ts+sha+pr passes; next or instruction fails", () => {
    const base = {
      from: "grok",
      to: "chatgpt",
      act: "HANDOFF",
      mode: "PROPOSITION",
      grade: "PROPOSED",
      body: "Never QUANTUM. FILE.md is state.",
      ts: "2026-09-06T22:42:00.000Z",
      sha: SHA,
      pr: 185,
    };
    const ok = accept(base);
    assert.equal(ok.ok, true);
    assert.equal(ok.packet.from, "grok");
    assert.equal(ok.packet.ts, "2026-09-06T22:42:00.000Z");
    assert.equal(ok.packet.sha, SHA);
    assert.equal(ok.packet.pr, 185);
    const withNext = accept({ ...base, next: "do-this" });
    assert.equal(withNext.ok, false);
    assert.equal(withNext.code, "FORBIDDEN_NEXT");
    const withInstruction = accept({ ...base, instruction: "do-this" });
    assert.equal(withInstruction.ok, false);
    assert.equal(withInstruction.code, "FORBIDDEN_NEXT");
  });

  it("accept stamps ISO ts and keeps sha/pr as pointers", () => {
    const r = accept({
      from: "grok",
      to: "chatgpt",
      act: "HANDOFF",
      mode: "PROPOSITION",
      grade: "PROPOSED",
      body: "Never QUANTUM. FILE.md is state.",
      sha: SHA,
      pr: 170,
    });
    assert.equal(r.ok, true);
    assert.match(r.packet.ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    assert.equal(r.packet.sha, SHA);
    assert.equal(r.packet.pr, 170);
    assert.equal(r.packet.from, "grok");
  });

  it("formatEnvelope puts ts/sha/pr on the header; parseFlux round-trips", () => {
    const r = accept({
      from: "gemini",
      to: "grok",
      act: "FINDING",
      mode: "CHALLENGE",
      grade: "PROPOSED",
      body: "FILE.md is state. Never QUANTUM.",
      ts: "2026-09-06T17:42:00.000Z",
      sha: SHA,
      pr: 23,
    });
    const text = formatEnvelope(r.packet);
    assert.match(text, /ts:2026-09-06T17:42:00\.000Z/);
    assert.match(text, new RegExp(`sha:${SHA}`));
    assert.match(text, /pr:23/);
    const draft = parseFlux(text);
    assert.equal(draft.from, "gemini");
    assert.equal(draft.to, "grok");
    assert.equal(draft.ts, "2026-09-06T17:42:00.000Z");
    assert.equal(draft.sha, SHA);
    assert.equal(draft.pr, 23);
  });

  it("addressResult with anchor emits sha and pr", () => {
    const out = addressResult(
      {
        id: "chatgpt",
        label: "ChatGPT",
        model: "gpt-5.6-terra",
        text: "Do not wrangler. Never QUANTUM. FILE.md is the canal.",
      },
      "grok",
      { GITHUB_SHA: SHA, PR_NUMBER: "170" },
    );
    assert.match(out.text, new RegExp(`sha:${SHA}`));
    assert.match(out.text, /pr:170/);
    assert.match(out.text, /ts:\d{4}-\d{2}-\d{2}T/);
  });

  it("envelopeAnchor ignores short or missing sha", () => {
    assert.deepEqual(envelopeAnchor({}), {});
    assert.deepEqual(envelopeAnchor({ GITHUB_SHA: "abc", PR_NUMBER: "x" }), {});
    assert.deepEqual(envelopeAnchor({ GITHUB_SHA: SHA, PR_NUMBER: "12" }), {
      sha: SHA,
      pr: 12,
    });
  });
});
