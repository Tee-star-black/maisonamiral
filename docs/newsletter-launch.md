# Maison Amiral / Next-drop mailing workflow

## What has been implemented

- Newsletter form with required consent and a honeypot.
- POST /api/newsletter sends a Resend confirmation email, but does **not** save an unverified signup.
- Confirmation button submits a signed, 48-hour token to POST /api/newsletter/confirm.
- Confirmed email and consent date are stored in Supabase maison_subscribers (unique email).
- Unsubscribe button submits a signed unsubscribe token to POST /api/newsletter/unsubscribe, which deletes the entry.
- Authorized CSV export exposes confirmed addresses and personalized unsubscribe URLs to the store operator.
- No automated marketing campaign is sent merely because someone joins.

## Required hosting environment

- MAISON_SUPABASE_URL: existing Supabase project URL.
- MAISON_SUPABASE_SERVICE_ROLE_KEY: server-only Supabase service role key, never NEXT_PUBLIC.
- RESEND_API_KEY: Resend key with permission to send from verified sender domain.
- MAISON_RESEND_FROM: e.g. Maison Amiral <updates@maisonamiral.co.za>, verified in Resend.
- MAISON_NEWSLETTER_SECRET: 32+ character randomly generated private signing secret; keep stable across deployments.
- MAISON_NEWSLETTER_ADMIN_TOKEN: a different 32+ character random secret, used for owner CSV export.
- NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION: Google Search Console HTML verification content, optional until ownership is verified.

Generate secrets locally with Node:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

## Independent subscriber database setup

Apply `supabase/migrations/20261106_newsletter_standalone.sql` in the dedicated Maison Amiral Supabase project. It can run without the order tables, preserves existing subscribers, enables RLS, revokes public access and grants only the server service role access. Add `MAISON_SUPABASE_URL` and `MAISON_SUPABASE_SERVICE_ROLE_KEY` to the Vercel production environment, then redeploy. Never use credentials belonging to another application.

The signup success panel is shown only after the confirmation-email API succeeds. It says to check the inbox; the address joins the database only after confirmation. Motion is disabled for reduced-motion preferences.

## Supabase table requirement

Existing maison_subscribers table must have at least:
- email text PRIMARY KEY (or UNIQUE NOT NULL)
- consent_at timestamptz NOT NULL

The database service role must be able to SELECT, INSERT/upsert and DELETE.
Do not run destructive migrations against existing lists without a backup.

Example for a fresh installation:

CREATE TABLE IF NOT EXISTS public.maison_subscribers (
  email text PRIMARY KEY,
  consent_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.maison_subscribers ENABLE ROW LEVEL SECURITY;

Only the server's service-role credential accesses this table.

## Test checklist

1. Request a subscription with valid email and consent; verify 200 and confirmation email delivered.
2. Confirm subscription link; verify database row exists only after clicking Confirm.
3. Confirm again; ensure upsert is idempotent.
4. Attempt expired or modified token; expect 400.
5. Check empty consent and malformed email; expect 400.
6. Use authorized CSV export; check only consented emails exist.
7. Follow a personalized unsubscribe link; click Unsubscribe; verify row removed.
8. Export again; verify unsubscribed address absent.
9. Verify /newsletter/* routes have noindex and are excluded from sitemap.
10. Rate-limit /api/newsletter at the CDN/hosting layer (required before public marketing).

## Send the next release

1. Export the current confirmed list over HTTPS with Authorization: Bearer $MAISON_NEWSLETTER_ADMIN_TOKEN.
2. Import confirmed subscribers into your Resend audience/broadcast tool. Map unsubscribe_url as a per-contact field or generate unique unsubscribe links using the same signed-token service. Do not send a single shared unsubscribe URL.
3. Create a drop campaign with clear sender identity, collection imagery, subject and physical/business contact info. Include each subscriber's personalized unsubscribe URL.
4. Send a test to an internal address, check links and render on mobile, then schedule/send via your email platform. Respect unsubscribes in the export and refresh the audience immediately before each send.
5. Keep delivery logs, handle bounces/complaints, and periodically audit suppression lists.

Important: This repository does not yet contain a background campaign scheduler or a built-in audience dashboard. Sending a broadcast still uses Resend (or another chosen email marketing service).
