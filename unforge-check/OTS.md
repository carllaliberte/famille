<!-- Copyright (c) 2026 Carl Laliberté. Tous droits réservés sauf mention contraire dans LICENSE. -->
<!-- En-tête mécanique. Pas un choix de licence. -->

# OTS v0 — ancrage OpenTimestamps

<!-- ots-status:start -->

## État des preuves

Dernière vérification : *(en attente du prochain cron `ots-upgrade`)*

| SHA | Fichier | État | Vérifié |
|---|---|---|---|
| `24ff0629784dae52d7d84e47881754899fc1ced3` | `.ots-anchor/24ff0629784dae52d7d84e47881754899fc1ced3.sha.ots` | pending | — |
| `fbfea3bc7c13860a6e66a19d50a6c4be0862e17a` | `.ots-anchor/fbfea3bc7c13860a6e66a19d50a6c4be0862e17a.sha.ots` | pending | — |
| `65c5ffe93f90f7def5b97f9392988d6f48e04f5e` | `.ots-anchor/65c5ffe93f90f7def5b97f9392988d6f48e04f5e.sha.ots` | pending | — |
| `3deeda1298e8c468185bad382845374b98cbd355` | `.ots-anchor/3deeda1298e8c468185bad382845374b98cbd355.sha.ots` | pending | — |
| `49b27e145976a80837decf6860d300acb6335202` | `.ots-anchor/49b27e145976a80837decf6860d300acb6335202.sha.ots` | pending | — |

<!-- ots-status:end -->


Rail **séparé**. Preuve d'antériorité, pas un sceau FAMILLE. Pas Check. Pas HORIZON. Pas une 4e carte juge. Pas KEM.

Check (`check.py`) **vérifie** Ed25519 / `UFHY1`. Il ne signe pas. Il n'ancre pas un SHA dans un calendrier.

HORIZON nomme une *hypothèse de sceau* et un jour de calendrier. Ce rail-ci notarie **qu'un SHA a existé** à un moment, indépendamment de GitHub.

Lu : [famille/AUTOMATION.md](https://github.com/carllaliberte/famille/blob/main/AUTOMATION.md), [famille/KEM.md](https://github.com/carllaliberte/famille/blob/main/KEM.md), [opentimestamps-client](https://github.com/opentimestamps/opentimestamps-client).

## Primitive

```
push sur main (après squash Carl)
  + SHA du commit
  + calendriers OTS pinnés dans le YAML
  →  .ots-anchor/<sha>.sha.ots   (pending, puis complete)
```

Sans merge de Carl : rien. Jamais sur une PR ouverte. Jamais sur une branche de travail.

Le stamp initial **n'attend pas** (`ots stamp` sans `--wait`). La preuve est d'abord *pending* (calendrier seul). L'inclusion dans un bloc Bitcoin confirmé peut prendre plusieurs heures. Le cron `ots-upgrade` tente de finaliser.


## Calendriers (pinnés)

La liste est **fixée en dur** dans `.github/workflows/ots-anchor.yml`, versionnée. Un changement de notaire = une PR. Pas une mise à jour silencieuse du client.

Vérifiés joignables (HTTP 200) le 2026-09-08 — GET live + [uptime.opentimestamps.org](https://uptime.opentimestamps.org/) :

- `https://alice.btc.calendar.opentimestamps.org`
- `https://bob.btc.calendar.opentimestamps.org`
- `https://finney.calendar.eternitywall.com`
- `https://btc.calendar.catallaxy.com`

```
ots stamp \
  -c https://alice.btc.calendar.opentimestamps.org \
  -c https://bob.btc.calendar.opentimestamps.org \
  -c https://finney.calendar.eternitywall.com \
  -c https://btc.calendar.catallaxy.com \
  .ots-anchor/<sha>.sha
```

## Pourquoi

GitHub peut réécrire l'affichage d'un historique. Un tiers ne doit pas avoir à croire GitHub pour dire « ce SHA existait à cette date ».

OpenTimestamps soumet le hash du fichier `.sha` (qui contient le SHA du commit) à des calendriers publics gratuits et anonymes. Bitcoin sert de **notaire** : une fois la preuve *complete*, la vérification ne dépend plus de GitHub ni de l'infra de Carl.

Pas un L1 Famille. Pas un mint. Pas un reçu d'argent. Pas une 5e carte.

## Vérifier (tierce partie — sans l'infra de Carl)

Fichiers : `.ots-anchor/latest.sha` (le SHA) et `.ots-anchor/latest.sha.ots` (la preuve). Même paire sous `.ots-anchor/<sha>.sha` + `.ots-anchor/<sha>.sha.ots`.

```bash
pip install opentimestamps-client
ots verify .ots-anchor/latest.sha.ots
```

`ots verify` lit le fichier `.sha` à côté du `.ots`. Rien d'autre à configurer pour un stamp *pending* (les calendriers publics suffisent).

Pour une preuve *complete*, la vérification la plus forte se fait contre un nœud Bitcoin (un nœud élagué suffit) :

```bash
ots --bitcoin-node http://USER:PASS@127.0.0.1:8332/ verify .ots-anchor/latest.sha.ots
```

Sans nœud, le client peut encore afficher l'attestation calendrier / le chemin une fois upgradé ; le nœud Bitcoin reste la source indépendante.

Ce dépôt n'héberge pas de nœud. Un tiers apporte le sien, ou s'en tient aux calendriers le temps que la preuve soit *complete*.

## États

| État | Ce que ça dit | Ce que ça ne dit pas |
|---|---|---|
| *pending* | un calendrier OTS public a reçu le hash | inclusion Bitcoin confirmée |
| *complete* | un bloc Bitcoin atteste l'existence du hash | que le commit est « vrai », signé, ou jugé |

*pending* → *complete* : souvent quelques heures, parfois plus. `ots upgrade` sur le `.ots` récupère le chemin d'inclusion. Le cron quotidien `.github/workflows/ots-upgrade.yml` le tente, puis réécrit le bloc `ots-status` en tête de ce fichier.

Un merge n'est pas une inclusion. Un fichier `.ots` *pending* n'est pas une preuve Bitcoin.

## Workflows (famille)

| Fichier | Déclencheur | Fait |
|---|---|---|
| `.github/workflows/ots-anchor.yml` | `push` vers `main` seulement | écrit le SHA, `ots stamp -c …`, commit `ots-bot` ; échec → issue `ots-anchor-status` |
| `.github/workflows/ots-upgrade.yml` | cron quotidien + `workflow_dispatch` | `ots upgrade` sur chaque `.ots` pending, réécrit `ots-status`, commit si changement |

Identité git : `ots-bot` / `ots-bot@users.noreply.github.com`. Pas le compte de Carl. Message : `ots: anchor <sha>` ou `ots: upgrade`.

Si rien à committer : le job sort 0.


Permission nouvelle, documentée dans [AUTOMATION.md](https://github.com/carllaliberte/famille/blob/main/AUTOMATION.md) avant activation : `issues: write` sur `ots-anchor.yml` seulement (issue `ots-anchor-status`). Jeton = `github.token`.

Aucun secret Actions pour le stamp initial. Les calendriers publics sont gratuits et anonymes.

## Rétention

`.ots-anchor/` accumule un fichier par SHA mergé sur `main`, sans purge automatique — c'est intentionnel. Chaque fichier est une preuve d'antériorité. Taux de croissance attendu : 1 fichier `.ots` par merge (plus le `.sha` correspondant ; `latest.sha` / `latest.sha.ots` sont des pointeurs, pas une deuxième preuve). Ce n'est pas un « problème » à redécouvrir plus tard.

## Verrous

- Jamais sur `pull_request`. Jamais sur une branche de travail.
- Jamais avant le squash de Carl. Le workflow n'existe sur `main` qu'après squash explicite — c'est l'activation.
- `ots-bot` n'est pas un bot FAMILLE. Un bot = un rail. Ici le rail est OpenTimestamps, notaire externe.
- Pas fusionné dans `juge.v0.json` ni `flux.v0.json`. Pas une 5e carte. Pas une clé juge.
- Pas câblé dans `check.py`. Check ne lit pas `.ots`.
- Pas une activation PQC. UFHY1 reste signatures.
- Pas un L1, pas un mint, pas un avis juridique.
- Exception mécanique au « Carl squash / jamais push main » : documentée dans [AUTOMATION.md](https://github.com/carllaliberte/famille/blob/main/AUTOMATION.md). Carl lève cette exception en squashant la PR qui l'introduit.

## Limites (honnêtes)

- Tant que la preuve est *pending*, il reste une **dépendance aux calendriers publics OTS**. Si un calendrier disparaît avant l'`upgrade`, ce stamp-là peut rester incomplet.
- La disponibilité d'un calendrier n'est **pas garantie à vie**. Mitigation : le cron `ots-upgrade` vise à finaliser vite (heures, pas années). Les notaires sont pinnés dans le YAML pour qu'un remplacement soit une PR.
- Une preuve *complete* se vérifie contre Bitcoin. Elle ne dit pas qui a écrit le commit, ni que le juge FAMILLE a permis quoi que ce soit.
- GitHub Actions doit pouvoir pousser sur `main` (identité `ots-bot` via `GITHUB_TOKEN`). Si `main` est protégée, Carl autorise `github-actions[bot]` à pousser. Ce n'est pas un secret dans le dépôt. Le bypass est une **identité**, pas un chemin — inventaire dans [AUTOMATION.md](https://github.com/carllaliberte/famille/blob/main/AUTOMATION.md).
- `GITHUB_TOKEN` ne relance pas les workflows sur son propre push — pas de boucle. Garde supplémentaire : `paths-ignore: .ots-anchor/**` et skip des messages `ots:`.

## Vérifié vs présumé

| Affirmation | Statut |
|---|---|
| le workflow stamp n'écoute pas `pull_request` | **vérifié** (YAML) |
| pas de secret Actions pour `ots stamp` | **vérifié** (YAML) |
| `ots stamp` sans `--wait` | **vérifié** (YAML) |
| calendriers pinnés en dur dans le YAML | **vérifié** (YAML, GET 200 le 2026-09-08) |
| identité `ots-bot`, message `ots: anchor <sha>` | **vérifié** (YAML) |
| job vert s'il n'y a rien à committer | **vérifié** (YAML) |
| échec de stamp → issue `ots-anchor-status` | **vérifié** (YAML) |
| `juge.v0` / `flux.v0` intouchés | **vérifié** |
| calendriers OTS publics restent joignables | **présumé** (tiers, pas ce dépôt) |
| une preuve *complete* est opposable sans GitHub | **présumé** (protocole OTS + Bitcoin, pas un théorème de ce dépôt) |
| délai d'inclusion | **présumé** (heures, variable) |

Rien ici n'est un sceau. Un merge n'est pas une inclusion Bitcoin.
