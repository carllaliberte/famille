#!/usr/bin/env node
/**
 * GitHub main is SOURCE_OF_TRUTH. Drive is a mirror, never an authority.
 * Missing Drive credentials = BLOCKED pending, not READY. Never writes main.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SECRET_PATH = /(^|\/)(\.env|auth\.json|credentials\.json|id_rsa|.*\.pem)$/i;
const SECRET_NAME = /OPENROUTER_API_KEY|OPENAI_API_KEY|CODEX_AUTH_JSON|GOOGLE_DRIVE_ACCESS_TOKEN|sk-[A-Za-z0-9]/;

export function emptyMirrorState() {
  return {
    source_of_truth: "github-main",
    authority: "carl",
    auto_merge: false,
    live: false,
    writes_main: false,
    production_write_allowed: false,
    drive: "UNKNOWN",
    last_sync_status: "UNKNOWN",
    last_sync_error: null,
    last_snapshot_sha: null,
    last_drive_synced_sha: null,
    drive_object_id: "UNKNOWN",
    pending: [],
    pending_count: 0,
  };
}

export function driveAvailability(env = {}) {
  if (String(env.GOOGLE_DRIVE_ACCESS_TOKEN || env.GOOGLE_DRIVE_CREDENTIALS || "").trim()) return "CONFIGURED";
  return "BLOCKED";
}

export function queuePending(state, sha) {
  const pending = [...new Set([...(state.pending || []), sha].filter(Boolean))];
  return { ...state, pending, pending_count: pending.length, last_sync_status: "PENDING" };
}

export function markDriveBlocked(state) {
  return {
    ...state,
    drive: "BLOCKED",
    last_sync_status: state.last_sync_status === "UNKNOWN" ? "PENDING" : state.last_sync_status,
    last_sync_error: "DRIVE_CREDENTIALS_MISSING",
    live: false,
    auto_merge: false,
  };
}

export function markSynced(state, sha, extra = {}) {
  if (extra.already) {
    return { ...state, last_sync_status: "ALREADY_SYNCED", last_drive_synced_sha: sha, drive_object_id: extra.drive_object_id || state.drive_object_id };
  }
  return {
    ...state,
    drive: "READY",
    last_sync_status: "SYNCED",
    last_drive_synced_sha: sha,
    last_sync_error: null,
    pending: [],
    pending_count: 0,
    drive_object_id: extra.drive_object_id || "UNKNOWN",
  };
}

export function secretScan(root) {
  const hits = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      const rel = relative(root, path).replaceAll("\\", "/");
      const st = statSync(path);
      if (st.isDirectory()) {
        walk(path);
        continue;
      }
      if (SECRET_PATH.test(rel)) hits.push({ path: rel, kind: "secret-path" });
      const text = readFileSync(path, "utf8");
      if (/OPENROUTER_API_KEY/.test(text)) hits.push({ path: rel, kind: "openrouter-key-name" });
    }
  };
  if (existsSync(root)) walk(root);
  return { clean: hits.length === 0, hits };
}

export function decideSnapshot({ sha = null, state = emptyMirrorState(), rebuild = false } = {}) {
  if (!sha) return { action: "SKIP" };
  if (!rebuild && state.last_snapshot_sha === sha) return { action: "ALREADY_SNAPSHOTTED" };
  return { action: "SNAPSHOT_REQUIRED" };
}

export function buildManifest(input = {}) {
  return {
    repository: input.repository || "UNKNOWN",
    commit_sha: input.commit_sha || "UNKNOWN",
    branch: input.branch || "UNKNOWN",
    workflow_run_id: input.workflow_run_id || "UNKNOWN",
    commit_timestamp: input.commit_timestamp || "UNKNOWN",
    file_count: (input.files || []).length,
    files: input.files || [],
    authority: "carl",
    auto_merge: false,
    live: false,
    writes_main: false,
    source_of_truth: "github-main",
  };
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function listFiles(root) {
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      const rel = relative(root, path).replaceAll("\\", "/");
      const st = statSync(path);
      if (st.isDirectory()) {
        if (rel === "github-drive-snapshots" || rel === "node_modules" || rel === ".git") continue;
        walk(path);
        continue;
      }
      if (SECRET_PATH.test(rel)) continue;
      files.push(rel);
    }
  };
  walk(root);
  return files;
}

export function writeSnapshot({
  root,
  sourceDir,
  sha,
  date,
  now = new Date(),
  repository = "UNKNOWN",
  branch = "main",
  commit_timestamp = "UNKNOWN",
  workflow_run_id = "UNKNOWN",
} = {}) {
  const dest = join(root, "github-drive-snapshots", `${date || now.toISOString().slice(0, 10)}-${sha}`);
  mkdirSync(dest, { recursive: true });
  const files = [];
  for (const rel of listFiles(sourceDir)) {
    const buf = readFileSync(join(sourceDir, rel));
    const out = join(dest, rel);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, buf);
    files.push({ path: rel, size: buf.length, sha256: sha256(buf) });
  }
  const manifest = buildManifest({
    files,
    repository,
    commit_sha: sha,
    branch,
    workflow_run_id,
    commit_timestamp,
  });
  writeFileSync(join(dest, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(
    join(dest, "README-MIRROR.md"),
    `# Mirror snapshot\n\ncommit: ${sha}\nwrites_main: false\nauthority: carl\nauto_merge: false\nlive: false\n`,
  );
  return { dest, manifest, secret_scan: "EXCLUDED" };
}

export function verifyRestore(dest, { commit_sha, cleanup = false } = {}) {
  const manifest = JSON.parse(readFileSync(join(dest, "manifest.json"), "utf8"));
  let checksum_match = true;
  for (const row of manifest.files || []) {
    const buf = readFileSync(join(dest, row.path));
    if (sha256(buf) !== row.sha256) checksum_match = false;
  }
  if (cleanup) rmSync(join(dest, ".restore-tmp"), { recursive: true, force: true });
  return {
    ok: checksum_match && (commit_sha ? manifest.commit_sha === commit_sha : true),
    checksum_match,
    commit_match: !commit_sha || manifest.commit_sha === commit_sha,
    writes_main: false,
  };
}

function loadState(outRoot) {
  const path = join(outRoot, "state.json");
  if (!existsSync(path)) return emptyMirrorState();
  try { return { ...emptyMirrorState(), ...JSON.parse(readFileSync(path, "utf8")) }; } catch { return emptyMirrorState(); }
}

function saveState(outRoot, state) {
  mkdirSync(outRoot, { recursive: true });
  writeFileSync(join(outRoot, "state.json"), `${JSON.stringify(state, null, 2)}\n`);
}

export function runMirror({
  root = ROOT,
  sourceDir = root,
  outRoot = join(root, "github-drive-snapshots"),
  env = process.env,
  git = null,
  now = new Date(),
  driveUpload = null,
  rebuild = false,
} = {}) {
  let sha = String(env.GITHUB_SHA || "").trim();
  if (!sha && git) {
    try { sha = String(git(["rev-parse", "HEAD"]) || "").trim(); } catch { sha = ""; }
  }
  let state = loadState(outRoot);
  const decision = decideSnapshot({ sha, state, rebuild }).action;
  if (decision === "SNAPSHOT_REQUIRED") {
    writeSnapshot({
      root: outRoot,
      sourceDir,
      sha,
      date: now.toISOString().slice(0, 10),
      now,
      repository: env.GITHUB_REPOSITORY,
      branch: "main",
      commit_timestamp: now.toISOString(),
      workflow_run_id: env.GITHUB_RUN_ID,
    });
    state = queuePending({ ...state, last_snapshot_sha: sha }, sha);
  }
  const drive = driveAvailability(env);
  if (drive === "BLOCKED") {
    state = markDriveBlocked(state);
    state.drive_object_id = state.drive_object_id || "UNKNOWN";
    saveState(outRoot, state);
    return { ...state, decision, drive: "BLOCKED" };
  }
  state.drive = "CONFIGURED";
  if (typeof driveUpload === "function") {
    try {
      const uploaded = driveUpload({ sha, dest: outRoot });
      state = markSynced(state, sha, uploaded || {});
    } catch (error) {
      state.last_sync_status = "RETRY";
      state.last_sync_error = String(error.message || error);
    }
  } else {
    state.last_sync_status = "PENDING";
    state.last_sync_error = "DRIVE_SYNC_NOT_EXECUTED";
  }
  saveState(outRoot, state);
  return { ...state, decision };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runMirror();
  console.log(JSON.stringify(result, null, 2));
}
