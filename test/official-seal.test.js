import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { seal } from "../scripts/official-seal.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("official-seal — no fake ZK / BFT / Φ", () => {
  it("refuses sovereignty theater and does not write cadence.v0.json", () => {
    const s = seal(["--seal-level=Sovereignty", "--meta-epoch=0x0300-OMEGA"]);
    assert.equal(s.zk.status, "CHANNEL NOT PRESENT");
    assert.equal(s.bft.status, "CHANNEL NOT PRESENT");
    assert.equal(s.phi.status, "CHANNEL NOT PRESENT");
    assert.equal(s.phi.value, null);
    assert.equal(s.live, false);
    assert.equal(s.auto_merge, false);
    assert.equal(s.cadence_file_written, false);
    const proc = spawnSync(process.execPath, ["scripts/official-seal.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert.equal(proc.status, 0);
    const json = JSON.parse(proc.stdout);
    assert.equal(json.cycle.executed, true);
    assert.equal(json.cycle.auto_merge, false);
    assert.equal(existsSync(join(ROOT, "cadence.v0.json")), false);
  });
});
