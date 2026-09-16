import test from "node:test";
import assert from "node:assert/strict";
import { assertWorkRecord, buildWorkRecord, nextFromMissing, STAGES } from "../scripts/work-record.mjs";

test("stage ladder is CODE≠TESTED≠EXECUTED≠MEASURED≠VERIFIED≠LIVE", () => {
  assert.deepEqual(STAGES, ["code", "tested", "executed", "measured", "verified", "live"]);
});

test("LIVE without LIVE_VERIFIED proof is refused", () => {
  assert.throws(
    () => buildWorkRecord({ stages: { code: true, tested: true, executed: true, measured: true, verified: true, live: true }, live: { claimed: true, proof: "LIVE_BLOCKED" } }),
    /LIVE_WITHOUT_PROOF/,
  );
});

test("skipping a stage is refused", () => {
  assert.throws(
    () => buildWorkRecord({ stages: { code: true, live: true }, live: { proof: "LIVE_VERIFIED" } }),
    /STAGE_SKIPPED/,
  );
});

test("auto_merge is refused", () => {
  assert.throws(() => buildWorkRecord({ auto_merge: true }), /AUTO_MERGE_FORBIDDEN/);
});

test("authority is carl", () => {
  assert.throws(() => buildWorkRecord({ authority: "grok", governance: { authority: "grok", auto_merge: false, merge: "human" } }), /AUTHORITY_NOT_CARL/);
});

test("executed without defined is refused", () => {
  assert.throws(
    () => buildWorkRecord({
      stages: { code: true, tested: true, executed: true },
      defined_vs_executed: [{ name: "dispatch", defined: false, executed: true }],
    }),
    /EXECUTED_WITHOUT_DEFINED/,
  );
});

test("missing unknown tool becomes BUILD_TOOL, not I cannot", () => {
  const next = nextFromMissing([{ kind: "tool", name: "missing-external-probe", why: "no external LIVE probe" }], []);
  assert.equal(next.decision, "BUILD_TOOL");
  assert.equal(next.tool, "missing-external-probe");
  assert.match(next.then, /reuse/);
});

test("existing tool is reused instead of rebuilt", () => {
  const next = nextFromMissing([{ kind: "tool", name: "live-proof", why: "no external LIVE probe" }], []);
  assert.equal(next.decision, "REUSE");
  assert.equal(next.tool, "live-proof");
});

test("built tool is kept as reusable, live stays false without proof", () => {
  const record = buildWorkRecord({
    objective: "prove Acorn LIVE end to end",
    observed: "canal preview:true, no deployed sha",
    files: ["scripts/live-proof.mjs", "scripts/work-record.mjs"],
    architecture: ["MAIN reality", "ACORN cognition", "CODEX acts", "CARL merges"],
    contracts: ["CODE≠TESTED≠EXECUTED≠MEASURED≠VERIFIED≠LIVE", "preview≠receipt"],
    tools_built: [{ name: "live-proof", reuse: "npm run live:probe" }, { name: "work-record", reuse: "scripts/work-record.mjs" }],
    tools_reuse: ["evidence-seal", "live-proof"],
    missing: [{ kind: "human", name: "wrangler bind grok.me /juge", why: "no Cloudflare credentials" }],
    live: { claimed: false, proof: "LIVE_BLOCKED", reason: "PREVIEW_NOT_RECEIPT" },
    provenance: { sha: "83bdc6907fab35676017296e95c66024157fbbcc", artifacts: ["evidence/live/"] },
    stages: { code: true, tested: true, executed: true, measured: true, verified: false, live: false },
    tests: { added: ["test/live-proof.test.js", "test/work-record.test.js"], pass: 812, fail: 0, total: 812 },
  });
  assert.equal(record.live.claimed, false);
  assert.equal(record.stages.live, false);
  assert.equal(record.auto_merge, false);
  assert.equal(record.authority, "carl");
  assert.equal(assertWorkRecord(record), true);
  const next = nextFromMissing(record.missing, record.tools_built);
  assert.equal(next.decision, "HOLD_HUMAN");
});
