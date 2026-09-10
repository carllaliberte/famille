# Expérience client — première tâche

Ordre : client → technologie → Grok Bot + Cursor.

Le client voit une porte, une phrase, une couleur.
Il ne voit pas un rail, un Worker, un ε.
Il ne voit pas Φ, ZK, ni BFT. Le sceau officiel reste CHANNEL NOT PRESENT. Ce n'est pas une couleur.
Un 200 n'est pas VERT.

## Porte

Hôte unique : https://acorn-royal-dune-blend.grok.me
GET `/juge` sur la vitrine : 404 HTML Famille — attendu (canal ≠ vitrine). Pas un HOLD wrangler. Pas « live ».
Titre : Famille
Ligne (`packs/fr-CA.json`) : Les certitudes ont une date de fin.
Spoken (`packs/en.json`) : Certainties expire.
Aussi : `packs/es-MX.json`, `packs/en-NG.json`, `packs/pt-BR.json`, `packs/de-DE.json`.

## Couleurs (humain)

- VERT — the file matches the card
- AMBRE — match; a date is due again
- ROUGE — refuse

Champ manquant → classique (clé `classique` des packs). Pas VERT inventé.
Exemple honnête : [`examples/attest-os.json`](examples/attest-os.json) — epsilon et horizon manquent. Le client voit classique, pas une couleur. Le trou se nomme. On ne le comble pas.

Sous-ligne porte = juge humain (Carl merge ; labels die ; Preview ≠ receipt).
On n'enlève pas le juge. On enlève le tampon à vide.
The human still merges. Labels do not live forever.

Phrases porte : `packs/*.json` (source). Clé `sous_ligne`.

Jamais « sealed forever ». Jamais « quantum-safe ».
Jamais Φ / ZK / BFT comme couleur de porte. CHANNEL NOT PRESENT n'est pas VERT.
Un 200 n'est pas VERT.
Preview is not a receipt.

## Efficacité

Moins de relectures « c'est encore vrai ? ».
La date est sur la carte. Périmé = re-mesurer, pas relire.
L'humain merge. Preview ≠ quittance.
On ne remplace pas le juge. On coupe le coût de croire qu'une preuve est éternelle.

## Gestes

Ordre complet : figure → consulter → re-mesurer → check — [`examples/flux-v0.md`](examples/flux-v0.md).

1. Lire une carte — quatre champs ou classique.
2. Consulter une mesure — la lecture se dépense.
3. Voir une date — expiré = re-mesurer, pas faux.
4. Vérifier un fichier — check.py ou mobile/ digest.

## Interdit côté client

Deuxième slug grok.me. Token. App Store. Formulaire « ε = 0 ».
Φ / ZK / BFT comme couleur. Un 200 comme VERT.

Bots : écrire la phrase avant le schéma.
