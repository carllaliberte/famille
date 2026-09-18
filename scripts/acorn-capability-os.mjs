/** ACORN — CAPABILITY OPERATING SYSTEM
 * Durable typed graph on existing persistState. Open types. Open relations.
 * Not a second graph, market, economic, evidence, or execution engine.
 * IDENTITY ≠ REPRESENTATION. AVAILABLE ≠ RIGHT_TO_USE. SIMULATED ≠ EXECUTED.
 */
import { operateProblem, describeCapability, futureProofContract, isolateRealm, asOf } from "./acorn-operational-fabric.mjs";

export const CAPABILITY_OS_VERSION = "acorn.capability-os.v0";
export const RELATIONS = Object.freeze([
  "CAN_PROVIDE", "REQUIRES", "DEPENDS_ON", "COMPOSES", "IMPLEMENTS", "USES", "PRODUCES",
  "MEASURES", "PROVES", "CONTRADICTS", "DERIVES_FROM", "LICENSED_BY", "OWNED_BY",
  "AUTHORIZED_BY", "EXECUTED_BY", "PAID_BY", "DELIVERED_TO", "SERVES", "COMPETES_WITH",
  "SUBSTITUTES", "COMPLEMENTS", "VALID_DURING", "EXPIRES_AT", "FAILED_BECAUSE",
  "LEARNED_FROM", "IMPROVES", "REPLACES", "FEDERATES_WITH"
]);
export const HOLD_CODES = Object.freeze([
  "NO_SOLUTION_FOUND", "MISSING_CAPABILITY", "INSUFFICIENT_EVIDENCE",
  "AUTHORIZATION_REQUIRED", "RESOURCE_REQUIRED", "HUMAN_DECISION_REQUIRED"
]);

const ISO = () => new Date().toISOString();
const str = (v) => String(v ?? "").trim();

export function node({
  type = "CAPABILITY",
  key,
  id = null,
  version = "1",
  owner = null,
  state = "PROPOSED",
  representation = null,
  channel = null,
  rights = [],
  authority = false,
  cost = null,
  value = null,
  valid_from = null,
  valid_until = null
} = {}) {
  const k = str(key);
  if (!k) return { error: "KEY_REQUIRED", live: false };
  const t = str(type).toUpperCase() || "UNKNOWN";
  return {
    id: id || (t.toLowerCase() + ":" + k),
    type: t,
    key: k,
    version: str(version) || "1",
    owner,
    provenance: "acorn-os",
    created_at: ISO(),
    valid_from: valid_from || ISO(),
    valid_until,
    state,
    representation: representation || null,
    channel: channel || null,
    identity_is_not_representation: true,
    identity_is_not_channel: true,
    rights: Array.isArray(rights) ? rights : [],
    available: state === "AVAILABLE" || state === "CONNECTED",
    right_to_use: Array.isArray(rights) && rights.length > 0,
    authority: false,
    cost: cost == null ? { value: null, state: "NOT_MEASURED" } : { value: Number(cost), state: "OBSERVED" },
    value: value == null ? { value: null, state: "NOT_MEASURED" } : { value: Number(value), state: "OBSERVED" },
    admitted_unknown: !["CAPABILITY", "INTELLIGENCE", "CONNECTOR", "PROJECT", "CUSTOMER", "PRODUCT", "ASSET", "EVIDENCE", "OFFER", "ORDER"].includes(t),
    trusted: false,
    live: false
  };
}

export function relate({
  from,
  relation,
  to,
  valid_from = null,
  valid_until = null
} = {}) {
  const rel = str(relation).toUpperCase();
  const known = RELATIONS.includes(rel);
  return {
    id: "rel_" + str(from) + "_" + (known ? rel : "UNKNOWN") + "_" + str(to),
    from: str(from),
    relation: known ? rel : "UNKNOWN_RELATION",
    requested_relation: rel || "UNKNOWN_RELATION",
    to: str(to),
    valid_from: valid_from || ISO(),
    valid_until,
    version: 1,
    trusted: false,
    live: false
  };
}

export function graphView({ nodes = [], edges = [], at = null } = {}) {
  const timed = at ? asOf(nodes.map((n) => ({ ...n, measured_at: n.valid_from || n.created_at })), at) : nodes;
  return {
    version: CAPABILITY_OS_VERSION,
    nodes: timed,
    edges,
    count: { nodes: timed.length, edges: edges.length },
    live: false
  };
}

export function observeOS({ capabilities = [], connections = [], executions = [], evidence = [], holds = [] } = {}) {
  return {
    version: CAPABILITY_OS_VERSION,
    exists: capabilities.filter((c) => c.exists === true).map((c) => c.name || c.id),
    connected: connections.filter((c) => c.state === "READY" || c.connected === true).map((c) => c.id || c.name),
    executable: [],
    executed: executions.filter((e) => e.state === "EXECUTED").map((e) => e.id),
    measured: evidence.filter((e) => e.status === "MEASURED").map((e) => e.id),
    verified: evidence.filter((e) => e.status === "VERIFIED").map((e) => e.id),
    live: false,
    failed: executions.filter((e) => e.state === "FAILED").map((e) => e.id),
    unknown: capabilities.filter((c) => c.exists !== true).map((c) => c.name || c.id),
    waiting_human: holds,
    proof: {
      code_present: true,
      tested: false,
      executed: false,
      measured: false,
      verified: false,
      live: false
    }
  };
}

export function solveProblem({ tenantId, customerId, problem, capabilities = [] } = {}) {
  if (!str(problem)) {
    return { hold: "NO_SOLUTION_FOUND", compositions: [], live: false };
  }
  const operated = operateProblem({ tenantId, customerId, problem, capabilities });
  const gaps = (operated.gaps || []).map((g) => g.capability || g.name || g);
  let hold = null;
  if (gaps.length) hold = "MISSING_CAPABILITY";
  else if (operated.proof?.human_authorization_required) hold = "AUTHORIZATION_REQUIRED";
  const simulated = isolateRealm({ mode: "SIMULATION", state: "SIMULATED" }, "SIMULATION");
  return {
    version: CAPABILITY_OS_VERSION,
    problem: str(problem),
    requirements: (operated.capabilities || []).map((c) => c.name || c.id),
    gaps,
    hold,
    compositions: [{
      capabilities: (operated.capabilities || []).map((c) => c.name || c.id),
      simulated: true,
      executed: false
    }],
    simulation: { ...simulated, simulated_is_not_executed: true },
    operated: { request_id: operated.request?.request_id || operated.project?.id, live: false },
    live: false
  };
}

export function admitFuture({ kind = "INTELLIGENCE", key } = {}) {
  const n = node({ type: kind, key: key || ("future_" + str(kind).toLowerCase()) });
  const contract = futureProofContract();
  return {
    node: n,
    core_rewritten: false,
    trusted: false,
    authorized: false,
    live: false,
    future_proof_blocked: contract.blocked
  };
}

export function capabilityContract(input = {}) {
  const cap = describeCapability({
    name: input.name || input.key,
    exists: input.exists === true,
    available: input.available === true,
    version: input.version || "1"
  });
  return {
    ...cap,
    input: input.input || null,
    output: input.output || null,
    rights: input.rights || [],
    available_is_not_right_to_use: true,
    authority: false,
    live: false
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const n = node({ type: "MACHINE", key: "mill-1" });
  console.log(JSON.stringify({ version: CAPABILITY_OS_VERSION, admitted: n.admitted_unknown, live: false }));
}
