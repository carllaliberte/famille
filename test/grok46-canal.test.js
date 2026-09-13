import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CANALS,
  MODELS,
  commandsIn,
  idsForDispatch,
  XAI_FALLBACK,
} from "../.github/swarm/review.mjs";

describe("grok46 canal beside preserved xai", () => {
  it("keeps grok-2 and adds grok-4.6 on the same secret", () => {
    assert.equal(CANALS.xai.model, "grok-2");
    assert.equal(CANALS.grok46.model, "grok-4.6");
    assert.equal(CANALS.xai.secret, "XAI_API_KEY");
    assert.equal(CANALS.grok46.secret, "XAI_API_KEY");
    assert.equal(MODELS.grok46.model, "grok-4.6");
    assert.deepEqual([...XAI_FALLBACK], ["grok-2", "grok-2-mini"]);
  });

  it("exposes /grok46 and dispatches both when XAI_API_KEY is set", () => {
    assert.deepEqual(commandsIn("/grok46"), ["grok46"]);
    const ids = idsForDispatch({ XAI_API_KEY: "k" });
    assert.ok(ids.includes("xai"));
    assert.ok(ids.includes("grok46"));
  });
});
