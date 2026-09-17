# Breaker survival — same Breaker, two paths

NOT a second Breaker. Not a second security system. Not Cortex-optimizable.

The kernel remains [`.github/swarm/system-breaker.mjs`](.github/swarm/system-breaker.mjs).
This contract is the **survival policy** of that kernel.

```
HUMAN PATH
  CARL → BREAKER → CUT

SURVIVAL PATH
  ACORN → DETECT → ASSESS → REQUEST → BREAKER POLICY → CUT / ISOLATE
```

```
ACORN MAY REQUEST SURVIVAL
ACORN MAY NOT REDEFINE SURVIVAL
DETECTION ≠ AUTHORITY
CAPABILITY ≠ AUTHORITY
NETWORK IS OPTIONAL FOR SURVIVAL
```

Carl remains human authority. The Breaker remains the survival boundary.
Acorn remains the cognitive center. Connector / Flux remains the membrane.

## Levels

`NORMAL` `WATCH` `CONTAIN` `ISOLATE` `HARD_CUT` `SURVIVAL_MODE`

Hard Cut stops exposure and preserves trusted state. It does not mean
destroy Acorn. Carl always keeps a recovery path (**ANTI-LOCKOUT**).

Missing `ACORN_SYSTEM_MODE` is fail-closed `OFF`. Never assumed open.

## Honest states

A survival action is `DEFINED`, `IMPLEMENTED`, `TESTED`, `MEASURED`,
`VERIFIED`, `HOLD_HUMAN`, or `BLOCKED`. Never `LIVE` without proof.

Real network unplug of production hosts is `BLOCKED — HUMAN ACTION REQUIRED`.
Local fail-closed cut (Breaker OFF + Connector external cut) is **MEASURED**.

Compromised data is never automatic learning. Rebuild from last verified
state. Verify before reconnecting.

## Runtime

```bash
node scripts/acorn-survival-policy.mjs
```

Prints an honest view: Carl can cut, Cortex cannot, Acorn may request,
policy may cut, lockout denied, compromised data not learned, attack
simulations A–H. No LIVE badge.

`MERGE = CARL` · `AUTO_MERGE = FALSE` · `MAIN = REALITY`
