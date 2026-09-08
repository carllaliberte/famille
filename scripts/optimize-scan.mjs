#!/usr/bin/env node
/**
 * Deterministic perf+structure scan. Not a LLM. Not a node.
 * Never writes unforge-check/ schema/ mesure-protocol/ action.yml.
 * Mechanical apply is limited to scripts/ and test/.
 * Empty findings → no report file (caller HOLDs).
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const SENSITIVE_PREFIXES = [
  "unforge-check/",
  "schema/",
  "mesure-protocol/",
];
export const SENSITIVE_FILES = ["action.yml"];
export const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".ots-anchor",
  "unforge-check",
  "schema",
  "mesure-protocol",
]);
export const NEVER_APPLY = new Set([
  "REVUE.md",
  "AUTOMATION.md",
  "FILE.md",
  "LICENSE",
  "optimization_report.md",
]);
export const APPLY_PREFIXES = ["scripts/", "test/"];
export const SIZE_AMBRE = 16 * 1024;
export const ROOT_MD_BUDGET = 25;

const TEXT_EXT = new Set([
  ".md",
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".yml",
  ".yaml",
  ".json",
  ".sh",
  ".css",
  ".html",
  ".txt",
]);

export function isSensitive(path) {
  const normalized = path.replace(/^\.\//, "").split("\\").join("/");
  if (
    SENSITIVE_PREFIXES.some(
      (p) => normalized === p.slice(0, -1) || normalized.startsWith(p),
    )
  ) {
    return true;
  }
  const base = normalized.split("/").pop() ?? normalized;
  return SENSITIVE_FILES.includes(base);
}

export function canApply(path) {
  if (isSensitive(path)) return false;
  const normalized = path.replace(/^\.\//, "").split("\\").join("/");
  const base = normalized.split("/").pop() ?? normalized;
  if (NEVER_APPLY.has(base) || NEVER_APPLY.has(normalized)) return false;
  if (normalized.startsWith(".github/")) return false;
  return APPLY_PREFIXES.some((p) => normalized.startsWith(p));
}

function extOf(path) {
  const base = path.split("/").pop() ?? path;
  const i = base.lastIndexOf(".");
  return i >= 0 ? base.slice(i) : "";
}

export function walk(root) {
  const out = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        stack.push(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      const rel = relative(root, abs).split(sep).join("/");
      if (isSensitive(rel)) continue;
      out.push({ abs, rel });
    }
  }
  return out;
}

const LINK_RE = /\[[^\]]*\]\(([^)]+)\)/g;

export function brokenMarkdownLinks(rel, text, root) {
  const hits = [];
  if (!rel.endsWith(".md")) return hits;
  const dir = dirname(join(root, rel));
  LINK_RE.lastIndex = 0;
  let m;
  while ((m = LINK_RE.exec(text))) {
    let target = m[1].trim();
    if (!target || target.startsWith("<")) continue;
    target = target.split(/\s+#/)[0].split("#")[0].trim();
    if (
      !target ||
      /^(https?:|mailto:|data:)/i.test(target) ||
      target.startsWith("#")
    ) {
      continue;
    }
    const resolved = resolve(dir, target);
    if (!existsSync(resolved)) {
      hits.push(target);
    }
  }
  return hits;
}

export function scanFile(rel, text, bytes, root) {
  const findings = [];
  const ext = extOf(rel);
  if (TEXT_EXT.has(ext)) {
    if (/[ \t]+$/m.test(text)) {
      findings.push({
        file: rel,
        change: "espaces en fin de ligne",
        reason: "Mécanique. Hors chemins sensibles.",
        risk: "low",
        kind: "mécanique",
        apply: "trailing-ws",
      });
    }
    if (text.length && !text.endsWith("\n")) {
      findings.push({
        file: rel,
        change: "newline finale manquante",
        reason: "POSIX. Hors chemins sensibles.",
        risk: "low",
        kind: "mécanique",
        apply: "final-nl",
      });
    }
  }
  if (bytes >= SIZE_AMBRE) {
    const kb = Math.round(bytes / 1024);
    findings.push({
      file: rel,
      change: `fichier ${kb} Ko`,
      reason: "Trop lourd pour un rewrite automatique. Rapport seulement.",
      risk: "medium",
      kind: "structure",
      apply: null,
    });
  }
  const broken = brokenMarkdownLinks(rel, text, root);
  for (const t of broken.slice(0, 5)) {
    findings.push({
      file: rel,
      change: `lien cassé → ${t}`,
      reason: "Référence relative absente. Rapport seulement.",
      risk: "medium",
      kind: "structure",
      apply: null,
    });
  }
  return findings;
}

export function applyMechanical(text, kinds) {
  let next = text;
  if (kinds.has("trailing-ws")) next = next.replace(/[ \t]+$/gm, "");
  if (kinds.has("final-nl") && next.length && !next.endsWith("\n")) next += "\n";
  return next;
}

export function renderReport({ scope, findings, applied, now }) {
  const lines = [
    "<!-- optimize-scan:start -->",
    `# Rapport d'optimisation — ${now}`,
    "",
    `scope: \`${scope}\``,
    "chemins sensibles exclus : `unforge-check/` `schema/` `mesure-protocol/` `action.yml`",
    "application mécanique : `scripts/` `test/` seulement",
    "",
    "| Fichier | Changement | Justification | Risque |",
    "|---|---|---|---|",
  ];
  if (!findings.length) {
    lines.push("| — | RAS | rien à appliquer | HOLD |");
  } else {
    for (const f of findings) {
      const file = escapeCell(f.file);
      const change = escapeCell(f.change) + (applied.has(keyOf(f)) ? " (appliqué)" : "");
      const reason = escapeCell(f.reason);
      const risk = f.risk === "hold" ? "HOLD" : f.risk;
      lines.push(`| \`${file}\` | ${change} | ${reason} | ${risk} |`);
    }
  }
  lines.push("<!-- optimize-scan:end -->");
  lines.push("");
  return lines.join("\n");
}

function escapeCell(s) {
  return String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function keyOf(f) {
  return `${f.file}::${f.apply || f.change}`;
}

export function runScan({ root, scope, apply }) {
  const files = walk(root);
  const findings = [];
  let rootMd = 0;
  const byFile = new Map();

  for (const { abs, rel } of files) {
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    if (/^[^/]+\.md$/.test(rel)) rootMd += 1;
    const ext = extOf(rel);
    let text = "";
    if (TEXT_EXT.has(ext) && st.size < 2_000_000) {
      try {
        text = readFileSync(abs, "utf8");
      } catch {
        continue;
      }
    }
    const found = scanFile(rel, text, st.size, root);
    if (found.length) byFile.set(rel, { abs, text, found });
    for (const f of found) {
      if (scope === "perf" && f.kind === "structure") continue;
      if (scope === "structure" && f.kind === "perf") continue;
      findings.push(f);
    }
  }

  if ((scope === "perf+structure" || scope === "structure") && rootMd > ROOT_MD_BUDGET) {
    findings.push({
      file: "(racine)",
      change: `${rootMd} fichiers .md`,
      reason: "Doctrine à plat. Un scan ne range pas la carte.",
      risk: "medium",
      kind: "structure",
      apply: null,
    });
  }

  const applied = new Set();
  if (apply) {
    for (const [rel, rec] of byFile) {
      if (!canApply(rel)) continue;
      const kinds = new Set(
        rec.found.filter((f) => f.apply && findings.includes(f)).map((f) => f.apply),
      );
      if (!kinds.size) continue;
      const next = applyMechanical(rec.text, kinds);
      if (next !== rec.text) {
        writeFileSync(rec.abs, next, "utf8");
        for (const f of rec.found) {
          if (f.apply && kinds.has(f.apply)) applied.add(keyOf(f));
        }
      }
    }
  }

  return { findings, applied, rootMd };
}

function parseArgs(argv) {
  const out = {
    scope: "perf+structure",
    apply: false,
    report: "optimization_report.md",
    root: process.cwd(),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--apply") out.apply = true;
    else if (a === "--scope") out.scope = argv[++i];
    else if (a === "--report") out.report = argv[++i];
    else if (a === "--root") out.root = argv[++i];
  }
  if (!["perf+structure", "perf", "structure"].includes(out.scope)) {
    throw new Error(`HOLD : portée inconnue ${out.scope}`);
  }
  return out;
}

function isMain() {
  const self = fileURLToPath(import.meta.url);
  const invoked = process.argv[1] ? resolve(process.argv[1]) : "";
  return self === invoked;
}

if (isMain()) {
  const opts = parseArgs(process.argv.slice(2));
  const { findings, applied } = runScan(opts);
  if (!findings.length) {
    console.log("HOLD : RAS. Pas de tampon à vide.");
    process.exit(2);
  }
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  const report = renderReport({
    scope: opts.scope,
    findings,
    applied,
    now,
  });
  writeFileSync(join(opts.root, opts.report), report, "utf8");
  console.log(`report ${findings.length} findings, applied ${applied.size}`);
}
