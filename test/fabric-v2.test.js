import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  executeBranch,
  runCollaborativeEngine,
  transferCollaborativeContext,
} from "../.github/swarm/fabric-v2.mjs";
import { createTask, addBranch } from "../.github/swarm/fabric.mjs";

const at = "2026-09-14T21:30:00.000Z";

describe("fabric v2 — collaboration EXECUTED, providers not LIVE", () => {
  it("executes multiple branches on one task", () => {
    const run = runCollaborativeEngine({
      at,
      workers: [
        { worker: "gemini", capability: "lu", output: { answer: "A" } },
        { worker: "chatgpt", capability: "lu", output: { answer: "A" } },
      ],
    });
    assert.equal(run.ok, true);
    assert.equal(run.work.executed, true);
    assert.equal(run.work.collaboration, "EXECUTED");
    assert.equal(run.work.engine, "fabric.v2");
    assert.equal(run.metrics.branches_executed, 2);
    assert.equal(run.metrics.workers_executed, 2);
    assert.equal(run.metrics.agreements, 1);
    assert.equal(run.metrics.human_decisions_pending, 1);
    assert.equal(run.live, false);
    assert.equal(run.auto_merge, false);
  });

  it("records the complete synapse lifecycle without LIVE", () => {
    const run = runCollaborativeEngine({ at });
    const workSynapses = run.work.synapses.filter((s) => s.act === "WORK");
    assert.ok(workSynapses.length >= 2);
    assert.ok(workSynapses.every((s) => s.grade === "EXECUTED"));
    assert.ok(workSynapses.every((s) => s.run === "MEASURED"));
    assert.ok(run.work.branches.every((b) => b.live === false));
    assert.ok(run.work.synapses.every((s) => s.grade !== "LIVE"));
  });

  it("transfers measured context between completed branches", () => {
    let work = createTask({ objective: "context", required_capabilities: ["lu"] }).work;
    work = addBranch(work, { worker: "gemini", capability: "lu" }).work;
    work = addBranch(work, { worker: "chatgpt", capability: "lu" }).work;
    const first = executeBranch(work, work.branches[0].branch_id, {
      worker: "gemini",
      output: { source: "A" },
      at,
    });
    assert.equal(first.ok, true);
    const transfer = transferCollaborativeContext(
      first.work,
      first.work.branches[0].branch_id,
      first.work.branches[1].branch_id,
      { at },
    );
    assert.equal(transfer.ok, true);
    assert.equal(transfer.insufficient, false);
    assert.equal(transfer.work.branches[1].context.transfer.origin, "gemini");
  });

  it("keeps disagreement as an objection and does not select a winner", () => {
    const run = runCollaborativeEngine({
      at,
      workers: [
        { worker: "gemini", capability: "lu", output: { answer: "A" } },
        { worker: "chatgpt", capability: "lu", output: { answer: "B" } },
      ],
    });
    assert.equal(run.metrics.disagreements, 1);
    assert.ok(run.work.objections.some((o) => o.reason === "DISAGREEMENT"));
    assert.equal(run.work.synthesis.summary, "DISAGREEMENT");
  });

  it("correction is another measured execution", () => {
    const run = runCollaborativeEngine({
      at,
      correct: true,
      correct_output: { corrected: true },
    });
    assert.equal(run.metrics.corrections, 1);
    assert.ok(run.work.measurements.some((m) => m.metric === "correction" && m.measured));
    assert.equal(run.work.live, false);
  });

  it("human sovereignty remains intact", () => {
    const run = runCollaborativeEngine({ at });
    assert.equal(run.work.decision.status, "PENDING_HUMAN");
    assert.equal(run.work.decision.authority, "carl");
    assert.equal(run.work.decision.human_required, true);
    assert.equal(run.work.auto_merge, false);
  });

  it("provenance is attached to branch collaboration lifecycle", () => {
    const run = runCollaborativeEngine({ at });
    for (const branch of run.work.branches) {
      assert.ok(branch.collaboration.lifecycle.length >= 6);
      assert.ok(branch.collaboration.lifecycle.every((x) => x.provenance));
      assert.ok(branch.collaboration.lifecycle.every((x) => x.live === false));
    }
  });

  it("V2 does not claim provider connectivity", () => {
    const run = runCollaborativeEngine({ at });
    assert.equal(run.live, false);
    assert.equal(run.work.live, false);
    assert.equal(run.metrics.live, false);
    assert.equal(run.metrics.authority, "carl");
  });
});
