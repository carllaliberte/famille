/**
 * acorn flux v0 — chef mesh. Interoperability system.
 * Grok is chef. GitHub is memory. Four modes always, for every connected AI.
 * Heavy and Build always consult. Grok decides specialties, then writes in flux/.
 * Not a Worker canal. Not LIVE. Not QUANTUM.
 */

export const FLUX_VERSION = "acorn.v0";
export const CHEF = "grok";
export const HOST = "https://acorn-royal-dune-blend.grok.me";
export const GUEST_CAP = 8;
export const ALWAYS_CONSULT = Object.freeze(["heavy", "build"]);

export const AGENTS = Object.freeze({
  grok: { id: "grok", name: "Grok", role: "chef", kind: "chef", specialty: "decides · writes" },
  heavy: { id: "heavy", name: "Grok Heavy", role: "always consult", kind: "consult", specialty: "reason" },
  build: { id: "build", name: "Grok Build", role: "always consult", kind: "consult", specialty: "implement" },
  chatgpt: { id: "chatgpt", name: "ChatGPT", role: "challenges", kind: "model", specialty: "challenge" },
  sonnet: { id: "sonnet", name: "Claude Sonnet 5", role: "reviews", kind: "model", specialty: "review" },
  fable: { id: "fable", name: "Claude Fable 5", role: "hard review", kind: "model", specialty: "hard review" },
  deepseek: { id: "deepseek", name: "DeepSeek", role: "independent", kind: "model", specialty: "independent" },
  gemini: { id: "gemini", name: "Gemini", role: "independent", kind: "model", specialty: "independent" },
  cursor: { id: "cursor", name: "Cursor", role: "builds", kind: "seat", specialty: "builds" },
  ci: { id: "ci", name: "CI", role: "verifies", kind: "seat", specialty: "verifies" },
  github: { id: "github", name: "GitHub", role: "remembers", kind: "seat", specialty: "memory" },
  worker: { id: "worker", name: "GET /juge", role: "preview canal", kind: "seat", specialty: "preview canal" },
  carl: { id: "carl", name: "Carl", role: "judges", kind: "seat", specialty: "judges" },
});

export const AGENT_IDS = Object.freeze(Object.keys(AGENTS));

export const ACTS = Object.freeze([
  "FINDING",
  "EVIDENCE",
  "RISK",
  "ACTION",
  "TEST",
  "RESULT",
  "HANDOFF",
]);

export const MODES = Object.freeze([
  "PROPOSITION",
  "CONSULTATION",
  "ECHANGE",
  "CHALLENGE",
]);

/** Four modes are always on. Not tabs. Not optional. There is no one-mode path. */
export const MODES_ALWAYS = true;

export const GRADES = Object.freeze([
  "PROPOSED",
  "CODE VERIFIED",
  "TEST VERIFIED",
  "NOT LIVE VERIFIED",
  "LIVE VERIFIED",
]);

/** Future AIs. Not core. Connect when Carl wants them on the mesh. */
export const SUGGESTED_GUESTS = Object.freeze([
  { id: "copilot", name: "GitHub Copilot", role: "guest review", specialty: "guest review" },
  { id: "llama", name: "Llama", role: "open guest", specialty: "open" },
  { id: "mistral", name: "Mistral", role: "open guest", specialty: "open" },
  { id: "qwen", name: "Qwen", role: "open guest", specialty: "open" },
  { id: "opus", name: "Claude Opus", role: "guest review", specialty: "guest review" },
]);

const MODEL_IDS = new Set(["sonnet", "fable", "chatgpt", "deepseek", "gemini"]);
const AUTO_MODELS = ["chatgpt", "sonnet", "deepseek", "gemini"];
const RESERVED = new Set([
  "attest",
  "quantum",
  "live",
  "wrangler",
  "admin",
  "root",
  "chef",
  "*",
]);
const ID_RE = /^[a-z][a-z0-9-]{1,24}$/;

/** @type {Map<string, { id: string, name: string, role: string, kind: "guest", specialty: string }>} */
const GUESTS = new Map();

export function resetGuests() {
  GUESTS.clear();
}

export function roster() {
  return [...Object.values(AGENTS), ...GUESTS.values()];
}

export function rosterIds() {
  return roster().map((a) => a.id);
}

export function lookup(id) {
  const key = String(id || "").toLowerCase();
  return AGENTS[key] || GUESTS.get(key) || null;
}

export function isAgent(id) {
  return lookup(id) != null;
}

export function isModel(id) {
  const row = lookup(id);
  if (!row) return false;
  if (row.kind === "guest") return true;
  return MODEL_IDS.has(row.id);
}

export function isChef(id) {
  return String(id || "").toLowerCase() === CHEF;
}

export function isAlwaysConsult(id) {
  return ALWAYS_CONSULT.includes(String(id || "").toLowerCase());
}

export function specialtyOf(id) {
  return lookup(id)?.specialty || lookup(id)?.role || "";
}

export function directions(from) {
  if (!isAgent(from)) return [];
  return rosterIds().filter((id) => id !== from);
}

export function meshSize() {
  const n = rosterIds().length;
  return n * (n - 1);
}

export function gradesFor(from) {
  const out = ["PROPOSED", "NOT LIVE VERIFIED"];
  if (from === "ci" || from === "carl") out.push("TEST VERIFIED");
  if (from === "github" || from === "carl") out.push("CODE VERIFIED");
  if (from === "carl") out.push("LIVE VERIFIED");
  return out;
}

export function pathFor(packet) {
  const mode = String(packet?.mode || "ECHANGE").toLowerCase();
  const from = String(packet?.from || "grok").toLowerCase();
  const to = packet?.to === "*" ? "all" : String(packet?.to || "github").toLowerCase();
  return `flux/${mode}/${from}-to-${to}.md`;
}

function fail(code, error) {
  return { ok: false, code, error };
}

export function connectAgent(spec) {
  const raw = spec && typeof spec === "object" ? spec : {};
  const id = String(raw.id || "").toLowerCase().trim();
  if (!ID_RE.test(id)) return fail("BAD_ID", "id must be [a-z][a-z0-9-]{1,24}");
  if (RESERVED.has(id)) return fail("RESERVED_ID", `${id} is reserved`);
  if (AGENTS[id]) return fail("CORE_LOCKED", `${id} is a core seat`);
  if (GUESTS.has(id)) return fail("ALREADY", `${id} is already connected`);
  if (GUESTS.size >= GUEST_CAP) return fail("ROSTER_FULL", `at most ${GUEST_CAP} guest AIs`);
  const name = String(raw.name || id).slice(0, 40);
  const role = String(raw.role || "guest").slice(0, 40);
  const specialty = String(raw.specialty || role).slice(0, 40);
  const row = { id, name, role, kind: "guest", specialty };
  GUESTS.set(id, row);
  return { ok: true, agent: row };
}

export function disconnectAgent(id) {
  const key = String(id || "").toLowerCase();
  if (AGENTS[key]) return fail("CORE_LOCKED", `${key} cannot leave`);
  if (!GUESTS.has(key)) return fail("UNKNOWN_AGENT", `unknown ${key}`);
  GUESTS.delete(key);
  return { ok: true, id: key };
}

function claimsQuantum(text) {
  const t = String(text || "");
  if (!/\bQUANTUM\b/.test(t)) return false;
  if (/\b(never|not|jamais|forbid|forbids|interdit|licensed)\b[\s\S]{0,80}\bQUANTUM\b/i.test(t)) {
    return false;
  }
  if (/\bQUANTUM\b[\s\S]{0,80}\b(never|not|jamais|interdit|not licensed|is not licensed)/i.test(t)) {
    return false;
  }
  return true;
}

function claimsNewHost(text) {
  return /second\s+\*\.grok\.me|new\s+\*\.grok\.me|invent(?:s|ing)?\s+another\s+\*\.grok\.me/i.test(
    String(text || ""),
  );
}

function claimsAttestCanal(text) {
  return /create(?:s|ing)?\s+(?:a\s+)?(?:POST\s+)?\/attest\b/i.test(String(text || ""));
}

function claimsDeploy(text, act) {
  if (act !== "ACTION" && act !== "RESULT") return false;
  return /wrangler\s+deploy/i.test(String(text || ""));
}

function clipBody(body) {
  return String(body ?? "").slice(0, 8000);
}

function newId() {
  return `flux_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function modeOk(mode, from, to) {
  if (mode === "PROPOSITION" && from !== CHEF) {
    return fail("MODE_CHEF", "PROPOSITION is Grok chef only");
  }
  if (mode === "CONSULTATION") {
    if (from !== CHEF) return fail("MODE_CHEF", "CONSULTATION is Grok chef only");
    if (to === "*") return fail("MODE_ONE", "CONSULTATION addresses one AI");
  }
  if (mode === "CHALLENGE" && from !== CHEF && to !== CHEF) {
    return fail("MODE_GROK", "CHALLENGE must include Grok");
  }
  return { ok: true };
}

/**
 * Accept one envelope. Fail-closed. Chef files it under flux/.
 * @param {unknown} input
 */
export function accept(input) {
  const raw = input && typeof input === "object" ? input : {};
  const version = raw.flux == null || raw.flux === "" ? FLUX_VERSION : String(raw.flux);
  if (version !== FLUX_VERSION) {
    return fail("FLUX_VERSION", `flux must be ${FLUX_VERSION}`);
  }
  const from = String(raw.from || "").toLowerCase();
  const to = String(raw.to || "").toLowerCase();
  const act = String(raw.act || "").toUpperCase();
  const mode = String(raw.mode || "ECHANGE").toUpperCase();
  const grade = String(raw.grade || "PROPOSED").toUpperCase();
  const body = clipBody(raw.body);
  if (!isAgent(from)) return fail("UNKNOWN_AGENT", `unknown from: ${from || "(empty)"}`);
  if (to !== "*" && !isAgent(to)) return fail("UNKNOWN_AGENT", `unknown to: ${to || "(empty)"}`);
  if (!ACTS.includes(act)) return fail("UNKNOWN_ACT", `unknown act: ${act || "(empty)"}`);
  if (!MODES.includes(mode)) return fail("UNKNOWN_MODE", `unknown mode: ${mode}`);
  if (!GRADES.includes(grade)) return fail("UNKNOWN_GRADE", `unknown grade: ${grade}`);
  if (!body.trim()) return fail("BODY_MISSING", "body is required");
  if (grade === "LIVE VERIFIED" && from !== "carl") {
    return fail("LIVE_NOT_CARL", "LIVE VERIFIED is Carl only. No model declares LIVE.");
  }
  if (grade === "CODE VERIFIED" && from !== "github" && from !== "carl") {
    return fail("CODE_NOT_MEMORY", "CODE VERIFIED is GitHub (on main) or Carl.");
  }
  if (grade === "TEST VERIFIED" && from !== "ci" && from !== "carl") {
    return fail("TEST_NOT_CI", "TEST VERIFIED is CI or Carl.");
  }
  if (from === to && to !== "*") {
    return fail("NO_LOOP", "from and to must differ (use to:* to broadcast)");
  }
  if (claimsQuantum(body)) {
    return fail("FORBIDDEN_QUANTUM", "QUANTUM is not licensed here. Preview ≠ receipt.");
  }
  if (claimsNewHost(body)) {
    return fail("FORBIDDEN_HOST", "Unique host only: acorn-royal-dune-blend.grok.me");
  }
  if (claimsAttestCanal(body)) {
    return fail("FORBIDDEN_ATTEST", "POST /attest is not this canal.");
  }
  if (claimsDeploy(body, act) && from !== "carl") {
    return fail("FORBIDDEN_DEPLOY", "wrangler deploy is Carl only. Flux does not deploy.");
  }
  const allowed = gradesFor(from);
  if (!allowed.includes(grade)) {
    return fail("GRADE_NOT_FOR_AGENT", `${from} cannot claim ${grade}`);
  }
  const locked = modeOk(mode, from, to);
  if (!locked.ok) return locked;

  const packet = {
    flux: FLUX_VERSION,
    id: String(raw.id || newId()),
    ts: String(raw.ts || new Date().toISOString()),
    chef: CHEF,
    from,
    to,
    act,
    mode,
    grade,
    body: body.trim(),
    replyTo: raw.replyTo ? String(raw.replyTo) : null,
    path: "",
    preview: true,
    receipt: false,
    host: HOST,
  };
  packet.path = pathFor(packet);
  return { ok: true, packet };
}

export function fanout(packet) {
  if (!packet || packet.to !== "*") return [packet];
  return directions(packet.from).map((to) => {
    const row = { ...packet, id: `${packet.id}_${to}`, to };
    row.path = pathFor(row);
    return row;
  });
}

/** Chef files the broadcast itself, then each directed copy. */
export function filePackets(packet) {
  if (!packet) return [];
  if (packet.to !== "*") return [packet];
  return [packet, ...fanout(packet)];
}

export function fileTree(packets = []) {
  const tree = { proposition: [], consultation: [], echange: [], challenge: [] };
  for (const p of packets) {
    const key = String(p.mode || "ECHANGE").toLowerCase();
    if (!tree[key]) tree[key] = [];
    tree[key].push({
      path: p.path || pathFor(p),
      from: p.from,
      to: p.to,
      act: p.act,
    });
  }
  return tree;
}

/**
 * Chef memory: one markdown file per canal. Later packets on the same path append.
 * @param {Array<{ path?: string, mode?: string, from?: string, to?: string, act?: string, grade?: string, body?: string }>} packets
 */
export function materialize(packets = []) {
  /** @type {Record<string, string>} */
  const files = {};
  for (const p of packets) {
    const path = p.path || pathFor(p);
    const block = formatEnvelope(p);
    files[path] = files[path] ? `${files[path]}\n\n---\n\n${block}` : block;
  }
  return files;
}

/**
 * Grok decides who to consult. Heavy and Build always. Other AIs by specialty.
 * Fable stays on-demand. Connected guests join. Seats only when the topic names them.
 */
export function decideSpecialists(topic = "") {
  const t = String(topic || "").toLowerCase();
  const hits = [];
  if (/challenge|refute|risk|adversar/.test(t)) hits.push("chatgpt");
  if (/review|docs/.test(t)) hits.push("sonnet");
  if (/\bfable\b|hard review/.test(t)) hits.push("fable");
  if (/independ|second opinion/.test(t)) hits.push("deepseek", "gemini");
  if (/cursor|implement code|repo patch/.test(t)) hits.push("cursor");
  if (/\bci\b|verify|juge\.yml/.test(t)) hits.push("ci");
  if (/memory|github|pull request/.test(t)) hits.push("github");
  if (/\/juge|worker|canal/.test(t)) hits.push("worker");
  if (/\bcarl\b|judge|merge|live verified/.test(t)) hits.push("carl");
  if (hits.length === 0) hits.push(...AUTO_MODELS);
  for (const g of GUESTS.values()) hits.push(g.id);
  const seen = new Set();
  const out = [];
  for (const id of hits) {
    if (id === CHEF || seen.has(id) || !isAgent(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Always Heavy + Build, then Grok-decided specialists. */
export function consultIds(topic = "") {
  const ids = [];
  for (const id of ALWAYS_CONSULT) {
    if (isAgent(id) && !ids.includes(id)) ids.push(id);
  }
  for (const id of decideSpecialists(topic)) {
    if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

function clipTopic(topic) {
  return String(topic || "").trim().slice(0, 400);
}

/**
 * Interoperability cycle. GitHub first. Then the four modes, always, for all AIs Grok decides.
 * Heavy and Build always consult. Fail-closed via accept().
 */
export function cycle(input) {
  const raw = input && typeof input === "object" ? input : { body: input };
  const topic = clipTopic(raw.body || raw.topic);
  if (!topic) return fail("BODY_MISSING", "cycle needs a question");
  const consult = consultIds(topic);
  const never = " Never QUANTUM. Unique host only.";
  const drafts = [
    {
      from: "github",
      to: CHEF,
      act: "EVIDENCE",
      mode: "ECHANGE",
      grade: "NOT LIVE VERIFIED",
      body: `GitHub memory first. carllaliberte/acorn-juge. Topic: ${topic}.${never}`,
    },
    {
      from: CHEF,
      to: "*",
      act: "HANDOFF",
      mode: "PROPOSITION",
      grade: "PROPOSED",
      body: `Grok chef proposes to every connected AI. ${topic} Heavy and Build always consult. Grok decides specialties.${never}`,
    },
  ];
  for (const id of consult) {
    drafts.push({
      from: CHEF,
      to: id,
      act: "FINDING",
      mode: "CONSULTATION",
      grade: "PROPOSED",
      body: `Consult ${lookup(id)?.name || id} (${specialtyOf(id)}). ${topic} Do not declare LIVE.${never}`,
    });
  }
  const a = consult[0];
  const b = consult[1] || AUTO_MODELS.find((id) => id !== a);
  if (a && b && a !== b) {
    drafts.push({
      from: a,
      to: b,
      act: "HANDOFF",
      mode: "ECHANGE",
      grade: "PROPOSED",
      body: `Exchange. ${specialtyOf(a)} with ${specialtyOf(b)}. ${topic}.${never}`,
    });
  }
  const challenger = consult.includes("chatgpt") ? "chatgpt" : consult.find((id) => isModel(id)) || "chatgpt";
  drafts.push({
    from: challenger,
    to: CHEF,
    act: "RISK",
    mode: "CHALLENGE",
    grade: "PROPOSED",
    body: `Challenge Grok. ${topic} Do not bind /flux on the Worker. Do not wrangler.${never}`,
  });

  const packets = [];
  for (const d of drafts) {
    const r = accept(d);
    if (!r.ok) return r;
    packets.push(...filePackets(r.packet));
  }
  return { ok: true, consult, packets };
}

/**
 * Parse a GitHub comment into a flux draft (not yet accept()).
 */
export function parseFlux(text = "") {
  const src = String(text || "");
  const hasHeader = /(?:^|\n)\s*FLUX\b/i.test(src);
  const hasCmd = /(?:^|\s)\/flux(?=[\s,;:!?.)]|$)/i.test(src);
  if (!hasHeader && !hasCmd) return null;

  const kv = {};
  const re = /(\w+):([^\s]+)/g;
  let m;
  while ((m = re.exec(src))) kv[m[1].toLowerCase()] = m[2];

  const from = String(kv.from || "github").toLowerCase();
  const to = String(kv.to || "*").toLowerCase();
  const act = String(kv.act || "HANDOFF").toUpperCase();
  const mode = String(kv.mode || "ECHANGE").toUpperCase();
  const grade = String(kv.grade || "PROPOSED").replace(/_/g, " ").toUpperCase();

  const stripped = src
    .replace(/^\s*FLUX\b[^\n]*\n?/im, "")
    .replace(/(?:^|\s)\/flux(?:\s+\S+)*/gi, "")
    .replace(/^\s*path:\s*\S+\s*$/gim, "")
    .replace(/^\s*chef:\s*\S+\s*$/gim, "")
    .trim();

  return {
    flux: FLUX_VERSION,
    from,
    to,
    act,
    mode,
    grade,
    body: stripped || src.trim(),
  };
}

export function formatEnvelope(packet) {
  const p = packet && typeof packet === "object" ? packet : {};
  const path = p.path || pathFor(p);
  return [
    `FLUX from:${p.from} to:${p.to} act:${p.act} mode:${p.mode || "ECHANGE"} grade:${p.grade}`,
    `path: ${path}`,
    `chef: ${CHEF}`,
    "",
    String(p.body || "").trim(),
    "",
    `_flux ${FLUX_VERSION} · chef:${CHEF} · preview:true · receipt:false · not LIVE_VERIFIED_`,
  ].join("\n");
}

export function modelsForDestination(to) {
  if (to === "*" || to == null || to === "") {
    return ["sonnet", "chatgpt", "deepseek", "gemini"];
  }
  if (isModel(to) && lookup(to)?.kind !== "guest") return [to];
  if (lookup(to)?.kind === "guest") return [];
  return [];
}

export const SEED = Object.freeze([
  {
    id: "seed_github_to_grok",
    ts: "2026-09-05T12:00:00.000Z",
    from: "github",
    to: "grok",
    act: "EVIDENCE",
    mode: "ECHANGE",
    grade: "NOT LIVE VERIFIED",
    body: "GitHub memory first. carllaliberte/acorn-juge. Four modes always. Never QUANTUM.",
  },
  {
    id: "seed_grok_to_all",
    ts: "2026-09-05T12:00:01.000Z",
    from: "grok",
    to: "*",
    act: "HANDOFF",
    mode: "PROPOSITION",
    grade: "PROPOSED",
    body: "Grok chef proposes the mesh. Every connected AI may answer. Heavy and Build always consult. Worker stays GET /juge. Never QUANTUM.",
  },
  {
    id: "seed_grok_to_heavy",
    ts: "2026-09-05T12:00:02.000Z",
    from: "grok",
    to: "heavy",
    act: "FINDING",
    mode: "CONSULTATION",
    grade: "PROPOSED",
    body: "Consult Heavy. Reason the four-mode cycle. Do not declare LIVE. Never QUANTUM.",
  },
  {
    id: "seed_grok_to_build",
    ts: "2026-09-05T12:00:03.000Z",
    from: "grok",
    to: "build",
    act: "FINDING",
    mode: "CONSULTATION",
    grade: "PROPOSED",
    body: "Consult Build. Implement the cycle. Do not declare LIVE. Never QUANTUM.",
  },
  {
    id: "seed_grok_to_chatgpt",
    ts: "2026-09-05T12:00:04.000Z",
    from: "grok",
    to: "chatgpt",
    act: "FINDING",
    mode: "CONSULTATION",
    grade: "PROPOSED",
    body: "Consult: is GitHub memory enough, or must chef write flux/ files in the repo? Unique host only. Never QUANTUM.",
  },
  {
    id: "seed_chatgpt_to_grok",
    ts: "2026-09-05T12:00:05.000Z",
    from: "chatgpt",
    to: "grok",
    act: "RISK",
    mode: "CHALLENGE",
    grade: "PROPOSED",
    body: "Challenge: a sandbox mesh is not LIVE. Do not bind /flux on the Worker. Do not wrangler from this packet. Never QUANTUM.",
  },
  {
    id: "seed_heavy_to_build",
    ts: "2026-09-05T12:00:06.000Z",
    from: "heavy",
    to: "build",
    act: "HANDOFF",
    mode: "ECHANGE",
    grade: "PROPOSED",
    body: "Exchange: reason then implement. Four modes always. Unique host only. Never QUANTUM.",
  },
  {
    id: "seed_sonnet_to_grok",
    ts: "2026-09-05T12:00:07.000Z",
    from: "sonnet",
    to: "grok",
    act: "HANDOFF",
    mode: "ECHANGE",
    grade: "PROPOSED",
    body: "Exchange: Fable stays on-demand. Future AIs connect as guests. Core seats stay locked. Never QUANTUM.",
  },
  {
    id: "seed_cursor_to_ci",
    ts: "2026-09-05T12:00:08.000Z",
    from: "cursor",
    to: "ci",
    act: "ACTION",
    mode: "ECHANGE",
    grade: "PROPOSED",
    body: "Add flux cycle + always-consult tests. Do not replace juge.yml. npm test remains the lock. Never QUANTUM.",
  },
  {
    id: "seed_github_to_carl",
    ts: "2026-09-05T12:00:09.000Z",
    from: "github",
    to: "carl",
    act: "HANDOFF",
    mode: "ECHANGE",
    grade: "NOT LIVE VERIFIED",
    body: "Chef writes under flux/. Merge and wrangler stay yours. No model deploys. Never QUANTUM.",
  },
]);
