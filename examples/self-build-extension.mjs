#!/usr/bin/env node
/**
 * Minimal extension example for a future intelligence.
 *
 * Copy this file. Do not modify scripts/acorn-self-build.mjs to add a
 * provider. admitExtension is the door. DISCOVERED ≠ AUTHORIZED ≠ LIVE.
 *
 *   node examples/self-build-extension.mjs
 */
import {
  admitExtension,
  resetSelfBuild,
  runSelfBuildLoop,
  assertSelfBuildInvariant,
  howAcornBuilds,
} from "../scripts/acorn-self-build.mjs";

export function makeAdapter({ id }) {
  return {
    detect() {
      return { id, status: "DISCOVERED", live: false };
    },
    propose() {
      return { id, status: "PROPOSED", authorized: false };
    },
    test() {
      return { generated: true, executed: false, passed: false };
    },
    measure() {
      return { observed: false, invented: false };
    },
  };
}

export async function demonstrateExtension() {
  resetSelfBuild();
  const adapter = makeAdapter({ id: "example.future-intelligence" });
  const admitted = admitExtension({
    kind: "INTELLIGENCE",
    id: "example.future-intelligence",
    adapter,
  });
  const loop = await runSelfBuildLoop({
    task: "Route a newly admitted intelligence without rewriting the core",
    required: ["analysis", "example-future-channel"],
    known: [{ name: "analysis", exists: true, available: false, reason: "CODE_PRESENT" }],
  });
  assertSelfBuildInvariant(loop);
  return {
    admitted,
    loop_status: loop.status,
    used: loop.used,
    authorized: loop.authorized,
    live: loop.live,
    how: howAcornBuilds().steps.map((s) => s.name),
    core_modified: admitted.core_modified,
  };
}

const here = new URL(import.meta.url).pathname;
const argv1 = process.argv[1] ? String(process.argv[1]) : "";
if (argv1.endsWith("self-build-extension.mjs") || here === argv1) {
  const result = await demonstrateExtension();
  console.log(JSON.stringify(result, null, 2));
}
