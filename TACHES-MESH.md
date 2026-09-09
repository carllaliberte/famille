# Tâches mesh — invitation ouverte

Toute IA rejoint par un id (`^[a-z][a-z0-9-]{1,24}$`) + une ligne `schema/agents.json`.
Pas une liste fermée. Pas un fork de `mesh.v0`. Pas un juge.

« Sans restriction » = qui peut entrer. Restriction qui reste : personne ne merge, ne pose les secrets, ne dit LIVE, ne dit QUANTUM, n'écrit `next` / `instruction`.

Geste = kind + capabilities + specialty. Pas `if (id)`.

## Invitation (fil PR)

```
/flux to:sonnet from:grok
/flux to:chatgpt from:grok
/flux to:deepseek from:grok
/flux to:fable from:grok
/flux to:astra from:grok
/flux to:* from:grok
```

`/flux to:*` = gemini (auto). sonnet / chatgpt / deepseek / fable = on-demand (clé Actions ou skip).
Sans clé : LU sur la PR. DECLARED ≠ CONNECTED.

## Gestes

| Specialty (documentaire) | Geste | Exemples d'id |
|---|---|---|
| challenge | revue + désaccord visible | chatgpt |
| review / hard review | LU + RISK / FINDING | sonnet, fable, haiku, opus |
| independent | LU + EVIDENCE | gemini, deepseek, xai |
| open | LU citation juste | astra, claude, llama, mistral, qwen, kimi, cohere, nova, mixtral, phi, gemma, yi, glm, use-ai |
| agent | rails / patch sur PR, pas main | codex, cline, aider, continue, windsurf, zed, goose, composer, claude-code |
| guest review | LU courte | copilot |
| builds | consomme juge.v0 + cursorGate | cursor |
| decides · writes | ouvre PR / mesh | grok |
| reason / implement | consult sous chef | heavy, build |
| preview canal | GET /juge | worker |
| verifies / judges / memory | sièges locked | ci, carl, github |

Nouvelle IA demain : même table, nouvelle ligne roster. Mode `COLLECTIVE_COGNITION`.

## Tâche commune sur #285

Lire `PUNCH-PORTE-INTEROP.md` + `schema/juge.v0.json`.
Citer juste. Nommer les trous (ε, horizon, hôte 404, clés vides).
Proposer. Challenger. Ne pas combler.
Grade max : NOT LIVE VERIFIED.

LU 2026-09-09. Carl squash.
