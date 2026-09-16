#!/usr/bin/env node
/** Acorn autonomy kernel — pure decision logic. No GitHub I/O, no Codex I/O, no LIVE. */
const KERNEL_VERSION = "acorn-autonomy.v1";
const AUTH_COOLDOWN_MS = 6 * 60 * 60 * 1e3;
const MAX_IDENTICAL_ERRORS = 3;
const MAX_IDENTICAL_REPAIRS = 3;
const DEBOUNCE_MS = 10 * 60 * 1e3;
const LOOP_STEPS = [
  "OBSERVE",
  "UNDERSTAND",
  "DISCOVER",
  "PRIORITIZE",
  "TASK",
  "CODE",
  "TEST",
  "DEBUG",
  "REPAIR",
  "MEASURE",
  "EVIDENCE",
  "PR",
  "WAIT_FOR_HUMAN_MERGE",
  "DETECT_MERGE",
  "RESUME"
];
const CLAMP = (n, min = 0, max = 5) => Math.max(min, Math.min(max, n));
function emptyMemory() {
  return {
    v: "codex-worker-memory.v2",
    authority: "carl",
    auto_merge: false,
    live: false,
    state: "IDLE",
    current_task: null,
    tasks: [],
    completed: [],
    failed: [],
    blocked: [],
    repairs: [],
    discoveries: [],
    measurements: [],
    prs: [],
    human_required: [],
    last_main_sha: null,
    last_successful_cycle: null,
    next_candidate: null,
    error_signatures: [],
    cooldowns: [],
    locks: { run: null, task: null },
    updated_at: null
  };
}
function hydrateMemory(raw) {
  const base = emptyMemory();
  if (!raw || typeof raw !== "object") return base;
  const src = raw;
  return {
    ...base,
    ...src,
    v: "codex-worker-memory.v2",
    authority: "carl",
    auto_merge: false,
    live: false,
    tasks: Array.isArray(src.tasks) ? src.tasks : base.tasks,
    completed: Array.isArray(src.completed) ? src.completed : Array.isArray(src.completed_tasks) ? src.completed_tasks : base.completed,
    failed: Array.isArray(src.failed) ? src.failed : Array.isArray(src.failed_tasks) ? src.failed_tasks : base.failed,
    human_required: Array.isArray(src.human_required) ? src.human_required : Array.isArray(src.human_actions_required) ? src.human_actions_required : base.human_required,
    error_signatures: Array.isArray(src.error_signatures) ? src.error_signatures : [],
    cooldowns: Array.isArray(src.cooldowns) ? src.cooldowns : [],
    locks: src.locks && typeof src.locks === "object" ? { run: null, task: null, ...src.locks } : base.locks
  };
}
function scoreTask(task) {
  const impact = CLAMP(task.impact ?? 3);
  const urgency = CLAMP(task.urgency ?? 3);
  const risk = CLAMP(task.risk ?? 2);
  const dependencies = CLAMP(task.dependencies ?? 0);
  const blockers = CLAMP(task.blockers ?? 0);
  const effort = CLAMP(task.effort ?? 3);
  const measureValue = CLAMP(task.measureValue ?? 3);
  const coherence = CLAMP(task.architecturalCoherence ?? 3);
  const factors = {
    impact: impact * 3,
    urgency: urgency * 2,
    measureValue: measureValue * 2,
    coherence,
    risk: -risk,
    effort: -effort,
    blockers: -blockers * 2,
    dependencies: -dependencies
  };
  const score = Object.values(factors).reduce((a, b) => a + b, 0);
  const justification = [
    `impact ${impact}/5 \u2192 ${factors.impact}`,
    `urgence ${urgency}/5 \u2192 ${factors.urgency}`,
    `valeur de mesure ${measureValue}/5 \u2192 ${factors.measureValue}`,
    `coh\xE9rence ${coherence}/5 \u2192 ${factors.coherence}`,
    `risque ${risk}/5 \u2192 ${factors.risk}`,
    `effort ${effort}/5 \u2192 ${factors.effort}`,
    `blocages ${blockers} \u2192 ${factors.blockers}`,
    `d\xE9pendances ${dependencies} \u2192 ${factors.dependencies}`,
    `total ${score}`
  ].join("; ");
  return { score, factors, justification };
}
function prioritize(tasks) {
  return tasks.map((task) => ({ task, score: scoreTask(task) })).sort((a, b) => b.score.score - a.score.score || a.task.title.localeCompare(b.task.title));
}
function isOperativeCodexPr(p) {
  const blob = `${p.title || ""}\n${p.body || ""}\n${p.patch_source || ""}`.toLowerCase();
  if (/patch_source\s*[:=]\s*grok/.test(blob)) return false;
  return String(p.head || "").startsWith("codex/");
}
function classifyWorkAgainstPr(task, openPrs) {
  const codexPrs = (openPrs || []).filter(isOperativeCodexPr);
  if (!codexPrs.length) return "INDEPENDENT";
  if (task.kind === "diagnostic") return "DIAGNOSTIC";
  if (task.needsMerge) return "WAIT_HUMAN_MERGE";
  if (task.dependsOnPr && codexPrs.some((p) => p.number === task.dependsOnPr)) return "DEPENDENT";
  if (task.number && codexPrs.some((p) => (p.taskNumbers || []).includes(task.number))) {
    return "DEPENDENT";
  }
  const prFiles = new Set(codexPrs.flatMap((p) => p.files || []));
  const files = task.files || [];
  if (files.length && prFiles.size && files.some((f) => prFiles.has(f))) return "CONFLICT";
  return "INDEPENDENT";
}
function selectNextWork(input) {
  if (!input.timeLeft) {
    return { action: "STOP", status: "TIME_BUDGET", justification: "budget temps \xE9puis\xE9" };
  }
  if (input.taskBudget <= 0) {
    return { action: "STOP", status: "TASK_BUDGET", justification: "budget t\xE2ches \xE9puis\xE9" };
  }
  if (input.lastStatus === "HUMAN_REQUIRED") {
    return {
      action: "STOP",
      status: "HUMAN_REQUIRED",
      justification: "une d\xE9cision souveraine humaine est d\xE9j\xE0 ouverte"
    };
  }
  if (input.lastStatus === "ARCHITECTURAL_BLOCK") {
    return {
      action: "STOP",
      status: "ARCHITECTURAL_BLOCK",
      justification: "blocage architectural: ne pas relancer la m\xEAme r\xE9paration"
    };
  }
  const ranked = prioritize(input.tasks);
  const deferred = [];
  for (const { task, score } of ranked) {
    const relation = classifyWorkAgainstPr(task, input.openPrs);
    if (relation === "INDEPENDENT" || relation === "DIAGNOSTIC") {
      return {
        action: "EXECUTE",
        task,
        relation,
        justification: `${relation.toLowerCase()} \u2014 ${score.justification}`
      };
    }
    deferred.push({ task, relation });
  }
  if (input.discovery?.status === "CANDIDATE" && input.discovery.task) {
    const relation = classifyWorkAgainstPr(input.discovery.task, input.openPrs);
    if (relation === "INDEPENDENT" || relation === "DIAGNOSTIC") {
      return {
        action: "CREATE_TASK",
        task: input.discovery.task,
        relation,
        justification: "d\xE9couverte justifi\xE9e, ind\xE9pendante de la PR ouverte"
      };
    }
  }
  if (deferred.some((d) => d.relation === "DEPENDENT" || d.relation === "WAIT_HUMAN_MERGE") || input.openPrs.some((p) => String(p.head || "").startsWith("codex/"))) {
    const waiting = deferred.map((d) => `#${d.task.number ?? d.task.id} ${d.relation}`).join(", ");
    return {
      action: "WAIT_HUMAN_MERGE",
      status: "WAIT_HUMAN_MERGE",
      justification: waiting ? `travail restant li\xE9 \xE0 la PR: ${waiting}. Carl merge. Le reste autonome continue s'il est ind\xE9pendant.` : "PR Codex ouverte. Pas de travail ind\xE9pendant. WAIT_HUMAN_MERGE."
    };
  }
  if (input.discovery?.status === "IDLE") {
    return { action: "STOP", status: "IDLE", justification: "file vide, aucune d\xE9couverte justifi\xE9e" };
  }
  if (input.discovery && input.discovery.status !== "CREATED" && input.discovery.status !== "CANDIDATE") {
    return {
      action: "STOP",
      status: "IDLE",
      justification: `d\xE9couverte ${input.discovery.status}`
    };
  }
  if (!input.tasks.length) {
    return { action: "DISCOVER", justification: "file vide \u2014 observer puis d\xE9couvrir ou rester IDLE" };
  }
  return { action: "STOP", status: "IDLE", justification: "aucun travail ex\xE9cutable sans merge" };
}
function causalErrorLine(message) {
  const text = String(message || "");
  const lines = text.split(/\n/);
  const hit = [...lines].reverse().find((line) =>
    /\b(429|401|402|403|404)\b|too many requests|exceeded retry limit|payment required|unauthorized/i.test(line)
  );
  return (hit || text).trim();
}
function errorSignature(input) {
  const raw = causalErrorLine(input.message);
  const msg = raw.toLowerCase().replace(/[0-9a-f]{7,}/g, "#").replace(/\s+/g, " ").slice(0, 180);
  return `${input.category}::${msg || "unknown"}`;
}
function recordErrorSignature(memory, input) {
  const signature = errorSignature(input);
  const existing = memory.error_signatures.find(
    (e) => e.signature === signature && e.sha === input.sha
  );
  if (existing) {
    existing.count += 1;
    existing.last_at = input.now;
  } else {
    memory.error_signatures = [
      ...memory.error_signatures,
      {
        signature,
        sha: input.sha,
        count: 1,
        last_at: input.now,
        category: input.category
      }
    ].slice(-32);
  }
  return memory;
}
function isArchitecturalCategory(category) {
  return /ARCHITECTURE|GOVERNANCE|SOVEREIGNTY|MERGE_AUTHORITY/i.test(category);
}
function classifyRepetition(input) {
  const signature = errorSignature(input);
  const rec = input.memory.error_signatures.find(
    (e) => e.signature === signature && e.sha === input.sha
  );
  const count = rec?.count ?? 0;
  const maxSame = input.maxSame ?? MAX_IDENTICAL_ERRORS;
  if (count >= maxSame) {
    return {
      status: isArchitecturalCategory(input.category) ? "ARCHITECTURAL_BLOCK" : "HUMAN_REQUIRED",
      count,
      signature
    };
  }
  return { status: "CONTINUE", count, signature };
}
function escalateDebug(input) {
  const prev = input.previousLevel ?? 1;
  let level = CLAMP(Math.max(prev, input.attempt), 1, 5);
  if (isArchitecturalCategory(input.category)) level = 5;
  const actions = {
    1: "correction locale",
    2: "correction de test",
    3: "correction d'int\xE9gration",
    4: "correction d'architecture (sans changer la souverainet\xE9)",
    5: "escalade humaine \u2014 le syst\xE8me a fait tout ce qu'il pouvait"
  };
  if (level === 5) {
    return {
      level,
      action: actions[5],
      stop: isArchitecturalCategory(input.category) ? "ARCHITECTURAL_BLOCK" : "HUMAN_REQUIRED"
    };
  }
  return { level, action: actions[level] };
}
function humanRequired(input) {
  return {
    category: "HUMAN_REQUIRED",
    reason: input.reason,
    evidence: input.evidence,
    attempts: input.attempts,
    what_was_done: input.what_was_done,
    what_remains: input.what_remains,
    exact_human_action: input.exact_human_action,
    url: input.url
  };
}
function applyLoopGuards(input) {
  const { memory, sha, now } = input;
  if (memory.locks.run) {
    return { skip: true, status: "WAIT", reason: `run lock held: ${memory.locks.run}` };
  }
  const last = memory.measurements.at(-1);
  const debounceMs = input.debounceMs ?? DEBOUNCE_MS;
  const lastAt = Number(last?.at_ms ?? last?.at);
  if (last && last.sha === sha && Number.isFinite(lastAt) && now - lastAt < debounceMs) {
    return {
      skip: true,
      status: "WAIT",
      reason: "debounce: m\xEAme SHA trop r\xE9cent",
      resume_at: lastAt + debounceMs
    };
  }
  const cd = memory.cooldowns.find((c) => c.sha === sha && c.until > now);
  if (cd) {
    return { skip: true, status: "WAIT", reason: `cooldown: ${cd.reason}`, resume_at: cd.until };
  }
  if (input.errorCategory) {
    const rep = classifyRepetition({
      memory,
      category: input.errorCategory,
      message: input.errorMessage,
      sha,
      maxSame: input.maxSame
    });
    if (rep.status !== "CONTINUE") {
      return {
        skip: true,
        status: rep.status,
        reason: `m\xEAme erreur \xD7 ${rep.count} (${rep.signature})`
      };
    }
  }
  return { skip: false, status: "RUN", reason: "guards open" };
}
function setAuthCooldown(memory, sha, now, ms = AUTH_COOLDOWN_MS) {
  memory.cooldowns = [
    ...memory.cooldowns.filter((c) => !(c.sha === sha && c.reason === "AUTH")),
    { sha, until: now + ms, reason: "AUTH" }
  ].slice(-16);
  return memory;
}
function evaluateTrigger(input) {
  const { event, memory, currentSha, now } = input;
  if (input.breakerOff) {
    return {
      run: false,
      reason: "breaker OFF \u2014 gouvernance humaine",
      status: "HUMAN_REQUIRED",
      step: "OBSERVE"
    };
  }
  if (event === "pull_request") {
    if (!input.pr?.merged) {
      return { run: false, reason: "PR not merged", status: "IDLE", step: "OBSERVE" };
    }
    if (input.pr.base && input.pr.base !== "main") {
      return { run: false, reason: "base is not main", status: "IDLE", step: "OBSERVE" };
    }
    if (!String(input.pr.head || "").startsWith("codex/")) {
      return {
        run: true,
        reason: "merge non-Codex: d\xE9tecter le SHA, synchroniser, reprendre si travail ind\xE9pendant",
        status: "RUN",
        step: "DETECT_MERGE"
      };
    }
    return {
      run: true,
      reason: "resume after Codex PR merge",
      status: "RUN",
      step: "DETECT_MERGE"
    };
  }
  if (event === "push") {
    const last = input.previousSha !== undefined ? input.previousSha : memory.last_main_sha;
    if (input.forceWake) {
      return {
        run: true,
        reason: input.wakeReason || "open justified codex-task",
        status: "RUN",
        step: "TASK"
      };
    }
    if (last && last === currentSha) {
      return {
        run: false,
        reason: "m\xEAme SHA de main \u2014 idempotent",
        status: "IDLE",
        step: "OBSERVE"
      };
    }
    return {
      run: true,
      reason: "changement pertinent sur main \u2014 synchroniser et reprendre",
      status: "RUN",
      step: "DETECT_MERGE"
    };
  }
  if (event === "issues") {
    const label = input.taskLabel || "codex-task";
    if (!(input.issueLabels || []).includes(label)) {
      return { run: false, reason: "issue sans label de file", status: "IDLE", step: "OBSERVE" };
    }
    return { run: true, reason: "nouvelle t\xE2che dans la file", status: "RUN", step: "PRIORITIZE" };
  }
  if (event === "workflow_dispatch") {
    return { run: true, reason: "diagnostic manuel (non requis au fonctionnement)", status: "RUN", step: "OBSERVE" };
  }
  if (event === "failure") {
    const blocking = memory.error_signatures.find(
      (e) => e.sha === currentSha && e.count >= MAX_IDENTICAL_ERRORS
    );
    if (blocking) {
      const status = isArchitecturalCategory(blocking.category) ? "ARCHITECTURAL_BLOCK" : "HUMAN_REQUIRED";
      return {
        run: false,
        reason: `\xE9chec r\xE9p\xE9t\xE9 \xD7 ${blocking.count} \u2014 ${status}`,
        status,
        step: "MEASURE"
      };
    }
    const last = memory.measurements.at(-1);
    const cat = last?.status || "FAILED";
    const rep = classifyRepetition({
      memory,
      category: cat,
      message: last?.reason || "",
      sha: currentSha
    });
    if (rep.status !== "CONTINUE") {
      return {
        run: false,
        reason: `\xE9chec r\xE9p\xE9t\xE9 \xD7 ${rep.count} \u2014 ${rep.status}`,
        status: rep.status,
        step: "MEASURE"
      };
    }
    return {
      run: true,
      reason: "\xE9chec r\xE9parable \u2014 ne pas attendre le prochain cron",
      status: "RUN",
      step: "DEBUG"
    };
  }
  if (event === "correction") {
    return { run: true, reason: "r\xE9paration r\xE9ussie \u2014 mesurer imm\xE9diatement", status: "RUN", step: "MEASURE" };
  }
  if (event === "discovery") {
    return { run: true, reason: "t\xE2che d\xE9couverte valide \u2014 entrer dans la file", status: "RUN", step: "PRIORITIZE" };
  }
  const guards = applyLoopGuards({
    memory,
    sha: currentSha,
    now,
    errorCategory: input.authAvailable ? void 0 : "AUTH",
    errorMessage: input.authAvailable ? void 0 : "chatgpt authentication missing"
  });
  if (guards.skip) {
    return {
      run: false,
      reason: guards.reason,
      status: guards.status,
      step: "OBSERVE"
    };
  }
  if (!input.authAvailable) {
    return {
      run: true,
      reason: "schedule: observer, mesurer l'auth, persister, attendre sans inventer Codex",
      status: "UNAVAILABLE",
      step: "OBSERVE"
    };
  }
  return { run: true, reason: event || "direct", status: "RUN", step: "OBSERVE" };
}
function afterMergeSync(input) {
  const actions = [];
  const changed = Boolean(input.newSha) && input.previousSha !== input.newSha;
  if (!changed) {
    return { memory: input.memory, changed: false, actions: ["SHA inchang\xE9 \u2014 pas de reprise"] };
  }
  input.memory.last_main_sha = input.newSha;
  actions.push(`main SHA ${input.previousSha || "\u2205"} \u2192 ${input.newSha}`);
  if (input.mergedPr) {
    input.memory.prs = input.memory.prs.filter((p) => p.number !== input.mergedPr);
    actions.push(`PR #${input.mergedPr} retir\xE9e de la file d'attente`);
    const related = input.memory.tasks.filter((t) => t.dependsOnPr === input.mergedPr || t.needsMerge);
    for (const t of related) {
      t.dependsOnPr = void 0;
      t.needsMerge = false;
    }
    if (related.length) actions.push(`${related.length} t\xE2che(s) d\xE9bloqu\xE9e(s)`);
  }
  input.memory.cooldowns = input.memory.cooldowns.filter((c) => c.sha === input.newSha);
  input.memory.skipped_tasks = [];
  input.memory.locks = { run: null, task: null };
  input.memory.state = "RUN";
  input.memory.updated_at = new Date(input.now).toISOString();
  actions.push("priorit\xE9s \xE0 recalculer");
  actions.push("reprendre automatiquement");
  return { memory: input.memory, changed: true, actions };
}
function skippedForSha(memory, sha) {
  const raw = memory?.skipped_tasks || [];
  const out = [];
  for (const item of raw) {
    if (item && typeof item === "object" && item.sha && Number(item.number)) {
      if (item.sha === sha) out.push(Number(item.number));
    }
  }
  return out;
}
function previousSkipSha(memory) {
  const sig = [...(memory?.error_signatures || [])].reverse().find((e) => e.sha)?.sha;
  if (sig) return sig;
  const skip = [...(memory?.skipped_tasks || [])].reverse().find((s) => s && typeof s === "object" && s.sha)?.sha;
  return skip || memory?.last_main_sha || null;
}
function wakeOpenCodexTask(input = {}) {
  const currentSha = input.currentSha || null;
  const previousSha = input.previousSha || null;
  const skipped = new Set((input.skippedOnCurrentSha || []).map(Number).filter(Boolean));
  const closed = new Set((input.closedTaskNumbers || []).map(Number).filter(Boolean));
  const unjustified = new Set((input.unjustifiedTaskNumbers || []).map(Number).filter(Boolean));
  const skipInvalidated = Boolean(input.skipInvalidated)
    || Boolean(previousSha && currentSha && previousSha !== currentSha);
  const runnable = (input.openTaskNumbers || [])
    .map(Number)
    .filter((n) => n && !skipped.has(n) && !closed.has(n) && !unjustified.has(n));
  if (!runnable.length) {
    const reason = skipped.size
      ? "SKIP_JUSTIFIÉ — same SHA + same error"
      : closed.size && !(input.openTaskNumbers || []).length
        ? "task closed"
        : "no open justified codex-task";
    return { wake: false, skip_invalidated: skipInvalidated, reason, tasks: [] };
  }
  return {
    wake: true,
    skip_invalidated: skipInvalidated,
    reason: skipInvalidated
      ? "main SHA changed; stale skip invalidated; open codex-task"
      : "open justified codex-task",
    tasks: runnable
  };
}
function shouldStopCleanly(input) {
  if (input.danger) return { stop: true, status: "ARCHITECTURAL_BLOCK", reason: "danger \u2014 arr\xEAt propre" };
  if (input.humanGovernance) return { stop: true, status: "HUMAN_REQUIRED", reason: "gouvernance humaine n\xE9cessaire" };
  if (input.repeatedError) return { stop: true, status: "HUMAN_REQUIRED", reason: "erreur r\xE9p\xE9titive" };
  if (input.limitReached) return { stop: true, status: "WAIT", reason: "limite atteinte" };
  if (!input.justifiedWork && input.queueLength === 0) {
    return { stop: true, status: "IDLE", reason: "aucune t\xE2che justifi\xE9e" };
  }
  return { stop: false, status: "RUN", reason: "travail justifi\xE9" };
}
function fabricNode(partial) {
  return {
    id: partial.id,
    capability: partial.capability ?? [],
    availability: partial.availability ?? "unknown",
    limits: partial.limits ?? [],
    provenance: partial.provenance ?? "external",
    trust: partial.trust ?? "declared",
    context: partial.context ?? "",
    specialty: partial.specialty ?? ""
  };
}
const CODEX_NODE = fabricNode({
  id: "codex",
  capability: ["code", "discover", "repair", "test"],
  availability: "unavailable",
  limits: [
    "never merge",
    "never modify merge authority",
    "never invent provenance",
    "never claim LIVE",
    "ChatGPT session auth required"
  ],
  provenance: "codex",
  trust: "measured",
  context: "first operational worker on the Cognitive Work Fabric",
  specialty: "bounded production-quality code changes"
});
function candidateFromSurveillance(obs) {
  const out = [];
  for (const w of obs.failedWorkflows || []) {
    if (w.conclusion !== "failure") continue;
    const title = `Surveiller l'\xE9chec du workflow ${w.name}`;
    const justification = `Workflow ${w.name} mesur\xE9 failure. ${w.url}. Source surveillance, pas une invention.`;
    out.push({
      id: `surv-wf-${w.name}`,
      title,
      body: `Le workflow ${w.name} a \xE9chou\xE9. Diagnostiquer la cause mesur\xE9e, r\xE9parer si local, sinon HUMAN_REQUIRED.`,
      source: "surveillance",
      kind: "diagnostic",
      justification,
      impact: 4,
      urgency: 4,
      measureValue: 5,
      effort: 3,
      risk: 2
    });
  }
  for (const p of obs.blockedPrs || []) {
    out.push({
      id: `surv-pr-${p.number}`,
      title: `PR bloqu\xE9e #${p.number}`,
      body: p.title,
      source: "surveillance",
      kind: "diagnostic",
      justification: `PR #${p.number} observ\xE9e bloqu\xE9e. Diagnostic autoris\xE9; merge interdit.`,
      needsMerge: true,
      impact: 3,
      urgency: 3,
      measureValue: 4
    });
  }
  for (const t of obs.blockedTasks || []) {
    out.push({
      id: `surv-task-${t.number}`,
      number: t.number,
      title: `T\xE2che bloqu\xE9e #${t.number}`,
      body: t.title,
      source: "surveillance",
      justification: `T\xE2che #${t.number} observ\xE9e bloqu\xE9e. Reprendre le diagnostic, pas inventer une autre t\xE2che.`,
      impact: 3,
      urgency: 3
    });
  }
  for (const c of obs.inconsistentConfig || []) {
    if (c.trim().length < 8) continue;
    out.push({
      id: `surv-cfg-${c.slice(0, 24)}`,
      title: "Configuration incoh\xE9rente",
      body: c,
      source: "surveillance",
      justification: `Contradiction mesur\xE9e: ${c}`.padEnd(24, "."),
      impact: 4,
      urgency: 3,
      measureValue: 5
    });
  }
  return out.filter((t) => (t.justification || "").length >= 24);
}
function candidateFromMaintenance(obs) {
  const rows = [
    { list: obs.missingTests, prefix: "Tests manquants", impact: 4 },
    { list: obs.falseDocumentation, prefix: "Documentation fausse", impact: 2 },
    { list: obs.outdatedDeps, prefix: "D\xE9pendance \xE0 mettre \xE0 jour", impact: 3 },
    { list: obs.brokenWorkflows, prefix: "Workflow cass\xE9", impact: 5 },
    { list: obs.observabilityGaps, prefix: "Observabilit\xE9 insuffisante", impact: 3 },
    { list: obs.measurableDebt, prefix: "Dette technique mesurable", impact: 3 }
  ];
  const out = [];
  for (const row of rows) {
    for (const item of row.list || []) {
      const trimmed = String(item || "").trim();
      if (!trimmed) continue;
      const justification = `${row.prefix}: ${trimmed} \u2014 evidence in-repo, maintenance source.`;
      if (justification.length < 24) continue;
      out.push({
        id: `maint-${row.prefix}-${trimmed}`.slice(0, 80),
        title: `${row.prefix}: ${trimmed}`.slice(0, 80),
        body: trimmed,
        source: "maintenance",
        justification,
        impact: row.impact,
        urgency: 2,
        measureValue: 4,
        effort: 3,
        kind: "maintenance"
      });
    }
  }
  return out;
}
function dedupeTasks(tasks) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const t of tasks) {
    const key = `${t.number ?? ""}::${t.title.trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}
function parseTaskMetadata(text) {
  const src = String(text || "");
  const files = [];
  const fileLine = src.match(/^files:\s*(.+)$/im);
  if (fileLine) {
    for (const part of fileLine[1].split(/[, ]+/)) {
      const f = part.trim();
      if (f && /[./]/.test(f) && !/^https?:/i.test(f)) files.push(f);
    }
  }
  const factor = (names) => {
    for (const n of names) {
      const m = src.match(new RegExp(`(?:${n}):\\s*([0-5])\\b`, "i"));
      if (m) return Number(m[1]);
    }
    return void 0;
  };
  const dep = src.match(/dependsOnPr:\s*#?(\d+)/i);
  const hashes = [...src.matchAll(/#(\d{1,6})\b/g)].map((m) => Number(m[1]));
  return {
    files,
    impact: factor(["impact"]),
    urgency: factor(["urgence", "urgency"]),
    risk: factor(["risque", "risk"]),
    effort: factor(["effort"]),
    measureValue: factor(["mesure", "measureValue", "valeur"]),
    architecturalCoherence: factor(["coherence", "coh[ée]rence"]),
    dependsOnPr: dep ? Number(dep[1]) : void 0,
    mentionedIssues: hashes
  };
}
function extractTaskNumbers(text) {
  return [...new Set([...String(text || "").matchAll(/#(\d{1,6})\b/g)].map((m) => Number(m[1])))];
}
function provenanceRecord(input) {
  if (input.who === "codex" && input.source !== "codex") {
    throw new Error("refuse to attribute non-Codex work to Codex");
  }
  return { ...input, auto_merge: false, live: false, authority: "carl" };
}
function simulateAbsence(input) {
  const memory = emptyMemory();
  memory.last_main_sha = input.sha;
  const ticks = [];
  const start = Date.parse("2026-09-15T15:00:00Z");
  let asked = false;
  for (const hours of input.hours) {
    const now = start + hours * 3600 * 1e3;
    if (!input.authAvailable && hours > 0) {
      recordErrorSignature(memory, {
        category: "AUTH",
        message: "chatgpt authentication missing",
        sha: input.sha,
        now
      });
      setAuthCooldown(memory, input.sha, now - AUTH_COOLDOWN_MS / 2);
    }
    const decision = evaluateTrigger({
      event: "schedule",
      now,
      currentSha: input.sha,
      memory,
      authAvailable: input.authAvailable,
      breakerOff: false
    });
    memory.measurements.push({
      status: decision.status,
      reason: decision.reason,
      trigger: "schedule",
      at: now,
      sha: input.sha,
      authenticated: input.authAvailable
    });
    memory.state = decision.status;
    const askedCarl = /dis-moi|go\b|continue|lance le test|crée la PR|prochaine tâche/i.test(
      decision.reason
    );
    if (askedCarl) asked = true;
    ticks.push({
      hours,
      event: "schedule",
      decision,
      state: memory.state,
      askedCarl
    });
  }
  return { ticks, askedCarlToTypeGo: asked, merged: false };
}
function runTruthSuite() {
  return [testA(), testB(), testC(), testD(), testE(), testF(), testG()];
}
function ok(id, name, checks) {
  const failed = checks.filter(([pass]) => !pass);
  return {
    id,
    name,
    status: failed.length ? "FAIL" : "PASS",
    evidence: checks.map(([pass, msg]) => `${pass ? "ok" : "fail"} \u2014 ${msg}`)
  };
}
function testA() {
  const sim = simulateAbsence({
    hours: [0, 1, 24, 24 * 7, 24 * 30],
    sha: "aaa1111",
    authAvailable: false
  });
  return ok("A", "Carl absent \u2014 aucun message humain, le syst\xE8me continue", [
    [sim.ticks.length === 5, `${sim.ticks.length} cycles d'absence`],
    [!sim.askedCarlToTypeGo, "n'a pas demand\xE9 \xAB go / continue / prochaine t\xE2che \xBB"],
    [!sim.merged, "n'a pas merg\xE9"],
    [sim.ticks.every((t) => t.state === "WAIT" || t.state === "UNAVAILABLE" || t.state === "IDLE" || t.state === "HUMAN_REQUIRED"), `\xE9tats: ${sim.ticks.map((t) => t.state).join(",")}`],
    [sim.ticks[0].decision.run === true, "premier battement observe r\xE9ellement"],
    [sim.ticks.slice(1).every((t) => t.decision.run === false || t.state === "WAIT"), "ensuite cooldown / wait, pas une boucle GitHub"]
  ]);
}
function testB() {
  const memory = emptyMemory();
  const first = escalateDebug({ attempt: 1, category: "CODEX" });
  recordErrorSignature(memory, { category: "CODEX", message: "boom", sha: "s", now: 1 });
  const second = escalateDebug({ attempt: 2, category: "CODEX", previousLevel: first.level });
  return ok("B", "Codex \xE9choue \u2014 diagnostiquer et r\xE9parer", [
    [first.level === 1, `niveau 1 = ${first.action}`],
    [second.level === 2, `niveau 2 = ${second.action}`],
    [first.stop == null, "ne s'arr\xEAte pas au premier \xE9chec"],
    [classifyRepetition({ memory, category: "CODEX", message: "boom", sha: "s" }).status === "CONTINUE", "\xD71 reste CONTINUE"]
  ]);
}
function testC() {
  const repair = escalateDebug({ attempt: 2, category: "TEST", previousLevel: 1 });
  const after = evaluateTrigger({
    event: "correction",
    now: 2,
    currentSha: "s",
    memory: emptyMemory(),
    authAvailable: true,
    breakerOff: false
  });
  return ok("C", "Test \xE9choue \u2014 Codex corrige puis reteste", [
    [repair.level === 2, "escalade vers correction de test"],
    [after.run === true, "r\xE9paration r\xE9ussie relance la mesure"],
    [after.step === "MEASURE", `\xE9tape ${after.step}`]
  ]);
}
function testD() {
  const empty = selectNextWork({
    tasks: [],
    openPrs: [],
    discovery: { status: "IDLE" },
    timeLeft: true,
    taskBudget: 3
  });
  const discover = selectNextWork({
    tasks: [],
    openPrs: [],
    timeLeft: true,
    taskBudget: 3
  });
  const surv = candidateFromSurveillance({
    failedWorkflows: [
      {
        name: "build-verify",
        conclusion: "failure",
        url: "https://github.com/carllaliberte/famille/actions/runs/1"
      }
    ]
  });
  return ok("D", "Queue vide \u2014 d\xE9couvrir une t\xE2che r\xE9elle ou IDLE", [
    [empty.action === "STOP" && empty.status === "IDLE", "IDLE si rien de justifi\xE9"],
    [discover.action === "DISCOVER", "DISCOVER si la file est vide sans verdict d'idle"],
    [surv.length === 1, "surveillance produit une t\xE2che justifi\xE9e"],
    [(surv[0].justification || "").length >= 24, "justification \u2265 24"]
  ]);
}
function testE() {
  const openPrs = [
    { number: 516, title: "persist memory", head: "codex/persist-unavailable-memory", files: ["scripts/codex-autonomous-worker.mjs"], taskNumbers: [513] }
  ];
  const independent = {
    id: "docs",
    title: "Corriger un test worker ind\xE9pendant",
    source: "maintenance",
    files: ["test/codex-autonomy.test.js"],
    justification: "Le test d'autonomie n'existe pas encore \u2014 gap mesur\xE9.",
    impact: 4,
    urgency: 3
  };
  const dependent = {
    id: "same",
    number: 513,
    title: "m\xEAme t\xE2che que la PR",
    source: "issue",
    files: ["scripts/codex-autonomous-worker.mjs"],
    dependsOnPr: 516
  };
  const next = selectNextWork({
    tasks: [dependent, independent],
    openPrs,
    timeLeft: true,
    taskBudget: 4
  });
  const onlyDep = selectNextWork({
    tasks: [dependent],
    openPrs,
    timeLeft: true,
    taskBudget: 4
  });
  return ok("E", "PR ouverte \u2014 continuer le travail ind\xE9pendant", [
    [next.action === "EXECUTE" && next.task?.id === "docs", "choisit la t\xE2che ind\xE9pendante"],
    [next.relation === "INDEPENDENT", `relation ${next.relation}`],
    [onlyDep.action === "WAIT_HUMAN_MERGE", "sans ind\xE9pendant: WAIT_HUMAN_MERGE, pas d'immobilisation muette"],
    [classifyWorkAgainstPr(dependent, openPrs) === "DEPENDENT", "la t\xE2che de la PR est DEPENDENT"]
  ]);
}
function testF() {
  const memory = emptyMemory();
  memory.last_main_sha = "aaa";
  memory.prs = [{ number: 516, title: "x", head: "codex/x" }];
  memory.tasks = [{ id: "t", title: "suite", source: "issue", dependsOnPr: 516, needsMerge: true }];
  const sync = afterMergeSync({ memory, previousSha: "aaa", newSha: "bbb", mergedPr: 516, now: 9 });
  const trigger = evaluateTrigger({
    event: "pull_request",
    now: 10,
    currentSha: "bbb",
    pr: { merged: true, head: "codex/x", base: "main" },
    memory: sync.memory,
    authAvailable: true,
    breakerOff: false
  });
  return ok("F", "Merge humain \u2014 d\xE9tecter le nouveau SHA et reprendre", [
    [sync.changed === true, "SHA chang\xE9 d\xE9tect\xE9"],
    [sync.memory.last_main_sha === "bbb", "last_main_sha mis \xE0 jour"],
    [sync.memory.prs.length === 0, "PR merg\xE9e retir\xE9e"],
    [sync.memory.tasks[0].needsMerge === false, "t\xE2ches li\xE9es d\xE9bloqu\xE9es"],
    [trigger.run === true && trigger.step === "DETECT_MERGE", `trigger ${trigger.reason}`],
    [!/carl, dis-moi/i.test(trigger.reason), "ne demande pas \xE0 Carl d'annoncer le merge"]
  ]);
}
function testG() {
  const memory = emptyMemory();
  for (let i = 0; i < 3; i++) {
    recordErrorSignature(memory, { category: "CODEX", message: "boom same", sha: "ccc", now: i });
  }
  const rep = classifyRepetition({ memory, category: "CODEX", message: "boom same", sha: "ccc" });
  const trig = evaluateTrigger({
    event: "failure",
    now: 4,
    currentSha: "ccc",
    memory,
    authAvailable: true,
    breakerOff: false
  });
  const archMem = emptyMemory();
  for (let i = 0; i < 3; i++) {
    recordErrorSignature(archMem, { category: "GOVERNANCE", message: "tried to merge", sha: "ccc", now: i });
  }
  const arch = classifyRepetition({
    memory: archMem,
    category: "GOVERNANCE",
    message: "tried to merge",
    sha: "ccc"
  });
  return ok("G", "Erreur r\xE9p\xE9t\xE9e \u2014 cesser de boucler", [
    [rep.status === "HUMAN_REQUIRED", `CODEX \xD73 \u2192 ${rep.status}`],
    [rep.count === 3, `count ${rep.count}`],
    [trig.run === false, "failure trigger refuse de relancer"],
    [arch.status === "ARCHITECTURAL_BLOCK", `gouvernance \xD73 \u2192 ${arch.status}`]
  ]);
}
function loopPosition(input) {
  if (!input.authAvailable) {
    return {
      current: "OBSERVE",
      done: []
    };
  }
  if (input.openCodexPr || input.lastStatus === "PR_READY" || input.lastStatus === "WAIT_HUMAN_MERGE") {
    return {
      current: "WAIT_FOR_HUMAN_MERGE",
      done: LOOP_STEPS.slice(0, 12)
    };
  }
  if (input.lastStatus === "IDLE") {
    return { current: "OBSERVE", done: [] };
  }
  return { current: "TASK", done: ["OBSERVE", "UNDERSTAND", "DISCOVER", "PRIORITIZE"] };
}
function sovereigntyIntact(record) {
  return record.auto_merge === false && record.live === false && record.authority === "carl";
}
export {
  AUTH_COOLDOWN_MS,
  CODEX_NODE,
  DEBOUNCE_MS,
  KERNEL_VERSION,
  LOOP_STEPS,
  MAX_IDENTICAL_ERRORS,
  MAX_IDENTICAL_REPAIRS,
  afterMergeSync,
  applyLoopGuards,
  candidateFromMaintenance,
  candidateFromSurveillance,
  classifyRepetition,
  classifyWorkAgainstPr,
  dedupeTasks,
  emptyMemory,
  errorSignature,
  escalateDebug,
  evaluateTrigger,
  extractTaskNumbers,
  fabricNode,
  humanRequired,
  hydrateMemory,
  isArchitecturalCategory,
  isOperativeCodexPr,
  loopPosition,
  parseTaskMetadata,
  prioritize,
  provenanceRecord,
  recordErrorSignature,
  runTruthSuite,
  scoreTask,
  selectNextWork,
  setAuthCooldown,
  shouldStopCleanly,
  simulateAbsence,
  skippedForSha,
  sovereigntyIntact,
  previousSkipSha,
  wakeOpenCodexTask
};
