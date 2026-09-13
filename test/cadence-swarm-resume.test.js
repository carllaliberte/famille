import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const cadence = readFileSync(
  new URL("../.github/workflows/cadence.yml", import.meta.url),
  "utf8",
);
const swarm = readFileSync(
  new URL("../.github/workflows/swarm.yml", import.meta.url),
  "utf8",
);

describe("cadence resumes swarm after merge", () => {
  it("dispatches swarm.yml on the merged SHA", () => {
    assert.match(cadence, /gh workflow run swarm\.yml/);
    assert.match(cadence, /ref=\$\{SHA\}/);
    assert.match(cadence, /actions: write/);
    assert.match(cadence, /auto_merge false/);
    assert.doesNotMatch(cadence, /auto-merge:\s*true/);
  });

  it("does not let swarm retrigger cadence", () => {
    assert.doesNotMatch(swarm, /workflow_run:/);
    assert.doesNotMatch(swarm, /gh workflow run cadence/);
    assert.match(swarm, /github-actions\[bot\]/);
  });

  it("does not mask a swarm job with continue-on-error", () => {
    assert.doesNotMatch(swarm, /continue-on-error:\s*true/);
    assert.match(swarm, /node \.github\/swarm\/review\.mjs/);
  });
});
