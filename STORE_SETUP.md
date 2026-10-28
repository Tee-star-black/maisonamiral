# Maison Amiral: shop, cart, checkout and release updates

This branch implements a three-product online storefront for:
- Automobile Tee
- Guerrilla Tee
- Emblem Tee

Each item is R450 based on the existing Maison product catalogue. Flag Staple is removed.
The original JPEGs in /public are used in the shop, catalogue and slideshow.

## What works without external configuration

- Shared navigation on all pages, ship insignia in the middle of the header.
- /shop, /collections, /lookbook, /journal and /contact are separate routes.
- Reactive Cart (number of items) in the nav.
- Product-size selection (S, M, L, XL), quantity, add/remove, persisted cart.
- /cart subtotals and /checkout customer and South African delivery address form.
- Synchronized auto-advancing Edition 001 slideshow.
- Pure-white page background; no cream sections.
- More To Come: accessible email form and explicit marketing consent.
- The existing field archive and ship artwork remain in the homepage.

## Activate order and email storage

Create a *separate Maison Amiral* Supabase project or dedicated schema as appropriate.
Do not borrow a database from TeleDoctorSA or another product.

Run \`supabase/migrations/20261028_maison_store.sql\` in its SQL editor.
This creates two private RLS-enabled tables: \`maison_orders\` and
\`maison_subscribers\`. The app uses only the server-side service role.
Never expose the service-role key in frontend code or NEXT_PUBLIC variables.

Copy \`.env.example\` to \`.env.local\`. Set:
- \`MAISON_SUPABASE_URL\`: the Maison Supabase project URL.
- \`MAISON_SUPABASE_SERVICE_ROLE_KEY\`: server-only service-role key.
- \`MAISON_DELIVERY_FEE_CENTS\`: a business-approved delivery fee, in ZAR cents.
  0 is only appropriate if the business explicitly authorizes free delivery.
- \`MAISON_SITE_URL\`: the origin serving the store. Use https for live hosting.

The "Notify Me" form writes consented email addresses to
\`maison_subscribers\`. A separate mailing platform/campaign workflow will
be required to *send* future campaign emails. The form does not pretend
to send releases by itself.

## Activate online payments

Maison Amiral is designed for Yoco's hosted Checkout API.
1. Verify the production domain in the Yoco business account.
2. Enable the Checkout API and get **test** secret key (not the client/public key).
3. Register an HTTPS webhook pointing to
   \`https://www.maisonamiral.co.za/api/yoco/webhook\`.
4. Save the webhook signing secret from registration.
5. Configure server-only \`YOCO_SECRET_KEY\` and \`YOCO_WEBHOOK_SECRET\`.
6. Verify the configured delivery charge, then enable payment for testing.
7. Complete end-to-end sandbox tests, including duplicate webhook events,
   failed/cancelled payments, valid signature, wrong signature, amounts,
   and order persistence. Move to live keys only after the business approves.

The checkout recalculates trusted prices from the server product catalogue.
Orders are saved with pending status before redirecting to the Yoco-hosted page.
Only the HMAC-validated \`payment.succeeded\` webhook may mark an order paid.
The return page polls stored order status and never treats a redirect as proof
of payment. Payment returns do not leak contact or delivery details.

**Do not deploy or accept real customer payments until the credentials,
confirmed delivery fee, webhook, test runs and fulfilment process have all
been verified.** A functioning cart UI alone does not mean a live store is ready.

## Operations remaining before taking live orders

- Confirm sizing, stock levels and policies for the three items.
- Confirm delivery provider, prices, courier integration and dispatch SLAs.
- Add internal order management/fulfilment operations, packing, tracking
  notifications and customer receipts.
- Confirm stock reservation to avoid overselling.
- Confirm POPIA privacy text and newsletter unsubscribe mechanism.
- Add production rate limiting, monitoring, error alerts and backups.
- Sign off payment, refund, tax and shipping compliance with the merchant.

## Local work

\`\`\`powershell
git switch feat/maison-authentic-product-imagery-20261027
git pull origin feat/maison-authentic-product-imagery-20261027
npm ci
npm run dev
\`\`\`

Inspect \`/shop\`, \`/shop/automobile-tee\`, \`/cart\`, \`/checkout\`, \`/collections\`,
and the homepage. Run \`npm run lint\` and \`npm run build\` before merging.
No production deployment is part of this change.
