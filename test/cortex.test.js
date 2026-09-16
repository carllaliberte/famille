import test from "node:test";
import assert from "node:assert/strict";
import {
  authorizeCapability,
  capabilityGain,
  composeSynapse,
  createCortexSession,
  discoverCapabilities,
  learnCollaboration,
  measureCollaboration,
  normalizeIntelligence,
  recordExecution,
  recordStage,
} from "../.github/swarm/cortex.mjs";

test("Cortex preserves identity and declared capability state", () => {
  const agent = normalizeIntelligence({
    id: "build",
    name: "Build",
    kind: "consult",
    specialty: "implement",
    capabilities: ["build"],
  });
  assert.equal(agent.id, "build");
  assert.deepEqual(agent.capabilities, ["build"]);
  assert.equal(agent.presence, "DECLARED");
});

test("Cortex discovers capabilities without treating declaration as connection", () => {
  const result = discoverCapabilities(
    { objective: "implement and review", required_capabilities: ["build", "review"] },
    [
      { id: "build", capabilities: ["build"], presence: "DECLARED", specialty: "implement" },
      { id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" },
    ],
  );
  assert.deepEqual(result.covered, ["build", "review"]);
  assert.equal(result.discovered.find((r) => r.intelligence.id === "build").callable, false);
  assert.equal(result.discovered.find((r) => r.intelligence.id === "reviewer").callable, true);
});

test("Cortex composes a context-specific synapse and adds an independent verifier", () => {
  const discovered = discoverCapabilities(
    { objective: "implement code", required_capabilities: ["build"] },
    [
      { id: "builder", capabilities: ["build"], presence: "CONNECTED", specialty: "software-engineering" },
      { id: "reviewer", capabilities: ["review"], presence: "CONNECTED", specialty: "review" },
    ],
  );
  const composition = composeSynapse(
    { objective: "implement code", required_capabilities: ["build"] },
    discovered,
  );
  assert.equal(composition.ok, true);
  assert.deepEqual(composition.selected, ["builder", "reviewer"]);
  assert.equal(composition.independent_verifier, "reviewer");
  assert.equal(composition.synapse.live, false);
});

test("Cortex fails closed on forbidden authority", () => {
  const denied = authorizeCapability({ capabilities: ["build", "merge"], allowed: true, authority: "network" });
  assert.equal(denied.ok, false);
  assert.equal(denied.state, "HOLD_HUMAN");
  assert.deepEqual(denied.denied, ["merge"]);
});

test("Cortex records real execution separately from discovery", () => {
  const created = createCortexSession({ objective: "run tests", required_capabilities: ["build"] });
  assert.equal(created.ok, true);
  const staged = recordStage(created.session, "AUTHORIZE", { status: "authorized" });
  const executed = recordExecution(staged.session, {
    node: "build",
    capability: "build",
    status: "EXECUTED",
    result: { tests: 10 },
    duration_ms: 120,
  });
  assert.equal(executed.ok, true);
  assert.equal(executed.session.state, "MEASURE");
  assert.equal(executed.session.executions.length, 1);
  assert.equal(executed.session.live, false);
});

test("Cortex measures collaborative gain and only learns from verified evidence", () => {
  const measurement = measureCollaboration({
    metric: "task_score",
    baseline: 0.7,
    collaborative: 0.9,
    method: "paired evaluation",
  });
  assert.ok(Math.abs(measurement.delta - 0.2) < Number.EPSILON);
  assert.equal(measurement.improved, true);

  const lesson = learnCollaboration({
    task: "implement and verify",
    nodes: ["chatgpt", "build", "reviewer"],
    measurement,
    verified: true,
  });
  assert.equal(lesson.ok, true);
  assert.equal(lesson.lesson.reusable, true);

  const blocked = learnCollaboration({ measurement, verified: false });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.lesson, null);
});

test("Cortex can demonstrate a newly acquired collective capability", () => {
  const gain = capabilityGain({
    before: ["reason", "review"],
    after: ["reason", "review", "build", "execute"],
    verified: true,
  });
  assert.deepEqual(gain.gained, ["build", "execute"]);
  assert.equal(gain.demonstrated, true);
});
