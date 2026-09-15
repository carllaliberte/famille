import { execFileSync } from "node:child_process";

export const RECOVERY_FLOOR_SHA = "97d49341ae4ccbd630fe4b88cca1139d40408e66";

export function assertRecoveryFloor({ sha = process.env.GITHUB_SHA || "HEAD" } = {}) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", RECOVERY_FLOOR_SHA, sha], {
      stdio: "ignore",
    });
  } catch {
    const error = new Error(
      `RECOVERY_FLOOR_VIOLATION: ${sha} is not a descendant of recovery floor ${RECOVERY_FLOOR_SHA}`,
    );
    error.code = "RECOVERY_FLOOR_VIOLATION";
    throw error;
  }

  return {
    ok: true,
    recovery_floor_sha: RECOVERY_FLOOR_SHA,
    checked_sha: sha,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(assertRecoveryFloor(), null, 2));
}
