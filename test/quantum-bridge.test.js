import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, it } from "node:test";
import {
  CANALS,
  PLANES,
  opticalLease,
  opticalPresence,
  rejectDataPlaneOnControl,
  remember,
  resetCognition,
  runCycle,
  shareAcrossProjects,
} from "../.github/swarm/cognition.mjs";
import { resetGuests } from "../.github/swarm/flux.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");

afterEach(() => {
  resetCognition();
  resetGuests();
});

describe("optical quantum bridge — control vs data", () => {
  it("names CLASSICAL and OPTICAL_QUANTUM without forking mesh.v0", () => {
    assert.deepEqual([...CANALS], ["CLASSICAL", "OPTICAL_QUANTUM"]);
    assert.deepEqual([...PLANES], ["control", "data"]);
    const mesh = JSON.parse(read("schema/mesh.v0.json"));
    assert.equal(mesh.properties.flux.const, "acorn.v0");
    assert.deepEqual(mesh.properties.canal.enum, ["CLASSICAL", "OPTICAL_QUANTUM"]);
    assert.equal(mesh.properties.next, false);
    assert.doesNotMatch(read("schema/mesh.v0.json"), /COLLECTIVE_COGNITION/);
    assert.doesNotMatch(read("schema/mesh.v0.json"), /"chatgpt"/);
  });

  it("OPTICAL_QUANTUM stays CHANNEL NOT PRESENT; schema does not mint CONNECTED", () => {
    const lease = opticalLease({
      certificate: "classical-lease-2026-09-09",
      loss_db_max: 0.3,
      fidelity_min: 0.99,
      ts: "2026-09-09T02:30:00.000Z",
    });
    assert.equal(lease.ok, true);
    assert.equal(lease.lease.canal, "OPTICAL_QUANTUM");
    assert.equal(lease.lease.live, false);
    const p = opticalPresence(lease.lease);
    assert.equal(p.presence, "CHANNEL_NOT_PRESENT");
    assert.equal(p.connected, false);
    assert.equal(opticalPresence(lease.lease, { claim: "CONNECTED" }).code, "CLAIMED_CHANNEL");
    const real = opticalPresence(lease.lease, { fiber: true, secret: true });
    assert.equal(real.presence, "CONNECTED");
    assert.equal(real.live, false);
  });

  it("rejects photonic payload on the mesh control plane", () => {
    assert.equal(rejectDataPlaneOnControl({ photonic: true }).code, "PHOTONIC_ON_CONTROL");
    assert.equal(rejectDataPlaneOnControl({ qubit: "ψ" }).code, "PHOTONIC_ON_CONTROL");
    assert.equal(
      remember({ from: "grok", statement: "qkd-key material", canal: "OPTICAL_QUANTUM" }).code,
      "PHOTONIC_ON_CONTROL",
    );
    assert.equal(
      opticalLease({ certificate: "x", photon: true }).code,
      "PHOTONIC_ON_CONTROL",
    );
    const ok = rejectDataPlaneOnControl({ body: "sync the lease. Never LIVE." });
    assert.equal(ok.ok, true);
    assert.equal(ok.plane, "control");
  });

  it("does not break multi-project isolation", () => {
    const a = runCycle({ topic: "classical coordination", project: "famille" });
    const b = runCycle({ topic: "other fiber lease", project: "other-project" });
    assert.equal(a.ok, true, a.error);
    assert.equal(b.ok, true, b.error);
    assert.equal(a.session.canal, "CLASSICAL");
    assert.equal(a.session.plane, "control");
    assert.equal(shareAcrossProjects(a.lesson, "other-project").code, "IMPLICIT_LEAK");
    const copied = shareAcrossProjects(a.lesson, "other-project", { explicit: true });
    assert.equal(copied.ok, true);
    assert.equal(copied.entry.project, "other-project");
  });

  it("docs keep QUANTUM-MASTER private and forbid wrangler", () => {
    const doc = read("docs/quantum-bridge.md");
    assert.match(doc, /plan de contrôle/);
    assert.match(doc, /OPTICAL_QUANTUM/);
    assert.match(doc, /CHANNEL NOT PRESENT/);
    assert.match(doc, /QUANTUM-MASTER/);
    assert.match(doc, /Pas wrangler/);
    assert.match(doc, /Invitation Carl/);
    assert.match(doc, /Pas mTLS matériel/);
    assert.doesNotMatch(doc, /wrangler deploy/);
  });
});
