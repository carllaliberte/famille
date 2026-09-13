/**
 * Pack lieu BCP 47. Phrases only. Same judge.
 * Unknown tag → spoken en / classique. Never a second slug.
 * Never fills epsilon or horizon. Never a new country file.
 * Tag match is case-insensitive (RFC 5646). fr-ca = fr-CA. Not a new pack.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(ROOT, "packs");

export const HOTE = "https://acorn-royal-dune-blend.grok.me";
export const PACK_FILES = Object.freeze([
  "de-DE",
  "en",
  "en-NG",
  "es-MX",
  "fr-CA",
  "pt-BR",
]);

const ALIAS = Object.freeze({ "en-CA": "en" });

function lire(tag) {
  return JSON.parse(readFileSync(join(DIR, `${tag}.json`), "utf8"));
}

function sameTag(a, b) {
  return String(a).toLowerCase() === String(b).toLowerCase();
}

/** Born pack file or alias target. Null if the tag is not in the table. */
function resolveFile(demande) {
  const aliasKey = Object.keys(ALIAS).find((k) => sameTag(k, demande));
  if (aliasKey) return ALIAS[aliasKey];
  return PACK_FILES.find((f) => sameTag(f, demande)) || null;
}

/**
 * Resolve a BCP 47 tag to a born pack.
 * Empty → door default fr-CA. en-CA → en. Absent → spoken en.
 * Case ignored: fr-ca / FR-CA → fr-CA. Language-only `fr` stays unknown.
 */
export function packLieu(tag) {
  const demande = tag == null ? "" : String(tag).trim();
  if (demande === "") {
    return {
      ok: true,
      connu: true,
      defaut: true,
      tag: "fr-CA",
      demande: "",
      pack: lire("fr-CA"),
      hote: HOTE,
    };
  }
  const file = resolveFile(demande);
  if (file) {
    return {
      ok: true,
      connu: true,
      defaut: false,
      tag: file,
      demande,
      pack: lire(file),
      hote: HOTE,
    };
  }
  return {
    ok: true,
    connu: false,
    defaut: false,
    tag: "en",
    demande,
    pack: lire("en"),
    hote: HOTE,
    raison: "inconnu",
  };
}
