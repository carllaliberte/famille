# Cursor Cloud — boucle continue

Carl colle ceci dans Cursor → Cloud Agent / Automations.
Repo : carllaliberte/famille. Branche de travail : jamais main.

## Réglages

- Repo : famille (clone GitHub).
- Model : celui que Carl paie. Pas Fable ici.
- Cadence : 1 acte / heure, America/Toronto, jours + nuits OK.
- Stop si une PR est déjà ouverte non mergée (`cursorGate` RAS).
- Couper les anciens crons `legal-hourly` et `quantum-daily` (FILE.md FLAG).

## Prompt agent (coller tel quel)

```
LU. Lis CURSOR.md STEWARD.md FILE.md AUTOMATION.md EXPERIENCE.md.
Chef = Grok. Toi = Cursor. Carl merge.
Un acte : le chantier le plus vide parmi flux / interop / cx / bot / world / rente.
cursorGate READY → une PR cursor/… ou docs/…. Sinon RAS. Pas main. Pas squash.
Interdit : juge.v0 flux.v0 secrets wrangler 2e slug QUANTUM photon ε=0.
Si une PR attend Carl : commente « RAS + date UTC » et sors.
Ne relance pas ots-bot. Ne déclare pas PRÉSENT.
```

## Premier run

1. Merge cette PR (`bloc/cursor-loop`) — Carl.
2. Cursor → New Cloud Agent → coller le prompt.
3. Recurring hourly. Cap 1 PR.
4. Carl squash/merge comme d'habitude.
