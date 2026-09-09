/**
 * Findings start PROPOSED. Never auto-normative. Carl decides.
 * First case: CFD / Navier–Stokes — do not accept the conclusion in advance.
 */
import { readFileSync } from "node:fs";
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
