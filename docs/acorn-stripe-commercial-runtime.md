# ACORN — Stripe × commercial runtime

Les certitudes ont une date de fin.

Stripe is a replaceable payment rail. It is not Acorn's authority and not a receipt.

## Truth

DEFINED ≠ CODE_PRESENT ≠ TESTED ≠ EXECUTED ≠ MEASURED ≠ VERIFIED ≠ LIVE.

Test Stripe ≠ Live Stripe. Checkout ≠ payment. Webhook ≠ verified receipt. Preview ≠ receipt. HTTP 200 is not a seal. ε=0 remains invalid.

## Boundary

- Adapter: `scripts/acorn-stripe-adapter.mjs`
- Journey: `scripts/acorn-commercial-runtime.mjs`
- Durable store: `live/commerce-store.mjs` + migration `0004_commerce`
- HTTP: `/api/v1/commerce/*` and `POST /webhooks/stripe`

Prices come from the server catalog (`STRIPE_CATALOG_PRICES`). Browser amounts are rejected.

## Modes

| Mode | Meaning |
|---|---|
| unconfigured | Stripe channel not present. Domain still works. |
| test | Test secret only. No live money. |
| hold_live | Live secret present, `STRIPE_LIVE_ENABLED` not set. HOLD_HUMAN. |
| live | Live enabled **and** Carl server authority. Still not a LIVE claim. |

This chantier creates no Live products, prices, subscriptions or invoices.

## Customer path

PROSPECT → CUSTOMER → DEMAND → QUALIFICATION → PROJECT → OFFER → ORDER → PAYMENT → EXECUTION → DELIVERY → VALUE → RENEWAL/EXPANSION

An offer has identity, version, currency, server price source, terms and usage rights.

## Authority

MONEY / REFUND / PRICE_CHANGE / PAYOUT / CONTRACT / WRITE / DELETE / PUBLISH / SIGN / MERGE stay server-controlled and human-governed. An AI cannot create a financial or legal commitment. HTTP `human_authorized` is ignored.

## HOLD_HUMAN remaining

- Live Stripe enablement (`STRIPE_LIVE_ENABLED=1`) and live keys — Carl only
- Live product/price/subscription/invoice creation
- Refunds and payouts as money movement
- Real money movement
- Merge

Carl squash/merge only. No auto-merge. No PRÉSENT.
