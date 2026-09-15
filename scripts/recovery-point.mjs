import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const POINT_FILE = ".acorn/recovery-point.json";

export function loadRecoveryPoint(path = POINT_FILE) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function assertFromRecoveryPoint({ sha = process.env.GITHUB_SHA || "HEAD", point = loadRecoveryPoint() } = {}) {
  if (!point?.recovery_sha) {
    throw new Error("RECOVERY_POINT_MISSING: no recovery_sha is recorded");
  }

  try {
    execFileSync("git", ["merge-base", "--is-ancestor", point.recovery_sha, sha], {
      stdio: "ignore",
    });
  } catch {
    const error = new Error(
      `RECOVERY_POINT_VIOLATION: ${sha} is not a descendant of ${point.recovery_sha}`,
    );
    error.code = "RECOVERY_POINT_VIOLATION";
    throw error;
  }

  return {
    ok: true,
    recovery_sha: point.recovery_sha,
    checked_sha: sha,
    stage: point.stage,
  };
}

export function recoveryStartCommand(point = loadRecoveryPoint()) {
  return `git switch --create bugfix/from-recovery-${point.recovery_sha.slice(0, 12)} ${point.recovery_sha}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = assertFromRecoveryPoint();
  console.log(JSON.stringify({ ...result, recovery_start_command: recoveryStartCommand() }, null, 2));
}
