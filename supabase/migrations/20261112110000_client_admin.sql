begin;
create table public.maison_admins(user_id uuid primary key references auth.users(id),role text not null check(role in ('owner','viewer')),active boolean not null default true,created_at timestamptz not null default now());
create table public.maison_products(slug text primary key,data jsonb not null,status text not null check(status in ('draft','published','archived')),stock jsonb not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.maison_audit(id uuid primary key default gen_random_uuid(),actor uuid references auth.users(id),action text not null,target text not null,details jsonb not null default '{}',created_at timestamptz not null default now());
create table public.maison_email_events(id text primary key,event_type text not null,email_id text,recipient text,sender text,subject text,body_text text,order_id uuid references public.maison_orders(id),created_at timestamptz not null default now());
create table public.maison_rate_limits(key text primary key,window_start timestamptz not null,hits integer not null);
alter table public.maison_orders add column if not exists tracking text;
create index on public.maison_rate_limits(window_start);
create index on public.maison_products(status,created_at);
create index on public.maison_email_events(created_at desc);
create index on public.maison_audit(created_at desc);
alter table public.maison_admins enable row level security;
alter table public.maison_products enable row level security;
alter table public.maison_audit enable row level security;
alter table public.maison_email_events enable row level security;
alter table public.maison_rate_limits enable row level security;
revoke all on public.maison_admins,public.maison_products,public.maison_audit,public.maison_email_events,public.maison_rate_limits from public,anon,authenticated;
grant all on public.maison_admins,public.maison_products,public.maison_audit,public.maison_email_events,public.maison_rate_limits to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('maison-products','maison-products',true,8388608,array['image/webp']) on conflict(id) do nothing;
-- Service-only functions. No anonymous or authenticated RPC privileges.
create function public.maison_session_active(p_session uuid,p_user uuid) returns boolean language sql security definer set search_path='' as $$select exists(select 1 from auth.sessions where id=p_session and user_id=p_user and (not_after is null or not_after>now()))$$;
create function public.maison_rate_limit(p_key text,p_limit integer) returns boolean language plpgsql set search_path='' as $$declare n integer;begin
delete from public.maison_rate_limits where window_start<now()-interval '1 day';
insert into public.maison_rate_limits values(p_key,date_trunc('minute',now()),1) on conflict(key) do update set hits=case when maison_rate_limits.window_start<date_trunc('minute',now()) then 1 else maison_rate_limits.hits+1 end,window_start=date_trunc('minute',now()) returning hits into n;
return n<=p_limit;end$$;
create function public.maison_save_product(p_actor uuid,p_data jsonb) returns jsonb language plpgsql set search_path='' as $$declare current_version timestamptz;begin
if not exists(select 1 from public.maison_admins where user_id=p_actor and active and role='owner') then raise exception 'Forbidden';end if;
select updated_at into current_version from public.maison_products where slug=p_data->>'slug' for update;
if found and (p_data->>'expectedUpdatedAt' is null or current_version<>(p_data->>'expectedUpdatedAt')::timestamptz) then raise exception 'Product changed. Refresh before saving';end if;
insert into public.maison_products(slug,data,status,stock) values(p_data->>'slug',p_data-'status'-'stock'-'expectedUpdatedAt',p_data->>'status',p_data->'stock') on conflict(slug) do update set data=excluded.data,status=excluded.status,stock=excluded.stock,updated_at=now();
insert into public.maison_audit(actor,action,target,details) values(p_actor,'product.saved',p_data->>'slug',jsonb_build_object('status',p_data->>'status'));
return jsonb_build_object('ok',true);end$$;
create function public.maison_transition_order(p_actor uuid,p_id uuid,p_from text,p_status text,p_tracking text) returns jsonb language plpgsql set search_path='' as $$declare o public.maison_orders;item jsonb;remaining integer;begin
if not exists(select 1 from public.maison_admins where user_id=p_actor and active and role='owner') then raise exception 'Forbidden';end if;
select * into o from public.maison_orders where id=p_id for update;
if not found or o.status<>p_from then raise exception 'Order changed';end if;
if not ((p_from in ('awaiting_payment','pending') and p_status in ('paid','cancelled')) or (p_from='paid' and p_status='processing') or (p_from='processing' and p_status='shipped' and length(trim(p_tracking))>0) or (p_from='shipped' and p_status='completed')) then raise exception 'Invalid transition';end if;
if p_status='paid' then
-- Lock products in stable order so concurrent payment confirmation cannot oversell.
perform slug from public.maison_products where slug in(select v->>'slug' from jsonb_array_elements(o.items) v) order by slug for update;
for item in select * from jsonb_array_elements(o.items) loop
select (stock->>(item->>'size'))::integer into remaining from public.maison_products where slug=item->>'slug';
if remaining is null or remaining<(item->>'quantity')::integer then raise exception 'Insufficient stock';end if;
update public.maison_products set stock=jsonb_set(stock,array[item->>'size'],to_jsonb(remaining-(item->>'quantity')::integer)),updated_at=now() where slug=item->>'slug';end loop;end if;
update public.maison_orders set status=p_status,tracking=coalesce(p_tracking,tracking),updated_at=now() where id=p_id;
insert into public.maison_audit(actor,action,target,details) values(p_actor,'order.status',p_id::text,jsonb_build_object('from',p_from,'to',p_status,'tracking',p_tracking));return jsonb_build_object('ok',true);end$$;
create function public.maison_remove_subscriber(p_actor uuid,p_email text) returns void language plpgsql set search_path='' as $$begin
if not exists(select 1 from public.maison_admins where user_id=p_actor and active and role='owner') then raise exception 'Forbidden';end if;
delete from public.maison_subscribers where email=p_email;
insert into public.maison_audit(actor,action,target) values(p_actor,'subscriber.removed',p_email);end$$;
revoke all on function public.maison_session_active(uuid,uuid),public.maison_rate_limit(text,integer),public.maison_save_product(uuid,jsonb),public.maison_transition_order(uuid,uuid,text,text,text),public.maison_remove_subscriber(uuid,text) from public,anon,authenticated;
grant execute on function public.maison_session_active(uuid,uuid),public.maison_rate_limit(text,integer),public.maison_save_product(uuid,jsonb),public.maison_transition_order(uuid,uuid,text,text,text),public.maison_remove_subscriber(uuid,text) to service_role;
create function public.maison_overview() returns jsonb language sql set search_path='' as $$select jsonb_build_object('paid_cents',(select coalesce(sum(total_cents),0) from public.maison_orders where status in ('paid','processing','shipped','completed')),'awaiting',(select count(*) from public.maison_orders where status='awaiting_payment'),'low_stock',(select count(*) from public.maison_products p where status='published' and exists(select 1 from jsonb_each_text(p.stock) v where v.value::integer<5)))$$;
revoke all on function public.maison_overview() from public,anon,authenticated;
grant execute on function public.maison_overview() to service_role;
commit;
