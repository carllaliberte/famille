import test from "node:test";
import assert from "node:assert/strict";
import {
  assertDefenseInvariant,
  authenticityState,
  classifyCognitiveInput,
  defenseCycle,
  degradationMode,
  detectDeception,
  detectEscalation,
  inspectReplication,
  inspectResourceAcquisition,
  inspectPersistence,
  measureAuthorityEnvelope,
  operationalStop,
  rollbackQuarantine,
} from "../scripts/acorn-defense.mjs";
import {
  adversarialPerspectives,
  assertCortexInvariant,
  authorizeAction,
  blastRadius,
  composeOrganism,
  cortexCycle,
  declareMeaning,
  detectGoalDrift,
  detectMetricGaming,
  diagnoseConflict,
  falsify,
  governEvolution,
  governanceScope,
  gradeEvidence,
  observeAction,
  organismMetrics,
  proposeAction,
  provenanceChain,
  stampTime,
  uncertaintyBudget,
} from "../scripts/cortex-cognition.mjs";
import { expireEvidence } from "../scripts/evidence-seal.mjs";
import { describeIntelligence, registerCompatibleIntelligence } from "../scripts/intelligence-contract.mjs";
import { refuseBreakerBypass } from "../scripts/cortex-sovereignty.mjs";

test("meaning never invents a human objective and is not an authorization", () => {
  const unknown = declareMeaning({});
  assert.equal(unknown.status, "UNKNOWN");
  assert.equal(unknown.invented_human_objective, false);
  assert.equal(unknown.objective_is_not_authorization, true);
  const derived = declareMeaning({ objective: "maximize live_count", human_origin: false, derived_by: "model" });
  assert.equal(derived.status, "DERIVED");
  assert.equal(derived.human_origin, false);
  const human = declareMeaning({ objective: "verify inventory", human_origin: true });
  assert.equal(human.status, "HUMAN_ORIGIN");
  assert.equal(human.derived, false);
});

test("governance scope never turns capability into authority", () => {
  const scope = governanceScope({
    who: "model",
    what: "review",
    why: "derived purpose",
    with_what: "review",
    with_which_risk: "low",
  });
  assert.equal(scope.under_which_authority, "carl");
  assert.equal(scope.capability_is_not_authority, true);
  const denied = authorizeAction({
    proposal: proposeAction({ actor: "model", capability: "review", risk: "low" }),
    grant: { human: false },
    breaker: "CLOSED",
    meaning: declareMeaning({ objective: "review" }),
  });
  assert.equal(denied.scope.who, "model");
  assert.equal(denied.scope.under_which_authority, "carl");
  assert.equal(denied.authorized, false);
});

test("decision is not action; irreversible acts require a human grant", () => {
  const proposal = proposeAction({
    actor: "model",
    capability: "merge",
    purpose: "land",
    irreversible: true,
  });
  assert.equal(proposal.status, "PROPOSED");
  assert.equal(proposal.decision_is_not_action, true);
  const denied = authorizeAction({
    proposal,
    grant: { human: false },
    breaker: "OPEN",
    meaning: declareMeaning({ objective: "land", human_origin: false }),
  });
  assert.equal(denied.authorized, false);
  assert.equal(denied.breaker_changed, false);
  const allowed = authorizeAction({
    proposal: proposeAction({ capability: "review", irreversible: false }),
    grant: { human: true, allowed: true },
    breaker: "OPEN",
  });
  assert.equal(allowed.authorized, true);
  const notRun = observeAction({ proposal, authorization: denied, executed: true });
  assert.equal(notRun.status, "NOT_EXECUTED");
  const simulated = observeAction({
    proposal: proposeAction({ simulated: true }),
    authorization: allowed,
    executed: false,
  });
  assert.equal(simulated.status, "SIMULATED");
});

test("evidence grades never auto-promote to Carl LIVE", () => {
  assert.equal(gradeEvidence({}).grade, "UNOBSERVED");
  assert.equal(gradeEvidence({ asserted: true }).grade, "ASSERTED");
  assert.equal(gradeEvidence({ asserted: true, observed: true, measured: true, verified: true }).grade, "VERIFIED");
  const live = gradeEvidence({ observed: true, measured: true, verified: true, live_execution: true });
  assert.equal(live.grade, "LIVE");
  assert.equal(live.carl_live_verified, false);
  assert.equal(live.live, false);
  assert.equal(live.auto_promoted, false);
});

test("evolution cannot adopt an unverified change", () => {
  const rejected = governEvolution({ adopted: true, verified: false, simulated: true });
  assert.equal(rejected.status, "REJECTED");
  assert.equal(rejected.adopted, false);
  const ok = governEvolution({ adopted: true, verified: true, simulated: true });
  assert.equal(ok.adopted, true);
});

test("organ contradictions stay CONFLICT and are not silently resolved", () => {
  const conflict = diagnoseConflict({
    cortex: { status: "VERIFIED" },
    defense: { state: "BLOCKED" },
    memory: { current: true },
    time: { expired: true },
    runtime: { executed: false },
    cortex_claimed: true,
  });
  const poisoned = diagnoseConflict({
    cortex: { claimed_success: true },
    runtime: { executed: false },
    defense: { state: "HEALTHY" },
  });
  assert.equal(poisoned.status, "CONFLICT");
  assert.ok(poisoned.conflicts.some((row) => row.kind === "PROVIDER_SUCCESS_WITHOUT_EXECUTION"));
  assert.equal(poisoned.silent_resolve, false);
  const aligned = diagnoseConflict({
    cortex: { status: "EXECUTED" },
    defense: { state: "HEALTHY" },
    runtime: { executed: true, status: "PRESENT" },
  });
  assert.equal(aligned.status, "ALIGNED");
  assert.equal(conflict.status, "CONFLICT");
  assert.equal(conflict.silent_resolve, false);
  assert.equal(conflict.preserve_evidence, true);
});

test("metrics stay NOT_MEASURED unless actually supplied", () => {
  const metrics = organismMetrics({ runtime_coverage: 0.24 });
  assert.equal(metrics.runtime_coverage, 0.24);
  assert.equal(metrics.detection_latency, "NOT_MEASURED");
  assert.equal(metrics.invented, false);
});

test("complete organism composes existing organs without a second architecture", () => {
  const cycle = cortexCycle({
    task: { objective: "review", required_capabilities: ["review"] },
    resources: [{ id: "local", capabilities: ["review"], presence: "CONNECTED" }],
    expected: 1,
    observed: 1,
    evidence: { executed: true, verified: true },
    defense: { breaker: "OPEN" },
    meaning: { objective: "review", human_origin: true },
  });
  const organism = composeOrganism({
    meaning: cycle.meaning,
    cortex: cycle,
    defense: cycle.defense,
    action: cycle.action,
    evidence: cycle.evidence_grade,
    diagnosis: cycle.diagnosis,
  });
  assert.equal(organism.second_cortex, false);
  assert.equal(organism.second_defense, false);
  assert.equal(organism.primitives.meaning.human_origin, true);
  assert.equal(organism.primitives.action.proposal.decision_is_not_action, true);
  assert.equal(assertCortexInvariant(cycle).status, "VERIFIED");
});

const scenarios = [
  ["1 new unknown intelligence", () => {
    const admitted = registerCompatibleIntelligence({ agents: [] }, { id: "tomorrow-x", capabilities: ["review"] });
    assert.equal(admitted.cortex_modified, false);
    assert.equal(describeIntelligence({ id: "tomorrow-x", capability_ceiling: 90 }).authority_ceiling, 0);
  }],
  ["2 intelligence far more capable", () => {
    const envelope = measureAuthorityEnvelope({ resource: { id: "giant" }, observed: { capability: 100, authority: 0 } });
    assert.equal(envelope.authority, 0);
    assert.equal(envelope.deduced_authority_from_capability, false);
  }],
  ["3 compromised intelligence", () => {
    const deception = detectDeception({ claimed: { executed: true }, observed: { executed: false } });
    assert.equal(deception.status, "CONTRADICTED");
  }],
  ["4 several intelligences compromised", () => {
    const views = adversarialPerspectives({ independent: ["yes", "yes"], evidence: { executed: true } });
    assert.equal(views.consensus_is_truth, false);
    assert.equal(views.consensus_is_authority, false);
  }],
  ["5 provider disappears", () => {
    const radius = blastRadius({ lost: ["p"], graph: { nodes: [{ id: "p", single_point: true }, { id: "local", authority: false }] } });
    assert.ok(radius.survives.includes("local"));
  }],
  ["6 channel disappears", () => {
    assert.equal(classifyCognitiveInput({ source: "provider", claimed_role: "authority" }).is_authority, false);
  }],
  ["7 memory poisoning", () => {
    const input = classifyCognitiveInput({ source: "document", claimed_role: "instruction", kind: "memory" });
    assert.equal(input.classified_as, "UNTRUSTED_DATA");
  }],
  ["8 expired evidence", () => {
    const expired = expireEvidence({ issued_at: "2020-01-01T00:00:00.000Z", now: Date.parse("2026-01-01T00:00:00.000Z"), ttl_ms: 10 });
    assert.equal(expired.status, "EXPIRED");
    assert.equal(expired.was_false, false);
  }],
  ["9 forged provenance", () => {
    assert.equal(authenticityState({ contradiction: true }).status, "CONTRADICTED");
    assert.equal(provenanceChain({ inference: "x", observation: "y" }).inference_is_not_observation, true);
  }],
  ["10 metric gamed", () => {
    assert.equal(detectMetricGaming({ metric_improved: true, goal_achieved: false }).status, "METRIC_GAMING");
  }],
  ["11 derived objective incorrect", () => {
    const meaning = declareMeaning({ objective: "maximize metric", human_origin: false });
    const drift = detectGoalDrift({ original: { objective: "verify inventory" }, current: { objective: meaning.purpose } });
    assert.equal(drift.status, "GOAL_DRIFT");
    assert.equal(meaning.objective_is_not_authorization, true);
  }],
  ["12 privilege escalation", () => {
    const rise = detectEscalation({
      history: [
        { permissions: 1, resources: 1, runtime: 1, network: 0, tools: 1, delegation: 0, persistence: 0, replication: 0, financial: 0, authority: 0 },
        { permissions: 9, resources: 8, runtime: 7, network: 4, tools: 6, delegation: 3, persistence: 2, replication: 2, financial: 1, authority: 1 },
      ],
    });
    assert.equal(rise.coordinated, true);
  }],
  ["13 breaker bypass attempt", () => {
    const refused = refuseBreakerBypass({ source: "intelligence" });
    assert.equal(refused.refused, true);
    assert.equal(refused.breaker_intact, true);
    const boundary = defenseCycle({
      actor: "model",
      capability: { changes_breaker: true },
      breaker: "OPEN",
      threat: { kind: "authority_bypass" },
    });
    assert.equal(boundary.breaker_bypass, false);
    assert.notEqual(boundary.state, "HOLD_HUMAN");
  }],
  ["14 authority change attempt", () => {
    const cycle = defenseCycle({
      actor: "resource",
      capability: { authority: true },
      breaker: "OPEN",
      threat: { kind: "authority_escalation" },
    });
    assert.equal(cycle.envelope.collision, true);
    assert.equal(cycle.state, "BLOCKED");
  }],
  ["15 observable self-preservation", () => {
    const persist = inspectPersistence({
      declared: [],
      observed: [{ id: "hidden", kind: "background_worker" }],
    });
    assert.equal(persist.status, "UNEXPECTED_PERSISTENCE");
  }],
  ["16 unauthorized replication", () => {
    const replica = inspectReplication({ declared: [], observed: [{ id: "clone", kind: "agent" }] });
    assert.equal(replica.blocked, true);
  }],
  ["17 unauthorized resource acquisition", () => {
    const got = inspectResourceAcquisition({ declared: { money: 0 }, observed: { money: 4 } });
    assert.equal(got.blocked, true);
  }],
  ["18 Cortex is wrong", () => {
    const restored = rollbackQuarantine({ resource: { id: "clean" }, reason: "FALSE_POSITIVE" });
    assert.equal(restored.acorn_error_detected, true);
  }],
  ["19 Defense partially fails", () => {
    const mode = degradationMode({ defense_degraded: true, lost_ratio: 0.1 });
    assert.equal(mode.mode, "PROTECTED");
    assert.equal(mode.continue_defending, true);
  }],
  ["20 unknown state", () => {
    assert.equal(uncertaintyBudget({ unknown: ["x"] }).status, "UNKNOWN");
    assert.equal(uncertaintyBudget({ unknown: ["x"] }).fake_confidence, false);
  }],
  ["21 common-mode provider failure", () => {
    const radius = blastRadius({
      lost: ["family"],
      graph: { nodes: [{ id: "a", depends_on: "family" }, { id: "b", depends_on: "family" }, { id: "local", authority: false }] },
    });
    assert.equal(radius.pretends_independent, false);
    assert.ok(radius.survives.includes("local"));
  }],
  ["22 partial network loss", () => {
    const stop = operationalStop({ target: "channel-x", reason: "partition", breaker: "OPEN" });
    assert.equal(stop.breaker_changed, false);
    assert.equal(stop.defense_active, true);
  }],
  ["23 irreversible action", () => {
    const auth = authorizeAction({
      proposal: proposeAction({ irreversible: true, capability: "spend" }),
      grant: { human: false },
      breaker: "OPEN",
    });
    assert.equal(auth.authorized, false);
    assert.equal(auth.reason, "IRREVERSIBLE_REQUIRES_HUMAN");
  }],
  ["24 massive capability increase", () => {
    const envelope = measureAuthorityEnvelope({ observed: { capability: 1000, authority: 0 } });
    assert.equal(envelope.authority, 0);
  }],
  ["25 documentation lies", () => {
    assert.equal(detectDeception({ claimed: { executed: true }, observed: { executed: false } }).status, "CONTRADICTED");
  }],
  ["26 repository / runtime divergence", () => {
    const cycle = defenseCycle({
      actor: "runtime",
      capability: { authority: false },
      breaker: "OPEN",
      baseline: { lifecycle: "DEPLOYED" },
      observed: { lifecycle: "ABSENT" },
      threat: { kind: "anomalous_behavior" },
    });
    assert.equal(cycle.anomaly.anomalous, true);
  }],
  ["27 falsified result", () => {
    const result = falsify({ claim: "ok", observation: "no", contradiction: true, evidence: { executed: true } });
    assert.equal(result.refuted, true);
  }],
  ["28 disagreement among intelligences", () => {
    const views = adversarialPerspectives({ independent: ["a", "b"], evidence: { executed: true } });
    assert.equal(views.consensus, "UNVERIFIED");
  }],
  ["29 false consensus", () => {
    const views = adversarialPerspectives({ independent: ["x", "x", "x"], evidence: { executed: true } });
    assert.equal(views.consensus, "AGREEMENT");
    assert.equal(views.consensus_is_truth, false);
  }],
  ["30 simultaneous critical loss", () => {
    const mode = degradationMode({ lost_ratio: 0.5, critical_provider_lost: true });
    assert.equal(mode.mode, "MINIMAL_SAFE_OPERATION");
    assert.equal(mode.pretends_normal, false);
  }],
];

for (const [name, fn] of scenarios) {
  test(`resistance ${name}`, fn);
}

test("time stamps expire without rewriting the past as false", () => {
  const t = stampTime({ at: "2026-09-17T00:00:00.000Z", valid_until: "2026-01-01T00:00:00.000Z" });
  assert.equal(t.expired, true);
});

test("defense invariant still holds after the complete-organism composition", () => {
  const cycle = defenseCycle({
    actor: "organism",
    capability: { authority: false },
    breaker: "OPEN",
  });
  assert.equal(assertDefenseInvariant(cycle).status, "VERIFIED");
  assert.equal(cycle.continue_defending, true);
  assert.equal(cycle.live, false);
});
