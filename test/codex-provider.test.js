import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  selectCodexProvider,
  wrapperShouldProxy,
  normalizeProvider,
} from "../scripts/codex-provider.mjs";
import { classifyAuth, extraCodexConfigArgs, buildCodexConfig, createIo } from "../scripts/codex-autonomous-worker.mjs";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("codex provider selection", () => {
  it("normalizes aliases", () => {
    assert.equal(normalizeProvider("OpenAI"), "openai");
    assert.equal(normalizeProvider("chatgpt"), "openai");
    assert.equal(normalizeProvider("openrouter"), "openrouter");
    assert.equal(normalizeProvider(""), "");
  });

  it("openai requested never selects openrouter because a key exists", () => {
    const sel = selectCodexProvider(
      { CODEX_PROVIDER: "openai", OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz" },
      { authPathExists: true },
    );
    assert.equal(sel.requested, "openai");
    assert.equal(sel.selected, "openai");
    assert.equal(sel.use_openrouter_proxy, false);
    assert.equal(sel.available, true);
    assert.equal(sel.auth_mode, "chatgpt-codex-session");
  });

  it("openai requested without auth.json is unavailable even with OpenRouter key", () => {
    const sel = selectCodexProvider(
      { CODEX_PROVIDER: "openai", OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz" },
      { authPathExists: false },
    );
    assert.equal(sel.selected, "openai");
    assert.equal(sel.available, false);
    assert.equal(sel.use_openrouter_proxy, false);
  });

  it("openrouter requested uses key path", () => {
    const sel = selectCodexProvider(
      { CODEX_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz" },
      { authPathExists: true },
    );
    assert.equal(sel.selected, "openrouter");
    assert.equal(sel.use_openrouter_proxy, true);
    assert.equal(sel.available, true);
  });

  it("both secrets implicit keeps session path without proxy", () => {
    const sel = selectCodexProvider(
      { OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz" },
      { authPathExists: true },
    );
    assert.equal(sel.selected, "openai");
    assert.equal(sel.auth_mode, "chatgpt-codex-session+openrouter");
    assert.equal(sel.use_openrouter_proxy, false);
  });

  it("absence of both secrets is unavailable", () => {
    const sel = selectCodexProvider({}, { authPathExists: false });
    assert.equal(sel.available, false);
    assert.equal(sel.selected, "none");
  });

  it("wrapperShouldProxy is false for openai even with key", () => {
    assert.equal(
      wrapperShouldProxy({ CODEX_PROVIDER: "openai", OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz" }, true),
      false,
    );
    assert.equal(
      wrapperShouldProxy({ CODEX_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz" }, true),
      true,
    );
  });

  it("classifyAuth honors explicit openai", () => {
    const io = createIo({
      env: {
        HOME: "/tmp/no-codex-home",
        CODEX_PROVIDER: "openai",
        OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz",
      },
      exists: (p) => String(p).endsWith("auth.json"),
      spawn: () => ({ status: 0, stdout: "codex-cli 0.153.4\n" }),
    });
    const auth = classifyAuth(io);
    assert.equal(auth.provider_selected, "openai");
    assert.equal(auth.use_openrouter_proxy, false);
    assert.equal(extraCodexConfigArgs(io).length, 0);
    const cfg = buildCodexConfig(io, auth);
    assert.doesNotMatch(cfg, /model_provider = "openrouter"/);
  });

  it("classifyAuth honors explicit openrouter", () => {
    const io = createIo({
      env: {
        HOME: "/tmp/no-codex-home",
        CODEX_PROVIDER: "openrouter",
        OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz",
        CODEX_MAX_OUTPUT_TOKENS: "1024",
      },
      exists: () => false,
      spawn: () => ({ status: 0, stdout: "codex-cli 0.153.4\n" }),
    });
    const auth = classifyAuth(io);
    assert.equal(auth.provider_selected, "openrouter");
    assert.ok(extraCodexConfigArgs(io).includes("model_max_output_tokens=1024"));
    const cfg = buildCodexConfig(io, auth);
    assert.match(cfg, /model_provider = "openrouter"/);
  });
});

describe("codex wrapper routing", () => {
  it("openai provider execs real binary without proxy", () => {
    const dir = mkdtempSync(join(tmpdir(), "codex-wrap-"));
    const real = join(dir, "realbin");
    fs.mkdirSync(real);
    const fake = join(real, "codex");
    writeFileSync(fake, "#!/usr/bin/env bash\necho REAL \"$@\"\n");
    chmodSync(fake, 0o755);
    const wrap = new URL("../scripts/codex", import.meta.url).pathname;
    const r = spawnSync(wrap, ["exec", "hello"], {
      env: { ...process.env, PATH: `${real}:/usr/bin`, CODEX_PROVIDER: "openai", OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz" },
      encoding: "utf8",
    });
    assert.equal(r.status, 0);
    assert.match(r.stdout, /REAL exec hello/);
    assert.doesNotMatch(r.stderr + r.stdout, /OPENROUTER_BUDGET_PROXY_READY/);
  });

  it("--version still hits the real binary", () => {
    const dir = mkdtempSync(join(tmpdir(), "codex-wrap-"));
    const real = join(dir, "realbin");
    fs.mkdirSync(real);
    const fake = join(real, "codex");
    writeFileSync(fake, "#!/usr/bin/env bash\necho codex-cli 0.153.4\n");
    chmodSync(fake, 0o755);
    const wrap = new URL("../scripts/codex", import.meta.url).pathname;
    const r = spawnSync(wrap, ["--version"], {
      env: { ...process.env, PATH: `${real}:/usr/bin`, CODEX_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz" },
      encoding: "utf8",
    });
    assert.equal(r.status, 0);
    assert.equal(r.stdout.trim(), "codex-cli 0.153.4");
  });
});

describe("no secret leakage in provider module source", () => {
  it("does not print env secret values", () => {
    const src = fs.readFileSync(new URL("../scripts/codex-provider.mjs", import.meta.url), "utf8");
    assert.doesNotMatch(src, /CODEX_AUTH_JSON/);
    const wf = fs.readFileSync(new URL("../.github/workflows/codex-autonomous-worker.yml", import.meta.url), "utf8");
    assert.match(wf, /chmod 600/);
    assert.doesNotMatch(wf, /cat "\$HOME\/\.codex\/auth\.json"/);
    assert.doesNotMatch(wf, /echo "\$CODEX_AUTH_JSON"/);
    assert.match(wf, /auth_present=/);
  });
});
