#!/usr/bin/env node
/**
 * ACORN ORGANISM SYNC — one-way evidence around GitHub main.
 *
 * GitHub main = SOURCE OF TRUTH.
 * Backup / Drive / mirrors never write back into main.
 * Not a second runtime, Cortex, Defense, Breaker or Fabric.
 * Missing Drive = CHANNEL_NOT_PRESENT, never success.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  driveAvailability,
  emptyMirrorState,
  runMirror,
  verifyRestore,
} from "./github-drive-mirror.mjs";

export const ORGANISM_SYNC_VERSION = "acorn.organism-sync.v1";

function text(v) {
  return String(v ?? "").trim();
}

export function inventoryProbe() {
  return {
    ok: true,
    version: ORGANISM_SYNC_VERSION,
    source_of_truth: "github-main",
    writes_main: false,
    auto_merge: false,
    live: false,
    authority: "carl",
    second_runtime: false,
  };
}

export function observeMainSha({ env = process.env, git, root } = {}) {
  const fromEnv = text(env.ACORN_MAIN_SHA || (env.GITHUB_REF_NAME === "main" ? env.GITHUB_SHA : ""));
  if (fromEnv) {
    return { sha: fromEnv, source: "env", branch: "main", status: "OBSERVED" };
  }
  const runner = typeof git === "function"
    ? git
    : (args) => execFileSync("git", args, {
      cwd: root || process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  try {
    const sha = text(runner(["rev-parse", "origin/main"]));
    if (sha) return { sha, source: "git-origin-main", branch: "main", status: "OBSERVED" };
  } catch {
    // fall through
  }
  try {
    const sha = text(runner(["rev-parse", "main"]));
    if (sha) return { sha, source: "git-main", branch: "main", status: "OBSERVED" };
  } catch {
    // fall through
  }
  return { sha: "UNKNOWN", source: "NOT_PRESENT", branch: "main", status: "UNKNOWN" };
}

export function observeDrive(env = process.env) {
  const availability = driveAvailability(env);
  if (availability === "BLOCKED") {
    return {
      GOOGLE_DRIVE: "CHANNEL_NOT_PRESENT",
      availability,
      status: "CHANNEL_NOT_PRESENT",
      synchronized: false,
      authority: false,
      writes_main: false,
      live: false,
    };
  }
  if (availability === "CONFIGURED") {
    return {
      GOOGLE_DRIVE: "CONFIGURED",
      availability,
      status: "CONFIGURED",
      synchronized: false,
      authority: false,
      writes_main: false,
      live: false,
    };
  }
  return {
    GOOGLE_DRIVE: "UNKNOWN",
    availability: availability || "UNKNOWN",
    status: "UNKNOWN",
    synchronized: false,
    authority: false,
    writes_main: false,
    live: false,
  };
}

export function discoverMirrors({ env = process.env, git } = {}) {
  const mirrors = [];
  const drive = observeDrive(env);
  mirrors.push({
    id: "google-drive",
    kind: "backup",
    status: drive.GOOGLE_DRIVE,
    reachable: drive.GOOGLE_DRIVE === "CONFIGURED",
    writes_main: false,
    authority: false,
  });
  if (typeof git === "function") {
    try {
      const listing = text(git(["remote", "-v"]));
      const seen = new Set();
      for (const line of listing.split("\n")) {
        const [name] = line.trim().split(/\s+/);
        if (!name || name === "origin" || seen.has(name)) continue;
        seen.add(name);
        mirrors.push({
          id: name,
          kind: "git-remote",
          status: "DISCOVERED",
          reachable: false,
          writes_main: false,
          authority: false,
        });
      }
    } catch {
      // measured absence of extra remotes is not a mirror
    }
  }
  const reachable = mirrors.filter((row) => row.reachable === true);
  const extra = mirrors.filter((row) => row.id !== "google-drive");
  return {
    mirrors,
    reachable_count: reachable.length,
    extra_remote_count: extra.length,
    synchronized: false,
    status: reachable.length ? "CONFIGURED" : extra.length ? "DISCOVERED" : "CHANNEL_NOT_PRESENT",
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

export function nextConstructionWork({ inventory, integrity, reconcile } = {}) {
  const items = [];
  for (const row of integrity?.findings || []) {
    items.push({
      subject: row.subject,
      act: row.kind === "UNWIRED" ? "WIRE" : row.kind === "UNDEPLOYED" ? "DEPLOY" : "MEASURE",
      reason: row.reason,
      handed_to: "grok-codex",
    });
  }
  if (reconcile?.GOOGLE_DRIVE === "CHANNEL_NOT_PRESENT") {
    items.push({
      subject: "google-drive",
      act: "HOLD_HUMAN",
      reason: "CHANNEL_NOT_PRESENT",
      handed_to: "carl",
    });
  }
  if (reconcile?.mirror_status === "CHANNEL_NOT_PRESENT" || reconcile?.mirror_status === "NOT_PRESENT") {
    items.push({
      subject: "mirror",
      act: "HOLD_HUMAN",
      reason: reconcile.mirror_status,
      handed_to: "carl",
    });
  }
  if (inventory?.coverage?.drifted_count > 0) {
    items.push({
      subject: "inventory",
      act: "ISOLATE",
      reason: "DRIFT_DETECTED",
      handed_to: "grok-codex",
    });
  }
  return {
    status: items.length ? "DISCOVERED" : "QUIET",
    items: items.slice(0, 48),
    count: items.length,
    handed_to: "grok-codex",
    auto_merge: false,
    live: false,
    authority: "carl",
  };
}

export function reconcileOrganism({
  main,
  previousSha = null,
  inventory,
  previousInventory = null,
  backup = emptyMirrorState(),
  mirrors,
  drive,
  restore = null,
  at = new Date().toISOString(),
} = {}) {
  const mainSha = main?.sha || "UNKNOWN";
  const prevIds = new Set((previousInventory?.entries || []).map((row) => row.id));
  const currIds = new Set((inventory?.entries || []).map((row) => row.id));
  const added = [...currIds].filter((id) => !prevIds.has(id));
  const removed = [...prevIds].filter((id) => !currIds.has(id));
  const stale = (inventory?.drift || []).map((row) => row.subject);
  const backupCurrent = backup?.last_snapshot_sha && backup.last_snapshot_sha === mainSha;
  const driveState = drive || observeDrive();
  const mirrorState = mirrors || { status: "UNKNOWN", synchronized: false };
  const divergent = Boolean(
    stale.length
    || added.length
    || removed.length
    || backupCurrent === false
    || driveState.GOOGLE_DRIVE === "CHANNEL_NOT_PRESENT"
    || mirrorState.synchronized !== true,
  );
  return {
    version: ORGANISM_SYNC_VERSION,
    observed_at: at,
    source_of_truth: "github-main",
    repository: "carllaliberte/famille",
    branch: main?.branch || "main",
    main_sha: mainSha,
    main_sha_source: main?.source || "UNKNOWN",
    previous_sha: previousSha,
    changed: mainSha !== "UNKNOWN" && previousSha ? mainSha !== previousSha : "UNKNOWN",
    capabilities_added: added,
    capabilities_removed: removed,
    stale_evidence: stale,
    backup_current: backupCurrent === true,
    backup_sha: backup?.last_snapshot_sha || null,
    backup_status: backup?.last_sync_status || "UNKNOWN",
    GOOGLE_DRIVE: driveState.GOOGLE_DRIVE,
    drive_synchronized: driveState.synchronized === true,
    mirror_status: mirrorState.status || "UNKNOWN",
    mirrors_current: mirrorState.synchronized === true,
    restore: restore || { status: "UNKNOWN", ok: false },
    divergent,
    writes_main: false,
    auto_merge: false,
    live: false,
    authority: "carl",
  };
}

export function observeBackupMirror({
  env = process.env,
  root = resolve("."),
  mainSha,
  git,
  writeLocalSnapshot = false,
  outRoot,
  now = new Date(),
} = {}) {
  const drive = observeDrive(env);
  const mirrors = discoverMirrors({ env, git });
  const state = emptyMirrorState();
  state.drive = drive.availability === "BLOCKED" ? "BLOCKED" : drive.availability;
  state.last_sync_status = drive.GOOGLE_DRIVE === "CHANNEL_NOT_PRESENT" ? "CHANNEL_NOT_PRESENT" : "UNKNOWN";
  state.last_sync_error = drive.GOOGLE_DRIVE === "CHANNEL_NOT_PRESENT" ? "CHANNEL_NOT_PRESENT" : null;
  let restore = { status: "UNKNOWN", ok: false, reason: "NO_SNAPSHOT" };
  let backup = { ...state, decision: "SKIP" };
  if (writeLocalSnapshot === true && mainSha && mainSha !== "UNKNOWN") {
    const destRoot = outRoot || join(root, "github-drive-snapshots");
    backup = runMirror({
      root,
      sourceDir: root,
      outRoot: destRoot,
      env: { ...env, GITHUB_SHA: mainSha, GITHUB_REPOSITORY: env.GITHUB_REPOSITORY || "carllaliberte/famille" },
      git,
      now,
    });
    const date = now.toISOString().slice(0, 10);
    const candidates = [
      join(destRoot, `${date}-${mainSha}`),
      join(destRoot, "github-drive-snapshots", `${date}-${mainSha}`),
    ];
    const snap = candidates.find((path) => existsSync(join(path, "manifest.json")));
    if (snap) {
      restore = { ...verifyRestore(snap, { commit_sha: mainSha }), status: "MEASURED" };
    }
  }
  if (drive.GOOGLE_DRIVE === "CHANNEL_NOT_PRESENT") {
    backup = {
      ...backup,
      drive: "BLOCKED",
      GOOGLE_DRIVE: "CHANNEL_NOT_PRESENT",
      last_sync_status: backup.last_sync_status === "SYNCED" ? backup.last_sync_status : "CHANNEL_NOT_PRESENT",
      writes_main: false,
      live: false,
    };
  }
  return {
    version: ORGANISM_SYNC_VERSION,
    drive,
    mirrors,
    backup,
    restore,
    writes_main: false,
    synchronized: false,
    live: false,
    auto_merge: false,
    authority: "carl",
  };
}

function isMain() {
  const here = fileURLToPath(import.meta.url);
  const argv1 = process.argv[1] ? String(process.argv[1]) : "";
  return argv1.endsWith("acorn-organism-sync.mjs") || here === argv1;
}

if (isMain()) {
  const root = resolve(process.env.ACORN_RUNTIME_ROOT || join(dirname(fileURLToPath(import.meta.url)), ".."));
  const main = observeMainSha({ env: process.env, root });
  const observed = observeBackupMirror({
    env: process.env,
    root,
    mainSha: main.sha,
    writeLocalSnapshot: false,
  });
  const reconcile = reconcileOrganism({
    main,
    backup: observed.backup,
    mirrors: observed.mirrors,
    drive: observed.drive,
    restore: observed.restore,
  });
  console.log(JSON.stringify({
    version: ORGANISM_SYNC_VERSION,
    main,
    GOOGLE_DRIVE: observed.drive.GOOGLE_DRIVE,
    mirror_status: observed.mirrors.status,
    backup_status: observed.backup.last_sync_status,
    restore: observed.restore.status,
    divergent: reconcile.divergent,
    writes_main: false,
    auto_merge: false,
    live: false,
    authority: "carl",
  }, null, 2));
}
