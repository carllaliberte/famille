import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addBranch,
  assertOperational,
  compareResults,
  correctConflict,
  createTask,
  cycleDefined,
  discoverCapabilities,
  githubCapability,
  humanDecide,
  makeClaim,
  recordConflict,
  reliabilityScore,
  realityTrace,
  synthesize,
  transition,
  verifyOp,
} from "../.github/swarm/fabric.mjs";

function task() {
  let w = createTask({
    objective: "reliability",
    required_capabilities: ["lu"],
    node: "grok",
  }).work;
  w = addBranch(w, { worker: "gemini", capability: "lu" }).work;
  return w;
}

describe("reliability fabric — DEFINED ≠ EXECUTED ≠ VERIFIED ≠ LIVE", () => {
  it("A. successful op is EXECUTED only with executed=true", () => {
    const a = verifyOp({ executed: true, expected: "x", readback: "x" });
    assert.equal(a.state, "VERIFIED");
    const executedOnly = verifyOp({
      executed: true,
      expected: "x",
      readback: "x",
    });
    assert.equal(verifyOp({ executed: true, expected: "sha", readback: "sha" }).state, "VERIFIED");
    const justRun = makeClaim({
      what: "branch_created",
      state: "EXECUTED",
      source: "git push",
      actor: "carllaliberte",
      method: "git",
      executed: true,
    });
    assert.equal(justRun.claim.state, "EXECUTED");
    assert.equal(makeClaim({ what: "x", state: "EXECUTED", source: "s", actor: "a", method: "m" }).code, "NOT_EXECUTED");
  });

  it("B. executed + failed readback = EXECUTED UNVERIFIED, not VERIFIED", () => {
    const r = verifyOp({ executed: true, readback_failed: true, expected: "x" });
    assert.equal(r.state, "EXECUTED");
    assert.equal(r.verification, "UNVERIFIED");
    assert.notEqual(r.state, "VERIFIED");
  });

  it("C. readback contradicts → CONFLICT", () => {
    const r = verifyOp({ executed: true, expected: "X", readback: "Y" });
    assert.equal(r.code, "CONFLICT");
    assert.equal(r.state, "CONFLICT");
    assert.equal(r.a, "X");
    assert.equal(r.b, "Y");
  });

  it("D. two agents different values → DISAGREEMENT", () => {
    const r = compareResults(
      { value: { sha: "aaa" }, provenance: { actor: "codex" } },
      { value: { sha: "bbb" }, provenance: { actor: "build" } },
    );
    assert.equal(r.verdict, "DISAGREEMENT");
    assert.equal(r.live, false);
    const agree = compareResults({ value: 1, provenance: { actor: "a" } }, { value: 1, provenance: { actor: "b" } });
    assert.equal(agree.verdict, "AGREEMENT");
  });

  it("E. missing proof → UNKNOWN / INSUFFICIENT", () => {
    const c = makeClaim({ what: "written", state: "PROPOSED" });
    assert.equal(c.claim.confidence, "low");
    assert.ok(c.claim.missing.includes("source"));
    const bare = assertOperational("written", null);
    assert.equal(bare.code, "INSUFFICIENT");
    assert.equal(bare.state, "UNKNOWN");
  });

  it("F. correction produces a new measurement", () => {
    let w = task();
    const cf = recordConflict(w, { value: "X", provenance: { actor: "a" } }, { value: "Y", provenance: { actor: "b" } });
    assert.equal(cf.work.state, "BLOCKED");
    const done = correctConflict(cf.work, cf.conflict.conflict_id, {
      measured: true,
      value: "Y",
      method: "recheck",
    });
    assert.equal(done.ok, true);
    assert.equal(done.work.measurements.at(-1).metric, "conflict_resolved");
    assert.equal(done.work.measurements.at(-1).measured, true);
    assert.equal(done.work.objections[0].status, "resolved");
  });

  it("G. human decision remains PENDING_HUMAN", () => {
    let w = task();
    w = synthesize(w, { summary: "pack" }).work;
    w = transition(w, "READY").work;
    w = transition(w, "WORKING").work;
    w = transition(w, "REVIEWING").work;
    w = transition(w, "DECISION").work;
    assert.equal(w.decision.status, "PENDING_HUMAN");
    assert.equal(w.decision.authority, "carl");
    assert.equal(humanDecide(w, { actor: "codex", outcome: "DONE" }).code, "HUMAN");
  });

  it("H. roster declared is not LIVE", () => {
    const d = discoverCapabilities(task());
    assert.equal(d.live, false);
    assert.ok(d.candidates.every((c) => c.live === false && c.declared === true));
    assert.equal(githubCapability({ connector_available: true }).live, false);
    assert.equal(githubCapability({ connector_available: true }).ok, false);
  });

  it("refuses unmeasured operational words", () => {
    for (const w of ["connected", "available", "live", "executed", "verified", "certified", "written", "merged"]) {
      const r = assertOperational(w, {});
      assert.equal(r.ok, false, w);
    }
    assert.equal(assertOperational("live", { measured: true }).code, "LIVE_NOT_CARL");
    assert.equal(assertOperational("merged", { measured: true }).code, "HUMAN");
    assert.equal(makeClaim({ what: "x", state: "LIVE", source: "s", actor: "a", method: "m" }).code, "LIVE_NOT_CARL");
    assert.equal(makeClaim({ what: "x", state: "VERIFIED", source: "s", actor: "a", method: "m" }).code, "NOT_VERIFIED");
  });

  it("403 stays a measure; never GitHub=OK", () => {
    const g = githubCapability({
      connector_available: true,
      authenticated: true,
      readable: true,
      writable: false,
      write_attempted: true,
      write_succeeded: false,
      http: 403,
    });
    assert.equal(g.http, 403);
    assert.equal(g.write_succeeded, false);
    assert.equal(g.ok, false);
  });

  it("score is decomposable, not magic", () => {
    const s = reliabilityScore({
      state: "VERIFIED",
      actor: "carllaliberte",
      source: "api",
      method: "readback",
      objections: [],
    });
    assert.equal(s.magic, false);
    assert.equal(s.max, 6);
    assert.equal(s.parts.readback, 1);
    assert.equal(s.parts.execution, 1);
    const weak = reliabilityScore({ state: "PROPOSED" });
    assert.ok(weak.total < s.total);
  });

  it("reality trace is fully provenance-bearing", () => {
    const t = realityTrace([
      { step: "request", state: "PROPOSED", actor: "carl" },
      { step: "observe", state: "OBSERVED", actor: "codex" },
      { step: "action", state: "EXECUTED", actor: "codex", evidence: "push" },
      { step: "readback", state: "OBSERVED", actor: "github" },
      { step: "measure", state: "MEASURED", actor: "codex" },
      { step: "verify", state: "VERIFIED", actor: "codex" },
    ]);
    assert.equal(t.complete, true);
    assert.equal(t.verification, "VERIFIED");
    assert.equal(t.executed, true);
    assert.equal(t.live, false);
    assert.ok(t.rows[0].provenance.source);
  });

  it("cycle V1 remains DEFINED not executed", () => {
    const c = cycleDefined();
    assert.equal(c.executed, false);
    assert.ok(c.steps.includes("verify"));
    assert.ok(c.steps.includes("human_decision"));
  });
});
