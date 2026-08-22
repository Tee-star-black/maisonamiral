# Maison Amiral EFT order setup

The storefront uses a manual EFT workflow. No payment gateway is required.

## Customer flow

1. Customer selects a tee and size.
2. The selection is stored in the persistent browser cart.
3. Customer enters contact and South African delivery details at `/checkout`.
4. `/api/orders` validates every cart item against the server-side catalogue and recalculates the total.
5. A unique order reference such as `MA-8A31F0C2` is generated.
6. The customer receives an invoice-style email containing the order, total, delivery details, bank details, and payment reference.
7. The owner receives a matching new-order notification.
8. The customer completes an EFT using the exact Maison Amiral order reference.

## Environment variables

Configure these only in Vercel / the production environment. Do not commit banking details or email credentials to GitHub.

```env
RESEND_API_KEY=your_resend_api_key
ORDER_FROM_EMAIL=Maison Amiral <orders@maisonamiral.co.za>
OWNER_ORDER_EMAIL=orders@maisonamiral.co.za

BANK_NAME=Your bank
BANK_ACCOUNT_NAME=Your account holder name
BANK_ACCOUNT_NUMBER=Your account number
BANK_ACCOUNT_TYPE=Your account type
BANK_BRANCH_CODE=Your universal or branch code
```

`ORDER_FROM_EMAIL` must use a sender/domain accepted by the configured email provider.

## Production note

The order emails and references are functional, but orders are not yet persisted to a production database. A database-backed order ledger should be added before introducing automated fulfilment, payment matching, stock deduction, or an owner order dashboard.
