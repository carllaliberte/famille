import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CANAL,
  LIVE_CONTRACT_VERSION,
  VITRINE,
  evaluateLive,
  extractSha,
  runLiveProof,
} from "../scripts/live-proof.mjs";

const SHA = "83bdc6907fab35676017296e95c66024157fbbcc";

function htmlHome() {
  return { class: "OK", status: 200, content_type: "text/html; charset=utf-8", body_prefix: "<html>Famille</html>" };
}
function canalMiss() {
  return { class: "HTTP_FAILURE", status: 404, content_type: "application/json", json: { error: "not_this_canal", preview: true } };
}
function previewJuge() {
  return {
    class: "OK",
    status: 200,
    content_type: "application/json; charset=utf-8",
    json: {
      id: "preview-2026-09-15",
      status: "CLASSIQUE",
      preview: true,
      receipt: false,
      quelle: "os",
      temoin: "aucun",
      epsilon: 0.1,
      horizon: "2027-12-31",
      phrase: "Classical — phone entropy is not quantum",
    },
  };
}
function lie() {
  return { class: "HTTP_FAILURE", status: 400, json: { error: "lie", phrase: "Error margin zero is a lie", preview: true } };
}
function missing() {
  return { class: "HTTP_FAILURE", status: 400, json: { error: "EPSILON_MISSING", preview: true } };
}

const measuredPreview = {
  source: "external_probe",
  tested_sha: SHA,
  tested_at: "2026-09-15T22:01:52.000Z",
  authority: "carl",
  auto_merge: false,
  vitrine_home: htmlHome(),
  vitrine_privacy: { class: "HTTP_FAILURE", status: 404, content_type: "text/html" },
  canal_home: canalMiss(),
  critical_juge: previewJuge(),
  epsilon_zero: lie(),
  missing_epsilon: missing(),
  runtime: { runtime_active: true, auto_merge: false, continuity: true },
};

test("LIVE contract version and frozen hosts", () => {
  assert.equal(LIVE_CONTRACT_VERSION, "live-proof.v1");
  assert.equal(VITRINE, "https://acorn-royal-dune-blend.grok.me");
  assert.equal(CANAL, "https://acorn-juge.laliberte22.workers.dev");
});

test("fixture source cannot be LIVE_VERIFIED", () => {
  const proof = evaluateLive({ ...measuredPreview, source: "fixture" });
  assert.equal(proof.overall_status, "LIVE_BLOCKED");
  assert.equal(proof.blocking_reason, "FIXTURE_FORBIDDEN");
  assert.equal(proof.live, false);
  assert.equal(proof.auto_merge, false);
});

test("unknown SHA cannot be LIVE_VERIFIED", () => {
  const proof = evaluateLive({ ...measuredPreview, tested_sha: "" });
  assert.equal(proof.blocking_reason, "SHA_UNKNOWN");
  assert.equal(proof.live, false);
});

test("auto_merge cannot be LIVE_VERIFIED", () => {
  const proof = evaluateLive({ ...measuredPreview, auto_merge: true });
  assert.equal(proof.blocking_reason, "AUTO_MERGE_FORBIDDEN");
  assert.equal(proof.live, false);
});

test("measured preview canal is PREVIEW_NOT_RECEIPT, not LIVE", () => {
  const proof = evaluateLive(measuredPreview);
  assert.equal(proof.overall_status, "LIVE_BLOCKED");
  assert.equal(proof.blocking_reason, "PREVIEW_NOT_RECEIPT");
  assert.equal(proof.live, false);
  assert.equal(proof.application_status, "PREVIEW");
  assert.equal(proof.authority, "carl");
});

test("CLASSIQUE phrase 'not quantum' is not a fake QUANTUM claim", () => {
  const proof = evaluateLive(measuredPreview);
  assert.equal(proof.blocking_reason, "PREVIEW_NOT_RECEIPT");
  assert.notEqual(proof.blocking_reason, "CONTRACT_FAILURE");
});

test("epsilon=0 accepted cannot be LIVE_VERIFIED", () => {
  const proof = evaluateLive({
    ...measuredPreview,
    critical_juge: { ...previewJuge(), json: { ...previewJuge().json, preview: false } },
    epsilon_zero: { class: "OK", status: 200, json: { error: null, preview: false } },
  });
  assert.equal(proof.blocking_reason, "EPSILON_ZERO_ACCEPTED");
  assert.equal(proof.live, false);
});

test("QUANTUM/CERTIFIED payload cannot be LIVE_VERIFIED", () => {
  const proof = evaluateLive({
    ...measuredPreview,
    critical_juge: {
      class: "OK",
      status: 200,
      json: { status: "QUANTUM", preview: false, receipt: false, phrase: "CERTIFIED" },
    },
  });
  assert.equal(proof.blocking_reason, "CONTRACT_FAILURE");
  assert.equal(proof.live, false);
  assert.equal(proof.fake_quantum, false);
});

test("preview=false without deployed SHA is PROVENANCE_FAILURE", () => {
  const proof = evaluateLive({
    ...measuredPreview,
    critical_juge: { ...previewJuge(), json: { ...previewJuge().json, preview: false } },
  });
  assert.equal(proof.blocking_reason, "PROVENANCE_FAILURE");
  assert.equal(proof.live, false);
});

test("SHA mismatch is VERSION_MISMATCH", () => {
  const proof = evaluateLive({
    ...measuredPreview,
    critical_juge: {
      ...previewJuge(),
      json: { ...previewJuge().json, preview: false, git_sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
    },
  });
  assert.equal(proof.blocking_reason, "VERSION_MISMATCH");
  assert.equal(proof.live, false);
});

test("live=true in a preview payload is not LIVE_VERIFIED", () => {
  const proof = evaluateLive({
    ...measuredPreview,
    critical_juge: { ...previewJuge(), json: { ...previewJuge().json, live: true } },
  });
  assert.notEqual(proof.overall_status, "LIVE_VERIFIED");
  assert.equal(proof.live, false);
});

test("extractSha reads headers then json", () => {
  assert.equal(extractSha({ headers: { "x-acorn-sha": SHA }, json: {} }), SHA);
  assert.equal(extractSha({ headers: {}, json: { git_sha: SHA } }), SHA);
  assert.equal(extractSha({ headers: {}, json: { id: "preview-2026-09-15" } }), null);
});

test("external probe of the real canal does not declare LIVE", async () => {
  const { proof } = await runLiveProof({ tested_sha: SHA });
  assert.equal(proof.source, "external_probe");
  assert.equal(proof.overall_status, "LIVE_BLOCKED");
  assert.equal(proof.live, false);
  assert.equal(proof.auto_merge, false);
  assert.equal(proof.blocking_reason, "PREVIEW_NOT_RECEIPT");
});

test("workflow and worker still refuse auto-merge and LIVE flags", () => {
  const worker = readFileSync("scripts/cognitive-worker.mjs", "utf8");
  const yaml = readFileSync(".github/workflows/acorn-autopilot.yml", "utf8");
  assert.match(worker, /never claims LIVE|live: false/);
  assert.match(yaml, /ACORN_LIVE: 'false'/);
  assert.match(yaml, /ACORN_AUTO_MERGE: 'false'/);
  assert.doesNotMatch(yaml, /gh pr merge/);
});
