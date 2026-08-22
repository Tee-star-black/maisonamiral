# Maison Amiral PayFast setup

The checkout is configured for PayFast Sandbox by default so the end-to-end flow can be tested before live credentials are added.

## Local / sandbox

No PayFast environment variables are required for the built-in PayFast public sandbox credentials.

For return and notify URLs to work from a deployed preview, set:

```env
NEXT_PUBLIC_SITE_URL=https://your-preview-or-production-domain.example
PAYFAST_SANDBOX=true
```

PayFast ITN notifications require a publicly accessible HTTPS URL. Localhost cannot receive PayFast ITNs unless it is exposed through a tunnel.

## Live payments

Set these environment variables in Vercel (or your production host):

```env
NEXT_PUBLIC_SITE_URL=https://maisonamiral.co.za
PAYFAST_SANDBOX=false
PAYFAST_MERCHANT_ID=your_live_merchant_id
PAYFAST_MERCHANT_KEY=your_live_merchant_key
PAYFAST_PASSPHRASE=your_live_security_passphrase
```

Never commit live merchant credentials or the passphrase to GitHub.

## Flow

1. Customer selects a product size.
2. The item is stored in the browser cart and persists across refreshes.
3. Customer can update quantity or remove products in `/cart`.
4. Customer enters contact and South African delivery details in `/checkout`.
5. `/api/payfast` validates the cart against the server-side catalogue and recalculates the total.
6. The server signs the PayFast payment request.
7. The customer is redirected to PayFast.
8. PayFast posts an ITN to `/api/payfast/notify`, where the signature and PayFast validation response are checked.
9. PayFast returns the customer to `/payment/success` or `/payment/cancel`.

## Production note

The current implementation validates PayFast ITNs but does not yet persist fulfilled orders in a production database. Before automated fulfilment or an admin order dashboard is added, connect the validated ITN to a durable database (for example Postgres) and store order/payment state there.
