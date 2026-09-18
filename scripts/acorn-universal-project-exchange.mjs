/** ACORN — UNIVERSAL PROJECT EXCHANGE
 * Rail de projet : intent → graphe. Pas LIVE. Pas un paiement réel.
 * compileIntentToReality s'arrête à COMPOSING (DEFINED).
 * PAY / AUTHORIZE / EXECUTE / DELIVER / MEASURE = fonctions explicites, HOLD_HUMAN.
 */
export const CONTRACT = "acorn.universal-project-exchange.v1";
export const STATES = Object.freeze([
  "INTAKE",
  "QUALIFYING",
  "COMPOSING",
  "SIMULATING",
  "OFFERED",
  "ORDERED",
  "AUTHORIZED",
  "EXECUTING",
  "VERIFYING",
  "DELIVERED",
  "VALUE_MEASURED",
  "RENEWAL",
  "EXPANDED",
  "BLOCKED",
  "EXPIRED"
]);
export const COMPILER_STOPS_AT = "COMPOSING";
export const REMAINING_AFTER_COMPILE = Object.freeze([
  "SIMULATE",
  "OFFER",
  "ORDER",
  "PAYMENT",
  "AUTHORIZE",
  "EXECUTE",
  "VERIFY",
  "DELIVER",
  "MEASURE"
]);

const A = (v) => (Array.isArray(v) ? v : []);
const n = () => new Date().toISOString();

function refuseAuto(project = {}) {
  if (project.breaker_touched) throw Error("BREAKER_MUST_REMAIN_UNTOUCHED");
  if (project.auto_merge) throw Error("AUTO_MERGE_FORBIDDEN");
  if (project.auto_signature) throw Error("AUTO_SIGNATURE_FORBIDDEN");
  if (project.auto_spend) throw Error("AUTO_SPEND_FORBIDDEN");
}

export function intake({
  intent,
  customer = null,
  constraints = {},
  budget = null,
  deadline = null,
  outcome = null
} = {}) {
  if (!intent) throw Error("INTENT_REQUIRED");
  return {
    contract: CONTRACT,
    state: "INTAKE",
    intent,
    customer,
    constraints,
    budget,
    deadline,
    outcome,
    authority: false,
    external_effect: false,
    live: false,
    breaker_touched: false,
    created_at: n()
  };
}

export function qualify(project, { required = [], available_capabilities = [], evidence = [] } = {}) {
  const missing = A(required).filter((x) => !A(available_capabilities).includes(x));
  return {
    ...project,
    state: missing.length ? "QUALIFYING" : "COMPOSING",
    required: A(required),
    available_capabilities: A(available_capabilities),
    missing_capabilities: missing,
    evidence: A(evidence),
    qualification: { complete: missing.length === 0 },
    authority: false,
    breaker_touched: false
  };
}

export function compose(
  project,
  { capabilities = [], participants = [], resources = [], dependencies = [] } = {}
) {
  return {
    ...project,
    state: "COMPOSING",
    composition: {
      capabilities: A(capabilities),
      participants: A(participants),
      resources: A(resources),
      dependencies: A(dependencies)
    },
    execution_graph: {
      nodes: [...A(capabilities), ...A(participants), ...A(resources)],
      dependencies: A(dependencies)
    },
    authority: false,
    requires_authorization: true,
    breaker_touched: false
  };
}

export function simulate(project, { cost = null, duration = null, risk = "UNKNOWN", alternatives = [] } = {}) {
  return {
    ...project,
    state: "SIMULATING",
    simulation: {
      estimated_cost: cost,
      estimated_duration: duration,
      risk,
      alternatives: A(alternatives)
    },
    authority: false,
    external_effect: false,
    breaker_touched: false
  };
}

export function offer(project, { price = null, currency = "USD", terms = [], value_hypothesis = null } = {}) {
  return {
    ...project,
    state: "OFFERED",
    offer: { price, currency, terms: A(terms), value_hypothesis },
    payment_observed: false,
    execution_authorized: false,
    value_measured: false,
    authority: false,
    breaker_touched: false
  };
}

export function order(project = {}) {
  refuseAuto(project);
  return {
    ...project,
    state: "ORDERED",
    payment_observed: false,
    execution_authorized: false,
    authority: false,
    breaker_touched: false
  };
}

/** Observe un paiement. Ne paie pas. N'autorise pas. Pas LIVE. */
export function pay(project = {}, { observed = true } = {}) {
  refuseAuto(project);
  return {
    ...project,
    state: project.state === "OFFERED" || project.state === "ORDERED" ? "ORDERED" : project.state,
    payment_observed: Boolean(observed),
    execution_authorized: false,
    authority: false,
    live: false,
    breaker_touched: false
  };
}

export function authorize(project, { human_authorized = false } = {}) {
  refuseAuto(project);
  return {
    ...project,
    state: human_authorized ? "AUTHORIZED" : "BLOCKED",
    execution_authorized: Boolean(human_authorized),
    authority: Boolean(human_authorized),
    authorization: { human_authorized: Boolean(human_authorized) },
    breaker_touched: false
  };
}

/** Pose EXECUTING en mémoire. Pas un effet réel. Exige authorize(), pas pay(). */
export function execute(project = {}) {
  refuseAuto(project);
  if (project.execution_authorized !== true) {
    assertProjectConstitution({
      ...project,
      state: "EXECUTING",
      payment_observed: project.payment_observed === true,
      execution_authorized: false
    });
    throw Error(project.payment_observed === true ? "PAYMENT_IS_NOT_AUTHORIZATION" : "AUTHORIZATION_REQUIRED");
  }
  return {
    ...project,
    state: "EXECUTING",
    external_effect: false,
    live: false,
    authority: false,
    breaker_touched: false
  };
}

export function verify(project = {}) {
  refuseAuto(project);
  if (project.state !== "EXECUTING") throw Error("EXECUTE_REQUIRED");
  return { ...project, state: "VERIFYING", authority: false, live: false, breaker_touched: false };
}

/** Pose DELIVERED en mémoire. Pas une livraison réelle. Exige execute() + authorize(). */
export function deliver(project = {}) {
  refuseAuto(project);
  if (project.execution_authorized !== true) {
    throw Error(project.payment_observed === true ? "PAYMENT_IS_NOT_AUTHORIZATION" : "AUTHORIZATION_REQUIRED");
  }
  if (project.state !== "EXECUTING" && project.state !== "VERIFYING") throw Error("EXECUTE_REQUIRED");
  return {
    ...project,
    state: "DELIVERED",
    delivered: true,
    live: false,
    authority: false,
    breaker_touched: false
  };
}

export function measureValue(project, { value = null, cost = null, quality = null, outcome = null } = {}) {
  return {
    ...project,
    state: "VALUE_MEASURED",
    measurement: {
      value,
      cost,
      quality,
      outcome,
      margin: value === null || cost === null ? null : value - cost
    },
    value_measured: value !== null,
    authority: false,
    breaker_touched: false
  };
}

export function learn(project, { reuse_candidates = [], improvements = [] } = {}) {
  return {
    ...project,
    state: "EXPANDED",
    learning: { reuse_candidates: A(reuse_candidates), improvements: A(improvements) },
    authority: false,
    breaker_touched: false
  };
}

export function assertProjectConstitution(x = {}) {
  if (x.breaker_touched) throw Error("BREAKER_MUST_REMAIN_UNTOUCHED");
  if (x.auto_merge) throw Error("AUTO_MERGE_FORBIDDEN");
  if (x.auto_signature) throw Error("AUTO_SIGNATURE_FORBIDDEN");
  if (x.auto_spend) throw Error("AUTO_SPEND_FORBIDDEN");
  if (x.payment_observed && x.execution_authorized === false && x.state === "EXECUTING") {
    throw Error("PAYMENT_IS_NOT_AUTHORIZATION");
  }
  return true;
}

/** DEFINED seulement. Jamais PAYMENT / AUTHORIZE / EXECUTE / DELIVER. */
export function compileIntentToReality(input = {}) {
  let p = intake(input);
  p = qualify(p, input);
  p = compose(p, input);
  return {
    ...p,
    compiler_stops_at: COMPILER_STOPS_AT,
    remaining: [...REMAINING_AFTER_COMPILE],
    remaining_are_explicit_functions: true,
    live: false
  };
}
