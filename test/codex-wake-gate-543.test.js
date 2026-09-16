import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyMemory,
  skippedForSha,
  wakeOpenCodexTask,
} from "../scripts/codex-autonomy.mjs";

/**
 * #543 measured contract (not LIVE):
 * SHA changé → wake obligatoire.
 * même SHA + état déjà traité → skip idempotent.
 */
describe("#543 wake gate", () => {
  it("SHA changé → skipped_tasks de l'ancien SHA ignorés → wake", () => {
    const memory = emptyMemory();
    memory.skipped_tasks = [
      { number: 543, sha: "old", reason: "CODEX_FAILED" },
      { number: 560, sha: "old", reason: "CODEX_FAILED" },
    ];
    const currentSha = "new";
    const skipped = skippedForSha(memory, currentSha);
    assert.deepEqual(skipped, []);
    const wake = wakeOpenCodexTask({
      currentSha,
      previousSha: "old",
      skippedOnCurrentSha: skipped,
      openTaskNumbers: [543, 560],
    });
    assert.equal(wake.wake, true);
    assert.equal(wake.skip_invalidated, true);
    assert.deepEqual(wake.tasks, [543, 560]);
    assert.match(wake.reason, /SHA changed|open codex-task/i);
  });

  it("même SHA + tâches déjà traitées → skip idempotent", () => {
    const memory = emptyMemory();
    memory.skipped_tasks = [
      { number: 543, sha: "same", reason: "CODEX_FAILED" },
      { number: 560, sha: "same", reason: "CODEX_FAILED" },
    ];
    const skipped = skippedForSha(memory, "same");
    assert.deepEqual(skipped.sort(), [543, 560]);
    const wake = wakeOpenCodexTask({
      currentSha: "same",
      previousSha: "same",
      skippedOnCurrentSha: skipped,
      openTaskNumbers: [543, 560],
    });
    assert.equal(wake.wake, false);
    assert.equal(wake.skip_invalidated, false);
    assert.match(wake.reason, /SKIP_JUSTIFIÉ/);
  });
});
