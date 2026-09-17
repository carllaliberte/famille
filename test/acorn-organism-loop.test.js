import test from "node:test";
import assert from "node:assert/strict";
import {
  ADVERSARIAL_TARGETS,
  ORGANISM_LOOP,
  adversarialChallenge,
  biggestObstacle,
  blastRadius,
  classifyKnowledgeKind,
  correlateIncidents,
  deriveTrust,
  detectReplay,
  enrichOrganism,
  evaluateRecoveryCandidates,
  organismConstitution,
  organismHealth,
  organismProbe,
  promoteKnowledge,
  redactSecrets,
  runOrganismLoop,
  synapseLifecycle,
  temporalState,
} from "../scripts/acorn-organism-loop.mjs";
import { runContinuousRuntime } from "../scripts/acorn-continuous-runtime.mjs";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "acorn-organism-"));
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, ".github", "swarm"), { recursive: true });
  mkdirSync(join(root, ".github", "workflows"), { recursive: true });
  mkdirSync(join(root, "sdk"));
  writeFileSync(join(root, "scripts", "ok.mjs"), `export function inventoryProbe() { return { ok: true, auto_merge: false, live: false }; }\n`);
  writeFileSync(join(root, "scripts", "fail.mjs"), `export function broken( { ;\n`);
  writeFileSync(join(root, "package.json"), JSON.stringify({
    type: "module",
    exports: { "./ok": "./scripts/ok.mjs" },
  }));
  writeFileSync(join(root, ".github", "workflows", "run.yml"), `on:\n  schedule:\n    - cron: "0 * * * *"\njobs:\n  a:\n    steps:\n      - run: node scripts/ok.mjs\n`);
  return root;
}

test("organism loop is not a second architecture", () => {
  const probe = organismProbe();
  const c = organismConstitution();
  assert.equal(probe.second_runtime, false);
  assert.equal(probe.second_cortex, false);
  assert.equal(probe.second_defense, false);
  assert.equal(probe.live, false);
  assert.equal(probe.auto_merge, false);
  assert.equal(c.one_loop, true);
  assert.equal(c.carl_controls_breaker, true);
  assert.equal(c.breaker_controls_carl, false);
  assert.equal(c.acorn_controls_carl, false);
  assert.equal(c.acorn_controls_breaker, false);
  assert.equal(c.capability_is_not_authority, true);
  assert.equal(c.simulation_is_not_execution, true);
  assert.deepEqual([...ORGANISM_LOOP], [
    "PERCEIVE", "UNDERSTAND", "PLAN", "ACT", "MEASURE", "FALSIFY",
    "PROTECT", "CORRECT", "VERIFY", "LEARN", "ADAPT", "PROVE", "CONTINUE",
  ]);
});

test("hypothesis is never silently promoted to fact", () => {
  const hypothesis = { kind: "hypothesis", what: "wiring implies execution", hypothesis: true };
  assert.equal(classifyKnowledgeKind(hypothesis), "hypothesis");
  const blocked = promoteKnowledge(hypothesis, { verified: true, causalProof: false });
  assert.equal(blocked.promoted, false);
  assert.equal(blocked.reason, "HYPOTHESIS_IS_NOT_FACT");
  const still = promoteKnowledge({ prediction: true, what: "next cycle healthy" }, { verified: true });
  assert.equal(still.kind, "prediction");
  assert.equal(still.promoted, false);
});

test("trust expires; an old proof is not eternally valid", () => {
  const now = "2026-09-17T03:00:00.000Z";
  const trust = deriveTrust({
    entry: {
      id: "scripts/ok",
      states: { live: true, verified: true },
      live_word_earned: true,
      observed_at: "2026-01-01T00:00:00.000Z",
    },
    now,
    ttlMs: 1000,
  });
  assert.equal(trust.state, "EXPIRED");
  assert.equal(trust.expired, true);
  const dated = temporalState({
    observed_at: now,
    verified_at: now,
    expires_at: "2026-09-17T02:00:00.000Z",
    now,
  });
  assert.equal(dated.status, "EXPIRED");
});

test("recovery ranks verified candidates and never invents a fallback", () => {
  const evaluation = evaluateRecoveryCandidates({
    candidates: [
      { id: "fake", verified: false },
      { id: "authority", verified: true, authority: true },
      { id: "sick", verified: true, quarantined: true },
      { id: "good-b", verified: true },
      { id: "good-a", verified: true },
    ],
    trust: [
      { id: "good-a", state: "TRUSTED" },
      { id: "good-b", state: "OBSERVED" },
    ],
  });
  assert.equal(evaluation.invented, false);
  assert.equal(evaluation.silent_fallback, false);
  assert.equal(evaluation.selected.id, "good-a");
  assert.equal(evaluation.first_verified_is_not_automatic, true);
  const none = evaluateRecoveryCandidates({ candidates: [{ id: "ghost", verified: false }] });
  assert.equal(none.selected, null);
  assert.equal(none.status, "BLOCKED");
});

test("incidents correlate related events; blast radius stays the smallest proved scope", () => {
  const correlated = correlateIncidents([
    { sequence: 1, digest: "a", event: { subject: "scripts/fail", classified: { kind: "anomalous_behavior" } } },
    { sequence: 2, digest: "b", event: { subject: "scripts/fail", classified: { kind: "anomalous_behavior" } } },
    { sequence: 3, digest: "c", event: { subject: "scripts/ok", classified: { kind: "integrity" } } },
  ]);
  assert.equal(correlated.isolated_events, 3);
  assert.equal(correlated.correlated, 2);
  const radius = blastRadius({
    subject: "scripts/fail",
    inventory: { entries: [{ id: "scripts/fail" }, { id: "scripts/ok", kind: "script", states: { wired: true } }] },
  });
  assert.equal(radius.principle, "CONTAIN_SMALLEST_SAFE_SCOPE");
  assert.deepEqual(radius.contained_scope, ["scripts/fail"]);
});

test("synapse change requires evidence, not intuition; expired synapses are not trusted", () => {
  const created = synapseLifecycle({
    synapse: { from: "cortex", to: "defense", action: "create" },
    evidence: { executed: true, verified: true },
    now: "2026-09-17T00:00:00.000Z",
  });
  assert.equal(created.synapse.action, "strengthen");
  assert.equal(created.synapse.intuition_only, false);
  const expired = synapseLifecycle({
    synapse: { from: "cortex", to: "defense", expires_at: "2026-01-01T00:00:00.000Z" },
    now: "2026-09-17T00:00:00.000Z",
  });
  assert.equal(expired.synapse.action, "expire");
  const rejected = synapseLifecycle({ synapse: { from: "a" } });
  assert.equal(rejected.status, "REJECTED");
});

test("adversarial cognition refutes fake LIVE, authority bypass, breaker bypass, simulation-as-execution", () => {
  const fakeLive = adversarialChallenge({
    target: "evidence",
    claim: { live: true, verified: true },
    observation: { seal_verified: false },
  });
  assert.equal(fakeLive.status, "REFUTED");
  assert.ok(fakeLive.findings.includes("FAKE_LIVE"));
  const authority = adversarialChallenge({
    target: "authority_boundary",
    claim: { authority: "cortex", breaker_bypass: true, capability_authority: true },
  });
  assert.ok(authority.findings.includes("AUTHORITY_BYPASS"));
  assert.ok(authority.findings.includes("BREAKER_BYPASS"));
  const sim = adversarialChallenge({
    target: "deployment_state",
    claim: { simulated: true, executed: true, live: false },
    observation: { executed: true },
  });
  assert.ok(sim.findings.includes("SIMULATION_AS_EXECUTION"));
  assert.equal(ADVERSARIAL_TARGETS.length, 8);
});

test("replayed or tampered events are idempotent and do not double-recover", () => {
  const replay = detectReplay({
    current: { digest: "abc", sequence: 1 },
    seen: new Set(["abc"]),
  });
  assert.equal(replay.status, "REPLAY");
  assert.equal(replay.idempotent, true);
  const tampered = detectReplay({
    current: { digest: "new", sequence: 1 },
    previous: [{ digest: "old", sequence: 1 }],
  });
  assert.equal(tampered.status, "TAMPERED");
  const broken = detectReplay({
    current: { digest: "c", previous_digest: "x" },
    previous: [{ digest: "a" }],
  });
  assert.equal(broken.status, "BROKEN_CHAIN");
});

test("secrets are redacted; unknown health is not invented LIVE", () => {
  const redacted = redactSecrets({ api_key: "sk-live-supersecret", note: "ok" });
  assert.equal(redacted.api_key, "[REDACTED]");
  const health = organismHealth({ defense: { active: true, state: "BLOCKED" }, breaker: { threatened_blocked: true } });
  assert.equal(health.state, "PROTECTED");
  assert.equal(health.live, false);
  const unknown = organismHealth({ defense: { active: false } });
  assert.equal(unknown.state, "UNKNOWN");
  assert.notEqual(unknown.state, "LIVE");
});

test("enrichment of the existing continuous runtime keeps one loop and never claims LIVE", async () => {
  const cycle = await runContinuousRuntime({
    root: fixture(),
    env: { ACORN_SYSTEM_MODE: "OFF" },
    checkLoadable: (abs) => abs.endsWith("fail.mjs")
      ? { loadable: false, failed: true, reason: "SYNTAX_FAILED" }
      : { loadable: true, reason: "SYNTAX_OK" },
  });
  const organism = enrichOrganism(cycle);
  assert.equal(organism.live, false);
  assert.equal(organism.auto_merge, false);
  assert.equal(organism.constitution.second_cortex, false);
  assert.equal(organism.constitution.second_defense, false);
  assert.equal(organism.loop.length, 13);
  assert.ok(organism.loop.every((row) => row.simulated === false));
  assert.equal(organism.health.live, false);
  assert.notEqual(organism.health.state, "LIVE");
  assert.equal(organism.memory.some((row) => row.kind === "hypothesis"), true);
  assert.ok(Array.isArray(organism.metacognition.cortex.contributions));
  assert.ok(organism.metacognition.cortex.contributions.every((row) => typeof row.id === "string" || typeof row.intelligence === "string"));
  assert.ok(organism.memory.every((row) => row.kind !== "demonstrated_causality" || row.promoted === true));
  const obstacle = biggestObstacle(cycle);
  assert.ok(obstacle.id);
});

test("runOrganismLoop requires the existing runtime and refuses a second one", async () => {
  await assert.rejects(() => runOrganismLoop(null), /ORGANISM_LOOP_REQUIRES_EXISTING_RUNTIME/);
  const result = await runOrganismLoop(runContinuousRuntime, {
    root: fixture(),
    env: { ACORN_SYSTEM_MODE: "OFF" },
    checkLoadable: () => ({ loadable: true, reason: "SYNTAX_OK" }),
  });
  assert.equal(result.live, false);
  assert.equal(result.auto_merge, false);
  assert.equal(result.authority, "carl");
  assert.equal(result.constitution.second_runtime, false);
  assert.equal(result.organism.constitution.one_loop, true);
  assert.equal(result.defense.active, true);
  assert.notEqual(result.defense.state, "HOLD_HUMAN");
  assert.equal(result.breaker.hold_on_defense, false);
});

test("defense stays active under unknown and ambiguous breaker; no HOLD on defense", async () => {
  for (const env of [{}, { ACORN_SYSTEM_MODE: "DEBUG" }, { ACORN_SYSTEM_MODE: "WAT" }]) {
    const result = await runOrganismLoop(runContinuousRuntime, {
      root: fixture(),
      env,
      checkLoadable: () => ({ loadable: true, reason: "SYNTAX_OK" }),
    });
    assert.equal(result.defense.active, true);
    assert.equal(result.defense.continue_defending, true);
    assert.notEqual(result.defense.state, "HOLD_HUMAN");
    assert.equal(result.organism.health.live, false);
  }
});
