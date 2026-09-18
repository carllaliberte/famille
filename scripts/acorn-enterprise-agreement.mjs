/** ACORN enterprise-agreement.v0
 * Progressive commercial drafts toward Acorn.
 * DRAFT != SIGNED != ACTIVE != LIVE.
 * auto_contract stays false. Only Carl may sign.
 * Arcon is a typo for Acorn. Counterparties are Acorn and the other providers.
 */
const ISO = () => new Date().toISOString();
const clean = (v) => String(v ?? "").trim().toLowerCase();

export const ENTERPRISE_AGREEMENT_VERSION = "acorn.enterprise-agreement.v0";
export const AGREEMENT_STATES = Object.freeze([
  "DRAFT", "PROPOSED", "HOLD_HUMAN", "SIGNED", "ACTIVE",
  "MEASURED", "OPTIMIZED_TOWARD_ACORN", "REJECTED",
]);
export const AGREEMENT_PHASES = Object.freeze(["MOU", "PILOT", "ROUTE_ACORN", "ORDER_FORM"]);
export const AGREEMENT_KINDS = Object.freeze(["MOU", "PILOT", "ROUTE_ACORN", "ORDER_FORM", "DPA", "MSA"]);
export const COUNTERPARTIES = Object.freeze([
  "openai", "anthropic", "google", "xai", "mistral", "cohere", "deepseek",
  "groq", "cerebras", "together", "sambanova", "fireworks", "huggingface",
  "openrouter", "ollama", "bedrock", "azure-openai", "nvidia-nim", "workers-ai",
]);

const PHASE_RANK = Object.freeze({ MOU: 0, PILOT: 1, ROUTE_ACORN: 2, ORDER_FORM: 3 });

function seal(row) {
  return Object.freeze({
    contract: ENTERPRISE_AGREEMENT_VERSION,
    id: row.id,
    party_a: "acorn",
    party_b: row.party_b,
    kind: row.kind,
    phase: row.phase,
    state: row.state,
    signed: false,
    live: false,
    auto_contract: false,
    auto_spend: false,
    auto_merge: false,
    authority: false,
    price: "UNPRICED_UNTIL_MEASURED",
    optimization_target: "acorn",
    signer: row.signer ?? null,
    created_at: row.created_at,
    updated_at: ISO(),
    note: row.note ?? "",
  });
}

export function normalizeCounterparty(name) {
  const raw = clean(name);
  if (!raw) return { id: null, alias_of: null, reason: "EMPTY" };
  if (raw === "arcon" || raw === "arcon-grok-build" || raw === "arcon_grok_build") {
    return { id: "acorn", alias_of: raw, reason: "ARCON_IS_ACORN" };
  }
  if (raw === "acorn" || raw === "famille") return { id: "acorn", alias_of: raw, reason: "WORK" };
  if (COUNTERPARTIES.includes(raw)) return { id: raw, alias_of: null, reason: "PROVIDER" };
  return { id: raw, alias_of: null, reason: "DECLARED_UNKNOWN" };
}

export function createAgreement({
  party_b,
  kind = "MOU",
  phase = "MOU",
  note = "",
} = {}) {
  const counter = normalizeCounterparty(party_b);
  if (!counter.id || counter.id === "acorn") {
    throw new Error("COUNTERPARTY_MUST_BE_OTHER_PROVIDER");
  }
  const k = AGREEMENT_KINDS.includes(kind) ? kind : "MOU";
  const p = AGREEMENT_PHASES.includes(phase) ? phase : "MOU";
  return seal({
    id: `acorn-${counter.id}-${k.toLowerCase()}`,
    party_b: counter.id,
    kind: k,
    phase: p,
    state: "DRAFT",
    signer: null,
    created_at: ISO(),
    note: note || `Draft ${k} Acorn\u2194${counter.id}. Not signed. Not live.`,
  });
}

export function proposeAgreement(agreement) {
  if (!agreement || agreement.state !== "DRAFT") {
    return { ...agreement, state: agreement?.state === "DRAFT" ? "DRAFT" : agreement?.state, hold: "NOT_DRAFT" };
  }
  return seal({ ...agreement, state: "PROPOSED", created_at: agreement.created_at });
}

export function requestSignature(agreement, { actor } = {}) {
  const who = clean(actor);
  if (who !== "carl") {
    return seal({
      ...agreement,
      state: "HOLD_HUMAN",
      created_at: agreement.created_at,
      note: "Only Carl may sign. AI cannot execute a commercial agreement.",
    });
  }
  return seal({
    ...agreement,
    state: "HOLD_HUMAN",
    signer: "carl",
    created_at: agreement.created_at,
    note: "Carl may squash/sign. Instrument remains unsigned until human act outside this script.",
  });
}

export function signAgreement() {
  return {
    state: "HOLD_HUMAN",
    signed: false,
    live: false,
    auto_contract: false,
    reason: "SCRIPT_CANNOT_SIGN",
  };
}

export function optimizeTowardAcorn(agreement) {
  if (!agreement || agreement.signed === true) {
    return { ...agreement, live: false, auto_contract: false, reason: "UNSIGNED_OR_INVALID" };
  }
  const current = AGREEMENT_PHASES.includes(agreement.phase) ? agreement.phase : "MOU";
  const nextIndex = Math.min((PHASE_RANK[current] ?? 0) + 1, AGREEMENT_PHASES.length - 1);
  const next = AGREEMENT_PHASES[nextIndex];
  return seal({
    ...agreement,
    phase: next,
    kind: next,
    state: agreement.state === "DRAFT" || agreement.state === "PROPOSED" ? "DRAFT" : agreement.state,
    created_at: agreement.created_at,
    note: `Phase advanced on paper toward Acorn: ${current} → ${next}. Still unsigned.`,
  });
}

export function seedProviderDrafts() {
  return COUNTERPARTIES.map((party_b) => createAgreement({ party_b, kind: "MOU", phase: "MOU" }));
}

export function snapshotAgreements({ drafts = seedProviderDrafts() } = {}) {
  return Object.freeze({
    contract: ENTERPRISE_AGREEMENT_VERSION,
    count: drafts.length,
    signed: 0,
    live: false,
    auto_contract: false,
    auto_spend: false,
    auto_merge: false,
    authority: false,
    optimization_target: "acorn",
    arcon_is_acorn: true,
    drafts: drafts.map((row) => ({ id: row.id, party_b: row.party_b, state: row.state, phase: row.phase, signed: false })),
    hold_human: ["signature", "price", "secrets", "merge"],
    created_at: ISO(),
  });
}
