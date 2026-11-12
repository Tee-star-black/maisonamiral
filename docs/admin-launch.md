# Maison Amiral store management

The dashboard is at `/admin` in the existing Next.js application. It uses the existing Maison Amiral Supabase project and Resend account. The public shop keeps its current catalogue until `MAISON_CATALOGUE_ENABLED=true` is set and the application is redeployed.

## Activate

1. Apply `supabase/migrations/20261112110000_client_admin.sql` to the Maison Amiral project (`muhaytmijxxvhbeneoyn`), then `20261112110100_seed_catalogue.sql`. These add new tables and functions and preserve existing orders/subscribers. The migrations are not repeatable; use migration history.
2. Provision the client's email in Supabase Auth with a strong temporary password. Confirm the identity through your normal handover process. There is no public admin registration. For an existing confirmed user, grant access with the parameterized equivalent of:

   ```sql
   insert into public.maison_admins(user_id, role)
   select id, 'owner' from auth.users where email = 'CLIENT_EMAIL';
   ```

   `viewer` accounts can inspect records but cannot change products, orders or subscribers. The client must enrol a TOTP authenticator on first login. Resetting a lost authenticator is a verified administrator operation in Supabase, not a public dashboard action. Password recovery is handled through Supabase administration in this release.

3. Set real stock counts through the dashboard. Seed stock starts at **zero**; it is not an estimate of the client's inventory. Review price, images and publication status. Product slugs are permanent once created.
4. Keep existing server variables: `MAISON_SUPABASE_URL`, `MAISON_SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `MAISON_RESEND_FROM` and EFT bank settings. Never use `NEXT_PUBLIC_` for a privileged key.
5. Set `MAISON_SITE_ORIGIN` to the exact dashboard origin, without a trailing slash. Use a separate value for preview deployments. Set `MAISON_CATALOGUE_ENABLED=true` only after the migration, product review and stock entry are complete; redeploy. Shop pages, search, collections, sitemap, cart and checkout use the database catalogue. Turning the flag off restores the original catalogue; it does not undo orders or stock movements.
6. Add a Resend webhook at `https://www.maisonamiral.co.za/api/webhooks/resend`. Subscribe to sent/delivered/delayed/bounced/failed/complained and received events supported by the account. Put the endpoint's signature secret in `RESEND_WEBHOOK_SECRET`. Verify with Resend test events, then a controlled order to a consented test address. Do not test by emailing real customers.
7. To capture replies, configure Resend Receiving on a dedicated email subdomain. Set `MAISON_REPLY_TO` to the receiving address and redeploy. Preserve the existing Gmail and support mailbox DNS. Sending events do not import the Gmail inbox. Inbound messages are displayed as plain text; attachments are not opened by this release.
8. Test the complete owner login/MFA → upload → draft → publish → shop → cart → EFT order → email → payment confirmation → dispatch workflow in a preview environment, with test data. Verify viewer/unauthorised access and logout revocation. Then deploy the reviewed branch through the normal Vercel flow.

## Operational behaviour

- Sessions use HttpOnly, SameSite=Strict cookies; production cookies use Secure and the `__Host-` prefix. Each API read verifies the Supabase user, active session, staff membership and MFA. Owner writes additionally check the request origin and a database-backed rate limit.
- All operational tables have RLS enabled, with access revoked from public/anonymous/authenticated roles. The application server performs authorised operations with its server-only key. RPCs are service-only. Storage has no browser upload policy; photographs are uploaded through the authorised server route. The product-image bucket is public by design.
- Uploads are bounded to 8 MB/40 megapixels, decoded, rotated, resized and re-encoded as WebP. Original metadata is stripped. Only JPEG, PNG and WebP inputs are accepted. SVG uploads are rejected. Removing an image detaches it from a product; it does not delete its stored file. Orphan-file cleanup is an administrator maintenance task.
- EFT orders begin awaiting payment. Unpaid orders do not reserve stock. Payment confirmation requires a bank-receipt acknowledgement, locks stock rows in a consistent order, checks quantities and deducts stock atomically. A repeated confirmation is rejected. Shipped orders require a courier/tracking reference. Paid-order cancellations, refunds and returns require a separate reconciliation workflow; this dashboard does not invent a refund or restock.
- Product updates reject stale editor versions, so an open stock form cannot overwrite stock deducted by a payment confirmation. The client can archive a product instead of deleting historical order data.
- Order changes, product saves and manual subscriber removals create audit records. Confirmed subscriber signup and public unsubscribe retain the established newsletter flow; the active list does not include pending/unsubscribed addresses. This release manages the list; it does not provide a bulk campaign sender or recurring paid subscriptions.
- Overview revenue includes paid/processing/shipped/completed orders. Pending EFT orders are excluded. Figures are lifetime totals, not an accounting ledger.
- Signed Resend events are deduplicated by event ID. Invoice IDs link outbound events to orders. Received-email content is retrieved server-side, shown as text and limited to 30,000 characters. No HTML from customer emails is rendered.
- Owners and viewers see order contact and delivery details. Audit and email content require the same MFA-protected access. Configure backup, retention and account ownership in the client's Supabase/Vercel/Resend accounts before handover; these operational policies are not created by the application.

## Validation and current limits

Run `npm test`, `npx tsc --noEmit`, `npm run build`, and `npm audit --omit=dev --audit-level=high`.

Security tests include real PostgreSQL execution via PGlite for migration validity, RPC grants, denied anonymous table access, stale product saves, status transitions, transactional stock deductions and rate limits. API tests cover missing/revoked sessions, MFA, staff permissions, cross-origin writes and chunked body limits. Existing checkout retry, invoice recipient and delivery tests remain in place.

The hosted Supabase migration confirmation expired during this build; no live schema activation was completed. The managed preview launcher passed Vite-only options to Next.js, so browser QA was unavailable in this session. Automated checks do not establish live end-to-end verification. Complete the preview workflow above before client handover.
