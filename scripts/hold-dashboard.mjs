#!/usr/bin/env node
/**
 * Pas un dashboard LIVE.
 * Affiche ce qu'on a le droit de dire sans mesurer un run GitHub.
 */
const lines = [
  "ACORN — état dicible",
  "",
  "LIVE = NON  (aucune mesure de run collée ici)",
  "PRODUCTION = NON  (Carl n'a pas scellé)",
  "",
  "Pouls accepté : MODEL + HTTP + REAL_RESPONSE sur un workflow_dispatch.",
  "Pouls refusé : heartbeat SQLite, entropy aléatoire, hash de décor.",
  "",
  "Fichiers qui comptent :",
  "  .github/swarm/review.mjs",
  "  sdk/peut-dire.js",
  "  docs/git.md  docs/husky.md  docs/live.md",
  "",
  "HOLD. Relire main. Puis un vrai dispatch. Puis comparer.",
];
process.stdout.write(lines.join("\n") + "\n");
