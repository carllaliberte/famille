import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const POINT_FILE = ".acorn/recovery-point.json";
const FLOOR_FILE = "scripts/recovery-floor.mjs";

export function loadPolicy() {
  const point = JSON.parse(readFileSync(POINT_FILE, "utf8"));
  const floorSource = readFileSync(FLOOR_FILE, "utf8");
  const match = floorSource.match(/RECOVERY_FLOOR_SHA\s*=\s*["']([0-9a-f]{40})["']/);
  if (!match) throw new Error("RECOVERY_FLOOR_MISSING: historical floor is not declared");
  if (!point.recovery_sha || !/^[0-9a-f]{40}$/.test(point.recovery_sha)) {
    throw new Error("RECOVERY_POINT_INVALID: recovery_sha must be a full commit SHA");
  }
  return { point, floor_sha: match[1] };
}

export function assertRecoveryPolicy({ sha = process.env.GITHUB_SHA || "HEAD" } = {}) {
  const { point, floor_sha } = loadPolicy();
  for (const [label, baseline] of [["historical_floor", floor_sha], ["latest_recovery_point", point.recovery_sha]]) {
    try {
      execFileSync("git", ["merge-base", "--is-ancestor", baseline, sha], { stdio: "ignore" });
    } catch {
      const error = new Error(`RECOVERY_POLICY_VIOLATION: ${sha} is below ${label} ${baseline}`);
      error.code = "RECOVERY_POLICY_VIOLATION";
      throw error;
    }
  }
  return { ok: true, checked_sha: sha, historical_floor: floor_sha, latest_recovery_point: point.recovery_sha };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(assertRecoveryPolicy(), null, 2));
}
