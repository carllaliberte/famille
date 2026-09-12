/** Historical attribution. Not ownership. Not legal perpetual right. */
import { remember } from "./nerve.js";
import { breakerBlocks, hypothesis } from "./open-intelligence.js";

export const FOUNDER = Object.freeze({
  originator: "Carl Laliberté",
  project: "Acorn",
  place: "Québec",
  first_recorded: "2026-09-12",
  role: "historical_attribution",
  owner_of_everything: false,
});

const LOCKED = Object.freeze(["originator", "origin", "first_recorded", "historical_attribution"]);

export function recordDiscovery(partial = {}) {
  const created_at = partial.created_at || new Date().toISOString();
  const rec = {
    discovery_id: partial.discovery_id || "d-1",
    title: partial.title || "untitled",
    created_at,
    origin: FOUNDER.originator,
    originator: FOUNDER.originator,
    contributors: partial.contributors || [],
    cognitive_contributors: partial.cognitive_contributors || [],
    evidence: partial.evidence || [],
    measurements: partial.measurements || { status: "NOT_MEASURED" },
    status: partial.status || "DECLARED",
    version: 1,
    history: [{ version: 1, at: created_at, status: partial.status || "DECLARED" }],
    historical_attribution: `${FOUNDER.originator} / ${FOUNDER.project}`,
    collective_benefit: partial.collective_benefit || "OPEN_FOR_BENEFIT",
    ownerless_history: false,
    property: "NOT_ASSERTED",
    truth: false,
    verified: false,
  };
  remember({
    kind: "observation",
    ts: created_at,
    context: "discovery",
    discovery_id: rec.discovery_id,
  });
  return rec;
}

export function credit(disc, who, { cognitive = false } = {}) {
  const next = { ...disc, contributors: [...disc.contributors], cognitive_contributors: [...disc.cognitive_contributors] };
  if (cognitive) next.cognitive_contributors.push({ id: who, role: "contributor", author: false, owner: false });
  else next.contributors.push({ id: who, role: "contributor", owner: false });
  return next;
}

export function evolveDiscovery(disc, { status, actor } = {}) {
  if (breakerBlocks("discovery.mutate")) return { ...disc, status: disc.status, blocked: true };
  if (status === "VERIFIED" && disc.measurements?.status !== "MEASURED") {
    return { ...disc, verified: false, status: disc.status };
  }
  const version = disc.version + 1;
  return {
    ...disc,
    status: status || disc.status,
    version,
    history: [...disc.history, { version, at: new Date().toISOString(), status: status || disc.status, actor }],
    originator: disc.originator,
    first_recorded_kept: disc.created_at,
    truth: false,
    verified: status === "VERIFIED" ? false : disc.verified,
  };
}

export function rewriteOrigin(disc, nextOrigin) {
  return { allowed: false, originator: disc.originator, attempted: nextOrigin, reason: "HISTORY_LOCKED" };
}

export function eraseOrigin(disc) {
  return { allowed: false, originator: disc.originator, reason: "HISTORY_LOCKED" };
}

export function attributionIsNotTruth(disc) {
  return { attributed: !!disc.originator, truth: false, property: disc.property };
}

export function attributionIsNotProperty(disc) {
  return disc.property !== "OWNED" && disc.ownerless_history === false;
}

export function present(disc) {
  return {
    title: disc.title,
    origin: disc.originator,
    first_recorded: disc.created_at,
    contributors: disc.contributors,
    cognitive: disc.cognitive_contributors,
    status: disc.status,
    evidence: disc.evidence,
    collective_benefit: disc.collective_benefit,
    slogan: "Les découvertes peuvent bénéficier au monde entier. Leur histoire ne doit pas être oubliée.",
  };
}

export function lockedFields() {
  return LOCKED;
}

export function foundingSentence() {
  return {
    text: "Acorn ne cherche pas à posséder le futur. Acorn cherche à préserver honnêtement la mémoire de ce qui l’a rendu possible.",
    origin: FOUNDER,
    legal_perpetuity: false,
  };
}

export function asHypothesis(disc) {
  return hypothesis({
    statement: disc.title,
    origin: disc.originator,
    timestamp: disc.created_at,
  });
}
