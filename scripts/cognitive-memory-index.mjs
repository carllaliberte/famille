#!/usr/bin/env node
/**
 * ACORN COGNITIVE MEMORY INDEX
 * Read-only junction across specialized measured memories.
 * It preserves provenance and state distinctions; it never restores, writes,
 * merges, promotes, or mints LIVE.
 */

export const MEMORY_INDEX_VERSION = "cognitive-memory-index.v1";
export const MEMORY_INDEX_ARTIFACT = "cognitive-memory-index";

export function emptyMemoryIndex() {
  return {
    v: MEMORY_INDEX_VERSION,
    observed_at: null,
    authority: "carl",
    auto_merge: false,
    live: false,
    sources: {},
    edges: [],
    conflicts: [],
    status_counts: {
      configured: 0,
      attempted: 0,
      succeeded: 0,
      verified: 0,
      live: 0,
    },
  };
}

function finite(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function addSource(index, id, kind, memory) {
  const key = String(id);
  const current = index.sources[key];
  const next = {
    id: key,
    kind,
    version: memory?.v || null,
    cycles: finite(memory?.cycles),
    updated_at: memory?.updated_at || null,
    provenance: "workflow-artifact",
    configured: false,
    attempted: false,
    succeeded: false,
    verified: false,
    live: false,
  };
  if (current && JSON.stringify(current) !== JSON.stringify(next)) {
    index.conflicts.push({ type: "SOURCE_METADATA_CONFLICT", id: key, existing: current, incoming: next });
  } else {
    index.sources[key] = next;
  }
  return index.sources[key] || next;
}

function setStatus(index, status) {
  const map = {
    CONFIGURED: "configured",
    ATTEMPTED: "attempted",
    SUCCEEDED: "succeeded",
    VERIFIED: "verified",
    LIVE: "live",
  };
  const key = map[String(status || "").toUpperCase()];
  if (key) index.status_counts[key] += 1;
}

export function buildMemoryIndex({ synaptic = null, collaboration = null, modelExecution = null, observedAt = null } = {}) {
  const index = emptyMemoryIndex();
  index.observed_at = observedAt || new Date().toISOString();

  addSource(index, "synaptic-memory", "routing", synaptic);
  addSource(index, "collaboration-memory", "collaboration", collaboration);
  addSource(index, "model-execution-memory", "execution", modelExecution);

  for (const edge of Object.values(synaptic?.edges || {})) {
    const attempts = finite(edge.attempts);
    const successes = finite(edge.successes);
    const failures = finite(edge.failures);
    const score = attempts ? successes / attempts : 0;
    index.edges.push({
      type: "routing",
      source: String(edge.source || "unknown"),
      capability: String(edge.capability || "review"),
      attempts,
      successes,
      failures,
      score,
      last_state: edge.last_state || null,
      last_seen: edge.last_seen || null,
      provenance: "cognitive-synaptic-memory",
    });
    setStatus(index, attempts > 0 ? "ATTEMPTED" : "CONFIGURED");
    if (successes > 0) setStatus(index, "SUCCEEDED");
  }

  for (const row of Object.values(collaboration?.collaborations || {})) {
    const attempts = finite(row.attempts);
    const completed = finite(row.completed);
    index.edges.push({
      type: "collaboration",
      sources: [...new Set((row.sources || []).map(String))].sort(),
      capability: String(row.capability || "review"),
      attempts,
      completed,
      completion_rate: attempts ? completed / attempts : 0,
      disagreements: finite(row.disagreements),
      corrections: finite(row.corrections),
      synthesis_received: finite(row.synthesis_received),
      last_state: row.last_state || null,
      last_seen: row.last_seen || null,
      provenance: "cognitive-collaboration-memory",
    });
    setStatus(index, attempts > 0 ? "ATTEMPTED" : "CONFIGURED");
    if (completed > 0) setStatus(index, "SUCCEEDED");
  }

  for (const model of Object.values(modelExecution?.models || {})) {
    const attempts = finite(model.attempts);
    const succeeded = finite(model.succeeded);
    index.edges.push({
      type: "model-execution",
      id: String(model.id || "unknown"),
      attempts,
      succeeded,
      errors: finite(model.errors),
      skipped: finite(model.skipped),
      empty: finite(model.empty),
      success_rate: attempts ? succeeded / attempts : 0,
      last_status: model.last_status || null,
      last_reason: model.last_reason || null,
      last_seen: model.last_seen || null,
      provenance: "model-execution-memory",
    });
    setStatus(index, attempts > 0 ? "ATTEMPTED" : "CONFIGURED");
    if (succeeded > 0) setStatus(index, "SUCCEEDED");
  }

  index.edges.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return index;
}

export function memoryIndexSummary(index = emptyMemoryIndex()) {
  return {
    version: index.v || MEMORY_INDEX_VERSION,
    observed_at: index.observed_at || null,
    sources: Object.keys(index.sources || {}).sort(),
    edges: (index.edges || []).length,
    conflicts: (index.conflicts || []).length,
    status_counts: { ...index.status_counts },
    authority: index.authority || "carl",
    auto_merge: false,
    live: false,
  };
}

export function assertMemoryIndexSafe(index) {
  if (index?.live !== false) throw new Error("MEMORY_INDEX_LIVE_FORBIDDEN");
  if (index?.auto_merge !== false) throw new Error("MEMORY_INDEX_AUTO_MERGE_FORBIDDEN");
  if (index?.authority !== "carl") throw new Error("MEMORY_INDEX_AUTHORITY_INVALID");
  return true;
}
