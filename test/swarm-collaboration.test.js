import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSwarmComment, chooseCoordinator } from "../.github/swarm/collaborate.mjs";
import { collaborationState, synthesisPrompt } from "../.github/swarm/collaboration-engine.mjs";

describe("swarm collaboration", () => {
  it("parses successful independent findings and ignores skipped providers", () => {
    const body = [
      "## Swarm review — complementary, not a judgment",
      "",
      "### Gemini (`gemini-3.8-flash`)",
      "FINDING A",
      "EVIDENCE A",
      "",
      "### Haiku (`claude-3-haiku`)",
      "Skipped — missing HAIKU_API_KEY",
      "",
      "### OpenRouter (`google/gemini-2.5-flash`)",
      "FINDING B",
      "_Prompt: `.github/swarm/prompt.md`._",
    ].join("\n");
    assert.deepEqual(parseSwarmComment(body), [
      { label: "Gemini", model: "gemini-3.8-flash", text: "FINDING A\nEVIDENCE A" },
      { label: "OpenRouter", model: "google/gemini-2.5-flash", text: "FINDING B" },
    ]);
  });

  it("does not claim collective cognition with one successful source", () => {
    assert.equal(collaborationState([{ id: "gemini", text: "A" }]).collective, false);
  });

  it("marks two independent sources as collective and preserves provenance", () => {
    const state = collaborationState([
      { id: "gemini", text: "A" },
      { id: "haiku", text: "B" },
    ]);
    assert.equal(state.collective, true);
    assert.deepEqual(state.independent, ["gemini", "haiku"]);
    const prompt = synthesisPrompt([
      { id: "gemini", label: "Gemini", model: "g", text: "A" },
      { id: "haiku", label: "Haiku", model: "h", text: "B" },
    ]);
    assert.match(prompt, /PROVENANCE: gemini/);
    assert.match(prompt, /PROVENANCE: haiku/);
    assert.match(prompt, /Do not vote/);
    assert.match(prompt, /DISAGREEMENT/);
  });

  it("chooses a deterministic keyed coordinator", () => {
    const coordinator = chooseCoordinator(
      [{ id: "haiku", text: "B" }, { id: "gemini", text: "A" }],
      [{ id: "gemini" }, { id: "haiku" }],
    );
    assert.equal(coordinator.id, "gemini");
  });
});
