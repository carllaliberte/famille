/**
 * Provenance engine. Divergence is data. Epsilon is never 0.
 * Consensus is not truth. AI_WRITE stays denied.
 */
export const STATUSES = Object.freeze([
  "LU",
  "OBJECTION",
  "CONTRADICTION",
  "INSUFFICIENT",
  "UNKNOWN",
  "ERROR",
  "OFFLINE",
]);

const MIN_EPS = 1e-9;

export function clampEpsilon(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return MIN_EPS;
  return n;
}

export class ProvenanceEngine {
  constructor({ now } = {}) {
    this.now = now || (() => new Date().toISOString());
  }

  evaluate(signals = []) {
    const rows = (Array.isArray(signals) ? signals : []).map((s, i) => {
      const status = STATUSES.includes(s.status) ? s.status : "UNKNOWN";
      return {
        node_id: String(s.node_id || `n-${i}`),
        provider: String(s.provider || ""),
        model: String(s.model || ""),
        output: s.output,
        status,
        confidence_score: Math.min(1, Math.max(0, Number(s.confidence_score) || 0)),
        error_margin_epsilon: clampEpsilon(s.error_margin_epsilon),
        objections: Array.isArray(s.objections) ? s.objections : [],
        latency_ms: Number.isFinite(s.latency_ms) ? s.latency_ms : null,
        cost_usd: Number.isFinite(s.cost_usd) ? s.cost_usd : null,
        invented: false,
      };
    });

    const statuses = new Set(rows.map((r) => r.status));
    let status = "INSUFFICIENT";
    if (rows.length === 0) status = "INSUFFICIENT";
    else if (rows.some((r) => r.status === "ERROR")) status = "ERROR";
    else if (rows.every((r) => r.status === "OFFLINE")) status = "OFFLINE";
    else if (statuses.size > 1) status = "CONTRADICTION";
    else status = rows[0].status;

    const epsilons = rows.map((r) => r.error_margin_epsilon);
    const error_margin_epsilon = clampEpsilon(
      epsilons.length ? Math.max(...epsilons) : MIN_EPS,
    );

    return {
      status,
      observed_at: this.now(),
      signals: rows,
      agreement: statuses.size === 1 && rows.length > 1,
      contradiction: status === "CONTRADICTION",
      error_margin_epsilon,
      write: "DENIED",
      live: false,
      certified: false,
      preview: true,
      receipt: false,
    };
  }
}
