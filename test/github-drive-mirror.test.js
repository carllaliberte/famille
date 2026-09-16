import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildManifest,
  decideSnapshot,
  driveAvailability,
  emptyMirrorState,
  markDriveBlocked,
  markSynced,
  queuePending,
  runMirror,
  secretScan,
  verifyRestore,
  writeSnapshot,
} from "../scripts/github-drive-mirror.mjs";

const workflow = readFileSync(".github/workflows/github-drive-mirror.yml", "utf8");

function fixture(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), "acorn-mirror-"));
  for (const [name, body] of Object.entries(files)) {
    const path = join(dir, name);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, body);
  }
  return dir;
}

test("workflow is continuous, non-authoritative and does not write main", () => {
  assert.match(workflow, /push:/);
  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /contents: read/);
  assert.doesNotMatch(workflow, /contents: write/);
  assert.match(workflow, /auto_merge=false/);
  assert.match(workflow, /authority=carl/);
  assert.match(workflow, /live=false/);
  assert.match(workflow, /SOURCE_OF_TRUTH=github-main/);
  assert.match(workflow, /node scripts\/github-drive-mirror\.mjs snapshot/);
  assert.match(workflow, /set -o pipefail/);
  assert.match(workflow, /DRIVE_MIRROR=BLOCKED/);
  assert.doesNotMatch(workflow, /gh pr merge/);
  assert.doesNotMatch(workflow, /git push/);
});

test("empty state never claims READY or write authority", () => {
  const state = emptyMirrorState();
  assert.equal(state.source_of_truth, "github-main");
  assert.equal(state.authority, "carl");
  assert.equal(state.auto_merge, false);
  assert.equal(state.live, false);
  assert.equal(state.writes_main, false);
  assert.equal(state.production_write_allowed, false);
  assert.equal(state.drive, "UNKNOWN");
  assert.equal(state.last_sync_status, "UNKNOWN");
  assert.equal(state.pending_count, 0);
});

test("Drive without credentials is BLOCKED, not READY", () => {
  assert.equal(driveAvailability({}), "BLOCKED");
  assert.equal(driveAvailability({ GOOGLE_DRIVE_FOLDER_ID: "folder" }), "BLOCKED");
  assert.equal(driveAvailability({ GOOGLE_DRIVE_ACCESS_TOKEN: "token-name-only" }), "CONFIGURED");
  const blocked = markDriveBlocked(queuePending(emptyMirrorState(), "abc123"));
  assert.equal(blocked.drive, "BLOCKED");
  assert.notEqual(blocked.drive, "READY");
  assert.equal(blocked.last_sync_status, "PENDING");
  assert.equal(blocked.last_sync_error, "DRIVE_CREDENTIALS_MISSING");
});

test("secret scan reports kinds, never values, and excludes secret paths", () => {
  const dir = fixture({
    "README.md": "safe",
    "auth.json": "{\"token\":true}",
    "notes.txt": "mentions OPENROUTER_API_KEY by name only",
  });
  const scan = secretScan(dir);
  assert.equal(scan.clean, false);
  assert.ok(scan.hits.every((hit) => hit.path && hit.kind && !JSON.stringify(hit).includes("sk-")));
  assert.ok(scan.hits.some((hit) => hit.path === "auth.json" && hit.kind === "secret-path"));
  assert.ok(scan.hits.some((hit) => hit.path === "notes.txt" && hit.kind === "openrouter-key-name"));
  rmSync(dir, { recursive: true, force: true });
});

test("decideSnapshot is idempotent on the same SHA", () => {
  const state = { ...emptyMirrorState(), last_snapshot_sha: "aaa111" };
  assert.equal(decideSnapshot({ sha: null }).action, "SKIP");
  assert.equal(decideSnapshot({ sha: "aaa111", state }).action, "ALREADY_SNAPSHOTTED");
  assert.equal(decideSnapshot({ sha: "bbb222", state }).action, "SNAPSHOT_REQUIRED");
  assert.equal(decideSnapshot({ sha: "aaa111", state, rebuild: true }).action, "SNAPSHOT_REQUIRED");
});

test("snapshot writes manifest checksums provenance and excludes secrets", () => {
  const dir = fixture({
    "keep.txt": "visible",
    "auth.json": "should-not-be-copied",
  });
  const out = writeSnapshot({
    root: dir,
    sourceDir: dir,
    sha: "cafebabe",
    date: "2026-09-16",
    now: new Date("2026-09-16T12:00:00.000Z"),
    repository: "carllaliberte/famille",
    branch: "main",
    commit_timestamp: "2026-09-16T12:00:00.000Z",
    workflow_run_id: "595",
  });
  assert.equal(out.secret_scan, "EXCLUDED");
  assert.equal(out.manifest.commit_sha, "cafebabe");
  assert.equal(out.manifest.authority, "carl");
  assert.equal(out.manifest.auto_merge, false);
  assert.equal(out.manifest.writes_main, false);
  assert.ok(out.manifest.files.some((row) => row.path === "keep.txt" && row.sha256));
  assert.ok(!out.manifest.files.some((row) => row.path === "auth.json"));
  assert.match(readFileSync(join(out.dest, "README-MIRROR.md"), "utf8"), /writes_main: false/);
  const restored = verifyRestore(out.dest, { commit_sha: "cafebabe", cleanup: true });
  assert.equal(restored.ok, true);
  assert.equal(restored.checksum_match, true);
  assert.equal(restored.commit_match, true);
  assert.equal(restored.writes_main, false);
  rmSync(dir, { recursive: true, force: true });
});

test("runMirror without Drive credentials snapshots GitHub and stays BLOCKED", () => {
  const dir = fixture({ "FILE.md": "ok" });
  const outRoot = join(dir, "github-drive-snapshots");
  const first = runMirror({
    root: dir,
    sourceDir: dir,
    outRoot,
    env: { GITHUB_SHA: "deadbeef", GITHUB_REPOSITORY: "carllaliberte/famille", GITHUB_RUN_ID: "1" },
    git: () => { throw new Error("no git in fixture"); },
    now: new Date("2026-09-16T13:00:00.000Z"),
  });
  assert.equal(first.decision, "SNAPSHOT_REQUIRED");
  assert.equal(first.drive, "BLOCKED");
  assert.equal(first.last_sync_status, "PENDING");
  assert.equal(first.last_snapshot_sha, "deadbeef");
  assert.equal(first.last_drive_synced_sha, null);
  assert.equal(first.auto_merge, false);
  assert.equal(first.writes_main, false);
  assert.notEqual(first.drive, "READY");
  assert.equal(first.drive_object_id, "UNKNOWN");

  const second = runMirror({
    root: dir,
    sourceDir: dir,
    outRoot,
    env: { GITHUB_SHA: "deadbeef", GITHUB_REPOSITORY: "carllaliberte/famille" },
    git: () => { throw new Error("no git in fixture"); },
    now: new Date("2026-09-16T13:01:00.000Z"),
  });
  assert.equal(second.decision, "ALREADY_SNAPSHOTTED");
  assert.equal(second.drive, "BLOCKED");
  assert.equal(second.pending_count, 1);
  rmSync(dir, { recursive: true, force: true });
});

test("configured Drive without an executed upload stays PENDING, never READY", () => {
  const dir = fixture({ "FILE.md": "ok" });
  const out = runMirror({
    root: dir,
    sourceDir: dir,
    outRoot: join(dir, "github-drive-snapshots"),
    env: {
      GITHUB_SHA: "abc1234",
      GITHUB_REPOSITORY: "carllaliberte/famille",
      GOOGLE_DRIVE_ACCESS_TOKEN: "present-but-unused",
    },
    git: () => { throw new Error("no git"); },
    now: new Date("2026-09-16T14:00:00.000Z"),
  });
  assert.equal(out.drive, "CONFIGURED");
  assert.equal(out.last_sync_status, "PENDING");
  assert.equal(out.last_sync_error, "DRIVE_SYNC_NOT_EXECUTED");
  assert.notEqual(out.drive, "READY");
  rmSync(dir, { recursive: true, force: true });
});

test("injected Drive upload can mark SYNCED and a second call is ALREADY_SYNCED", () => {
  const dir = fixture({ "FILE.md": "ok" });
  const outRoot = join(dir, "github-drive-snapshots");
  const env = {
    GITHUB_SHA: "feedface",
    GITHUB_REPOSITORY: "carllaliberte/famille",
    GOOGLE_DRIVE_ACCESS_TOKEN: "present-but-unused",
  };
  const first = runMirror({
    root: dir,
    sourceDir: dir,
    outRoot,
    env,
    git: () => { throw new Error("no git"); },
    now: new Date("2026-09-16T15:00:00.000Z"),
    driveUpload: () => ({
      drive_object_id: "drive-obj-1",
      sync_completed_at: "2026-09-16T15:00:01.000Z",
    }),
  });
  assert.equal(first.drive, "READY");
  assert.equal(first.last_sync_status, "SYNCED");
  assert.equal(first.last_drive_synced_sha, "feedface");
  assert.equal(first.pending_count, 0);

  const again = markSynced(
    { ...emptyMirrorState(), last_drive_synced_sha: "feedface", pending: [] },
    "feedface",
    { already: true, drive_object_id: "drive-obj-1" },
  );
  assert.equal(again.last_sync_status, "ALREADY_SYNCED");
  rmSync(dir, { recursive: true, force: true });
});

test("manifest never invents missing identity fields", () => {
  const manifest = buildManifest({ files: [{ path: "a", size: 1, sha256: "00" }] });
  assert.equal(manifest.repository, "UNKNOWN");
  assert.equal(manifest.commit_sha, "UNKNOWN");
  assert.equal(manifest.workflow_run_id, "UNKNOWN");
  assert.equal(manifest.file_count, 1);
  assert.equal(manifest.live, false);
});

test("Drive failure queues RETRY without dropping the GitHub snapshot", () => {
  const dir = fixture({ "FILE.md": "ok" });
  const out = runMirror({
    root: dir,
    sourceDir: dir,
    outRoot: join(dir, "github-drive-snapshots"),
    env: {
      GITHUB_SHA: "baddcafe",
      GOOGLE_DRIVE_ACCESS_TOKEN: "present-but-unused",
    },
    git: () => { throw new Error("no git"); },
    driveUpload: () => { throw new Error("network"); },
    now: new Date("2026-09-16T16:00:00.000Z"),
  });
  assert.equal(out.decision, "SNAPSHOT_REQUIRED");
  assert.equal(out.last_snapshot_sha, "baddcafe");
  assert.equal(out.last_sync_status, "RETRY");
  assert.equal(out.last_sync_error, "network");
  assert.notEqual(out.drive, "READY");
  rmSync(dir, { recursive: true, force: true });
});
