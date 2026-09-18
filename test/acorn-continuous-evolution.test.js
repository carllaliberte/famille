import test from "node:test";
import assert from "node:assert/strict";
import {
  evolutionConstitution,
  normalizeObservation,
  detectGap,
  scoreEvolutionCandidate,
  discoverFrontier,
  compareKnownResults,
  composeEvolution,
  buildEvolutionPortfolio,
  runContinuousEvolution,
  assertContinuousEvolutionContract
} from "../scripts/acorn-continuous-evolution.mjs";

test("constitution keeps evolution below human authority", () => {
  const c = evolutionConstitution();
  assert.equal(c.capability_is_not_authority, true);
  assert.equal(c.learning_is_not_authority, true);
  assert.equal(c.auto_merge, false);
  assert.equal(c.auto_spend, false);
  assert.equal(c.live, false);
  assert.equal(c.human_authority, "carl");
});

test("unknown is a research target", () => {
  const row = normalizeObservation({ id: "x", domain: "CAPABILITY", status: "UNKNOWN", unknown: true });
  assert.equal(row.unknown, true);
  assert.equal(detectGap(row).state, "GAP_DETECTED");
  assert.equal(scoreEvolutionCandidate(row).gap, true);
});

test("frontier detects gaps across domains", () => {
  const frontier = discoverFrontier({
    observations: [
      { id: "failure", domain: "CODE", failed: true, value_potential: 0.4 },
      { id: "unknown", domain: "INTELLIGENCE", unknown: true, capability_gain: 0.9 },
      { id: "healthy", domain: "PRODUCT", status: "OBSERVED", value_potential: 0.1 }
    ]
  });
  assert.equal(frontier.gap_count >= 2, true);
  assert.equal(frontier.candidates[0].gap, true);
});

test("best known result is explicitly scoped", () => {
  const result = compareKnownResults([
    { id: "a", domain: "CAPABILITY", quality: 0.8, reliability: 0.9, customer_value: 0.8, reusability: 0.7, speed: 0.7, risk: 0.1, verified: true },
    { id: "b", domain: "CAPABILITY", quality: 0.5, reliability: 0.6, customer_value: 0.5, reusability: 0.5, speed: 0.5, risk: 0.2, verified: true }
  ], { domain: "CAPABILITY", verified: true });
  assert.equal(result.status, "BEST_KNOWN_IN_SCOPE");
  assert.equal(result.global_best_claim, false);
  assert.equal(result.selected.id, "a");
});

test("composition does not grant authority", () => {
  const result = composeEvolution({
    gap: { id: "g1" },
    capabilities: [{ id: "cap-a", domain: "CAPABILITY", state: "READY", authority_granted: false }],
    results: []
  });
  assert.equal(result.composition.includes("cap-a"), true);
  assert.equal(result.authority_granted, false);
  assert.equal(result.auto_merge, false);
});

test("one portfolio absorbs maintenance and market-facing evolution", () => {
  const frontier = discoverFrontier({
    observations: [
      { id: "customer-friction", domain: "CUSTOMER", failed: true, customer_impact: 0.9 },
      { id: "connector-gap", domain: "CONNECTOR", unknown: true, capability_gain: 0.8 }
    ]
  });
  const portfolio = buildEvolutionPortfolio({
    frontier,
    maintenance: { audit: { findings: [{ kind: "FAILING_CHECK", number: 1, severity: "HIGH", reason: "CI" }] } },
    cycle: { main_sha: "main-sha" }
  });
  assert.equal(portfolio.action, "EVOLVE_PORTFOLIO");
  assert.equal(portfolio.one_coherent_change, true);
  assert.equal(portfolio.no_micro_tasks, true);
  assert.equal(portfolio.domains.includes("CUSTOMER"), true);
  assert.equal(portfolio.domains.includes("CONNECTOR"), true);
});

test("full cycle remains bounded and truthful", () => {
  const result = runContinuousEvolution({
    repository: "carllaliberte/famille",
    main_sha: "main-sha",
    observations: [{ id: "gap", domain: "PERFORMANCE", failed: true, value_potential: 0.8 }],
    measurement: { measured: false }
  });
  assertContinuousEvolutionContract(result);
  assert.equal(result.auto_merge, false);
  assert.equal(result.auto_spend, false);
  assert.equal(result.live, false);
  assert.equal(result.authority, "carl");
});
