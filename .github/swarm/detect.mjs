/**
 * Findings start PROPOSED. Never auto-normative. Carl decides.
 * First case: CFD / Navier–Stokes — do not accept the conclusion in advance.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { sha256 } from "./lease.mjs";

export const DETECT_VERSION = "detect.v0";

export const FINDING_STATES = Object.freeze([
  "PROPOSED",
  "CONFIRMED",
  "RISK",
  "UNKNOWN",
  "FALSE_POSITIVE",
  "ALREADY_COVERED",
  "HOLD",
  "REJECTED",
]);

function fail(code, error) {
  return { ok: false, code, error };
}

export function makeFinding(input = {}) {
  const agent = String(input.agent || "").trim().toLowerCase();
  const object = String(input.object || "").trim();
  const statement = String(input.statement || "").trim().slice(0, 800);
  if (!statement) return fail("FINDING", "statement required");
  const body = {
    v: DETECT_VERSION,
    agent: agent || null,
    ts: input.ts || new Date().toISOString(),
    object: object || null,
    statement,
    evidence: input.evidence || null,
    proposed_rule: input.proposed_rule || null,
    state: "PROPOSED",
    confidence: null,
    live: false,
    truth: false,
    normative: false,
  };
  return { ok: true, finding: { ...body, id: sha256(JSON.stringify(body)).slice(0, 16) } };
}

function haystack(ctx = {}) {
  if (typeof ctx.text === "string") return ctx.text;
  const files = ctx.files || [];
  return files
    .map((p) => {
      try {
        return readFileSync(p, "utf8");
      } catch {
        return "";
      }
    })
    .join("\n");
}

/**
 * Evaluate. Look for why this could be wrong.
 * CFD/NS: projection doc names Stokes as cost — not a solver.
 */
export function evaluate(finding, ctx = {}) {
  if (!finding || finding.state !== "PROPOSED") {
    return fail("FINDING", "not proposed");
  }
  const text = haystack(ctx).toLowerCase();
  const stmt = String(finding.statement || "").toLowerCase();
  const rule = String(finding.proposed_rule || "").toLowerCase();
  const ns =
    /navier|stokes|cfd/.test(stmt) ||
    /navier|stokes|cfd/.test(String(finding.object || "").toLowerCase());

  if (ns) {
    const covered = /pas de code solveur/.test(text);
    const bansWord = /interdit/.test(rule) && /stokes|navier|cfd/.test(rule);
    if (bansWord) {
      return {
        ok: true,
        verdict: "REJECTED",
        recommend: "REJECT",
        why: "restriction too broad — naming a hole is not shipping a solver",
        already: "REVUE-PROJECTION.md Interdit ici: Pas de code solveur",
        could_be_wrong: "a solver could still be added later — that would be a new finding",
        action5: {
          plus: "no NS solver in this repo",
          minus: "do not ban the word Stokes",
          not_aimed: "projection notes, cost comparisons, Clay claim HOLD",
        },
        finding: { ...finding, state: "REJECTED", normative: false, truth: false },
      };
    }
    if (covered) {
      return {
        ok: true,
        verdict: "ALREADY_COVERED",
        recommend: "REJECT",
        why: "REVUE-PROJECTION.md already forbids a solver; Stokes is a cost comparison",
        could_be_wrong: "the sentence could be read as a solver roadmap",
        action5: {
          plus: "no solver code",
          minus: "do not add a second ban",
          not_aimed: "vocabulary in a named hole list",
        },
        finding: { ...finding, state: "ALREADY_COVERED", normative: false, truth: false },
      };
    }
    return {
      ok: true,
      verdict: "UNKNOWN",
      recommend: "HOLD",
      why: "NS mentioned without the covering sentence in the provided context",
      could_be_wrong: "context files were not passed",
      finding: { ...finding, state: "UNKNOWN", normative: false },
    };
  }

  return {
    ok: true,
    verdict: "HOLD",
    recommend: "HOLD",
    why: "no automatic confirmation — Carl decides",
    could_be_wrong: "missing context",
    finding: { ...finding, state: "HOLD", normative: false, truth: false },
  };
}

export function cannotNorm(finding) {
  return { ...finding, state: "PROPOSED", normative: false };
}

/** Classical model first. Metaphor is not physics. */
export const TALK = Object.freeze({
  PHYSICAL: "physical",
  COMPUTATIONAL: "computational",
  MATH: "math-inspired",
  CLASSICAL: "classical-prob",
  METAPHOR: "metaphor",
  RHETORIC: "rhetoric",
  UNDEMONSTRATED: "undemonstrated",
});

export function classifyTalk(text = "") {
  const s = String(text || "").toLowerCase();
  if (/proposed|unknown|hold|confirmed|rejected/.test(s) && /superposition/.test(s)) {
    return {
      kind: TALK.METAPHOR,
      justified: false,
      use: "classical",
      note: "finding states are not quantum superposition",
    };
  }
  if (/photon|qubit|qkd|intrication|teleport/.test(s) && /git|github|mesh|canal/.test(s)) {
    return {
      kind: TALK.UNDEMONSTRATED,
      justified: false,
      use: "classical",
      note: "no QPU on git — CHANNEL NOT PRESENT",
    };
  }
  if (/analogie|metaphor|comme si/.test(s)) {
    return { kind: TALK.METAPHOR, justified: false, use: "classical", note: "declared analogy" };
  }
  return { kind: TALK.CLASSICAL, justified: true, use: "classical", note: "classical model suffices" };
}

/** UNKNOWN ≠ false. NOT OBSERVED ≠ not existing. */
export function unknownIsNotFalse(observation) {
  if (observation == null || observation === "") {
    return { unknown: true, false: false, existing: null, observed: false };
  }
  return { unknown: false, false: false, observed: true, value: observation };
}

/** A copy has the same provenance. It is not a new proof. */
export function copyProof(proof) {
  if (!proof || typeof proof !== "object") return fail("PROOF", "missing");
  return {
    ok: true,
    kind: "COPIE",
    original: proof.id || proof.hash || null,
    new_proof: false,
    independent: false,
    live: false,
    truth: false,
  };
}

export function independentAgents(a, b) {
  const sa = String((a && a.source) || "");
  const sb = String((b && b.source) || "");
  if (sa && sb && sa === sb) {
    return { ok: true, independent: false, reason: "same source" };
  }
  if (a && b && a.vendor && a.vendor === b.vendor) {
    return { ok: true, independent: false, reason: "same vendor" };
  }
  return { ok: true, independent: false, reason: "independence not proven" };
}

/**
 * Discover what we were not looking for.
 * Local skip ≠ GitHub absence. Undetected ≠ absent.
 * New categories stay PROPOSED.
 */
export function discover(obs = {}) {
  const auto = Array.isArray(obs.auto) ? obs.auto : [];
  const skip = Array.isArray(obs.skip) ? obs.skip : [];
  const skippedAuto = auto.filter((id) => skip.includes(id));
  const findings = [];
  if (skippedAuto.length) {
    findings.push({
      v: DETECT_VERSION,
      category: "DISCOVERED_CATEGORY",
      discovered_category: "ENV_SCOPE",
      title: "auto skip here is not missing in Actions",
      ids: skippedAuto,
      scope: obs.scope || "local",
      state: "PROPOSED",
      recommend: "HOLD",
      normative: false,
      live: false,
      truth: false,
      why_wrong: "GitHub Actions may hold GEMINI_API_KEY / HAIKU_API_KEY",
      undetected_is_not: "absent",
    });
  }
  return {
    ok: true,
    findings,
    detected: findings.length > 0,
    true: false,
    undetected: "not absent",
    live: false,
    auto_merge: false,
  };
}

const LINK_RE = /\[[^\]]*\]\(([^)]+)\)/g;

/** Resolve markdown hrefs from the file that holds them. cwd is not the file. */
export function scanPointers(root, rels = []) {
  const missing = [];
  const checked = [];
  for (const rel of rels) {
    let text = "";
    try {
      text = readFileSync(join(root, rel), "utf8");
    } catch {
      missing.push({ from: rel, href: rel, reason: "source missing" });
      continue;
    }
    LINK_RE.lastIndex = 0;
    let m;
    while ((m = LINK_RE.exec(text))) {
      const raw = String(m[1] || "").split("#")[0].split("?")[0].trim();
      if (!raw || /^(https?:|mailto:)/i.test(raw)) continue;
      checked.push({ from: rel, href: raw });
      const target = join(root, dirname(rel), raw);
      if (!existsSync(target)) missing.push({ from: rel, href: raw, target });
    }
  }
  const findings = missing.map((row) => ({
    category: "DISCOVERED_CATEGORY",
    discovered_category: "PATH_SCOPE",
    title: "relative pointer does not resolve from its file",
    ...row,
    state: "PROPOSED",
    normative: false,
    live: false,
    truth: false,
    why_wrong: "the file may have moved, or the href is documentary",
  }));
  return {
    ok: true,
    checked: checked.length,
    missing,
    findings,
    naive_cwd_is_wrong: true,
    live: false,
  };
}

const FITTERS = [
  {
    id: "ENV_SCOPE",
    fit: (o) =>
      Array.isArray(o.auto) &&
      Array.isArray(o.skip) &&
      o.auto.some((id) => o.skip.includes(id)),
  },
  {
    id: "PATH_SCOPE",
    fit: (o) => Array.isArray(o.missing) && o.missing.length > 0,
  },
  {
    id: "CFD",
    fit: (o) => /navier|stokes|cfd/i.test(String(o.statement || o.note || "")),
  },
];

export function novelFront(obs = {}, extra = []) {
  const tried = [...FITTERS, ...extra].map((f) => {
    let fit = false;
    try {
      fit = Boolean(f.fit(obs));
    } catch {
      fit = false;
    }
    return { id: f.id, fit, why: fit ? "matched" : "missed" };
  });
  const hits = tried.filter((t) => t.fit);
  if (hits.length === 1) {
    return {
      ok: true,
      kind: "KNOWN_CASE",
      dim: hits[0].id,
      tried,
      novel: false,
      normative: false,
      live: false,
    };
  }
  if (hits.length > 1) {
    return {
      ok: true,
      kind: "OVERLAP",
      dims: hits.map((h) => h.id),
      tried,
      novel: false,
      normative: false,
    };
  }
  return {
    ok: true,
    kind: "NOVEL_FRONT_CANDIDATE",
    model_limit: true,
    tried,
    observation: obs.note || obs.statement || null,
    hypothesis: obs.hypothesis || "unnamed-dimension",
    refute: "pass a fitter that matches this observation",
    state: "PROPOSED",
    normative: false,
    live: false,
    truth: false,
  };
}

export function tryToBreak(candidate, extra = []) {
  if (!candidate || candidate.kind !== "NOVEL_FRONT_CANDIDATE") {
    return { ok: true, kind: "NOT_CANDIDATE", survived: false };
  }
  const obs = candidate.obs || {
    note: candidate.observation,
    hypothesis: candidate.hypothesis,
  };
  const again = novelFront(obs, extra);
  if (again.kind !== "NOVEL_FRONT_CANDIDATE") {
    return {
      ok: true,
      kind: "CONTRADICTED",
      survived: false,
      now: again.kind,
      why: "a fitter now matches",
      truth: false,
    };
  }
  return {
    ok: true,
    kind: "SURVIVED",
    survived: true,
    still: "PROPOSED",
    truth: false,
    model_limit: true,
  };
}

export function noveltyRate(events = []) {
  const unexpected = events.filter((e) => e.kind === "SURVIVED").length;
  return {
    unexpected,
    total: events.length,
    rate: events.length ? unexpected / events.length : 0,
    optimize: false,
  };
}
