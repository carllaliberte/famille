import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  OPENROUTER_FREE_MODEL,
  resolveOpenRouterModel,
} from "../scripts/codex-openrouter-defaults.mjs";

describe("codex openrouter defaults", () => {
  it("retires nemotron free after measured 429", () => {
    assert.equal(OPENROUTER_FREE_MODEL, "cohere/north-mini-code:free");
    assert.equal(
      resolveOpenRouterModel({ CODEX_MODEL: "nvidia/nemotron-3.5-lightning:free" }),
      "cohere/north-mini-code:free",
    );
  });
  it("honors an explicit live model instead of forcing :free", () => {
    assert.equal(
      resolveOpenRouterModel({ CODEX_MODEL: "google/gemini-2.5-flash" }),
      "google/gemini-2.5-flash",
    );
  });
});
