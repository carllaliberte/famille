#!/usr/bin/env node
/** Real multi-intelligence collaboration: independent findings + provenance-preserving synthesis. */

export function collaborationState(results = []) {
  const successful = results.filter((r) => r && !r.skipped && !r.error && r.text);
  return Object.freeze({
    attempted: results.length,
    successful: successful.length,
    independent: successful.map((r) => r.id),
    collective: successful.length >= 2,
  });
}

export function synthesisPrompt(results = []) {
  const independent = results
    .filter((r) => r && !r.skipped && !r.error && r.text)
    .map((r) => `### ${r.label || r.id} (${r.model || r.id})\nPROVENANCE: ${r.id}\n${r.text}`)
    .join("\n\n");
  return [
    "You are the synthesis node of Acorn's cognitive swarm.",
    "These are independent model findings on the same task.",
    "Preserve provenance. Do not vote. Do not invent consensus.",
    "Retain disagreements and objections explicitly.",
    "Separate supported findings from uncertainty.",
    "Do not claim LIVE, PRESENT, CERTIFIED, QUANTUM, or human decision.",
    "Return exactly: AGREEMENT / DISAGREEMENT / EVIDENCE / RISK / CORRECTION / SYNTHESIS.",
    "",
    independent || "(no successful independent findings)",
  ].join("\n");
}

export async function synthesizeResults(results, specs, system, reviewFn, env = process.env) {
  const state = collaborationState(results);
  if (!state.collective) return { state, synthesis: null };
  const sourceIds = new Set(state.independent);
  const candidates = (specs || []).filter((s) => s && sourceIds.has(s.id));
  if (!candidates.length) return { state, synthesis: null };
  const coordinator = candidates[0];
  const one = await reviewFn(coordinator, system, synthesisPrompt(results), env);
  if (one.skipped || one.error || !one.text) {
    return { state, synthesis: null, synthesisSkip: one.reason || one.error || "empty" };
  }
  return {
    state,
    synthesis: {
      id: coordinator.id,
      label: coordinator.label,
      model: coordinator.model,
      via: coordinator.via,
      text: one.text,
      sources: state.independent,
    },
  };
}
