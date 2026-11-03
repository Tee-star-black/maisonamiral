# Maison Amiral | EFT checkout and Resend order notifications

The storefront supports three products: Automobile Tee, Guerrilla Tee and Emblem Tee.
The original product gallery, cart, size selection, homepage wheel/Philosophy and
More To Come newsletter remain in place.

## How checkout works

1. Customer chooses size/quantity and reviews the local cart.
2. Checkout collects the delivery address and shows the server-configured delivery charge.
3. POST /api/checkout validates products/prices and address; the server never trusts prices submitted by the browser.
4. A UUID order is written to the dedicated Supabase maison_orders table as `awaiting_payment`.
5. Two independent Resend messages are sent: a customer-facing EFT invoice and an internal order alert.
6. The page shows the reference and email delivery status. No EFT can be verified automatically by these messages.
7. Staff verify the payment in the bank account before marking an order paid and fulfilling it.

Customer and store-owner emails contain an HTML invoice with product line items,
ZAR total, payment reference, and configured bank details. This is not a PDF attachment.
Do not announce a PDF download until one is implemented.

## Setup (required before accepting any real orders)

- Use a separate Maison Supabase project/schema, not any healthcare data store.
- Apply both SQL files, in order:
  - `supabase/migrations/20261028_maison_store.sql`
  - `supabase/migrations/20261103_maison_eft_orders.sql`
- Copy `.env.example` to `.env.local`. Set the Supabase server URL and service-role key.
- Verify the actual merchant bank details and enter all `MAISON_BANK_*` values on the server.
- Configure the delivery fee in cents with explicit business approval. Zero means free delivery.
- Verify the Maison sending domain in Resend; configure server-only `RESEND_API_KEY`,
  `MAISON_RESEND_FROM`, and `MAISON_ORDER_EMAIL`.
- Deploy the environment variables through hosting secrets; never commit values.
- Check `GET /api/checkout` responds with `enabled:true` before attempting a test order.
- Place a test order using a safe test email address and inspect BOTH received emails,
  the order in Supabase, correct totals, statuses and branded reference.

Checkout stays disabled if any critical banking, Resend, database, or delivery
setting is missing. No Yoco key is required for EFT checkout. The old Yoco webhook
is left unused for backward compatibility with historical payment records.

## Important production limitations

- Emails are sent immediately via Resend. If either fails, the order remains saved
  with `notification_status=needs_attention` and server logs identify the order.
  A staff email-reconciliation workflow and retry queue are not yet implemented.
- Payment reconciliation and order status changes require a protected staff interface
  or server-side operations. There is no public 'mark paid' endpoint by design.
- The API uses browser session idempotency to prevent duplicate submissions
  during retries; production rate limiting and abuse monitoring must still be deployed.
- Stock checks, fulfilment dashboard, tax invoice/VAT details (if applicable),
  POPIA policies, backups, and email-delivery observability require business signoff.
- Never treat an EFT proof image or email acknowledgement as actual bank settlement.
- Existing order-status read route uses UUIDs; ensure no sensitive customer data
  is exposed through public responses.

## Run checks

```powershell
git fetch origin
git switch feat/eft-resend-checkout-20261103
npm ci
npm run lint
npm run build
npm run dev
```

Test mobile checkout, empty cart, quantity changes, server price validation,
missing settings, Resend failures, repeat submission, and confirmation display.

**Do not merge/deploy for real sales until migration, credentials, bank details,
delivery amount, email templates and operational reconciliation are verified.**
