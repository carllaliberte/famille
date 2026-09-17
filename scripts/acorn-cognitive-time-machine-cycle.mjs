import {
  runCognitiveTimeMachineCycle,
  assertCognitiveTimeMachineInvariant,
  COGNITIVE_TIME_MACHINE_VERSION,
} from "./acorn-cognitive-time-machine.mjs";

export { COGNITIVE_TIME_MACHINE_VERSION };

export function runVerifiedCognitiveTimeMachineCycle(input = {}) {
  const raw = runCognitiveTimeMachineCycle(input);
  const invariant = assertCognitiveTimeMachineInvariant({
    ...raw,
    authority: "carl",
    authority_granted: false,
    breaker_bypass: false,
    auto_merge: false,
    live: false,
  });
  return Object.freeze({
    ...raw,
    status: invariant.status,
    invariant,
    authority: "carl",
    authority_granted: false,
    breaker_bypass: false,
    auto_merge: false,
    live: false,
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runVerifiedCognitiveTimeMachineCycle({
    reality: { state: { capacity: 5 }, at: "t0", source: "measured" },
    hypothesis: { question: "which future?", objective: "learn" },
    futures: [
      { action: "safe", delta: { capacity: 1 }, probability: .6, utility: 5 },
      { action: "experimental", delta: { capacity: 4 }, probability: .4, utility: 9, kind: "COUNTERFACTUAL" },
    ],
    observation: { state: { capacity: 6 }, at: "t1", source: "measured" },
    unknown_space: [{ id: "u1", testable: true, observable: false }],
    experiments: [{ id: "probe", expected_information_gain: .9, risk: .1, reversibility: 1, observability: 1 }],
  });
  console.log(JSON.stringify({
    version: result.version,
    status: result.status,
    worlds: result.worlds.length,
    realized: result.realized?.id ?? null,
    information_seeking: result.information_seeking,
    lineage: result.lineage.lineage,
    invariant: result.invariant,
    authority_granted: result.authority_granted,
    live: result.live,
  }, null, 2));
}
