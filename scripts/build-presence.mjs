#!/usr/bin/env node
/**
 * ACORN BUILD PRESENCE
 * BUILD is a replaceable execution resource, not an authority.
 * File/workflow presence is DECLARED. Absence must not stop the rest of the runtime.
 */
export const BUILD_PRESENCE_VERSION = "build-presence.v1";

export const BUILD_DEPENDENT = Object.freeze([
  ".github/workflows/grok-build-bridge.yml",
  "PROMPT_GROK_BUILD.md",
]);

export const CONTINUES_WITHOUT_BUILD = Object.freeze([
  "scripts/cognitive-worker.mjs",
  ".github/swarm/cognition.mjs",
  "scripts/codex-autonomous-worker.mjs",
  "scripts/self-heal.mjs",
  "scripts/autonomous-runtime.mjs",
  "scripts/work-record.mjs",
  "scripts/tool-resolve.mjs",
]);

export function measureBuildPresence(env = process.env) {
  const available = String(env.ACORN_BUILD_AVAILABLE || "").toLowerCase() !== "false";
  return {
    v: BUILD_PRESENCE_VERSION,
    declared: true,
    configured: true,
    available,
    called: false,
    executed: false,
    live: false,
    dependent: [...BUILD_DEPENDENT],
    continues_without_build: [...CONTINUES_WITHOUT_BUILD],
    remaining_dependency: available
      ? "grok-build-bridge remains a replaceable /grok-build execution resource"
      : "BUILD marked unavailable; cognition, Codex worker, self-heal and autonomous runtime continue",
    auto_merge: false,
    authority: "carl",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(measureBuildPresence(), null, 2));
}
