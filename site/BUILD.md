# BUILD — publier sans inventer d’hôte

Carte citée : https://acorn-royal-dune-blend.grok.me
Remix en cours : https://yarrow-dawn-maple-brave.grok.me
Ne pas citer : https://cedar-tango-coral-arch.grok.me

## Prompt — attestation publique

```
Remix this Famille app. Same host. Do not create a new grok.me.
Do not rebuild the carte canvas. Do not publish QUANTUM.

Keep chrome exactly:
- title Famille · tagline the map — not a rail
- background #0a0a0a, brushed gold, grain, Cormorant italic
- NOT neon, NOT crypto-green UI, NOT Discovery branding
- green only as a verdict chip on allow — never the theme
- three acts Inscrire · Juger · Exporter registre.json
- QUANTUM — kernel that signs — off Git — not this host
- Unforge checks, never signs
- cents ≤ 0 deny · ε = 0 deny · not a chain, not consensus, not money

Add nav: Attester · Docs · Public
Routes: #/attest #/docs #/public

#/attest — public attestation preview
Left: form POST /attest body
  source:  os | qrng | qkd
  witness: aucun | stat | fabricant | di
  epsilon: none | asymptotic | iid | composable
  horizon: ed25519 | UFHY1 | mldsa87
  until:   date
Button « Attester » runs the SAME juge as Juger.
Right: JSON response + inline SVG badge.

Contract:
POST /attest  (same-origin mock is fine; no new backend host)
Request {source, witness, epsilon, horizon, until}
Response {
  mode, verdict: allow|deny,
  epsilon, horizon,
  sig: "preview",
  why: "host does not sign. QUANTUM off Git.",
  badge: data-url svg
}
Hard deny if epsilon missing or 0.
Hard deny if any cents field > 0.
Quantum mode only if QUELLE + TÉMOIN + EPSILON + HORIZON all hold;
otherwise classique. S = 2.420 only as Hensen 2015 named reference.

Badge SVG 140×20:
  famille | preview | allow   or   famille | preview | deny
  footer line: not a chain · not money
  colors: #0a0a0a + gold stroke; green fill only on allow chip

#/docs — Stripe-style, phone first, bilingual
Sections: Quickstart · POST /attest · Errors · Badge · SDK · Verify for real
Errors:
  400 epsilon_zero   « ε = 0 est un mensonge »
  400 cents_nonzero  « cette app ne déplace pas d'argent »
  422 missing_bound  « sans bornes = classique »
  403 seal_expired   « HORIZON morte — re-press, fichier pas faux »
SDK block, copyable:
  import { attest } from '@famille/attest'
  const r = await attest({ source:'os', witness:'aucun', epsilon:'iid', horizon:'UFHY1' })
  document.body.insertAdjacentHTML('beforeend', r.svg)
Footer of docs: Juges ici = preview. Vérité = CLI
  git clone https://github.com/carllaliberte/unforge-check
  uses: carllaliberte/unforge-check@main

#/public — same three-act form, vulgarized labels only
  QUELLE  → D'où vient le bit
  TÉMOIN → Avec quelle force
  EPSILON → Marge d'erreur   (zéro = mensonge = deny)
  HORIZON → Fin de garantie du sceau
  RECU    → Reçu, pas un paiement
  MODE    → Classique par défaut
Toggle « termes techniques » reveals the rail names.
Do not dumb down the denies.

Do not add a token, a chain, a FAMILLE bot, Qiskit, Filon, Estoc.
Do not put a real signing key in the browser.
Republish on this same host only.
```
