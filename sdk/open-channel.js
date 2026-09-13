/** Open channel: unknown names allowed. No provider catalog. No invented LIVE. */

export function considerUnknownChannel(partial = {}) {
  return {
    id: partial.id || "unknown-channel",
    provider: partial.provider || "UNKNOWN",
    protocol: partial.protocol || "UNKNOWN",
    status: "DISCOVERED",
    presence: "DECLARED",
    authenticated: false,
    executable: false,
    real_call: false,
    real_response: false,
    measured: false,
    reproduced: false,
    live: false,
    authority: false,
    closed_list: false,
    invented: false,
    next: "HOLD_HUMAN",
  };
}

export function advanceChannel(obs = {}) {
  if (obs.invented_response) {
    return { status: "NOT_EXECUTED", reason: "INVENTED_RESPONSE", live: false, skipped: true };
  }
  if (!obs.real_call || !obs.real_response) {
    return {
      status: "NOT_EXECUTED",
      reason: "NO_REAL_CALL",
      live: false,
      next: obs.secret_needed ? "HOLD_HUMAN" : "NOT_EXECUTED",
    };
  }
  return {
    status: "MEASURED",
    live: false,
    authority: false,
    real_call: true,
    measured: true,
    reproduced: false,
    next: "REPRODUCE_OR_HOLD",
  };
}
