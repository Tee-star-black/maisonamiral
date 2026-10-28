-- Maison Amiral | storefront persistence.
-- Run in the intended Maison Amiral Supabase project, not a different app's database.
-- Only server-side service-role requests access these tables.
create table if not exists public.maison_orders (
  id uuid primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending','paid','failed','cancelled')),
  yoco_checkout_id text unique,
  yoco_payment_id text,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  suburb text not null default '',
  city text not null,
  province text not null,
  postal_code text not null,
  items jsonb not null,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  delivery_cents integer not null check (delivery_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'ZAR' check (currency = 'ZAR')
);
create index if not exists maison_orders_email_created_idx
  on public.maison_orders(email, created_at desc);

create table if not exists public.maison_subscribers (
  email text primary key,
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.maison_orders enable row level security;
alter table public.maison_subscribers enable row level security;

revoke all on public.maison_orders from anon, authenticated;
revoke all on public.maison_subscribers from anon, authenticated;
-- Do not add public SELECT or INSERT policies; server-only operations use service role.
