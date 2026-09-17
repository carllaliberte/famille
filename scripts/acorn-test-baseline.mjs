#!/usr/bin/env node
/**
 * Classify measured test failures. Absence of proof is UNKNOWN, never green.
 * Does not hide a failure and does not alter constitutional behavior.
 */
export const TEST_BASELINE_VERSION = "acorn.test-baseline.v1";

export const CLASSES = Object.freeze([
  "NEW",
  "PRE_EXISTING",
  "ENVIRONMENT",
  "AUTH",
  "PROVIDER",
  "RESOURCE",
  "TEST_DRIFT",
  "REAL_REGRESSION",
]);

/** Failures measured on main SHA 6824eee after #667. Not a seal. */
export const KNOWN_ON_MAIN_6824EEE = Object.freeze([
  {
    name: "writes auth.json on openai even when OPENROUTER_API_KEY is in the same step",
    file: "test/codex-provider.test.js",
    class: "TEST_DRIFT",
    note: "workflow no longer defaults provider to openrouter; secrets remain Carl-only",
  },
  {
    name: "workflow restore does not skip CODEX_AUTH_JSON because an OpenRouter key exists",
    file: "test/codex-provider.test.js",
    class: "AUTH",
    note: "CODEX_AUTH_JSON is a Carl secret; not invented here",
  },
  {
    name: "worker dispatch continues across fronts and records exact failures",
    file: "test/cognitive-worker-dispatch.test.js",
    class: "PRE_EXISTING",
    note: "dispatch mock no longer sees two fronts; worker constitution unchanged",
  },
  {
    name: "security: accelerator discovery never becomes merge/write",
    file: "test/cortex-acceleration.test.js",
    class: "TEST_DRIFT",
    note: "fail-closed breaker early-return omitted gates; completed without claiming LIVE",
  },
  {
    name: "organism wires futures without a second Cortex or LIVE",
    file: "test/cortex-acceleration.test.js",
    class: "TEST_DRIFT",
    note: "same fail-closed early-return hole",
  },
  {
    name: "failover without fencing is refused",
    file: "test/cortex-continuity.test.js",
    class: "TEST_DRIFT",
    note: "unset breaker is fail-closed AMBIGUOUS, not assumed RUN",
  },
  {
    name: "fencing plus verified standby can fail over without transferring authority",
    file: "test/cortex-continuity.test.js",
    class: "TEST_DRIFT",
    note: "unset breaker is fail-closed AMBIGUOUS, not assumed RUN",
  },
  {
    name: "routing is capability-oriented and provider-neutral",
    file: "test/cortex-core.test.js",
    class: "REAL_REGRESSION",
    note: "candidates listed every resource instead of covering capabilities",
  },
  {
    name: "Cortex refuses verification when the defensive boundary is ambiguous",
    file: "test/cortex-core.test.js",
    class: "TEST_DRIFT",
    note: "defense never HOLD_HUMAN after #664; Cortex still must refuse VERIFIED",
  },
  {
    name: "lanes classify ollama and github-models as keyless, :free as free, others paid",
    file: "test/inference-lanes.test.js",
    class: "PRE_EXISTING",
    note: "github-models measured retired; not resurrected to green a test",
  },
  {
    name: "GITHUB_TOKEN selects GitHub Models without a paid API key",
    file: "test/inference-lanes.test.js",
    class: "PROVIDER",
    note: "retired channel; GITHUB_TOKEN is not invented connectivity",
  },
  {
    name: "FREE_FIRST skips paid when a keyless candidate exists",
    file: "test/intelligence-contract.test.js",
    class: "PRE_EXISTING",
    note: "routing policy unchanged; failure pre-exists on main",
  },
  {
    name: "OFF is fail-closed and invalid persisted state also becomes OFF",
    file: "test/system-breaker.test.js",
    class: "TEST_DRIFT",
    note: "empty env is OFF (assumed_open false); test still expected RUN",
  },
]);

export function inventoryProbe() {
  return {
    ok: true,
    version: TEST_BASELINE_VERSION,
    auto_merge: false,
    live: false,
    authority: "carl",
  };
}

export function classifyFailure(name, known = KNOWN_ON_MAIN_6824EEE) {
  const hit = known.find((row) => row.name === name);
  if (!hit) {
    return {
      name,
      class: "NEW",
      status: "UNKNOWN",
      live: false,
    };
  }
  return { ...hit, status: "CLASSIFIED", live: false };
}

export function classifySuite({ failures = [], known = KNOWN_ON_MAIN_6824EEE, mainSha = "UNKNOWN" } = {}) {
  const rows = failures.map((name) => classifyFailure(name, known));
  const counts = Object.fromEntries(CLASSES.map((name) => [name, 0]));
  for (const row of rows) counts[row.class] = (counts[row.class] || 0) + 1;
  return {
    version: TEST_BASELINE_VERSION,
    main_sha: mainSha,
    total: rows.length,
    counts,
    failures: rows,
    hidden: false,
    green_declared: false,
    auto_merge: false,
    live: false,
    authority: "carl",
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const listed = process.argv.slice(2);
  const result = classifySuite({
    failures: listed.length ? listed : KNOWN_ON_MAIN_6824EEE.map((row) => row.name),
    mainSha: process.env.ACORN_MAIN_SHA || "UNKNOWN",
  });
  console.log(JSON.stringify(result, null, 2));
}
