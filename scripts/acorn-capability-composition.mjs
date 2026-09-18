/** ACORN — CAPABILITY COMPOSITION
 * One primitive: a provider-independent capability and the graph that
 * composes capabilities into candidate paths.
 *
 * Not a second runtime, market, cortex, or economic engine.
 * Financial rails stay outside this module. Capability is not a provider. Capability is not authority.
 *
 * INTENT → DEMAND → CAPABILITY GRAPH → CANDIDATE PATHS
 *        → CONSTRAINTS → AUTHORITY HOLD → PLAN
 */
import { describeCapability, proposeCapabilities, routeByCapability } from "./acorn-operational-fabric.mjs";
import { createTask, taskGraph, buildExecutionPlan } from "./acorn-execution-fabric.mjs";
import { admitExtension } from "./acorn-self-build.mjs";

export const COMPOSITION_VERSION = "acorn.capability-composition.v0";
export const EDGE_REL = Object.freeze([
  "requires", "produces", "uses", "provided_by", "verified_by", "measured_by", "priced_as", "executed_by"
]);
export const PROTECTED_KINDS = Object.freeze([
  "CONSTITUTION", "AUTHORITY", "MERGE", "BREAKER", "LIVE", "CARL", "SECRET"
]);

const ISO = () => new Date().toISOString();
const str = (v) => String(v ?? "").trim();
const uniq = (xs) => [...new Set((Array.isArray(xs) ? xs : []).map((x) => str(x)).filter(Boolean))];

export function capabilityRecord(input = {}) {
  const base = describeCapability(input);
  const providers = Array.isArray(input.providers) ? input.providers.map((p) => ({
    id: p.id || p.provider || p,
    kind: p.kind || "UNKNOWN",
    authority: false
  })) : [];
  return {
    ...base,
    type: str(input.type || "CAPABILITY") || "CAPABILITY",
    input: input.input && typeof input.input === "object" ? input.input : {},
    output: input.output && typeof input.output === "object" ? input.output : {},
    constraints: Array.isArray(input.constraints) ? input.constraints : [],
    cost: input.cost == null ? null : input.cost,
    latency: input.latency == null ? null : input.latency,
    availability: str(input.availability) || "UNKNOWN",
    provenance: str(input.provenance) || "acorn",
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    measurement: input.measurement == null ? null : input.measurement,
    owner: input.owner || null,
    authority_boundary: str(input.authority_boundary) || "HUMAN",
    valid_from: input.valid_from || base.measured_at,
    valid_until: input.valid_until || null,
    execution_interface: input.execution_interface || null,
    economic_interface: input.economic_interface || null,
    providers,
    provider_independent: true,
    authorized: false,
    executed: false,
    verified: false,
    live: false
  };
}

export function bindProvider(capability, provider = {}) {
  const cap = capabilityRecord(capability);
  const bound = {
    id: provider.id || provider.provider || null,
    kind: str(provider.kind || provider.type || "INTELLIGENCE") || "INTELLIGENCE",
    authority: false,
    live: false
  };
  if (!bound.id) return { ...cap, bound: false };
  const providers = [...cap.providers.filter((p) => p.id !== bound.id), bound];
  return {
    ...cap,
    id: cap.id,
    name: cap.name,
    providers,
    bound: true,
    identity_unchanged: cap.name === (capability.name || cap.name),
    authority: false,
    authorized: false,
    live: false
  };
}

export function detectCycles(edges = []) {
  const graph = new Map();
  for (const e of edges) {
    if (!e?.from || !e?.to) continue;
    if (!graph.has(e.from)) graph.set(e.from, []);
    graph.get(e.from).push(e.to);
  }
  const seen = new Set();
  const stack = new Set();
  const cycles = [];
  function visit(node, path) {
    if (stack.has(node)) {
      cycles.push([...path, node]);
      return;
    }
    if (seen.has(node)) return;
    seen.add(node);
    stack.add(node);
    for (const next of graph.get(node) || []) visit(next, [...path, node]);
    stack.delete(node);
  }
  for (const node of graph.keys()) visit(node, []);
  return cycles;
}

export function composeFromIntent({
  intent = "",
  tenantId = null,
  capabilities = [],
  intelligences = [],
  connectors = [],
  constraints = []
} = {}) {
  const text = str(intent);
  const names = capabilities.length
    ? uniq(capabilities.map((c) => c.name || c.id || c))
    : proposeCapabilities(text);
  const nodes = names.map((name) => {
    const given = capabilities.find((c) => (c.name || c.id) === name);
    return capabilityRecord({
      ...(given && typeof given === "object" ? given : {}),
      name,
      tenant_id: tenantId
    });
  });
  const edges = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({
      from: nodes[i].id,
      to: nodes[i + 1].id,
      rel: "requires",
      authority: false
    });
  }
  for (const intel of intelligences || []) {
    for (const cap of intel.capabilities || []) {
      const node = nodes.find((n) => n.name === cap);
      if (!node) continue;
      edges.push({
        from: intel.id,
        to: node.id,
        rel: "provided_by",
        provider_kind: "INTELLIGENCE",
        authority: false
      });
    }
  }
  for (const conn of connectors || []) {
    for (const cap of conn.capabilities || []) {
      const node = nodes.find((n) => n.name === cap);
      if (!node) continue;
      edges.push({
        from: conn.id,
        to: node.id,
        rel: "executed_by",
        provider_kind: "CONNECTOR",
        authority: false
      });
    }
  }
  const cycles = detectCycles(edges);
  const paths = candidatePaths({
    nodes,
    edges,
    intelligences,
    connectors,
    constraints
  });
  return {
    version: COMPOSITION_VERSION,
    intent: { text, kind: "PROBLEM" },
    demand: { capabilities: names },
    nodes,
    edges,
    paths,
    selected_path: null,
    cycles,
    live: false,
    authorized: false,
    executable: false,
    measured_at: ISO()
  };
}

export function candidatePaths({
  nodes = [],
  edges = [],
  intelligences = [],
  connectors = [],
  constraints = []
} = {}) {
  const required = nodes.map((n) => n.name);
  const routes = routeByCapability(
    { id: "compose", required_capabilities: required },
    { intelligences, connectors }
  );
  const providersByCap = new Map();
  for (const node of nodes) {
    const provided = edges.filter((e) => e.to === node.id && (e.rel === "provided_by" || e.rel === "executed_by"));
    providersByCap.set(node.name, provided);
  }
  const steps = nodes.map((node) => {
    const provided = providersByCap.get(node.name) || [];
    const gap = provided.length === 0 && node.exists !== true;
    return {
      capability: node.name,
      capability_id: node.id,
      providers: provided.map((e) => ({ id: e.from, kind: e.provider_kind || "UNKNOWN", authority: false })),
      gap,
      authorized: false,
      executable: false
    };
  });
  const costKnown = nodes.every((n) => n.cost != null);
  return [{
    id: "path_primary",
    steps,
    routes: routes.map((r) => ({ ...r, authority: false, authorized: false })),
    constraints: [...constraints],
    cost: costKnown ? nodes.reduce((s, n) => s + Number(n.cost), 0) : null,
    latency: null,
    confidence: 0,
    executable: false,
    selected: false,
    authority: false,
    live: false
  }];
}

export function compositionPlan(composition, { projectId, authorized = false } = {}) {
  const names = composition?.demand?.capabilities || [];
  const tasks = names.map((name, i) => createTask({
    projectId: projectId || "compose",
    kind: name.toUpperCase(),
    title: "Compose " + name,
    requiredCapabilities: [name],
    dependsOn: i === 0 ? [] : undefined
  }));
  if (tasks.length > 1) {
    for (let i = 1; i < tasks.length; i++) tasks[i].depends_on = [tasks[i - 1].id];
  }
  const graph = taskGraph(tasks);
  const plan = buildExecutionPlan({ projectId: projectId || "compose", tasks: graph, authorized: false });
  return {
    ...plan,
    authorized: false,
    state: "AWAITING_AUTHORIZATION",
    composition_version: COMPOSITION_VERSION,
    live: false,
    executable: false
  };
}

export function recordCapabilityFailure({
  capability = null,
  provider = null,
  cause = "UNKNOWN",
  retryable = true,
  context = null
} = {}) {
  return {
    id: "fail_" + Date.now().toString(36),
    kind: "FAILURE",
    capability: capability?.name || capability || null,
    provider: provider?.id || provider || null,
    cause: str(cause) || "UNKNOWN",
    retryable: retryable !== false,
    recovery: null,
    cost: null,
    time: ISO(),
    impact: "ROUTING",
    used_for_authority: false,
    used_for_live: false,
    context,
    live: false
  };
}

export function learnPath({ path = null, outcome = null, evidence = [] } = {}) {
  return {
    recorded: true,
    path_id: path?.id || null,
    outcome: outcome || "UNKNOWN",
    evidence: Array.isArray(evidence) ? evidence : [],
    promoted: false,
    authorized: false,
    selected: false,
    live: false,
    measured_at: ISO()
  };
}

export function admitUnknown({ kind, id, adapter = {} } = {}) {
  const k = str(kind).toUpperCase();
  if (PROTECTED_KINDS.includes(k)) {
    return {
      admitted: false,
      reason: "PROTECTED_KIND",
      kind: k,
      authorized: false,
      core_modified: false,
      live: false
    };
  }
  return admitExtension({ kind: k || "UNKNOWN", id, adapter });
}

export function architecturalLeverage() {
  return {
    version: COMPOSITION_VERSION,
    new_intelligence_requires_core_change: false,
    new_capability_requires_new_engine: false,
    new_market_requires_new_economy: false,
    new_connector_requires_special_architecture: false,
    new_machine_requires_second_runtime: false,
    new_rail_contaminates_core: false,
    more_power_grants_authority: false,
    stripe_imported: false,
    second_runtime: false,
    live: false
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const probe = composeFromIntent({ intent: "Need analysis of a future machine" });
  console.log(JSON.stringify({
    version: COMPOSITION_VERSION,
    second_runtime: false,
    selected_path: probe.selected_path,
    executable: probe.executable,
    leverage: architecturalLeverage(),
    live: false
  }));
}
