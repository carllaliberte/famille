# Actes vendables

Les certitudes ont une date de fin.

Un acte = un dossier nommé + une date + une carte. Pas un abonnement token.
Prix : Carl les écrit. Les bots n'inventent pas.

Champ juge manquant (`quelle` · `temoin` · `epsilon` · `horizon`) → MODE classique.
Ce n'est pas un acte à quatre cartes. On nomme le trou. On ne le comble pas.
On n'invente pas le prix. Preview ≠ quittance. Un 200 n'est pas un sceau.

Rail : [`sdk/acte.js`](sdk/acte.js) `quoteActe` — `price` reste null. Quatre champs présents → Carl écrit le prix. Champ manquant → classique. GET `/juge` 404 → HOLD Carl. Un 200 n'est pas une facture.

Exemple honnête : [`examples/attest-os.json`](examples/attest-os.json) — epsilon + horizon manquent → classique.

Hôte : https://acorn-royal-dune-blend.grok.me — GET `/juge` 404 = HOLD Carl, pas un produit.

Un finding `detect.v0` reste PROPOSED (`truth` false, `normative` false). Ce n'est pas un acte. Ce n'est pas une facture.

| Acte | Rails | Livrable client |
|---|---|---|
| Crédits photo | FIGURE QUELLE UNFORGE | carte + check VERT/ROUGE |
| Kit presse | FIGURE MESURE UNFORGE | embargo consommable |
| Garantie / billet | HORIZON ANCRAGE RECU | date due = re-press |
| Minute / lot QC | DOSSIER SITUS FIGURE | registre.json |
| Bail TAL | SITUS FIGURE HORIZON | silence à l'échéance |
| Retrait Loi 25 | unforge-retract | retrait signé, historique restant |
| Audit CI | unforge-check | badge + phrase humaine |

International : même acte, pack BCP 47 — fr-CA, en / en-CA, es-MX, en-NG, pt-BR, de-DE.
Paiement : hors Git (Interac, facture). Jamais un coin Famille.
