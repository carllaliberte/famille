# Work record — pas un 7e chantier

Un cycle de code/correction produit un record daté.

`CODE ≠ TESTÉ ≠ EXÉCUTÉ ≠ MESURÉ ≠ VÉRIFIÉ ≠ LIVE`

LIVE exige `scripts/live-proof.mjs` → `LIVE_VERIFIED`. Un drapeau ne suffit pas.

Outil manquant → le nommer → le construire → le tester → le garder → le réutiliser.
Jamais « je ne peux pas » sans `BUILD_TOOL` ou `HOLD_HUMAN`.

```bash
node scripts/work-record.mjs
```

Carl merge. `auto_merge=false`.

## 2026-09-16 — worker compact prompt hook

Branch `fix/worker-compact-prompt-hook`: `codex-autonomous-worker.mjs` must import `taskPrompt`/`continuityBrief` from `scripts/codex-task-prompt.mjs`. No second local constructor.
