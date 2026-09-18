import test from "node:test";
import assert from "node:assert/strict";
import {
  auditSnapshot,
  normalizePullRequest,
  consolidateRepairPortfolio,
  buildRepairMandate,
  nextAction,
  assertMaintenanceContract
} from "../scripts/acorn-continuous-maintenance.mjs";

test("normalizes divergent PRs against current main", () => {
  const pr = normalizePullRequest({
    number:873,title:"repair",state:"open",ahead_by:3,behind_by:82,
    base:"main",head_sha:"abc",base_sha:"mainsha"
  },"mainsha");
  assert.equal(pr.divergent,true);
  assert.equal(pr.stale,true);
});

test("consolidates many defects into one coherent repair portfolio", () => {
  const result = nextAction({
    repository:"carllaliberte/famille",
    main_sha:"main-1",
    pull_requests:[
      {number:1,title:"old A",state:"open",ahead_by:2,behind_by:30,base:"main"},
      {number:2,title:"old B",state:"open",ahead_by:1,behind_by:50,base:"main"}
    ],
    workflow_runs:[{id:9,name:"tests",conclusion:"failure",status:"completed"}]
  });
  assert.equal(result.action,"REPAIR_PORTFOLIO");
  assert.equal(result.one_coherent_change,true);
  assert.equal(result.no_micro_tasks,true);
  assert.equal(result.actionable_count,3);
  assertMaintenanceContract(result);
});

test("human boundary does not become autonomous authority", () => {
  const result = nextAction({
    main_sha:"main-2",
    pull_requests:[],
    workflow_runs:[],
    boundaries:[{code:"SECRET_REQUIRED"}]
  });
  assert.equal(result.action,"HOLD_HUMAN");
  assert.equal(result.authority,"carl");
  assert.equal(result.auto_merge,false);
});

test("healthy repository remains in observe state", () => {
  const result = nextAction({main_sha:"main-3",pull_requests:[],workflow_runs:[]});
  assert.equal(result.action,"OBSERVE");
  assert.equal(result.finding_count,0);
});

test("mandate explicitly forbids fake reality and micro-task splitting", () => {
  const result = nextAction({
    main_sha:"main-4",
    pull_requests:[{number:7,title:"stale",state:"open",ahead_by:1,behind_by:10,base:"main"}],
    workflow_runs:[]
  });
  assert.match(result.mandate,/ONE coherent repair\/evolution chantier/);
  assert.match(result.mandate,/Never auto-merge/);
  assert.match(result.mandate,/Never invent LIVE/);
  assertMaintenanceContract(result);
});
