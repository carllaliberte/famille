import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addBranch,
  addObjection,
  compareBranchResults,
  createTask,
  deterministicWorker,
  discoverCapabilities,
  humanDecide,
  runEngine,
  synthesize,
  transferContext,
  transition,
  verifyReadback,
} from "../.github/swarm/fabric.mjs";

describe("fabric v1 — engine EXECUTED, providers not LIVE", () => {
  it("1.createTask is PROPOSED not executed", () => {
    const { work } = createTask({ objective: "v1" });
    assert.equal(work.state, "PROPOSED");
    assert.equal(work.executed, false);
    assert.equal(work.live, false);
  });

  it("2.discovery uses workforce roster", () => {
    const w = createTask({ objective: "d", required_capabilities: ["lu"] }).work;
    const d = discoverCapabilities(w);
    assert.ok(d.candidates.length >= 1);
    assert.ok(d.candidates.every((c) => c.live === false));
    assert.ok(d.candidates.some((c) => c.identity === "gemini" || c.declared));
  });

  it("3.dispatch assigns a real branch", () => {
    const w = createTask({ objective: "x", required_capabilities: ["lu"] }).work;
    const br = addBranch(w, { worker: "gemini", capability: "lu" });
    assert.equal(br.ok, true);
    assert.equal(br.work.branches[0].worker, "gemini");
  });

  it("4.deterministic worker is actually called", () => {
    const dw = deterministicWorker({
      worker: "dt-a",
      capability: "lu",
      task_id: "t",
      branch_id: "b",
      output: { hello: 1 },
      at: "2026-09-14T21:00:00.000Z",
    });
    assert.equal(dw.kind, "deterministic_test");
    assert.equal(dw.method, "deterministic_test");
    assert.deepEqual(dw.output, { hello: 1 });
    assert.equal(dw.live, false);
    assert.equal(dw.measurement.measured, true);
  });

  it("5.context transfer is measured after a result", () => {
    let w = createTask({ objective: "t", required_capabilities: ["lu"] }).work;
    w = addBranch(w, { worker: "gemini", capability: "lu" }).work;
    w = addBranch(w, { worker: "chatgpt", capability: "lu" }).work;
    w = transferContext(w, w.branches[0].branch_id, w.branches[1].branch_id, { require: true });
    assert.equal(w.code, "INSUFFICIENT");
  });

  it("6.return recovers worker output", () => {
    const run = runEngine({
      at: "2026-09-14T21:00:00.000Z",
      workers: [
        { worker: "gemini", output: { k: "a" } },
        { worker: "chatgpt", output: { k: "a" } },
      ],
    });
    assert.equal(run.ok, true);
    assert.equal(run.work.branches[0].result.body, JSON.stringify({ k: "a" }));
  });

  it("7.measurement is created", () => {
    const run = runEngine({ at: "2026-09-14T21:00:00.000Z" });
    assert.ok(run.work.measurements.some((m) => m.metric === "worker_ran" && m.measured === true));
  });

  it("8.readback verification", () => {
    const ok = verifyReadback({ executed: true, expected: 1, readback: 1 });
    assert.equal(ok.state, "VERIFIED");
    const no = verifyReadback({ executed: true, expected: 1, readback_failed: true });
    assert.equal(no.state, "EXECUTED");
    assert.equal(no.verification, "UNVERIFIED");
  });

  it("9.objection is recorded", () => {
    const run = runEngine({
      at: "2026-09-14T21:00:00.000Z",
      object: true,
      object_reason: "scope",
    });
    assert.ok(run.work.objections.length >= 1);
  });

  it("10.correction re-executes and measures", () => {
    const run = runEngine({
      at: "2026-09-14T21:00:00.000Z",
      object: true,
      correct: true,
      correct_output: { corrected: true },
    });
    assert.ok(run.work.measurements.some((m) => m.metric === "correction" && m.measured === true));
    assert.equal(run.metrics.corrections, 1);
  });

  it("11.synthesis compares results", () => {
    const run = runEngine({
      at: "2026-09-14T21:00:00.000Z",
      workers: [
        { worker: "gemini", output: { n: 1 } },
        { worker: "chatgpt", output: { n: 1 } },
      ],
    });
    assert.equal(run.work.synthesis.summary, "AGREEMENT");
  });

  it("12.disagreement is kept, not arbitrarily resolved", () => {
    const run = runEngine({
      at: "2026-09-14T21:00:00.000Z",
      workers: [
        { worker: "gemini", output: { n: 1 } },
        { worker: "chatgpt", output: { n: 2 } },
      ],
    });
    assert.equal(compareBranchResults(run.work).verdict, "DISAGREEMENT");
    assert.equal(run.work.synthesis.summary, "DISAGREEMENT");
    assert.ok(run.work.objections.some((o) => o.reason === "DISAGREEMENT"));
  });

  it("13.human decision is PENDING_HUMAN", () => {
    const run = runEngine({ at: "2026-09-14T21:00:00.000Z" });
    assert.equal(run.work.state, "DECISION");
    assert.equal(run.work.decision.status, "PENDING_HUMAN");
    assert.equal(run.work.decision.authority, "carl");
    assert.equal(run.work.decision.human_required, true);
    assert.equal(humanDecide(run.work, { actor: "engine", outcome: "DONE" }).code, "HUMAN");
  });

  it("14.deterministic worker cannot be LIVE", () => {
    const dw = deterministicWorker({ worker: "dt" });
    assert.equal(dw.live, false);
    const run = runEngine({ at: "2026-09-14T21:00:00.000Z" });
    assert.equal(run.live, false);
    assert.equal(run.work.live, false);
    assert.ok(run.work.branches.every((b) => b.live === false));
  });

  it("15.constructor is not EXECUTED", () => {
    const w = createTask({ objective: "bare" }).work;
    assert.equal(w.executed, false);
    assert.notEqual(w.loop, "EXECUTED");
  });

  it("16.no VERIFIED without readback", () => {
    const r = verifyReadback({ executed: true, expected: "x" });
    assert.notEqual(r.state, "VERIFIED");
    assert.equal(r.verification, "UNVERIFIED");
  });

  it("17.auto_merge stays false", () => {
    const run = runEngine({ at: "2026-09-14T21:00:00.000Z" });
    assert.equal(run.work.auto_merge, false);
    assert.equal(run.metrics.auto_merge, false);
  });

  it("integrator walks every cycle step", () => {
    const run = runEngine({
      at: "2026-09-14T21:00:00.000Z",
      object: true,
      correct: true,
      workers: [
        { worker: "gemini", output: { n: 1 } },
        { worker: "chatgpt", output: { n: 1 } },
      ],
    });
    const names = run.trace.map((t) => t.step);
    for (const s of [
      "observe",
      "understand",
      "discover",
      "compose",
      "delegate",
      "work",
      "transfer",
      "measure",
      "verify",
      "object",
      "correct",
      "synthesize",
      "human_decision",
      "next",
    ]) {
      assert.ok(names.includes(s), s);
    }
    assert.equal(run.work.executed, true);
    assert.equal(run.work.loop, "EXECUTED");
    assert.equal(run.work.engine, "fabric.v1");
    assert.equal(run.metrics.tasks_executed, 1);
    assert.equal(run.metrics.live, false);
    assert.equal(run.metrics.human_decisions_pending, 1);
    assert.ok(run.work.synapses.some((s) => s.run === "MEASURED" && s.grade === "EXECUTED"));
  });
});
