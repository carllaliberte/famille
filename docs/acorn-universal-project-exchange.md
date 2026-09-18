# ACORN — UNIVERSAL PROJECT EXCHANGE

Les certitudes ont une date de fin.

Le client apporte une intention. Acorn compose un graphe de projet. Ce n'est pas une quittance. Ce n'est pas LIVE.

`compileIntentToReality` s'arrête à **COMPOSING**. C'est DEFINED. Ce n'est pas EXECUTED.

PAYMENT → AUTHORIZE → EXECUTE → DELIVER → MEASURE existent comme **fonctions explicites** (`pay`, `authorize`, `execute`, `deliver`, `measureValue`). Le compilateur ne les appelle pas. Un paiement observé n'autorise rien. Carl = MERGE.

## Lifecycle

Rail visé (fonctions, pas un run unique) :

INTAKE → QUALIFY → COMPOSE → SIMULATE → OFFER → ORDER → PAYMENT → AUTHORIZE → EXECUTE → VERIFY → DELIVER → MEASURE VALUE → LEARN → RENEW → EXPAND.

| Étape | Fonction | Qui l'appelle |
|---|---|---|
| INTAKE → COMPOSING | `compileIntentToReality` | le compilateur |
| SIMULATE / OFFER / ORDER | `simulate` `offer` `order` | appel explicite |
| PAYMENT | `pay` | observé seulement. Pas un virement. |
| AUTHORIZE | `authorize({ human_authorized: true })` | humain |
| EXECUTE / VERIFY / DELIVER | `execute` `verify` `deliver` | après authorize. États en mémoire. Pas un effet réel. |
| MEASURE / LEARN | `measureValue` `learn` | après coup. Pas LIVE VERIFIED. |

États `EXECUTING` et `DELIVERED` : posés seulement par `execute` / `deliver`. Jamais par le compilateur. `live` reste `false`.

The exchange can combine AI, humans, companies, data, software, tools, compute, machines, robotics, industrial resources, energy and other capabilities. Participants are discovered dynamically; no provider is the cognitive center.

## Economic principle

The customer buys an outcome. Acorn can construct the required project from available capabilities, estimate cost and value, and after a measured run record the result. That record is not LIVE VERIFIED. Carl remains the judge.

## Hard separation

PAYMENT ≠ AUTHORIZATION ≠ EXECUTION ≠ DELIVERY ≠ VALUE.

`pay()` sets `payment_observed: true` and `execution_authorized: false`.
`execute()` / `deliver()` throw `PAYMENT_IS_NOT_AUTHORIZATION` if only payment was observed.
`assertProjectConstitution` throws the same if `state === EXECUTING` with payment and no authorize.

Automatic spending, signatures, merge and authority escalation remain forbidden. Breaker remains untouched.

## Continuous loop

OBSERVE → INTENT → DISCOVER → QUALIFY → COMPOSE → SIMULATE → OFFER → AUTHORIZE → EXECUTE → MEASURE → LEARN → REUSE → NEW OPPORTUNITY.

DEFINED ≠ CODE VERIFIED ≠ TEST VERIFIED ≠ EXECUTED ≠ MEASURED ≠ LIVE VERIFIED.

Carte juge / epsilon / horizon absents ici → MODE classique. Pas comblé.
