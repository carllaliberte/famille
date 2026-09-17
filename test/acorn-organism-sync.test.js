import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  discoverMirrors,
  inventoryProbe,
  nextConstructionWork,
  observeBackupMirror,
  observeDrive,
  observeMainSha,
  reconcileOrganism,
} from "../scripts/acorn-organism-sync.mjs";

test("sync probe refuses a second runtime and never writes main", () => {
  const probe = inventoryProbe();
  assert.equal(probe.ok, true);
  assert.equal(probe.writes_main, false);
  assert.equal(probe.second_runtime, false);
  assert.equal(probe.live, false);
  assert.equal(probe.auto_merge, false);
  assert.equal(probe.authority, "carl");
});

test("Drive without credentials is CHANNEL_NOT_PRESENT, never READY", () => {
  const drive = observeDrive({});
  assert.equal(drive.GOOGLE_DRIVE, "CHANNEL_NOT_PRESENT");
  assert.equal(drive.status, "CHANNEL_NOT_PRESENT");
  assert.equal(drive.synchronized, false);
  assert.notEqual(drive.GOOGLE_DRIVE, "READY");
});

test("main SHA is UNKNOWN when git and env are absent, never invented", () => {
  const main = observeMainSha({
    env: {},
    git: () => { throw new Error("no git"); },
  });
  assert.equal(main.sha, "UNKNOWN");
  assert.equal(main.status, "UNKNOWN");
  assert.equal(main.branch, "main");
});

test("configured Drive stays CONFIGURED and unsynchronized without an upload", () => {
  const drive = observeDrive({ GOOGLE_DRIVE_ACCESS_TOKEN: "present-but-unused" });
  assert.equal(drive.GOOGLE_DRIVE, "CONFIGURED");
  assert.equal(drive.synchronized, false);
});

test("mirrors do not invent a destination and never claim synchronized", () => {
  const mirrors = discoverMirrors({ env: {}, git: () => "origin  https://github.com/carllaliberte/famille (fetch)" });
  assert.equal(mirrors.synchronized, false);
  assert.equal(mirrors.extra_remote_count, 0);
  assert.equal(mirrors.status, "CHANNEL_NOT_PRESENT");
  assert.equal(mirrors.mirrors[0].id, "google-drive");
  assert.equal(mirrors.mirrors[0].writes_main, false);
});

test("local snapshot can be restored without writing main", () => {
  const dir = mkdtempSync(join(tmpdir(), "acorn-sync-"));
  writeFileSync(join(dir, "FILE.md"), "ok\n");
  const observed = observeBackupMirror({
    env: { GITHUB_REPOSITORY: "carllaliberte/famille" },
    root: dir,
    mainSha: "cafe0123",
    writeLocalSnapshot: true,
    outRoot: join(dir, "github-drive-snapshots"),
    git: () => { throw new Error("no git"); },
    now: new Date("2026-09-17T03:20:00.000Z"),
  });
  assert.equal(observed.drive.GOOGLE_DRIVE, "CHANNEL_NOT_PRESENT");
  assert.equal(observed.backup.GOOGLE_DRIVE, "CHANNEL_NOT_PRESENT");
  assert.equal(observed.restore.ok, true);
  assert.equal(observed.restore.checksum_match, true);
  assert.equal(observed.restore.commit_match, true);
  assert.equal(observed.writes_main, false);
  assert.equal(observed.synchronized, false);
  const reconcile = reconcileOrganism({
    main: { sha: "cafe0123", source: "env", branch: "main" },
    inventory: { entries: [{ id: "scripts/ok" }], drift: [] },
    backup: observed.backup,
    mirrors: observed.mirrors,
    drive: observed.drive,
    restore: observed.restore,
  });
  assert.equal(reconcile.source_of_truth, "github-main");
  assert.equal(reconcile.main_sha, "cafe0123");
  assert.equal(reconcile.GOOGLE_DRIVE, "CHANNEL_NOT_PRESENT");
  assert.equal(reconcile.mirrors_current, false);
  assert.equal(reconcile.writes_main, false);
  assert.equal(reconcile.live, false);
  const next = nextConstructionWork({
    inventory: { coverage: { drifted_count: 0 } },
    integrity: { findings: [{ subject: "scripts/orphan", kind: "UNWIRED", reason: "present but unwired" }] },
    reconcile,
  });
  assert.equal(next.status, "DISCOVERED");
  assert.ok(next.items.some((row) => row.act === "WIRE"));
  assert.ok(next.items.some((row) => row.act === "HOLD_HUMAN" && row.reason === "CHANNEL_NOT_PRESENT"));
  assert.equal(next.auto_merge, false);
  rmSync(dir, { recursive: true, force: true });
});
