import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FABRIC_VERSION,
  STATES,
  addBranch,
  addEvidence,
  addMeasurement,
  addObjection,
  addObservation,
  addSynapse,
  createTask,
  humanDecide,
  openNext,
  readyOf,
  setBranchResult,
  synthesize,
  cannotMerge,
  counters,
  cycleDefined,
  discoverCapabilities,
  markSynapse,
  transferContext,
  transition,
} from "../.github/swarm/fabric.mjs";

function base(extra = {}) {
  return createTask({
    objective: "mesurer un objet de travail",
    required_capabilities: ["lu"],
    node: "grok",
    at: "2026-09-14T20:00:00.000Z",
    ...extra,
  }).work;
}

function withBranch(work) {
  return addBranch(work, {
    worker: "gemini",
    capability: "lu",
    node: "grok",
    at: "2026-09-14T20:00:01.000Z",
  });
}

describe("fabric.v0 — work object, not LIVE", () => {
  it("1.createTask", () => {
    const { ok, work } = createTask({ objective: "x", node: "grok" });
    assert.equal(ok, true);
    assert.equal(work.v, FABRIC_VERSION);
    assert.equal(work.state, "PROPOSED");
    assert.equal(work.objective, "x");
    assert.equal(work.live, false);
    assert.equal(work.auto_merge, false);
    assert.equal(work.executed, false);
    assert.ok(STATES.includes(work.state));
  });

  it("2.valid transition PROPOSED→READY", () => {
    const seeded = withBranch(base());
    const r = transition(seeded.work, "READY", { node: "grok" });
    assert.equal(r.ok, true);
    assert.equal(r.work.state, "READY");
  });

  it("3.invalid transition DONE from PROPOSED", () => {
    const r = transition(base(), "DONE");
    assert.equal(r.ok, false);
    assert.equal(r.code, "TRANSITION");
  });

  it("4.several branches keep separate context", () => {
    let w = withBranch(base()).work;
    w = addBranch(w, {
      worker: "chatgpt",
      capability: "lu",
      context: { note: "B" },
    }).work;
    assert.equal(w.branches.length, 2);
    assert.notEqual(w.branches[0].worker, w.branches[1].worker);
    assert.equal(w.branches[1].context.note, "B");
    assert.notEqual(w.branches[0].context.note, "B");
  });

  it("5.addSynapse is PROPOSED, not a network proof", () => {
    const r = addSynapse(base(), { from: "gemini", to: "chatgpt", act: "FINDING" });
    assert.equal(r.ok, true);
    assert.equal(r.work.synapses[0].grade, "PROPOSED");
    assert.equal(addSynapse(base(), { grade: "LIVE VERIFIED" }).code, "LIVE_NOT_CARL");
  });

  it("6.observation is not truth", () => {
    const r = addObservation(base(), { node: "deepseek", summary: "maybe" });
    assert.equal(r.ok, true);
    assert.equal(r.work.observations[0].summary, "maybe");
    assert.equal(r.work.observations[0].state, "PROPOSED");
  });

  it("7.evidence claim ≠ measured", () => {
    const r = addEvidence(base(), { source: "pr", claim: "green", measured: false });
    assert.equal(r.ok, true);
    assert.equal(r.work.evidence[0].measured, false);
    assert.equal(r.work.evidence[0].claim, "green");
  });

  it("8.objection is kept", () => {
    const r = addObjection(base(), { node: "sonnet", reason: "scope", severity: "NOTE" });
    assert.equal(r.ok, true);
    assert.equal(r.work.objections[0].status, "open");
    assert.equal(r.work.state, "PROPOSED");
  });

  it("9.measurement absent stays null", () => {
    const r = addMeasurement(base(), { metric: "http", unit: "status" });
    assert.equal(r.ok, true);
    assert.equal(r.work.measurements[0].measured, false);
    assert.equal(r.work.measurements[0].value, null);
  });

  it("10.branch result does not clobber other branches", () => {
    let w = withBranch(base()).work;
    w = addBranch(w, { worker: "chatgpt", capability: "lu" }).work;
    const id = w.branches[0].branch_id;
    w = setBranchResult(w, id, { summary: "A-ok", node: "gemini" }).work;
    assert.equal(w.branches[0].result.summary, "A-ok");
    assert.equal(w.branches[1].result, null);
  });

  it("11.synthesis gathers, is not a decision", () => {
    let w = withBranch(base()).work;
    w = addEvidence(w, { source: "test", claim: "pass", measured: true }).work;
    w = synthesize(w, { summary: "hold", confidence: "low", node: "chatgpt" }).work;
    assert.equal(w.synthesis.summary, "hold");
    assert.equal(w.synthesis.live, false);
    assert.equal(w.state, "PROPOSED");
    assert.equal(w.decision, null);
  });

  it("12.blocking objection stops progress", () => {
    let w = withBranch(base()).work;
    w = addObjection(w, {
      node: "cursor",
      reason: "secret",
      severity: "BLOCKING",
    }).work;
    assert.equal(w.state, "BLOCKED");
    assert.equal(readyOf(w).ready, false);
    assert.ok(readyOf(w).blockers.includes("objection blocking"));
    const t = transition(w, "READY");
    assert.equal(t.ok, false);
    assert.equal(t.code, "OBJECTION");
  });

  it("13.transition to DECISION", () => {
    let w = withBranch(base()).work;
    w = synthesize(w, { summary: "pack" }).work;
    w = transition(w, "READY").work;
    w = transition(w, "WORKING").work;
    w = transition(w, "REVIEWING").work;
    const d = transition(w, "DECISION", { recommendation: "merge later" });
    assert.equal(d.ok, true);
    assert.equal(d.work.state, "DECISION");
    assert.equal(d.work.decision.status, "PENDING_HUMAN");
    assert.equal(d.work.decision.authority, "carl");
    assert.equal(d.work.decision.human_required, true);
  });

  it("14.cannot DECISION without synthesis", () => {
    let w = withBranch(base()).work;
    w = transition(w, "READY").work;
    w = transition(w, "WORKING").work;
    w = transition(w, "REVIEWING").work;
    const d = transition(w, "DECISION");
    assert.equal(d.ok, false);
    assert.equal(d.code, "NO_SYNTHESIS");
  });

  it("15.humanDecide DONE is Carl only", () => {
    let w = withBranch(base()).work;
    w = synthesize(w, { summary: "ok" }).work;
    w = transition(w, "READY").work;
    w = transition(w, "WORKING").work;
    w = transition(w, "REVIEWING").work;
    w = transition(w, "DECISION").work;
    assert.equal(humanDecide(w, { actor: "gemini", outcome: "DONE" }).code, "HUMAN");
    const h = humanDecide(w, { actor: "carllaliberte", outcome: "DONE" });
    assert.equal(h.ok, true);
    assert.equal(h.work.state, "DONE");
    assert.equal(h.work.decision.status, "DECIDED");
  });

  it("16.human reject", () => {
    let w = withBranch(base()).work;
    w = synthesize(w, { summary: "no" }).work;
    w = transition(w, "READY").work;
    w = transition(w, "WORKING").work;
    w = transition(w, "REVIEWING").work;
    w = transition(w, "DECISION").work;
    const h = humanDecide(w, { actor: "carl", outcome: "REJECTED" });
    assert.equal(h.work.state, "REJECTED");
    assert.equal(transition(h.work, "READY").ok, false);
  });

  it("17.next cycle after DONE", () => {
    let w = withBranch(base()).work;
    w = synthesize(w, { summary: "ok" }).work;
    w = transition(w, "READY").work;
    w = transition(w, "WORKING").work;
    w = transition(w, "REVIEWING").work;
    w = transition(w, "DECISION").work;
    w = humanDecide(w, {
      actor: "carl",
      outcome: "DONE",
      next_objective: "corriger la mesure",
    }).work;
    assert.equal(w.next.state, "PROPOSED");
    assert.equal(w.next.from_task, w.task_id);
    const n = openNext(w);
    assert.equal(n.ok, true);
    assert.equal(n.work.state, "PROPOSED");
    assert.equal(n.work.objective, "corriger la mesure");
  });

  it("18.provenance is kept", () => {
    const { work } = createTask({
      objective: "p",
      node: "grok",
      at: "2026-09-14T20:00:00.000Z",
    });
    assert.equal(work.provenance.node, "grok");
    assert.equal(work.provenance.source, "createTask");
    assert.equal(work.provenance.method, FABRIC_VERSION);
    const w2 = addObservation(work, { node: "gemini", summary: "s" }).work;
    assert.ok(w2.provenance.prior);
    assert.equal(w2.observations[0].provenance.node, "gemini");
  });

  it("19.never mints LIVE", () => {
    const w = createTask({ objective: "x" }).work;
    assert.equal(w.live, false);
    const blob = JSON.stringify(w);
    assert.doesNotMatch(blob, /LIVE VERIFIED/);
    assert.doesNotMatch(blob, /FULL SWARM OPERATIONAL/);
  });

  it("20.snapshot does not mutate the original", () => {
    const a = createTask({ objective: "frozen", required_capabilities: ["lu"] }).work;
    const snap = JSON.stringify(a);
    const b = addBranch(a, { worker: "gemini", capability: "lu" }).work;
    assert.equal(JSON.stringify(a), snap);
    assert.equal(a.branches.length, 0);
    assert.equal(b.branches.length, 1);
    assert.throws(() => {
      a.state = "DONE";
    });
  });
});

describe("fabric.v0 — discovery, transfer, counters, sovereignty", () => {
  it("capability discovery never mints LIVE", () => {
    const w = createTask({
      objective: "x",
      required_capabilities: ["lu", "no-such-cap"],
    }).work;
    const d = discoverCapabilities(w);
    assert.equal(d.live, false);
    assert.ok(d.missing.includes("no-such-cap"));
    assert.ok(d.candidates.some((c) => c.identity && c.live === false));
    assert.ok(d.candidates.every((c) => c.verified === false));
  });

  it("context transfer keeps provenance; INSUFFICIENT if empty", () => {
    let w = withBranch(base()).work;
    w = addBranch(w, { worker: "chatgpt", capability: "lu" }).work;
    const a = w.branches[0].branch_id;
    const b = w.branches[1].branch_id;
    const miss = transferContext(w, a, b, { require: true });
    assert.equal(miss.code, "INSUFFICIENT");
    w = addObservation(w, { node: w.branches[0].worker, summary: "seen" }).work;
    const t = transferContext(w, a, b);
    assert.equal(t.ok, true);
    assert.equal(t.work.branches[1].context.transfer.origin, w.branches[0].worker);
    assert.equal(t.work.synapses.some((s) => s.act === "TRANSFER" && s.grade === "PROPOSED"), true);
  });

  it("synapse EXECUTED requires attestation", () => {
    const w = addSynapse(base(), { from: "a", to: "b", act: "FINDING" }).work;
    const id = w.synapses[0].synapse_id;
    assert.equal(markSynapse(w, id, "EXECUTED").code, "NOT_EXECUTED");
    const m = markSynapse(w, id, "EXECUTED", { executed: true });
    assert.equal(m.ok, true);
    assert.equal(m.work.synapses[0].grade, "EXECUTED");
  });

  it("counters come from the object", () => {
    let w = withBranch(base()).work;
    w = addBranch(w, { worker: "chatgpt", capability: "lu" }).work;
    w = addObservation(w, { node: "gemini", summary: "o" }).work;
    const c = counters(w);
    assert.equal(c.tasks_created, 1);
    assert.equal(c.branches_created, 2);
    assert.equal(c.branches_parallel, 1);
    assert.equal(c.observations, 1);
    assert.equal(c.live, false);
    assert.equal(c.loop, "DEFINED");
    assert.equal(c.synapses_executed, 0);
  });

  it("AI cannot merge or fabricate human decision", () => {
    assert.equal(cannotMerge().auto_merge, false);
    assert.equal(cannotMerge().code, "HUMAN");
    let w = withBranch(base()).work;
    w = synthesize(w, { summary: "x" }).work;
    w = transition(w, "READY").work;
    w = transition(w, "WORKING").work;
    w = transition(w, "REVIEWING").work;
    w = transition(w, "DECISION").work;
    assert.equal(humanDecide(w, { actor: "grok", outcome: "DONE" }).code, "HUMAN");
    assert.equal(cycleDefined().executed, false);
    assert.equal(cycleDefined().continuous, false);
  });
});
