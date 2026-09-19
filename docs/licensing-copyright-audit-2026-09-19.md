# Licensing / copyright audit — 2026-09-19

Documentary trace only. Not a legal opinion. Not a licence change.

## 1. SHA exact de main audité

`f60a8d99c21e8a0a3f75a6e5d01f934d1ea32d99`

```bash
git rev-parse HEAD
# f60a8d99c21e8a0a3f75a6e5d01f934d1ea32d99
git log -1 --format='%H %ci %s'
# f60a8d99c21e8a0a3f75a6e5d01f934d1ea32d99 2026-09-19 01:19:40 -0400 Merge pull request #1062 from carllaliberte/grok/cortex-state-memory-fabric-20260919
```

GitHub default branch: `main`. GitHub API `license.spdx_id`: `MIT`.

Inspection started on `c92ca8135f23320eab7a94b867584c7a270fe894`, then `8b753f882edf5a5398306f952d3a1a25e0ca803e`. `main` moved during the audit. Licensing files (`LICENSE`, `COPYRIGHT.md`, `NOTICE`, `NOTICE.md`, `LICENSE.option-*`, `SCHEMAS_NOTICE.md`, `README.md` footer, `schema/juge.v0.json`, `schema/flux.v0.json`, `.github/swarm/system-breaker.mjs`) had empty `git diff` against `f60a8d9`. The write started only after that re-base.

## 2. Date / heure de l’audit

2026-09-19T05:12:59Z (UTC) = 2026-09-19T01:12:59-04:00 (America/Toronto).

```bash
date -u +'%Y-%m-%dT%H:%M:%SZ'
```

## 3. Fichiers inspectés

| Chemin | Rôle |
|---|---|
| `LICENSE` | grant actif |
| `LICENSE.option-open` | candidat MIT, pas le grant actif |
| `LICENSE.option-closed` | candidat ARR, pas le grant actif |
| `COPYRIGHT.md` | régimes documentaires |
| `NOTICE` | marques + portée du MIT |
| `NOTICE.md` | provenance de production, pas une position juridique |
| `SCHEMAS_NOTICE.md` | copyright des JSON sans en-tête |
| `README.md` | footer licence |
| `COPYRIGHT.md` / `PHILOSOPHIE.md` / `INTERNATIONAL.md` / `FILE.md` | mentions Acorn / UNFORGE / MIT |
| `docs/intellectual-property-and-public-repository.md` | stratégie IP déclarée |
| `KEM.md` `REVUE.md` `EVAL.md` `unforge-check/OTS.md` | en-têtes mécaniques |
| `unforge-check/PLAGIAT-WATCH.md` | docs unforge in-tree |
| `package.json` `package-lock.json` | dépendances déclarées |
| `test/copyright.test.js` `test/acorn-future-proof-operational.test.js` | assertions déjà présentes |
| `schema/juge.v0.json` `schema/flux.v0.json` | contrats d’autorité (lus, non modifiés) |
| `.github/swarm/system-breaker.mjs` | Breaker (lu, non modifié) |
| `scripts/acorn-usage-rights.mjs` | module de droits commerciaux in-tree |
| échantillon `scripts/acorn-*.mjs`, `.acorn/*.json`, fichiers ajoutés depuis `c92ca81` | nouveaux fichiers Acorn-named |

Recherches reproduites :

```bash
git ls-files | wc -l
# 1299
git ls-files | grep -ci acorn
# 556
git ls-files 'scripts/acorn-*' | wc -l
# 195
git ls-files '.acorn/*' | wc -l
# 25
git grep -l 'Copyright (c) 2026 Carl Laliberté'
# 9 files: EVAL.md KEM.md LICENSE LICENSE.option-closed LICENSE.option-open
#          REVUE.md SCHEMAS_NOTICE.md test/copyright.test.js unforge-check/OTS.md
git grep -n 'SPDX-License-Identifier'
# (aucune ligne)
ls COPYING
# no COPYING
```

## 4. Licences réellement trouvées

| Texte | Où | Observation physique |
|---|---|---|
| MIT License | `LICENSE` lignes 1–21 | Grant actif. « Permission is hereby granted… ». Copyright (c) 2026 Carl Laliberté. |
| MIT License | `LICENSE.option-open` | Même famille de texte. Pas `LICENSE`. |
| All rights reserved / Tous droits réservés | `LICENSE.option-closed` lignes 1–4, 9–15 | Candidat. Lignes 13–15 : « it is not the active LICENSE file ». |
| MIT (GitHub API) | dépôt `carllaliberte/famille` | `license.spdx_id = MIT` |
| Apache-2.0 (GitHub API, *hors* ce tree) | siblings `unforge-check`, `unforge-press`, `unforge-trail`, `unforge-retract`, `filon-spec` | Pas vendored ici. |
| Other / NOASSERTION (GitHub API, *hors* ce tree) | `carllaliberte/acorn` (privé), `carllaliberte/unforge` (privé), `carllaliberte/filon-noeud` (privé) | Pas ce tree. |
| MIT / ISC | lockfile + fichiers LICENSE des paquets npm après `npm ci --ignore-scripts` | Voir §6. |
| GPL, LGPL, AGPL, MPL, CC, BSD (hors ISC des deps) | recherches `git grep` sur le tree | Aucun grant GPL/LGPL/Apache/BSD/CC **dans** ce dépôt. |

`package.json` n’a **pas** de champ `"license"`. Champ `"private": true` (empêche `npm publish` ; ce n’est pas un grant de copyright).

Preuve `LICENSE` :

```bash
sed -n '1,5p' LICENSE
# MIT License
#
# Copyright (c) 2026 Carl Laliberté
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
```

## 5. Copyright réellement trouvé

- Titulaire nommé partout où un copyright est écrit : Carl Laliberté, 2026. `NOTICE` ajoute « Québec ».
- En-têtes mécaniques (HTML comment) sur `REVUE.md`, `KEM.md`, `EVAL.md`, `unforge-check/OTS.md` :

```
<!-- Copyright (c) 2026 Carl Laliberté. Tous droits réservés sauf mention contraire dans LICENSE. -->
<!-- En-tête mécanique. Pas un choix de licence. -->
```

- `SCHEMAS_NOTICE.md` lignes 3–4 : « Tous droits réservés sauf mention contraire dans LICENSE. » Les JSON `schema/*.json` n’ont pas d’en-tête (ils commencent par `{`).
- 1278 fichiers tracked hors les 9 listés ci-dessus n’ont pas la chaîne `Copyright (c) 2026 Carl Laliberté`. Absence d’en-tête ≠ absence de copyright (constat d’inspection, pas un grant).
- `scripts/acorn-usage-rights.mjs` lignes 1–4 décrit un régime *commercial* de droits vendus (`USAGE_RIGHTS_VERSION = "acorn.usage-rights.v1"`). Ce n’est pas le `LICENSE` du dépôt.

Marques **déclarées** dans `NOTICE` lignes 4–7 : FAMILLE, Acorn, UNFORGE. Aucun numéro d’enregistrement dans ce tree.

## 6. Dépendances vérifiées

Déclarées : `package.json` + `package-lock.json` lockfileVersion 3. Après `npm ci --ignore-scripts` (15 paquets).

| dépendance | version lockfile | source | licence observée | preuve | risque |
|---|---|---|---|---|---|
| husky | 9.1.7 | npm `husky-9.1.7.tgz` | MIT | `node_modules/husky/LICENSE` « MIT License / Copyright (c) 2021 typicode » ; lockfile `"license": "MIT"` | attribution MIT si redistribution du paquet |
| pg | 8.23.0 | npm `pg-8.23.0.tgz` | MIT | `node_modules/pg/LICENSE` « MIT License / Copyright (c) 2010 - 2021 Brian Carlson » | idem |
| pg-cloudflare | 1.4.0 | npm (optional) | MIT | `node_modules/pg-cloudflare/LICENSE` | idem |
| pg-connection-string | 2.14.0 | npm | MIT | `node_modules/pg-connection-string/LICENSE` | idem |
| pg-pool | 3.14.0 | npm | MIT | `node_modules/pg-pool/LICENSE` | idem |
| pg-protocol | 1.16.0 | npm | MIT | `node_modules/pg-protocol/LICENSE` | idem |
| pg-types | 2.2.0 | npm | MIT **déclaré** ; fichier LICENSE **absent du tarball** | lockfile + `node_modules/pg-types/package.json` `"license":"MIT"` ; `ls node_modules/pg-types` : pas de LICENSE | UNKNOWN sur le texte LICENSE du paquet |
| pgpass | 1.0.5 | npm | MIT **déclaré** ; fichier LICENSE **absent du tarball** | lockfile + `node_modules/pgpass/package.json` `"license":"MIT"` ; pas de LICENSE | UNKNOWN sur le texte LICENSE du paquet |
| pg-int8 | 1.0.1 | npm | ISC (texte lu) | `node_modules/pg-int8/LICENSE` « Permission to use, copy, modify, and/or distribute… without fee » | attribution ISC |
| split2 | 4.2.0 | npm | ISC (texte lu) | `node_modules/split2/LICENSE` Matteo Collina | attribution ISC |
| postgres-array | 2.0.0 | npm | MIT | `node_modules/postgres-array/license` Ben Drucker | idem |
| postgres-bytea | 1.0.1 | npm | MIT | `node_modules/postgres-bytea/license` | idem |
| postgres-date | 1.0.7 | npm | MIT | `node_modules/postgres-date/license` | idem |
| postgres-interval | 1.2.0 | npm | MIT | `node_modules/postgres-interval/license` | idem |
| xtend | 4.0.2 | npm | MIT | `node_modules/xtend/LICENSE` Raynos | idem |

Aucun GPL/AGPL/LGPL dans les LICENSE lus. ISC n’est pas contradictoire avec le texte MIT du dépôt (constat de textes lus, pas un avis de compatibilité).

Hors `package.json` (non modifié, non inventorié comme dépendance déclarée) :

- CI `pip install opentimestamps-client` (`.github/workflows/ots-upgrade.yml` ligne 29) — licence du sdist **UNKNOWN**.
- Actions `actions/checkout@v4`, `actions/setup-node@v4`, `actions/setup-python@v5`, `actions/upload-artifact@v4` — licence **UNKNOWN** (pas de copie dans ce tree).

## 7. Nouveaux fichiers vérifiés

Delta `c92ca8135f23320eab7a94b867584c7a270fe894..f60a8d99c21e8a0a3f75a6e5d01f934d1ea32d99` (main a avancé pendant l’audit) — 20 fichiers, tous Acorn-named, aucun grant in-file :

```
A .github/workflows/acorn-cortex-action-outcome-fabric.yml
A .github/workflows/acorn-cortex-intelligence-adapter.yml
A .github/workflows/acorn-cortex-capability-composition.yml
A .github/workflows/acorn-cortex-mission-conductor.yml
A docs/acorn-cortex-action-outcome-fabric.md
A docs/acorn-cortex-intelligence-adapter.md
A docs/acorn-cortex-capability-composition.md
A docs/acorn-cortex-mission-conductor.md
A scripts/acorn-cortex-action-outcome-fabric.mjs
A scripts/acorn-cortex-intelligence-adapter.mjs
A scripts/acorn-cortex-capability-composition.mjs
A scripts/acorn-cortex-mission-conductor.mjs
A test/acorn-cortex-action-outcome-fabric.test.js
A test/acorn-cortex-intelligence-adapter.test.js
A test/acorn-cortex-capability-composition.test.js
A test/acorn-cortex-mission-conductor.test.js
A .github/workflows/acorn-cortex-state-memory-fabric.yml
A docs/acorn-cortex-state-memory-fabric.md
A scripts/acorn-cortex-state-memory-fabric.mjs
A test/acorn-cortex-state-memory-fabric.test.js
```

`grep -iE 'license|copyright|MIT |GPL|Apache|proprietary|all rights'` sur ces fichiers : vide.

`scripts/acorn-cortex-intelligence-adapter.mjs` ligne 1 : `/** ACORN — CORTEX INTELLIGENCE ADAPTER / CAPABILITY ROUTER */` — nom Acorn, pas de grant.

Le tree contient déjà 195 `scripts/acorn-*` et 25 `.acorn/*` sur le même régime : pas d’en-tête, pas de LICENSE secondaire.

Pas d’ajout mécanique d’en-têtes (geste §5 : seulement ce qui est justifié par une preuve).

`LICENSE` existe depuis `eb7e72577562f814e3f001a33c65a8c6f7f1a270` (2026-08-31, « Add INTERDIT and LICENSE to the cadastre »). Les options `LICENSE.option-*` depuis `5493d65` (famille#222).

## 8. Contradictions

Uniquement ce qui est démontré par des fichiers.

### C1 — Acorn nommé ARR alors que des fichiers Acorn-named sont dans le tree MIT

- `LICENSE` lignes 1–10 : MIT sur « this software and associated documentation files ».
- `git ls-files | grep -ci acorn` → 556 chemins dans **ce** dépôt.
- Aucun `LICENSE-ACORN`, aucun `SPDX-License-Identifier`.
- `PHILOSOPHIE.md` ligne 3 : « L’œuvre Acorn reste All Rights Reserved. » (sans pointer `carllaliberte/acorn`).
- `docs/intellectual-property-and-public-repository.md` lignes 6–8 : « Keep Acorn source under a proprietary, explicit license… Mark protected modules as Acorn proprietary. »
- `COPYRIGHT.md` *avant correction* ligne 9 : « ARR private (acorn, unforge, filon-noeud) / MIT map (famille) » — le mot `acorn` n’y distingue pas le dépôt privé des 556 chemins locaux.

Lecture possible : l’œuvre Acorn est ARR **et** les fichiers `scripts/acorn-*.mjs` de ce tree. Le grant MIT du `LICENSE` n’a pas d’exception fichier.

### C2 — UNFORGE Apache-2.0 dans INTERNATIONAL.md vs docs unforge in-tree sous LICENSE

- `INTERNATIONAL.md` ligne 27 : « Acorn All Rights Reserved. Rails MIT. UNFORGE Apache-2.0 + marque. »
- In-tree : seulement `unforge-check/OTS.md` et `unforge-check/PLAGIAT-WATCH.md`. `OTS.md` lignes 1–2 deferent à `LICENSE` (MIT). Pas de texte Apache-2.0 dans ce tree.
- Sibling public `carllaliberte/unforge-check` : GitHub `licenseInfo.key = apache-2.0` (hors tree).

### C3 — Stratégie IP vs grant déjà émis

- `docs/intellectual-property-and-public-repository.md` ligne 6 veut une licence propriétaire pour le source Acorn.
- Ligne 13 du même fichier : « Where a previous version was MIT-licensed, recognize that license grants cannot simply be retroactively revoked for copies already distributed under it. »
- `LICENSE` MIT est public sur GitHub depuis au moins `eb7e725` (2026-08-31).

Le document IP enregistre lui-même qu’un MIT déjà publié ne se révoque pas rétroactivement. Ce chantier ne révoque pas `LICENSE`.

### Non-contradictions relevées (pour ne pas les inventer)

- `NOTICE.md` lignes 32–36 : les options ne sont pas renommées en `LICENSE` ; `LICENSE` déjà présent n’est pas modifié par cette mécanique. Cohérent avec `test/copyright.test.js`.
- `SCHEMAS_NOTICE.md` « Tous droits réservés sauf mention contraire dans LICENSE » + `LICENSE` MIT : le « sauf » pointe vers MIT.
- `package.json` `"private": true` : champ npm, pas un second grant.
- `LICENSE.option-closed` lignes 13–15 se décrit comme non actif.

## 9. Risques

1. Un lecteur de `PHILOSOPHIE.md` / du doc IP peut croire que `scripts/acorn-*.mjs` de **famille** n’est pas couvert par `LICENSE`.
2. `LICENSE.option-closed` (ARR) cohabite avec `LICENSE` (MIT) à la racine — risque de lecture, même si le fichier dit n’être pas actif.
3. `package.json` sans `"license"` : GitHub détecte MIT via `LICENSE`, npm ne l’expose pas.
4. `pg-types` et `pgpass` : MIT déclaré, pas de fichier LICENSE dans le tarball.
5. Marques déclarées dans `NOTICE` sans preuve d’enregistrement dans ce tree.
6. `scripts/acorn-usage-rights.mjs` parle de droits vendus alors que le fichier vit sous `LICENSE` MIT — confusion produit vs grant du dépôt.
7. CI `opentimestamps-client` et GitHub Actions : licences non lues ici.

## 10. Corrections effectuées

Autorisées : `LICENSE` (inchangé), `NOTICE`, `COPYRIGHT.md`, `README.md`, en-têtes concernés (aucun ajout mécanique), ce fichier, un test documentaire.

| Fichier | Geste |
|---|---|
| `LICENSE` | NONE — MIT inchangé |
| `COPYRIGHT.md` | Portée explicite : fichiers de **ce** tree suivent `LICENSE` ; ARR Acorn = dépôt privé `carllaliberte/acorn` ; options ≠ grant actif ; « This file does not revoke LICENSE. » Retrait du regroupement « ARR private (acorn, …) » qui mélangeait le tree local. |
| `NOTICE` | Deux phrases : fichiers physiques de ce repository, y compris noms Acorn, sont under LICENSE ; NOTICE ne révoque pas le MIT. Marques inchangées (tests existants). |
| `README.md` | Une phrase : chemins `*acorn*` de ce tree suivent LICENSE ; l’œuvre distincte est `carllaliberte/acorn`. |
| `docs/licensing-copyright-audit-2026-09-19.md` | cette trace |
| `test/licensing-copyright-boundary.test.js` | lock documentaire contre une future phrase qui révoquerait MIT ou re-mélangerait ARR in-tree |

Non touchés : Breaker, `schema/juge.v0.json`, `schema/flux.v0.json`, runtime, dépendances, `PHILOSOPHIE.md`, `INTERNATIONAL.md`, `docs/intellectual-property-and-public-repository.md`, `NOTICE.md`, `package.json`.

Hashes *avant* correction (reproduit sur `f60a8d9`, identiques depuis `8b753f88`) :

```
79f89896af7840047ff8bea0ba06540cdb3f052abaed43f9012a2c710c57ccfd  LICENSE
9861103d3fdc00de6e1375d59ea1f6e98e4bab9932dcc664a24aeb45f273357a  schema/juge.v0.json
42a74d86dc7f88098dc3591f8ed313a341ad957376cc1fed2e5975773c5147c8  schema/flux.v0.json
f2edcdf8b1794c3665b431bc355370a8dc3417a3d7ce880f3cd780e263d8f26a  .github/swarm/system-breaker.mjs
```

`LICENSE` et les trois fichiers d’autorité/Breaker restent ces hashes après correction.

## 11. UNKNOWN

- Licence **fichier** de `pg-types@2.2.0` et `pgpass@1.0.5` (déclaré MIT, tarball sans LICENSE).
- Licence de `opentimestamps-client` (CI pip) et des GitHub Actions utilisées.
- Enregistrement (numéro, classe, office) des marques FAMILLE / Acorn / UNFORGE.
- Contenu et grant exacts de `carllaliberte/acorn`, `carllaliberte/unforge`, `carllaliberte/filon-noeud` (privés ; GitHub `licenseInfo.key = other`). La *description* GitHub de `acorn` contient « All Rights Reserved » ; celle de `filon-noeud` ne la contient pas.
- Premier SHA historique de chaque fichier Acorn-named au-delà de la fenêtre git approfondie (LICENSE depuis `eb7e725` est daté ; le delta complet « depuis #222 » n’est pas reconstitué fichier par fichier).
- Provenance tierce (copie d’un projet externe identifiable) : aucune chaîne `Portions copyright` / `originally from` n’a été extraite de façon exhaustive sur 1299 fichiers ; échantillons lus : négatif. Reste UNKNOWN pour le tree entier.

## 12. HOLD_HUMAN

Décisions que ce chantier ne peut pas prendre à la place de Carl :

1. **Déplacer ou excepter** les 556 chemins Acorn-named hors du grant MIT (`LICENSE-ACORN`, SPDX fichier, extraction vers `carllaliberte/acorn`). Ce serait un changement de licence ou d’architecture — interdit ici sans instruction humaine.
2. **Éditer** `PHILOSOPHIE.md`, `INTERNATIONAL.md`, `docs/intellectual-property-and-public-repository.md` (hors liste des fichiers autorisés) pour les aligner sur la portée clarifiée.
3. **Supprimer ou archiver** `LICENSE.option-closed` (réduction de confusion vs conservation du candidat ARR).
4. **Ajouter** `"license": "MIT"` dans `package.json` (hors liste autorisée ; `private: true` resterait un choix npm).
5. **Choisir** un grant distinct pour `schema/juge.v0.json` / `schema/flux.v0.json` autre que `LICENSE`.
6. **Produire** des preuves d’enregistrement de marques.
7. **Trancher** le régime de `filon-noeud` / `unforge` privés (`licenseInfo = other`).
8. **Décider** si le module `acorn-usage-rights.mjs` doit rester un code MIT de carte ou devenir un contrat hors Git.

Sans ces actes, le grant public de `LICENSE` reste MIT ; NOTICE / COPYRIGHT ne le révoquent pas.

## 13. Conclusion (descriptive)

Sur `f60a8d99c21e8a0a3f75a6e5d01f934d1ea32d99`, le grant **actif** du dépôt public `carllaliberte/famille` est le texte MIT de `LICENSE`. Les marques sont réservées par `NOTICE`. L’œuvre Acorn **nommée** comme All Rights Reserved est le dépôt **privé** `carllaliberte/acorn` (description GitHub), pas un second LICENSE dans ce tree.

Des textes (`PHILOSOPHIE.md`, doc IP, `INTERNATIONAL.md`) parlent encore d’Acorn ARR / UNFORGE Apache-2.0 sans borner le propos à ces autres dépôts. 556 chemins Acorn-named vivent ici, sans exception SPDX. Ce chantier clarifie `COPYRIGHT.md`, `NOTICE` et `README.md` pour dire cette portée. Il ne transforme pas le dépôt en régime fermé. Il ne supprime pas MIT. Les décisions de carve-out restent HOLD_HUMAN.

Reproduire :

```bash
git rev-parse HEAD
sed -n '1,4p' LICENSE
sed -n '1,30p' COPYRIGHT.md
sed -n '1,16p' NOTICE
node --test test/copyright.test.js test/licensing-copyright-boundary.test.js test/degraisse-racine.test.js test/acorn-future-proof-operational.test.js
sha256sum LICENSE schema/juge.v0.json schema/flux.v0.json .github/swarm/system-breaker.mjs
```
