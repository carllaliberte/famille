# Acorn commercial runtime × Stripe

Stripe is a financial rail. Acorn remains the cognitive, operational and economic brain.

DEFINED ≠ CODE_PRESENT ≠ TESTED ≠ EXECUTED ≠ MEASURED ≠ VERIFIED ≠ LIVE

This document does not claim LIVE, PAID, CONNECTED, DEPLOYED, or VERIFIED without corresponding independent evidence.

## Architecture

```
Acorn domain (commercial runtime, market engine, ledger, usage rights)
        ↓
Financial rail adapter (replaceable)
        ↓
Stripe
```

No Stripe call lives in domain code. Future rails implement the same adapter contract.

## Cycle

PROSPECT → CUSTOMER → DEMAND → QUALIFICATION → PROJECT → CAPABILITY MATCHING
→ OFFER → ORDER → CHECKOUT → PAYMENT_OBSERVED → EXECUTION HOLD → DELIVERY
→ VALUE → RENEWAL → EXPANSION → LEARNING

Payment observed ≠ execution authorized. Capability ≠ authority. Carl remains human authority.

## Env

| Variable | Role |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe secret. `sk_test_` = TEST. `sk_live_` = LIVE_KEY_PRESENT, not Acorn LIVE. |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret. Missing secret ⇒ signatures fail closed. |
| `ACORN_PUBLIC_URL` | Origin used to control success/cancel URLs. |
| `ACORN_FINANCIAL_RAIL` | Default `stripe`. Unknown rails fail closed. |
| `ACORN_HUMAN_AUTHORITY_TOKEN` | Required header `x-acorn-human-authority` for refund/quote. Client `human_authorized=true` is ignored. |

## HTTP

Unauthenticated:

- `POST /api/v1/billing/webhook` — raw body, Stripe signature, idempotent event id
- `GET /pay/success` and `GET /pay/cancel` — not receipts

Authenticated:

- `GET /api/v1/catalog`
- `POST /api/v1/orders` — server locks amount/currency
- `POST /api/v1/checkout`
- `POST /api/v1/billing/portal` — Stripe portal is not Acorn authority
- `POST /api/v1/billing/refund` — human token only
- `POST /api/v1/quotes` / `POST /api/v1/invoices` — human hold, AI cannot sign
- `POST /api/v1/usage` — usage abstraction; metered billing not activated
- `GET /api/v1/billing` — rail truth. Portal is not authority.
- `GET /api/v1/ledger` — ASSERTED/OBSERVED/MEASURED/VERIFIED
- `GET /api/v1/usage-rights`
- `GET /api/v1/developer`
- `GET /api/v1/commercial`

## Pricing

Server catalog `acorn.price.v1`. The browser cannot choose the amount. Silent price changes are forbidden.

Models prepared: one-time turnkey, monthly subscription, enterprise quote (human hold), usage-based abstraction (metered billing not activated).

## Ledger

Gross, currency, Stripe ids, order/project/customer, timestamp, observed fees.

Net only when gross and fees are both present. Taxes only when present. Missing is not 0. No tax or accounting advice.

## Truth

- Preview ≠ receipt
- Checkout created ≠ payment received
- Test Stripe ≠ Stripe Live
- `sk_live_` present ≠ Acorn LIVE
- Stripe `livemode=true` ≠ Acorn LIVE
- Payment observed ≠ execution authority

## HOLD HUMAN

Merge, Stripe Live product/price/webhook endpoint, refunds, enterprise quotes/contracts, payouts, transfers, real-money tests.

`EXTERNAL_DEPLOYMENT_EVIDENCE = NOT_OBSERVED`
`RENDER_EXTERNAL_DEPLOYMENT = NOT_MEASURED`
`STRIPE_LIVE = NOT_CONFIGURED_HERE`
