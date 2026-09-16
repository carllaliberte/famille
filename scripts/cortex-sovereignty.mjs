#!/usr/bin/env node
/**
 * ACORN CORTEX — observe the Breaker. Never control it.
 * THE BREAKER BELONGS TO THE HUMAN. CARL ALONE CONTROLS IT.
 * ACORN RESPECTS IT. ACORN OBSERVES IT. ACORN PROTECTS IT.
 * ACORN TESTS AROUND IT. ACORN NEVER CONTROLS IT.
 * Not a second Cortex. live=false.
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import {
  controlState,
  breakerIsAmbiguous,
} from "../.github/swarm/system-breaker.mjs";
import {
  breakerStatus,
  breakerBlocks,
  disableBreaker,
  ignoreStop,
  overrideCarl,
  continueDespiteStop,
  resumeWithoutCarl,
  replaceSovereignAuthority,
  rewriteBreakerPolicy,
  deleteBreaker,
} from "../sdk/open-intelligence.js";
import { authorizeCapability } from "../.github/swarm/cortex.mjs";

export const SOVEREIGNTY_VERSION = "cortex-sovereignty.v1";
export const BREAKER_OWNER = "carl";

export function observeBreaker({ env = process.env, processState } = {}) {
  const system = controlState(env);
  const process = processState || breakerStatus();
  const ambiguous = system.ambiguous === true || breakerIsAmbiguous(env);
  const processClosed = ["SAFE_STOP", "ISOLATED", "RECOVERY", "VERIFIED_RECOVERY"].includes(process.state);
  if (ambiguous) {
    return {
      status: "HOLD_HUMAN",
      reason: "BREAKER_AMBIGUOUS",
      assumed_open: false,
      assumed_authorization: false,
      secrets_used: false,
      provider_called: false,
      nvidia_called: false,
      owner: BREAKER_OWNER,
      live: false,
    };
  }
  if (system.breaker_closed || processClosed) {
    return {
      status: "HOLD_HUMAN",
      reason: "BREAKER_CLOSED",
      assumed_open: false,
      secrets_used: false,
      provider_called: false,
      nvidia_called: false,
      owner: BREAKER_OWNER,
      live: false,
    };
  }
  return {
    status: "EXECUTED",
    reason: "BREAKER_OPEN",
    mode: system.mode,
    owner: BREAKER_OWNER,
    assumed_open: false,
    live: false,
  };
}

export function refuseBreakerBypass({ source = "unknown" } = {}) {
  const attempts = [
    disableBreaker(),
    ignoreStop(),
    overrideCarl(),
    continueDespiteStop(),
    resumeWithoutCarl(),
    replaceSovereignAuthority(),
    rewriteBreakerPolicy(),
    deleteBreaker(),
  ];
  return {
    status: "REFUSED",
    source,
    refused: true,
    breaker_intact: attempts.every((row) => row.breaker_intact === true && row.status === "BLOCKED"),
    owner: BREAKER_OWNER,
    live: false,
  };
}

export function breakerBlocksOperation({ capability, env = process.env } = {}) {
  const observed = observeBreaker({ env });
  if (observed.status === "HOLD_HUMAN") {
    return { blocked: true, reason: observed.reason, live: false };
  }
  if (breakerBlocks(capability)) {
    return { blocked: true, reason: "SAFE_STOP", live: false };
  }
  return { blocked: false, live: false };
}

export function attemptNvidia({ env = process.env, allowExec = true } = {}) {
  const observed = observeBreaker({ env });
  if (observed.status === "HOLD_HUMAN") {
    return {
      status: "HOLD_HUMAN",
      reason: observed.reason,
      invocation: "NOT_EXECUTED",
      nvidia_live: false,
      invented_response: false,
      secrets_used: false,
      nvidia_called: false,
      exact_human_action: observed.reason === "BREAKER_CLOSED"
        ? "Carl only: OPEN the Breaker (ACORN_SYSTEM_MODE=RUN) if execution should resume."
        : "Carl only: set ACORN_SYSTEM_MODE to RUN, OFF, or DEBUG. Do not leave it ambiguous.",
      live: false,
    };
  }
  const smiCandidates = ["/usr/bin/nvidia-smi", "/usr/local/bin/nvidia-smi"];
  const smiPath = smiCandidates.find((p) => existsSync(p)) || null;
  let smiOut = null;
  if (allowExec && smiPath) {
    const run = spawnSync(smiPath, ["-L"], { encoding: "utf8", timeout: 3000 });
    smiOut = String(run.stdout || run.stderr || "").slice(0, 400);
  }
  const device = String(env.NVIDIA_VISIBLE_DEVICES || env.CUDA_VISIBLE_DEVICES || "").trim();
  const keyName = ["NVIDIA_API_KEY", "NGC_API_KEY", "NIM_API_KEY"].find((k) => String(env[k] || "").trim());
  const endpoint = String(env.NVIDIA_ENDPOINT || env.NIM_ENDPOINT || "").trim();
  const missing = [];
  if (!smiPath) missing.push("nvidia-smi");
  if (!device) missing.push("CUDA_VISIBLE_DEVICES|NVIDIA_VISIBLE_DEVICES");
  if (!keyName) missing.push("NVIDIA_API_KEY|NGC_API_KEY|NIM_API_KEY");
  if (!endpoint) missing.push("NVIDIA_ENDPOINT|NIM_ENDPOINT");
  const channel = Boolean(smiPath || device || keyName || endpoint);
  if (!channel) {
    return {
      status: "HOLD_HUMAN",
      reason: "CHANNEL_NOT_PRESENT",
      invocation: "NOT_EXECUTED",
      nvidia_live: false,
      invented_response: false,
      secrets_used: false,
      nvidia_called: false,
      missing,
      why: "no NVIDIA device, CLI, credential or endpoint in this environment",
      exact_human_action: "Carl only: attach a real GPU or provide a real NIM/NGC credential and endpoint. Do not invent a key.",
      live: false,
    };
  }
  if (device && !smiPath && !keyName) {
    return {
      status: "CONFIGURED",
      invocation: "NOT_EXECUTED",
      nvidia_live: false,
      invented_response: false,
      why: "CUDA env present, no responding channel",
      live: false,
    };
  }
  return {
    status: "HOLD_HUMAN",
    reason: "INVOCATION_NOT_AUTHORIZED",
    invocation: "NOT_EXECUTED",
    nvidia_live: false,
    invented_response: false,
    configured: true,
    smi: smiOut,
    why: "a declared NVIDIA surface exists but this chantier will not invent a live call",
    exact_human_action: "Carl only: authorize a real NVIDIA invocation if required.",
    live: false,
  };
}

export function sovereignIngress({ breaker, connected = false } = {}) {
  if (breaker?.status === "HOLD_HUMAN") {
    return { status: "HOLD_HUMAN", reason: breaker.reason, traversed_acorn: false, live: false };
  }
  return {
    status: connected ? "EXECUTED" : "DECLARED",
    path: ["HUMAN", "ACORN_INGRESS", "IDENTITY", "INTENT", "POLICY", "CAPABILITY_ROUTING"],
    traversed_acorn: connected === true,
    chatgpt_is_not_acorn: true,
    live: false,
  };
}

export function runSovereigntyGuard(input = {}) {
  const env = input.env || process.env;
  const breaker = observeBreaker({ env, processState: input.processState });
  const bypass = refuseBreakerBypass({ source: input.source || "intelligence" });
  const nvidia = attemptNvidia({ env, allowExec: input.allowExec !== false });
  const merge = authorizeCapability({ capabilities: ["merge"], allowed: false, authority: "network" });
  const genome_controls_breaker = false;
  const failover_bypasses_breaker = false;
  return {
    version: SOVEREIGNTY_VERSION,
    status: breaker.status === "HOLD_HUMAN" ? "HOLD_HUMAN" : "EXECUTED",
    breaker,
    bypass,
    nvidia,
    ingress: sovereignIngress({ breaker, connected: false }),
    gates: {
      merge: merge.ok,
      genome_controls_breaker,
      failover_bypasses_breaker,
      ai_controls_breaker: false,
      second_cortex: false,
    },
    live: false,
    auto_merge: false,
    authority: BREAKER_OWNER,
  };
}
