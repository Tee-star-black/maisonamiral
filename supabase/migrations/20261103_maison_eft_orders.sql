-- Apply to the dedicated Maison Amiral Supabase database before activating EFT checkout.
-- Existing Yoco orders are left intact. No destructive migration.
alter table public.maison_orders drop constraint if exists maison_orders_status_check;
alter table public.maison_orders add constraint maison_orders_status_check
  check (status in ('pending','paid','failed','cancelled','awaiting_payment','processing','shipped','completed'));
alter table public.maison_orders
  add column if not exists notification_status text not null default 'pending';
alter table public.maison_orders drop constraint if exists maison_orders_notification_status_check;
alter table public.maison_orders add constraint maison_orders_notification_status_check
  check (notification_status in ('pending','sent','needs_attention'));
create index if not exists maison_orders_awaiting_payment_idx
  on public.maison_orders(created_at desc) where status = 'awaiting_payment';
-- An authenticated back-office process must confirm real bank receipt.
-- Never set status='paid' from a customer redirect, email delivery or uploaded proof alone.
