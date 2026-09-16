import test from "node:test";
import assert from "node:assert/strict";
import {
  PROMPT_TOKEN_MARGIN_LIMIT,
  estimateTokens,
  excerptTaskBody,
  taskPrompt,
  continuityBrief,
} from "../scripts/codex-task-prompt.mjs";

const SOVEREIGN = [
  "Never merge",
  "Never auto_merge",
  "HOLD_HUMAN",
  "Authority is Carl",
  "LIVE_VERIFIED",
];

test("excerpt keeps short bodies intact", () => {
  assert.equal(excerptTaskBody("keep"), "keep");
});

test("huge issue body is referenced, not pasted whole", () => {
  const body = "X".repeat(12000);
  const out = excerptTaskBody(body, "https://github.com/carllaliberte/famille/issues/513");
  assert.ok(out.length < 2000);
  assert.match(out, /issues\/513/);
  assert.doesNotMatch(out, /X{2000}/);
});

test("produced prompt stays under the 10384-token margin and keeps invariants", () => {
  const huge = "RULE dump ".repeat(4000);
  const memory = {
    measurements: [{ status: "CODEX_FAILED", sha: "abc", patch_source: "none" }],
    error_signatures: [{
      category: "NETWORK",
      signature: "NETWORK::reading additional input from stdin... ".repeat(40),
      count: 8,
    }],
    failed_tasks: [{ number: 513, status: "CODEX_FAILED" }],
    last_main_sha: "abc",
    last_model: "google/gemini-2.5-flash",
    carl_request: "task #560",
  };
  const prompt = taskPrompt({
    number: 513,
    title: "keep the Acorn coding loop moving",
    url: "https://github.com/carllaliberte/famille/issues/513",
    body: huge,
  }, "repair stream", memory);
  const tokens = estimateTokens(prompt);
  assert.ok(tokens <= PROMPT_TOKEN_MARGIN_LIMIT, `tokens ${tokens} > ${PROMPT_TOKEN_MARGIN_LIMIT}`);
  assert.ok(tokens < 10384);
  for (const line of SOVEREIGN) assert.match(prompt, new RegExp(line));
  assert.match(prompt, /docs\/ASTRA-CODEX\.md/);
  assert.match(prompt, /docs\/WORK-RECORD\.md/);
  assert.match(prompt, /docs\/live\.md/);
  assert.match(prompt, /issues\/513/);
  assert.match(prompt, /google\/gemini-2\.5-flash/);
  assert.ok(prompt.includes("truncated"));
  assert.doesNotMatch(prompt, /sk-or-/);
  assert.doesNotMatch(prompt, /OPENROUTER_API_KEY/);
  assert.doesNotMatch(prompt, /ghp_/);
});

test("continuity brief keeps the 404 signature used by existing worker tests", () => {
  assert.match(
    continuityBrief({
      measurements: [{ status: "CODEX_FAILED", sha: "ece90c4" }],
      error_signatures: [{ category: "ENVIRONMENT", message: "404 unavailable for free", count: 3 }],
      last_main_sha: "ece90c4",
    }),
    /404 unavailable for free/
  );
});
