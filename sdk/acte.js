/**
 * Quote an act. Bots never invent a price.
 * Missing judge field → classique. HTTP 200 is not an invoice.
 * Cursor consumes the judge. Cursor is not the judge. Carl writes prices.
 */
import { peutDire } from "./peut-dire.js";

export const HOTE = "https://acorn-juge.laliberte22.workers.dev";
export const VITRINE = "https://acorn-royal-dune-blend.grok.me";

/**
 * @param {object} carte
 * @param {{ today?: string, http?: { status?: number, path?: string } }} [opts]
 */
export function quoteActe(carte, opts = {}) {
  const verdict = peutDire(carte, { today: opts.today });
  const http = opts.http && typeof opts.http === "object" ? opts.http : null;
  const status = http && http.status != null ? Number(http.status) : null;
  const path = http && http.path != null ? String(http.path) : "";

  const out = {
    sale: false,
    invoice: false,
    price: null,
    preview: true,
    seal: false,
    live: false,
    auto_merge: false,
    hote: HOTE,
    vitrine: VITRINE,
    mode: verdict.mode,
    manques: verdict.manques,
    phrase: "Les certitudes ont une date de fin.",
    need_carl: false,
    four_cards: Boolean(
      verdict.manques && verdict.manques.length === 0 && !verdict.refus,
    ),
  };

  if (status === 200) {
    out.http = 200;
    out.note = "Un 200 n'est pas un sceau";
  }
  if (status === 404 && path === "/juge" && (http.host === VITRINE || http.host === "vitrine")) {
    out.hold = false;
    out.reason = "vitrine_html_attendue";
  }

  if (verdict.refus) {
    out.reason = verdict.refus.code;
    out.refus = verdict.refus;
    return out;
  }
  if (verdict.manques.length) {
    if (!out.reason) out.reason = "champ_manquant";
    return out;
  }
  if (out.hold) return out;
  if (!out.reason) out.reason = "carl_ecrit_le_prix";
  out.need_carl = true;
  return out;
}
