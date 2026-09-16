import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { errorSignature } from "../scripts/codex-autonomy.mjs";

describe("causal error signature", () => {
  it("prefers the 429 line over the stdin banner", () => {
    const banner = [
      "Reading additional input from stdin...",
      "OpenAI Codex v0.153.4",
      "model: cohere/north-mini-code:free",
      "ERROR: exceeded retry limit, last status: 429 Too Many Requests, request id: a3bf6ab07e495b05-YUL",
    ].join("\n");
    const sig = errorSignature({ category: "NETWORK", message: banner });
    assert.match(sig, /429/);
    assert.match(sig, /too many requests/);
    assert.doesNotMatch(sig, /reading additional input from stdin/);
  });
});
