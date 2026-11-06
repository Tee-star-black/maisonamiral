-- Can be applied independently of the store/order migrations.
-- Preserves any existing subscriber list. Only confirmed addresses are stored.
begin;
create table if not exists public.maison_subscribers (
  email text primary key,
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.maison_subscribers enable row level security;
revoke all on public.maison_subscribers from public, anon, authenticated;
grant select, insert, update, delete on public.maison_subscribers to service_role;
comment on table public.maison_subscribers is
  'Confirmed Maison Amiral drop subscribers; server-only access. Unsubscribe removes the row.';
commit;
