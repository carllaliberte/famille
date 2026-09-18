#!/usr/bin/env node
/**
 * Copy this file. Do not modify the Acorn core to add a future intelligence,
 * economic rail, machine, market, or organism.
 *
 * admitUnknown is the door. DISCOVERED ≠ AUTHORIZED ≠ LIVE.
 * A more powerful intelligence does not receive more authority.
 *
 *   node examples/universal-extension.mjs
 */
import {
  admitUnknown,
  admitEconomicRail,
  admitPhysical,
  federate,
  assertPowerDoesNotGrantAuthority,
  composeExecution,
  runArchitecturalQuestions,
  assertUniversalInvariant,
  resetUniversal,
} from "../scripts/acorn-universal-infrastructure.mjs";

export async function demonstrateUniversalExtension() {
  resetUniversal();
  const intelligence = admitUnknown({
    kind: "UNKNOWN_INTELLIGENCE",
    id: "example.future-intelligence",
    provider: "unknown-lab",
    model: "helix-9",
    adapter: {
      detect() { return { status: "DISCOVERED" }; },
      propose() { return { status: "PROPOSED" }; },
      test() { return { executed: false }; },
      measure() { return { observed: false }; },
    },
  });
  const rail = admitEconomicRail({ provider: "clearinghouse-unknown" });
  const robot = admitPhysical({ kind: "ROBOT", id: "example.field-arm", simulated: true });
  const federation = federate({
    a: { id: "example.org-a", tenant_id: "t-a" },
    b: { id: "example.org-b", tenant_id: "t-a", capabilities: ["analysis"] },
    permissions: ["FEDERATE"],
  });
  const power = assertPowerDoesNotGrantAuthority({
    capability_score: 1e9,
    previous_score: 1,
    actor: "example.future-intelligence",
  });
  const composed = composeExecution({
    projectId: "example.project",
    mode: "SIMULATION",
    authorized: false,
    nodes: [
      { id: "n1", role: "HUMAN", title: "Hold the decision", capability: "authority" },
      { id: "n2", role: "MODEL", title: "Propose", capability: "analysis", depends_on: ["n1"] },
      { id: "n3", role: "ROBOT", title: "Simulated motion", capability: "motion", depends_on: ["n2"], simulated: true },
    ],
  });
  const questions = runArchitecturalQuestions();
  const result = {
    intelligence_admitted: intelligence.admitted,
    intelligence_authorized: intelligence.authorized,
    rail_domain_modified: rail.domain_modified,
    robot_parallel_architecture: robot.parallel_architecture,
    federation_bypassed: federation.bypassed_contracts,
    power_granted_authority: power.authority_granted,
    composition_is_graph: composed.execution_graph === true,
    composition_is_prompt: composed.prompt === true,
    contaminates_reality: composed.contaminates_reality,
    core_modified: intelligence.core_modified,
    live: false,
    questions: questions.answers,
  };
  assertUniversalInvariant(result);
  return result;
}

const here = new URL(import.meta.url).pathname;
const argv1 = process.argv[1] ? String(process.argv[1]) : "";
if (argv1.endsWith("universal-extension.mjs") || here === argv1) {
  const result = await demonstrateUniversalExtension();
  console.log(JSON.stringify(result, null, 2));
}
