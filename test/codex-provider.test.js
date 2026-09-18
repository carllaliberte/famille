import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  selectCodexProvider,
  wrapperShouldProxy,
  normalizeProvider,
} from "../scripts/codex-provider.mjs";
import {
  classifyAuth,
  extraCodexConfigArgs,
  buildCodexConfig,
  createIo,
} from "../scripts/codex-autonomous-worker.mjs";

describe("codex provider selection", () => {
  it("normalizes aliases", () => {
    assert.equal(normalizeProvider("OpenAI"), "openai");
    assert.equal(normalizeProvider("chatgpt"), "openai");
    assert.equal(normalizeProvider("codex"), "openai");
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
    assert.equal(sel.implicit, false);
  });

  it("openai requested without auth.json is unavailable even with OpenRouter key", () => {
    const sel = selectCodexProvider(
      { CODEX_PROVIDER: "openai", OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz" },
      { authPathExists: false },
    );
    assert.equal(sel.selected, "openai");
    assert.equal(sel.available, false);
    assert.equal(sel.use_openrouter_proxy, false);
    assert.equal(sel.auth_mode, "openai-auth-missing");
  });

  it("openrouter requested uses key path even if auth.json exists", () => {
    const sel = selectCodexProvider(
      { CODEX_PROVIDER: "openrouter", OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz" },
      { authPathExists: true },
    );
    assert.equal(sel.selected, "openrouter");
    assert.equal(sel.use_openrouter_proxy, true);
    assert.equal(sel.available, true);
    assert.equal(sel.auth_mode, "openrouter-api-key");
  });

  it("both secrets implicit keeps session path without proxy", () => {
    const sel = selectCodexProvider(
      { OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz" },
      { authPathExists: true },
    );
    assert.equal(sel.selected, "openai");
    assert.equal(sel.auth_mode, "chatgpt-codex-session+openrouter");
    assert.equal(sel.use_openrouter_proxy, false);
    assert.equal(sel.implicit, true);
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
});

describe("classifyAuth worker v10", () => {
  it("honors explicit openai: no openrouter config, no extra -c flags", () => {
    const io = createIo({
      env: {
        HOME: "/tmp/no-codex-home",
        CODEX_PROVIDER: "openai",
        OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz",
      },
      exists: (p) => String(p).endsWith("auth.json"),
      spawn: () => ({ status: 0, stdout: "codex-cli 0.153.4assert.match(wf, /inputs\\.provider \\|\\| vars\\.CODEX_PROVIDER \\|\\| 'auto'/);n" }),
    });
    const auth = classifyAuth(io);
    assert.equal(auth.provider_selected, "openai");
    assert.equal(auth.use_openrouter_proxy, false);
    assert.equal(auth.available, true);
    assert.equal(auth.method, "chatgpt-codex-session");
    assert.equal(extraCodexConfigArgs(io).length, 0);
    const cfg = buildCodexConfig(io, auth);
    assert.doesNotMatch(cfg, /model_provider = "openrouter"/);
  });

  it("honors explicit openrouter even when auth.json exists", () => {
    const io = createIo({
      env: {
        HOME: "/tmp/no-codex-home",
        CODEX_PROVIDER: "openrouter",
        OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz",
        CODEX_MAX_OUTPUT_TOKENS: "1024",
      },
      exists: (p) => String(p).endsWith("auth.json"),
      spawn: () => ({ status: 0, stdout: "codex-cli 0.153.4\n" }),
    });
    const auth = classifyAuth(io);
    assert.equal(auth.provider_selected, "openrouter");
    assert.equal(auth.use_openrouter_proxy, true);
    assert.equal(auth.path_exists, true);
    assert.ok(extraCodexConfigArgs(io).includes("model_max_output_tokens=1024"));
    const cfg = buildCodexConfig(io, auth);
    assert.match(cfg, /model_provider = "openrouter"/);
    assert.match(cfg, /model_max_output_tokens = 1024/);
  });
});

describe("codex wrapper routing", () => {
  it("openai provider execs real binary without proxy", () => {
    const dir = mkdtempSync(join(tmpdir(), "codex-wrap-"));
    const real = join(dir, "realbin");
    mkdirSync(real);
    const fake = join(real, "codex");
    writeFileSync(fake, "#!/usr/bin/env bash\necho REAL \"$@\"\n");
    chmodSync(fake, 0o755);
    const wrap = new URL("../scripts/codex", import.meta.url).pathname;
    const r = spawnSync(wrap, ["exec", "hello"], {
      env: {
        ...process.env,
        PATH: `${real}:${process.env.PATH || ""}`,
        ACORN_SYSTEM_MODE: "RUN",
        CODEX_PROVIDER: "openai",
        OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz",
      },
      encoding: "utf8",
    });
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /REAL exec hello/);
    assert.doesNotMatch(r.stderr + r.stdout, /OPENROUTER_BUDGET_PROXY_READY/);
  });

  it("--version still hits the real binary", () => {
    const dir = mkdtempSync(join(tmpdir(), "codex-wrap-"));
    const real = join(dir, "realbin");
    mkdirSync(real);
    const fake = join(real, "codex");
    writeFileSync(fake, "#!/usr/bin/env bash\necho codex-cli 0.153.4\n");
    chmodSync(fake, 0o755);
    const wrap = new URL("../scripts/codex", import.meta.url).pathname;
    const r = spawnSync(wrap, ["--version"], {
      env: {
        ...process.env,
        PATH: `${real}:/usr/bin:/bin`,
        CODEX_PROVIDER: "openrouter",
        OPENROUTER_API_KEY: "sk-or-v1-abcdefghijklmnopqrstuvwxyz",
      },
      encoding: "utf8",
    });
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout.trim(), "codex-cli 0.153.4");
  });
});

describe("workflow restore does not skip CODEX_AUTH_JSON because an OpenRouter key exists", () => {
  it("writes auth.json on openai even when OPENROUTER_API_KEY is in the same step", () => {
    const wf = fs.readFileSync(new URL("../.github/workflows/codex-autonomous-worker.yml", import.meta.url), "utf8");
    assert.match(wf, /provider:/);
    assert.match(wf, /default: "auto"/);
    assert.match(wf, /inputs\.provider \|\| vars\.CODEX_PROVIDER \|\| 'openrouter'/);
    assert.match(wf, /chmod 600/);
    assert.match(wf, /auth_present=/);
    assert.match(wf, /openai\|chatgpt\|codex/);
    assert.doesNotMatch(wf, /skipping ChatGPT Codex session/);
    assert.doesNotMatch(wf, /cat "\$HOME\/\.codex\/auth\.json"/);
    assert.doesNotMatch(wf, /echo "\$CODEX_AUTH_JSON"/);
    assert.doesNotMatch(wf, /CODEX_PROVIDER: openrouter\n/);
  });

  it("provider module source does not mention the session secret name", () => {
    const src = fs.readFileSync(new URL("../scripts/codex-provider.mjs", import.meta.url), "utf8");
    assert.doesNotMatch(src, /CODEX_AUTH_JSON/);
  });
});
