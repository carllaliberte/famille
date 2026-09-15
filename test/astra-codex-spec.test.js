import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { taskPrompt } from "../scripts/codex-autonomous-worker.mjs";

test("Astra Codex spec keeps Grok Build product contract out of famille", () => {
  const spec = readFileSync("docs/ASTRA-CODEX.md", "utf8");
  assert.match(spec, /Grok Build specs/);
  assert.match(spec, /Les tenir ≠ les exécuter ici/);
  assert.match(spec, /carllaliberte\/famille/);
  assert.match(spec, /Bind `8080` \/ `startup\.sh`/);
  assert.doesNotMatch(spec, /must listen on 0\.0\.0\.0:8080/);
});

test("worker prompt forbids App Builder scaffold inside famille", () => {
  const prompt = taskPrompt({ number: 1, title: "t", body: "b", url: "u" });
  assert.match(prompt, /Never apply Grok Build App Builder product contracts/);
  assert.match(prompt, /8080/);
  assert.match(prompt, /docs\/ASTRA-CODEX\.md/);
});
